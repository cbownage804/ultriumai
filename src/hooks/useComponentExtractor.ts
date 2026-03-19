/**
 * Wave 10: AI-Powered Component Extraction
 * Detects inline component definitions in project files and suggests extraction.
 */

import { useMemo } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface ExtractionSuggestion {
  componentName: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
}

/** Detect inline component definitions (non-default-export function components) */
function detectInlineComponents(file: ProjectFile): ExtractionSuggestion[] {
  if (!file.path.endsWith('.tsx') && !file.path.endsWith('.jsx')) return [];
  
  const suggestions: ExtractionSuggestion[] = [];
  const lines = file.content.split('\n');
  
  // Track the default export name
  const defaultExportMatch = file.content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
  const defaultExportName = defaultExportMatch?.[1];
  
  // Find function components: function Name(...) { ... return ( <JSX )
  const funcPattern = /^(?:export\s+)?(?:const|function)\s+([A-Z]\w+)\s*[=(]/;
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcPattern);
    if (!match) continue;
    
    const name = match[1];
    if (name === defaultExportName) continue;
    
    // Check if this function returns JSX (scan next ~100 lines for <tag or React.createElement)
    let braceDepth = 0;
    let hasJSX = false;
    let endLine = i;
    
    for (let j = i; j < Math.min(i + 200, lines.length); j++) {
      for (const ch of lines[j]) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      if (lines[j].includes('return (') || lines[j].match(/<[A-Z]|<div|<span|<p |<h[1-6]|<section|<main|<button|<input|<form/)) {
        hasJSX = true;
      }
      if (braceDepth <= 0 && j > i) {
        endLine = j;
        break;
      }
    }
    
    // Only suggest if it returns JSX and is more than 5 lines
    if (hasJSX && endLine - i > 5) {
      suggestions.push({
        componentName: name,
        filePath: file.path,
        lineStart: i + 1,
        lineEnd: endLine + 1,
      });
    }
  }
  
  return suggestions;
}

export function useComponentExtractor(files: ProjectFile[]) {
  const suggestions = useMemo(() => {
    const all: ExtractionSuggestion[] = [];
    for (const file of files) {
      // Only scan larger files where extraction matters
      if (file.content.length < 3000) continue;
      all.push(...detectInlineComponents(file));
    }
    return all;
  }, [files]);

  const extractionPrompt = useMemo(() => {
    if (suggestions.length === 0) return null;
    const fileGroups = new Map<string, string[]>();
    for (const s of suggestions) {
      const names = fileGroups.get(s.filePath) || [];
      names.push(s.componentName);
      fileGroups.set(s.filePath, names);
    }
    const details = Array.from(fileGroups.entries())
      .map(([path, names]) => `${path}: ${names.join(', ')}`)
      .join('; ');
    return `Refactor: Extract ${suggestions.length} inline component${suggestions.length > 1 ? 's' : ''} into separate files (${details}). Move each component to its own file in the same directory, update imports in the original file, and ensure all props are properly typed.`;
  }, [suggestions]);

  return {
    suggestions,
    count: suggestions.length,
    extractionPrompt,
    hasExtractions: suggestions.length > 0,
  };
}
