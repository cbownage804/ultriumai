/**
 * Vite Cloud Sandbox Server — Hardened v3 (8GB / 4 vCPU)
 * 
 * Capacity: 20 concurrent builds, 15 queued, 8 warm dirs
 * Memory guard: 6.5GB threshold (8GB droplet)
 * Install concurrency: 3 simultaneous npm installs
 * 
 * Hardening:
 * - Warm build cache (pre-created build dirs)
 * - Symlinks node_modules from template (fast setup)
 * - Copies node_modules when installPackages needed (safe mutation)
 * - Uses direct vite binary (no npx overhead)
 * - Kills zombie processes on timeout
 * - FIFO build queue when at capacity
 * - Better error extraction from Vite stderr
 * - Graceful shutdown with SIGTERM/SIGINT handlers
 * - Memory guard (503 when RSS > 6.5GB)
 * - Install concurrency limiter (3 at a time)
 * - Stale build dir cleanup (periodic)
 * - Request deduplication via payload hash
 */

import express from 'express';
import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { randomUUID, createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, 'template');
const BUILDS_DIR = path.join(__dirname, 'builds');
const WARM_DIR = path.join(__dirname, 'warm');
const PORT = process.env.PORT || 3100;
const AUTH_TOKEN = process.env.SANDBOX_AUTH_TOKEN || '';
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '20', 10);
const BUILD_TIMEOUT_MS = parseInt(process.env.BUILD_TIMEOUT_MS || '30000', 10);
const MAX_QUEUED = parseInt(process.env.MAX_QUEUED || '15', 10);
const QUEUE_TIMEOUT_MS = parseInt(process.env.QUEUE_TIMEOUT_MS || '10000', 10);
const INSTALL_TIMEOUT_MS = parseInt(process.env.INSTALL_TIMEOUT_MS || '15000', 10);
const MEMORY_LIMIT_MB = parseInt(process.env.MEMORY_LIMIT_MB || '6500', 10);
const WARM_POOL_SIZE = parseInt(process.env.WARM_POOL_SIZE || '8', 10);
const STALE_DIR_MAX_AGE_MS = 60_000;

let activeBuildCount = 0;
let isShuttingDown = false;

// ── Track active child processes for shutdown ──
const activeChildProcesses = new Set();

// ── Install concurrency limiter (3 at a time for 8GB RAM) ──
let installInFlight = 0;
const MAX_INSTALL_CONCURRENT = 3;
const installQueue = [];

function acquireInstallSlot() {
  return new Promise((resolve) => {
    if (!installInFlight) {
      installInFlight = true;
      resolve();
      return;
    }
    installQueue.push(resolve);
  });
}

function releaseInstallSlot() {
  installInFlight = false;
  if (installQueue.length > 0) {
    installInFlight = true;
    const next = installQueue.shift();
    next();
  }
}

// ── Request deduplication ──
const inflightBuilds = new Map(); // hash → Promise<result>

function hashPayload(files) {
  const h = createHash('md5');
  for (const f of files) {
    h.update(f.path);
    h.update(f.content);
  }
  return h.digest('hex');
}

// ── FIFO Build Queue ──
const buildQueue = [];

function processQueue() {
  while (buildQueue.length > 0 && activeBuildCount < MAX_CONCURRENT) {
    const next = buildQueue.shift();
    if (next && !next.timedOut) {
      next.resolve();
    }
  }
}

function waitForSlot() {
  return new Promise((resolve, reject) => {
    if (activeBuildCount < MAX_CONCURRENT) {
      resolve();
      return;
    }
    if (buildQueue.length >= MAX_QUEUED) {
      reject(new Error('Queue full'));
      return;
    }
    const entry = { resolve, timedOut: false };
    buildQueue.push(entry);
    const timer = setTimeout(() => {
      entry.timedOut = true;
      const idx = buildQueue.indexOf(entry);
      if (idx >= 0) buildQueue.splice(idx, 1);
      reject(new Error('Queue timeout'));
    }, QUEUE_TIMEOUT_MS);
    const origResolve = entry.resolve;
    entry.resolve = () => {
      clearTimeout(timer);
      origResolve();
    };
  });
}

