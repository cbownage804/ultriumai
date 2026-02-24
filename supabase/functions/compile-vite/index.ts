import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * compile-vite — Edge function bridge to the Vite Sandbox Droplet.
 * 
 * Receives the same payload as compile-project, forwards to the Droplet
 * running a real Vite build, and returns the compiled HTML.
 * 
 * Falls back gracefully if the Droplet is unreachable.
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

    // Auto-inject index.html if missing — Vite requires it as entry point
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
    // Filter out built-in/known packages that are in the template
    const TEMPLATE_PACKAGES = new Set([
      'react', 'react-dom', 'react-router-dom', 'lucide-react', 'framer-motion',
      'recharts', 'date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority',
      'zustand', 'zod', 'uuid', '@radix-ui/react-slot', '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip', '@radix-ui/react-popover',
      '@radix-ui/react-select', '@radix-ui/react-checkbox', '@radix-ui/react-switch',
      '@radix-ui/react-tabs', '@radix-ui/react-avatar', '@radix-ui/react-label',
      '@radix-ui/react-separator', '@radix-ui/react-scroll-area', '@radix-ui/react-toast',
      '@radix-ui/react-accordion', '@radix-ui/react-collapsible', '@radix-ui/react-progress',
      '@radix-ui/react-slider', '@radix-ui/react-radio-group', '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group', '@radix-ui/react-hover-card', '@radix-ui/react-context-menu',
      '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu', '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio', 'cmdk', 'sonner', 'tailwindcss-animate',
      'embla-carousel-react', 'react-day-picker', 'input-otp', 'vaul',
      'react-hook-form', '@hookform/resolvers', 'next-themes',
      '@supabase/supabase-js', '@tanstack/react-query',
    ]);
    const extraPackages = [...detectedPackages].filter(p => !TEMPLATE_PACKAGES.has(p));
    if (extraPackages.length > 0) {
      console.log(`[compile-vite] Detected ${extraPackages.length} extra packages: ${extraPackages.join(', ')}`);
    }

    console.log(`[compile-vite] Forwarding ${files.length} files to Vite sandbox at ${SANDBOX_URL}`);
    const t0 = Date.now();

    // Forward to Droplet with shorter timeout for fast fallback
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), extraPackages.length > 0 ? 30_000 : 15_000);

    const response = await fetch(`${SANDBOX_URL}/compile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sandbox-token": SANDBOX_TOKEN,
      },
      body: JSON.stringify({ files, options, installPackages: extraPackages }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const result = await response.json();

    if (!response.ok) {
      console.error(`[compile-vite] Sandbox error (${response.status}):`, result.error);
      return new Response(
        JSON.stringify({ error: result.error, fallback: true }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[compile-vite] Success: ${result.html?.length || 0} chars in ${Date.now() - t0}ms`);

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
