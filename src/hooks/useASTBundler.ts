import { useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

/**
 * Token types for our lightweight JS/TS tokenizer.
 * This replaces naive regex-based import/export stripping with
 * context-aware parsing that respects strings, template literals, and comments.
 */
type TokenKind =
  | 'import'
  | 'export'
  | 'string'
  | 'template'
  | 'comment'
  | 'code';

interface Token {
  kind: TokenKind;
  start: number;
  end: number;
  value: string;
}

interface ImportInfo {
  source: string; // the module specifier
  specifiers: string[]; // imported names
  isDefault: boolean;
  isSideEffect: boolean;
  raw: string; // original statement text
  start: number;
  end: number;
}

interface ExportInfo {
  names: string[];
  isDefault: boolean;
  raw: string;
  start: number;
  end: number;
  /** The declaration part after stripping 'export' keyword */
  declaration: string;
}

interface DependencyNode {
  path: string;
  imports: ImportInfo[];
  exports: ExportInfo[];
  dependencies: string[]; // resolved file paths
}

/**
 * AST-aware bundler that properly handles:
 * - String literals containing 'import'/'export' keywords
 * - Template literals with embedded expressions
 * - Single-line and multi-line comments
 * - Re-exports and barrel files
 * - Dynamic imports (preserved as-is)
 * - TypeScript type imports (stripped entirely)
 */
export function useASTBundler() {
  /**
   * Lightweight tokenizer that identifies code regions vs non-code regions.
   * This prevents false positives when import/export keywords appear inside strings or comments.
   */
  const tokenize = useCallback((source: string): Token[] => {
    const tokens: Token[] = [];
    let i = 0;
    const len = source.length;

    while (i < len) {
      // Single-line comment
      if (source[i] === '/' && source[i + 1] === '/') {
        const start = i;
        i += 2;
        while (i < len && source[i] !== '\n') i++;
        tokens.push({ kind: 'comment', start, end: i, value: source.slice(start, i) });
        continue;
      }

      // Multi-line comment
      if (source[i] === '/' && source[i + 1] === '*') {
        const start = i;
        i += 2;
        while (i < len - 1 && !(source[i] === '*' && source[i + 1] === '/')) i++;
        i += 2;
        tokens.push({ kind: 'comment', start, end: i, value: source.slice(start, i) });
        continue;
      }

      // Template literal
      if (source[i] === '`') {
        const start = i;
        i++;
        let depth = 0;
        while (i < len) {
          if (source[i] === '\\\\') { i += 2; continue; }
          if (source[i] === '$' && source[i + 1] === '{') { depth++; i += 2; continue; }
          if (source[i] === '}' && depth > 0) { depth--; i++; continue; }
          if (source[i] === '`' && depth === 0) { i++; break; }
          i++;
        }
        tokens.push({ kind: 'template', start, end: i, value: source.slice(start, i) });
        continue;
      }

      // String literals (single or double quote)
      if (source[i] === '"' || source[i] === '\'') {
        const quote = source[i];
        const start = i;
        i++;
        while (i < len && source[i] !== quote) {
          if (source[i] === '\\') i++;
          i++;
        }
        i++; // closing quote
        tokens.push({ kind: 'string', start, end: i, value: source.slice(start, i) });
        continue;
      }

      // Regular expression (basic detection — after operator or at line start)
      if (source[i] === '/' && i > 0) {
        const prevChar = source.slice(0, i).trimEnd().slice(-1);
        if ('=(!&|,;:?[{+->~*/'.includes(prevChar) || prevChar === '') {
          const start = i;
          i++;
          while (i < len && source[i] !== '/') {
            if (source[i] === '\\') i++;
            i++;
          }
          i++; // closing slash
          // Skip flags
          while (i < len && /[gimsuy]/.test(source[i])) i++;
          tokens.push({ kind: 'string', start, end: i, value: source.slice(start, i) });
          continue;
        }
      }

      // Code character
      const start = i;
      while (i < len) {
        if (source[i] === '/' || source[i] === '"' || source[i] === '\'' || source[i] === '`') break;
        i++;
      }
      if (i > start) {
        tokens.push({ kind: 'code', start, end: i, value: source.slice(start, i) });
      }
    }

    return tokens;
  }, []);

  /**
   * Extract import statements from code tokens only (ignoring strings/comments).
   */
  const extractImports = useCallback((source: string, tokens: Token[]): ImportInfo[] => {
    const imports: ImportInfo[] = [];

    // Process only code tokens for import statements
    for (const token of tokens) {
      if (token.kind !== 'code') continue;

      // Match import statements within this code region
      const importRegex = /\bimport\s+(type\s+)?(?:(\{[^}]*\})|(\*\s+as\s+\w+)|(\w+)(?:\s*,\s*(?:(\{[^}]*\})|(\*\s+as\s+\w+)))?)?\s*(?:from\s+)?['"]([^'"]+)['"]/g;
      const sideEffectRegex = /\bimport\s+['"]([^'"]+)['"]/g;

      let match;

      // Named/default imports
      while ((match = importRegex.exec(token.value)) !== null) {
        const isTypeImport = !!match[1];
        const namedImports = match[2] || match[5];
        const namespaceImport = match[3] || match[6];
        const defaultImport = match[4];
        const moduleSpecifier = match[7];

        const specifiers: string[] = [];
        if (defaultImport) specifiers.push(defaultImport);
        if (namedImports) {
          const names = namedImports.replace(/[{}]/g, '').split(',')
            .map(n => n.trim().split(/\s+as\s+/).pop()?.trim())
            .filter(Boolean) as string[];
          specifiers.push(...names);
        }
        if (namespaceImport) {
          const name = namespaceImport.replace(/\*\s+as\s+/, '').trim();
          specifiers.push(name);
        }

        const fullMatch = match[0];
        imports.push({
          source: moduleSpecifier,
          specifiers,
          isDefault: !!defaultImport && !namedImports,
          isSideEffect: false,
          raw: fullMatch,
          start: token.start + match.index,
          end: token.start + match.index + fullMatch.length,
        });

        // Skip type-only imports entirely
        if (isTypeImport) {
          imports[imports.length - 1].specifiers = [];
        }
      }

      // Side-effect imports
      while ((match = sideEffectRegex.exec(token.value)) !== null) {
        // Avoid duplicates from the previous regex
        const alreadyMatched = imports.some(imp =>
          imp.start <= token.start + match!.index && imp.end >= token.start + match!.index + match![0].length
        );
        if (alreadyMatched) continue;

        imports.push({
          source: match[1],
          specifiers: [],
          isDefault: false,
          isSideEffect: true,
          raw: match[0],
          start: token.start + match.index,
          end: token.start + match.index + match[0].length,
        });
      }
    }

    return imports;
  }, []);

  /**
   * Extract export statements from code tokens only.
   */
  const extractExports = useCallback((source: string, tokens: Token[]): ExportInfo[] => {
    const exports: ExportInfo[] = [];

    for (const token of tokens) {
      if (token.kind !== 'code') continue;

      // Named exports: export function X, export const X, export class X
      const namedExportRegex = /\bexport\s+(function|const|let|var|class|async\s+function)\s+(\w+)/g;
      let match;
      while ((match = namedExportRegex.exec(token.value)) !== null) {
        const fullStatement = source.slice(
          token.start + match.index,
          findStatementEnd(source, token.start + match.index)
        );
        exports.push({
          names: [match[2]],
          isDefault: false,
          raw: match[0],
          start: token.start + match.index,
          end: token.start + match.index + match[0].length,
          declaration: fullStatement.replace(/^export\s+/, ''),
        });
      }

      // Default exports: export default function X / export default class X / export default X
      const defaultExportRegex = /\bexport\s+default\s+(function|class|async\s+function)?\s*(\w*)/g;
      while ((match = defaultExportRegex.exec(token.value)) !== null) {
        const name = match[2] || '_default';
        exports.push({
          names: [name],
          isDefault: true,
          raw: match[0],
          start: token.start + match.index,
          end: token.start + match.index + match[0].length,
          declaration: match[0].replace(/^export\s+default\s+/, ''),
        });
      }

      // Re-exports: export { X, Y } or export { X as Y }
      const reExportRegex = /\bexport\s*\{([^}]+)\}/g;
      while ((match = reExportRegex.exec(token.value)) !== null) {
        const names = match[1].split(',')
          .map(n => n.trim().split(/\s+as\s+/).pop()?.trim())
          .filter(Boolean) as string[];
        exports.push({
          names,
          isDefault: false,
          raw: match[0],
          start: token.start + match.index,
          end: token.start + match.index + match[0].length,
          declaration: '', // Re-exports don't have declarations
        });
      }
    }

    return exports;
  }, []);

  /**
   * Build a complete dependency graph for the project.
   */
  const buildDependencyGraph = useCallback((files: ProjectFile[]): Map<string, DependencyNode> => {
    const graph = new Map<string, DependencyNode>();
    const fileMap = new Map(files.map(f => [f.path, f]));

    for (const file of files) {
      if (file.language !== 'javascript' && file.language !== 'typescript') continue;

      const tokens = tokenize(file.content);
      const imports = extractImports(file.content, tokens);
      const fileExports = extractExports(file.content, tokens);

      // Resolve import paths to actual files
      const dependencies: string[] = [];
      for (const imp of imports) {
        const resolved = resolveModulePath(imp.source, file.path, fileMap);
        if (resolved) dependencies.push(resolved);
      }

      graph.set(file.path, {
        path: file.path,
        imports,
        exports: fileExports,
        dependencies,
      });
    }

    return graph;
  }, [tokenize, extractImports, extractExports]);

  /**
   * Topological sort using Kahn's algorithm (handles cycles gracefully).
   */
  const topologicalSort = useCallback((graph: Map<string, DependencyNode>): string[] => {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, Set<string>>();

    // Initialize
    for (const [path, node] of graph) {
      if (!inDegree.has(path)) inDegree.set(path, 0);
      if (!adjacency.has(path)) adjacency.set(path, new Set());

      for (const dep of node.dependencies) {
        if (!graph.has(dep)) continue;
        adjacency.get(path)!.add(dep);
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }

    // Start with nodes that have no dependents (leaf nodes)
    const queue: string[] = [];
    for (const [path, degree] of inDegree) {
      if (degree === 0) queue.push(path);
    }

    const sorted: string[] = [];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      // Process dependencies first
      const deps = adjacency.get(current) || new Set();
      for (const dep of deps) {
        if (!visited.has(dep)) {
          queue.unshift(dep);
        }
      }

      sorted.push(current);
    }

    // Add any remaining nodes (cycle members)
    for (const path of graph.keys()) {
      if (!visited.has(path)) sorted.push(path);
    }

    // Reverse: dependencies come before dependents
    return sorted.reverse();
  }, []);

  /**
   * Strip imports and exports from source code in a context-aware manner.
   * Returns clean code safe for browser execution.
   */
  const stripModuleSyntax = useCallback((source: string, node: DependencyNode): string => {
    // Collect all regions to remove (imports) or transform (exports)
    const edits: Array<{ start: number; end: number; replacement: string }> = [];

    // Remove all import statements
    for (const imp of node.imports) {
      // Find the full line(s) including the import statement
      let lineStart = source.lastIndexOf('\n', imp.start) + 1;
      let lineEnd = source.indexOf('\n', imp.end);
      if (lineEnd === -1) lineEnd = source.length;

      // Check if there's a semicolon after
      const afterExport = source.slice(imp.end).match(/^\s*;?\s*/);
      const actualEnd = imp.end + (afterExport?.[0]?.length || 0);
      lineEnd = Math.max(lineEnd, actualEnd);

      edits.push({
        start: lineStart,
        end: lineEnd,
        replacement: `// [bundled] ${imp.source}`,
      });
    }

    // Transform exports: strip 'export' keyword but keep declarations
    for (const exp of node.exports) {
      if (exp.isDefault) {
        // export default function X -> function X
        // export default X -> (keep X)
        const defaultMatch = source.slice(exp.start).match(
          /^export\s+default\s+/
        );
        if (defaultMatch) {
          edits.push({
            start: exp.start,
            end: exp.start + defaultMatch[0].length,
            replacement: '',
          });
        }
      } else if (exp.declaration) {
        // export const X -> const X
        const exportMatch = source.slice(exp.start).match(/^export\s+/);
        if (exportMatch) {
          edits.push({
            start: exp.start,
            end: exp.start + exportMatch[0].length,
            replacement: '',
          });
        }
      } else {
        // export { X, Y } -> remove entirely (re-exports)
        let lineStart = source.lastIndexOf('\n', exp.start) + 1;
        let lineEnd = source.indexOf('\n', exp.end);
        if (lineEnd === -1) lineEnd = source.length;
        edits.push({
          start: lineStart,
          end: lineEnd,
          replacement: '// [bundled re-export]',
        });
      }
    }

    // Apply edits in reverse order to preserve positions
    edits.sort((a, b) => b.start - a.start);

    let result = source;
    for (const edit of edits) {
      result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
    }

    return result;
  }, []);

  /**
   * Bundle all JS/TS files into a single script for browser injection.
   * Each file is wrapped in an IIFE for scope isolation.
   */
  const bundleForBrowser = useCallback((files: ProjectFile[]): string => {
    const graph = buildDependencyGraph(files);
    const order = topologicalSort(graph);
    const fileMap = new Map(files.map(f => [f.path, f]));

    const chunks: string[] = [];

    for (const path of order) {
      const file = fileMap.get(path);
      const node = graph.get(path);
      if (!file || !node) continue;

      const cleaned = stripModuleSyntax(file.content, node);
      chunks.push(`/* ═══ ${path} ═══ */\n(function() {\n"use strict";\n${cleaned}\n})();`);
    }

    return chunks.join('\n\n');
  }, [buildDependencyGraph, topologicalSort, stripModuleSyntax]);

  /**
   * Get the dependency graph for analysis/visualization.
   */
  const analyzeDependencies = useCallback((files: ProjectFile[]) => {
    const graph = buildDependencyGraph(files);
    const order = topologicalSort(graph);

    // Detect circular dependencies
    const circularDeps: string[][] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const detectCycles = (path: string, chain: string[]) => {
      if (stack.has(path)) {
        const cycleStart = chain.indexOf(path);
        if (cycleStart >= 0) {
          circularDeps.push(chain.slice(cycleStart));
        }
        return;
      }
      if (visited.has(path)) return;
      visited.add(path);
      stack.add(path);

      const node = graph.get(path);
      if (node) {
        for (const dep of node.dependencies) {
          detectCycles(dep, [...chain, path]);
        }
      }

      stack.delete(path);
    };

    for (const path of graph.keys()) {
      detectCycles(path, []);
    }

    return {
      graph,
      order,
      circularDeps,
      fileCount: graph.size,
      totalExports: Array.from(graph.values()).reduce((sum, n) => sum + n.exports.length, 0),
      totalImports: Array.from(graph.values()).reduce((sum, n) => sum + n.imports.length, 0),
    };
  }, [buildDependencyGraph, topologicalSort]);

  return {
    tokenize,
    buildDependencyGraph,
    topologicalSort,
    bundleForBrowser,
    analyzeDependencies,
    stripModuleSyntax,
  };
}