// ── Warm build cache ──
const warmPool = [];

function createWarmDir() {
  const id = randomUUID();
  const dir = path.join(WARM_DIR, id);
  try {
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    for (const cf of CONFIG_FILES) {
      const src = path.join(TEMPLATE_DIR, cf);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(dir, cf));
      }
    }
    const templateNodeModules = path.join(TEMPLATE_DIR, 'node_modules');
    fs.symlinkSync(templateNodeModules, path.join(dir, 'node_modules'), 'junction');
    return dir;
  } catch (err) {
    console.warn(`[Warm] Failed to create warm dir ${id}:`, err.message);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    return null;
  }
}

function refillWarmPool() {
  while (warmPool.length < WARM_POOL_SIZE) {
    const dir = createWarmDir();
    if (dir) {
      warmPool.push(dir);
    } else {
      break;
    }
  }
}

function takeWarmDir() {
  if (warmPool.length > 0) {
    const dir = warmPool.shift();
    // Refill async
    setTimeout(refillWarmPool, 0);
    return dir;
  }
  return null;
}

// ── Config files to copy from template (NOT node_modules) ──
const CONFIG_FILES = [
  'package.json', 'tsconfig.json', 'vite.config.ts',
  'tailwind.config.js', 'postcss.config.js',
];

// ── Vite binary path ──
const VITE_BIN = path.join(TEMPLATE_DIR, 'node_modules', '.bin', 'vite');

/**
 * Extract meaningful error from Vite build output.
 */
function extractBuildError(rawOutput) {
  const lines = rawOutput.split('\n');
  const errorLines = [];
  let capture = false;

  for (const line of lines) {
    if (/error/i.test(line) && (
      /SyntaxError|TypeError|ReferenceError|Cannot find|Failed to resolve|Could not resolve|Module not found|missing/i.test(line)
    )) {
      capture = true;
    }
    if (capture) {
      errorLines.push(line.trim());
      if (errorLines.length >= 10) break;
    }
    if (/^\s*\d+\s*\|/.test(line) || /at\s+.*:\d+:\d+/.test(line)) {
      errorLines.push(line.trim());
    }
  }

  if (errorLines.length > 0) {
    return errorLines.join('\n');
  }
  return lines.slice(-15).join('\n');
}

// ── Memory guard ──
function isMemoryOk() {
  const rss = process.memoryUsage().rss;
  return rss < MEMORY_LIMIT_MB * 1024 * 1024;
}

// ── Stale dir cleanup ──
function cleanupStaleDirs() {
  const now = Date.now();
  for (const base of [BUILDS_DIR, WARM_DIR]) {
    try {
      if (!fs.existsSync(base)) continue;
      const entries = fs.readdirSync(base);
      for (const entry of entries) {
        const full = path.join(base, entry);
        try {
          const stat = fs.statSync(full);
          if (now - stat.mtimeMs > STALE_DIR_MAX_AGE_MS) {
            // Unlink symlink first
            const nm = path.join(full, 'node_modules');
            try {
              if (fs.lstatSync(nm).isSymbolicLink()) fs.unlinkSync(nm);
            } catch {}
            fs.rmSync(full, { recursive: true, force: true });
          }
        } catch {}
      }
    } catch {}
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));

// Health check with memory guard
app.get('/health', (_req, res) => {
  const mem = process.memoryUsage();
  const memOk = isMemoryOk();
  const status = memOk && !isShuttingDown ? 200 : 503;
  res.status(status).json({
    ok: memOk && !isShuttingDown,
    active: activeBuildCount,
    max: MAX_CONCURRENT,
    queued: buildQueue.length,
    maxQueued: MAX_QUEUED,
    warmPool: warmPool.length,
    rssBytes: mem.rss,
    rssMB: Math.round(mem.rss / 1024 / 1024),
    memoryLimitMB: MEMORY_LIMIT_MB,
    shuttingDown: isShuttingDown,
  });
});

