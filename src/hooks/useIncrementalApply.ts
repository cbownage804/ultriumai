import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import { preCompileValidate } from '@/components/ai-builder/preCompileValidation';
import { autoFixTrivialIssues } from '@/components/ai-builder/preCompileValidation';

/**
 * Wave 18: Incremental Streaming Apply
 * Applies files to the preview as they complete during streaming,
 * instead of waiting for the full generation to finish.
 * Uses a debounce to batch rapid file completions into single compile triggers.
 * 
 * Enhanced: Per-file validation — each file is validated and auto-fixed
 * as it streams in, rejecting bad files before they hit the compiler.
 */

interface AppliedFile {
  path: string;
  appliedAt: number;
  round: number;
}

export function useIncrementalApply() {
  const appliedFilesRef = useRef<AppliedFile[]>([]);
  const lastApplyCountRef = useRef(0);
  const roundRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Start a new generation round — resets tracking */
  const startRound = useCallback(() => {
    roundRef.current++;
    lastApplyCountRef.current = 0;
    appliedFilesRef.current = [];
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  /**
   * Check if new files have completed streaming and should be applied.
   * Returns the files to compile if there are new ones, or null if no update needed.
   * 
   * @param completedFiles - All files that have completed streaming so far
   * @param existingFiles - Current project files (for merging)
   * @param debounceMs - How long to wait for more files before triggering (default 1500ms)
   */
  const getIncrementalUpdate = useCallback((
    completedFiles: ProjectFile[],
    existingFiles: ProjectFile[],
    onApply: (mergedFiles: ProjectFile[]) => void,
    debounceMs = 1500,
  ) => {
    const newCount = completedFiles.length;
    if (newCount <= lastApplyCountRef.current) return;

    // Clear existing debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce: wait for more files to complete before applying
    debounceTimerRef.current = setTimeout(() => {
      const newFiles = completedFiles.slice(lastApplyCountRef.current);
      lastApplyCountRef.current = newCount;

      // Per-file validation: auto-fix trivial issues before applying
      const fixedNewFiles = autoFixTrivialIssues(newFiles);
      
      // Validate each file — reject files with critical syntax errors
      const validFiles: ProjectFile[] = [];
      const rejectedFiles: string[] = [];
      for (const file of fixedNewFiles) {
        const issues = preCompileValidate([file]);
        const hasErrors = issues.some(i => i.severity === 'error');
        if (hasErrors) {
          rejectedFiles.push(file.path);
          console.warn(`[IncrementalApply] Rejected "${file.path}":`, issues.filter(i => i.severity === 'error').map(i => i.message));
        } else {
          validFiles.push(file);
        }
      }
      
      if (rejectedFiles.length > 0) {
        console.info(`[IncrementalApply] ${rejectedFiles.length} file(s) failed per-file validation — will retry after full stream`);
      }

      // Track what we applied (only valid files)
      for (const f of validFiles) {
        appliedFilesRef.current.push({
          path: f.path,
          appliedAt: Date.now(),
          round: roundRef.current,
        });
      }

      // Merge: valid streaming files override existing ones
      const mergedMap = new Map<string, ProjectFile>();
      for (const f of existingFiles) mergedMap.set(f.path, f);
      // Apply all completed files that passed validation
      for (const f of completedFiles.slice(0, lastApplyCountRef.current - newFiles.length)) mergedMap.set(f.path, f);
      for (const f of validFiles) mergedMap.set(f.path, f);
      const mergedFiles = Array.from(mergedMap.values());

      onApply(mergedFiles);
    }, debounceMs);
  }, []);

  /** Get stats about incremental application */
  const getStats = useCallback(() => ({
    totalApplied: appliedFilesRef.current.length,
    currentRound: roundRef.current,
    appliedFiles: appliedFilesRef.current.map(f => f.path),
  }), []);

  /** Cleanup on unmount */
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  return {
    startRound,
    getIncrementalUpdate,
    getStats,
    cleanup,
  };
}
