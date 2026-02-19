import { useState, useCallback, useRef } from 'react';
import type { PreviewError } from '@/components/ai-builder/ErrorConsole';
import type { ProjectFile } from './useProjectFileSystem';

export interface ErrorReport {
  message: string;
  sourceFile: string;
  sourceLine: number;
  surroundingCode: string;
  consoleWarnings: string[];
  failedRequests: { url: string; status: number }[];
  previousFixAttempt?: string;
  attemptNumber: number;
  strategy: 'targeted_line' | 'function_rewrite' | 'full_file_regen' | 'rollback';
}

interface ErrorRecoveryState {
  isRecovering: boolean;
  currentError: string | null;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptedError: string | null;
  currentStrategy: ErrorReport['strategy'] | null;
}

/** Determine fix strategy based on attempt number */
function getStrategy(attempt: number): ErrorReport['strategy'] {
  switch (attempt) {
    case 1: return 'targeted_line';
    case 2: return 'function_rewrite';
    case 3: return 'full_file_regen';
    default: return 'rollback';
  }
}

/** Extract ~20 lines surrounding a given line number */
function getSurroundingCode(content: string, line: number, radius = 10): string {
  const lines = content.split('\n');
  const start = Math.max(0, line - radius - 1);
  const end = Math.min(lines.length, line + radius);
  return lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
}

