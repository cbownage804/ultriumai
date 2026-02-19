import { useState, useCallback, useRef } from 'react';

interface ErrorPattern {
  pattern: string;
  count: number;
  lastSeen: number;
  category: string;
}

const STORAGE_KEY = 'ai-builder-error-patterns';
const MAX_PATTERNS = 30;
const PATTERN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Known error categories with regex matchers */
const ERROR_CATEGORIES: [RegExp, string][] = [
  [/is not defined|ReferenceError/i, 'undefined_variable'],
  [/unexpected token|SyntaxError/i, 'syntax_error'],
  [/cannot read propert|TypeError.*null|TypeError.*undefined/i, 'null_access'],
  [/maximum update depth|infinite loop/i, 'infinite_loop'],
  [/hooks? can only be called/i, 'hook_violation'],
  [/module not found|cannot find module/i, 'missing_import'],
  [/duplicate|already declared/i, 'duplicate_declaration'],
  [/template literal|unterminated string/i, 'unclosed_string'],
  [/missing.*closing|unexpected end/i, 'unclosed_bracket'],
  [/failed to fetch|network|CORS/i, 'network_error'],
];

function categorize(message: string): string {
  for (const [regex, category] of ERROR_CATEGORIES) {
    if (regex.test(message)) return category;
  }
  return 'other';
}

/** Normalize error messages to group similar ones */
function normalize(message: string): string {
  return message
    .replace(/['"`][\w./\\-]+['"`]/g, '"X"') // replace quoted identifiers
    .replace(/\b\d+\b/g, 'N') // replace numbers
    .replace(/at line \d+/gi, 'at line N')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export function useErrorPatternLearning() {
  const [patterns, setPatterns] = useState<ErrorPattern[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed: ErrorPattern[] = JSON.parse(stored);
      const now = Date.now();
      return parsed.filter(p => now - p.lastSeen < PATTERN_EXPIRY_MS);
    } catch {
      return [];
    }
  });

  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((updated: ErrorPattern[]) => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, MAX_PATTERNS)));
      } catch { /* quota exceeded — ignore */ }
    }, 500);
  }, []);

  /** Record a new error occurrence */
  const recordError = useCallback((message: string) => {
    const normalized = normalize(message);
    const category = categorize(message);

    setPatterns(prev => {
      const existing = prev.find(p => p.pattern === normalized);
      let updated: ErrorPattern[];
      if (existing) {
        updated = prev.map(p =>
          p.pattern === normalized
            ? { ...p, count: p.count + 1, lastSeen: Date.now() }
            : p
        );
      } else {
        updated = [...prev, { pattern: normalized, count: 1, lastSeen: Date.now(), category }];
      }
      // Sort by count desc, keep top N
      updated.sort((a, b) => b.count - a.count);
      updated = updated.slice(0, MAX_PATTERNS);
      persist(updated);
      return updated;
    });
  }, [persist]);

  /** Get the top recurring error patterns for injection into system prompts */
  const getAntiPatternPrompt = useCallback((): string => {
    const frequent = patterns
      .filter(p => p.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    if (frequent.length === 0) return '';

    const categoryAdvice: Record<string, string> = {
      undefined_variable: 'Ensure every variable/function is declared or imported before use.',
      syntax_error: 'Double-check all brackets, quotes, and template literals are properly closed.',
      null_access: 'Add null/undefined checks before accessing object properties. Use optional chaining (?.).',
      infinite_loop: 'Avoid calling setState inside useEffect without proper dependency arrays.',
      hook_violation: 'Only call React hooks at the top level of function components, never inside conditions or loops.',
      missing_import: 'Verify every imported module exists in the project file list.',
      duplicate_declaration: 'Check for duplicate variable/function names across the same scope.',
      unclosed_string: 'Ensure all template literals and string quotes are properly terminated.',
      unclosed_bracket: 'Verify matching pairs for {}, (), [], and JSX tags.',
      network_error: 'Wrap all fetch calls in try/catch and handle errors gracefully.',
    };

    const categories = new Set(frequent.map(f => f.category));
    const advice = [...categories]
      .map(cat => categoryAdvice[cat])
      .filter(Boolean);

    if (advice.length === 0) return '';

    return [
      '\n[ERROR PREVENTION — Based on recent build history]',
      'AVOID these recurring issues:',
      ...advice.map((a, i) => `${i + 1}. ${a}`),
      '',
    ].join('\n');
  }, [patterns]);

  /** Clear all stored patterns */
  const clearPatterns = useCallback(() => {
    setPatterns([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    patterns,
    recordError,
    getAntiPatternPrompt,
    clearPatterns,
    totalErrors: patterns.reduce((sum, p) => sum + p.count, 0),
    topCategories: [...new Set(patterns.filter(p => p.count >= 2).map(p => p.category))],
  };
}