// === Utility functions ===

function resolveModulePath(
  specifier: string,
  fromPath: string,
  fileMap: Map<string, ProjectFile>,
): string | null {
  // Skip external modules (node_modules, URLs, etc.)
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return null;

  // Resolve relative path
  const fromDir = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : '';
  let resolved = specifier;

  if (specifier.startsWith('./')) {
    resolved = fromDir ? `${fromDir}/${specifier.slice(2)}` : specifier.slice(2);
  } else if (specifier.startsWith('../')) {
    const parts = fromDir.split('/');
    let spec = specifier;
    while (spec.startsWith('../')) {
      parts.pop();
      spec = spec.slice(3);
    }
    resolved = parts.length > 0 ? `${parts.join('/')}/${spec}` : spec;
  } else if (specifier.startsWith('/')) {
    resolved = specifier.slice(1);
  }

  // Try exact match first
  if (fileMap.has(resolved)) return resolved;

  // Try common extensions
  for (const ext of ['.js', '.ts', '.jsx', '.tsx', '.mjs']) {
    if (fileMap.has(resolved + ext)) return resolved + ext;
  }

  // Try index files
  for (const indexFile of ['index.js', 'index.ts', 'index.jsx', 'index.tsx']) {
    const indexPath = `${resolved}/${indexFile}`;
    if (fileMap.has(indexPath)) return indexPath;
  }

  return null;
}

function findStatementEnd(source: string, start: number): number {
  let i = start;
  let braceDepth = 0;
  let parenDepth = 0;
  let inString = false;
  let stringChar = '';

  while (i < source.length) {
    const ch = source[i];

    if (inString) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === stringChar) inString = false;
      i++;
      continue;
    }

    if (ch === '"' || ch === '\'' || ch === '`') {
      inString = true;
      stringChar = ch;
      i++;
      continue;
    }

    if (ch === '{') braceDepth++;
    if (ch === '}') {
      braceDepth--;
      if (braceDepth <= 0 && parenDepth <= 0) return i + 1;
    }
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;

    if (ch === ';' && braceDepth <= 0 && parenDepth <= 0) return i + 1;
    if (ch === '\n' && braceDepth <= 0 && parenDepth <= 0 && i > start + 10) return i;

    i++;
  }

  return source.length;
}
