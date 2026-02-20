import { useState, useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

const FILE_DELIMITER = /^===FILE:\s*(.+?)===$/;

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: 'html', htm: 'html', css: 'css', scss: 'scss',
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    json: 'json', md: 'markdown', svg: 'xml',
  };
  return map[ext] || 'plaintext';
}

/**
 * Incrementally parses ===FILE: blocks during streaming and emits
 * partial file updates so the preview can hot-reload as files complete.
 * 
 * PERF: partialFiles and completedFileCount are stored in refs (not state)
 * to avoid triggering re-renders of the 2700-line workspace component.
 * Consumers that need reactive updates (GeneratingOverlay, editor) poll
 * from refs using local state + setInterval.
 */
export function useStreamingPreview() {
  const partialFilesRef = useRef<ProjectFile[]>([]);
  const completedFileCountRef = useRef(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const lastEmittedRef = useRef<string>('');

  const parseIncremental = useCallback((rawContent: string) => {
    // Avoid re-parsing if content hasn't changed
    if (rawContent === lastEmittedRef.current) return;
    lastEmittedRef.current = rawContent;

    const lines = rawContent.split('\n');
    const files: ProjectFile[] = [];
    let currentPath: string | null = null;
    let currentLines: string[] = [];
    let completedCount = 0;

    const flush = (isComplete: boolean) => {
      if (currentPath) {
        const content = currentLines.join('\n').trimEnd();
        if (content) {
          files.push({
            path: currentPath,
            content,
            language: detectLanguage(currentPath),
          });
          if (isComplete) completedCount++;
        }
      }
    };

    for (const line of lines) {
      const match = line.match(FILE_DELIMITER);
      if (match) {
        flush(true); // previous file is complete when a new delimiter appears
        currentPath = match[1].trim();
        currentLines = [];
      } else if (currentPath !== null) {
        currentLines.push(line);
      }
    }
    // Flush the last file as in-progress (not complete yet since stream may continue)
    flush(false);

    if (files.length > 0) {
      partialFilesRef.current = files;
      completedFileCountRef.current = completedCount;
    }
  }, []);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    partialFilesRef.current = [];
    completedFileCountRef.current = 0;
    lastEmittedRef.current = '';
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  return {
    partialFilesRef,
    completedFileCountRef,
    isStreaming,
    parseIncremental,
    startStreaming,
    stopStreaming,
  };
}
