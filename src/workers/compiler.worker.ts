// MUST be the very first import — shims `window` for React Refresh preamble
import './worker-window-shim';

/**
 * Compiler Web Worker — Gap 1 + Gap 2
 * 
 * Moves ALL compilation logic off the main thread.
 * Uses esbuild-wasm for TypeScript stripping (100x faster, zero edge-case bugs).
 * Falls back to regex-based stripping if esbuild fails to initialize.
 */

let esbuild: any = null;
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { DEFAULT_PACKAGES, type CDNPackageEntry } from './packageData';

// ── esbuild initialization ──
let esbuildReady = false;
let esbuildInitPromise: Promise<void> | null = null;

async function ensureEsbuild(): Promise<boolean> {
  if (esbuildReady) return true;
  if (!esbuildInitPromise) {
    // Wrap ENTIRE init (dynamic import + WASM download + initialize) in a single 8s budget.
    // Previously, only `esbuild.initialize` had a timeout — the `import('esbuild-wasm')`
    // dynamic import had NONE, causing the worker to hang for 35s+ on slow networks.
    esbuildInitPromise = Promise.race([
      (async () => {
        esbuild = await import('esbuild-wasm');
        await esbuild.initialize({
          wasmURL: 'https://unpkg.com/esbuild-wasm@0.27.3/esbuild.wasm',
          worker: false,
        });
        esbuildReady = true;
        console.info('[CompilerWorker] esbuild-wasm initialized');
      })(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('esbuild init timeout (8s)')), 8_000)
      ),
    ]).catch((err: any) => {
      console.warn('[CompilerWorker] esbuild-wasm failed, using regex fallback:', err?.message);
      esbuild = null;
      esbuildInitPromise = null;
    });
  }
  await esbuildInitPromise;
  return esbuildReady;
}

/** Strip TypeScript using esbuild.transform — fast and correct */
async function esbuildStripTypes(code: string, isTsx: boolean): Promise<string> {
  if (!esbuild) throw new Error('esbuild not loaded');
  const result = await esbuild.transform(code, {
    loader: isTsx ? 'tsx' : 'ts',
    // Only strip types, keep JSX as-is (Babel in the preview handles JSX→JS)
    jsx: 'preserve',
    target: 'es2020',
    // Keep imports/exports so our import resolver can process them
    format: 'esm',
  });
  return result.code;
}

// ── Types ──

export interface CompileRequest {
  type: 'compile';
  id: string;
  files: ProjectFile[];
  options?: {
    supabaseConfig?: { url: string; anonKey: string } | null;
    stripeConfig?: { publishableKey: string } | null;
    envVars?: { key: string; value: string }[];
    userPackages?: CDNPackageEntry[];
  };
}

export interface CompileResponse {
  type: 'compile-result';
  id: string;
  html: string;
  isReactProject: boolean;
  componentCount: number;
  errors: string[];
}

export interface CompileErrorResponse {
  type: 'compile-error';
  id: string;
  error: string;
}

export type WorkerMessage = CompileRequest;
export type WorkerResponse = CompileResponse | CompileErrorResponse;

// ── CDN URLs ──
const CDN = {
  babel: 'https://unpkg.com/@babel/standalone@7.26.5/babel.min.js',
  react: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  reactDom: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  tailwind: 'https://cdn.tailwindcss.com',
} as const;

