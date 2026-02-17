import { useCallback, useMemo } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface PackageDependency {
  name: string;
  version?: string;
  cdnUrl: string;
}

const DEFAULT_PACKAGES: PackageDependency[] = [];

/**
 * A simple project bundler that resolves imports between VFS files,
 * injects CDN packages, and compiles everything into a single HTML document.
 */
export function useProjectBundler() {

  /**
   * Build a file index mapping exported names to file paths.
   * Scans for: export function X, export const X, export class X, export default
   */
  const buildFileIndex = useCallback((files: ProjectFile[]): Map<string, string> => {
    const index = new Map<string, string>();

    for (const file of files) {
      if (file.language !== 'javascript' && file.language !== 'typescript') continue;

      // Match named exports
      const exportPatterns = [
        /export\s+(?:function|const|let|var|class)\s+(\w+)/g,
        /export\s+default\s+(?:function|class)?\s*(\w+)/g,
        /export\s*\{\s*([^}]+)\s*\}/g,
      ];

      for (const pattern of exportPatterns) {
        let match;
        while ((match = pattern.exec(file.content)) !== null) {
          const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop()?.trim() || n.trim());
          for (const name of names) {
            if (name && /^\w+$/.test(name)) {
              index.set(name, file.path);
            }
          }
        }
      }

      // Also index by filename stem (e.g., "Header" from "Header.js")
      const stem = file.path.split('/').pop()?.replace(/\.\w+$/, '');
      if (stem && !index.has(stem)) {
        index.set(stem, file.path);
      }
    }

    return index;
  }, []);

  /**
   * Given a user prompt, find which project files are referenced
   * by component/function name and return them for AI context.
   */
  const findReferencedFiles = useCallback((
    prompt: string,
    files: ProjectFile[],
  ): ProjectFile[] => {
    const index = buildFileIndex(files);
    const referenced: Set<string> = new Set();

    // Check if the prompt mentions any indexed name
    for (const [name, path] of index.entries()) {
      // Case-insensitive word boundary match
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(prompt)) {
        referenced.add(path);
      }
    }

    return files.filter(f => referenced.has(f.path));
  }, [buildFileIndex]);

  /**
   * Resolve import statements between VFS files and produce
   * a dependency-ordered list of JS files for injection.
   */
  const resolveImportOrder = useCallback((files: ProjectFile[]): ProjectFile[] => {
    const jsFiles = files.filter(f => f.language === 'javascript' || f.language === 'typescript');
    const fileMap = new Map(jsFiles.map(f => [f.path, f]));

    // Build adjacency: which files does each file import?
    const deps = new Map<string, string[]>();
    for (const file of jsFiles) {
      const imports: string[] = [];
      const importRegex = /import\s+.*?from\s+['"]\.?\/?([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        let importPath = match[1];
        // Resolve relative paths
        if (!importPath.includes('.')) {
          // Try common extensions
          for (const ext of ['.js', '.ts', '.jsx', '.tsx']) {
            if (fileMap.has(importPath + ext)) { importPath = importPath + ext; break; }
          }
        }
        if (fileMap.has(importPath)) {
          imports.push(importPath);
        }
      }
      deps.set(file.path, imports);
    }

    // Topological sort
    const visited = new Set<string>();
    const ordered: ProjectFile[] = [];

    const visit = (path: string) => {
      if (visited.has(path)) return;
      visited.add(path);
      for (const dep of deps.get(path) || []) {
        visit(dep);
      }
      const file = fileMap.get(path);
      if (file) ordered.push(file);
    };

    for (const path of fileMap.keys()) {
      visit(path);
    }

    return ordered;
  }, []);

  /**
   * Generate CDN script tags for installed packages.
   */
  const generatePackageScripts = useCallback((packages: PackageDependency[]): string => {
    return packages
      .map(pkg => `<script src="${pkg.cdnUrl}"></script>`)
      .join('\n');
  }, []);

  /**
   * Strip import/export statements from JS content for browser injection.
   * This is a simple approach — wraps each file in an IIFE namespace.
   */
  const bundleForBrowser = useCallback((files: ProjectFile[]): string => {
    const ordered = resolveImportOrder(files);
    return ordered.map(f => {
      // Strip import/export statements for simple browser compat
      const cleaned = f.content
        // Multi-line imports: import { ... } from '...' or import ... from '...'
        .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '// [bundled import]')
        // Side-effect imports: import '...' or import "..."
        .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '// [bundled import]')
        // Export default
        .replace(/^export\s+default\s+/gm, '')
        // Named exports
        .replace(/^export\s+/gm, '');
      return `/* === ${f.path} === */\n(function() {\n${cleaned}\n})();`;
    }).join('\n\n');
  }, [resolveImportOrder]);

  return {
    buildFileIndex,
    findReferencedFiles,
    resolveImportOrder,
    generatePackageScripts,
    bundleForBrowser,
  };
}