// Warm endpoint — pre-fill warm pool
app.post('/warm', (_req, res) => {
  refillWarmPool();
  res.json({ ok: true, warmPool: warmPool.length });
});

// Main compile endpoint
app.post('/compile', async (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ error: 'Server shutting down' });
  }

  // Memory guard
  if (!isMemoryOk()) {
    return res.status(503).json({ error: 'Server memory limit exceeded — retry later', fallback: true });
  }

  const t0 = Date.now();

  // Auth check
  if (AUTH_TOKEN) {
    const token = req.headers['x-sandbox-token'] || req.headers.authorization?.replace('Bearer ', '');
    if (token !== AUTH_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const { files, options, installPackages } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  // ── Request deduplication ──
  const needsInstall = Array.isArray(installPackages) && installPackages.length > 0;
  const payloadHash = hashPayload(files);

  if (inflightBuilds.has(payloadHash) && !needsInstall) {
    console.log(`[dedup] Reusing in-flight build for hash ${payloadHash.slice(0, 8)}`);
    try {
      const result = await inflightBuilds.get(payloadHash);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message, html: null, errors: [err.message] });
    }
  }

  // ── Queue instead of immediate 503 ──
  try {
    await waitForSlot();
  } catch (err) {
    const status = err.message === 'Queue full' ? 503 : 504;
    return res.status(status).json({
      error: `Server busy — ${err.message}`,
      queued: buildQueue.length,
      active: activeBuildCount,
    });
  }

  activeBuildCount++;

  const buildPromise = executeBuild(files, options, installPackages, needsInstall, t0);

  // Store for dedup (only non-install builds — install builds mutate state)
  if (!needsInstall) {
    inflightBuilds.set(payloadHash, buildPromise);
  }

  try {
    const result = await buildPromise;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message, html: null, errors: [err.message] });
  } finally {
    activeBuildCount--;
    inflightBuilds.delete(payloadHash);
    processQueue();
  }
});

