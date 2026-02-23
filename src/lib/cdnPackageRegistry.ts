/**
 * CDN Package Registry
 * Maps npm packages to ESM CDN URLs for in-browser import resolution.
 *
 * The canonical package list lives in src/workers/packageData.ts so the
 * compiler worker can import it without pulling in React Refresh–injected modules.
 * The CDNPackageEntry type is defined HERE (not in the worker file) because
 * worker files skip SWC transpilation and cannot use `export interface`.
 */

export interface CDNPackageEntry {
  name: string;
  version: string;
  cdnUrl: string;
  /** Global variable name if loaded as UMD */
  global?: string;
  /** Dependencies that must be loaded first */
  peerDeps?: string[];
}

// Re-export the canonical data from workers/packageData
export { DEFAULT_PACKAGES } from '@/workers/packageData';
import { DEFAULT_PACKAGES } from '@/workers/packageData';

const ESM_SH = 'https://esm.sh';

/** Build a lookup map from package name to CDN entry */
export function buildPackageLookup(
  defaults: CDNPackageEntry[] = DEFAULT_PACKAGES as CDNPackageEntry[],
  userPackages: CDNPackageEntry[] = [],
): Map<string, CDNPackageEntry> {
  const map = new Map<string, CDNPackageEntry>();
  for (const pkg of defaults) map.set(pkg.name, pkg);
  for (const pkg of userPackages) map.set(pkg.name, pkg);
  return map;
}

/** Generate an import map JSON object for injection into HTML */
export function generateImportMap(
  packages: CDNPackageEntry[],
): Record<string, string> {
  const imports: Record<string, string> = {
    'react': `${ESM_SH}/react@18.3.1`,
    'react-dom': `${ESM_SH}/react-dom@18.3.1`,
    'react-dom/client': `${ESM_SH}/react-dom@18.3.1/client`,
    'react/jsx-runtime': `${ESM_SH}/react@18.3.1/jsx-runtime`,
  };
  for (const pkg of packages) {
    imports[pkg.name] = pkg.cdnUrl;
  }
  return imports;
}

/** Generate CDN preload script tags for packages */
export function generatePreloadScripts(packages: CDNPackageEntry[]): string {
  const allPkgs = [...(DEFAULT_PACKAGES as CDNPackageEntry[]), ...packages];
  const unique = new Map<string, CDNPackageEntry>();
  for (const p of allPkgs) unique.set(p.name, p);

  return Array.from(unique.values())
    .map(p => `<link rel="modulepreload" href="${p.cdnUrl}" />`)
    .join('\n  ');
}

/** Resolve a bare import specifier to a CDN URL, or null if unknown */
export function resolveBareImport(
  specifier: string,
  lookup: Map<string, CDNPackageEntry>,
): string | null {
  if (lookup.has(specifier)) return lookup.get(specifier)!.cdnUrl;
  const parts = specifier.split('/');
  const pkgName = specifier.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
  const entry = lookup.get(pkgName);
  if (entry) {
    const subpath = specifier.startsWith('@') ? parts.slice(2).join('/') : parts.slice(1).join('/');
    return subpath ? `${entry.cdnUrl}/${subpath}` : entry.cdnUrl;
  }
  return `${ESM_SH}/${specifier}`;
}

/** Detect packages used in code but not in the registry */
export function detectMissingPackages(
  code: string,
  lookup: Map<string, CDNPackageEntry>,
): string[] {
  const importRegex = /import\s+.*?from\s+['"]([^'"./][^'"]*)['"]/g;
  const found = new Set<string>();
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const specifier = match[1];
    const parts = specifier.split('/');
    const pkgName = specifier.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
    if (pkgName !== 'react' && pkgName !== 'react-dom' && !lookup.has(pkgName)) {
      found.add(pkgName);
    }
  }
  return Array.from(found);
}
