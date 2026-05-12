/**
 * Stream Truncation Guard — detects when an AI-streamed file ends mid-JSX
 * (unbalanced brackets/tags) so we can request a [CONTINUE] before
 * shipping broken code to the compiler.
 */
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface TruncationFinding {
  path: string;
  reason: 'unbalanced_braces' | 'unbalanced_jsx' | 'unterminated_string' | 'mid_statement';
  detail: string;
}

function countBalanced(content: string, open: string, close: string): number {
  let depth = 0;
  let inString: '"' | "'" | '`' | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const prev = i > 0 ? content[i - 1] : '';
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '/' && prev === '*') inBlockComment = false;
      continue;
    }
    if (inString) {
      if (c === inString && prev !== '\\') inString = null;
      continue;
    }
    if (c === '/' && content[i + 1] === '/') { inLineComment = true; continue; }
    if (c === '/' && content[i + 1] === '*') { inBlockComment = true; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = c; continue; }
    if (c === open) depth++;
    else if (c === close) depth--;
  }
  return depth;
}

export function detectTruncations(files: ProjectFile[]): TruncationFinding[] {
  const findings: TruncationFinding[] = [];
  for (const file of files) {
    if (!/\.(tsx?|jsx?)$/.test(file.path)) continue;
    const content = file.content;
    if (!content || content.length < 20) continue;

    const braces = countBalanced(content, '{', '}');
    if (braces > 0) {
      findings.push({
        path: file.path,
        reason: 'unbalanced_braces',
        detail: `${braces} unclosed "{" — file likely truncated mid-block`,
      });
      continue;
    }

    const parens = countBalanced(content, '(', ')');
    if (parens > 0) {
      findings.push({
        path: file.path,
        reason: 'unbalanced_braces',
        detail: `${parens} unclosed "(" — file likely truncated mid-call`,
      });
      continue;
    }

    // Check trailing fragment — file ends with operator/keyword suggesting cutoff
    const trimmed = content.trimEnd();
    const lastChar = trimmed.slice(-1);
    const lastTokens = trimmed.slice(-30);
    const endsBadly =
      /[=+\-*<>&|,.?:]\s*$/.test(trimmed) ||
      /\b(return|const|let|var|if|else|for|while|import|export|from|async|await|new)\s*$/.test(lastTokens);
    if (endsBadly && lastChar !== ';' && lastChar !== '}' && lastChar !== ')') {
      findings.push({
        path: file.path,
        reason: 'mid_statement',
        detail: `File ends mid-statement near: "...${lastTokens.replace(/\n/g, ' ')}"`,
      });
      continue;
    }

    // JSX tag balance — count "<Foo" vs "</Foo>" / "/>" roughly
    const openTags = (content.match(/<[A-Za-z][^/<>\s]*[\s>]/g) || []).length;
    const closeTags = (content.match(/<\/[A-Za-z][^>]*>/g) || []).length;
    const selfClose = (content.match(/\/>/g) || []).length;
    if (openTags > closeTags + selfClose + 2) {
      findings.push({
        path: file.path,
        reason: 'unbalanced_jsx',
        detail: `${openTags} open vs ${closeTags + selfClose} closed JSX tags`,
      });
    }
  }
  return findings;
}

export function buildContinuePrompt(findings: TruncationFinding[]): string {
  const top = findings.slice(0, 3);
  return [
    `[CONTINUE] The previous response was truncated. The following files appear incomplete:`,
    ...top.map(f => `- \`${f.path}\` — ${f.detail}`),
    ``,
    `Resume from where you left off and complete ONLY these files. Do NOT restart from scratch.`,
    `Output the full corrected file content with proper closing braces, tags, and statements.`,
  ].join('\n');
}
