import { useCallback, useRef } from 'react';

/**
 * useAutoHealCompile — Automatically re-prompts the AI when compilation
 * fails, sending the error message + LKG diff context for self-correction.
 * 
 * Matches Lovable's "try to fix" behavior but is fully automatic (no user click).
 * Max 2 heal attempts per generation cycle.
 */

export interface AutoHealAttempt {
  attemptNumber: number;
  errorMessage: string;
  timestamp: number;
  resolved: boolean;
}

export interface AutoHealConfig {
  maxAttempts: number;
  /** Minimum time between heal attempts (ms) */
  cooldownMs: number;
}

const DEFAULT_CONFIG: AutoHealConfig = {
  maxAttempts: 3,
  cooldownMs: 2000,
};

export function useAutoHealCompile(config: Partial<AutoHealConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const attemptsRef = useRef<AutoHealAttempt[]>([]);
  const isHealingRef = useRef(false);
  const lastHealTimeRef = useRef(0);

  /** Reset heal state — call when a new generation starts */
  const resetHealState = useCallback(() => {
    attemptsRef.current = [];
    isHealingRef.current = false;
    lastHealTimeRef.current = 0;
  }, []);

  /** Check if auto-heal should trigger for this error */
  const shouldAutoHeal = useCallback((errorMessage: string): boolean => {
    // Don't heal if already healing
    if (isHealingRef.current) return false;

    // Don't heal if max attempts reached
    if (attemptsRef.current.length >= mergedConfig.maxAttempts) return false;

    // Cooldown check
    if (Date.now() - lastHealTimeRef.current < mergedConfig.cooldownMs) return false;

    // Don't heal on abort or timeout — these are transient and handled by retry
    const lower = errorMessage.toLowerCase();
    if (lower.includes('aborted') || lower.includes('abort')) return false;
    if (lower.includes('timeout')) return false;

    // Don't heal on network/infrastructure errors
    if (lower.includes('unavailable') || lower.includes('503') || lower.includes('502')) return false;

    return true;
  }, [mergedConfig]);

  /** Build the auto-heal prompt for the AI */
  const buildHealPrompt = useCallback((
    errorMessage: string,
    errorDetails: string[],
    diffContext: string,
  ): string => {
    const attempt = attemptsRef.current.length + 1;
    
    const lines = [
      `🔧 **Auto-fix (attempt ${attempt}/${mergedConfig.maxAttempts})**`,
      ``,
      `The build failed with the following error:`,
      `\`\`\``,
      errorMessage,
      ...errorDetails.slice(0, 5).map(d => `  ${d}`),
      `\`\`\``,
    ];

    if (diffContext) {
      lines.push(``, `**Context:**`, diffContext);
    }

    lines.push(
      ``,
      `Please fix the error. Only modify the files that need changes.`,
      `Do NOT add explanatory text — just output the corrected files.`,
    );

    return lines.join('\n');
  }, [mergedConfig]);

  /** Record a heal attempt */
  const recordAttempt = useCallback((errorMessage: string): AutoHealAttempt => {
    const attempt: AutoHealAttempt = {
      attemptNumber: attemptsRef.current.length + 1,
      errorMessage,
      timestamp: Date.now(),
      resolved: false,
    };
    attemptsRef.current.push(attempt);
    isHealingRef.current = true;
    lastHealTimeRef.current = Date.now();
    return attempt;
  }, []);

  /** Mark healing as complete (success or failure) */
  const completeHeal = useCallback((resolved: boolean) => {
    isHealingRef.current = false;
    const last = attemptsRef.current[attemptsRef.current.length - 1];
    if (last) last.resolved = resolved;
  }, []);

  return {
    shouldAutoHeal,
    buildHealPrompt,
    recordAttempt,
    completeHeal,
    resetHealState,
    isHealing: () => isHealingRef.current,
    getAttempts: () => [...attemptsRef.current],
    attemptsRemaining: () => mergedConfig.maxAttempts - attemptsRef.current.length,
  };
}
