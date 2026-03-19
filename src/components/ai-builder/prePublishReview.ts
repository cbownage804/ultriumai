import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface ReviewIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  file: string;
  line?: number;
  message: string;
  fixPrompt?: string;
  category: 'security' | 'quality' | 'performance' | 'best-practice';
}

export interface ReviewResult {
  issues: ReviewIssue[];
  score: number; // 0-100
  passedChecks: number;
  totalChecks: number;
}

const SECRET_PATTERNS = [
  /(?:sk[_-](?:live|test)[_-])[A-Za-z0-9]{20,}/g,         // Stripe
  /(?:key|secret|token|password|apikey)\s*[:=]\s*['"][^'"]{8,}['"]/gi, // Generic
  /(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/g,                  // AWS
  /ghp_[A-Za-z0-9]{36}/g,                                   // GitHub PAT
  /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,         // Private keys
];

const CONSOLE_LOG_RE = /\bconsole\.log\s*\(/g;
const UNUSED_IMPORT_RE = /^import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"][^'"]+['"];?\s*$/gm;
const TODO_RE = /\b(?:TODO|FIXME|HACK|XXX)\b/gi;
const EMPTY_CATCH_RE = /catch\s*\([^)]*\)\s*\{\s*\}/g;

export function runPrePublishReview(files: ProjectFile[]): ReviewResult {
  const issues: ReviewIssue[] = [];
  let passedChecks = 0;
  let totalChecks = 0;

  const codeFiles = files.filter(f =>
    /\.(tsx?|jsx?|css|html)$/.test(f.path) &&
    !f.path.includes('node_modules') &&
    !f.path.includes('.test.')
  );

  for (const file of codeFiles) {
    const lines = file.content.split('\n');

    // Check: Hardcoded secrets
    totalChecks++;
    let foundSecret = false;
    for (const pattern of SECRET_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(file.content)) !== null) {
        const lineNum = file.content.slice(0, match.index).split('\n').length;
        foundSecret = true;
        issues.push({
          id: crypto.randomUUID(),
          severity: 'error',
          file: file.path,
          line: lineNum,
          message: `Possible hardcoded secret detected`,
          fixPrompt: `Remove the hardcoded secret in ${file.path} line ${lineNum} and use an environment variable instead.`,
          category: 'security',
        });
      }
    }
    if (!foundSecret) passedChecks++;

    // Check: console.log statements
    totalChecks++;
    let match;
    const consoleLogs: number[] = [];
    CONSOLE_LOG_RE.lastIndex = 0;
    while ((match = CONSOLE_LOG_RE.exec(file.content)) !== null) {
      consoleLogs.push(file.content.slice(0, match.index).split('\n').length);
    }
    if (consoleLogs.length > 0) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        file: file.path,
        line: consoleLogs[0],
        message: `${consoleLogs.length} console.log statement${consoleLogs.length > 1 ? 's' : ''} found`,
        fixPrompt: `Remove all console.log statements from ${file.path} for production readiness.`,
        category: 'quality',
      });
    } else {
      passedChecks++;
    }

    // Check: TODO/FIXME comments
    totalChecks++;
    TODO_RE.lastIndex = 0;
    const todos: number[] = [];
    while ((match = TODO_RE.exec(file.content)) !== null) {
      todos.push(file.content.slice(0, match.index).split('\n').length);
    }
    if (todos.length > 0) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'info',
        file: file.path,
        line: todos[0],
        message: `${todos.length} TODO/FIXME comment${todos.length > 1 ? 's' : ''} remaining`,
        category: 'quality',
      });
    } else {
      passedChecks++;
    }

    // Check: Empty catch blocks
    totalChecks++;
    EMPTY_CATCH_RE.lastIndex = 0;
    const emptyCatches: number[] = [];
    while ((match = EMPTY_CATCH_RE.exec(file.content)) !== null) {
      emptyCatches.push(file.content.slice(0, match.index).split('\n').length);
    }
    if (emptyCatches.length > 0) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        file: file.path,
        line: emptyCatches[0],
        message: `${emptyCatches.length} empty catch block${emptyCatches.length > 1 ? 's' : ''} — errors are silently swallowed`,
        fixPrompt: `Add proper error handling to the empty catch block(s) in ${file.path}. Log or handle the error appropriately.`,
        category: 'best-practice',
      });
    } else {
      passedChecks++;
    }
  }

  // Global check: Missing error boundary
  totalChecks++;
  const hasErrorBoundary = codeFiles.some(f =>
    f.content.includes('ErrorBoundary') || f.content.includes('componentDidCatch')
  );
  if (!hasErrorBoundary && codeFiles.length > 3) {
    issues.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      file: 'App.tsx',
      message: 'No error boundary detected — runtime errors will crash the app',
      fixPrompt: 'Add a React ErrorBoundary component wrapping the main app to catch and display runtime errors gracefully.',
      category: 'best-practice',
    });
  } else {
    passedChecks++;
  }

  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  // Sort: errors first, then warnings, then info
  issues.sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return { issues, score, passedChecks, totalChecks };
}
