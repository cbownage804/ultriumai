/**
 * Vite Cloud Sandbox Server
 * 
 * Receives project files via HTTP POST, writes them into a pre-built
 * Vite template project, runs `vite build`, and returns the compiled
 * single-page HTML with all JS/CSS inlined.
 * 
 * Runs on a DigitalOcean Droplet to give App Builder true Vite parity.
 */

import express from 'express';
import { execSync, exec } from 'child_process';
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

let activeBuildCount = 0;

const app = express();
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, active: activeBuildCount, max: MAX_CONCURRENT });
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

  // Concurrency guard
  if (activeBuildCount >= MAX_CONCURRENT) {
    return res.status(503).json({ error: 'Server busy — too many concurrent builds' });
  }

  const { files, options } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  const buildId = randomUUID();
  const buildDir = path.join(BUILDS_DIR, buildId);

  activeBuildCount++;
  console.log(`[${buildId}] Starting build (${files.length} files, active: ${activeBuildCount})`);

  try {
    // 1. Copy template to build dir
    execSync(`cp -r "${TEMPLATE_DIR}" "${buildDir}"`, { timeout: 5000 });

    // 2. Write user files into the build directory
    //    Files already under src/ (e.g. "src/App.tsx") go as-is.
    //    Root-level files like "index.html" go to the build root.
    //    All other files default to src/ subdirectory.
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

    // 3. Write index.html if not provided
    const hasIndexHtml = files.some(f => f.path === 'index.html') || fs.existsSync(path.join(buildDir, 'index.html'));
    if (!hasIndexHtml) {
      // Generate index.html pointing to main.tsx or App.tsx
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

    // 4. Generate env vars file
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

    // 5. Generate a path alias config in vite.config.ts
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
        // Inline everything into a single HTML file
        manualChunks: undefined,
      },
    },
    // Inline assets below 100MB (effectively inline everything)
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
`;
    fs.writeFileSync(path.join(buildDir, 'vite.config.ts'), viteConfig, 'utf-8');

    // 6. Run vite build
    const buildResult = await new Promise((resolve, reject) => {
      const child = exec(
        'npx vite build --mode production 2>&1',
        {
          cwd: buildDir,
          timeout: BUILD_TIMEOUT_MS,
          env: { ...process.env, NODE_ENV: 'production' },
          maxBuffer: 1024 * 1024 * 10, // 10MB
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Build failed:\n${stdout}\n${stderr}`));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    console.log(`[${buildId}] Vite build completed in ${Date.now() - t0}ms`);

    // 7. Read the built HTML and inline all assets
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

    // Count components (approximate)
    const componentCount = files.filter(f => /\.(tsx|jsx)$/.test(f.path)).length;

    console.log(`[${buildId}] Done: ${html.length} chars, ${componentCount} components, ${Date.now() - t0}ms total`);

    res.json({
      html,
      componentCount,
      errors: [],
      buildTimeMs: Date.now() - t0,
    });

  } catch (err) {
    console.error(`[${buildId}] Build error:`, err.message);
    res.status(500).json({
      error: err.message,
      html: null,
      errors: [err.message],
    });
  } finally {
    activeBuildCount--;
    // Cleanup build dir async
    fs.rm(buildDir, { recursive: true, force: true }, () => {});
  }
});

app.listen(PORT, () => {
  console.log(`🔨 Vite Sandbox Server running on port ${PORT}`);
  console.log(`   Template dir: ${TEMPLATE_DIR}`);
  console.log(`   Max concurrent builds: ${MAX_CONCURRENT}`);
  console.log(`   Build timeout: ${BUILD_TIMEOUT_MS}ms`);
  
  // Ensure dirs exist
  fs.mkdirSync(BUILDS_DIR, { recursive: true });
  
  // Verify template exists
  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.warn('⚠️  Template directory missing! Run: npm run setup-template');
  }
});
