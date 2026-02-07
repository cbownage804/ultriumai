import { useState, useCallback, useRef } from 'react';
import type { PreviewError } from '@/components/ai-builder/ErrorConsole';
import type { ProjectFile } from './useProjectFileSystem';

interface ErrorRecoveryState {
  isRecovering: boolean;
  currentError: string | null;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptedError: string | null;
}

export function useAutoErrorRecovery(maxAttempts = 3) {
  const [state, setState] = useState<ErrorRecoveryState>({
    isRecovering: false,
    currentError: null,
    attemptCount: 0,
    maxAttempts,
    lastAttemptedError: null,
  });
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const attemptRecovery = useCallback((
    error: PreviewError,
    projectFiles: ProjectFile[],
    sendFix: (prompt: string) => void,
  ) => {
    const isSameError = state.lastAttemptedError === error.message;
    const count = isSameError ? state.attemptCount + 1 : 1;

    if (count > maxAttempts) {
      setState(prev => ({ ...prev, isRecovering: false }));
      return false;
    }

    setState({
      isRecovering: true,
      currentError: error.message,
      attemptCount: count,
      maxAttempts,
      lastAttemptedError: error.message,
    });

    const errorFile = error.source
      ? projectFiles.find(f => error.source?.includes(f.path))
      : null;

    const escalation = count > 1
      ? `\n\nThis is auto-fix attempt ${count}/${maxAttempts}. Previous fixes didn't work. Try a completely different approach.`
      : '';

    const prompt = [
      `Auto-fix error: "${error.message}"`,
      error.source ? `Source: ${error.source}${error.line ? `:${error.line}` : ''}` : '',
      errorFile ? `\nFile content (${errorFile.path}):\n\`\`\`\n${errorFile.content}\n\`\`\`` : '',
      escalation,
      '\nReturn the corrected file(s).',
    ].filter(Boolean).join('\n');

    // Delay slightly to avoid rapid-fire
    recoveryTimeoutRef.current = setTimeout(() => {
      sendFix(prompt);
    }, 1500);

    return true;
  }, [state.attemptCount, state.lastAttemptedError, maxAttempts]);

  const resetRecovery = useCallback(() => {
    if (recoveryTimeoutRef.current) clearTimeout(recoveryTimeoutRef.current);
    setState({
      isRecovering: false,
      currentError: null,
      attemptCount: 0,
      maxAttempts,
      lastAttemptedError: null,
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
  };
}
