import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import { generateImportMap, buildPackageLookup, DEFAULT_PACKAGES, type CDNPackageEntry } from '@/lib/cdnPackageRegistry';

/**
 * In-Browser React Compiler
 * 
 * Detects React (.tsx/.jsx) projects and compiles them for preview using:
 * - @babel/standalone (CDN) for JSX/TSX transpilation
 * - React 18 + ReactDOM from CDN
 * - Tailwind CSS Play CDN for utility classes
 * - Virtual module resolution between project files
 * - ESM CDN import maps for npm package resolution (Phase 41)
 */

export interface ReactCompilerResult {
  html: string;
  isReactProject: boolean;
  componentCount: number;
  errors: string[];
}

// CDN URLs for React ecosystem
const CDN = {
  babel: 'https://unpkg.com/@babel/standalone@7.26.5/babel.min.js',
  react: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  reactDom: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  tailwind: 'https://cdn.tailwindcss.com',
} as const;

/**
 * Detect whether a set of project files constitutes a React project.
 */
export function detectReactProject(files: ProjectFile[]): boolean {
  return files.some(f => /\.(tsx|jsx)$/.test(f.path));
}

/**
 * Detect ===MODE: react=== directive in AI output.
 */
export function detectReactMode(content: string): boolean {
  return /^===MODE:\s*react===$/m.test(content);
}

