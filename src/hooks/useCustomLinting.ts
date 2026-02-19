import { useState, useCallback } from 'react';

export interface LintRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  patternType: 'regex' | 'ast' | 'string';
  severity: 'error' | 'warning' | 'info';
  message: string;
  autoFix?: string;
  fileGlob: string;
  isActive: boolean;
  category: string;
}

export interface LintResult {
  id: string;
  ruleId: string;
  filePath: string;
  line: number;
  column: number;
  message: string;
  severity: LintRule['severity'];
  fixAvailable: boolean;
}

export function useCustomLinting() {
  const [rules, setRules] = useState<LintRule[]>([]);
  const [results, setResults] = useState<LintResult[]>([]);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);

  const RULE_PRESETS: Record<string, Partial<LintRule>> = {
    noConsoleLog: { name: 'No console.log', pattern: 'console\\.log\\(', patternType: 'regex', severity: 'warning', message: 'Remove console.log before production', category: 'cleanup', fileGlob: '*.tsx' },
    noAny: { name: 'No "any" type', pattern: ':\\s*any\\b', patternType: 'regex', severity: 'error', message: 'Avoid using "any" type', category: 'typescript', fileGlob: '*.ts' },
    noInlineStyles: { name: 'No inline styles', pattern: 'style=\\{\\{', patternType: 'regex', severity: 'warning', message: 'Use Tailwind classes instead of inline styles', category: 'style', fileGlob: '*.tsx' },
    noMagicNumbers: { name: 'No magic numbers', pattern: '(?<!\\w)\\d{2,}(?!\\w)', patternType: 'regex', severity: 'info', message: 'Extract magic numbers into named constants', category: 'readability', fileGlob: '*.ts' },
  };

  const createRule = useCallback((presetKey?: string) => {
    const preset = presetKey ? RULE_PRESETS[presetKey] : undefined;
    const rule: LintRule = {
      id: crypto.randomUUID(),
      name: preset?.name || 'New Rule',
      description: '', pattern: preset?.pattern || '',
      patternType: preset?.patternType || 'regex',
      severity: preset?.severity || 'warning',
      message: preset?.message || 'Lint violation',
      fileGlob: preset?.fileGlob || '*.*',
      isActive: true, category: preset?.category || 'general',
    };
    setRules(prev => [...prev, rule]);
    setActiveRuleId(rule.id);
    return rule;
  }, []);

  const updateRule = useCallback((id: string, update: Partial<LintRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...update } : r));
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    setResults(prev => prev.filter(r => r.ruleId !== id));
  }, []);

  const simulateLint = useCallback((code: string, fileName: string) => {
    const newResults: LintResult[] = [];
    const lines = code.split('\n');
    for (const rule of rules.filter(r => r.isActive)) {
      try {
        const regex = new RegExp(rule.pattern, 'g');
        lines.forEach((line, i) => {
          let match;
          while ((match = regex.exec(line)) !== null) {
            newResults.push({
              id: crypto.randomUUID(), ruleId: rule.id, filePath: fileName,
              line: i + 1, column: match.index + 1, message: rule.message,
              severity: rule.severity, fixAvailable: !!rule.autoFix,
            });
          }
        });
      } catch {}
    }
    setResults(newResults);
    return newResults;
  }, [rules]);

  const clearResults = useCallback(() => setResults([]), []);
  const getActiveRule = useCallback(() => rules.find(r => r.id === activeRuleId) || null, [rules, activeRuleId]);

  const generateEslintConfig = useCallback((): string => {
    return JSON.stringify({
      rules: Object.fromEntries(rules.filter(r => r.isActive).map(r => [
        r.name.toLowerCase().replace(/\s+/g, '-'),
        [r.severity === 'error' ? 'error' : r.severity === 'warning' ? 'warn' : 'off'],
      ])),
      overrides: rules.filter(r => r.isActive && r.fileGlob !== '*.*').map(r => ({
        files: [r.fileGlob], rules: { [r.name.toLowerCase().replace(/\s+/g, '-')]: [r.severity === 'error' ? 'error' : 'warn'] },
      })),
    }, null, 2);
  }, [rules]);

  return {
    rules, results, activeRuleId, setActiveRuleId, getActiveRule,
    RULE_PRESETS: Object.keys(RULE_PRESETS),
    createRule, updateRule, removeRule, simulateLint, clearResults, generateEslintConfig,
  };
}
