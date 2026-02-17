import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface ConflictRegion {
  file: string;
  startLine: number;
  endLine: number;
  baseContent: string;
  userContent: string;
  aiContent: string;
  resolved: boolean;
  resolution?: 'user' | 'ai' | 'merged';
}

export interface MergeResult {
  files: ProjectFile[];
  conflicts: ConflictRegion[];
  autoResolved: number;
  manualRequired: number;
}

/**
 * Smart Conflict Resolution: Detects and auto-resolves merge conflicts
 * when AI edits overlap with user edits. Uses a three-way merge approach
 * with the last committed state as the common ancestor (base).
 */
export function useConflictResolver() {
  const baseSnapshotRef = useRef<Map<string, string>>(new Map());

  /**
   * Set the base snapshot (common ancestor for three-way merge).
   * Call this after every successful generation or user save.
   */
  const setBaseSnapshot = useCallback((files: ProjectFile[]) => {
    baseSnapshotRef.current = new Map(files.map(f => [f.path, f.content]));
  }, []);

  /**
   * Perform a three-way merge between base, user edits, and AI edits.
   */
  const merge = useCallback((
    userFiles: ProjectFile[],
    aiFiles: ProjectFile[],
  ): MergeResult => {
    const base = baseSnapshotRef.current;
    const userMap = new Map<string, ProjectFile>(userFiles.map(f => [f.path, f]));
    const aiMap = new Map<string, ProjectFile>(aiFiles.map(f => [f.path, f]));
    const allPaths = new Set([...userMap.keys(), ...aiMap.keys()]);

    const mergedFiles: ProjectFile[] = [];
    const conflicts: ConflictRegion[] = [];
    let autoResolved = 0;

    for (const path of allPaths) {
      const baseContent = base.get(path) || '';
      const userFile = userMap.get(path);
      const aiFile = aiMap.get(path);

      // File only exists in user version (AI deleted it)
      if (userFile && !aiFile) {
        mergedFiles.push({ ...userFile });
        continue;
      }

      // File only exists in AI version (new file)
      if (!userFile && aiFile) {
        mergedFiles.push({ ...aiFile });
        continue;
      }

      if (!userFile || !aiFile) continue;

      const userContent = userFile.content;
      const aiContent = aiFile.content;

      // Both unchanged from base — use either
      if (userContent === baseContent && aiContent === baseContent) {
        mergedFiles.push({ ...userFile });
        continue;
      }

      // Only user changed — use user version
      if (aiContent === baseContent && userContent !== baseContent) {
        mergedFiles.push({ ...userFile });
        autoResolved++;
        continue;
      }

      // Only AI changed — use AI version
      if (userContent === baseContent && aiContent !== baseContent) {
        mergedFiles.push({ ...aiFile });
        autoResolved++;
        continue;
      }

      // Both changed — attempt line-level merge
      const result = threeWayMerge(baseContent, userContent, aiContent);

      if (result.hasConflicts) {
        for (const conflict of result.conflicts) {
          conflicts.push({
            file: path,
            ...conflict,
            resolved: false,
          });
        }

        mergedFiles.push({
          path: aiFile.path,
          language: aiFile.language,
          content: result.merged,
        });
      } else {
        mergedFiles.push({
          path: userFile.path,
          language: userFile.language,
          content: result.merged,
        });
        autoResolved++;
      }
    }

    return {
      files: mergedFiles,
      conflicts,
      autoResolved,
      manualRequired: conflicts.length,
    };
  }, []);

  /**
   * Resolve a specific conflict.
   */
  const resolveConflict = useCallback((
    files: ProjectFile[],
    conflict: ConflictRegion,
    resolution: 'user' | 'ai' | 'merged',
    mergedContent?: string,
  ): ProjectFile[] => {
    return files.map(f => {
      if (f.path !== conflict.file) return f;

      const lines = f.content.split('\n');
      const replacementContent = resolution === 'user'
        ? conflict.userContent
        : resolution === 'ai'
          ? conflict.aiContent
          : mergedContent || conflict.aiContent;

      const replacementLines = replacementContent.split('\n');
      const newLines = [
        ...lines.slice(0, conflict.startLine),
        ...replacementLines,
        ...lines.slice(conflict.endLine),
      ];

      return { ...f, content: newLines.join('\n') };
    });
  }, []);

  /**
   * Check if user has made changes since the last base snapshot.
   */
  const hasUserChanges = useCallback((currentFiles: ProjectFile[]): boolean => {
    const base = baseSnapshotRef.current;
    if (base.size === 0) return false;

    for (const file of currentFiles) {
      const baseContent = base.get(file.path);
      if (baseContent === undefined) return true; // New file
      if (baseContent !== file.content) return true;
    }

    // Check for deleted files
    for (const path of base.keys()) {
      if (!currentFiles.some(f => f.path === path)) return true;
    }

    return false;
  }, []);

  return {
    setBaseSnapshot,
    merge,
    resolveConflict,
    hasUserChanges,
  };
}

