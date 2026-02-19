/**
 * CDN Package Registry — Phase 24
 * Maps npm packages to ESM CDN URLs for in-browser import resolution.
 */

const ESM_SH = 'https://esm.sh';

export interface CDNPackageEntry {
  name: string;
  version: string;
  cdnUrl: string;
  /** Global variable name if loaded as UMD */
  global?: string;
  /** Dependencies that must be loaded first */
  peerDeps?: string[];
}

/** Well-known packages with tested ESM CDN compatibility */
export const DEFAULT_PACKAGES: CDNPackageEntry[] = [
  { name: 'lucide-react', version: '0.462.0', cdnUrl: `${ESM_SH}/lucide-react@0.462.0?external=react`, peerDeps: ['react'] },
  { name: 'date-fns', version: '3.6.0', cdnUrl: `${ESM_SH}/date-fns@3.6.0` },
  { name: 'recharts', version: '3.1.0', cdnUrl: `${ESM_SH}/recharts@3.1.0?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'framer-motion', version: '12.23.0', cdnUrl: `${ESM_SH}/framer-motion@12.23.0?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'react-router-dom', version: '6.26.2', cdnUrl: `${ESM_SH}/react-router-dom@6.26.2?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'clsx', version: '2.1.1', cdnUrl: `${ESM_SH}/clsx@2.1.1` },
  { name: 'zustand', version: '4.5.5', cdnUrl: `${ESM_SH}/zustand@4.5.5?external=react`, peerDeps: ['react'] },
  { name: 'axios', version: '1.7.7', cdnUrl: `${ESM_SH}/axios@1.7.7` },
  { name: 'zod', version: '3.23.8', cdnUrl: `${ESM_SH}/zod@3.23.8` },
  { name: 'sonner', version: '2.0.6', cdnUrl: `${ESM_SH}/sonner@2.0.6?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'class-variance-authority', version: '0.7.1', cdnUrl: `${ESM_SH}/class-variance-authority@0.7.1` },
  { name: 'tailwind-merge', version: '2.5.2', cdnUrl: `${ESM_SH}/tailwind-merge@2.5.2` },
  { name: '@tanstack/react-query', version: '5.56.2', cdnUrl: `${ESM_SH}/@tanstack/react-query@5.56.2?external=react`, peerDeps: ['react'] },
  { name: 'react-hook-form', version: '7.53.0', cdnUrl: `${ESM_SH}/react-hook-form@7.53.0?external=react`, peerDeps: ['react'] },
  { name: 'react-icons', version: '5.4.0', cdnUrl: `${ESM_SH}/react-icons@5.4.0?external=react`, peerDeps: ['react'] },
  { name: '@headlessui/react', version: '2.2.0', cdnUrl: `${ESM_SH}/@headlessui/react@2.2.0?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'uuid', version: '11.0.5', cdnUrl: `${ESM_SH}/uuid@11.0.5` },
  { name: 'lodash-es', version: '4.17.21', cdnUrl: `${ESM_SH}/lodash-es@4.17.21` },
  { name: 'dayjs', version: '1.11.13', cdnUrl: `${ESM_SH}/dayjs@1.11.13` },
];

/** Build a lookup map from package name to CDN entry */
export function buildPackageLookup(
  defaults: CDNPackageEntry[] = DEFAULT_PACKAGES,
  userPackages: CDNPackageEntry[] = [],
): Map<string, CDNPackageEntry> {
  const map = new Map<string, CDNPackageEntry>();
  for (const pkg of defaults) map.set(pkg.name, pkg);
  // User packages override defaults
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
  const allPkgs = [...DEFAULT_PACKAGES, ...packages];
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
  // Exact match
  if (lookup.has(specifier)) return lookup.get(specifier)!.cdnUrl;
  // Scoped package subpath: @scope/pkg/subpath -> esm.sh/@scope/pkg@ver/subpath
  const parts = specifier.split('/');
  const pkgName = specifier.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
  const entry = lookup.get(pkgName);
  if (entry) {
    const subpath = specifier.startsWith('@') ? parts.slice(2).join('/') : parts.slice(1).join('/');
    return subpath ? `${entry.cdnUrl}/${subpath}` : entry.cdnUrl;
  }
  // Fallback: try esm.sh with latest
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
