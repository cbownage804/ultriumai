import { useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface ValidationIssue {
  file: string;
  line?: number;
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  score: number; // 0–100
}

/**
 * Post-generation output validator.
 * Catches common syntax/structural errors before rendering the preview.
 */
export function useOutputValidation() {
  const validate = useCallback((files: ProjectFile[]): ValidationResult => {
    const issues: ValidationIssue[] = [];

    for (const file of files) {
      const ext = file.path.split('.').pop()?.toLowerCase() || '';

      // ── HTML validation ──
      if (ext === 'html' || ext === 'htm') {
        validateHTML(file, issues);
      }

      // ── JS/TS/JSX/TSX validation ──
      if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) {
        validateJS(file, issues);
      }

      // ── CSS validation ──
      if (ext === 'css') {
        validateCSS(file, issues);
      }

      // ── General checks ──
      validateGeneral(file, issues);
    }

    // Cross-file checks
    validateImports(files, issues);

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const score = Math.max(0, 100 - (errorCount * 15) - (warningCount * 5));

    return {
      isValid: errorCount === 0,
      issues,
      score,
    };
  }, []);

  return { validate };
}

// ── HTML Checks ──
function validateHTML(file: ProjectFile, issues: ValidationIssue[]) {
  const content = file.content;

  // Unclosed tags (simple heuristic)
  const openTags = (content.match(/<(?!\/|!|br|hr|img|input|meta|link|area|base|col|embed|source|track|wbr)[a-z][a-z0-9]*(?:\s[^>]*)?>(?!.*<\/\1)/gi) || []).length;
  const closeTags = (content.match(/<\/[a-z][a-z0-9]*>/gi) || []).length;
  if (Math.abs(openTags - closeTags) > 3) {
    issues.push({ file: file.path, severity: 'warning', message: `Potential unclosed HTML tags (${openTags} open vs ${closeTags} close)` });
  }

  // Missing doctype
  if (file.path === 'index.html' && !content.includes('<!DOCTYPE') && !content.includes('<!doctype')) {
    issues.push({ file: file.path, severity: 'warning', message: 'Missing <!DOCTYPE html> declaration' });
  }
}

// ── JS/TS Checks ──
function validateJS(file: ProjectFile, issues: ValidationIssue[]) {
  const content = file.content;
  const lines = content.split('\n');

  // Bracket balance
  const brackets: Record<string, number> = { '{': 0, '(': 0, '[': 0 };
  const closers: Record<string, string> = { '}': '{', ')': '(', ']': '[' };
  // Strip strings and comments for accurate bracket counting
  const stripped = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, '""')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '""');

  for (const char of stripped) {
    if (char in brackets) brackets[char]++;
    if (char in closers) brackets[closers[char]]--;
  }

  if (brackets['{'] !== 0) {
    issues.push({ file: file.path, severity: 'error', message: `Unbalanced curly braces: ${brackets['{']} unclosed`, suggestion: 'Check for missing } at the end of functions or blocks' });
  }
  if (brackets['('] !== 0) {
    issues.push({ file: file.path, severity: 'error', message: `Unbalanced parentheses: ${brackets['(']} unclosed` });
  }
  if (brackets['['] !== 0) {
    issues.push({ file: file.path, severity: 'warning', message: `Unbalanced square brackets: ${brackets['[']} unclosed` });
  }

  // Duplicate function/const declarations
  const declarations = new Map<string, number>();
  lines.forEach((line, idx) => {
    const match = line.match(/^(?:export\s+)?(?:const|let|var|function|class)\s+(\w+)/);
    if (match) {
      const name = match[1];
      if (declarations.has(name)) {
        issues.push({ file: file.path, line: idx + 1, severity: 'warning', message: `Duplicate declaration: "${name}" (also at line ${declarations.get(name)})` });
      }
      declarations.set(name, idx + 1);
    }
  });

  // React-specific: hooks called conditionally
  if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
    let inConditional = 0;
    lines.forEach((line, idx) => {
      if (/\bif\s*\(/.test(line)) inConditional++;
      if (inConditional > 0 && /\buse[A-Z]\w*\s*\(/.test(line)) {
        issues.push({ file: file.path, line: idx + 1, severity: 'error', message: `React Hook called inside conditional block`, suggestion: 'Move hooks to the top level of the component' });
      }
      if (line.includes('}') && inConditional > 0) inConditional--;
    });
  }

  // Undefined references to common patterns
  if (/\bundefined\b/.test(content) === false) {
    // Check for obvious typos: console.olg, docuemnt, etc.
    const typos = [
      [/console\.\s*(?!log|warn|error|info|debug|trace|table|group|time|dir|assert|count|clear)\w+/g, 'Possible console method typo'],
      [/docuemnt|dcoument|documnet/gi, 'Typo: "document"'],
      [/widnow|windwo/gi, 'Typo: "window"'],
    ] as const;
    for (const [pattern, msg] of typos) {
      const match = content.match(pattern);
      if (match) {
        issues.push({ file: file.path, severity: 'warning', message: `${msg}: "${match[0]}"` });
      }
    }
  }

  // Empty export default
  if (/export\s+default\s*;/.test(content)) {
    issues.push({ file: file.path, severity: 'error', message: 'Empty export default statement' });
  }
}

