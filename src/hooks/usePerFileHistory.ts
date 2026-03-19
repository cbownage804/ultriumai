import { useRef, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface FileHistoryEntry {
  content: string;
  timestamp: number;
}

const MAX_HISTORY = 10;

/**
 * Tracks per-file edit history (last N versions per file).
 * Allows reverting a single file without affecting the global undo stack.
 */
export function usePerFileHistory() {
  const historyRef = useRef<Map<string, FileHistoryEntry[]>>(new Map());

  /** Record a snapshot of a file before it's modified */
  const recordFileVersion = useCallback((path: string, content: string) => {
    const history = historyRef.current.get(path) || [];
    // Don't push duplicate of last entry
    if (history.length > 0 && history[history.length - 1].content === content) return;
    history.push({ content, timestamp: Date.now() });
    if (history.length > MAX_HISTORY) history.shift();
    historyRef.current.set(path, history);
  }, []);

  /** Record versions for all files that changed between two snapshots */
  const recordChangedFiles = useCallback((prevFiles: ProjectFile[], newFiles: ProjectFile[]) => {
    const prevMap = new Map(prevFiles.map(f => [f.path, f.content]));
    for (const file of newFiles) {
      const prevContent = prevMap.get(file.path);
      if (prevContent !== undefined && prevContent !== file.content) {
        recordFileVersion(file.path, prevContent);
      }
    }
  }, [recordFileVersion]);

  /** Get the previous version of a file, or null */
  const getPreviousVersion = useCallback((path: string): string | null => {
    const history = historyRef.current.get(path);
    if (!history || history.length === 0) return null;
    return history[history.length - 1].content;
  }, []);

  /** Revert a file and remove the last history entry */
  const revertFile = useCallback((path: string): string | null => {
    const history = historyRef.current.get(path);
    if (!history || history.length === 0) return null;
    const entry = history.pop()!;
    historyRef.current.set(path, history);
    return entry.content;
  }, []);

  /** Check if a file has undo history */
  const hasHistory = useCallback((path: string): boolean => {
    const history = historyRef.current.get(path);
    return !!history && history.length > 0;
  }, []);

  /** Get count of history entries for a file */
  const getHistoryCount = useCallback((path: string): number => {
    return historyRef.current.get(path)?.length || 0;
  }, []);

  return {
    recordFileVersion,
    recordChangedFiles,
    getPreviousVersion,
    revertFile,
    hasHistory,
    getHistoryCount,
  };
}
