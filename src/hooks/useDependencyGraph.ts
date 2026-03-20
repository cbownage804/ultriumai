import { useState, useCallback } from 'react';

export interface GraphNode {
  id: string;
  label: string;
  filePath: string;
  type: 'component' | 'hook' | 'util' | 'page' | 'store' | 'type';
  importCount: number;
  exportCount: number;
  isEntry: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  importType: 'default' | 'named' | 'namespace' | 'sideEffect';
  isCircular: boolean;
}

export interface CircularDep {
  id: string;
  cycle: string[];
  severity: 'error' | 'warning';
}

export function useDependencyGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [circularDeps, setCircularDeps] = useState<CircularDep[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [layout, setLayout] = useState<'force' | 'tree' | 'radial'>('force');

  const analyzeFiles = useCallback((files: Record<string, string>) => {
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];
    const fileKeys = Object.keys(files);

    for (const filePath of fileKeys) {
      const content = files[filePath];
      let type: GraphNode['type'] = 'util';
      if (filePath.includes('/pages/')) type = 'page';
      else if (filePath.includes('/hooks/') || filePath.includes('use')) type = 'hook';
      else if (filePath.includes('/components/')) type = 'component';
      else if (filePath.includes('/types') || filePath.endsWith('.d.ts')) type = 'type';
      else if (filePath.includes('/store')) type = 'store';

      const exportMatches = content.match(/export\s+(default\s+)?(function|const|class|interface|type|enum)/g);
      const importMatches = content.match(/import\s+/g);

      newNodes.push({
        id: filePath, label: filePath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || filePath,
        filePath, type, importCount: importMatches?.length || 0,
        exportCount: exportMatches?.length || 0, isEntry: filePath.includes('main.') || filePath.includes('App.'),
      });

      // Parse imports
      const importRegex = /import\s+(?:(\{[^}]+\})|(\w+)|(\*\s+as\s+\w+))\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[4];
        if (importPath.startsWith('.') || importPath.startsWith('@/')) {
          const resolved = resolveImportPath(filePath, importPath, fileKeys);
          if (resolved) {
            newEdges.push({
              id: `${filePath}->${resolved}`, source: filePath, target: resolved,
              importType: match[1] ? 'named' : match[3] ? 'namespace' : 'default',
              isCircular: false,
            });
          }
        }
      }
    }

    // Detect circular dependencies
    const circulars = detectCircularDeps(newNodes, newEdges);
    for (const circ of circulars) {
      for (const edge of newEdges) {
        if (circ.cycle.includes(edge.source) && circ.cycle.includes(edge.target)) {
          edge.isCircular = true;
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setCircularDeps(circulars);
  }, []);

  const getSelectedNode = useCallback(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  const getNodeDependencies = useCallback((nodeId: string) => ({
    imports: edges.filter(e => e.source === nodeId).map(e => e.target),
    importedBy: edges.filter(e => e.target === nodeId).map(e => e.source),
  }), [edges]);

  const getStats = useCallback(() => ({
    totalFiles: nodes.length,
    totalEdges: edges.length,
    circularCount: circularDeps.length,
    components: nodes.filter(n => n.type === 'component').length,
    hooks: nodes.filter(n => n.type === 'hook').length,
    pages: nodes.filter(n => n.type === 'page').length,
    orphans: nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id)).length,
  }), [nodes, edges, circularDeps]);

  /** Wave 15: Build a concise dependency directive for AI context injection. */
  const buildDependencyDirective = useCallback((files: Record<string, string>): string => {
    const fileKeys = Object.keys(files);
    if (fileKeys.length === 0) return '';

    const imports: string[] = [];
    const circularWarnings: string[] = [];

    for (const filePath of fileKeys) {
      const content = files[filePath];
      const importRegex = /import\s+(?:(?:\{[^}]+\})|(?:\w+)|(?:\*\s+as\s+\w+))\s+from\s+['"]([^'"]+)['"]/g;
      const resolvedImports: string[] = [];
      let m;
      while ((m = importRegex.exec(content)) !== null) {
        const imp = m[1];
        if (imp.startsWith('.') || imp.startsWith('@/')) {
          const resolved = resolveImportPath(filePath, imp, fileKeys);
          if (resolved) resolvedImports.push(resolved);
        }
      }
      if (resolvedImports.length > 0) {
        imports.push(`${filePath} → ${resolvedImports.join(', ')}`);
      }
    }

    if (imports.length === 0) return '';

    // Check for circulars
    if (circularDeps.length > 0) {
      for (const c of circularDeps.slice(0, 3)) {
        circularWarnings.push(`  ⚠️ ${c.cycle.join(' → ')} → ${c.cycle[0]}`);
      }
    }

    return [
      '[DEPENDENCY MAP — Project import structure]',
      ...imports,
      ...(circularWarnings.length > 0 ? ['', 'CIRCULAR DEPENDENCIES (fix these):', ...circularWarnings] : []),
      '[/DEPENDENCY MAP]',
    ].join('\n');
  }, [circularDeps]);

  return {
    nodes, edges, circularDeps, selectedNodeId, setSelectedNodeId, layout, setLayout,
    analyzeFiles, getSelectedNode, getNodeDependencies, getStats, buildDependencyDirective,
  };
}

function resolveImportPath(fromFile: string, importPath: string, allFiles: string[]): string | null {
  let resolved = importPath;
  if (resolved.startsWith('@/')) resolved = 'src/' + resolved.slice(2);
  else {
    const dir = fromFile.substring(0, fromFile.lastIndexOf('/'));
    resolved = dir + '/' + resolved.replace(/^\.\//, '');
  }
  const candidates = [resolved, resolved + '.ts', resolved + '.tsx', resolved + '/index.ts', resolved + '/index.tsx'];
  return candidates.find(c => allFiles.includes(c)) || null;
}

function detectCircularDeps(nodes: GraphNode[], edges: GraphEdge[]): CircularDep[] {
  const circulars: CircularDep[] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(nodeId: string, path: string[]) {
    if (stack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      if (cycleStart !== -1) {
        circulars.push({ id: crypto.randomUUID(), cycle: path.slice(cycleStart), severity: 'warning' });
      }
      return;
    }
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    stack.add(nodeId);
    for (const edge of edges.filter(e => e.source === nodeId)) {
      dfs(edge.target, [...path, nodeId]);
    }
    stack.delete(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) dfs(node.id, []);
  }
  return circulars;
}
