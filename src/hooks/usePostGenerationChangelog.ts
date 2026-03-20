import { useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

/**
 * Wave 18: Post-Generation Changelog & Per-Hunk Review
 * Generates plain-English explanations of what changed and why.
 * Enables granular accept/reject of individual changes within files.
 */

export interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  summary: string;
  hunks: ChangeHunk[];
}

export interface ChangeHunk {
  id: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  oldContent: string;
  newContent: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected';
}

/** Generate a human-readable description of what changed in a file */
function describeFileChange(oldFile: ProjectFile | undefined, newFile: ProjectFile): string {
  if (!oldFile) {
    // New file
    const lineCount = newFile.content.split('\n').length;
    const exports = newFile.content.match(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g);
    const exportNames = exports?.map(e => e.split(/\s+/).pop()).filter(Boolean) || [];
    
    if (newFile.path.endsWith('.css')) return `Added stylesheet (${lineCount} lines)`;
    if (newFile.path.includes('/hooks/')) return `Created custom hook${exportNames.length ? `: ${exportNames.join(', ')}` : ''}`;
    if (newFile.path.includes('/components/')) return `Created component${exportNames.length ? `: ${exportNames.join(', ')}` : ''} (${lineCount} lines)`;
    if (newFile.path.includes('/pages/')) return `Created page${exportNames.length ? `: ${exportNames.join(', ')}` : ''}`;
    return `Created new file (${lineCount} lines)`;
  }

  // Modified file
  const oldLines = oldFile.content.split('\n');
  const newLines = newFile.content.split('\n');
  const changes: string[] = [];

  // Detect import changes
  const oldImports = new Set(oldLines.filter(l => l.trim().startsWith('import ')));
  const newImports = new Set(newLines.filter(l => l.trim().startsWith('import ')));
  const addedImports = [...newImports].filter(i => !oldImports.has(i));
  const removedImports = [...oldImports].filter(i => !newImports.has(i));
  if (addedImports.length > 0) changes.push(`Added ${addedImports.length} import(s)`);
  if (removedImports.length > 0) changes.push(`Removed ${removedImports.length} import(s)`);

  // Detect function/component changes
  const oldFuncs = new Set((oldFile.content.match(/(?:function|const)\s+(\w+)/g) || []).map(m => m.split(/\s+/).pop()));
  const newFuncs = new Set((newFile.content.match(/(?:function|const)\s+(\w+)/g) || []).map(m => m.split(/\s+/).pop()));
  const addedFuncs = [...newFuncs].filter(f => f && !oldFuncs.has(f));
  if (addedFuncs.length > 0) changes.push(`Added: ${addedFuncs.slice(0, 3).join(', ')}`);

  // Detect style changes
  const oldClasses = (oldFile.content.match(/className="([^"]+)"/g) || []).join(' ');
  const newClasses = (newFile.content.match(/className="([^"]+)"/g) || []).join(' ');
  if (oldClasses !== newClasses) changes.push('Updated styles');

  // Size change
  const sizeDiff = newLines.length - oldLines.length;
  if (Math.abs(sizeDiff) > 5) {
    changes.push(sizeDiff > 0 ? `+${sizeDiff} lines` : `${sizeDiff} lines`);
  }

  return changes.length > 0 ? changes.join(', ') : 'Minor changes';
}

/** Create diff hunks for per-hunk review */
function createDiffHunks(oldFile: ProjectFile | undefined, newFile: ProjectFile): ChangeHunk[] {
  if (!oldFile) {
    // Entire file is new — single hunk
    return [{
      id: crypto.randomUUID(),
      filePath: newFile.path,
      lineStart: 1,
      lineEnd: newFile.content.split('\n').length,
      oldContent: '',
      newContent: newFile.content,
      description: 'New file',
      status: 'pending',
    }];
  }

  const oldLines = oldFile.content.split('\n');
  const newLines = newFile.content.split('\n');
  const hunks: ChangeHunk[] = [];

  // Simple LCS-based diff chunking
  let i = 0, j = 0;
  let hunkOldStart = -1;
  let hunkOldLines: string[] = [];
  let hunkNewLines: string[] = [];

  const flushHunk = () => {
    if (hunkOldStart >= 0 && (hunkOldLines.length > 0 || hunkNewLines.length > 0)) {
      // Describe what this hunk does
      let desc = 'Changed code';
      if (hunkOldLines.length === 0) desc = `Added ${hunkNewLines.length} line(s)`;
      else if (hunkNewLines.length === 0) desc = `Removed ${hunkOldLines.length} line(s)`;
      else desc = `Modified ${Math.max(hunkOldLines.length, hunkNewLines.length)} line(s)`;

      hunks.push({
        id: crypto.randomUUID(),
        filePath: newFile.path,
        lineStart: hunkOldStart + 1,
        lineEnd: hunkOldStart + Math.max(hunkOldLines.length, 1),
        oldContent: hunkOldLines.join('\n'),
        newContent: hunkNewLines.join('\n'),
        description: desc,
        status: 'pending',
      });
    }
    hunkOldStart = -1;
    hunkOldLines = [];
    hunkNewLines = [];
  };

  // Walk through both files finding differences
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      // Lines match — flush any accumulated diff
      flushHunk();
      i++;
      j++;
    } else {
      // Lines differ — accumulate
      if (hunkOldStart < 0) hunkOldStart = i;

      // Simple heuristic: advance both pointers, looking for re-sync
      if (i < oldLines.length && j < newLines.length) {
        hunkOldLines.push(oldLines[i]);
        hunkNewLines.push(newLines[j]);
        i++;
        j++;
      } else if (i < oldLines.length) {
        hunkOldLines.push(oldLines[i]);
        i++;
      } else {
        hunkNewLines.push(newLines[j]);
        j++;
      }
    }
  }
  flushHunk();

  return hunks;
}

