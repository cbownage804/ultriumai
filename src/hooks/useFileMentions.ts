/**
 * Wave 10: @-File Mentions in Chat
 * Provides autocomplete suggestions when user types @ in the chat input.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface FileMention {
  path: string;
  shortName: string;
}

export function useFileMentions(files: ProjectFile[]) {
  const [mentionedFiles, setMentionedFiles] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const suggestions = useMemo(() => {
    const q = autocompleteQuery.toLowerCase();
    return files
      .map(f => ({
        path: f.path,
        shortName: f.path.split('/').pop() || f.path,
      }))
      .filter(f => !q || f.path.toLowerCase().includes(q) || f.shortName.toLowerCase().includes(q))
      .slice(0, 10);
  }, [files, autocompleteQuery]);

  const handleInputChange = useCallback((value: string, cursorPos: number) => {
    // Find @ trigger before cursor
    const beforeCursor = value.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex >= 0) {
      const afterAt = beforeCursor.slice(atIndex + 1);
      // Only show if no space in the query (still typing filename)
      if (!afterAt.includes(' ') && afterAt.length < 60) {
        setShowAutocomplete(true);
        setAutocompleteQuery(afterAt);
        setCursorPosition(cursorPos);
        return;
      }
    }
    setShowAutocomplete(false);
    setAutocompleteQuery('');
  }, []);

  const selectFile = useCallback((path: string, currentInput: string): string => {
    // Add to mentioned files
    setMentionedFiles(prev => prev.includes(path) ? prev : [...prev, path]);
    setShowAutocomplete(false);
    setAutocompleteQuery('');

    // Replace @query with @filename in input
    const beforeCursor = currentInput.slice(0, cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex >= 0) {
      const shortName = path.split('/').pop() || path;
      return beforeCursor.slice(0, atIndex) + `@${shortName} ` + currentInput.slice(cursorPosition);
    }
    return currentInput;
  }, [cursorPosition]);

  const removeMention = useCallback((path: string) => {
    setMentionedFiles(prev => prev.filter(p => p !== path));
  }, []);

  const clearMentions = useCallback(() => {
    setMentionedFiles([]);
  }, []);

  /** Build context prefix from mentioned files */
  const buildMentionContext = useCallback((allFiles: ProjectFile[]): string => {
    if (mentionedFiles.length === 0) return '';
    const parts = mentionedFiles.map(path => {
      const file = allFiles.find(f => f.path === path);
      if (!file) return '';
      return `[MENTIONED FILE: ${path}]\n${file.content}\n[/MENTIONED FILE]`;
    }).filter(Boolean);
    return parts.length > 0 ? parts.join('\n\n') + '\n\n' : '';
  }, [mentionedFiles]);

  return {
    mentionedFiles,
    showAutocomplete,
    suggestions,
    handleInputChange,
    selectFile,
    removeMention,
    clearMentions,
    buildMentionContext,
    setShowAutocomplete,
  };
}