// ── Module Map ──
function buildModuleMap(files: ProjectFile[]): Map<string, ProjectFile> {
  const map = new Map<string, ProjectFile>();
  for (const f of files) {
    map.set(f.path, f);
    const noExt = f.path.replace(/\.(tsx?|jsx?)$/, '');
    if (!map.has(noExt)) map.set(noExt, f);
    map.set(`./${f.path}`, f);
    map.set(`./${noExt}`, f);
    if (f.path.startsWith('src/')) {
      const alias = f.path.replace(/^src\//, '@/');
      map.set(alias, f);
      map.set(alias.replace(/\.(tsx?|jsx?)$/, ''), f);
    } else {
      map.set(`@/${f.path}`, f);
      map.set(`@/${noExt}`, f);
    }
    const stem = f.path.split('/').pop()?.replace(/\.\w+$/, '') || '';
    if (stem && !map.has(stem)) map.set(stem, f);
  }
  return map;
}

// ── Type Stripping ──
function stripTypeAnnotations(code: string): string {
  let result = code;

  // 1. Remove type-only imports entirely
  result = result.replace(/^import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  result = result.replace(/^import\s+type\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');

  // 2. Strip `type` prefix from mixed imports
  result = result.replace(/^(import\s+\{)([^}]+)(\}\s+from\s+['"][^'"]+['"];?\s*)$/gm, (_match, prefix, names, suffix) => {
    const filtered = names.split(',')
      .map((n: string) => n.trim())
      .filter((n: string) => !n.startsWith('type ') && n.length > 0);
    if (filtered.length === 0) return '';
    return `${prefix} ${filtered.join(', ')} ${suffix}`;
  });

  // 3. Strip interface, enum, and type alias blocks (brace-counted)
  const lines = result.split('\n');
  const outputLines: string[] = [];
  let stripping = false;
  let braceDepth = 0;

  for (const line of lines) {
    if (!stripping) {
      const trimmed = line.trim();
      if (/^(?:export\s+)?(?:interface|enum)\s+\w+/.test(trimmed) || 
          /^(?:export\s+)?type\s+\w+\s*(?:<[^>]*>)?\s*=\s*\{/.test(trimmed)) {
        stripping = true;
        braceDepth = 0;
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') braceDepth--;
        }
        if (braceDepth <= 0) stripping = false;
        continue;
      }
      outputLines.push(line);
    } else {
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      if (braceDepth <= 0) stripping = false;
    }
  }
  result = outputLines.join('\n');

  // 4. Strip single-line type aliases
  result = result.replace(/^(?:export\s+)?type\s+\w+\s*(?:<[^>]*>)?\s*=\s*[^;{]+;/gm, '');

  // 5. Strip return type annotations (before => or {)
  result = result.replace(
    /\)\s*:\s*[A-Za-z_][\w.]*(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?(?:\[\])?(?:\s*[|&]\s*[A-Za-z_][\w.]*(?:<(?:[^<>]|<[^<>]*>)*>)?(?:\[\])?)*(?=\s*(?:=>|\{))/g,
    ')'
  );

  // 6. Strip React-specific type annotations
  result = result.replace(
    /:\s*React\.(?:FC|ReactNode|MouseEvent|ChangeEvent|FormEvent|CSSProperties|RefObject|Dispatch|SetStateAction|MutableRefObject|HTMLAttributes|ComponentProps|ComponentType|ElementType|ReactElement|JSX\.Element)(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/g,
    ''
  );

  // 7. Strip primitive type annotations
  result = result.replace(
    /:\s*(?:string|number|boolean|void|any|null|undefined|never|unknown|object)(?:\s*[|&]\s*(?:string|number|boolean|void|any|null|undefined|never|unknown|object))*(?=\s*[=,;)\]}])/g,
    ''
  );

  // 8. Strip complex type annotations (e.g., : SomeType<X>)
  result = result.replace(
    /:\s*[A-Z][\w.]*(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?(?:\[\])?(?:\s*[|&]\s*(?:string|number|boolean|null|undefined|void|never|unknown|[A-Z][\w.]*)(?:\[\])?)*(?=\s*[=,;)\]}])/g,
    (match, offset) => {
      const before = result.slice(Math.max(0, offset - 30), offset);
      if (/[{,]\s*\w+\s*$/.test(before)) return match;
      return '';
    }
  );

  // 9. Preserve generic assignments (= <T>) but strip type generics on hooks
  const genericsMarker = '___GENERIC___';
  const genericsMap: string[] = [];
  result = result.replace(/=\s*<[A-Z][\w,\s]*>(?=\s*\()/g, (match) => {
    genericsMap.push(match);
    return `${genericsMarker}${genericsMap.length - 1}`;
  });
  result = result.replace(
    /\b(useState|useRef|useCallback|useMemo|useReducer|useContext|createContext|forwardRef|memo|lazy|useImperativeHandle|useLayoutEffect|Set|Map|Array|Promise|Record)\s*<((?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*)>/g,
    '$1'
  );
  result = result.replace(/(?<=\w)<(?:[A-Za-z][\w.]*(?:\[\])?(?:\s*\|\s*[\w.]+(?:\[\])?)*(?:\s*,\s*[\w.]+(?:\[\])?(?:\s*\|\s*[\w.]+)?)*)>/g, '');
  result = result.replace(new RegExp(`${genericsMarker}(\\d+)`, 'g'), (_, idx) => genericsMap[parseInt(idx)] || '');

  // 10. Strip `as X` casts and `satisfies X` / `as const`
  result = result.replace(/\s+as\s+const\b/g, '');
  result = result.replace(/\s+as\s+\w+(?:<[^>]+>)?/g, '');
  result = result.replace(/\s+satisfies\s+\w+(?:<[^>]+>)?/g, '');

  // 11. Strip `!` non-null assertions (common TS pattern: x!)
  result = result.replace(/(\w)!\./g, '$1.');
  result = result.replace(/(\w)!(?=[,;)\]}])/g, '$1');

  return result;
}

