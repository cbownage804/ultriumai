import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import { preCompileValidate } from '@/components/ai-builder/preCompileValidation';
import { autoFixTrivialIssues } from '@/components/ai-builder/preCompileValidation';
import { safeBatchApply } from '@/lib/ai-builder/atomicBatchApply';

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
      const prevCount = lastApplyCountRef.current;
      const newFiles = completedFiles.slice(prevCount);

      // Per-file validation: auto-fix trivial issues before applying
      const fixedNewFiles = autoFixTrivialIssues(newFiles);

      // Validate each new file — defer (don't advance counter for) ones with errors
      const validNewFiles: ProjectFile[] = [];
      const rejectedFiles: string[] = [];
      for (const file of fixedNewFiles) {
        const issues = preCompileValidate([file]);
        const hasErrors = issues.some(i => i.severity === 'error');
        if (hasErrors) {
          rejectedFiles.push(file.path);
          console.warn(`[IncrementalApply] Deferred "${file.path}":`, issues.filter(i => i.severity === 'error').map(i => i.message));
        } else {
          validNewFiles.push(file);
        }
      }

      // Only advance the counter if we have nothing left pending OR everything was valid.
      // If some files were rejected, keep prevCount so they get re-tried next pass
      // (when their content may have grown to be syntactically complete).
      if (rejectedFiles.length === 0) {
        lastApplyCountRef.current = newCount;
      } else {
        // Advance past contiguous valid prefix only
        let advance = prevCount;
        for (const f of fixedNewFiles) {
          const issues = preCompileValidate([f]);
          if (issues.some(i => i.severity === 'error')) break;
          advance++;
        }
        lastApplyCountRef.current = advance;
        console.info(`[IncrementalApply] ${rejectedFiles.length} file(s) deferred — will retry on next stream chunk`);
      }

      // Track applied
      for (const f of validNewFiles) {
        appliedFilesRef.current.push({
          path: f.path,
          appliedAt: Date.now(),
          round: roundRef.current,
        });
      }

      if (validNewFiles.length === 0) return;

      // Merge: existing files + all previously-applied valid files + new valid files
      const mergedMap = new Map<string, ProjectFile>();
      for (const f of existingFiles) mergedMap.set(f.path, f);
      for (const f of completedFiles.slice(0, prevCount)) mergedMap.set(f.path, f);
      for (const f of validNewFiles) mergedMap.set(f.path, f);
      const mergedFiles = Array.from(mergedMap.values());

      // Final batch guard: AST + invariant validation. If it fails, skip this
      // intermediate apply — wait for the next chunk to bring the project back
      // to a valid state instead of breaking the preview mid-stream.
      const batch = safeBatchApply(existingFiles, validNewFiles);
      if (!batch.ok) {
        console.warn('[IncrementalApply] Batch guard rejected mid-stream apply:', batch.reason, batch.feedback);
        // Don't advance counter — let next chunk retry
        lastApplyCountRef.current = prevCount;
        return;
      }

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
