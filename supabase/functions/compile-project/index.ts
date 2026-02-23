import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──
interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

interface CompileOptions {
  supabaseConfig?: { url: string; anonKey: string } | null;
  stripeConfig?: { publishableKey: string } | null;
  envVars?: { key: string; value: string }[];
  userPackages?: { name: string; version: string; cdnUrl: string }[];
}

// ── CDN URLs ──
const CDN = {
  react: "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
  reactDom: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
  tailwind: "https://cdn.tailwindcss.com",
};

const ESM_SH = "https://esm.sh";

const DEFAULT_PACKAGES = [
  { name: "lucide-react", version: "0.462.0", cdnUrl: `${ESM_SH}/lucide-react@0.462.0?external=react` },
  { name: "date-fns", version: "3.6.0", cdnUrl: `${ESM_SH}/date-fns@3.6.0` },
  { name: "recharts", version: "3.1.0", cdnUrl: `${ESM_SH}/recharts@3.1.0?external=react,react-dom` },
  { name: "framer-motion", version: "12.23.0", cdnUrl: `${ESM_SH}/framer-motion@12.23.0?external=react,react-dom` },
  { name: "react-router-dom", version: "6.26.2", cdnUrl: `${ESM_SH}/react-router-dom@6.26.2?external=react,react-dom` },
  { name: "clsx", version: "2.1.1", cdnUrl: `${ESM_SH}/clsx@2.1.1` },
  { name: "zustand", version: "4.5.5", cdnUrl: `${ESM_SH}/zustand@4.5.5?external=react` },
  { name: "axios", version: "1.7.7", cdnUrl: `${ESM_SH}/axios@1.7.7` },
  { name: "zod", version: "3.23.8", cdnUrl: `${ESM_SH}/zod@3.23.8` },
  { name: "sonner", version: "2.0.6", cdnUrl: `${ESM_SH}/sonner@2.0.6?external=react,react-dom` },
  { name: "class-variance-authority", version: "0.7.1", cdnUrl: `${ESM_SH}/class-variance-authority@0.7.1` },
  { name: "tailwind-merge", version: "2.5.2", cdnUrl: `${ESM_SH}/tailwind-merge@2.5.2` },
  { name: "@tanstack/react-query", version: "5.56.2", cdnUrl: `${ESM_SH}/@tanstack/react-query@5.56.2?external=react` },
  { name: "react-hook-form", version: "7.53.0", cdnUrl: `${ESM_SH}/react-hook-form@7.53.0?external=react` },
  { name: "react-icons", version: "5.4.0", cdnUrl: `${ESM_SH}/react-icons@5.4.0?external=react` },
  { name: "@headlessui/react", version: "2.2.0", cdnUrl: `${ESM_SH}/@headlessui/react@2.2.0?external=react,react-dom` },
  { name: "uuid", version: "11.0.5", cdnUrl: `${ESM_SH}/uuid@11.0.5` },
  { name: "lodash-es", version: "4.17.21", cdnUrl: `${ESM_SH}/lodash-es@4.17.21` },
  { name: "dayjs", version: "1.11.13", cdnUrl: `${ESM_SH}/dayjs@1.11.13` },
  { name: "@radix-ui/react-slot", version: "1.1.0", cdnUrl: `${ESM_SH}/@radix-ui/react-slot@1.1.0?external=react` },
  { name: "@radix-ui/react-icons", version: "1.3.2", cdnUrl: `${ESM_SH}/@radix-ui/react-icons@1.3.2?external=react` },
  { name: "react-hot-toast", version: "2.4.1", cdnUrl: `${ESM_SH}/react-hot-toast@2.4.1?external=react,react-dom` },
  { name: "cmdk", version: "1.0.0", cdnUrl: `${ESM_SH}/cmdk@1.0.0?external=react,react-dom` },
];

// ── esbuild (lazy, singleton) ──
let esbuildMod: typeof import("https://deno.land/x/esbuild@v0.20.1/wasm.js") | null = null;
let esbuildReady = false;
let esbuildFailed = false;

async function ensureEsbuild() {
  if (esbuildReady) return true;
  if (esbuildFailed) return false;
  try {
    esbuildMod = await import("https://deno.land/x/esbuild@v0.20.1/wasm.js");
    await esbuildMod.initialize({ worker: false });
    esbuildReady = true;
    console.log("[esbuild] WASM initialized");
    return true;
  } catch (err: any) {
    if (err.message?.includes("Cannot call") || err.message?.includes("already")) {
      esbuildReady = true;
      return true;
    }
    console.warn("[esbuild] Init failed, using regex fallback:", err.message);
    esbuildFailed = true;
    return false;
  }
}

