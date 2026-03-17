/**
 * useLKGDiff — Track file changes since last successful build.
 * Provides diff context that can be sent to the AI for self-correction.
 */

import { useCallback, useRef } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface FileDiff {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  /** For modified files: the old content */
  oldContent?: string;
  /** For modified/added files: the new content */
  newContent?: string;
}

export interface LKGDiffResult {
  diffs: FileDiff[];
  summary: string;
  changedFileCount: number;
}

export function useLKGDiff() {
  /** Snapshot of files at last successful build */
  const lkgSnapshotRef = useRef<Map<string, string>>(new Map());

  /** Save current files as the LKG snapshot (call on successful build) */
  const saveSnapshot = useCallback((files: ProjectFile[]) => {
    const map = new Map<string, string>();
    for (const f of files) {
      map.set(f.path, f.content);
    }
    lkgSnapshotRef.current = map;
  }, []);

  /** Compute diff between current files and LKG snapshot */
  const computeDiff = useCallback((currentFiles: ProjectFile[]): LKGDiffResult => {
    const lkg = lkgSnapshotRef.current;
    if (lkg.size === 0) {
      return { diffs: [], summary: 'No previous successful build to compare against', changedFileCount: 0 };
    }

    const diffs: FileDiff[] = [];
    const currentPaths = new Set(currentFiles.map(f => f.path));

    // Check for modified and added files
    for (const file of currentFiles) {
      const oldContent = lkg.get(file.path);
      if (oldContent === undefined) {
        diffs.push({ path: file.path, type: 'added', newContent: file.content });
      } else if (oldContent !== file.content) {
        diffs.push({ path: file.path, type: 'modified', oldContent, newContent: file.content });
      }
    }

    // Check for deleted files
    for (const [path] of lkg) {
      if (!currentPaths.has(path)) {
        diffs.push({ path, type: 'deleted', oldContent: lkg.get(path) });
      }
    }

    const added = diffs.filter(d => d.type === 'added').length;
    const modified = diffs.filter(d => d.type === 'modified').length;
    const deleted = diffs.filter(d => d.type === 'deleted').length;

    const parts: string[] = [];
    if (added) parts.push(`${added} added`);
    if (modified) parts.push(`${modified} modified`);
    if (deleted) parts.push(`${deleted} deleted`);

    return {
      diffs,
      summary: parts.length ? `Changes since last good build: ${parts.join(', ')}` : 'No changes since last successful build',
      changedFileCount: diffs.length,
    };
  }, []);

  /** Generate a concise error context string for the AI */
  const getErrorContext = useCallback((currentFiles: ProjectFile[], errorMessage: string): string => {
    const { diffs, summary } = computeDiff(currentFiles);
    if (diffs.length === 0) return '';

    const lines: string[] = [
      `Build failed: ${errorMessage}`,
      summary,
      '',
      'Changed files since last successful build:',
    ];

    for (const diff of diffs.slice(0, 10)) { // Cap at 10 files
      if (diff.type === 'added') {
        lines.push(`  + ${diff.path} (new file, ${diff.newContent?.length || 0} chars)`);
      } else if (diff.type === 'deleted') {
        lines.push(`  - ${diff.path} (deleted)`);
      } else {
        lines.push(`  ~ ${diff.path} (modified)`);
      }
    }

    if (diffs.length > 10) {
      lines.push(`  ... and ${diffs.length - 10} more files`);
    }

    return lines.join('\n');
  }, [computeDiff]);

  return { saveSnapshot, computeDiff, getErrorContext };
}
