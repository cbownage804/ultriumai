import { useState, useCallback, useRef } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface MissingDep {
  packageName: string;
  importedIn: string;
  specifier: string;
}

// Common packages that should not be flagged
const BUILTIN_MODULES = new Set([
  'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime',
]);

/**
 * Scans new/modified files for bare imports that aren't in the project's
 * CDN package list, suggesting one-click install.
 */
export function useAutoDepInstall(knownPackages: Set<string>) {
  const [missingDeps, setMissingDeps] = useState<MissingDep[]>([]);
  const lastScanRef = useRef<string>('');

  const scanForMissingDeps = useCallback((files: ProjectFile[]) => {
    const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"./][^'"]*)['"]/g;
    const found = new Map<string, MissingDep>();

    for (const file of files) {
      let match;
      importRegex.lastIndex = 0;
      const content = file.content;
      while ((match = importRegex.exec(content)) !== null) {
        const specifier = match[1];
        const parts = specifier.split('/');
        const pkgName = specifier.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

        if (BUILTIN_MODULES.has(pkgName) || knownPackages.has(pkgName)) continue;

        if (!found.has(pkgName)) {
          found.set(pkgName, {
            packageName: pkgName,
            importedIn: file.path,
            specifier,
          });
        }
      }
    }

    const deps = Array.from(found.values());
    const key = deps.map(d => d.packageName).sort().join(',');
    if (key !== lastScanRef.current) {
      lastScanRef.current = key;
      setMissingDeps(deps);
    }
  }, [knownPackages]);

  const dismissDep = useCallback((packageName: string) => {
    setMissingDeps(prev => prev.filter(d => d.packageName !== packageName));
  }, []);

  const clearAll = useCallback(() => {
    setMissingDeps([]);
    lastScanRef.current = '';
  }, []);

  return { missingDeps, scanForMissingDeps, dismissDep, clearAll };
}
