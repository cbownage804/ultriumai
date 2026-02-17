import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

interface FileHash {
  path: string;
  hash: number;
  compiledChunk: string;
}

interface CompilationResult {
  output: string;
  changedFiles: string[];
  totalFiles: number;
  cacheHits: number;
  compilationTimeMs: number;
}

/**
 * Incremental Compilation: Only recompile files whose content has changed.
 * Uses content hashing to detect changes and caches compiled chunks.
 */
export function useIncrementalCompiler() {
  const cacheRef = useRef<Map<string, FileHash>>(new Map());
  const lastOrderRef = useRef<string[]>([]);

  /**
   * Fast content hash using FNV-1a (32-bit).
   * Much faster than crypto hashes for change detection.
   */
  const fnv1a = useCallback((str: string): number => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash;
  }, []);

  /**
   * Compile files incrementally, only processing changed files.
   * @param files - All project files
   * @param bundleFn - Function to transform a single file's content for browser
   * @param orderFn - Function to determine compilation order (topological sort)
   */
  const compileIncremental = useCallback((
    files: ProjectFile[],
    bundleFn: (file: ProjectFile) => string,
    orderFn: (files: ProjectFile[]) => string[],
  ): CompilationResult => {
    const startTime = performance.now();
    const cache = cacheRef.current;
    const jsFiles = files.filter(f => f.language === 'javascript' || f.language === 'typescript');

    // Compute hashes for all current files
    const currentHashes = new Map<string, number>();
    for (const file of jsFiles) {
      currentHashes.set(file.path, fnv1a(file.content));
    }

    // Detect changed files
    const changedFiles: string[] = [];
    const removedFiles: string[] = [];

    // Check for new or modified files
    for (const [path, hash] of currentHashes) {
      const cached = cache.get(path);
      if (!cached || cached.hash !== hash) {
        changedFiles.push(path);
      }
    }

    // Check for removed files
    for (const path of cache.keys()) {
      if (!currentHashes.has(path)) {
        removedFiles.push(path);
      }
    }

    // If file set changed (additions/removals), also invalidate dependents
    const structuralChange = removedFiles.length > 0 || changedFiles.some(p => !cache.has(p));

    // Get compilation order
    const order = orderFn(jsFiles);

    // If structural change, invalidate dependents of changed files
    if (structuralChange) {
      // For simplicity, recompile everything on structural changes
      changedFiles.length = 0;
      for (const path of order) changedFiles.push(path);
    }

    // Compile only changed files
    const fileMap = new Map(jsFiles.map(f => [f.path, f]));
    for (const path of changedFiles) {
      const file = fileMap.get(path);
      if (!file) continue;

      const compiled = bundleFn(file);
      cache.set(path, {
        path,
        hash: currentHashes.get(path)!,
        compiledChunk: compiled,
      });
    }

    // Remove cached entries for deleted files
    for (const path of removedFiles) {
      cache.delete(path);
    }

    // Assemble output in dependency order
    const chunks: string[] = [];
    for (const path of order) {
      const cached = cache.get(path);
      if (cached) {
        chunks.push(cached.compiledChunk);
      }
    }

    lastOrderRef.current = order;

    return {
      output: chunks.join('\n\n'),
      changedFiles,
      totalFiles: jsFiles.length,
      cacheHits: jsFiles.length - changedFiles.length,
      compilationTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
    };
  }, [fnv1a]);

  /**
   * Invalidate the entire cache (e.g., after a full project reload).
   */
  const invalidateAll = useCallback(() => {
    cacheRef.current.clear();
    lastOrderRef.current = [];
  }, []);

  /**
   * Invalidate specific files (e.g., after targeted edits).
   */
  const invalidateFiles = useCallback((paths: string[]) => {
    for (const path of paths) {
      cacheRef.current.delete(path);
    }
  }, []);

  /**
   * Get cache statistics for the build analytics panel.
   */
  const getCacheStats = useCallback(() => {
    const cache = cacheRef.current;
    let totalSize = 0;
    for (const entry of cache.values()) {
      totalSize += entry.compiledChunk.length;
    }
    return {
      entries: cache.size,
      totalSizeBytes: totalSize,
      lastOrder: lastOrderRef.current,
    };
  }, []);

  return {
    compileIncremental,
    invalidateAll,
    invalidateFiles,
    getCacheStats,
  };
}
