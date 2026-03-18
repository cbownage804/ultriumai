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
function resolveRelativeImportPath(fromPath: string, importPath: string): string {
  const fromDir = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/")) : "";
  const raw = `${fromDir}/${importPath}`;
  const parts = raw.split("/");
  const normalized: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      normalized.pop();
      continue;
    }
    normalized.push(part);
  }

  return normalized.join("/");
}

/**
 * Detect bare imports in <script type="module"> blocks and inject an importmap
 * so the browser can resolve them via esm.sh CDN.
 */
function injectImportMapIfNeeded(html: string, detectedPackages: Set<string>): string {
  // Skip if already has an importmap
  if (/<script\b[^>]*type\s*=\s*["']importmap["']/i.test(html)) return html;

  // Check if there are bare imports in module scripts
  const moduleScriptRegex = /<script\b[^>]*type\s*=\s*["']module["'][^>]*>([\s\S]*?)<\/script>/gi;
  const bareImportRegex = /\bfrom\s*['"]([^'"./][^'"]*)['"]/g;

  const barePackages = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = moduleScriptRegex.exec(html)) !== null) {
    const code = match[1] || '';
    let bareMatch: RegExpExecArray | null;
    const localRegex = new RegExp(bareImportRegex.source, 'g');
    while ((bareMatch = localRegex.exec(code)) !== null) {
      const specifier = bareMatch[1];
      // Get the package name (handle scoped packages)
      const pkg = specifier.startsWith('@')
        ? specifier.split('/').slice(0, 2).join('/')
        : specifier.split('/')[0];
      barePackages.add(pkg);
      // Also add the full specifier if it's a subpath import
      if (specifier !== pkg) {
        barePackages.add(specifier);
      }
    }
  }

  if (barePackages.size === 0) return html;

  // Build importmap with esm.sh CDN URLs
  // Use a pinned React version for consistency
  const REACT_VERSION = '18.3.1';
  const imports: Record<string, string> = {};

  for (const pkg of barePackages) {
    // Special handling for React ecosystem to ensure shared state
    if (pkg === 'react') {
      imports['react'] = `https://esm.sh/react@${REACT_VERSION}`;
    } else if (pkg === 'react-dom') {
      imports['react-dom'] = `https://esm.sh/react-dom@${REACT_VERSION}?external=react`;
    } else if (pkg === 'react-dom/client') {
      imports['react-dom/client'] = `https://esm.sh/react-dom@${REACT_VERSION}/client?external=react`;
    } else if (pkg === 'react/jsx-runtime') {
      imports['react/jsx-runtime'] = `https://esm.sh/react@${REACT_VERSION}/jsx-runtime`;
    } else if (pkg === 'react/jsx-dev-runtime') {
      imports['react/jsx-dev-runtime'] = `https://esm.sh/react@${REACT_VERSION}/jsx-dev-runtime`;
    } else {
      // For other packages: put version after base package, subpath after
      const parts = pkg.split('/');
      const basePkg = pkg.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
      const subpath = pkg.startsWith('@') ? parts.slice(2).join('/') : parts.slice(1).join('/');
      const url = subpath
        ? `https://esm.sh/${basePkg}@latest/${subpath}?external=react,react-dom`
        : `https://esm.sh/${basePkg}?external=react,react-dom`;
      imports[pkg] = url;
    }
  }

  const importmapScript = `<script type="importmap">\n${JSON.stringify({ imports }, null, 2)}\n</script>`;

  // Inject before the first <script type="module">
  const firstModuleScript = html.indexOf('<script type="module"');
  if (firstModuleScript === -1) {
    // Fallback: inject in <head>
    return html.replace('</head>', `${importmapScript}\n</head>`);
  }
  return html.slice(0, firstModuleScript) + importmapScript + '\n' + html.slice(firstModuleScript);
}

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

    // Auto-inject missing local CSS imports (common generated-project failure mode)
    const existingPaths = new Set(files.map((f: any) => f.path));
    const missingCssPaths = new Set<string>();

    for (const f of files) {
      if (!/\.(ts|tsx|js|jsx)$/.test(f.path) || typeof f.content !== 'string') continue;
      const cssImportRegex = /import\s+(?:[^'";]+\s+from\s+)?['"]([^'"]+\.css(?:\?[^'"]*)?)['"]/g;
      let match;
      while ((match = cssImportRegex.exec(f.content)) !== null) {
        const importPath = (match[1] || '').split('?')[0];
        const resolvedPath = importPath.startsWith('.')
          ? resolveRelativeImportPath(f.path, importPath)
          : importPath.replace(/^\//, '');

        if (resolvedPath && !existingPaths.has(resolvedPath)) {
          missingCssPaths.add(resolvedPath);
        }
      }
    }

    if (missingCssPaths.size > 0) {
      for (const missingPath of missingCssPaths) {
        files.push({
          path: missingPath,
          content: `/* auto-injected placeholder for missing import: ${missingPath} */\n`,
        });
        existingPaths.add(missingPath);
      }
      console.log(`[compile-vite] Auto-injected ${missingCssPaths.size} missing CSS file(s): ${[...missingCssPaths].join(', ')}`);
    }

    // ── Auto-inject `import React` into TSX/JSX files that lack it ──
    for (const f of files) {
      if (typeof f.content !== 'string') continue;
      if (!/\.(tsx|jsx)$/.test(f.path)) continue;
      if (/import\s+React[\s,{]/i.test(f.content)) continue;
      if (/import\s+\*\s+as\s+React/i.test(f.content)) continue;
      f.content = `import React from 'react';\n${f.content}`;
    }

    // ── Auto-generate Tailwind CSS infrastructure (BEFORE index.html check) ──
    // This must run regardless of whether the user supplied index.html,
    // because PostCSS needs tailwind.config.js + postcss.config.js + @tailwind directives.
    const hasTailwindClasses = files.some((f: any) =>
      typeof f.content === 'string' && /className\s*=\s*["'][^"']*(?:bg-|text-|flex|grid|p-|m-|rounded|shadow|border|font-|hover:|w-|h-|gap-|space-|items-|justify-)/i.test(f.content)
    );

    if (hasTailwindClasses) {
      // Ensure a CSS file with @tailwind directives exists
      const hasTailwindDirectives = files.some((f: any) =>
        typeof f.content === 'string' && f.content.includes('@tailwind')
      );
      if (!hasTailwindDirectives) {
        const cssFile = files.find((f: any) =>
          f.path === "src/index.css" || f.path === "src/styles.css" || f.path === "src/App.css"
        );
        if (cssFile) {
          // Prepend @tailwind directives to existing CSS
          cssFile.content = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${cssFile.content}`;
          console.log(`[compile-vite] Prepended @tailwind directives to ${cssFile.path}`);
        } else {
          files.push({
            path: "src/index.css",
            content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
          });
          existingPaths.add("src/index.css");
          console.log(`[compile-vite] Auto-injected src/index.css with Tailwind directives`);
        }
      }

      // Ensure tailwind.config.js exists
      if (!existingPaths.has('tailwind.config.js') && !existingPaths.has('tailwind.config.ts')) {
        files.push({
          path: "tailwind.config.js",
          content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n};\n`,
        });
        existingPaths.add("tailwind.config.js");
        console.log(`[compile-vite] Auto-injected tailwind.config.js`);
      }

      // Ensure postcss.config.js exists
      if (!existingPaths.has('postcss.config.js') && !existingPaths.has('postcss.config.ts')) {
        files.push({
          path: "postcss.config.js",
          content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n`,
        });
        existingPaths.add("postcss.config.js");
        console.log(`[compile-vite] Auto-injected postcss.config.js`);
      }
    }

    // ── Inject Tailwind CDN into existing index.html as runtime fallback ──
    const existingIndexHtml = files.find((f: any) => f.path === "index.html");
    if (existingIndexHtml && hasTailwindClasses && typeof existingIndexHtml.content === 'string') {
      if (!existingIndexHtml.content.includes('cdn.tailwindcss.com')) {
        existingIndexHtml.content = existingIndexHtml.content.replace(
          '</head>',
          `<script src="https://cdn.tailwindcss.com"><\/script>\n</head>`
        );
        console.log(`[compile-vite] Injected Tailwind CDN fallback into existing index.html`);
      }
    }

    // Auto-inject index.html if missing
    const hasIndexHtml = files.some((f: any) => f.path === "index.html");
    if (!hasIndexHtml) {
      const mainEntry = files.find((f: any) =>
        f.path === "src/main.tsx" || f.path === "src/main.ts"
      );
      const entryPath = mainEntry ? `/${mainEntry.path}` : "/src/App.tsx";
      
      let cssFile = files.find((f: any) =>
        f.path === "src/index.css" || f.path === "src/styles.css" || f.path === "src/App.css" ||
        f.path === "styles.css" || f.path === "index.css"
      );

      if (!mainEntry) {
        const appInSrc = files.some((f: any) => f.path === "src/App.tsx" || f.path === "src/App.ts");
        const appAtRoot = files.some((f: any) => f.path === "App.tsx" || f.path === "App.ts");
        
        if (appAtRoot && !appInSrc) {
          const appFile = files.find((f: any) => f.path === "App.tsx" || f.path === "App.ts");
          if (appFile) {
            files.push({
              path: `src/${appFile.path}`,
              content: appFile.content,
            });
            existingPaths.add(`src/${appFile.path}`);
            console.log(`[compile-vite] Mirrored ${appFile.path} → src/${appFile.path}`);
          }
          const rootCss = files.find((f: any) => f.path === "styles.css");
          if (rootCss) {
            files.push({ path: "src/styles.css", content: rootCss.content });
            existingPaths.add("src/styles.css");
          }
        }
        
        if (appInSrc || appAtRoot) {
          const cssImport = cssFile
            ? `import './${(cssFile.path.startsWith('src/') ? cssFile.path.slice(4) : cssFile.path)}';\n`
            : '';
          files.push({
            path: "src/main.tsx",
            content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n${cssImport}ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`
          });
          existingPaths.add("src/main.tsx");
        }
      }

      // Include Tailwind CDN as runtime fallback
      const tailwindFallback = hasTailwindClasses ? `<script src="https://cdn.tailwindcss.com"><\/script>\n` : '';

      files.push({
        path: "index.html",
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<title>App</title>\n${tailwindFallback}</head>\n<body>\n<div id="root"></div>\n<script type="module" src="${mainEntry ? entryPath : '/src/main.tsx'}"></script>\n</body>\n</html>`
      });
      existingPaths.add("index.html");
      console.log(`[compile-vite] Auto-injected index.html${hasTailwindClasses ? ' + Tailwind CDN' : ''}`);
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
      // Single retry on network/timeout — no cascading
      const isRetryable = firstErr.name === "AbortError" || /fetch|network/i.test(firstErr.message);
      if (!isRetryable) throw firstErr;

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
      const errText = result?.error || 'Unknown error';
      console.error(`[compile-vite] Sandbox error (${response!.status}):`, errText);

      // Graceful degradation: ALWAYS return 200 with fallback:true so the client
      // can immediately switch to worker compilation instead of surfacing a hard
      // runtime error (503/504). This covers both toolchain issues AND build errors.
      return new Response(
        JSON.stringify({
          error: errText,
          fallback: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const t0 = Date.now();

    // ── Post-process: inject importmap for bare imports left by sandbox ──
    // The sandbox may externalize react/react-dom (its Vite config has them
    // as externals).  Rather than fighting that, inject an importmap so the
    // browser can resolve the bare specifiers via esm.sh CDN.
    if (typeof result.html === 'string' && result.html.length > 0) {
      result.html = injectImportMapIfNeeded(result.html, detectedPackages);
    }

    console.log(`[compile-vite] Success: ${result.html?.length || 0} chars`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    console.error(`[compile-vite] ${isTimeout ? "Timeout" : "Error"}:`, err.message);

    // Always return 200 with fallback so client uses worker compiler
    return new Response(
      JSON.stringify({
        error: isTimeout ? "Vite sandbox timed out" : err.message,
        fallback: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
