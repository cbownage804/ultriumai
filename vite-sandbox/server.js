/**
 * Vite Cloud Sandbox Server — Hardened
 * 
 * Receives project files via HTTP POST, writes them into a pre-built
 * Vite template project, runs `vite build`, and returns the compiled
 * single-page HTML with all JS/CSS inlined.
 * 
 * Hardening:
 * - Symlinks node_modules from template (fast setup)
 * - Copies node_modules when installPackages needed (safe mutation)
 * - Uses direct vite binary (no npx overhead)
 * - Kills zombie processes on timeout
 * - FIFO build queue when at capacity
 * - Better error extraction from Vite stderr
 */

import express from 'express';
import { execSync, exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, 'template');
const BUILDS_DIR = path.join(__dirname, 'builds');
const PORT = process.env.PORT || 3100;
const AUTH_TOKEN = process.env.SANDBOX_AUTH_TOKEN || '';
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '10', 10);
const BUILD_TIMEOUT_MS = parseInt(process.env.BUILD_TIMEOUT_MS || '30000', 10);
const MAX_QUEUED = parseInt(process.env.MAX_QUEUED || '5', 10);
const QUEUE_TIMEOUT_MS = parseInt(process.env.QUEUE_TIMEOUT_MS || '10000', 10);
const INSTALL_TIMEOUT_MS = parseInt(process.env.INSTALL_TIMEOUT_MS || '15000', 10);

let activeBuildCount = 0;

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

function waitForSlot(signal) {
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
    // Clean up timer when resolved
    const origResolve = entry.resolve;
    entry.resolve = () => {
      clearTimeout(timer);
      origResolve();
    };
  });
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
 * Returns a concise error message instead of the full stderr dump.
 */
function extractBuildError(rawOutput) {
  const lines = rawOutput.split('\n');
  const errorLines = [];
  let capture = false;

  for (const line of lines) {
    // Vite/Rollup error markers
    if (/error/i.test(line) && (
      /SyntaxError|TypeError|ReferenceError|Cannot find|Failed to resolve|Could not resolve|Module not found|missing/i.test(line)
    )) {
      capture = true;
    }
    if (capture) {
      errorLines.push(line.trim());
      if (errorLines.length >= 10) break;
    }
    // Also capture lines with file:line:col patterns
    if (/^\s*\d+\s*\|/.test(line) || /at\s+.*:\d+:\d+/.test(line)) {
      errorLines.push(line.trim());
    }
  }

  if (errorLines.length > 0) {
    return errorLines.join('\n');
  }

  // Fallback: last 15 lines
  return lines.slice(-15).join('\n');
}

const app = express();
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    active: activeBuildCount,
    max: MAX_CONCURRENT,
    queued: buildQueue.length,
    maxQueued: MAX_QUEUED,
  });
});

