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

  // Seed React baseline so externalized packages (framer-motion, recharts,
  // react-router-dom, sonner, ...) can resolve their internal
  // `react/jsx-runtime` reference. Without this, the browser throws
  // "The specifier 'react/jsx-runtime' was a bare specifier" at runtime.
  for (const baseline of ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime']) {
    barePackages.add(baseline);
  }

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
      // For other packages: put version after base package, subpath after.
      // Pin well-known packages to tested versions and use ?bundle for icon
      // libraries so every named export (e.g. lucide-react Twitter, Instagram)
      // is materialized in the wrapper module instead of relying on `latest`.
      const PINNED: Record<string, { version: string; bundle?: boolean }> = {
        'lucide-react': { version: '0.462.0', bundle: true },
        'framer-motion': { version: '11.11.17' },
        'recharts': { version: '2.13.3' },
        'date-fns': { version: '3.6.0' },
        'react-router-dom': { version: '6.28.0' },
        'sonner': { version: '1.7.0' },
        'clsx': { version: '2.1.1' },
        'tailwind-merge': { version: '2.5.4' },
      };
      const parts = pkg.split('/');
      const basePkg = pkg.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
      const subpath = pkg.startsWith('@') ? parts.slice(2).join('/') : parts.slice(1).join('/');
      const pin = PINNED[basePkg];
      const version = pin?.version ?? 'latest';
      const query = pin?.bundle
        ? `?bundle&external=react,react-dom`
        : `?external=react,react-dom`;
      const url = subpath
        ? `https://esm.sh/${basePkg}@${version}/${subpath}${query}`
        : `https://esm.sh/${basePkg}@${version}${query}`;
      imports[pkg] = url;
    }
  }

  const importmapScript = `<script type="importmap">\n${JSON.stringify({ imports }, null, 2)}\n</script>`;

  // Inject before the first <script type="module"> (case-insensitive, quote-agnostic).
  const moduleScriptRe = /<script\b[^>]*type\s*=\s*["']module["'][^>]*>/i;
  const moduleScriptMatch = html.match(moduleScriptRe);
  if (!moduleScriptMatch || moduleScriptMatch.index === undefined) {
    // Fallback: inject in <head>
    return html.replace(/<\/head>/i, `${importmapScript}\n</head>`);
  }
  return html.slice(0, moduleScriptMatch.index) + importmapScript + '\n' + html.slice(moduleScriptMatch.index);
}

function findJsxTagEnd(content: string, start: number): number {
  let quote: '"' | "'" | '`' | null = null;
  let escaped = false;
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = start; i < content.length; i++) {
    const ch = content[i];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') {
      braceDepth++;
      continue;
    }
    if (ch === '}' && braceDepth > 0) {
      braceDepth--;
      continue;
    }
    if (ch === '(' && braceDepth > 0) {
      parenDepth++;
      continue;
    }
    if (ch === ')' && braceDepth > 0 && parenDepth > 0) {
      parenDepth--;
      continue;
    }
    if (ch === '[' && braceDepth > 0) {
      bracketDepth++;
      continue;
    }
    if (ch === ']' && braceDepth > 0 && bracketDepth > 0) {
      bracketDepth--;
      continue;
    }
    if (ch === '>' && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) return i;
  }

  return -1;
}

function parseMotionTokenAt(content: string, index: number):
  | { kind: 'open'; tag: string; end: number; selfClosing: boolean }
  | { kind: 'close'; tag: string | null; end: number }
  | null {
  const rest = content.slice(index);
  const closeMatch = rest.match(/^<\/motion(?:\.([A-Za-z][\w-]*))?\s*>/);
  if (closeMatch) {
    return { kind: 'close', tag: closeMatch[1] || null, end: index + closeMatch[0].length };
  }

  const openMatch = rest.match(/^<motion\.([A-Za-z][\w-]*)(?=[\s/>])/);
  if (!openMatch) return null;
  const tagEnd = findJsxTagEnd(content, index + openMatch[0].length);
  if (tagEnd === -1) return null;
  return {
    kind: 'open',
    tag: openMatch[1],
    end: tagEnd + 1,
    selfClosing: /\/\s*>$/.test(content.slice(index, tagEnd + 1)),
  };
}

