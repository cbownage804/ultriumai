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
  // Cache: track the byte offset of the last fully-scanned delimiter boundary
  const lastScanOffsetRef = useRef(0);
  const cachedFilesRef = useRef<{ path: string; startOffset: number }[]>([]);

  const parseIncremental = useCallback((rawContent: string) => {
    // Avoid re-parsing if content hasn't changed
    if (rawContent === lastEmittedRef.current) return;
    lastEmittedRef.current = rawContent;

    // Optimization: only scan new content from lastScanOffset for new delimiters
    const lastOffset = lastScanOffsetRef.current;
    const cached = cachedFilesRef.current;

    // Find new delimiters in the new portion
    let scanFrom = lastOffset;
    const newDelimiters: { path: string; offset: number }[] = [];
    
    while (scanFrom < rawContent.length) {
      const nlIdx = rawContent.indexOf('\n', scanFrom);
      if (nlIdx === -1) break;
      const line = rawContent.slice(scanFrom, nlIdx);
      const match = line.match(FILE_DELIMITER);
      if (match) {
        newDelimiters.push({ path: match[1].trim(), offset: scanFrom });
      }
      scanFrom = nlIdx + 1;
    }

    // Merge new delimiters into cache
    if (newDelimiters.length > 0) {
      // The last cached file boundary might need updating if we found delimiters
      cached.push(...newDelimiters.map(d => ({ path: d.path, startOffset: d.offset })));
      lastScanOffsetRef.current = scanFrom;
    } else {
      lastScanOffsetRef.current = scanFrom;
    }

    // Build files from all known delimiters
    const files: ProjectFile[] = [];
    let completedCount = 0;
    const allDelimiters = cached;

    for (let i = 0; i < allDelimiters.length; i++) {
      const delim = allDelimiters[i];
      // Content starts after the delimiter line
      const contentStart = rawContent.indexOf('\n', delim.startOffset);
      if (contentStart === -1) continue;
      
      const contentEnd = i < allDelimiters.length - 1 
        ? allDelimiters[i + 1].startOffset 
        : rawContent.length;
      
      const content = rawContent.slice(contentStart + 1, contentEnd).trimEnd();
      if (content) {
        files.push({
          path: delim.path,
          content,
          language: detectLanguage(delim.path),
        });
        // File is complete if there's a next delimiter after it
        if (i < allDelimiters.length - 1) completedCount++;
      }
    }

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
    lastScanOffsetRef.current = 0;
    cachedFilesRef.current = [];
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
