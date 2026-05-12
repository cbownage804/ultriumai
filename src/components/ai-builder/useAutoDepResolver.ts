import { useCallback, useRef } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { DEFAULT_PACKAGES } from '@/workers/packageData';

// Registry-aware lookup so well-known packages (lucide-react, recharts, etc.)
// use their tested ?bundle/?external URLs instead of bare ?latest, which often
// drops named exports (e.g. lucide-react Instagram icon).
const REGISTRY_URLS: Record<string, string> = Object.fromEntries(
  DEFAULT_PACKAGES.map(p => [p.name, p.cdnUrl]),
);

/**
 * useAutoDepResolver — Scans project files for bare npm imports and
 * auto-resolves them via esm.sh CDN. Generates an importmap so the
 * preview can load packages without manual configuration.
 *
 * Detects: import X from 'package' / require('package')
 * Resolves: https://esm.sh/package@latest
 */

interface ResolvedPackage {
  name: string;
  version: string;
  esmUrl: string;
}

// Common packages that should use specific versions or have special handling
const KNOWN_PACKAGES: Record<string, string> = {
  'react': '18.3.1',
  'react-dom': '18.3.1',
  'react-dom/client': '18.3.1',
  'react/jsx-runtime': '18.3.1',
  'react/jsx-dev-runtime': '18.3.1',
};

// Packages that are internal/relative and should not be resolved
const SKIP_PATTERNS = [
  /^\./, /^\//, /^@\//, /^~/, /^data:/, /^blob:/, /^https?:/,
];

function extractBareImports(files: ProjectFile[]): Set<string> {
  const imports = new Set<string>();
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"./~@][^'"]*)['"]/g;
  const dynamicImportRegex = /\bimport\s*\(\s*['"]([^'"./~@][^'"]*)['"]\s*\)/g;
  const requireRegex = /\brequire\s*\(\s*['"]([^'"./~@][^'"]*)['"]\s*\)/g;

  // Also handle @-scoped packages (but not @/ alias)
  const scopedImportRegex = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"](@[a-z0-9-]+\/[a-z0-9-]+(?:\/[^'"]*)?)['"]/g;

  for (const file of files) {
    if (!/\.(tsx?|jsx?|mjs|mts)$/.test(file.path)) continue;
    
    const content = file.content;
    let match: RegExpExecArray | null;

    for (const regex of [importRegex, dynamicImportRegex, requireRegex]) {
      regex.lastIndex = 0;
      while ((match = regex.exec(content)) !== null) {
        const pkg = match[1];
        if (SKIP_PATTERNS.some(p => p.test(pkg))) continue;
        // Get the base package name (without subpath)
        const parts = pkg.split('/');
        const basePkg = parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
        imports.add(basePkg);
        // Also add the full import path if it has a subpath
        if (pkg !== basePkg) {
          imports.add(pkg);
        }
      }
    }

    // Scoped packages
    scopedImportRegex.lastIndex = 0;
    while ((match = scopedImportRegex.exec(content)) !== null) {
      const pkg = match[1];
      if (pkg.startsWith('@/')) continue; // Skip alias
      const parts = pkg.split('/');
      const basePkg = parts.slice(0, 2).join('/');
      imports.add(basePkg);
      if (pkg !== basePkg) imports.add(pkg);
    }
  }

  return imports;
}

function resolveToEsmSh(pkg: string): string {
  const parts = pkg.split('/');
  const basePkg = parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  const subpath = parts[0].startsWith('@') ? parts.slice(2).join('/') : parts.slice(1).join('/');

  // Prefer registry-pinned URLs (with ?bundle/?external as needed).
  const registered = REGISTRY_URLS[pkg] || REGISTRY_URLS[basePkg];
  if (registered) {
    return subpath ? `${registered}/${subpath}` : registered;
  }

  const version = KNOWN_PACKAGES[pkg] || KNOWN_PACKAGES[basePkg] || 'latest';
  const versionedPkg = `${basePkg}@${version}`;
  const fullPath = subpath ? `${versionedPkg}/${subpath}` : versionedPkg;

  return `https://esm.sh/${fullPath}`;
}

export function useAutoDepResolver() {
  const resolvedCacheRef = useRef<Map<string, string>>(new Map());
  const lastImportSetRef = useRef<string>('');

  /**
   * Scan files for bare imports and generate an import map.
   * Returns null if no bare imports found.
   */
  const resolveImports = useCallback((files: ProjectFile[]): {
    importMap: Record<string, string>;
    resolved: ResolvedPackage[];
    hasChanges: boolean;
  } | null => {
    const bareImports = extractBareImports(files);
    if (bareImports.size === 0) return null;

    // Check if imports changed
    const importKey = Array.from(bareImports).sort().join(',');
    const hasChanges = importKey !== lastImportSetRef.current;
    lastImportSetRef.current = importKey;

    const importMap: Record<string, string> = {};
    const resolved: ResolvedPackage[] = [];

    for (const pkg of bareImports) {
      const esmUrl = resolveToEsmSh(pkg);
      importMap[pkg] = esmUrl;
      resolvedCacheRef.current.set(pkg, esmUrl);

      const parts = pkg.split('/');
      const basePkg = parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
      const version = KNOWN_PACKAGES[pkg] || KNOWN_PACKAGES[basePkg] || 'latest';
      resolved.push({ name: pkg, version, esmUrl });
    }

    return { importMap, resolved, hasChanges };
  }, []);

  /**
   * Inject an import map into the HTML if bare imports are detected.
   * Returns the modified HTML with the import map added.
   */
  const injectImportMap = useCallback((html: string, importMap: Record<string, string>): string => {
    // Don't inject if already has an import map
    if (/<script\b[^>]*type\s*=\s*["']importmap["']/i.test(html)) {
      return html;
    }

    const mapScript = `<script type="importmap">
${JSON.stringify({ imports: importMap }, null, 2)}
</script>`;

    // Insert before the first module script or at end of head
    const moduleScriptMatch = html.match(/<script\b[^>]*type\s*=\s*["']module["']/i);
    if (moduleScriptMatch && moduleScriptMatch.index !== undefined) {
      return html.slice(0, moduleScriptMatch.index) + mapScript + '\n' + html.slice(moduleScriptMatch.index);
    }

    const headClose = html.indexOf('</head>');
    if (headClose !== -1) {
      return html.slice(0, headClose) + mapScript + '\n' + html.slice(headClose);
    }

    return html;
  }, []);

  /** Reset the resolver cache */
  const resetResolver = useCallback(() => {
    resolvedCacheRef.current.clear();
    lastImportSetRef.current = '';
  }, []);

  return {
    resolveImports,
    injectImportMap,
    resetResolver,
    extractBareImports,
  };
}
