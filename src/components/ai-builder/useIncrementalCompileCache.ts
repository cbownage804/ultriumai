import { useCallback, useRef } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * useIncrementalCompileCache — HMR-style incremental build support.
 *
 * Tracks file content hashes between compilations. When only a few files
 * changed, marks the compile as "incremental" so the Vite Sandbox can
 * skip unchanged modules. Also provides a fast "nothing changed" check
 * to skip compilation entirely.
 */

export interface IncrementalDelta {
  /** Files that were added or modified since last successful build */
  changed: ProjectFile[];
  /** File paths that were deleted since last successful build */
  deleted: string[];
  /** True if this is a full rebuild (first build or >50% files changed) */
  isFullRebuild: boolean;
  /** Number of unchanged files (for logging) */
  unchangedCount: number;
}

function hashContent(content: string): number {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

export function useIncrementalCompileCache() {
  /** Map of file path → content hash from last successful build */
  const lastBuildHashesRef = useRef<Map<string, number>>(new Map());
  /** Full file set from last successful build (for deletion detection) */
  const lastBuildPathsRef = useRef<Set<string>>(new Set());

  /**
   * Compute the delta between current files and last successful build.
   * Returns which files changed, which were deleted, and whether this
   * should be treated as a full rebuild.
   */
  const computeDelta = useCallback((files: ProjectFile[]): IncrementalDelta => {
    const prevHashes = lastBuildHashesRef.current;
    const prevPaths = lastBuildPathsRef.current;

    // First build — everything is new
    if (prevHashes.size === 0) {
      return {
        changed: files,
        deleted: [],
        isFullRebuild: true,
        unchangedCount: 0,
      };
    }

    const changed: ProjectFile[] = [];
    const currentPaths = new Set<string>();

    for (const file of files) {
      currentPaths.add(file.path);
      const prevHash = prevHashes.get(file.path);
      const currentHash = hashContent(file.content);

      if (prevHash === undefined || prevHash !== currentHash) {
        changed.push(file);
      }
    }

    // Detect deletions
    const deleted: string[] = [];
    for (const path of prevPaths) {
      if (!currentPaths.has(path)) {
        deleted.push(path);
      }
    }

    const unchangedCount = files.length - changed.length;
    // If more than 50% of files changed, treat as full rebuild
    const isFullRebuild = changed.length > files.length * 0.5;

    return { changed, deleted, isFullRebuild, unchangedCount };
  }, []);

  /**
   * Check if anything changed at all (fast path to skip compilation).
   */
  const hasChanges = useCallback((files: ProjectFile[]): boolean => {
    const prevHashes = lastBuildHashesRef.current;
    if (prevHashes.size === 0) return true;
    if (files.length !== lastBuildPathsRef.current.size) return true;

    for (const file of files) {
      const prevHash = prevHashes.get(file.path);
      if (prevHash === undefined) return true;
      if (prevHash !== hashContent(file.content)) return true;
    }
    return false;
  }, []);

  /**
   * Snapshot the current files as the "last successful build".
   * Call this after a successful compilation.
   */
  const snapshotBuild = useCallback((files: ProjectFile[]) => {
    const hashes = new Map<string, number>();
    const paths = new Set<string>();
    for (const file of files) {
      hashes.set(file.path, hashContent(file.content));
      paths.add(file.path);
    }
    lastBuildHashesRef.current = hashes;
    lastBuildPathsRef.current = paths;
  }, []);

  /**
   * Reset the cache (e.g., on new generation).
   */
  const resetCache = useCallback(() => {
    lastBuildHashesRef.current = new Map();
    lastBuildPathsRef.current = new Set();
  }, []);

  return {
    computeDelta,
    hasChanges,
    snapshotBuild,
    resetCache,
    getCachedFileCount: () => lastBuildHashesRef.current.size,
  };
}
