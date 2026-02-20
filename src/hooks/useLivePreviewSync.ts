import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface PatchMessage {
  type: '__LIVE_PATCH__';
  patches: FilePatch[];
}

export interface FilePatch {
  path: string;
  kind: 'css' | 'js' | 'html-body';
  content: string;
}

/**
 * Detects incremental file changes and sends hot-patches to the preview
 * iframe via postMessage, avoiding full srcdoc reloads for CSS-only or
 * minor HTML changes.
 */
export function useLivePreviewSync() {
  const prevFilesRef = useRef<Map<string, string>>(new Map());

  /**
   * Compare current files against the last snapshot and return patches.
   * Returns null if a full reload is required (structural HTML change or new/deleted files).
   */
  const detectPatches = useCallback((files: ProjectFile[]): FilePatch[] | null => {
    const prev = prevFilesRef.current;
    const current = new Map(files.map(f => [f.path, f.content]));

    // If file count changed (added/removed), require full reload
    if (prev.size > 0 && prev.size !== current.size) {
      prevFilesRef.current = current;
      return null;
    }

    // If any file was added or removed, require full reload
    if (prev.size > 0) {
      for (const key of current.keys()) {
        if (!prev.has(key)) {
          prevFilesRef.current = current;
          return null;
        }
      }
    }

    const patches: FilePatch[] = [];

    for (const [path, content] of current) {
      const oldContent = prev.get(path);
      if (oldContent === content) continue;

      const ext = path.split('.').pop()?.toLowerCase() || '';

      if (ext === 'css' || ext === 'scss') {
        patches.push({ path, kind: 'css', content });
      } else if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
        // Phase 33: JS/TS changes require reload (can't safely hot-swap scripts)
        // Especially for React components, we need a full re-mount
        prevFilesRef.current = current;
        return null;
      } else if (ext === 'html' || ext === 'htm') {
        // Check if only body content changed (not <head> structure)
        if (oldContent) {
          const oldBody = extractBody(oldContent);
          const newBody = extractBody(content);
          const oldHead = extractHead(oldContent);
          const newHead = extractHead(content);

          if (oldHead === newHead && oldBody !== newBody) {
            patches.push({ path, kind: 'html-body', content: newBody });
          } else {
            // Head changed — full reload needed
            prevFilesRef.current = current;
            return null;
          }
        } else {
          prevFilesRef.current = current;
          return null;
        }
      }
    }

    prevFilesRef.current = current;
    return patches.length > 0 ? patches : [];
  }, []);

  /**
   * Send patches to the iframe via postMessage.
   * Returns true if patches were sent, false if a full reload is needed.
   */
  const applyPatches = useCallback((
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
    files: ProjectFile[],
  ): boolean => {
    if (!iframeRef.current?.contentWindow) return false;
    if (prevFilesRef.current.size === 0) {
      // First render — just snapshot, no patches
      prevFilesRef.current = new Map(files.map(f => [f.path, f.content]));
      return false;
    }

    const patches = detectPatches(files);
    if (patches === null || patches.length === 0) {
      return patches !== null; // null = reload needed, [] = no changes
    }

    const message: PatchMessage = {
      type: '__LIVE_PATCH__',
      patches,
    };

    iframeRef.current.contentWindow.postMessage(message, '*');
    return true;
  }, [detectPatches]);

  /** Reset the file snapshot (e.g., after a full reload) */
  const resetSnapshot = useCallback((files: ProjectFile[]) => {
    prevFilesRef.current = new Map(files.map(f => [f.path, f.content]));
  }, []);

  return { applyPatches, resetSnapshot, detectPatches };
}

function extractBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match?.[1]?.trim() || '';
}

function extractHead(html: string): string {
  const match = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return match?.[1]?.trim() || '';
}
