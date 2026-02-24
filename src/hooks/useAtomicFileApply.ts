import { useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface FileChangeOperation {
  type: 'create' | 'edit' | 'delete';
  path: string;
  content?: string;
  /** For edits: the unified diff hunk */
  diffHunk?: string;
}

export interface AtomicApplyResult {
  success: boolean;
  appliedFiles: string[];
  failedFiles: { path: string; error: string }[];
  snapshot: ProjectFile[];
}

/**
 * Applies multiple file changes atomically with a single undo snapshot.
 * If any file fails, all changes are rolled back.
 */
export function useAtomicFileApply() {
  const applyBatch = useCallback((
    operations: FileChangeOperation[],
    currentFiles: ProjectFile[],
    pushUndo: (label: string, files: ProjectFile[]) => void,
  ): AtomicApplyResult => {
    // Take snapshot before any changes
    const snapshot = currentFiles.map(f => ({ ...f }));
    const appliedFiles: string[] = [];
    const failedFiles: { path: string; error: string }[] = [];

    // Work on a copy
    let workingFiles = currentFiles.map(f => ({ ...f }));

    for (const op of operations) {
      try {
        switch (op.type) {
          case 'create': {
            if (!op.content) throw new Error('Content required for create');
            const existing = workingFiles.findIndex(f => f.path === op.path);
            if (existing >= 0) {
              workingFiles[existing] = { ...workingFiles[existing], content: op.content };
            } else {
              workingFiles.push({
                path: op.path,
                content: op.content,
                language: detectLanguage(op.path),
              });
            }
            appliedFiles.push(op.path);
            break;
          }
          case 'edit': {
            const fileIdx = workingFiles.findIndex(f => f.path === op.path);
            if (fileIdx < 0) throw new Error(`File not found: ${op.path}`);
            if (op.content) {
              workingFiles[fileIdx] = { ...workingFiles[fileIdx], content: op.content };
            }
            appliedFiles.push(op.path);
            break;
          }
          case 'delete': {
            workingFiles = workingFiles.filter(f => f.path !== op.path);
            appliedFiles.push(op.path);
            break;
          }
        }
      } catch (err) {
        failedFiles.push({ path: op.path, error: (err as Error).message });
      }
    }

    // If any failed, roll back all
    if (failedFiles.length > 0) {
      return {
        success: false,
        appliedFiles: [],
        failedFiles,
        snapshot,
      };
    }

    // Push single undo snapshot for entire batch
    pushUndo(`Batch: ${operations.length} file(s)`, snapshot);

    return {
      success: true,
      appliedFiles,
      failedFiles: [],
      snapshot,
    };
  }, []);

  return { applyBatch };
}

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact',
    js: 'javascript', jsx: 'javascriptreact',
    css: 'css', html: 'html', json: 'json',
    md: 'markdown', sql: 'sql',
  };
  return map[ext] || 'plaintext';
}
