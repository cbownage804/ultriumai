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
 */
export function useStreamingPreview() {
  const [partialFiles, setPartialFiles] = useState<ProjectFile[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [completedFileCount, setCompletedFileCount] = useState(0);
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
      setPartialFiles(files);
      setCompletedFileCount(completedCount);
    }
  }, []);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setPartialFiles([]);
    setCompletedFileCount(0);
    lastEmittedRef.current = '';
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  return {
    partialFiles,
    isStreaming,
    completedFileCount,
    parseIncremental,
    startStreaming,
    stopStreaming,
  };
}
