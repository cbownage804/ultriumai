/**
 * AI Code Refactoring Agent — Phase 154
 * Detects code smells and provides one-click AI refactoring.
 */
import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface RefactorSuggestion {
  id: string;
  filePath: string;
  line: number;
  type: 'long-function' | 'deep-nesting' | 'duplicated-logic' | 'god-component' | 'complex-conditional';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  originalCode: string;
  suggestedPrompt: string;
  status: 'pending' | 'applied' | 'dismissed';
  timestamp: Date;
}

interface RefactorPattern {
  type: RefactorSuggestion['type'];
  title: string;
  description: string;
  severity: RefactorSuggestion['severity'];
  detect: (content: string, path: string) => { line: number; code: string }[];
  promptTemplate: (code: string, path: string) => string;
}

const PATTERNS: RefactorPattern[] = [
  {
    type: 'long-function',
    title: 'Function exceeds 50 lines',
    description: 'Long functions are harder to test and maintain. Consider splitting into smaller, focused functions.',
    severity: 'warning',
    detect: (content) => {
      const results: { line: number; code: string }[] = [];
      const lines = content.split('\n');
      let fnStart = -1;
      let braceDepth = 0;
      let fnName = '';
      for (let i = 0; i < lines.length; i++) {
        const fnMatch = lines[i].match(/(?:function|const|let|var)\s+(\w+).*(?:\{|=>)/);
        if (fnMatch && fnStart === -1) {
          fnStart = i;
          fnName = fnMatch[1];
          braceDepth = 0;
        }
        if (fnStart >= 0) {
          braceDepth += (lines[i].match(/\{/g) || []).length;
          braceDepth -= (lines[i].match(/\}/g) || []).length;
          if (braceDepth <= 0 && i > fnStart) {
            if (i - fnStart > 50) {
              results.push({ line: fnStart + 1, code: `${fnName} (${i - fnStart} lines)` });
            }
            fnStart = -1;
          }
        }
      }
      return results;
    },
    promptTemplate: (code, path) =>
      `Refactor this long function in ${path} into smaller, well-named helper functions. Preserve all behavior.\n\n${code}`,
  },
  {
    type: 'deep-nesting',
    title: 'Deeply nested code (4+ levels)',
    description: 'Deep nesting reduces readability. Use early returns, guard clauses, or extract functions.',
    severity: 'warning',
    detect: (content) => {
      const results: { line: number; code: string }[] = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const indent = lines[i].match(/^(\s*)/)?.[1].length || 0;
        const spaces = indent >= 16 ? true : false; // 4 levels × 4 spaces
        const tabs = lines[i].match(/^\t{4,}/) ? true : false;
        if ((spaces || tabs) && lines[i].trim().length > 0 && !lines[i].trim().startsWith('//')) {
          results.push({ line: i + 1, code: lines[i].trim().slice(0, 80) });
        }
      }
      return results.slice(0, 5);
    },
    promptTemplate: (code, path) =>
      `Reduce nesting in ${path} using early returns, guard clauses, or extracted helper functions. Preserve behavior.\n\n${code}`,
  },
  {
    type: 'complex-conditional',
    title: 'Complex conditional expression',
    description: 'Complex conditionals with 3+ operators are hard to understand. Extract to named variables or functions.',
    severity: 'info',
    detect: (content) => {
      const results: { line: number; code: string }[] = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const ops = (line.match(/&&|\|\|/g) || []).length;
        if (ops >= 3) {
          results.push({ line: i + 1, code: line.trim().slice(0, 100) });
        }
      }
      return results.slice(0, 5);
    },
    promptTemplate: (code, path) =>
      `Simplify this complex conditional in ${path} by extracting conditions into descriptive boolean variables.\n\n${code}`,
  },
  {
    type: 'god-component',
    title: 'Large component (300+ lines)',
    description: 'Very large React components should be decomposed into smaller sub-components.',
    severity: 'error',
    detect: (content, path) => {
      if (!/\.(tsx|jsx)$/.test(path)) return [];
      const lines = content.split('\n');
      if (lines.length > 300) {
        return [{ line: 1, code: `${path.split('/').pop()} (${lines.length} lines)` }];
      }
      return [];
    },
    promptTemplate: (code, path) =>
      `Break down this large React component in ${path} into smaller sub-components. Extract logical sections into separate components while keeping the same behavior.`,
  },
  {
    type: 'duplicated-logic',
    title: 'Potential duplicated patterns',
    description: 'Similar code blocks detected. Consider extracting shared logic into a utility function or custom hook.',
    severity: 'info',
    detect: (content) => {
      const results: { line: number; code: string }[] = [];
      const lines = content.split('\n');
      const seenBlocks = new Map<string, number>();
      for (let i = 0; i < lines.length - 2; i++) {
        const block = lines.slice(i, i + 3).map(l => l.trim()).join('|');
        if (block.length > 20 && !block.startsWith('import') && !block.startsWith('//')) {
          if (seenBlocks.has(block)) {
            results.push({ line: i + 1, code: `Duplicated block (first seen at line ${seenBlocks.get(block)})` });
          } else {
            seenBlocks.set(block, i + 1);
          }
        }
      }
      return results.slice(0, 3);
    },
    promptTemplate: (code, path) =>
      `Extract the duplicated code patterns in ${path} into reusable utility functions or hooks.\n\n${code}`,
  },
];

export function useAIRefactoring() {
  const [suggestions, setSuggestions] = useState<RefactorSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeProject = useCallback((files: ProjectFile[]) => {
    setIsAnalyzing(true);
    const results: RefactorSuggestion[] = [];
    const codeFiles = files.filter(f => /\.(tsx?|jsx?)$/.test(f.path));

    for (const file of codeFiles) {
      for (const pattern of PATTERNS) {
        const detections = pattern.detect(file.content, file.path);
        for (const det of detections) {
          results.push({
            id: crypto.randomUUID(),
            filePath: file.path,
            line: det.line,
            type: pattern.type,
            title: pattern.title,
            description: pattern.description,
            severity: pattern.severity,
            originalCode: det.code,
            suggestedPrompt: pattern.promptTemplate(det.code, file.path),
            status: 'pending',
            timestamp: new Date(),
          });
        }
      }
    }

    setSuggestions(results.slice(0, 100));
    setIsAnalyzing(false);
    return results;
  }, []);

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'dismissed' as const } : s));
  }, []);

  const markApplied = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'applied' as const } : s));
  }, []);

  const clearAll = useCallback(() => setSuggestions([]), []);

  const stats = {
    total: suggestions.filter(s => s.status === 'pending').length,
    errors: suggestions.filter(s => s.severity === 'error' && s.status === 'pending').length,
    warnings: suggestions.filter(s => s.severity === 'warning' && s.status === 'pending').length,
    info: suggestions.filter(s => s.severity === 'info' && s.status === 'pending').length,
  };

  return { suggestions, isAnalyzing, analyzeProject, dismissSuggestion, markApplied, clearAll, stats };
}
