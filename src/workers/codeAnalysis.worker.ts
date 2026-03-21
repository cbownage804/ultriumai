/**
 * Web Worker: Code smell detection + custom linting
 * Runs regex-heavy analysis off the main thread to prevent UI freezes.
 */

interface FileInput {
  path: string;
  content: string;
}

interface SmellResult {
  id: string;
  type: 'refactor' | 'error' | 'hint';
  title: string;
  description: string;
  filePath: string;
  line: number;
  severity: 'info' | 'warning' | 'error';
  code: string;
}

interface CodeSmell {
  pattern: string; // Serialized regex source
  flags: string;
  message: string;
  title: string;
  severity: 'info' | 'warning' | 'error';
  type: 'refactor' | 'error' | 'hint';
}

const CODE_SMELLS: CodeSmell[] = [
  { pattern: 'style=\\{\\{[^}]+\\}\\}', flags: 'g', message: 'Inline styles detected. Consider using Tailwind utility classes.', title: 'Inline style — use Tailwind', severity: 'info', type: 'refactor' },
  { pattern: 'catch\\s*\\(\\s*\\)\\s*\\{[\\s\\n]*\\}', flags: 'g', message: 'Empty catch block silently swallows errors.', title: 'Empty catch block', severity: 'warning', type: 'error' },
  { pattern: ':\\s*any\\b', flags: 'g', message: 'TypeScript "any" defeats type safety.', title: 'Avoid "any" type', severity: 'info', type: 'hint' },
  { pattern: 'console\\.log\\(', flags: 'g', message: 'console.log left in code. Remove before production.', title: 'Remove console.log', severity: 'info', type: 'hint' },
  { pattern: 'document\\.querySelector|document\\.getElementById', flags: 'g', message: 'Direct DOM access — use React refs instead.', title: 'Use React refs', severity: 'info', type: 'refactor' },
  { pattern: 'className="[^"]{100,}"', flags: 'g', message: 'Very long className. Consider extracting or using cn().', title: 'Long className', severity: 'info', type: 'refactor' },
  { pattern: '!important', flags: 'g', message: 'CSS !important can lead to specificity wars.', title: 'Avoid !important', severity: 'warning', type: 'hint' },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function analyzeFiles(files: FileInput[]): SmellResult[] {
  const suggestions: SmellResult[] = [];
  const codeFiles = files.filter(f => /\.(tsx?|jsx?|css|html)$/.test(f.path));

  for (const file of codeFiles) {
    const lines = file.content.split('\n');

    for (const smell of CODE_SMELLS) {
      const regex = new RegExp(smell.pattern, smell.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(file.content)) !== null) {
        const beforeMatch = file.content.slice(0, match.index);
        const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;

        const existing = suggestions.filter(s => s.title === smell.title && s.filePath === file.path);
        if (existing.length >= 3) continue;

        suggestions.push({
          id: generateId(),
          type: smell.type,
          title: smell.title,
          description: smell.message,
          filePath: file.path,
          line: lineNum,
          severity: smell.severity,
          code: lines[lineNum - 1]?.trim().slice(0, 120) || '',
        });
      }
    }
  }

  return suggestions.slice(0, 50);
}

// Custom lint rules (same pattern as useCustomLinting)
interface LintRule {
  pattern: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface LintResult {
  id: string;
  ruleIndex: number;
  filePath: string;
  line: number;
  column: number;
  message: string;
  severity: string;
}

function runLintRules(code: string, fileName: string, rules: LintRule[]): LintResult[] {
  const results: LintResult[] = [];
  const lines = code.split('\n');

  for (let ri = 0; ri < rules.length; ri++) {
    const rule = rules[ri];
    try {
      const regex = new RegExp(rule.pattern, 'g');
      for (let i = 0; i < lines.length; i++) {
        let match;
        while ((match = regex.exec(lines[i])) !== null) {
          results.push({
            id: generateId(),
            ruleIndex: ri,
            filePath: fileName,
            line: i + 1,
            column: match.index + 1,
            message: rule.message,
            severity: rule.severity,
          });
        }
      }
    } catch {
      // Invalid regex — skip
    }
  }

  return results;
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload, requestId } = e.data;

  try {
    if (type === 'analyzeSmells') {
      const results = analyzeFiles(payload.files);
      self.postMessage({ type: 'smellResults', results, requestId });
    } else if (type === 'runLint') {
      const results = runLintRules(payload.code, payload.fileName, payload.rules);
      self.postMessage({ type: 'lintResults', results, requestId });
    }
  } catch (err) {
    self.postMessage({ type: 'error', error: String(err), requestId });
  }
};