export function usePostGenerationChangelog() {
  /** Generate changelog from before/after file snapshots */
  const generateChangelog = useCallback((
    beforeFiles: ProjectFile[],
    afterFiles: ProjectFile[],
    deletions: string[] = [],
  ): FileChange[] => {
    const changes: FileChange[] = [];
    const beforeMap = new Map(beforeFiles.map(f => [f.path, f]));
    const afterMap = new Map(afterFiles.map(f => [f.path, f]));

    // Added and modified files
    for (const [path, newFile] of afterMap) {
      const oldFile = beforeMap.get(path);
      if (!oldFile) {
        changes.push({
          path,
          type: 'added',
          summary: describeFileChange(undefined, newFile),
          hunks: createDiffHunks(undefined, newFile),
        });
      } else if (oldFile.content !== newFile.content) {
        changes.push({
          path,
          type: 'modified',
          summary: describeFileChange(oldFile, newFile),
          hunks: createDiffHunks(oldFile, newFile),
        });
      }
    }

    // Deleted files
    for (const path of deletions) {
      changes.push({
        path,
        type: 'deleted',
        summary: 'File removed',
        hunks: [],
      });
    }

    return changes;
  }, []);

  /** Apply only accepted hunks, reverting rejected ones */
  const applyHunkDecisions = useCallback((
    beforeFiles: ProjectFile[],
    afterFiles: ProjectFile[],
    changes: FileChange[],
  ): ProjectFile[] => {
    const result = new Map(afterFiles.map(f => [f.path, f]));
    const beforeMap = new Map(beforeFiles.map(f => [f.path, f]));

    for (const change of changes) {
      if (change.type === 'deleted') continue;

      const rejectedHunks = change.hunks.filter(h => h.status === 'rejected');
      if (rejectedHunks.length === 0) continue;

      // If ALL hunks are rejected, revert to the original file
      if (rejectedHunks.length === change.hunks.length) {
        const original = beforeMap.get(change.path);
        if (original) {
          result.set(change.path, original);
        } else {
          result.delete(change.path); // New file entirely rejected
        }
        continue;
      }

      // Partial rejection: reconstruct from accepted hunks only
      // For simplicity, keep the new file but revert rejected hunk regions
      const afterFile = result.get(change.path);
      const beforeFile = beforeMap.get(change.path);
      if (afterFile && beforeFile) {
        let content = afterFile.content;
        // Apply rejected hunks in reverse order (bottom-up)
        const sortedRejected = [...rejectedHunks].sort((a, b) => b.lineStart - a.lineStart);
        const lines = content.split('\n');
        for (const hunk of sortedRejected) {
          const start = Math.max(0, hunk.lineStart - 1);
          const newLines = hunk.newContent.split('\n');
          const oldLines = hunk.oldContent.split('\n');
          // Replace new content with old content
          lines.splice(start, newLines.length, ...oldLines);
        }
        result.set(change.path, { ...afterFile, content: lines.join('\n') });
      }
    }

    return Array.from(result.values());
  }, []);

  /** Generate a commit-style summary message */
  const generateCommitMessage = useCallback((changes: FileChange[]): string => {
    const added = changes.filter(c => c.type === 'added');
    const modified = changes.filter(c => c.type === 'modified');
    const deleted = changes.filter(c => c.type === 'deleted');

    const parts: string[] = [];
    if (added.length > 0) parts.push(`+${added.length} file(s)`);
    if (modified.length > 0) parts.push(`~${modified.length} file(s)`);
    if (deleted.length > 0) parts.push(`-${deleted.length} file(s)`);

    // Try to extract the main action from the largest change
    const mainChange = [...modified, ...added].sort((a, b) => b.hunks.length - a.hunks.length)[0];
    const action = mainChange ? mainChange.summary.split(',')[0] : 'Update project';

    return `${action} (${parts.join(', ')})`;
  }, []);

  return {
    generateChangelog,
    applyHunkDecisions,
    generateCommitMessage,
  };
}