// ── esbuild transform ──
async function transformWithEsbuild(code: string, filePath: string): Promise<string> {
  if (!esbuildMod) throw new Error("esbuild not loaded");
  const loader = filePath.endsWith(".tsx") ? "tsx" as const
    : filePath.endsWith(".jsx") ? "jsx" as const
    : filePath.endsWith(".ts") ? "ts" as const
    : "js" as const;

  const result = await esbuildMod.transform(code, {
    loader,
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    target: "es2020",
    format: "esm",
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        jsx: "react",
        target: "ES2020",
        module: "ESNext",
        experimentalDecorators: true,
        verbatimModuleSyntax: false,
      },
    }),
  });
  return result.code;
}

// ── Regex fallback transformer (when esbuild WASM fails) ──
function transformWithRegex(code: string, filePath: string): string {
  let out = code;

  // Strip import type / export type
  out = out.replace(/^import\s+type\s+.*?;?\s*$/gm, "");
  out = out.replace(/^export\s+type\s+.*?;?\s*$/gm, "");
  out = out.replace(/^export\s+interface\s+\w+[\s\S]*?^\}/gm, "");

  // Strip inline type annotations (simplified)
  // Remove `: Type` after parameter names and before = or , or )
  out = out.replace(/:\s*(?:React\.\w+(?:<[^>]*>)?|\w+(?:<[^>]*>)?(?:\[\])?)\s*(?=[,)=\n{])/g, " ");

  // Strip `as Type` casts
  out = out.replace(/\s+as\s+\w+(?:<[^>]*>)?/g, "");

  // Strip angle-bracket type params on functions: <T>(
  out = out.replace(/<[A-Z]\w*(?:\s+extends\s+\w+)?(?:\s*,\s*[A-Z]\w*(?:\s+extends\s+\w+)?)*>\s*(?=\()/g, "");

  // Strip interface/type declarations
  out = out.replace(/^(?:export\s+)?interface\s+\w+[\s\S]*?^\}/gm, "");
  out = out.replace(/^(?:export\s+)?type\s+\w+\s*(?:<[^>]*>)?\s*=\s*[^;]+;/gm, "");

  // Transform JSX if tsx/jsx
  if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
    // Self-closing tags: <Comp prop="val" />
    out = out.replace(/<(\w+)([^>]*?)\/>/g, (_m, tag, attrs) => {
      const props = parseJSXAttrs(attrs);
      return `React.createElement(${resolveJSXTag(tag)}, ${props})`;
    });

    // For complex JSX, we rely on the browser having React globals
    // This regex fallback is intentionally simple — it handles ~80% of cases
    // Full JSX transformation would require a proper parser
  }

  return out;
}

function resolveJSXTag(tag: string): string {
  // Lowercase = HTML element, uppercase = component
  return /^[a-z]/.test(tag) ? `"${tag}"` : tag;
}

function parseJSXAttrs(attrs: string): string {
  const trimmed = attrs.trim();
  if (!trimmed) return "null";
  // Simplified: just return null for regex fallback (props will be lost but app renders)
  return "null";
}

// ── Unified transform function ──
async function transformFile(code: string, filePath: string): Promise<string> {
  if (esbuildReady && esbuildMod) {
    try {
      return await transformWithEsbuild(code, filePath);
    } catch (err: any) {
      console.warn(`[esbuild] Transform failed for ${filePath}, using regex:`, err.message);
    }
  }
  return transformWithRegex(code, filePath);
}