export function useReactCompiler() {
  const babelLoadedRef = useRef(false);

  /**
   * Build a module map from project files for virtual import resolution.
   * Maps module specifiers (e.g., './Header', './utils/api') to file content.
   */
  const buildModuleMap = useCallback((files: ProjectFile[]): Map<string, ProjectFile> => {
    const map = new Map<string, ProjectFile>();
    for (const f of files) {
      // Map by full path
      map.set(f.path, f);
      // Map by path without extension
      const noExt = f.path.replace(/\.(tsx?|jsx?)$/, '');
      if (!map.has(noExt)) map.set(noExt, f);
      // Map by ./path variants
      map.set(`./${f.path}`, f);
      map.set(`./${noExt}`, f);
      // Phase 29: Resolve @/ aliases
      if (f.path.startsWith('src/')) {
        const alias = f.path.replace(/^src\//, '@/');
        map.set(alias, f);
        map.set(alias.replace(/\.(tsx?|jsx?)$/, ''), f);
      } else {
        // Fallback for flat structure
        map.set(`@/${f.path}`, f);
        map.set(`@/${noExt}`, f);
      }
      // Map by bare filename stem
      const stem = f.path.split('/').pop()?.replace(/\.\w+$/, '') || '';
      if (stem && !map.has(stem)) map.set(stem, f);
    }
    return map;
  }, []);

  /**
   * Strip TypeScript type annotations using regex (lightweight, no Babel needed for types).
   * Handles: interface, type, enum, as X, generic brackets, return type annotations.
   */
  const stripTypeAnnotations = useCallback((code: string): string => {
    let result = code;

    // Phase 67: Strip `import type` statements completely before any other processing
    result = result.replace(/^import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
    // Strip inline type imports: import { type X, type Y } from '...' → import { } from '...'
    // But also handle mixed: import { type X, Y } from '...' → import { Y } from '...'
    result = result.replace(/^(import\s+\{)([^}]+)(\}\s+from\s+['"][^'"]+['"];?\s*)$/gm, (_match, prefix, names, suffix) => {
      const filtered = names.split(',')
        .map((n: string) => n.trim())
        .filter((n: string) => !n.startsWith('type ') && n.length > 0);
      if (filtered.length === 0) return ''; // All were type imports
      return `${prefix} ${filtered.join(', ')} ${suffix}`;
    });

    // Phase 73: Bracket-depth counter for interface/type/enum removal
    // Prevents accidentally stripping function bodies that follow an interface
    const lines = result.split('\n');
    const outputLines: string[] = [];
    let stripping = false;
    let braceDepth = 0;

    for (const line of lines) {
      if (!stripping) {
        // Detect start of interface/type-with-body/enum declaration
        if (/^(?:export\s+)?(?:interface|enum)\s+\w+/.test(line.trim()) || 
            /^(?:export\s+)?type\s+\w+\s*=\s*\{/.test(line.trim())) {
          stripping = true;
          braceDepth = 0;
          // Count braces on this line
          for (const ch of line) {
            if (ch === '{') braceDepth++;
            if (ch === '}') braceDepth--;
          }
          // If braces balanced on this line, it's a single-line declaration
          if (braceDepth <= 0) {
            stripping = false;
          }
          continue; // skip this line
        }
        outputLines.push(line);
      } else {
        // Inside a multi-line type declaration — count braces
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') braceDepth--;
        }
        if (braceDepth <= 0) {
          stripping = false;
        }
        // skip this line (part of type declaration)
      }
    }
    result = outputLines.join('\n');

    // Remove single-line type aliases: type X = string | number;
    result = result.replace(/^(?:export\s+)?type\s+\w+\s*=\s*[^;{]+;/gm, '');
    // Strip return type annotations: ): Type => or ): Type {
    result = result.replace(
      /\)\s*:\s*[A-Za-z_][\w.]*(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?(?:\[\])?(?:\s*[|&]\s*[A-Za-z_][\w.]*(?:<(?:[^<>]|<[^<>]*>)*>)?(?:\[\])?)*(?=\s*(?:=>|\{))/g,
      ')'
    );

    // Pass 1: Strip `: React.XXX<...>` annotations
    result = result.replace(
      /:\s*React\.(?:FC|ReactNode|MouseEvent|ChangeEvent|FormEvent|CSSProperties|RefObject|Dispatch|SetStateAction|MutableRefObject|HTMLAttributes|ComponentProps|ComponentType|ElementType|ReactElement|JSX\.Element)(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/g,
      ''
    );

    // Pass 2: Strip `: primitiveType` annotations with unions/intersections
    result = result.replace(
      /:\s*(?:string|number|boolean|void|any|null|undefined|never|unknown|object)(?:\s*[|&]\s*(?:string|number|boolean|void|any|null|undefined|never|unknown|object))*(?=\s*[=,;)\]}])/g,
      ''
    );

    // Pass 3: Strip `: UppercaseType` annotations (including dotted paths like JSX.Element)
    // Uses callback to protect object literal properties like { icon: Star }
    result = result.replace(
      /:\s*[A-Z][\w.]*(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?(?:\[\])?(?:\s*[|&]\s*(?:string|number|boolean|null|undefined|void|never|unknown|[A-Z][\w.]*)(?:\[\])?)*(?=\s*[=,;)\]}])/g,
      (match, offset) => {
        const before = result.slice(Math.max(0, offset - 30), offset);
        if (/[{,]\s*\w+\s*$/.test(before)) return match; // protect object property
        return '';
      }
    );

    // Phase 31: Preserve generic type parameters in arrow functions before stripping
    // e.g. const f = <T>(x: T) => ...
    const genericsMarker = '___GENERIC___';
    const genericsMap: string[] = [];
    result = result.replace(/=\s*<[A-Z][\w,\s]*>(?=\s*\()/g, (match) => {
      genericsMap.push(match);
      return `${genericsMarker}${genericsMap.length - 1}`;
    });

    // Safety pass: strip generics after known React hooks and built-in constructors (handles nesting)
    result = result.replace(
      /\b(useState|useRef|useCallback|useMemo|useReducer|useContext|createContext|forwardRef|memo|lazy|useImperativeHandle|useLayoutEffect|Set|Map|Array|Promise|Record)\s*<((?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*)>/g,
      '$1'
    );
    // Broad generic strip: handles all <TypeName> patterns after identifiers (not JSX)
    result = result.replace(/(?<=\w)<(?:[A-Za-z][\w.]*(?:\[\])?(?:\s*\|\s*[\w.]+(?:\[\])?)*(?:\s*,\s*[\w.]+(?:\[\])?(?:\s*\|\s*[\w.]+)?)*)>/g, '');

    // Restore generics (though Babel will likely strip them anyway, this prevents regex breakage)
    result = result.replace(new RegExp(`${genericsMarker}(\\d+)`, 'g'), (_, idx) => genericsMap[parseInt(idx)] || '');
    // Remove 'as Type' assertions
    result = result.replace(/\s+as\s+\w+(?:<[^>]+>)?/g, '');
    // Remove satisfies keyword
    result = result.replace(/\s+satisfies\s+\w+/g, '');
    return result;
  }, []);

  /**
   * Transpile a single file's JSX/TSX content into browser-executable JS.
   * Uses regex-based transforms (no Babel dependency for the host app).
   */
  const transpileFile = useCallback((file: ProjectFile, moduleMap: Map<string, ProjectFile>): { code: string; externalPackages: string[] } => {
    const usedExternalPackages = new Set<string>();
    let code = file.content;

    // Phase 99: Normalize multi-line imports into single lines before regex processing
    code = code.replace(
      /import\s*\{([^}]*)\}/gs,
      (_match, names) => {
        const cleaned = names.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        return `import { ${cleaned} }`;
      }
    );

    // Step 1: Strip TypeScript if .tsx or .ts
    if (file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
      code = stripTypeAnnotations(code);
    }

    // Step 2: Resolve imports — replace with module map references
    // Convert: import X from './Y' → const X = __modules['Y'].default;
    // Convert: import { A, B } from './Y' → const { A, B } = __modules['Y'];
    const importLines: string[] = [];
    code = code.replace(
      /^import\s+(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
      (_match, defaultImport, namedImports, specifier) => {
        // Skip external package imports (react, react-dom, etc.) — these are globals
        if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
          // Map common packages to globals
          if (specifier === 'react') {
            const parts: string[] = [];
            if (defaultImport && defaultImport !== 'React') parts.push(`const ${defaultImport} = React;`);
            if (namedImports) {
              const names = namedImports.split(',').map((n: string) => n.trim().split(/\s+as\s+/));
              for (const [orig, alias] of names) {
                const target = (alias || orig).trim();
                // Skip if the alias matches what's already globally available
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
          // Phase 99: External packages — reference pre-loaded globals from window.__pkg_X
          const NO_DEFAULT_EXPORT = new Set([
            'lucide-react', 'date-fns', 'recharts', 'react-icons',
            '@radix-ui/react-slot', '@radix-ui/react-icons',
            'class-variance-authority', 'tailwind-merge', 'clsx',
            'lodash-es', 'uuid',
          ]);
          const hasNoDefault = NO_DEFAULT_EXPORT.has(specifier);
          const parts: string[] = [];
          const importVar = `__pkg_${specifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
          // Track this package for the async preamble
          usedExternalPackages.add(specifier);
          if (defaultImport) {
            if (hasNoDefault) {
              parts.push(`var ${defaultImport} = window.${importVar} || {};`);
            } else {
              // Proxy fallback for default imports (e.g., framer-motion's `motion`)
              // Returns a component that renders the native HTML element (motion.div → div)
              parts.push(`var ${defaultImport} = (window.${importVar} || {}).default || new Proxy({}, { get: function(_, p) { if (typeof p === 'symbol') return function() { return ''; }; var pkg = window.${importVar} || {}; if (pkg[p] != null) return pkg[p]; return React.forwardRef(function(props, ref) { var safe = {}; var html = typeof p === 'string' && /^[a-z]/.test(p) ? p : 'div'; Object.keys(props || {}).forEach(function(k) { if (k === 'children' || k === 'className' || k === 'style' || k === 'id' || k === 'ref' || k === 'key' || k === 'onClick' || k === 'onChange' || k === 'onSubmit' || k === 'href' || k === 'src' || k === 'alt' || k === 'type' || k === 'value' || k === 'placeholder' || k === 'disabled' || k === 'role' || /^aria-/.test(k) || /^data-/.test(k)) safe[k] = props[k]; }); safe.ref = ref; return React.createElement(html, safe); }); } });`);
            }
          }
          if (namedImports) {
            const names = namedImports.split(',').map((n: string) => n.trim().split(/\s+as\s+/));
            const destructure = names.map(([orig, alias]: string[]) => alias ? `${orig.trim()}: ${alias.trim()}` : orig.trim()).join(', ');
            // Proxy fallback — undefined components render as safe <span> filtering non-HTML props
            parts.push(`var { ${destructure} } = new Proxy(window.${importVar} || {}, { get: function(t, p) { if (typeof p === 'symbol' || p === 'toString' || p === 'valueOf' || p === 'toJSON' || p === '$$typeof') return t[p] || function() { return ''; }; if (t[p] != null) return t[p]; return function(props) { var safe = {}; Object.keys(props || {}).forEach(function(k) { if (k === 'children' || k === 'className' || k === 'style' || k === 'id' || k === 'onClick' || k === 'role' || /^aria-/.test(k) || /^data-/.test(k)) safe[k] = props[k]; }); return React.createElement('span', safe); }; } });`);
          }
          return parts.length > 0 ? parts.join('\n') : `// [external] ${specifier}`;
        }

        // Resolve local module
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

    // Remove side-effect imports
    code = code.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');

    // Phase 62: Handle re-export patterns
    // export * from './utils' → Object.assign(__modules[thisPath], __modules[sourcePath])
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
    // export { X as Y } from './module' → re-export with alias
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

    // Step 3: Transform exports into module registration

    // Phase 71: Handle anonymous default exports FIRST
    // export default () => ... → const __DefaultExport = () => ...
    code = code.replace(
      /^export\s+default\s+((?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>)/gm,
      'const __DefaultExport = $1'
    );
    // export default function( → const __DefaultExport = function(
    code = code.replace(
      /^export\s+default\s+function\s*\(/gm,
      'const __DefaultExport = function('
    );
    // export default { ... } → const __DefaultExport = { ... }
    code = code.replace(
      /^export\s+default\s+(\{)/gm,
      'const __DefaultExport = $1'
    );

    // export default X → __modules['path'].default = X;
    code = code.replace(
      /^export\s+default\s+(?:function\s+(\w+)|class\s+(\w+)|(\w+))/gm,
      (_match, fnName, className, varName) => {
        const name = fnName || className || varName;
        if (fnName) return `function ${name}`;
        if (className) return `class ${name}`;
        return name;
      }
    );

    // export { X, Y } → already handled by import resolution (but only local re-exports above)
    code = code.replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');

    // export const/function/class X → const/function/class X (and register)
    const exportedNames: string[] = [];
    code = code.replace(
      /^export\s+((?:const|let|var|function|class)\s+(\w+))/gm,
      (_match, declaration, name) => {
        exportedNames.push(name);
        return declaration;
      }
    );

    // Phase 69: Transform inline dynamic import() for local modules
    // Replace import('./utils') with Promise.resolve(__modules['utils'])
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

    // Build module registration
    // Phase 71: Check for anonymous default export (__DefaultExport) or named default
    const defaultMatch = file.content.match(/export\s+default\s+(?:function\s+|class\s+)?(\w+)/);
    const hasAnonymousDefault = /export\s+default\s+(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/.test(file.content) ||
                                 /export\s+default\s+function\s*\(/.test(file.content) ||
                                 /export\s+default\s+\{/.test(file.content);
    const defaultExport = hasAnonymousDefault ? '__DefaultExport' : defaultMatch?.[1];
    const registration: string[] = [];

    // Phase 68: Always initialize module and register ALL exports
    registration.push(`__modules['${file.path}'] = __modules['${file.path}'] || {};`);

    if (defaultExport) {
      registration.push(`__modules['${file.path}'].default = typeof ${defaultExport} !== 'undefined' ? ${defaultExport} : undefined;`);
    }
    // Phase 68: Named exports are ALWAYS registered, regardless of default export
    for (const name of exportedNames) {
      registration.push(`__modules['${file.path}']['${name}'] = typeof ${name} !== 'undefined' ? ${name} : undefined;`);
    }

    // Phase 99: Synchronous IIFE — external packages are pre-loaded in the preamble
    return { code: `/* === ${file.path} === */\n(function() {\n${code}\n${registration.join('\n')}\n})();`, externalPackages: Array.from(usedExternalPackages) };
  }, [stripTypeAnnotations]);

  /**
   * Topologically sort React files so dependencies are loaded first.
   */
  const sortByDependency = useCallback((files: ProjectFile[], moduleMap: Map<string, ProjectFile>): ProjectFile[] => {
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

    // DFS-based topological sort
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
  }, []);

  /**
   * Phase 63: Resolve CSS @import statements by inlining referenced files.
   */
  const resolveCSSimports = useCallback((cssContent: string, cssPath: string, allFiles: ProjectFile[]): string => {
    return cssContent.replace(
      /@import\s+['"]([^'"]+)['"];?\s*/g,
      (_match, importPath) => {
        // Resolve relative to current CSS file's directory
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
        // External @import (e.g., Google Fonts) — keep as-is
        return _match;
      }
    );
  }, []);

  /**
   * Compile a React project into a single HTML document for iframe preview.
   */
  // Phase 3: Async compilation with yield points every 2 files
  const compileReactProject = useCallback(async (
    files: ProjectFile[],
    options?: {
      supabaseConfig?: { url: string; anonKey: string } | null;
      stripeConfig?: { publishableKey: string } | null;
      envVars?: { key: string; value: string }[];
      userPackages?: CDNPackageEntry[];
    }
  ): Promise<ReactCompilerResult> => {
    const errors: string[] = [];

    const reactFiles = files
      .filter(f => /\.(tsx?|jsx?)$/.test(f.path))
      .filter(f => !/\.(test|spec)\.(tsx?|jsx?)$/.test(f.path))
      .filter(f => !f.content.includes("from 'vitest'") && !f.content.includes('from "vitest"'));
    const cssFiles = files.filter(f => f.language === 'css' || f.language === 'scss');
    const htmlFiles = files.filter(f => f.language === 'html');

    if (reactFiles.length === 0) {
      return { html: '', isReactProject: false, componentCount: 0, errors: ['No React files found'] };
    }

    const moduleMap = buildModuleMap(files);

    // Sort files by dependency order
    const sorted = sortByDependency(reactFiles, moduleMap);

    // Transpile each file with yield points every 2 files
    const transpiledChunks: string[] = [];
    const allExternalPackages = new Set<string>();
    for (let i = 0; i < sorted.length; i++) {
      try {
        const result = transpileFile(sorted[i], moduleMap);
        transpiledChunks.push(result.code);
        for (const pkg of result.externalPackages) allExternalPackages.add(pkg);
      } catch (err: any) {
        errors.push(`Transpile error in ${sorted[i].path}: ${err.message}`);
      }
      // Yield to browser every 2 files to prevent "page not responding"
      if (i > 0 && i % 2 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // Phase 41: Generate import map for NPM packages
    const importMap = generateImportMap([...DEFAULT_PACKAGES, ...(options?.userPackages || [])]);
    const importMapJSON = JSON.stringify({ imports: importMap }, null, 2);

    // Phase 48: Detect react-router-dom usage for MemoryRouter wrapping
    const usesReactRouter = reactFiles.some(f => /from\s+['"]react-router-dom['"]/.test(f.content));
    // Ensure react-router-dom is pre-loaded if used (mount script references it)
    if (usesReactRouter) allExternalPackages.add('react-router-dom');

    // Find the entry point (main.tsx, App.tsx, index.tsx, or first .tsx)
    const entryFile = files.find(f => f.path === 'main.tsx') ||
      files.find(f => f.path === 'src/main.tsx') ||
      files.find(f => f.path === 'index.tsx');
    const appFile = files.find(f => f.path === 'App.tsx') ||
      files.find(f => f.path === 'src/App.tsx') ||
      reactFiles.find(f => /App\.(tsx|jsx)$/.test(f.path));

    // Determine root component name
    let rootComponent = 'App';
    if (appFile) {
      const defaultExport = appFile.content.match(/export\s+default\s+(?:function\s+|class\s+)?(\w+)/);
      if (defaultExport) rootComponent = defaultExport[1];
    }

    // Phase 70: If there's a main.tsx/index.tsx with createRoot, use that pattern
    // Verify the entry file's createRoot targets #root — skip auto-mount entirely
    let mountScript: string;
    const hasEntryMount = entryFile && /createRoot|ReactDOM\.render/.test(entryFile.content);
    if (hasEntryMount) {
      // The entry file handles mounting — it's already transpiled in the chunks
      mountScript = '';
    } else {
      // Auto-mount: render the App component into #root
      // Phase 48: Wrap in MemoryRouter if react-router-dom is used
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
    // Phase 32: Inject ErrorBoundary
    class ErrorBoundary extends React.Component {
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
    }
    var root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(ErrorBoundary, null, wrappedElement));
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

    // Phase 63: Resolve CSS @import and collect all CSS
    const allCSS = cssFiles.map(f => {
      const resolved = resolveCSSimports(f.content, f.path, files);
      return `/* ${f.path} */\n${resolved}`;
    }).join('\n\n');

    // Build env injection
    const envObj: Record<string, string> = {};
    if (options?.envVars) {
      for (const v of options.envVars) {
        if (v.key) envObj[v.key] = v.value;
      }
    }

    // Count components (functions returning JSX)
    const componentCount = reactFiles.filter(f =>
      /(?:function|const)\s+\w+.*(?:=>|\{)[\s\S]*?(?:return\s*\(?\s*<|=>\s*\(?\s*<)/s.test(f.content)
    ).length;

    // Check for custom HTML shell
    const htmlShell = htmlFiles.find(f => f.path === 'index.html');

    // Phase 85: Detect which CDN packages are actually used and add modulepreload hints
    const usedPackages = DEFAULT_PACKAGES.filter(pkg =>
      reactFiles.some(f => f.content.includes(`from '${pkg.name}'`) || f.content.includes(`from "${pkg.name}"`))
    );
    const preloadHints = usedPackages.map(p => `  <link rel="modulepreload" href="${p.cdnUrl}" />`).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React Preview</title>

${preloadHints}

  <!-- Phase 64: Tailwind CSS Play CDN with defer-like loading -->
  <script src="${CDN.tailwind}" onerror="console.warn('Tailwind CDN failed'); document.head.insertAdjacentHTML('beforeend', '<style>body{font-family:sans-serif;padding:20px;line-height:1.5}</style>')" onload="document.dispatchEvent(new Event('tailwind-ready'))"></script>

  <!-- React 18 (UMD globals) -->
  <script crossorigin src="${CDN.react}"></script>
  <script crossorigin src="${CDN.reactDom}"></script>

  <!-- Phase 68: Import map with data: shims so await import('react') returns UMD globals -->
  <!-- Phase 65: All React 18 hooks exported including useId, useSyncExternalStore, useTransition, useDeferredValue, useInsertionEffect -->
  <script type="importmap">{
    "imports": {
      "react": "data:text/javascript,const R=window.React;export default R;export const{useState,useEffect,useCallback,useMemo,useRef,useContext,createContext,memo,forwardRef,Fragment,useReducer,useLayoutEffect,Children,cloneElement,isValidElement,createElement,Suspense,lazy,StrictMode,useId,useSyncExternalStore,useTransition,useDeferredValue,useInsertionEffect,startTransition,use,useOptimistic,useActionState,useFormStatus,cache,createRef,PureComponent,Component}=R;for(const __k in R)if(!({useState:1,useEffect:1,useCallback:1,useMemo:1,useRef:1,useContext:1,createContext:1,memo:1,forwardRef:1,Fragment:1,useReducer:1,useLayoutEffect:1,Children:1,cloneElement:1,isValidElement:1,createElement:1,Suspense:1,lazy:1,StrictMode:1,useId:1,useSyncExternalStore:1,useTransition:1,useDeferredValue:1,useInsertionEffect:1,startTransition:1,use:1,useOptimistic:1,useActionState:1,useFormStatus:1,cache:1,createRef:1,PureComponent:1,Component:1,default:1}[__k])&&R[__k]!==undefined)try{Object.defineProperty(exports,__k,{get:()=>R[__k],enumerable:true})}catch(e){}",
      "react/jsx-runtime": "data:text/javascript,const R=window.React;export const jsx=R.createElement;export const jsxs=R.createElement;export const Fragment=R.Fragment;",
      "react-dom": "data:text/javascript,const RD=window.ReactDOM;export default RD;export const{createRoot,createPortal,flushSync}=RD;",
      "react-dom/client": "data:text/javascript,export const{createRoot}=window.ReactDOM;",
      ${Object.entries(importMap)
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
    /* Phase 50: Avoid shadowing window.supabase SDK namespace */
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

  <!-- Render loop detector — threshold 5000 createElement calls/sec, 3s grace period -->
  <script>
  (function(){
    var __renderCount = 0;
    var __mountTime = Date.now();
    var __renderTimer = setInterval(function(){
      // Skip detection during initial 3-second mount burst
      if (Date.now() - __mountTime < 3000) { __renderCount = 0; return; }
      if (__renderCount > 5000) {
        clearInterval(__renderTimer);
        window.parent.postMessage({ type: '__PREVIEW_ERROR__', error: { message: 'Infinite render loop detected. A component is re-rendering too frequently (>500/sec).', critical: true } }, '*');
        var root = document.getElementById('root');
        if (root) root.innerHTML = '<div style="padding:40px;color:#ef4444;font-family:system-ui"><h2>⚠️ Render Loop Detected</h2><p>A component is stuck in an infinite re-render loop. Check your useEffect dependencies and state updates.</p></div>';
      }
      __renderCount = 0;
    }, 1000);
    // Track renders by patching React.createElement
    var origCE = React.createElement;
    React.createElement = function() { __renderCount++; return origCE.apply(this, arguments); };
    // Preview timeout: if no __PREVIEW_READY__ in 15s, show timeout
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
    // ── Virtual module system ──
    window.__modules = {};
    // Phase 65: All React 18 hooks available globally
    const { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, memo, forwardRef, Fragment, useReducer, useLayoutEffect, useId, useSyncExternalStore, useTransition, useDeferredValue, useInsertionEffect } = React;
    const { createRoot, createPortal } = ReactDOM;
  </script>

  <!-- Babel Standalone for runtime JSX transpilation -->
  <script src="${CDN.babel}"></script>

  <!-- Phase 102: Loading spinner shown immediately while packages load -->
  <script>
  document.getElementById('root').innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#888">' +
    '<div style="text-align:center"><div style="width:24px;height:24px;border:2px solid #8882;border-top-color:#888;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px"></div>' +
    '<p style="font-size:13px">Loading preview...</p></div></div>' +
    '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  </script>

  <!-- Phase 67: Manual Babel.transform with try-catch for error capture -->
  <script>
  var __iifeDone = false;
  (async function() {
    try {
      window.__modules = window.__modules || {};

      // Phase 99: Phase A — Pre-load external packages with 5s per-package timeout
      ${Array.from(allExternalPackages).map(pkg => {
        const varName = `__pkg_${pkg.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return `window.${varName} = {};
      try {
        window.${varName} = await Promise.race([
          import('${pkg}'),
          new Promise(function(_, r) { setTimeout(function() { r(new Error('timeout')); }, 5000); })
        ]);
      } catch(__e) {
        try {
          window.${varName} = await Promise.race([
            import('https://cdn.jsdelivr.net/npm/${pkg}/+esm'),
            new Promise(function(_, r) { setTimeout(function() { r(new Error('timeout')); }, 5000); })
          ]);
        } catch(__e2) {
          console.warn('Package ${pkg} unavailable from both CDNs (timeout or error)');
        }
      }`;
      }).join('\n      ')}

      // Phase 99: Phase B — Synchronous code execution (Babel sourceType: 'script')
      var code = ${JSON.stringify(`
    // React globals available to all components
    var { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, memo, forwardRef, Fragment, useReducer, useLayoutEffect, useId, useSyncExternalStore, useTransition, useDeferredValue, useInsertionEffect, Suspense, lazy, StrictMode } = React;
    var { createRoot, createPortal, flushSync } = ReactDOM;
    ${options?.supabaseConfig ? `var supabase = window.__supabaseClient;` : ''}

    ${transpiledChunks.map(chunk => `try { ${chunk} } catch(__chunkErr) { console.error('[Module Error]', __chunkErr.message); }`).join('\n\n')}

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
  // Phase 103: Global 20s safety timeout — guaranteed diagnostic instead of infinite blank page
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

  <!-- Phase 95: Inherit parent dark mode preference -->
  <script>
  (function(){
    try {
      var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) document.documentElement.classList.add('dark');
      document.documentElement.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
    } catch(e){}
  })();
  </script>

  <!-- Phase 94: Web Worker shim -->
  <script>
  (function(){
    var OrigWorker = window.Worker;
    window.Worker = function(url, opts) {
      // If the URL matches a VFS file, convert to Blob URL
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

  <!-- Console/Error interceptors -->
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

    // Error overlay
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

    // Phase 28: Inject error overlay if compilation failed
    if (errors.length > 0) {
      const errorHtml = `
        <div style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.9);color:white;padding:40px;font-family:system-ui;overflow:auto">
          <h2 style="color:#ef4444;margin-bottom:20px">Compilation Error</h2>
          ${errors.map(e => `<pre style="color:#fca5a5;margin-bottom:10px;white-space:pre-wrap">${e}</pre>`).join('')}
        </div>
      `;
      return { html: errorHtml + html, isReactProject: true, componentCount, errors };
    }

    return { html, isReactProject: true, componentCount, errors };
  }, [buildModuleMap, sortByDependency, transpileFile, resolveCSSimports]);

  return {
    compileReactProject,
    detectReactProject,
    detectReactMode,
    buildModuleMap,
  };
}
