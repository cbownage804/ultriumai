/**
 * Auto-Fix Loop — Phase 30
 * Captures preview errors, sends structured fix prompts to the AI,
 * and applies patches automatically with exponential backoff.
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

export function useAutoFixLoop(options: AutoFixOptions) {
  const { maxAttempts = 3, baseDelayMs = 500, onSendFix } = options;
  const [fixHistory, setFixHistory] = useState<FixAttempt[]>([]);
  const [isFixing, setIsFixing] = useState(false);
  const attemptCountRef = useRef(0);
  const lastErrorRef = useRef<string>('');
  const cooldownRef = useRef<NodeJS.Timeout>();

  const buildFixPrompt = useCallback((
    error: PreviewError,
    files: ProjectFile[],
    recentMessages: string[],
    attempt: number,
  ): string => {
    // Find the source file
    const sourceFile = error.source
      ? files.find(f => error.source?.includes(f.path))
      : null;

    const sourceSnippet = sourceFile
      ? sourceFile.content.slice(0, 2500)
      : 'Source file not found';

    const contextMsgs = recentMessages.slice(-2).join('\n---\n');

    return `[AUTO-FIX ATTEMPT ${attempt}/${maxAttempts}]

ERROR: ${error.message}
${error.source ? `FILE: ${error.source}${error.line ? `:${error.line}` : ''}` : ''}
TYPE: ${error.type}

SOURCE CODE:
\`\`\`
${sourceSnippet}
\`\`\`

${contextMsgs ? `RECENT CONTEXT:\n${contextMsgs}\n` : ''}
${attempt > 1 ? `⚠️ Previous fix attempt(s) did not resolve this error. Try a different approach.\n` : ''}
Fix this error. Output ONLY the corrected ===FILE: block(s). Do not explain.`;
  }, [maxAttempts]);

  const attemptFix = useCallback((
    error: PreviewError,
    files: ProjectFile[],
    recentMessages: string[] = [],
  ) => {
    // Deduplicate: skip if same error is being fixed
    if (error.message === lastErrorRef.current && isFixing) return;

    // Check attempt limit
    if (attemptCountRef.current >= maxAttempts) {
      setFixHistory(prev => [{
        id: crypto.randomUUID(),
        error,
        attempt: attemptCountRef.current,
        timestamp: new Date(),
        status: 'exhausted' as const,
      }, ...prev].slice(0, 20));
      return;
    }

    // Reset counter if new error
    if (error.message !== lastErrorRef.current) {
      attemptCountRef.current = 0;
      lastErrorRef.current = error.message;
    }

    attemptCountRef.current++;
    setIsFixing(true);

    const attempt: FixAttempt = {
      id: crypto.randomUUID(),
      error,
      attempt: attemptCountRef.current,
      timestamp: new Date(),
      status: 'fixing',
    };

    setFixHistory(prev => [attempt, ...prev].slice(0, 20));

    // Exponential backoff delay
    const delay = baseDelayMs * Math.pow(2, attemptCountRef.current - 1);

    clearTimeout(cooldownRef.current);
    cooldownRef.current = setTimeout(() => {
      const prompt = buildFixPrompt(error, files, recentMessages, attemptCountRef.current);
      onSendFix(prompt);

      // Mark as pending (AI will generate the fix, completion is detected via latestFiles change)
      setFixHistory(prev =>
        prev.map(f => f.id === attempt.id ? { ...f, status: 'pending' as const } : f)
      );
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
  }, []);

  return {
    fixHistory,
    isFixing,
    attemptCount: attemptCountRef.current,
    isExhausted: attemptCountRef.current >= maxAttempts,
    attemptFix,
    markFixSuccess,
    markFixFailed,
    resetFixes,
  };
}
