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

/**
 * Auto-fix trivial issues that would cause compilation failures.
 * Returns a new array with fixes applied.
 */
export function autoFixTrivialIssues(files: ProjectFile[]): ProjectFile[] {
  return files.map(file => {
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
    if (!['ts', 'tsx', 'js', 'jsx'].includes(ext)) return file;
    let content = file.content;

    // Fix 1: Empty files — add a minimal export
    if (!content.trim()) {
      content = `// Auto-generated placeholder\nexport {};\n`;
      return { ...file, content };
    }

    // Fix 2: TSX/JSX files using React but missing React import (for older React versions)
    if (['tsx', 'jsx'].includes(ext)) {
      const hasJSX = /<[A-Z]/.test(content) || /<[a-z]+[\s>]/.test(content);
      const hasReactImport = /import\s+.*\bReact\b.*from\s+['"]react['"]/.test(content);
      if (hasJSX && !hasReactImport && !content.includes('/** @jsxImportSource')) {
        content = `import React from 'react';\n${content}`;
        return { ...file, content };
      }
    }

    // Fix 3: Escaped forward slashes in JSX (<\/div> → </div>)
    if (['tsx', 'jsx'].includes(ext) && /\\\//.test(content)) {
      content = content.replace(/\\\//g, '/');
      return { ...file, content };
    }

    return file;
  });
}

export function preCompileValidate(files: ProjectFile[]): PreCompileIssue[] {
  const issues: PreCompileIssue[] = [];

  for (const file of files) {
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
    if (!['ts', 'tsx', 'js', 'jsx'].includes(ext)) continue;

    const content = file.content;
    if (!content.trim()) {
      issues.push({ file: file.path, message: 'Empty file', severity: 'warning' });
      continue;
    }

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

    // ── 7. Truncated expression artifacts — stray ')} or ")} at line boundaries ──
    if (/^['"`]\s*\)\s*[;}]\s*$/m.test(content)) {
      issues.push({ file: file.path, message: 'Possible truncated expression artifact (stray quote-paren-brace sequence)', severity: 'warning' });
    }

    // ── 8. Truncated JSX attribute — opening ={ without matching close ──
    if (hasTruncatedJsxAttribute(content)) {
      issues.push({ file: file.path, message: 'Truncated JSX attribute expression (opening ={ without close)', severity: 'warning' });
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

/**
 * Detect truncated JSX attribute expressions like `prop={value` without a closing `}`.
 * This is a common AI truncation artifact that crashes esbuild.
 */
function hasTruncatedJsxAttribute(content: string): boolean {
  // Look for JSX attribute patterns that open an expression but never close it
  // on the same or next line (simplified heuristic for common cases)
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match attr={...  where the brace expression isn't closed on this or next line
    const attrExprMatch = line.match(/\w+=\{/);
    if (!attrExprMatch) continue;

    // Count braces from match position to end of this + next line
    const startIdx = line.indexOf(attrExprMatch[0]) + attrExprMatch[0].length;
    let remainder = line.slice(startIdx);
    if (i + 1 < lines.length) remainder += '\n' + lines[i + 1];

    let depth = 1;
    let inStr: string | null = null;
    for (let j = 0; j < remainder.length; j++) {
      const ch = remainder[j];
      if (inStr) {
        if (ch === inStr && remainder[j - 1] !== '\\') inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) break; }
    }

    // If we reached end without balancing, it's truncated
    if (depth > 0 && i >= lines.length - 2) return true;
  }
  return false;
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
