import { useState, useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

const FILE_DELIMITER = /^\s*===FILE:\s*(.+?)===\s*$/;
const END_MARKER = /^\s*===END===\s*$/;

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: 'html', htm: 'html', css: 'css', scss: 'scss',
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    json: 'json', md: 'markdown', svg: 'xml',
  };
  return map[ext] || 'plaintext';
}

export interface StreamingIntegrity {
  /** Whether ===END=== marker was found (stream completed fully) */
  hasEndMarker: boolean;
  /** Total files detected vs completed */
  totalFiles: number;
  completedFiles: number;
  /** Files that appear truncated (unbalanced brackets at EOF) */
  truncatedFiles: string[];
  /** Whether the stream is considered intact */
  isIntact: boolean;
}

/**
 * Quick check: does the file content look truncated?
 * Counts unbalanced braces/parens/brackets (skipping strings).
 */
function isFileTruncated(content: string): boolean {
  const stripped = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, '""')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/gs, '""');

  let braces = 0, parens = 0, brackets = 0;
  for (const ch of stripped) {
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '(') parens++;
    else if (ch === ')') parens--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }
  // Treat any positive imbalance as likely truncation for streamed source files.
  return braces > 0 || parens > 0 || brackets > 0;
}

/**
 * Incrementally parses ===FILE: blocks during streaming and emits
 * partial file updates so the preview can hot-reload as files complete.
 * 
 * PERF: partialFiles and completedFileCount are stored in refs (not state)
 * to avoid triggering re-renders of the 2700-line workspace component.
 * Consumers that need reactive updates (GeneratingOverlay, editor) poll
 * from refs using local state + setInterval.
 * 
 * RESILIENCE: Detects truncated streams (missing ===END===), truncated
 * files (unbalanced brackets), and stalled generation (no new bytes for 30s).
 */
export function useStreamingPreview() {
  const partialFilesRef = useRef<ProjectFile[]>([]);
  const completedFileCountRef = useRef(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const lastEmittedRef = useRef<string>('');
  // Cache: track the byte offset of the last fully-scanned delimiter boundary
  const lastScanOffsetRef = useRef(0);
  const cachedFilesRef = useRef<{ path: string; startOffset: number }[]>([]);
  
  // ── Integrity tracking ──
  const integrityRef = useRef<StreamingIntegrity>({
    hasEndMarker: false, totalFiles: 0, completedFiles: 0,
    truncatedFiles: [], isIntact: true,
  });
  // Stall detection: track last byte count + timestamp
  const lastBytesRef = useRef(0);
  const lastProgressRef = useRef(Date.now());
  const stallDetectedRef = useRef(false);
  const STALL_THRESHOLD_MS = 30_000;

  const parseIncremental = useCallback((rawContent: string) => {
    // Avoid re-parsing if content hasn't changed
    if (rawContent === lastEmittedRef.current) return;
    lastEmittedRef.current = rawContent;

    // ── Stall detection ──
    if (rawContent.length !== lastBytesRef.current) {
      lastBytesRef.current = rawContent.length;
      lastProgressRef.current = Date.now();
      stallDetectedRef.current = false;
    } else if (Date.now() - lastProgressRef.current > STALL_THRESHOLD_MS) {
      stallDetectedRef.current = true;
    }

    // ── Check for ===END=== marker ──
    const hasEndMarker = rawContent
      .split('\n')
      .slice(-8)
      .some((line) => END_MARKER.test(line));
    integrityRef.current.hasEndMarker = hasEndMarker;

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
      cached.push(...newDelimiters.map(d => ({ path: d.path, startOffset: d.offset })));
      lastScanOffsetRef.current = scanFrom;
    } else {
      lastScanOffsetRef.current = scanFrom;
    }

    // Build files from all known delimiters
    const files: ProjectFile[] = [];
    let completedCount = 0;
    const truncatedFiles: string[] = [];
    const allDelimiters = cached;

    for (let i = 0; i < allDelimiters.length; i++) {
      const delim = allDelimiters[i];
      const contentStart = rawContent.indexOf('\n', delim.startOffset);
      if (contentStart === -1) continue;

      const isLastFile = i === allDelimiters.length - 1;
      const contentEnd = !isLastFile
        ? allDelimiters[i + 1].startOffset
        : rawContent.length;

      // Strip ===END=== from last file content
      let content = rawContent.slice(contentStart + 1, contentEnd).trimEnd();
      content = content.replace(/\n\s*===END===\s*$/, '');

      if (content) {
        const ext = delim.path.split('.').pop()?.toLowerCase() || '';
        const shouldCheckTruncation = ['ts', 'tsx', 'js', 'jsx'].includes(ext);
        const isTruncated = shouldCheckTruncation && isFileTruncated(content);

        files.push({
          path: delim.path,
          content,
          language: detectLanguage(delim.path),
          ...(isLastFile && (!hasEndMarker || isTruncated) ? { incomplete: true } : {}),
        });

        if (!isLastFile) {
          completedCount++;
        }

        if (isTruncated) {
          truncatedFiles.push(delim.path);
        }
      }
    }

    if (files.length > 0) {
      partialFilesRef.current = files;
      completedFileCountRef.current = completedCount;
    }

    // Update integrity summary
    integrityRef.current = {
      hasEndMarker,
      totalFiles: files.length,
      completedFiles: completedCount,
      truncatedFiles,
      isIntact: hasEndMarker && truncatedFiles.length === 0,
    };
  }, []);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    partialFilesRef.current = [];
    completedFileCountRef.current = 0;
    lastEmittedRef.current = '';
    lastScanOffsetRef.current = 0;
    cachedFilesRef.current = [];
    lastBytesRef.current = 0;
    lastProgressRef.current = Date.now();
    stallDetectedRef.current = false;
    integrityRef.current = {
      hasEndMarker: false, totalFiles: 0, completedFiles: 0,
      truncatedFiles: [], isIntact: true,
    };
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  /** Get stream integrity report (call after generation ends) */
  const getIntegrity = useCallback((): StreamingIntegrity => ({
    ...integrityRef.current,
  }), []);

  /** Whether the stream appears stalled (no new bytes for 30s) */
  const isStalled = useCallback((): boolean => stallDetectedRef.current, []);

  return {
    partialFilesRef,
    completedFileCountRef,
    isStreaming,
    parseIncremental,
    startStreaming,
    stopStreaming,
    getIntegrity,
    isStalled,
  };
}