// Main compile endpoint
app.post('/compile', async (req, res) => {
  const t0 = Date.now();

  // Auth check
  if (AUTH_TOKEN) {
    const token = req.headers['x-sandbox-token'] || req.headers.authorization?.replace('Bearer ', '');
    if (token !== AUTH_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
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

  const { files, options, installPackages } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  const buildId = randomUUID();
  const buildDir = path.join(BUILDS_DIR, buildId);
  const needsInstall = Array.isArray(installPackages) && installPackages.length > 0;

  activeBuildCount++;
  console.log(`[${buildId}] Starting build (${files.length} files, active: ${activeBuildCount}, install: ${needsInstall ? installPackages.length + ' pkgs' : 'no'})`);

  let childProcess = null;

  try {
    // 1. Create build dir and copy config files only
    fs.mkdirSync(path.join(buildDir, 'src'), { recursive: true });

    for (const cf of CONFIG_FILES) {
      const src = path.join(TEMPLATE_DIR, cf);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(buildDir, cf));
      }
    }

    // 2. Symlink or copy node_modules
    const templateNodeModules = path.join(TEMPLATE_DIR, 'node_modules');
    const buildNodeModules = path.join(buildDir, 'node_modules');

    if (needsInstall) {
      // Must copy so npm install doesn't mutate template
      execSync(`cp -r "${templateNodeModules}" "${buildNodeModules}"`, { timeout: 15000 });
    } else {
      // Fast path: symlink
      fs.symlinkSync(templateNodeModules, buildNodeModules, 'junction');
    }

    // 3. Install additional packages if requested
    if (needsInstall) {
      const pkgList = installPackages.map(p => `"${p}"`).join(' ');
      console.log(`[${buildId}] Installing packages: ${pkgList}`);
      try {
        execSync(`npm install --no-save ${pkgList}`, {
          cwd: buildDir,
          timeout: INSTALL_TIMEOUT_MS,
          env: { ...process.env, NODE_ENV: 'production' },
          stdio: 'pipe',
        });
        console.log(`[${buildId}] Package install completed in ${Date.now() - t0}ms`);
      } catch (installErr) {
        console.warn(`[${buildId}] Package install failed (continuing without):`, installErr.message?.slice(0, 200));
        // Continue — build may still work if deps are optional
      }
    }

    // 4. Write user files into the build directory
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

    // 5. Write index.html if not provided
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

    // 6. Generate env vars file
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

    // 7. Write vite.config.ts (always overwrite to ensure path aliases work)
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

    // 8. Run vite build using direct binary (no npx overhead)
    const viteBin = fs.existsSync(VITE_BIN) ? VITE_BIN : 'npx vite';
    const buildResult = await new Promise((resolve, reject) => {
      childProcess = exec(
        `${viteBin} build --mode production 2>&1`,
        {
          cwd: buildDir,
          timeout: BUILD_TIMEOUT_MS,
          env: { ...process.env, NODE_ENV: 'production' },
          maxBuffer: 1024 * 1024 * 10, // 10MB
        },
        (error, stdout, stderr) => {
          childProcess = null;
          if (error) {
            const extracted = extractBuildError(`${stdout}\n${stderr}`);
            reject(new Error(extracted));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    console.log(`[${buildId}] Vite build completed in ${Date.now() - t0}ms`);

    // 9. Read the built HTML and inline all assets
    const distDir = path.join(buildDir, 'dist');
    const indexPath = path.join(distDir, 'index.html');

    if (!fs.existsSync(indexPath)) {
      throw new Error('Build produced no index.html');
    }

    let html = fs.readFileSync(indexPath, 'utf-8');

    // Inline JS files
    const jsMatches = html.matchAll(/<script[^>]*src="([^"]+\.js)"[^>]*><\/script>/g);
    for (const match of jsMatches) {
      const jsPath = path.join(distDir, match[1]);
      if (fs.existsSync(jsPath)) {
        const jsContent = fs.readFileSync(jsPath, 'utf-8');
        html = html.replace(match[0], `<script type="module">${jsContent}</script>`);
      }
    }

    // Inline CSS files
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

    res.json({
      html,
      componentCount,
      errors: [],
      buildTimeMs: Date.now() - t0,
    });

  } catch (err) {
    // Kill zombie child process on error/timeout
    if (childProcess) {
      try {
        childProcess.kill('SIGKILL');
      } catch {}
      childProcess = null;
    }

    console.error(`[${buildId}] Build error:`, err.message?.slice(0, 500));
    res.status(500).json({
      error: err.message,
      html: null,
      errors: [err.message],
    });
  } finally {
    activeBuildCount--;
    // Process queued builds
    processQueue();
    // Cleanup build dir async — remove symlink first if needed
    const buildNodeModules = path.join(buildDir, 'node_modules');
    try {
      const stat = fs.lstatSync(buildNodeModules);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(buildNodeModules);
      }
    } catch {}
    fs.rm(buildDir, { recursive: true, force: true }, () => {});
  }
});

app.listen(PORT, () => {
  console.log(`🔨 Vite Sandbox Server running on port ${PORT}`);
  console.log(`   Template dir: ${TEMPLATE_DIR}`);
  console.log(`   Max concurrent builds: ${MAX_CONCURRENT}`);
  console.log(`   Max queued builds: ${MAX_QUEUED}`);
  console.log(`   Build timeout: ${BUILD_TIMEOUT_MS}ms`);
  console.log(`   Install timeout: ${INSTALL_TIMEOUT_MS}ms`);
  
  // Ensure dirs exist
  fs.mkdirSync(BUILDS_DIR, { recursive: true });
  
  // Verify template exists
  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.warn('⚠️  Template directory missing! Run: npm run setup-template');
  } else {
    // Verify vite binary exists
    if (fs.existsSync(VITE_BIN)) {
      console.log(`   Vite binary: ${VITE_BIN} ✅`);
    } else {
      console.warn(`⚠️  Vite binary not found at ${VITE_BIN} — will fall back to npx`);
    }
  }
});