// ── CSS Checks ──
function validateCSS(file: ProjectFile, issues: ValidationIssue[]) {
  const content = file.content;

  // Bracket balance
  const opens = (content.match(/{/g) || []).length;
  const closes = (content.match(/}/g) || []).length;
  if (opens !== closes) {
    issues.push({ file: file.path, severity: 'error', message: `Unbalanced CSS braces: ${opens} open vs ${closes} close` });
  }

  // Empty rules
  const emptyRules = content.match(/[^}]\s*{\s*}/g);
  if (emptyRules && emptyRules.length > 2) {
    issues.push({ file: file.path, severity: 'warning', message: `${emptyRules.length} empty CSS rules` });
  }
}

// ── General Checks ──
function validateGeneral(file: ProjectFile, issues: ValidationIssue[]) {
  // AI commentary leaked into code
  const aiLeaks = [
    /^(?:Sure|Here(?:'s| is)|I(?:'ve| have)|Let me|This (?:code|will|should))/m,
    /```(?:typescript|javascript|tsx|jsx|html|css)/,
    /^#{1,3}\s+/m,
  ];
  for (const pattern of aiLeaks) {
    if (pattern.test(file.content)) {
      issues.push({ file: file.path, severity: 'error', message: 'AI commentary detected in code output', suggestion: 'The parser may have failed to strip conversational text from code' });
      break;
    }
  }

  // Truncated file (ends mid-statement)
  const trimmed = file.content.trim();
  if (trimmed.length > 50) {
    const lastChar = trimmed[trimmed.length - 1];
    const dangerousEndings = [',', ':', '=', '+', '-', '(', '{', '[', '&&', '||'];
    if (dangerousEndings.includes(lastChar)) {
      issues.push({ file: file.path, severity: 'error', message: `File appears truncated (ends with "${lastChar}")`, suggestion: 'The AI may have hit a token limit mid-output' });
    }
  }
}

// ── Cross-file import validation ──
function validateImports(files: ProjectFile[], issues: ValidationIssue[]) {
  const filePaths = new Set(files.map(f => f.path));

  for (const file of files) {
    if (!file.path.match(/\.(js|ts|jsx|tsx)$/)) continue;

    // Find relative imports
    const importMatches = file.content.matchAll(/(?:import|from)\s+['"](\.[^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      // Resolve relative path (simplified)
      const resolved = resolveRelativeImport(file.path, importPath);
      const possiblePaths = [
        resolved,
        resolved + '.ts', resolved + '.tsx', resolved + '.js', resolved + '.jsx',
        resolved + '/index.ts', resolved + '/index.tsx', resolved + '/index.js',
      ];

      if (!possiblePaths.some(p => filePaths.has(p))) {
        // Only warn if the project has enough files to expect the import to exist
        if (files.length >= 3) {
          issues.push({ file: file.path, severity: 'warning', message: `Import "${importPath}" may not resolve to a project file` });
        }
      }
    }
  }
}

function resolveRelativeImport(fromPath: string, importPath: string): string {
  const fromDir = fromPath.split('/').slice(0, -1);
  const parts = importPath.split('/');

  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') fromDir.pop();
    else fromDir.push(part);
  }

  return fromDir.join('/');
}