function repairFramerMotionClosers(content: string): { content: string; count: number } {
  const events: Array<{ index: number; length: number; replacement: string }> = [];
  const stack: string[] = [];
  let i = 0;

  while (i < content.length) {
    const openIndex = content.indexOf('<', i);
    if (openIndex === -1) break;
    const parsed = parseMotionTokenAt(content, openIndex);
    if (!parsed) {
      i = openIndex + 1;
      continue;
    }

    if (parsed.kind === 'open') {
      if (!parsed.selfClosing) stack.push(parsed.tag);
      i = parsed.end;
      continue;
    }

    const expected = stack[stack.length - 1];
    if (!parsed.tag) {
      events.push({
        index: openIndex,
        length: parsed.end - openIndex,
        replacement: expected ? `</motion.${expected}>` : '',
      });
      if (expected) stack.pop();
    } else if (expected === parsed.tag) {
      stack.pop();
    } else {
      const matchingIndex = stack.lastIndexOf(parsed.tag);
      if (matchingIndex >= 0) {
        stack.length = matchingIndex;
      } else {
        events.push({ index: openIndex, length: parsed.end - openIndex, replacement: '' });
      }
    }

    i = parsed.end;
  }

  const alreadyHandled = new Set(events.map(e => e.index));
  const bareCloseRe = /<\/motion\s*>/g;
  let bareMatch: RegExpExecArray | null;
  while ((bareMatch = bareCloseRe.exec(content)) !== null) {
    if (!alreadyHandled.has(bareMatch.index)) {
      events.push({ index: bareMatch.index, length: bareMatch[0].length, replacement: '' });
    }
  }

  if (events.length === 0) return { content, count: 0 };
  events.sort((a, b) => b.index - a.index);
  let output = content;
  for (const event of events) {
    output = output.slice(0, event.index) + event.replacement + output.slice(event.index + event.length);
  }
  return { content: output, count: events.length };
}

function stripDanglingJsxAfterDefaultExport(content: string): { content: string; fixed: boolean } {
  const exportLineRe = /^[ \t]*export\s+default\s+[A-Za-z_$][\w$]*\s*;?[ \t]*(?:\/\/.*)?$/gm;
  let match: RegExpExecArray | null;
  let lastMatch: RegExpExecArray | null = null;

  while ((match = exportLineRe.exec(content)) !== null) {
    lastMatch = match;
  }

  if (!lastMatch || lastMatch.index === undefined) return { content, fixed: false };

  const lineEnd = content.indexOf('\n', lastMatch.index);
  const suffixStart = lineEnd === -1 ? content.length : lineEnd + 1;
  const suffix = content.slice(suffixStart);
  if (!looksLikeDanglingExportSuffix(suffix)) return { content, fixed: false };

  return { content: `${content.slice(0, suffixStart).trimEnd()}\n`, fixed: true };
}

