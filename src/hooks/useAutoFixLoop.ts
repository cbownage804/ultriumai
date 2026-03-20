/**
 * Auto-Fix Loop — Phase 30 + Wave 14: Cascading Error Recovery
 * Groups related errors, deduplicates, and injects LKG diff on retry.
 */

import { useState, useCallback, useRef } from 'react';
import type { PreviewError } from '@/components/ai-builder/ErrorConsole';
import type { ProjectFile } from './useProjectFileSystem';

export interface FixAttempt {
  id: string;
  error: PreviewError;
  attempt: number;
  timestamp: Date;
  status: 'pending' | 'fixing' | 'success' | 'failed' | 'exhausted';
  patchApplied?: string;
}

interface AutoFixOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  onSendFix: (prompt: string) => void;
}

/** Group related errors by file and deduplicate by normalized message. */
function groupAndDeduplicateErrors(errors: PreviewError[]): PreviewError[] {
  const seen = new Map<string, PreviewError>();
  for (const err of errors) {
    // Normalize: strip line numbers and quoted identifiers for dedup
    const normalized = err.message
      .replace(/\b\d+\b/g, 'N')
      .replace(/['"`][\w./\\-]+['"`]/g, '"X"')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
    const key = `${err.source || 'unknown'}::${normalized}`;
    if (!seen.has(key)) {
      seen.set(key, err);
    }
  }
  return Array.from(seen.values());
}

/** Identify root cause category from a set of errors. */
function identifyRootCause(errors: PreviewError[]): string | null {
  const messages = errors.map(e => e.message.toLowerCase()).join(' ');
  if (/is not defined|not found|cannot find/i.test(messages)) return 'missing_import_or_declaration';
  if (/unexpected token|syntax/i.test(messages)) return 'syntax_error';
  if (/cannot read prop|undefined/i.test(messages)) return 'null_reference';
  if (/duplicate|already declared/i.test(messages)) return 'duplicate_declaration';
  return null;
}

const ROOT_CAUSE_ADVICE: Record<string, string> = {
  missing_import_or_declaration: 'Root cause: Missing import or undeclared identifier. Check ALL imports first before fixing individual errors.',
  syntax_error: 'Root cause: Syntax error. Fix the syntax issue — downstream errors are likely caused by this.',
  null_reference: 'Root cause: Null/undefined access. Add proper null checks or ensure data is initialized.',
  duplicate_declaration: 'Root cause: Duplicate declaration. Remove or rename the conflicting identifier.',
};

export function useAutoFixLoop(options: AutoFixOptions) {
  const { maxAttempts = 3, baseDelayMs = 500, onSendFix } = options;
  const [fixHistory, setFixHistory] = useState<FixAttempt[]>([]);
  const [isFixing, setIsFixing] = useState(false);
  const attemptCountRef = useRef(0);
  const lastErrorRef = useRef<string>('');
  const cooldownRef = useRef<NodeJS.Timeout>();
  const pendingErrorsRef = useRef<PreviewError[]>([]);

  const buildFixPrompt = useCallback((
    error: PreviewError,
    files: ProjectFile[],
    recentMessages: string[],
    attempt: number,
    lkgDiffContext?: string,
    allErrors?: PreviewError[],
  ): string => {
    const sourceFile = error.source
      ? files.find(f => error.source?.includes(f.path))
      : null;
    const sourceSnippet = sourceFile
      ? sourceFile.content.slice(0, 2500)
      : 'Source file not found';
    const contextMsgs = recentMessages.slice(-2).join('\n---\n');

    // Group errors for consolidated prompt
    const grouped = allErrors && allErrors.length > 1
      ? groupAndDeduplicateErrors(allErrors)
      : [error];
    const rootCause = grouped.length > 1 ? identifyRootCause(grouped) : null;

    const errorSection = grouped.length > 1
      ? `ERRORS (${grouped.length} related issues):\n${grouped.map((e, i) => `  ${i + 1}. ${e.message}${e.source ? ` [${e.source}${e.line ? `:${e.line}` : ''}]` : ''}`).join('\n')}`
      : `ERROR: ${error.message}\n${error.source ? `FILE: ${error.source}${error.line ? `:${error.line}` : ''}` : ''}\nTYPE: ${error.type}`;

    return `[AUTO-FIX ATTEMPT ${attempt}/${maxAttempts}]

${errorSection}
${rootCause ? `\n⚡ ${ROOT_CAUSE_ADVICE[rootCause]}\n` : ''}
SOURCE CODE:
\`\`\`
${sourceSnippet}
\`\`\`

${contextMsgs ? `RECENT CONTEXT:\n${contextMsgs}\n` : ''}
${attempt > 1 && lkgDiffContext ? `[CHANGES SINCE LAST WORKING BUILD]\n${lkgDiffContext}\n` : ''}
${attempt > 1 ? `⚠️ Previous fix attempt(s) did not resolve this error. Try a different approach.\n` : ''}
Fix ${grouped.length > 1 ? 'ALL these errors' : 'this error'}. Output ONLY the corrected ===FILE: block(s). Do not explain.`;
  }, [maxAttempts]);

  /** Queue multiple errors for batch processing. */
  const queueErrors = useCallback((errors: PreviewError[]) => {
    pendingErrorsRef.current = groupAndDeduplicateErrors(errors);
  }, []);

  const attemptFix = useCallback((
    error: PreviewError,
    files: ProjectFile[],
    recentMessages: string[] = [],
    lkgDiffContext?: string,
  ) => {
    if (error.message === lastErrorRef.current && isFixing) return;
    if (attemptCountRef.current >= maxAttempts) {
      setFixHistory(prev => [{
        id: crypto.randomUUID(), error, attempt: attemptCountRef.current,
        timestamp: new Date(), status: 'exhausted' as const,
      }, ...prev].slice(0, 20));
      return;
    }
    if (error.message !== lastErrorRef.current) {
      attemptCountRef.current = 0;
      lastErrorRef.current = error.message;
    }
    attemptCountRef.current++;
    setIsFixing(true);

    const attempt: FixAttempt = {
      id: crypto.randomUUID(), error, attempt: attemptCountRef.current,
      timestamp: new Date(), status: 'fixing',
    };
    setFixHistory(prev => [attempt, ...prev].slice(0, 20));

    const delay = baseDelayMs * Math.pow(2, attemptCountRef.current - 1);
    clearTimeout(cooldownRef.current);
    cooldownRef.current = setTimeout(() => {
      const allErrors = pendingErrorsRef.current.length > 0 ? pendingErrorsRef.current : undefined;
      const prompt = buildFixPrompt(
        error, files, recentMessages, attemptCountRef.current,
        attemptCountRef.current > 1 ? lkgDiffContext : undefined,
        allErrors,
      );
      onSendFix(prompt);
      setFixHistory(prev =>
        prev.map(f => f.id === attempt.id ? { ...f, status: 'pending' as const } : f)
      );
      pendingErrorsRef.current = [];
    }, delay);
  }, [maxAttempts, baseDelayMs, isFixing, buildFixPrompt, onSendFix]);

  const markFixSuccess = useCallback(() => {
    setIsFixing(false);
    attemptCountRef.current = 0;
    lastErrorRef.current = '';
    setFixHistory(prev => {
      const latest = prev[0];
      if (latest && latest.status === 'pending') {
        return [{ ...latest, status: 'success' as const }, ...prev.slice(1)];
      }
      return prev;
    });
  }, []);

  const markFixFailed = useCallback(() => {
    setIsFixing(false);
    setFixHistory(prev => {
      const latest = prev[0];
      if (latest && latest.status === 'pending') {
        return [{ ...latest, status: 'failed' as const }, ...prev.slice(1)];
      }
      return prev;
    });
  }, []);

  const resetFixes = useCallback(() => {
    attemptCountRef.current = 0;
    lastErrorRef.current = '';
    setIsFixing(false);
    clearTimeout(cooldownRef.current);
    pendingErrorsRef.current = [];
  }, []);

  return {
    fixHistory,
    isFixing,
    attemptCount: attemptCountRef.current,
    isExhausted: attemptCountRef.current >= maxAttempts,
    attemptFix,
    queueErrors,
    markFixSuccess,
    markFixFailed,
    resetFixes,
  };
}