async function executeBuild(files, options, installPackages, needsInstall, t0) {
  const buildId = randomUUID();
  let buildDir;
  let usedWarmDir = false;
  let childProcess = null;

  console.log(`[${buildId}] Starting build (${files.length} files, active: ${activeBuildCount}, install: ${needsInstall ? installPackages.length + ' pkgs' : 'no'})`);

  try {
    // 1. Use warm dir if available and no install needed
    if (!needsInstall) {
      buildDir = takeWarmDir();
      if (buildDir) {
        usedWarmDir = true;
        console.log(`[${buildId}] Using warm dir`);
      }
    }

    if (!buildDir) {
      buildDir = path.join(BUILDS_DIR, buildId);
      fs.mkdirSync(path.join(buildDir, 'src'), { recursive: true });

      for (const cf of CONFIG_FILES) {
        const src = path.join(TEMPLATE_DIR, cf);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(buildDir, cf));
        }
      }

      const templateNodeModules = path.join(TEMPLATE_DIR, 'node_modules');
      const buildNodeModules = path.join(buildDir, 'node_modules');

      if (needsInstall) {
        execSync(`cp -r "${templateNodeModules}" "${buildNodeModules}"`, { timeout: 15000 });
      } else {
        fs.symlinkSync(templateNodeModules, buildNodeModules, 'junction');
      }
    }

    // 2. Install additional packages if requested (concurrency-limited to 1)
    if (needsInstall) {
      await acquireInstallSlot();
      try {
        const pkgList = installPackages.map(p => `"${p}"`).join(' ');
        console.log(`[${buildId}] Installing packages: ${pkgList}`);
        execSync(`npm install --no-save ${pkgList}`, {
          cwd: buildDir,
          timeout: INSTALL_TIMEOUT_MS,
          env: { ...process.env, NODE_ENV: 'production' },
          stdio: 'pipe',
        });
        console.log(`[${buildId}] Package install completed in ${Date.now() - t0}ms`);
      } catch (installErr) {
        console.warn(`[${buildId}] Package install failed (continuing):`, installErr.message?.slice(0, 200));
      } finally {
        releaseInstallSlot();
      }
    }

    // 3. Write user files
    for (const file of files) {
      let filePath;
      if (file.path === 'index.html' || file.path.startsWith('src/') || file.path.startsWith('public/')) {
        filePath = path.join(buildDir, file.path);
      } else {
        filePath = path.join(buildDir, 'src', file.path);
      }
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }

    // 4. Write index.html if not provided
    const hasIndexHtml = files.some(f => f.path === 'index.html') || fs.existsSync(path.join(buildDir, 'index.html'));
    if (!hasIndexHtml) {
      const entryFile = files.find(f => /^(src\/)?main\.(tsx?|jsx?)$/.test(f.path))
        || files.find(f => /^(src\/)?index\.(tsx?|jsx?)$/.test(f.path));
      const entryPath = entryFile ? entryFile.path : 'main.tsx';
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/${entryPath}"></script>
</body>
</html>`;
      fs.writeFileSync(path.join(buildDir, 'index.html'), indexHtml, 'utf-8');
    }

    // 5. Generate env vars
    if (options) {
      const envLines = [];
      if (options.supabaseConfig) {
        envLines.push(`VITE_SUPABASE_URL=${options.supabaseConfig.url}`);
        envLines.push(`VITE_SUPABASE_ANON_KEY=${options.supabaseConfig.anonKey}`);
      }
      if (options.stripeConfig) {
        envLines.push(`VITE_STRIPE_PUBLISHABLE_KEY=${options.stripeConfig.publishableKey}`);
      }
      if (options.envVars) {
        for (const ev of options.envVars) {
          envLines.push(`VITE_${ev.key}=${ev.value}`);
        }
      }
      if (envLines.length > 0) {
        fs.writeFileSync(path.join(buildDir, '.env'), envLines.join('\n'), 'utf-8');
      }
    }

    // 6. Write vite.config.ts
    const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
`;
    fs.writeFileSync(path.join(buildDir, 'vite.config.ts'), viteConfig, 'utf-8');

    // 7. Run vite build
    const viteBin = fs.existsSync(VITE_BIN) ? VITE_BIN : 'npx vite';
    const buildResult = await new Promise((resolve, reject) => {
      childProcess = exec(
        `${viteBin} build --mode production 2>&1`,
        {
          cwd: buildDir,
          timeout: BUILD_TIMEOUT_MS,
          env: { ...process.env, NODE_ENV: 'production' },
          maxBuffer: 1024 * 1024 * 10,
        },
        (error, stdout, stderr) => {
          activeChildProcesses.delete(childProcess);
          childProcess = null;
          if (error) {
            const extracted = extractBuildError(`${stdout}\n${stderr}`);
            reject(new Error(extracted));
          } else {
            resolve(stdout);
          }
        }
      );
      activeChildProcesses.add(childProcess);
    });

    console.log(`[${buildId}] Vite build completed in ${Date.now() - t0}ms`);

    // 8. Read the built HTML and inline all assets
    const distDir = path.join(buildDir, 'dist');
    const indexPath = path.join(distDir, 'index.html');

    if (!fs.existsSync(indexPath)) {
      throw new Error('Build produced no index.html');
    }

    let html = fs.readFileSync(indexPath, 'utf-8');

    const jsMatches = html.matchAll(/<script[^>]*src="([^"]+\.js)"[^>]*><\/script>/g);
    for (const match of jsMatches) {
      const jsPath = path.join(distDir, match[1]);
      if (fs.existsSync(jsPath)) {
        const jsContent = fs.readFileSync(jsPath, 'utf-8');
        html = html.replace(match[0], `<script type="module">${jsContent}</script>`);
      }
    }

    const cssMatches = html.matchAll(/<link[^>]*href="([^"]+\.css)"[^>]*\/?>/g);
    for (const match of cssMatches) {
      const cssPath = path.join(distDir, match[1]);
      if (fs.existsSync(cssPath)) {
        const cssContent = fs.readFileSync(cssPath, 'utf-8');
        html = html.replace(match[0], `<style>${cssContent}</style>`);
      }
    }

    const componentCount = files.filter(f => /\.(tsx|jsx)$/.test(f.path)).length;

    console.log(`[${buildId}] Done: ${html.length} chars, ${componentCount} components, ${Date.now() - t0}ms total`);

    return {
      html,
      componentCount,
      errors: [],
      buildTimeMs: Date.now() - t0,
    };

  } catch (err) {
    if (childProcess) {
      try {
        childProcess.kill('SIGKILL');
        activeChildProcesses.delete(childProcess);
      } catch {}
      childProcess = null;
    }
    console.error(`[${buildId}] Build error:`, err.message?.slice(0, 500));
    throw err;
  } finally {
    // Cleanup build dir async
    if (buildDir) {
      const buildNodeModules = path.join(buildDir, 'node_modules');
      try {
        const stat = fs.lstatSync(buildNodeModules);
        if (stat.isSymbolicLink()) fs.unlinkSync(buildNodeModules);
      } catch {}
      fs.rm(buildDir, { recursive: true, force: true }, () => {});
    }
  }
}

