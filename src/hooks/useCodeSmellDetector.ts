import { useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import type { CodeSuggestion } from '@/components/ai-builder/AICodeIntelligence';

interface CodeSmell {
  pattern: RegExp;
  message: string;
  title: string;
  severity: 'info' | 'warning' | 'error';
  type: CodeSuggestion['type'];
  fix?: string;
}

const CODE_SMELLS: CodeSmell[] = [
  {
    pattern: /style=\{\{[^}]+\}\}/g,
    message: 'Inline styles detected. Consider using Tailwind utility classes for consistency and maintainability.',
    title: 'Inline style — use Tailwind',
    severity: 'info',
    type: 'refactor',
  },
  {
    pattern: /catch\s*\(\s*\)\s*\{[\s\n]*\}/g,
    message: 'Empty catch block silently swallows errors. Add error handling or at least log the error.',
    title: 'Empty catch block',
    severity: 'warning',
    type: 'error',
  },
  {
    pattern: /:\s*any\b/g,
    message: 'TypeScript "any" type defeats type safety. Consider using a specific type or unknown.',
    title: 'Avoid "any" type',
    severity: 'info',
    type: 'hint',
  },
  {
    pattern: /console\.log\(/g,
    message: 'console.log left in code. Remove before production or replace with proper logging.',
    title: 'Remove console.log',
    severity: 'info',
    type: 'hint',
  },
  {
    pattern: /document\.querySelector|document\.getElementById/g,
    message: 'Direct DOM access in React — use refs instead for better React integration.',
    title: 'Use React refs instead of DOM queries',
    severity: 'info',
    type: 'refactor',
  },
  {
    pattern: /useEffect\(\s*\(\)\s*=>\s*\{[^}]*fetch\(/g,
    message: 'Data fetching in useEffect — consider using React Query or a dedicated data hook.',
    title: 'Move fetch to data hook',
    severity: 'info',
    type: 'refactor',
  },
  {
    pattern: /className="[^"]{100,}"/g,
    message: 'Very long className string. Consider extracting to a variable or using cn() utility.',
    title: 'Long className — extract to variable',
    severity: 'info',
    type: 'refactor',
  },
  {
    pattern: /!important/g,
    message: 'CSS !important detected — this can lead to specificity wars. Try restructuring styles.',
    title: 'Avoid !important',
    severity: 'warning',
    type: 'hint',
  },
];

export function useCodeSmellDetector() {
  const analyzeFiles = useCallback((files: ProjectFile[]): CodeSuggestion[] => {
    const suggestions: CodeSuggestion[] = [];
    const codeFiles = files.filter(f => /\.(tsx?|jsx?|css|html)$/.test(f.path));

    for (const file of codeFiles) {
      const lines = file.content.split('\n');

      for (const smell of CODE_SMELLS) {
        // Reset regex state
        smell.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = smell.pattern.exec(file.content)) !== null) {
          // Find line number
          const beforeMatch = file.content.slice(0, match.index);
          const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;

          // Deduplicate — max 3 per smell per file
          const existing = suggestions.filter(s => s.title === smell.title && s.filePath === file.path);
          if (existing.length >= 3) continue;

          suggestions.push({
            id: crypto.randomUUID(),
            type: smell.type,
            title: smell.title,
            description: smell.message,
            filePath: file.path,
            line: lineNum,
            severity: smell.severity,
            code: lines[lineNum - 1]?.trim().slice(0, 120),
            timestamp: new Date(),
          });
        }
      }
    }

    return suggestions.slice(0, 50); // Cap total suggestions
  }, []);

  return { analyzeFiles };
}
