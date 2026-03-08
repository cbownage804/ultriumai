import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * compile-vite — Edge function bridge to the Vite Sandbox Droplet.
 * 
 * Hardened v2:
 * - Edge-level retry with 2s delay on 503/timeout
 * - TEMPLATE_PACKAGES synced with setup-template.sh
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SANDBOX_URL = Deno.env.get("VITE_SANDBOX_URL");
  const SANDBOX_TOKEN = Deno.env.get("VITE_SANDBOX_TOKEN");

  if (!SANDBOX_URL || !SANDBOX_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Vite sandbox not configured", fallback: true }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { files, options } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-inject index.html if missing
    const hasIndexHtml = files.some((f: any) => f.path === "index.html");
    if (!hasIndexHtml) {
      const mainEntry = files.find((f: any) =>
        f.path === "src/main.tsx" || f.path === "src/main.ts"
      );
      const entryPath = mainEntry ? `/${mainEntry.path}` : "/src/App.tsx";
      
      const cssFile = files.find((f: any) =>
        f.path === "src/index.css" || f.path === "src/styles.css" || f.path === "src/App.css"
      );

      if (!mainEntry) {
        const hasApp = files.some((f: any) => f.path === "src/App.tsx" || f.path === "src/App.ts");
        if (hasApp) {
          files.push({
            path: "src/main.tsx",
            content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n${cssFile ? `import './${cssFile.path.split('/').pop()}';\n` : ''}ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`
          });
        }
      }

      files.push({
        path: "index.html",
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<title>App</title>\n</head>\n<body>\n<div id="root"></div>\n<script type="module" src="${mainEntry ? entryPath : '/src/main.tsx'}"></script>\n</body>\n</html>`
      });
      console.log(`[compile-vite] Auto-injected index.html + ${!mainEntry ? 'main.tsx' : 'no extra entry'}`);
    }

    // Detect imports to request dynamic npm install on the sandbox
    const detectedPackages = new Set<string>();
    for (const f of files) {
      if (typeof f.content !== 'string') continue;
      const importRegex = /(?:import\s+.*?\s+from\s+['"])([^./][^'"]*?)(?:['"])/g;
      const requireRegex = /(?:require\s*\(\s*['"])([^./][^'"]*?)(?:['"])/g;
      let m;
      while ((m = importRegex.exec(f.content)) !== null) {
        const pkg = m[1].startsWith('@') ? m[1].split('/').slice(0, 2).join('/') : m[1].split('/')[0];
        detectedPackages.add(pkg);
      }
      while ((m = requireRegex.exec(f.content)) !== null) {
        const pkg = m[1].startsWith('@') ? m[1].split('/').slice(0, 2).join('/') : m[1].split('/')[0];
        detectedPackages.add(pkg);
      }
    }

    // ── TEMPLATE_PACKAGES — synced with setup-template.sh ──
    const TEMPLATE_PACKAGES = new Set([
      // Core React
      'react', 'react-dom', 'react-router-dom',
      // UI libraries
      'lucide-react', 'framer-motion', 'recharts', 'date-fns',
      // Utility
      'clsx', 'tailwind-merge', 'class-variance-authority',
      'zod', 'uuid', 'axios', 'zustand',
      // Forms
      'react-hook-form', '@hookform/resolvers',
      // Supabase & data
      '@supabase/supabase-js', '@tanstack/react-query',
      // Radix UI (all from template)
      '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar', '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible', '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card',
      '@radix-ui/react-label', '@radix-ui/react-popover',
      '@radix-ui/react-progress', '@radix-ui/react-scroll-area',
      '@radix-ui/react-select', '@radix-ui/react-separator',
      '@radix-ui/react-slider', '@radix-ui/react-slot',
      '@radix-ui/react-switch', '@radix-ui/react-tabs',
      '@radix-ui/react-toast', '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group', '@radix-ui/react-tooltip',
      '@radix-ui/react-icons',
      '@radix-ui/react-radio-group', '@radix-ui/react-context-menu',
      '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu',
      '@radix-ui/react-aspect-ratio',
      // shadcn ecosystem
      'cmdk', 'sonner', 'tailwindcss-animate',
      'embla-carousel-react', 'react-day-picker', 'input-otp', 'vaul',
      'next-themes', 'react-resizable-panels',
      // Additional packages in setup-template.sh
      'canvas-confetti', 'react-dropzone', 'react-markdown',
      'react-color', 'dompurify', 'qrcode', 'html2canvas', 'jspdf',
      '@hello-pangea/dnd',
      // CSS/build tooling — these are in the template's node_modules already
      'tailwindcss', 'autoprefixer', 'postcss', '@tailwindcss/typography',
      // Vite build toolchain — already in template devDependencies
      'vite', '@vitejs/plugin-react',
      // TypeScript
      'typescript', '@types/react', '@types/react-dom',
    ]);

    const NODE_BUILTIN_PACKAGES = new Set([
      'assert', 'buffer', 'child_process', 'crypto', 'events', 'fs', 'http', 'https',
      'net', 'os', 'path', 'stream', 'timers', 'tty', 'url', 'util', 'zlib'
    ]);

    const extraPackages = [...detectedPackages].filter(
      p => !TEMPLATE_PACKAGES.has(p) && !NODE_BUILTIN_PACKAGES.has(p) && !p.startsWith('node:')
    );

    // Base install set: only packages not present in template snapshot.
    const REQUIRED_BUILD_PACKAGES = ['vite', '@vitejs/plugin-react'];
    const installPackages = extraPackages;

    if (installPackages.length > 0) {
      console.log(`[compile-vite] Installing ${installPackages.length} packages: ${installPackages.join(', ')}`);
    }

    // Sort files — index.html first
    const sortedFiles = [
      ...files.filter((f: any) => f.path === 'index.html'),
      ...files.filter((f: any) => f.path !== 'index.html'),
    ];

    const makePayload = (pkgs: string[]) => JSON.stringify({
      files: sortedFiles,
      options,
      installPackages: pkgs,
      entryFile: "index.html",
    });

    const basePayload = makePayload(installPackages);

    // ── Attempt with edge-level retry ──
    const attempt = async (payload: string, timeoutMs: number): Promise<Response> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${SANDBOX_URL}/compile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sandbox-token": SANDBOX_TOKEN,
          },
          body: payload,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        return response;
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    };

    let response: Response;
    let result: any;

    try {
      const baseTimeoutMs = installPackages.length > 0 ? 30_000 : 15_000;
      response = await attempt(basePayload, baseTimeoutMs);
      result = await response.json();
    } catch (firstErr: any) {
      const isRetryable = firstErr.name === "AbortError" || /fetch|network/i.test(firstErr.message);
      if (!isRetryable) throw firstErr;

      // ── Edge-level retry: wait 2s, try once more ──
      console.log(`[compile-vite] First attempt failed (${firstErr.message}) — retrying in 2s`);
      await new Promise(r => setTimeout(r, 2000));

      try {
        const baseTimeoutMs = installPackages.length > 0 ? 30_000 : 15_000;
        response = await attempt(basePayload, baseTimeoutMs);
        result = await response.json();
      } catch (retryErr: any) {
        console.error(`[compile-vite] Retry also failed: ${retryErr.message}`);
        throw retryErr;
      }
    }

    // If first attempt returned 503, retry once
    if (!response!.ok && (response!.status === 503 || response!.status === 504)) {
      console.log(`[compile-vite] Got ${response!.status} — retrying in 2s`);
      await new Promise(r => setTimeout(r, 2000));
      try {
        const baseTimeoutMs = installPackages.length > 0 ? 30_000 : 15_000;
        const retryResponse = await attempt(basePayload, baseTimeoutMs);
        const retryResult = await retryResponse.json();
        if (retryResponse.ok) {
          console.log(`[compile-vite] Retry success: ${retryResult.html?.length || 0} chars`);
          return new Response(
            JSON.stringify(retryResult),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Use retry result even if failed (more recent state)
        result = retryResult;
        response = retryResponse;
      } catch {
        // Fall through with original result
      }
    }

    // Self-heal path: if sandbox template is missing core Vite toolchain, force-install and retry once.
    const missingCoreToolchain = typeof result?.error === 'string' && (
      result.error.includes("Cannot find package 'vite'") ||
      result.error.includes('Cannot find package "vite"') ||
      result.error.includes("Cannot find package '@vitejs/plugin-react'") ||
      result.error.includes('Cannot find package "@vitejs/plugin-react"')
    );

    if (!response!.ok && missingCoreToolchain) {
      const forcedInstallPackages = [...new Set([...installPackages, ...REQUIRED_BUILD_PACKAGES])];
      console.warn(`[compile-vite] Missing Vite toolchain detected; retrying with forced install: ${forcedInstallPackages.join(', ')}`);

      try {
        const recoveryPayload = makePayload(forcedInstallPackages);
        const recoveryResponse = await attempt(recoveryPayload, 30_000);
        const recoveryResult = await recoveryResponse.json();

        if (recoveryResponse.ok) {
          console.log(`[compile-vite] Recovery success: ${recoveryResult.html?.length || 0} chars`);
          return new Response(
            JSON.stringify(recoveryResult),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        response = recoveryResponse;
        result = recoveryResult;
      } catch (recoveryErr: any) {
        console.error(`[compile-vite] Recovery attempt failed: ${recoveryErr.message}`);
      }
    }

    if (!response!.ok) {
      console.error(`[compile-vite] Sandbox error (${response!.status}):`, result?.error);
      return new Response(
        JSON.stringify({ error: result?.error || 'Unknown error', fallback: true }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const t0 = Date.now();
    console.log(`[compile-vite] Success: ${result.html?.length || 0} chars`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    console.error(`[compile-vite] ${isTimeout ? "Timeout" : "Error"}:`, err.message);

    return new Response(
      JSON.stringify({
        error: isTimeout ? "Vite sandbox timed out" : err.message,
        fallback: true,
      }),
      { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
