/**
 * Phase 109: Multi-Cursor Editing Support
 * Enhances Monaco editor with multi-cursor, column selection, and cross-file find-replace.
 */
import { useCallback, useRef, useState } from 'react';

interface FindReplaceMatch {
  filePath: string;
  line: number;
  column: number;
  length: number;
  lineContent: string;
}

interface FindReplaceResult {
  query: string;
  matches: FindReplaceMatch[];
  totalCount: number;
}

export function useMultiCursorEditor() {
  const [findReplaceResult, setFindReplaceResult] = useState<FindReplaceResult | null>(null);
  const [isRegex, setIsRegex] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isWholeWord, setIsWholeWord] = useState(false);

  const findAcrossFiles = useCallback((
    query: string,
    files: { path: string; content: string }[],
    options?: { regex?: boolean; caseSensitive?: boolean; wholeWord?: boolean }
  ): FindReplaceResult => {
    const matches: FindReplaceMatch[] = [];
    if (!query) return { query, matches, totalCount: 0 };

    const flags = options?.caseSensitive ? 'g' : 'gi';
    let pattern: RegExp;

    try {
      if (options?.regex) {
        pattern = new RegExp(query, flags);
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBound = options?.wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(wordBound, flags);
      }
    } catch {
      return { query, matches, totalCount: 0 };
    }

    for (const file of files) {
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        let match: RegExpExecArray | null;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(lines[i])) !== null) {
          matches.push({
            filePath: file.path,
            line: i + 1,
            column: match.index + 1,
            length: match[0].length,
            lineContent: lines[i],
          });
          if (matches.length >= 500) break;
        }
        if (matches.length >= 500) break;
      }
      if (matches.length >= 500) break;
    }

    const result = { query, matches, totalCount: matches.length };
    setFindReplaceResult(result);
    return result;
  }, []);

  const replaceAcrossFiles = useCallback((
    query: string,
    replacement: string,
    files: { path: string; content: string }[],
    options?: { regex?: boolean; caseSensitive?: boolean; wholeWord?: boolean }
  ): { path: string; content: string }[] => {
    const flags = options?.caseSensitive ? 'g' : 'gi';
    let pattern: RegExp;

    try {
      if (options?.regex) {
        pattern = new RegExp(query, flags);
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBound = options?.wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(wordBound, flags);
      }
    } catch {
      return [];
    }

    const changed: { path: string; content: string }[] = [];
    for (const file of files) {
      const newContent = file.content.replace(pattern, replacement);
      if (newContent !== file.content) {
        changed.push({ path: file.path, content: newContent });
      }
    }
    return changed;
  }, []);

  const getMonacoMultiCursorConfig = useCallback(() => ({
    multiCursorModifier: 'ctrlCmd' as const,
    occurrencesHighlight: 'multiFile' as const,
    columnSelection: true,
    multiCursorMergeOverlapping: true,
    multiCursorPaste: 'spread' as const,
  }), []);

  return {
    findReplaceResult,
    isRegex,
    isCaseSensitive,
    isWholeWord,
    setIsRegex,
    setIsCaseSensitive,
    setIsWholeWord,
    findAcrossFiles,
    replaceAcrossFiles,
    getMonacoMultiCursorConfig,
    clearResults: useCallback(() => setFindReplaceResult(null), []),
  };
}