function looksLikeDanglingExportSuffix(suffix: string): boolean {
  const trimmed = suffix.trim();
  if (!trimmed) return false;
  if (/^[\s`)\]},;]+$/.test(trimmed)) return /[`\])}]/.test(trimmed);
  if (!/^<\/?(?:[a-z][\w-]*|motion(?:\.[A-Za-z][\w-]*)?|>|\s)/i.test(trimmed)) return false;

  let rest = trimmed;
  const tagRe = /^(?:<\/?[a-z][\w-]*(?:\s[^<>]*)?>|<\/?motion(?:\.[A-Za-z][\w-]*)?\s*>|<>|<\/>)\s*/i;
  let tagCount = 0;

  while (rest.length > 0) {
    const tag = rest.match(tagRe);
    if (tag) {
      tagCount++;
      rest = rest.slice(tag[0].length).trimStart();
      continue;
    }

    const punctuation = rest.match(/^[)\]},;]+\s*/);
    if (punctuation) {
      rest = rest.slice(punctuation[0].length).trimStart();
      continue;
    }

    return false;
  }

  return tagCount > 0;
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

    // ── Health probe short-circuit (no sandbox call) ──
    if (body && body.__healthcheck === true) {
      return new Response(
        JSON.stringify({ ok: true, sandbox: !!SANDBOX_URL, ts: Date.now() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { files, options } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Defense in depth: repair the exact malformed framer-motion JSX that has
    // caused preview compile failures (`</motion></div>`). The client also runs
    // this repair, but the edge compiler must be able to sanitize any source
    // that reaches the sandbox.
    let framerMotionRepairCount = 0;
    for (const f of files) {
      if (!/\.(tsx|jsx)$/.test(f.path) || typeof f.content !== 'string') continue;
      const repaired = repairFramerMotionClosers(f.content);
      if (repaired.count > 0) {
        f.content = repaired.content;
        framerMotionRepairCount += repaired.count;
      }
    }
    if (framerMotionRepairCount > 0) {
      console.log(`[compile-vite] Repaired ${framerMotionRepairCount} malformed framer-motion closing tag(s)`);
    }

    // Absolute server-side shield: bare </motion> is invalid JSX and must never
    // reach esbuild, even if earlier client repair did not run.
    for (const f of files) {
      if (!/\.(tsx|jsx)$/.test(f.path) || typeof f.content !== 'string') continue;
      const before = f.content;
      f.content = f.content.replace(/<\/motion\s*>/gi, '');
      if (f.content !== before) {
        console.log(`[compile-vite] Removed invalid bare </motion> closer from ${f.path}`);
      }
    }

    // Final edge shield for malformed streamed output where orphan JSX closing
    // tags appear after `export default App;`. Such suffixes are always invalid
    // module syntax and can cause esbuild to fail before client repair can run.
    for (const f of files) {
      if (!/\.(tsx|jsx)$/.test(f.path) || typeof f.content !== 'string') continue;
      const stripped = stripDanglingJsxAfterDefaultExport(f.content);
      if (stripped.fixed) {
        f.content = stripped.content;
        console.log(`[compile-vite] Removed dangling JSX after export default from ${f.path}`);
      }
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

    // ── Ensure main.tsx/main.ts imports CSS if a CSS file exists ──
    const mainEntry = files.find((f: any) => f.path === 'src/main.tsx' || f.path === 'src/main.ts');
    if (mainEntry && typeof mainEntry.content === 'string') {
      const hasCssImport = /import\s+['"]\.\/(?:index|styles|App)\.css['"]/.test(mainEntry.content);
      if (!hasCssImport) {
        const cssFile = files.find((f: any) =>
          f.path === 'src/index.css' || f.path === 'src/styles.css' || f.path === 'src/App.css'
        );
        if (cssFile) {
          const cssName = cssFile.path.replace('src/', './');
          mainEntry.content = `import '${cssName}';\n${mainEntry.content}`;
          console.log(`[compile-vite] Auto-injected CSS import '${cssName}' into ${mainEntry.path}`);
        }
      }
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

      // Distinguish infrastructure failure vs. user-code build error so the client
      // can show the real diagnostic to the user / auto-heal instead of treating
      // every non-200 as "sandbox unavailable".
      const isBuildError =
        /\.(?:tsx?|jsx?|css|html)\b/i.test(errText) ||
        /\b(?:ERROR:|error TS|Unexpected|Unterminated|Cannot find|Module not found|is not exported|Transform failed|Expected|SyntaxError)\b/i.test(errText);

      if (isBuildError) {
        return new Response(
          JSON.stringify({ html: '', errors: [errText] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // True infrastructure failure (sandbox down, toolchain missing, etc.)
      return new Response(
        JSON.stringify({ error: errText, fallback: true }),
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
