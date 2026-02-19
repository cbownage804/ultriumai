/**
 * Natural Language to Regex — Phase 155
 * Converts plain English descriptions to tested regex patterns.
 */
import { useState, useCallback } from 'react';

export interface RegexEntry {
  id: string;
  description: string;
  pattern: string;
  flags: string;
  testInput: string;
  matches: { text: string; index: number; groups?: string[] }[];
  isValid: boolean;
  timestamp: Date;
}

const COMMON_PATTERNS: Record<string, { pattern: string; flags: string }> = {
  'email': { pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi' },
  'phone': { pattern: '\\+?\\d{1,4}[-.\\s]?\\(?\\d{1,3}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}', flags: 'g' },
  'url': { pattern: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*', flags: 'gi' },
  'ip address': { pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  'date': { pattern: '\\d{4}[-/]\\d{2}[-/]\\d{2}', flags: 'g' },
  'hex color': { pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'gi' },
  'number': { pattern: '-?\\d+(?:\\.\\d+)?', flags: 'g' },
  'uuid': { pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', flags: 'gi' },
  'html tag': { pattern: '<\\/?[a-z][a-z0-9]*[^>]*>', flags: 'gi' },
  'word': { pattern: '\\b\\w+\\b', flags: 'g' },
};

export function useNLToRegex() {
  const [entries, setEntries] = useState<RegexEntry[]>([]);
  const [currentPattern, setCurrentPattern] = useState('');
  const [currentFlags, setCurrentFlags] = useState('g');
  const [testInput, setTestInput] = useState('Hello world test@email.com 192.168.1.1 https://example.com #ff0000');

  const buildPrompt = useCallback((description: string): string => {
    return `Convert this natural language description to a JavaScript-compatible regular expression.

Description: "${description}"

Rules:
- Return ONLY the regex pattern (no delimiters, no flags)
- Use standard JavaScript regex syntax
- Make it as precise as possible
- On a second line, return the recommended flags (g, i, m, etc.)

Format:
PATTERN: <regex>
FLAGS: <flags>`;
  }, []);

  const testRegex = useCallback((pattern: string, flags: string, input: string): RegexEntry['matches'] => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches: RegexEntry['matches'] = [];
      let match: RegExpExecArray | null;

      if (flags.includes('g')) {
        while ((match = regex.exec(input)) !== null) {
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1).length > 0 ? match.slice(1) : undefined,
          });
          if (matches.length > 100) break;
        }
      } else {
        match = regex.exec(input);
        if (match) {
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1).length > 0 ? match.slice(1) : undefined,
          });
        }
      }
      return matches;
    } catch {
      return [];
    }
  }, []);

  const addEntry = useCallback((description: string, pattern: string, flags: string = 'g') => {
    const isValid = (() => { try { new RegExp(pattern, flags); return true; } catch { return false; } })();
    const matches = isValid ? testRegex(pattern, flags, testInput) : [];
    const entry: RegexEntry = {
      id: crypto.randomUUID(),
      description,
      pattern,
      flags,
      testInput,
      matches,
      isValid,
      timestamp: new Date(),
    };
    setEntries(prev => [entry, ...prev].slice(0, 50));
    setCurrentPattern(pattern);
    setCurrentFlags(flags);
    return entry;
  }, [testInput, testRegex]);

  const quickMatch = useCallback((description: string): { pattern: string; flags: string } | null => {
    const lower = description.toLowerCase();
    for (const [key, val] of Object.entries(COMMON_PATTERNS)) {
      if (lower.includes(key)) return val;
    }
    return null;
  }, []);

  const updateTestInput = useCallback((input: string) => {
    setTestInput(input);
    setEntries(prev => prev.map(e => {
      const matches = e.isValid ? testRegex(e.pattern, e.flags, input) : [];
      return { ...e, testInput: input, matches };
    }));
  }, [testRegex]);

  const clearEntries = useCallback(() => setEntries([]), []);

  return {
    entries, currentPattern, currentFlags, testInput,
    setCurrentPattern, setCurrentFlags, setTestInput: updateTestInput,
    buildPrompt, testRegex, addEntry, quickMatch, clearEntries,
    commonPatterns: Object.keys(COMMON_PATTERNS),
  };
}