// ── Transpile File ──
async function transpileFile(file: ProjectFile, moduleMap: Map<string, ProjectFile>, useEsbuild: boolean): Promise<{ code: string; externalPackages: string[] }> {
  const usedExternalPackages = new Set<string>();
  let code = file.content;

  // Strip type-only imports and type prefixes from named imports
  code = code.replace(/^import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^import\s+type\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(
    /import\s*\{([^}]*)\}/gs,
    (_match, names) => {
      const cleaned = names
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(',')
        .map((n: string) => n.trim().replace(/^type\s+/, ''))
        .filter((n: string) => n.length > 0)
        .join(', ');
      return `import { ${cleaned} }`;
    }
  );

  if (file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
    if (useEsbuild) {
      try {
        code = await esbuildStripTypes(code, file.path.endsWith('.tsx'));
      } catch (e: any) {
        // Fallback to regex if esbuild fails on this file
        console.warn(`[CompilerWorker] esbuild failed for ${file.path}, using regex:`, e.message);
        code = stripTypeAnnotations(code);
      }
    } else {
      code = stripTypeAnnotations(code);
    }
  }

  const importLines: string[] = [];
  code = code.replace(
    /^import\s+(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
    (_match, defaultImport, namedImports, specifier) => {
      if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
        if (specifier === 'react') {
          const parts: string[] = [];
          if (defaultImport && defaultImport !== 'React') parts.push(`const ${defaultImport} = React;`);
          if (namedImports) {
            const names = namedImports.split(',').map((n: string) => n.trim().split(/\s+as\s+/));
            for (const [orig, alias] of names) {
              const target = (alias || orig).trim();
              if (target !== orig.trim() || !['useState','useEffect','useCallback','useMemo','useRef','useContext','createContext','memo','forwardRef','Fragment','useReducer','useLayoutEffect','useId','useSyncExternalStore','useTransition','useDeferredValue','useInsertionEffect','createElement','Children','cloneElement','isValidElement','Suspense','lazy','StrictMode','Component','PureComponent','createRef','startTransition'].includes(target)) {
                parts.push(`const ${target} = React.${orig.trim()};`);
              }
            }
          }
          return parts.join('\n');
        }
        if (specifier === 'react-dom' || specifier === 'react-dom/client') {
          if (defaultImport && defaultImport !== 'ReactDOM') return `const ${defaultImport} = ReactDOM;`;
          if (namedImports) {
            const names = namedImports.split(',').map((n: string) => n.trim().split(/\s+as\s+/));
            return names
              .filter(([orig, alias]: string[]) => {
                const target = (alias || orig).trim();
                return target !== orig.trim() || !['createRoot','hydrateRoot','render','hydrate','createPortal','flushSync','unmountComponentAtNode','findDOMNode'].includes(target);
              })
              .map(([orig, alias]: string[]) => `const ${(alias || orig).trim()} = ReactDOM.${orig.trim()};`)
              .join('\n');
          }
          return '';
        }
        // Gap 3: Clean import resolution via import maps — no Proxy fallbacks
        const importVar = `__pkg_${specifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
        usedExternalPackages.add(specifier);
        const parts: string[] = [];
        if (defaultImport) {
          parts.push(`var ${defaultImport} = (window.${importVar} || {}).default || window.${importVar} || {};`);
        }
        if (namedImports) {
          const names = namedImports.split(',').map((n: string) => n.trim().split(/\s+as\s+/));
          const destructure = names.map(([orig, alias]: string[]) => alias ? `${orig.trim()}: ${alias.trim()}` : orig.trim()).join(', ');
          parts.push(`var { ${destructure} } = window.${importVar} || {};`);
        }
        return parts.length > 0 ? parts.join('\n') : `// [external] ${specifier}`;
      }

      const resolved = moduleMap.get(specifier) ||
        moduleMap.get(specifier.replace(/^\.\//, '')) ||
        moduleMap.get(specifier.replace(/\.\w+$/, ''));
      const moduleKey = resolved?.path || specifier;

      const parts: string[] = [];
      if (defaultImport) {
        parts.push(`const ${defaultImport} = __modules['${moduleKey}']?.default || __modules['${moduleKey}'];`);
      }
      if (namedImports) {
        const destructure = namedImports.split(',').map((n: string) => {
          const [orig, alias] = n.trim().split(/\s+as\s+/);
          return alias ? `${orig.trim()}: ${alias.trim()}` : orig.trim();
        }).join(', ');
        parts.push(`const { ${destructure} } = __modules['${moduleKey}'] || {};`);
      }
      importLines.push(moduleKey);
      return parts.join('\n');
    }
  );

  code = code.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');

  code = code.replace(
    /^export\s+\*\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
    (_match, specifier) => {
      const resolved = moduleMap.get(specifier) ||
        moduleMap.get(specifier.replace(/^\.\//, '')) ||
        moduleMap.get(specifier.replace(/\.\w+$/, ''));
      const sourceKey = resolved?.path || specifier;
      return `Object.assign(__modules['${file.path}'] || (__modules['${file.path}'] = {}), __modules['${sourceKey}'] || {});`;
    }
  );
  code = code.replace(
    /^export\s*\{([^}]+)\}\s*from\s+['"]([^'"]+)['"];?\s*$/gm,
    (_match, names, specifier) => {
      const resolved = moduleMap.get(specifier) ||
        moduleMap.get(specifier.replace(/^\.\//, '')) ||
        moduleMap.get(specifier.replace(/\.\w+$/, ''));
      const sourceKey = resolved?.path || specifier;
      const pairs = names.split(',').map((n: string) => {
        const [orig, alias] = n.trim().split(/\s+as\s+/);
        return { orig: orig.trim(), alias: (alias || orig).trim() };
      });
      const lines = [`__modules['${file.path}'] = __modules['${file.path}'] || {};`];
      for (const { orig, alias } of pairs) {
        if (orig === 'default') {
          lines.push(`__modules['${file.path}']['${alias}'] = (__modules['${sourceKey}'] || {}).default;`);
        } else {
          lines.push(`__modules['${file.path}']['${alias}'] = (__modules['${sourceKey}'] || {})['${orig}'];`);
        }
      }
      return lines.join('\n');
    }
  );

  // Anonymous default exports
  code = code.replace(/^export\s+default\s+((?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>)/gm, 'const __DefaultExport = $1');
  code = code.replace(/^export\s+default\s+function\s*\(/gm, 'const __DefaultExport = function(');
  code = code.replace(/^export\s+default\s+(\{)/gm, 'const __DefaultExport = $1');

  code = code.replace(
    /^export\s+default\s+(?:function\s+(\w+)|class\s+(\w+)|(\w+))/gm,
    (_match, fnName, className, varName) => {
      const name = fnName || className || varName;
      if (fnName) return `function ${name}`;
      if (className) return `class ${name}`;
      return name;
    }
  );

  code = code.replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');

  const exportedNames: string[] = [];
  code = code.replace(
    /^export\s+((?:const|let|var|function|class)\s+(\w+))/gm,
    (_match, declaration, name) => {
      exportedNames.push(name);
      return declaration;
    }
  );

  code = code.replace(
    /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
    (_match, specifier) => {
      const resolved = moduleMap.get(specifier) ||
        moduleMap.get(specifier.replace(/^\.\//, '')) ||
        moduleMap.get(specifier.replace(/\.\w+$/, ''));
      const moduleKey = resolved?.path || specifier;
      return `Promise.resolve(__modules['${moduleKey}'] || {})`;
    }
  );

  const defaultMatch = file.content.match(/export\s+default\s+(?:function\s+|class\s+)?(\w+)/);
  const hasAnonymousDefault = /export\s+default\s+(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/.test(file.content) ||
                               /export\s+default\s+function\s*\(/.test(file.content) ||
                               /export\s+default\s+\{/.test(file.content);
  const defaultExport = hasAnonymousDefault ? '__DefaultExport' : defaultMatch?.[1];
  const registration: string[] = [];

  registration.push(`__modules['${file.path}'] = __modules['${file.path}'] || {};`);
  if (defaultExport) {
    registration.push(`__modules['${file.path}'].default = typeof ${defaultExport} !== 'undefined' ? ${defaultExport} : undefined;`);
  }
  for (const name of exportedNames) {
    registration.push(`__modules['${file.path}']['${name}'] = typeof ${name} !== 'undefined' ? ${name} : undefined;`);
  }

  // Build module code + registration as a single string, then wrap safely
  const moduleBody = code + '\n' + registration.join('\n');
  // Use new Function to isolate parsing — if the body has syntax errors,
  // it throws at construction time rather than breaking the outer try/catch structure.
  const wrapped = `/* === ${file.path} === */\n(function() {\n  var __fn;\n  try { __fn = new Function('__modules', ${JSON.stringify(moduleBody)}); } catch(__parseErr) { console.error('[Parse Error] ${file.path}:', __parseErr.message); return; }\n  try { __fn(__modules); } catch(__runErr) { console.error('[Runtime Error] ${file.path}:', __runErr.message); }\n})();`;
  return { code: wrapped, externalPackages: Array.from(usedExternalPackages) };
}

// ── Dependency Sort ──
function sortByDependency(files: ProjectFile[], moduleMap: Map<string, ProjectFile>): ProjectFile[] {
  const graph = new Map<string, Set<string>>();
  const fileSet = new Set(files.map(f => f.path));

  for (const f of files) {
    const deps = new Set<string>();
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(f.content)) !== null) {
      const specifier = match[1];
      if (!specifier.startsWith('.') && !specifier.startsWith('/')) continue;
      const resolved = moduleMap.get(specifier) ||
        moduleMap.get(specifier.replace(/^\.\//, '')) ||
        moduleMap.get(specifier.replace(/\.\w+$/, ''));
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

  const fileMap = new Map(files.map(f => [f.path, f]));
  return ordered.map(p => fileMap.get(p)!).filter(Boolean);
}

// ── CSS @import resolution ──
function resolveCSSimports(cssContent: string, cssPath: string, allFiles: ProjectFile[]): string {
  return cssContent.replace(
    /@import\s+['"]([^'"]+)['"];?\s*/g,
    (_match, importPath) => {
      const dir = cssPath.includes('/') ? cssPath.substring(0, cssPath.lastIndexOf('/') + 1) : '';
      const resolvedPath = importPath.startsWith('./')
        ? dir + importPath.slice(2)
        : importPath.startsWith('/')
          ? importPath.slice(1)
          : dir + importPath;
      const importedFile = allFiles.find(f =>
        f.path === resolvedPath ||
        f.path === importPath ||
        f.path === importPath.replace(/^\.\//, '')
      );
      if (importedFile) {
        return `/* @import inlined: ${importPath} */\n${importedFile.content}\n`;
      }
      return _match;
    }
  );
}

// ── Main compile function ──
async function compileReactProject(
  files: ProjectFile[],
  options?: CompileRequest['options']
): Promise<CompileResponse> {
  console.info('[CompilerWorker] compileReactProject called with', files.length, 'files');
  const t0 = Date.now();
  const useEsbuild = await ensureEsbuild();
  console.info('[CompilerWorker] esbuild ready:', useEsbuild, 'in', Date.now() - t0, 'ms');
  const errors: string[] = [];

  const reactFiles = files
    .filter(f => /\.(tsx?|jsx?)$/.test(f.path))
    .filter(f => !/\.(test|spec)\.(tsx?|jsx?)$/.test(f.path))
    .filter(f => !f.content.includes("from 'vitest'") && !f.content.includes('from "vitest"'));
  const cssFiles = files.filter(f => f.language === 'css' || f.language === 'scss');
  const htmlFiles = files.filter(f => f.language === 'html');

  if (reactFiles.length === 0) {
    return { type: 'compile-result', id: '', html: '', isReactProject: false, componentCount: 0, errors: ['No React files found'] };
  }

  const moduleMap = buildModuleMap(files);
  const sorted = sortByDependency(reactFiles, moduleMap);

  const transpiledChunks: string[] = [];
  const allExternalPackages = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    try {
      const result = await transpileFile(sorted[i], moduleMap, useEsbuild);
      // Escape </script> in transpiled code to prevent HTML parser from prematurely
      // closing the <script> block when embedded in the srcdoc HTML
      const safeCode = result.code.replace(/<\/script>/gi, '<\\/script>');
      transpiledChunks.push(safeCode);
      for (const pkg of result.externalPackages) allExternalPackages.add(pkg);
    } catch (err: any) {
      errors.push(`Transpile error in ${sorted[i].path}: ${err.message}`);
    }
  }
  console.info('[CompilerWorker] Transpiled', transpiledChunks.length, 'chunks in', Date.now() - t0, 'ms');

  // Import map is now built inline below using registryMap

  const usesReactRouter = reactFiles.some(f => /from\s+['"]react-router-dom['"]/.test(f.content));
  if (usesReactRouter) allExternalPackages.add('react-router-dom');

  const entryFile = files.find(f => f.path === 'main.tsx') ||
    files.find(f => f.path === 'src/main.tsx') ||
    files.find(f => f.path === 'index.tsx');
  const appFile = files.find(f => f.path === 'App.tsx') ||
    files.find(f => f.path === 'src/App.tsx') ||
    reactFiles.find(f => /App\.(tsx|jsx)$/.test(f.path));

  let rootComponent = 'App';
  if (appFile) {
    const defaultExport = appFile.content.match(/export\s+default\s+(?:function\s+|class\s+)?(\w+)/);
    if (defaultExport) rootComponent = defaultExport[1];
  }

  let mountScript: string;
  const hasEntryMount = entryFile && /createRoot|ReactDOM\.render/.test(entryFile.content);

  // ErrorBoundary class — always injected so runtime errors show visually instead of blank page
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

  if (hasEntryMount) {
    // Entry file handles mounting — patch createRoot to auto-wrap with ErrorBoundary
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
    const routerWrapStart = usesReactRouter ? `
    var { MemoryRouter } = window.__pkg_react_router_dom || {};
    var wrappedElement = React.createElement(MemoryRouter, null, React.createElement(RootComponent));` : `
    var wrappedElement = React.createElement(RootComponent);`;

    mountScript = `
(function() {
try {
  var RootComponent = __modules['${appFile?.path || 'App.tsx'}']?.default || 
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

  const allCSS = cssFiles.map(f => {
    const resolved = resolveCSSimports(f.content, f.path, files);
    return `/* ${f.path} */\n${resolved}`;
  }).join('\n\n');

  const envObj: Record<string, string> = {};
  if (options?.envVars) {
    for (const v of options.envVars) {
      if (v.key) envObj[v.key] = v.value;
    }
  }

  const componentCount = reactFiles.filter(f =>
    /(?:function|const)\s+\w+.*(?:=>|\{)[\s\S]*?(?:return\s*\(?\s*<|=>\s*\(?\s*<)/s.test(f.content)
  ).length;

  const usedPackages = DEFAULT_PACKAGES.filter(pkg =>
    reactFiles.some(f => f.content.includes(`from '${pkg.name}'`) || f.content.includes(`from "${pkg.name}"`))
  );
  const preloadHints = usedPackages.map(p => `  <link rel="modulepreload" href="${p.cdnUrl}" />`).join('\n');

  // Gap 3: Build comprehensive import map including auto-detected packages
  const ESM_SH = 'https://esm.sh';
  const registryMap = new Map(DEFAULT_PACKAGES.map(p => [p.name, p.cdnUrl]));
  if (options?.userPackages) {
    for (const p of options.userPackages) registryMap.set(p.name, p.cdnUrl);
  }
  // Add any packages used in code but not in registry
  for (const pkg of allExternalPackages) {
    if (!registryMap.has(pkg) && pkg !== 'react' && pkg !== 'react-dom' && pkg !== 'react-dom/client') {
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
        .filter(([k]) => !['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'].includes(k))
        .map(([k, v]) => `"${k}": "${v}"`)
        .join(',\n      ')}
    }
  }</script>

  ${options?.supabaseConfig ? `
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script>
    const SUPABASE_URL = '${options.supabaseConfig.url}';
    const SUPABASE_ANON_KEY = '${options.supabaseConfig.anonKey}';
    window.__supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  </script>` : ''}

  ${options?.stripeConfig ? `
  <script src="https://js.stripe.com/v3/"></script>
  <script>const stripe = Stripe('${options.stripeConfig.publishableKey}');</script>` : ''}

  ${Object.keys(envObj).length > 0 ? `<script>
window.ENV = ${JSON.stringify(envObj)};
(function(){var m={};for(var k in window.ENV){var v=window.ENV[k];m[k]=/key|secret|token|password|auth/i.test(k)&&v.length>8?'****...'+v.slice(-6):v;}console.log('%c[ENV] Variables loaded:','color:#6ee7b7',m);})();
</script>` : ''}

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
        window.parent.postMessage({ type: '__PREVIEW_ERROR__', error: { message: 'Infinite render loop detected. A component is re-rendering too frequently (>500/sec).', critical: true } }, '*');
        var root = document.getElementById('root');
        if (root) root.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:system-ui"><h2>⚠️ Render Loop Detected</h2><p>A component is stuck in an infinite re-render loop. Check your useEffect dependencies and state updates.</p></div>';
      }
      __renderCount = 0;
    }, 1000);
    var origCE = React.createElement;
    React.createElement = function() { __renderCount++; return origCE.apply(this, arguments); };
    var __readyReceived = false;
    window.addEventListener('message', function(e) { if (e.data && e.data.type === '__PREVIEW_READY__') __readyReceived = true; });
    setTimeout(function(){
      if (!__readyReceived && document.getElementById('root') && document.getElementById('root').innerHTML.trim().length < 10) {
        window.parent.postMessage({ type: '__PREVIEW_ERROR__', error: { message: 'Preview timed out — no content rendered after 15 seconds.', critical: true } }, '*');
      }
    }, 15000);
  })();
  </script>

  <script>
    window.__modules = {};
    const { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, memo, forwardRef, Fragment, useReducer, useLayoutEffect, useId, useSyncExternalStore, useTransition, useDeferredValue, useInsertionEffect } = React;
    const { createRoot, createPortal } = ReactDOM;
  </script>

  <script src="${CDN.babel}"></script>

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

      // Gap 3: Load packages via import maps — single CDN, real errors
      var __pkgErrors = [];
      ${Array.from(allExternalPackages).map(pkg => {
        const varName = `__pkg_${pkg.replace(/[^a-zA-Z0-9]/g, '_')}`;
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
      }).join('\n      ')}
      if (__pkgErrors.length > 0) {
        console.warn('[Import] ' + __pkgErrors.length + ' package(s) failed to load:', __pkgErrors.join(', '));
        window.parent.postMessage({ type: '__CONSOLE_LOG__', level: 'warn', message: 'Failed packages: ' + __pkgErrors.join(', '), timestamp: Date.now() }, '*');
      }

      var code = ${JSON.stringify(`
    var { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, memo, forwardRef, Fragment, useReducer, useLayoutEffect, useId, useSyncExternalStore, useTransition, useDeferredValue, useInsertionEffect, Suspense, lazy, StrictMode } = React;
    var { createRoot, createPortal, flushSync } = ReactDOM;
    ${options?.supabaseConfig ? `var supabase = window.__supabaseClient;` : ''}

    ${transpiledChunks.join('\n\n')}

    ${mountScript}
      `)};
      var transformed = Babel.transform(code, {
        presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
        filename: 'app.tsx',
        sourceType: 'script',
      });
      new Function(transformed.code)();
      __iifeDone = true;
    } catch(e) {
      __iifeDone = true;
      console.error('[Babel] Transpilation error:', e.message);
      window.parent.postMessage({
        type: '__PREVIEW_ERROR__',
        error: { message: 'Syntax Error: ' + e.message, source: 'babel', critical: true }
      }, '*');
      var root = document.getElementById('root');
      if (root) root.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:system-ui"><h2>Syntax Error</h2><pre style="white-space:pre-wrap;margin-top:12px;font-size:13px;color:#fca5a5">' + e.message + '</pre></div>';
    }
  })();
  setTimeout(function() {
    if (!__iifeDone && document.getElementById('root') && document.getElementById('root').innerHTML.indexOf('Loading preview') > -1) {
      document.getElementById('root').innerHTML =
        '<div style="padding:40px;text-align:center;font-family:system-ui;color:#f59e0b">' +
        '<h2>Preview timed out</h2>' +
        '<p style="color:#888;margin-top:8px">External packages took too long to load. Try regenerating or check your network.</p></div>';
      window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: 'Preview timed out waiting for CDN packages', source: 'preamble' }, '*');
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

  if (errors.length > 0) {
    const errorHtml = `
      <div style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.9);color:white;padding:40px;font-family:system-ui;overflow:auto">
        <h2 style="color:#ef4444;margin-bottom:20px">Compilation Error</h2>
        ${errors.map(e => `<pre style="color:#fca5a5;margin-bottom:10px;white-space:pre-wrap">${e}</pre>`).join('')}
      </div>
    `;
    return { type: 'compile-result', id: '', html: errorHtml + html, isReactProject: true, componentCount, errors };
  }

  console.info('[CompilerWorker] HTML assembled, total time:', Date.now() - t0, 'ms, html length:', html.length);
  return { type: 'compile-result', id: '', html, isReactProject: true, componentCount, errors };
}

// ── Worker Message Handler ──
console.info('[CompilerWorker] Module loaded successfully');

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  console.info('[CompilerWorker] Received message:', msg.type, 'id:', msg.id);
  if (msg.type === 'compile') {
    try {
      const result = await compileReactProject(msg.files, msg.options);
      result.id = msg.id;
      console.info('[CompilerWorker] Posting result, id:', msg.id, 'html length:', result.html.length);
      (self as any).postMessage(result);
    } catch (err: any) {
      console.error('[CompilerWorker] Compile threw:', err.message);
      const errorResponse: CompileErrorResponse = {
        type: 'compile-error',
        id: msg.id,
        error: err.message || 'Unknown compilation error',
      };
      (self as any).postMessage(errorResponse);
    }
  }
};
