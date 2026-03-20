import { useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

/**
 * Wave 18: Import Graph-Aware Context
 * When editing a file, automatically includes its dependents (files that import it)
 * and dependencies (files it imports) in the generation context.
 * This prevents the AI from breaking consumers when modifying a shared utility.
 */

interface DepGraphNode {
  path: string;
  imports: Set<string>;    // files this file imports
  importedBy: Set<string>; // files that import this file
}

/** Build a bidirectional dependency graph from project files */
function buildDepGraph(files: ProjectFile[]): Map<string, DepGraphNode> {
  const graph = new Map<string, DepGraphNode>();
  const pathIndex = new Map<string, string>(); // basename → full path

  // Index all file paths
  for (const f of files) {
    graph.set(f.path, { path: f.path, imports: new Set(), importedBy: new Set() });
    const base = f.path.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
    pathIndex.set(base, f.path);
    // Also index with extension for exact matches
    const withExt = f.path.split('/').pop() || '';
    pathIndex.set(withExt, f.path);
  }

  // Resolve imports
  for (const f of files) {
    if (!/\.(tsx?|jsx?|mjs)$/.test(f.path)) continue;

    const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:\w+)|(?:\*\s+as\s+\w+))(?:\s*,\s*(?:\{[^}]*\}|\w+))?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(f.content)) !== null) {
      const importPath = match[1];
      const resolved = resolveImport(f.path, importPath, pathIndex, files);
      if (resolved && resolved !== f.path) {
        graph.get(f.path)?.imports.add(resolved);
        graph.get(resolved)?.importedBy.add(f.path);
      }
    }
  }

  return graph;
}

/** Resolve an import specifier to a project file path */
function resolveImport(
  fromPath: string,
  importSpec: string,
  pathIndex: Map<string, string>,
  files: ProjectFile[],
): string | null {
  // Skip external packages
  if (!importSpec.startsWith('.') && !importSpec.startsWith('@/')) return null;

  let resolved = importSpec;

  // Handle @/ alias
  if (resolved.startsWith('@/')) {
    resolved = 'src/' + resolved.slice(2);
  } else {
    // Relative path resolution
    const fromDir = fromPath.substring(0, fromPath.lastIndexOf('/'));
    const parts = resolved.split('/');
    const base = fromDir.split('/');
    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') base.pop();
      else base.push(p);
    }
    resolved = base.join('/');
  }

  // Try with various extensions
  const exts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
  const allPaths = new Set(files.map(f => f.path));
  for (const ext of exts) {
    if (allPaths.has(resolved + ext)) return resolved + ext;
  }

  // Fallback: basename match
  const baseName = resolved.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
  return pathIndex.get(baseName) || null;
}

export function useImportGraphContext() {
  /**
   * Given target file(s) being edited, return additional files that should
   * be included in the generation context for safety.
   */
  const getRelatedFiles = useCallback((
    targetPaths: string[],
    files: ProjectFile[],
    maxDepth = 2,
    maxFiles = 10,
  ): { relatedPaths: string[]; graphSummary: string } => {
    if (files.length === 0 || targetPaths.length === 0) {
      return { relatedPaths: [], graphSummary: '' };
    }

    const graph = buildDepGraph(files);
    const related = new Set<string>();

    // BFS from each target
    for (const target of targetPaths) {
      const node = graph.get(target);
      if (!node) continue;

      const queue: [string, number][] = [[target, 0]];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const [path, depth] = queue.shift()!;
        if (visited.has(path) || depth > maxDepth) continue;
        visited.add(path);

        if (path !== target) related.add(path);

        const n = graph.get(path);
        if (!n) continue;

        // Include both directions
        for (const imp of n.imports) {
          if (!visited.has(imp)) queue.push([imp, depth + 1]);
        }
        // importedBy is critical — these files might break if we change the target
        for (const dep of n.importedBy) {
          if (!visited.has(dep)) queue.push([dep, depth + 1]);
        }
      }
    }

    // Prioritize: importedBy (consumers) are more important than imports (dependencies)
    const relatedPaths = [...related]
      .filter(p => !targetPaths.includes(p))
      .sort((a, b) => {
        const aNode = graph.get(a);
        const bNode = graph.get(b);
        const aScore = (aNode?.importedBy.size || 0) * 2 + (aNode?.imports.size || 0);
        const bScore = (bNode?.importedBy.size || 0) * 2 + (bNode?.imports.size || 0);
        return bScore - aScore;
      })
      .slice(0, maxFiles);

    // Build a summary for the AI
    const summaryParts: string[] = [];
    for (const p of targetPaths) {
      const node = graph.get(p);
      if (!node) continue;
      if (node.importedBy.size > 0) {
        summaryParts.push(`⚠️ ${p} is imported by: ${[...node.importedBy].join(', ')} — changes may affect these files`);
      }
    }
    const graphSummary = summaryParts.length > 0
      ? `[DEPENDENCY WARNING]\n${summaryParts.join('\n')}\nEnsure exported interfaces remain compatible.`
      : '';

    return { relatedPaths, graphSummary };
  }, []);

  return { getRelatedFiles };
}