// ── Module Map with index file resolution ──
function buildModuleMap(files: ProjectFile[]): Map<string, ProjectFile> {
  const map = new Map<string, ProjectFile>();
  for (const f of files) {
    // Exact path
    map.set(f.path, f);

    // Without extension
    const noExt = f.path.replace(/\.(tsx?|jsx?)$/, "");
    if (!map.has(noExt)) map.set(noExt, f);

    // With ./ prefix
    map.set(`./${f.path}`, f);
    map.set(`./${noExt}`, f);

    // @/ alias
    if (f.path.startsWith("src/")) {
      const alias = f.path.replace(/^src\//, "@/");
      map.set(alias, f);
      map.set(alias.replace(/\.(tsx?|jsx?)$/, ""), f);
    } else {
      map.set(`@/${f.path}`, f);
      map.set(`@/${noExt}`, f);
    }

    // Bare stem (last resort, no conflict overwrite)
    const stem = f.path.split("/").pop()?.replace(/\.\w+$/, "") || "";
    if (stem && !map.has(stem)) map.set(stem, f);

    // Index file resolution: if path is dir/index.tsx, register dir/ as well
    const basename = f.path.split("/").pop() || "";
    if (/^index\.(tsx?|jsx?)$/.test(basename)) {
      const dir = f.path.substring(0, f.path.lastIndexOf("/"));
      if (dir && !map.has(dir)) {
        map.set(dir, f);
        map.set(`./${dir}`, f);
        if (dir.startsWith("src/")) {
          map.set(dir.replace(/^src\//, "@/"), f);
        }
      }
    }
  }
  return map;
}

// ── Import Rewriting ──
const REACT_EXPORTS = new Set([
  "useState", "useEffect", "useCallback", "useMemo", "useRef", "useContext",
  "createContext", "memo", "forwardRef", "Fragment", "useReducer", "useLayoutEffect",
  "useId", "useSyncExternalStore", "useTransition", "useDeferredValue",
  "useInsertionEffect", "createElement", "Children", "cloneElement", "isValidElement",
  "Suspense", "lazy", "StrictMode", "Component", "PureComponent", "createRef",
  "startTransition",
]);

function rewriteImports(
  code: string,
  filePath: string,
  moduleMap: Map<string, ProjectFile>,
): { code: string; externalPackages: string[] } {
  const usedExternalPackages = new Set<string>();

  // Strip type-only imports that esbuild might have left
  code = code.replace(/^import\s+type\s+.*?;?\s*$/gm, "");

  // Handle namespace imports: import * as X from '...'
  code = code.replace(
    /^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
    (_match, alias, specifier) => {
      if (specifier === "react") return `const ${alias} = React;`;
      if (specifier === "react-dom" || specifier === "react-dom/client") return `const ${alias} = ReactDOM;`;
      if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
        const importVar = `__pkg_${specifier.replace(/[^a-zA-Z0-9]/g, "_")}`;
        usedExternalPackages.add(specifier);
        return `var ${alias} = window.${importVar} || {};`;
      }
      const resolved = resolveSpecifier(specifier, moduleMap);
      return `const ${alias} = __modules['${resolved}'] || {};`;
    }
  );

  // Handle standard imports
  code = code.replace(
    /^import\s+(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
    (_match, defaultImport, namedImports, specifier) => {
      // React
      if (specifier === "react") {
        return rewriteReactImport(defaultImport, namedImports);
      }
      // ReactDOM
      if (specifier === "react-dom" || specifier === "react-dom/client") {
        return rewriteReactDOMImport(defaultImport, namedImports);
      }
      // JSX runtime
      if (specifier === "react/jsx-runtime" || specifier === "react/jsx-dev-runtime") {
        return rewriteJSXRuntime(namedImports);
      }
      // External package
      if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
        return rewriteExternalImport(specifier, defaultImport, namedImports, usedExternalPackages);
      }
      // Local module
      return rewriteLocalImport(specifier, defaultImport, namedImports, moduleMap);
    }
  );

  // Side-effect imports (CSS/asset imports are stripped)
  code = code.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, "");

  // Re-exports: export * from
  code = code.replace(
    /^export\s*\*\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
    (_match, specifier) => {
      const resolved = resolveSpecifier(specifier, moduleMap);
      return `Object.assign(__modules['${filePath}'] || (__modules['${filePath}'] = {}), __modules['${resolved}'] || {});`;
    }
  );

  // Re-exports: export { X } from
  code = code.replace(
    /^export\s*\{([^}]+)\}\s*from\s+['"]([^'"]+)['"];?\s*$/gm,
    (_match, names, specifier) => {
      const resolved = resolveSpecifier(specifier, moduleMap);
      const pairs = parseNamedImports(names);
      const lines = [`__modules['${filePath}'] = __modules['${filePath}'] || {};`];
      for (const { orig, alias } of pairs) {
        lines.push(`__modules['${filePath}']['${alias}'] = (__modules['${resolved}'] || {})['${orig}'];`);
      }
      return lines.join("\n");
    }
  );

  // Default exports
  code = code.replace(/^export\s+default\s+((?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>)/gm, "const __DefaultExport = $1");
  code = code.replace(/^export\s+default\s+function\s*\(/gm, "const __DefaultExport = function(");
  code = code.replace(/^export\s+default\s+(\{)/gm, "const __DefaultExport = $1");
  code = code.replace(
    /^export\s+default\s+(?:function\s+(\w+)|class\s+(\w+)|(\w+))/gm,
    (_match, fnName, className, varName) => {
      const name = fnName || className || varName;
      if (fnName) return `function ${name}`;
      if (className) return `class ${name}`;
      return name;
    }
  );

  // Named export blocks: export { ... }
  code = code.replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, "");

  // Named export declarations
  const exportedNames: string[] = [];
  code = code.replace(
    /^export\s+((?:const|let|var|function|class)\s+(\w+))/gm,
    (_match, declaration, name) => {
      exportedNames.push(name);
      return declaration;
    }
  );

  // Dynamic imports of local modules
  code = code.replace(
    /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
    (_match, specifier) => {
      const resolved = resolveSpecifier(specifier, moduleMap);
      return `Promise.resolve(__modules['${resolved}'] || {})`;
    }
  );

  // Module registration
  const hasAnonymousDefault = /const __DefaultExport\s*=/.test(code);
  const defaultMatch = code.match(/^(?:function|class)\s+(\w+)/m);
  const defaultExport = hasAnonymousDefault ? "__DefaultExport" : defaultMatch?.[1];
  const registration: string[] = [];

  registration.push(`__modules['${filePath}'] = __modules['${filePath}'] || {};`);
  if (defaultExport) {
    registration.push(`__modules['${filePath}'].default = typeof ${defaultExport} !== 'undefined' ? ${defaultExport} : undefined;`);
  }
  for (const name of exportedNames) {
    registration.push(`__modules['${filePath}']['${name}'] = typeof ${name} !== 'undefined' ? ${name} : undefined;`);
  }

  // Also register under aliases so consumers find the module
  const noExt = filePath.replace(/\.(tsx?|jsx?)$/, "");
  registration.push(`__modules['${noExt}'] = __modules['${filePath}'];`);
  registration.push(`__modules['./${filePath}'] = __modules['${filePath}'];`);
  registration.push(`__modules['./${noExt}'] = __modules['${filePath}'];`);
  if (filePath.startsWith("src/")) {
    const alias = filePath.replace(/^src\//, "@/");
    registration.push(`__modules['${alias}'] = __modules['${filePath}'];`);
    registration.push(`__modules['${alias.replace(/\.(tsx?|jsx?)$/, "")}'] = __modules['${filePath}'];`);
  }

  return {
    code: `/* === ${filePath} === */\n(function() {\ntry {\n${code}\n${registration.join("\n")}\n} catch(__e) { console.error('[Module ${filePath}]', __e.message); }\n})();`,
    externalPackages: Array.from(usedExternalPackages),
  };
}

// ── Import Rewrite Helpers ──
function resolveSpecifier(specifier: string, moduleMap: Map<string, ProjectFile>): string {
  const resolved = moduleMap.get(specifier) ||
    moduleMap.get(specifier.replace(/^\.\//, "")) ||
    moduleMap.get(specifier.replace(/\.\w+$/, ""));
  return resolved?.path || specifier;
}

function parseNamedImports(raw: string): { orig: string; alias: string }[] {
  return raw.split(",").map((n) => {
    const [orig, alias] = n.trim().split(/\s+as\s+/);
    return { orig: orig.trim(), alias: (alias || orig).trim() };
  });
}

function rewriteReactImport(defaultImport: string | undefined, namedImports: string | undefined): string {
  const parts: string[] = [];
  if (defaultImport && defaultImport !== "React") parts.push(`const ${defaultImport} = React;`);
  if (namedImports) {
    for (const { orig, alias } of parseNamedImports(namedImports)) {
      if (alias !== orig || !REACT_EXPORTS.has(alias)) {
        parts.push(`const ${alias} = React.${orig};`);
      }
    }
  }
  return parts.join("\n");
}

function rewriteReactDOMImport(defaultImport: string | undefined, namedImports: string | undefined): string {
  const parts: string[] = [];
  if (defaultImport && defaultImport !== "ReactDOM") parts.push(`const ${defaultImport} = ReactDOM;`);
  if (namedImports) {
    for (const { orig, alias } of parseNamedImports(namedImports)) {
      parts.push(`const ${alias} = ReactDOM.${orig};`);
    }
  }
  return parts.join("\n");
}

function rewriteJSXRuntime(namedImports: string | undefined): string {
  if (!namedImports) return "";
  const parts: string[] = [];
  for (const { orig, alias } of parseNamedImports(namedImports)) {
    if (orig === "jsx" || orig === "jsxs" || orig === "jsxDEV") {
      parts.push(`const ${alias} = React.createElement;`);
    } else if (orig === "Fragment") {
      parts.push(`const ${alias} = React.Fragment;`);
    }
  }
  return parts.join("\n");
}

function rewriteExternalImport(
  specifier: string,
  defaultImport: string | undefined,
  namedImports: string | undefined,
  usedExternal: Set<string>,
): string {
  const importVar = `__pkg_${specifier.replace(/[^a-zA-Z0-9]/g, "_")}`;
  usedExternal.add(specifier);
  const parts: string[] = [];
  if (defaultImport) {
    parts.push(`var ${defaultImport} = (window.${importVar} || {}).default || window.${importVar} || {};`);
  }
  if (namedImports) {
    const destructure = parseNamedImports(namedImports)
      .map(({ orig, alias }) => alias !== orig ? `${orig}: ${alias}` : orig)
      .join(", ");
    parts.push(`var { ${destructure} } = window.${importVar} || {};`);
  }
  return parts.length > 0 ? parts.join("\n") : `// [external] ${specifier}`;
}

function rewriteLocalImport(
  specifier: string,
  defaultImport: string | undefined,
  namedImports: string | undefined,
  moduleMap: Map<string, ProjectFile>,
): string {
  const moduleKey = resolveSpecifier(specifier, moduleMap);
  const parts: string[] = [];
  if (defaultImport) {
    parts.push(`const ${defaultImport} = __modules['${moduleKey}']?.default || __modules['${moduleKey}'];`);
  }
  if (namedImports) {
    const destructure = parseNamedImports(namedImports)
      .map(({ orig, alias }) => alias !== orig ? `${orig}: ${alias}` : orig)
      .join(", ");
    parts.push(`const { ${destructure} } = __modules['${moduleKey}'] || {};`);
  }
  return parts.join("\n");
}

// ── Dependency Sort ──
function sortByDependency(files: ProjectFile[], moduleMap: Map<string, ProjectFile>): ProjectFile[] {
  const graph = new Map<string, Set<string>>();
  const fileSet = new Set(files.map((f) => f.path));

  for (const f of files) {
    const deps = new Set<string>();
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(f.content)) !== null) {
      const specifier = match[1];
      if (!specifier.startsWith(".") && !specifier.startsWith("/") && !specifier.startsWith("@/")) continue;
      const resolved = moduleMap.get(specifier) ||
        moduleMap.get(specifier.replace(/^\.\//, "")) ||
        moduleMap.get(specifier.replace(/\.\w+$/, ""));
      if (resolved && fileSet.has(resolved.path)) {
        deps.add(resolved.path);
      }
    }
    graph.set(f.path, deps);
  }

  const visited = new Set<string>();
  const ordered: string[] = [];
  const visit = (path: string) => {
    if (visited.has(path)) return;
    visited.add(path);
    const deps = graph.get(path) || new Set();
    for (const dep of deps) visit(dep);
    ordered.push(path);
  };
  for (const path of fileSet) visit(path);

  const fileMap = new Map(files.map((f) => [f.path, f]));
  return ordered.map((p) => fileMap.get(p)!).filter(Boolean);
}

// ── CSS @import resolution ──
function resolveCSSimports(cssContent: string, cssPath: string, allFiles: ProjectFile[]): string {
  return cssContent.replace(
    /@import\s+['"]([^'"]+)['"];?\s*/g,
    (_match, importPath) => {
      const dir = cssPath.includes("/") ? cssPath.substring(0, cssPath.lastIndexOf("/") + 1) : "";
      const resolvedPath = importPath.startsWith("./")
        ? dir + importPath.slice(2)
        : importPath.startsWith("/")
          ? importPath.slice(1)
          : dir + importPath;
      const importedFile = allFiles.find((f) =>
        f.path === resolvedPath || f.path === importPath || f.path === importPath.replace(/^\.\//, "")
      );
      if (importedFile) {
        return `/* @import inlined: ${importPath} */\n${importedFile.content}\n`;
      }
      return _match;
    }
  );
}

// ── Response cache (same files → same HTML) ──
let lastInputHash = "";
let lastOutput: { html: string; componentCount: number; errors: string[] } | null = null;

function hashFiles(files: ProjectFile[]): string {
  // Simple fast hash: sorted paths + content lengths + first 64 chars
  return files
    .map((f) => `${f.path}:${f.content.length}:${f.content.slice(0, 64)}`)
    .sort()
    .join("|");
}

// ── Main compile function ──
async function compileProject(files: ProjectFile[], options?: CompileOptions): Promise<{ html: string; componentCount: number; errors: string[] }> {
  const t0 = Date.now();
  const errors: string[] = [];

  // Check cache
  const inputHash = hashFiles(files);
  if (inputHash === lastInputHash && lastOutput) {
    console.log(`[compile-project] Cache hit, ${lastOutput.html.length} chars`);
    return lastOutput;
  }

  // Try esbuild, fall back to regex
  const useEsbuild = await ensureEsbuild();
  if (!useEsbuild) {
    console.warn("[compile-project] Using regex fallback compiler");
  }

  const reactFiles = files
    .filter((f) => /\.(tsx?|jsx?)$/.test(f.path))
    .filter((f) => !/\.(test|spec)\.(tsx?|jsx?)$/.test(f.path))
    .filter((f) => !f.content.includes("from 'vitest'") && !f.content.includes('from "vitest"'));
  const cssFiles = files.filter((f) => f.language === "css" || f.language === "scss");

  if (reactFiles.length === 0) {
    return { html: "", componentCount: 0, errors: ["No React files found"] };
  }

  const moduleMap = buildModuleMap(files);
  const sorted = sortByDependency(reactFiles, moduleMap);

  // Phase 1: Transform all files (parallel)
  const transformResults = await Promise.allSettled(
    sorted.map(async (file) => {
      const transformed = await transformFile(file.content, file.path);
      return { file, transformed };
    })
  );

  // Phase 2: Rewrite imports
  const transpiledChunks: string[] = [];
  const allExternalPackages = new Set<string>();

  for (const result of transformResults) {
    if (result.status === "rejected") {
      errors.push(`Transform error: ${result.reason?.message || result.reason}`);
      continue;
    }
    const { file, transformed } = result.value;
    try {
      const rewritten = rewriteImports(transformed, file.path, moduleMap);
      transpiledChunks.push(rewritten.code);
      for (const pkg of rewritten.externalPackages) allExternalPackages.add(pkg);
    } catch (err: any) {
      errors.push(`Rewrite error in ${file.path}: ${err.message}`);
    }
  }

  const usesReactRouter = reactFiles.some((f) => /from\s+['"]react-router-dom['"]/.test(f.content));
  if (usesReactRouter) allExternalPackages.add("react-router-dom");

  const entryFile = files.find((f) => f.path === "main.tsx") ||
    files.find((f) => f.path === "src/main.tsx") ||
    files.find((f) => f.path === "index.tsx");
  const appFile = files.find((f) => f.path === "App.tsx") ||
    files.find((f) => f.path === "src/App.tsx") ||
    reactFiles.find((f) => /App\.(tsx|jsx)$/.test(f.path));

  let rootComponent = "App";
  if (appFile) {
    const defaultExport = appFile.content.match(/export\s+default\s+(?:function\s+|class\s+)?(\w+)/);
    if (defaultExport) rootComponent = defaultExport[1];
  }

  const hasEntryMount = entryFile && /createRoot|ReactDOM\.render/.test(entryFile.content);

  const errorBoundaryClass = `
    class __PreviewErrorBoundary extends React.Component {
      constructor(props) { super(props); this.state = { hasError: false, error: null }; }
      static getDerivedStateFromError(error) { return { hasError: true, error }; }
      componentDidCatch(error, info) { console.error('React Boundary:', error, info); window.parent.postMessage({ type: '__PREVIEW_ERROR__', error: { message: error.message, stack: info.componentStack, source: 'react-boundary', critical: true } }, '*'); }
      render() {
        if (this.state.hasError) {
          return React.createElement('div', { style: { padding: 40, color: '#ef4444', fontFamily: 'system-ui' } },
            React.createElement('h2', null, 'Runtime Error'),
            React.createElement('pre', { style: { whiteSpace: 'pre-wrap', marginTop: 12 } }, this.state.error?.message)
          );
        }
        return this.props.children;
      }
    }`;

  let mountScript: string;
  if (hasEntryMount) {
    mountScript = `
(function() {
  ${errorBoundaryClass}
  var _origCreateRoot = ReactDOM.createRoot.bind(ReactDOM);
  ReactDOM.createRoot = function(container, options) {
    var root = _origCreateRoot(container, options);
    var _origRender = root.render.bind(root);
    root.render = function(element) {
      _origRender(React.createElement(__PreviewErrorBoundary, null, element));
    };
    return root;
  };
})();`;
  } else {
    const routerWrapStart = usesReactRouter
      ? `var { MemoryRouter } = window.__pkg_react_router_dom || {};
    var wrappedElement = React.createElement(MemoryRouter, null, React.createElement(RootComponent));`
      : `var wrappedElement = React.createElement(RootComponent);`;

    mountScript = `
(function() {
try {
  var RootComponent = __modules['${appFile?.path || "App.tsx"}']?.default || 
                         __modules['App.tsx']?.default ||
                         (typeof ${rootComponent} !== 'undefined' ? ${rootComponent} : null);
  if (RootComponent) {
    ${routerWrapStart}
    ${errorBoundaryClass}
    var root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(__PreviewErrorBoundary, null, wrappedElement));
    window.parent.postMessage({ type: '__PREVIEW_READY__' }, '*');
  } else {
    document.getElementById('root').innerHTML = '<div style="padding:40px;text-align:center;color:#888;">No root component found. Export a default component from App.tsx.</div>';
  }
} catch(e) {
  console.error('React mount error:', e);
  document.getElementById('root').innerHTML = '<div style="padding:40px;color:#ef4444;"><h2>React Error</h2><pre>' + e.message + '</pre></div>';
  window.parent.postMessage({ type: '__PREVIEW_ERROR__', error: { message: e.message, stack: e.stack } }, '*');
}
})();`;
  }

  const allCSS = cssFiles.map((f) => {
    const resolved = resolveCSSimports(f.content, f.path, files);
    return `/* ${f.path} */\n${resolved}`;
  }).join("\n\n");

  const envObj: Record<string, string> = {};
  if (options?.envVars) {
    for (const v of options.envVars) {
      if (v.key) envObj[v.key] = v.value;
    }
  }

  const componentCount = reactFiles.filter((f) =>
    /(?:function|const)\s+\w+.*(?:=>|\{)[\s\S]*?(?:return\s*\(?\s*<|=>\s*\(?\s*<)/s.test(f.content)
  ).length;

  const usedPackages = DEFAULT_PACKAGES.filter((pkg) =>
    reactFiles.some((f) => f.content.includes(`from '${pkg.name}'`) || f.content.includes(`from "${pkg.name}"`))
  );
  const preloadHints = usedPackages.map((p) => `  <link rel="modulepreload" href="${p.cdnUrl}" />`).join("\n");

  const registryMap = new Map(DEFAULT_PACKAGES.map((p) => [p.name, p.cdnUrl]));
  if (options?.userPackages) {
    for (const p of options.userPackages) registryMap.set(p.name, p.cdnUrl);
  }
  for (const pkg of allExternalPackages) {
    if (!registryMap.has(pkg) && !["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"].includes(pkg)) {
      registryMap.set(pkg, `${ESM_SH}/${pkg}`);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React Preview</title>

${preloadHints}

  <script src="${CDN.tailwind}" onerror="console.warn('Tailwind CDN failed'); document.head.insertAdjacentHTML('beforeend', '<style>body{font-family:sans-serif;padding:20px;line-height:1.5}</style>')" onload="document.dispatchEvent(new Event('tailwind-ready'))"></script>

  <script crossorigin src="${CDN.react}"></script>
  <script crossorigin src="${CDN.reactDom}"></script>

  <script type="importmap">{
    "imports": {
      "react": "data:text/javascript,const R=window.React;export default R;export const{useState,useEffect,useCallback,useMemo,useRef,useContext,createContext,memo,forwardRef,Fragment,useReducer,useLayoutEffect,Children,cloneElement,isValidElement,createElement,Suspense,lazy,StrictMode,useId,useSyncExternalStore,useTransition,useDeferredValue,useInsertionEffect,startTransition,use,useOptimistic,useActionState,useFormStatus,cache,createRef,PureComponent,Component}=R;for(const __k in R)if(!({useState:1,useEffect:1,useCallback:1,useMemo:1,useRef:1,useContext:1,createContext:1,memo:1,forwardRef:1,Fragment:1,useReducer:1,useLayoutEffect:1,Children:1,cloneElement:1,isValidElement:1,createElement:1,Suspense:1,lazy:1,StrictMode:1,useId:1,useSyncExternalStore:1,useTransition:1,useDeferredValue:1,useInsertionEffect:1,startTransition:1,use:1,useOptimistic:1,useActionState:1,useFormStatus:1,cache:1,createRef:1,PureComponent:1,Component:1,default:1}[__k])&&R[__k]!==undefined)try{Object.defineProperty(exports,__k,{get:()=>R[__k],enumerable:true})}catch(e){}",
      "react/jsx-runtime": "data:text/javascript,const R=window.React;export const jsx=R.createElement;export const jsxs=R.createElement;export const Fragment=R.Fragment;",
      "react-dom": "data:text/javascript,const RD=window.ReactDOM;export default RD;export const{createRoot,createPortal,flushSync}=RD;",
      "react-dom/client": "data:text/javascript,export const{createRoot}=window.ReactDOM;",
      ${Array.from(registryMap.entries())
        .filter(([k]) => !["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"].includes(k))
        .map(([k, v]) => `"${k}": "${v}"`)
        .join(",\n      ")}
    }
  }</script>

  ${options?.supabaseConfig ? `
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script>
    const SUPABASE_URL = '${options.supabaseConfig.url}';
    const SUPABASE_ANON_KEY = '${options.supabaseConfig.anonKey}';
    window.__supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  </script>` : ""}

  ${options?.stripeConfig ? `
  <script src="https://js.stripe.com/v3/"></script>
  <script>const stripe = Stripe('${options.stripeConfig.publishableKey}');</script>` : ""}

  ${Object.keys(envObj).length > 0 ? `<script>
window.ENV = ${JSON.stringify(envObj)};
(function(){var m={};for(var k in window.ENV){var v=window.ENV[k];m[k]=/key|secret|token|password|auth/i.test(k)&&v.length>8?'****...'+v.slice(-6):v;}console.log('%c[ENV] Variables loaded:','color:#6ee7b7',m);})();
</script>` : ""}

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    ${allCSS}
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
  (function(){
    var __renderCount = 0;
    var __mountTime = Date.now();
    var __renderTimer = setInterval(function(){
      if (Date.now() - __mountTime < 3000) { __renderCount = 0; return; }
      if (__renderCount > 5000) {
        clearInterval(__renderTimer);
        window.parent.postMessage({ type: '__PREVIEW_ERROR__', error: { message: 'Infinite render loop detected.', critical: true } }, '*');
        var root = document.getElementById('root');
        if (root) root.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:system-ui"><h2>Render Loop Detected</h2></div>';
      }
      __renderCount = 0;
    }, 1000);
    var origCE = React.createElement;
    React.createElement = function() { __renderCount++; return origCE.apply(this, arguments); };
  })();
  </script>

  <script>
    window.__modules = {};
    const { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, memo, forwardRef, Fragment, useReducer, useLayoutEffect, useId, useSyncExternalStore, useTransition, useDeferredValue, useInsertionEffect } = React;
    const { createRoot, createPortal } = ReactDOM;
  </script>

  <script>
  document.getElementById('root').innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#888">' +
    '<div style="text-align:center"><div style="width:24px;height:24px;border:2px solid #8882;border-top-color:#888;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px"></div>' +
    '<p style="font-size:13px">Loading preview...</p></div></div>' +
    '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  </script>

  <script>
  var __iifeDone = false;
  (async function() {
    try {
      window.__modules = window.__modules || {};

      var __pkgErrors = [];
      ${Array.from(allExternalPackages).map((pkg) => {
        const varName = `__pkg_${pkg.replace(/[^a-zA-Z0-9]/g, "_")}`;
        return `window.${varName} = {};
      try {
        window.${varName} = await Promise.race([
          import('${pkg}'),
          new Promise(function(_, r) { setTimeout(function() { r(new Error('Import timeout: ${pkg}')); }, 8000); })
        ]);
      } catch(__e) {
        console.error('[Import] Failed to load ${pkg}:', __e.message);
        __pkgErrors.push('${pkg}: ' + __e.message);
      }`;
      }).join("\n      ")}
      if (__pkgErrors.length > 0) {
        console.warn('[Import] ' + __pkgErrors.length + ' package(s) failed:', __pkgErrors.join(', '));
      }

      // All code compiled server-side — no Babel needed
      var code = ${JSON.stringify(`
    var { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, memo, forwardRef, Fragment, useReducer, useLayoutEffect, useId, useSyncExternalStore, useTransition, useDeferredValue, useInsertionEffect, Suspense, lazy, StrictMode } = React;
    var { createRoot, createPortal, flushSync } = ReactDOM;
    ${options?.supabaseConfig ? `var supabase = window.__supabaseClient;` : ""}

    ${transpiledChunks.join("\n\n")}

    ${mountScript}
      `)};
      new Function(code)();
      __iifeDone = true;
    } catch(e) {
      __iifeDone = true;
      console.error('[Runtime] Execution error:', e.message);
      window.parent.postMessage({ type: '__PREVIEW_ERROR__', error: { message: 'Runtime Error: ' + e.message, source: 'esbuild-compiled', critical: true } }, '*');
      var root = document.getElementById('root');
      if (root) root.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:system-ui"><h2>Runtime Error</h2><pre style="white-space:pre-wrap;margin-top:12px;font-size:13px;color:#fca5a5">' + e.message + '</pre></div>';
    }
  })();
  setTimeout(function() {
    if (!__iifeDone && document.getElementById('root') && document.getElementById('root').innerHTML.indexOf('Loading preview') > -1) {
      document.getElementById('root').innerHTML =
        '<div style="padding:40px;text-align:center;font-family:system-ui;color:#f59e0b"><h2>Preview timed out</h2><p style="color:#888;margin-top:8px">External packages took too long to load.</p></div>';
    }
  }, 20000);
  </script>

  <script>
  (function(){
    try {
      var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) document.documentElement.classList.add('dark');
      document.documentElement.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
    } catch(e){}
  })();
  </script>

  <script>
  (function(){
    var OrigWorker = window.Worker;
    window.Worker = function(url, opts) {
      if (window.__modules && typeof url === 'string' && !url.startsWith('blob:') && !url.startsWith('http')) {
        var workerContent = null;
        for (var key in window.__modules) {
          if (key.endsWith(url) || key === url) {
            workerContent = window.__modules[key]?.default || '';
            break;
          }
        }
        if (workerContent && typeof workerContent === 'string') {
          var blob = new Blob([workerContent], { type: 'application/javascript' });
          url = URL.createObjectURL(blob);
        }
      }
      return new OrigWorker(url, opts);
    };
  })();
  </script>

  <script>
  (function(){
    if(window.__builderInjected) return;
    window.__builderInjected = true;
    var origConsole = { log: console.log, warn: console.warn, error: console.error, info: console.info, debug: console.debug };
    var seenMessages = {};
    ['log','warn','error','info','debug'].forEach(function(level){
      console[level] = function(){
        origConsole[level].apply(console, arguments);
        try {
          var msg = Array.prototype.slice.call(arguments).map(function(a){ return typeof a === 'object' ? JSON.stringify(a,null,2) : String(a); }).join(' ');
          var key = level + ':' + msg;
          var now = Date.now();
          if (seenMessages[key] && now - seenMessages[key] < 500) return;
          seenMessages[key] = now;
          window.parent.postMessage({ type: '__CONSOLE_LOG__', level: level, message: msg, timestamp: now }, '*');
        } catch(e){}
      };
    });
    window.onerror = function(msg, src, line, col, err) {
      window.parent.postMessage({ type: '__PREVIEW_ERROR__', error: { message: String(msg), source: src, line: line, column: col, stack: err && err.stack } }, '*');
    };
    window.addEventListener('unhandledrejection', function(e) {
      window.parent.postMessage({ type: '__PREVIEW_ERROR__', error: { message: 'Unhandled Promise: ' + (e.reason?.message || String(e.reason)), stack: e.reason?.stack } }, '*');
    });
  })();
  </script>
</body>
</html>`;

  const output = { html, componentCount, errors };

  // Cache result
  lastInputHash = inputHash;
  lastOutput = output;

  console.log(`[compile-project] ${useEsbuild ? 'esbuild' : 'regex'} compiled ${reactFiles.length} files in ${Date.now() - t0}ms, HTML: ${html.length} chars`);
  return output;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, options } = await req.json() as { files: ProjectFile[]; options?: CompileOptions };

    if (!files || !Array.isArray(files)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'files' array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await compileProject(files, options);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[compile-project] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message, html: "", componentCount: 0, errors: [err.message] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
