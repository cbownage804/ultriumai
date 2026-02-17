import { useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { SmokeWarning } from './usePostBuildSmokeTest';

/**
 * Dependency Conflict Detection: Finds conflicting CSS classes,
 * duplicate DOM IDs across components, and circular imports.
 */
export function useDependencyConflictDetection() {
  const detectConflicts = useCallback((files: ProjectFile[]): SmokeWarning[] => {
    const warnings: SmokeWarning[] = [];

    // 1. Duplicate DOM IDs across components
    const idMap = new Map<string, string[]>(); // id -> [file paths]
    for (const file of files) {
      if (!file.path.match(/\.(tsx?|jsx?|html)$/)) continue;
      const idMatches = [...file.content.matchAll(/id=["']([^"']+)["']/g)];
      for (const match of idMatches) {
        const id = match[1];
        if (!idMap.has(id)) idMap.set(id, []);
        idMap.get(id)!.push(file.path);
      }
    }
    for (const [id, paths] of idMap) {
      const uniquePaths = [...new Set(paths)];
      if (uniquePaths.length > 1) {
        warnings.push({
          file: uniquePaths.join(', '),
          message: `Duplicate DOM id="${id}" found across ${uniquePaths.length} files — may cause bugs`,
          severity: 'warning',
        });
      }
    }

    // 2. Circular import detection
    const importGraph = new Map<string, Set<string>>();
    for (const file of files) {
      if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;
      const imports = new Set<string>();
      const importMatches = [...file.content.matchAll(/(?:import|from)\s+['"]([^'"]+)['"]/g)];
      for (const match of importMatches) {
        const importPath = match[1];
        if (importPath.startsWith('.') || importPath.startsWith('@/')) {
          // Normalize to comparable path
          const normalized = importPath.replace(/^@\//, 'src/').replace(/^\.\//, '').replace(/\.(tsx?|jsx?)$/, '');
          imports.add(normalized);
        }
      }
      const normalizedSelf = file.path.replace(/\.(tsx?|jsx?)$/, '');
      importGraph.set(normalizedSelf, imports);
    }

    // Simple DFS cycle detection
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const findCycle = (node: string, path: string[]): string[] | null => {
      if (inStack.has(node)) return [...path, node];
      if (visited.has(node)) return null;
      visited.add(node);
      inStack.add(node);
      const deps = importGraph.get(node);
      if (deps) {
        for (const dep of deps) {
          // Try to match any key that ends with this dep
          const matchedKey = [...importGraph.keys()].find(k => k.endsWith(dep) || dep.endsWith(k.split('/').pop()!));
          if (matchedKey) {
            const cycle = findCycle(matchedKey, [...path, node]);
            if (cycle) return cycle;
          }
        }
      }
      inStack.delete(node);
      return null;
    };

    for (const node of importGraph.keys()) {
      const cycle = findCycle(node, []);
      if (cycle) {
        warnings.push({
          file: cycle.join(' → '),
          message: `Circular import detected: ${cycle.map(c => c.split('/').pop()).join(' → ')}`,
          severity: 'warning',
        });
        break; // Report first cycle only
      }
    }

    // 3. Conflicting Tailwind classes on same element
    for (const file of files) {
      if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;
      const classMatches = [...file.content.matchAll(/className=["']([^"']+)["']/g)];
      for (const match of classMatches) {
        const classes = match[1].split(/\s+/);
        // Check for conflicting width/height
        const widthClasses = classes.filter(c => /^w-/.test(c));
        const heightClasses = classes.filter(c => /^h-/.test(c));
        const textColorClasses = classes.filter(c => /^text-(white|black|gray|red|blue|green|yellow|purple|pink|indigo|cyan|emerald|amber|violet|rose|orange|teal|sky|lime|fuchsia)/.test(c));
        const bgClasses = classes.filter(c => /^bg-(white|black|gray|red|blue|green|yellow|purple|pink|indigo|cyan|emerald|amber|violet|rose|orange|teal|sky|lime|fuchsia)/.test(c));

        if (widthClasses.length > 1) {
          warnings.push({ file: file.path, message: `Conflicting width classes: ${widthClasses.join(', ')}`, severity: 'warning' });
        }
        if (heightClasses.length > 1) {
          warnings.push({ file: file.path, message: `Conflicting height classes: ${heightClasses.join(', ')}`, severity: 'warning' });
        }
        if (textColorClasses.length > 1) {
          warnings.push({ file: file.path, message: `Conflicting text color classes: ${textColorClasses.join(', ')}`, severity: 'warning' });
        }
        if (bgClasses.length > 1) {
          warnings.push({ file: file.path, message: `Conflicting bg color classes: ${bgClasses.join(', ')}`, severity: 'warning' });
        }
      }
    }

    return warnings;
  }, []);

  return { detectConflicts };
}