// === Three-way merge implementation ===

interface MergeRegion {
  merged: string;
  hasConflicts: boolean;
  conflicts: Array<{
    startLine: number;
    endLine: number;
    baseContent: string;
    userContent: string;
    aiContent: string;
  }>;
}

function threeWayMerge(base: string, user: string, ai: string): MergeRegion {
  const baseLines = base.split('\n');
  const userLines = user.split('\n');
  const aiLines = ai.split('\n');

  // Compute diffs from base to user and base to AI
  const userDiff = computeLineDiff(baseLines, userLines);
  const aiDiff = computeLineDiff(baseLines, aiLines);

  const mergedLines: string[] = [];
  const conflicts: MergeRegion['conflicts'] = [];
  let hasConflicts = false;

  let baseIdx = 0;
  let userIdx = 0;
  let aiIdx = 0;

  while (baseIdx < baseLines.length || userIdx < userLines.length || aiIdx < aiLines.length) {
    const userChanged = userDiff.changedLines.has(baseIdx);
    const aiChanged = aiDiff.changedLines.has(baseIdx);

    if (!userChanged && !aiChanged) {
      // Neither changed this line — keep base
      if (baseIdx < baseLines.length) {
        mergedLines.push(baseLines[baseIdx]);
      }
      baseIdx++;
      userIdx++;
      aiIdx++;
    } else if (userChanged && !aiChanged) {
      // Only user changed — take user version
      if (userIdx < userLines.length) {
        mergedLines.push(userLines[userIdx]);
      }
      baseIdx++;
      userIdx++;
      aiIdx++;
    } else if (!userChanged && aiChanged) {
      // Only AI changed — take AI version
      if (aiIdx < aiLines.length) {
        mergedLines.push(aiLines[aiIdx]);
      }
      baseIdx++;
      userIdx++;
      aiIdx++;
    } else {
      // Both changed — conflict!
      hasConflicts = true;
      const conflictStart = mergedLines.length;

      // Take AI version as default but mark conflict
      const userLine = userIdx < userLines.length ? userLines[userIdx] : '';
      const aiLine = aiIdx < aiLines.length ? aiLines[aiIdx] : '';

      mergedLines.push(aiLine); // Default to AI

      conflicts.push({
        startLine: conflictStart,
        endLine: conflictStart + 1,
        baseContent: baseIdx < baseLines.length ? baseLines[baseIdx] : '',
        userContent: userLine,
        aiContent: aiLine,
      });

      baseIdx++;
      userIdx++;
      aiIdx++;
    }
  }

  return {
    merged: mergedLines.join('\n'),
    hasConflicts,
    conflicts,
  };
}

function computeLineDiff(
  oldLines: string[],
  newLines: string[],
): { changedLines: Set<number> } {
  const changedLines = new Set<number>();

  // Simple line-by-line comparison
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length || i >= newLines.length || oldLines[i] !== newLines[i]) {
      changedLines.add(i);
    }
  }

  return { changedLines };
}
