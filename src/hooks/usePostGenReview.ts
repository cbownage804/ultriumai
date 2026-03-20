/**
 * Wave 15: Post-Generation Code Review
 * Runs fast static analysis after each generation to catch common issues.
 */

import { useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface CodeIssue {
  id: string;
  file: string;
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  category: string;
  quickFix?: string; // Suggested replacement
}

interface ReviewResult {
  issues: CodeIssue[];
  score: number; // 0-100, higher = cleaner
  summary: string;
}

type Checker = (file: ProjectFile) => CodeIssue[];

/** Check for unused imports */
const checkUnusedImports: Checker = (file) => {
  const issues: CodeIssue[] = [];
  if (!/\.(tsx?|jsx?)$/.test(file.path)) return issues;

  const lines = file.content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^import\s+\{\s*([^}]+)\}\s+from/);
    if (!match) continue;

    const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop()!.trim()).filter(Boolean);
    const restOfFile = lines.slice(i + 1).join('\n');
    for (const name of names) {
      if (name === 'type' || name.length < 2) continue;
      // Check if the name appears outside import lines
      const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (!regex.test(restOfFile)) {
        issues.push({
          id: crypto.randomUUID(), file: file.path, line: i + 1,
          severity: 'warning', message: `Unused import: '${name}'`,
          category: 'unused-import',
        });
      }
    }
  }
  return issues;
};

/** Check for console.log statements */
const checkConsoleLogs: Checker = (file) => {
  const issues: CodeIssue[] = [];
  if (!/\.(tsx?|jsx?)$/.test(file.path)) return issues;
  if (file.path.includes('.test.') || file.path.includes('.spec.')) return issues;

  const lines = file.content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/console\.(log|debug|info)\s*\(/.test(lines[i]) && !lines[i].trim().startsWith('//')) {
      issues.push({
        id: crypto.randomUUID(), file: file.path, line: i + 1,
        severity: 'info', message: 'console.log left in production code',
        category: 'console-log',
        quickFix: lines[i].replace(/console\.(log|debug|info)\s*\([^)]*\);?\s*/, ''),
      });
    }
  }
  return issues;
};

/** Check for missing key props in .map() */
const checkMissingKeys: Checker = (file) => {
  const issues: CodeIssue[] = [];
  if (!/\.tsx$/.test(file.path)) return issues;

  const lines = file.content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    // Look for .map( that returns JSX without key
    if (/\.map\s*\(/.test(lines[i])) {
      // Check next few lines for JSX without key=
      const context = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');
      if (/<\w/.test(context) && !/key\s*=/.test(context) && /return\s/.test(context)) {
        issues.push({
          id: crypto.randomUUID(), file: file.path, line: i + 1,
          severity: 'warning', message: 'Missing key prop in .map() JSX — may cause rendering issues',
          category: 'missing-key',
        });
      }
    }
  }
  return issues;
};

/** Check for empty catch blocks */
const checkEmptyCatch: Checker = (file) => {
  const issues: CodeIssue[] = [];
  if (!/\.(tsx?|jsx?)$/.test(file.path)) return issues;

  const lines = file.content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(lines[i]) || 
        (lines[i].includes('catch') && lines[i + 1]?.trim() === '}')) {
      issues.push({
        id: crypto.randomUUID(), file: file.path, line: i + 1,
        severity: 'warning', message: 'Empty catch block — errors will be silently swallowed',
        category: 'empty-catch',
      });
    }
  }
  return issues;
};

/** Check for hardcoded URLs that look like API endpoints */
const checkHardcodedUrls: Checker = (file) => {
  const issues: CodeIssue[] = [];
  if (!/\.(tsx?|jsx?)$/.test(file.path)) return issues;
  if (file.path.includes('config') || file.path.includes('constant')) return issues;

  const lines = file.content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/['"]https?:\/\/(?:api\.|localhost)/.test(lines[i]) && 
        !lines[i].includes('unsplash') && !lines[i].includes('google') &&
        !lines[i].includes('//') && !lines[i].trim().startsWith('*')) {
      issues.push({
        id: crypto.randomUUID(), file: file.path, line: i + 1,
        severity: 'warning', message: 'Hardcoded API URL — consider using environment variables',
        category: 'hardcoded-url',
      });
    }
  }
  return issues;
};

const ALL_CHECKERS: Checker[] = [
  checkUnusedImports,
  checkConsoleLogs,
  checkMissingKeys,
  checkEmptyCatch,
  checkHardcodedUrls,
];

export function usePostGenReview() {
  const reviewFiles = useCallback((files: ProjectFile[]): ReviewResult => {
    const allIssues: CodeIssue[] = [];

    for (const file of files) {
      for (const checker of ALL_CHECKERS) {
        allIssues.push(...checker(file));
      }
    }

    // Score: start at 100, deduct per issue
    const deductions = { error: 10, warning: 3, info: 1 };
    const totalDeduction = allIssues.reduce((sum, i) => sum + deductions[i.severity], 0);
    const score = Math.max(0, Math.min(100, 100 - totalDeduction));

    const errors = allIssues.filter(i => i.severity === 'error').length;
    const warnings = allIssues.filter(i => i.severity === 'warning').length;
    const infos = allIssues.filter(i => i.severity === 'info').length;

    const parts: string[] = [];
    if (errors) parts.push(`${errors} error${errors > 1 ? 's' : ''}`);
    if (warnings) parts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
    if (infos) parts.push(`${infos} hint${infos > 1 ? 's' : ''}`);

    return {
      issues: allIssues,
      score,
      summary: parts.length > 0 ? `Code review: ${parts.join(', ')}` : 'Code review: Clean ✓',
    };
  }, []);

  return { reviewFiles };
}