/** Extract the function body containing a given line */
function extractFunctionAroundLine(content: string, line: number): string | null {
  const lines = content.split('\n');
  if (line < 1 || line > lines.length) return null;

  // Walk backwards to find function start
  let fnStart = line - 1;
  let braceDepth = 0;
  while (fnStart > 0) {
    const l = lines[fnStart];
    if (/(?:function\s|const\s\w+\s*=\s*(?:async\s*)?\(|=>\s*\{|class\s)/.test(l) && braceDepth <= 0) break;
    braceDepth -= (l.match(/\}/g) || []).length;
    braceDepth += (l.match(/\{/g) || []).length;
    fnStart--;
  }

  // Walk forwards to find function end
  let fnEnd = fnStart;
  braceDepth = 0;
  let started = false;
  while (fnEnd < lines.length) {
    const l = lines[fnEnd];
    braceDepth += (l.match(/\{/g) || []).length;
    if (braceDepth > 0) started = true;
    braceDepth -= (l.match(/\}/g) || []).length;
    if (started && braceDepth <= 0) break;
    fnEnd++;
  }

  return lines.slice(fnStart, fnEnd + 1).map((l, i) => `${fnStart + i + 1}: ${l}`).join('\n');
}

export function useAutoErrorRecovery(maxAttempts = 4) {
  const [state, setState] = useState<ErrorRecoveryState>({
    isRecovering: false,
    currentError: null,
    attemptCount: 0,
    maxAttempts,
    lastAttemptedError: null,
    currentStrategy: null,
  });
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFixRef = useRef<string | null>(null);

  /** Build a structured error report with escalating context */
  const buildErrorReport = useCallback((
    error: PreviewError,
    projectFiles: ProjectFile[],
    attempt: number,
    consoleWarnings: string[] = [],
    failedRequests: { url: string; status: number }[] = [],
  ): ErrorReport => {
    const strategy = getStrategy(attempt);
    const errorFile = error.source
      ? projectFiles.find(f => error.source?.includes(f.path))
      : null;

    let surroundingCode = '';
    if (errorFile && error.line) {
      if (strategy === 'function_rewrite') {
        surroundingCode = extractFunctionAroundLine(errorFile.content, error.line) || getSurroundingCode(errorFile.content, error.line);
      } else {
        surroundingCode = getSurroundingCode(errorFile.content, error.line);
      }
    } else if (errorFile) {
      // No line info — show first 40 lines
      surroundingCode = errorFile.content.split('\n').slice(0, 40).map((l, i) => `${i + 1}: ${l}`).join('\n');
    }

    return {
      message: error.message,
      sourceFile: errorFile?.path || error.source || 'unknown',
      sourceLine: error.line || 0,
      surroundingCode,
      consoleWarnings,
      failedRequests,
      previousFixAttempt: previousFixRef.current || undefined,
      attemptNumber: attempt,
      strategy,
    };
  }, []);

  const attemptRecovery = useCallback((
    error: PreviewError,
    projectFiles: ProjectFile[],
    sendFix: (prompt: string) => void,
    consoleWarnings: string[] = [],
    failedRequests: { url: string; status: number }[] = [],
    onRollback?: () => void,
  ) => {
    const isSameError = state.lastAttemptedError === error.message;
    const count = isSameError ? state.attemptCount + 1 : 1;

    if (count > maxAttempts) {
      setState(prev => ({ ...prev, isRecovering: false }));
      return false;
    }

    const strategy = getStrategy(count);

    setState({
      isRecovering: true,
      currentError: error.message,
      attemptCount: count,
      maxAttempts,
      lastAttemptedError: error.message,
      currentStrategy: strategy,
    });

    // Strategy 4: Rollback
    if (strategy === 'rollback') {
      if (onRollback) onRollback();
      setState(prev => ({ ...prev, isRecovering: false }));
      return false;
    }

    const report = buildErrorReport(error, projectFiles, count, consoleWarnings, failedRequests);
    const errorFile = error.source
      ? projectFiles.find(f => error.source?.includes(f.path))
      : null;

    // Build strategy-specific prompt
    const strategyInstructions: Record<string, string> = {
      targeted_line: `Fix ONLY the specific line causing the error. Make the minimal change needed.`,
      function_rewrite: `The previous targeted fix didn't work. Rewrite the ENTIRE function containing the error. Consider its dependencies and data flow.`,
      full_file_regen: `Previous fixes failed. Regenerate the ENTIRE file from scratch, keeping the same functionality but with a completely different implementation approach.`,
    };

    const prompt = [
      `[AUTO-FIX ${count}/${maxAttempts} — Strategy: ${strategy.replace(/_/g, ' ').toUpperCase()}]`,
      ``,
      `Error: "${report.message}"`,
      report.sourceFile !== 'unknown' ? `File: ${report.sourceFile}${report.sourceLine ? `:${report.sourceLine}` : ''}` : '',
      ``,
      `Strategy: ${strategyInstructions[strategy]}`,
      ``,
      report.surroundingCode ? `Code context:\n\`\`\`\n${report.surroundingCode}\n\`\`\`` : '',
      strategy === 'full_file_regen' && errorFile ? `\nFull file (${errorFile.path}):\n\`\`\`\n${errorFile.content}\n\`\`\`` : '',
      report.consoleWarnings.length > 0 ? `\nConsole warnings:\n${report.consoleWarnings.slice(0, 5).map(w => `- ${w}`).join('\n')}` : '',
      report.failedRequests.length > 0 ? `\nFailed requests:\n${report.failedRequests.slice(0, 3).map(r => `- ${r.url} (${r.status})`).join('\n')}` : '',
      report.previousFixAttempt ? `\nPrevious fix attempt (FAILED — do NOT repeat):\n${report.previousFixAttempt}` : '',
      `\nReturn the corrected file(s). Do NOT explain, just fix.`,
    ].filter(Boolean).join('\n');

    // Delay slightly to avoid rapid-fire
    recoveryTimeoutRef.current = setTimeout(() => {
      previousFixRef.current = prompt;
      sendFix(prompt);
    }, 1500);

    return true;
  }, [state.attemptCount, state.lastAttemptedError, maxAttempts, buildErrorReport]);

  const resetRecovery = useCallback(() => {
    if (recoveryTimeoutRef.current) clearTimeout(recoveryTimeoutRef.current);
    previousFixRef.current = null;
    setState({
      isRecovering: false,
      currentError: null,
      attemptCount: 0,
      maxAttempts,
      lastAttemptedError: null,
      currentStrategy: null,
    });
  }, [maxAttempts]);

  const onGenerationComplete = useCallback(() => {
    setState(prev => ({ ...prev, isRecovering: false }));
  }, []);

  return {
    ...state,
    attemptRecovery,
    resetRecovery,
    onGenerationComplete,
    buildErrorReport,
  };
}
