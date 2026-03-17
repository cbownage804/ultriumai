import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Pre-compile validation — lightweight syntax checks that run instantly
 * before sending files to the Vite Sandbox. Catches obvious errors in <1ms
 * instead of waiting for a 25s round-trip to fail.
 */

export interface PreCompileIssue {
  file: string;
  message: string;
  severity: 'error' | 'warning';
}

export function preCompileValidate(files: ProjectFile[]): PreCompileIssue[] {
  const issues: PreCompileIssue[] = [];

  for (const file of files) {
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
    if (!['ts', 'tsx', 'js', 'jsx'].includes(ext)) continue;

    const content = file.content;
    if (!content.trim()) continue;

    // ── 1. Bracket balance check ──
    const bracketIssue = checkBracketBalance(content);
    if (bracketIssue) {
      issues.push({ file: file.path, message: bracketIssue, severity: 'error' });
    }

    // ── 2. Unterminated string/template literals ──
    if (hasUnterminatedString(content)) {
      issues.push({ file: file.path, message: 'Unterminated string or template literal', severity: 'error' });
    }

    // ── 3. Invalid JSX — common AI errors ──
    if (['tsx', 'jsx'].includes(ext)) {
      const jsxIssue = checkJSXErrors(content);
      if (jsxIssue) {
        issues.push({ file: file.path, message: jsxIssue, severity: 'error' });
      }
    }

    // ── 4. Escaped forward slashes in JSX (the <\/div> bug) ──
    if (/\\\//.test(content) && ['tsx', 'jsx'].includes(ext)) {
      issues.push({ file: file.path, message: 'Escaped forward slashes in JSX (e.g., <\\/div>)', severity: 'error' });
    }

    // ── 5. Duplicate export default ──
    const defaultExports = (content.match(/^export\s+default\s+/gm) || []).length;
    if (defaultExports > 1) {
      issues.push({ file: file.path, message: `Multiple default exports (${defaultExports})`, severity: 'error' });
    }

    // ── 6. Import from non-existent relative path ──
    const relativeImports = content.matchAll(/from\s+['"](\.[^'"]+)['"]/g);
    for (const match of relativeImports) {
      const specifier = match[1];
      const resolved = resolveRelativeImport(file.path, specifier, files);
      if (!resolved) {
        issues.push({ file: file.path, message: `Import not found: ${specifier}`, severity: 'warning' });
      }
    }
  }

  return issues;
}

function checkBracketBalance(code: string): string | null {
  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  let inString: string | null = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inTemplateLiteral = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }

    // Comments
    if (!inString && !inTemplateLiteral) {
      if (inLineComment) {
        if (ch === '\n') inLineComment = false;
        continue;
      }
      if (inBlockComment) {
        if (ch === '*' && next === '/') { inBlockComment = false; i++; }
        continue;
      }
      if (ch === '/' && next === '/') { inLineComment = true; continue; }
      if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
    }

    // Strings
    if (inString) {
      if (ch === inString) inString = null;
      continue;
    }
    if (inTemplateLiteral) {
      if (ch === '`') inTemplateLiteral = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inString = ch; continue; }
    if (ch === '`') { inTemplateLiteral = true; continue; }

    // Brackets
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else if (ch === ')' || ch === ']' || ch === '}') {
      const expected = pairs[ch];
      if (stack.length === 0) return `Unexpected '${ch}'`;
      if (stack[stack.length - 1] !== expected) return `Mismatched bracket: expected '${stack[stack.length - 1]}' but found '${ch}'`;
      stack.pop();
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    const closing = unclosed === '(' ? ')' : unclosed === '[' ? ']' : '}';
    return `Unclosed '${unclosed}' — missing '${closing}'`;
  }

  return null;
}

function hasUnterminatedString(code: string): boolean {
  const lines = code.split('\n');
  for (const line of lines) {
    let inStr: string | null = null;
    let escaped = false;
    for (let i = 0; i < line.length; i++) {
      if (escaped) { escaped = false; continue; }
      const ch = line[i];
      if (ch === '\\') { escaped = true; continue; }
      // Skip template literals (multi-line OK)
      if (ch === '`') return false; // Can't check multi-line
      if (inStr) {
        if (ch === inStr) inStr = null;
      } else {
        if (ch === '/' && line[i + 1] === '/') break; // line comment
        if (ch === '"' || ch === "'") inStr = ch;
      }
    }
    // If line ends mid-string and it's not a known continuation pattern
    if (inStr && !line.trimEnd().endsWith('\\')) {
      // Allow JSX string attributes that wrap
      if (!/['"][\s,]?\s*$/.test(line) && !line.includes('`')) {
        return true;
      }
    }
  }
  return false;
}

function checkJSXErrors(content: string): string | null {
  // Check for `class=` instead of `className=` in JSX
  // Only flag if it's clearly JSX (has import React or JSX tags)
  if (/\sclass\s*=\s*["'{]/.test(content) && /<[A-Z]/.test(content)) {
    return 'Using `class` instead of `className` in JSX';
  }

  // Check for `for=` instead of `htmlFor=` in JSX labels
  if (/\sfor\s*=\s*["']/.test(content) && /<label/i.test(content)) {
    return 'Using `for` instead of `htmlFor` in JSX label';
  }

  return null;
}

function resolveRelativeImport(fromPath: string, specifier: string, files: ProjectFile[]): boolean {
  const dir = fromPath.split('/').slice(0, -1).join('/');
  const resolved = specifier.startsWith('./')
    ? `${dir}/${specifier.slice(2)}`
    : specifier.startsWith('../')
      ? resolveParent(dir, specifier)
      : specifier;

  if (!resolved) return false;

  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  return extensions.some(ext => files.some(f => f.path === resolved + ext || f.path === `src/${resolved}${ext}`));
}

function resolveParent(dir: string, specifier: string): string | null {
  const parts = dir.split('/');
  let rel = specifier;
  while (rel.startsWith('../')) {
    parts.pop();
    rel = rel.slice(3);
  }
  return parts.length > 0 ? `${parts.join('/')}/${rel}` : rel;
}