// ── Graceful shutdown ──
function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[Shutdown] Received ${signal} — stopping gracefully...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('[Shutdown] HTTP server closed');
  });

  // Drain active builds with 10s timeout
  const shutdownTimeout = setTimeout(() => {
    console.warn('[Shutdown] Timed out waiting for builds — killing all child processes');
    for (const child of activeChildProcesses) {
      try { child.kill('SIGKILL'); } catch {}
    }
    activeChildProcesses.clear();
    process.exit(1);
  }, 10_000);

  // Check periodically if all builds are done
  const check = setInterval(() => {
    if (activeBuildCount <= 0) {
      clearInterval(check);
      clearTimeout(shutdownTimeout);
      console.log('[Shutdown] All builds complete — exiting');
      process.exit(0);
    }
  }, 200);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const server = app.listen(PORT, () => {
  console.log(`🔨 Vite Sandbox Server running on port ${PORT}`);
  console.log(`   Template dir: ${TEMPLATE_DIR}`);
  console.log(`   Max concurrent builds: ${MAX_CONCURRENT}`);
  console.log(`   Max queued builds: ${MAX_QUEUED}`);
  console.log(`   Build timeout: ${BUILD_TIMEOUT_MS}ms`);
  console.log(`   Install timeout: ${INSTALL_TIMEOUT_MS}ms`);
  console.log(`   Memory limit: ${MEMORY_LIMIT_MB}MB`);
  console.log(`   Warm pool size: ${WARM_POOL_SIZE}`);
  
  // Ensure dirs exist
  fs.mkdirSync(BUILDS_DIR, { recursive: true });
  fs.mkdirSync(WARM_DIR, { recursive: true });
  
  // Verify template
  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.warn('⚠️  Template directory missing! Run: npm run setup-template');
  } else {
    if (fs.existsSync(VITE_BIN)) {
      console.log(`   Vite binary: ${VITE_BIN} ✅`);
    } else {
      console.warn(`⚠️  Vite binary not found at ${VITE_BIN} — will fall back to npx`);
    }
    // Pre-fill warm pool
    refillWarmPool();
    console.log(`   Warm pool: ${warmPool.length} dirs ready`);
  }

  // Periodic stale dir cleanup (every 30s)
  setInterval(cleanupStaleDirs, 30_000);
});
