import { useCallback, useRef } from 'react';
import type { ParsedViteError } from './parseViteErrors';

/**
 * useAutoHealCompile — Automatically re-prompts the AI when compilation
 * fails, sending the error message + LKG diff context for self-correction.
 * 
 * Step 1 (Lovable Parity): Error locality — extracts exact file:line from
 * ParsedViteError and sends a ±20 line window instead of the full file.
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

/** Extract a ±windowSize line window around a specific line number */
function extractLineWindow(content: string, targetLine: number, windowSize = 20): string {
  const lines = content.split('\n');
  const start = Math.max(0, targetLine - windowSize - 1);
  const end = Math.min(lines.length, targetLine + windowSize);
  return lines
    .slice(start, end)
    .map((l, i) => `${start + i + 1}: ${l}`)
    .join('\n');
}

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

  /** Build the auto-heal prompt for the AI, including error locality context */
  const buildHealPrompt = useCallback((
    errorMessage: string,
    errorDetails: string[],
    diffContext: string,
    /** Full content of the failing file(s) for richer AI context */
    failingFiles?: { path: string; content: string }[],
    /** Parsed Vite errors with file:line info for locality */
    parsedErrors?: ParsedViteError[],
    /** Anti-pattern context from error learning */
    antiPatternContext?: string,
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

    // Step 1: Error locality — show ±20 line windows around error sites instead of full files
    if (parsedErrors && parsedErrors.length > 0 && failingFiles) {
      lines.push(``, `**Error locations:**`);
      const shown = new Set<string>();
      for (const pe of parsedErrors.slice(0, 5)) {
        const key = `${pe.file}:${pe.line}`;
        if (shown.has(key)) continue;
        shown.add(key);
        const file = failingFiles.find(f => f.path === pe.file || f.path.endsWith(`/${pe.file}`) || f.path === `src/${pe.file}`);
        if (file) {
          const window = extractLineWindow(file.content, pe.line);
          lines.push(
            ``,
            `📍 \`${pe.file}:${pe.line}${pe.column ? `:${pe.column}` : ''}\` — ${pe.message}`,
            `\`\`\`tsx`,
            window,
            `\`\`\``,
          );
        } else {
          lines.push(`📍 \`${pe.file}:${pe.line}\` — ${pe.message}`);
        }
      }
    } else if (failingFiles && failingFiles.length > 0) {
      // Fallback: include full file content (up to 3 files, 500 lines each)
      lines.push(``, `**Failing file contents:**`);
      for (const f of failingFiles.slice(0, 3)) {
        const truncated = f.content.split('\n').slice(0, 500).join('\n');
        lines.push(``, `\`\`\`tsx`, `// ${f.path}`, truncated, `\`\`\``);
      }
    }

    if (diffContext) {
      lines.push(``, `**Changes since last working build:**`, diffContext);
    }

    // Step 6: Inject anti-pattern context from error learning
    if (antiPatternContext) {
      lines.push(``, antiPatternContext);
    }

    lines.push(
      ``,
      `This is a REPAIR of the CURRENT project, not a new app request.`,
      `Do NOT regenerate the app from scratch or replace it with a generic landing page/template.`,
      `Preserve the user's requested product, content, layout, and styling unless directly required to fix the error.`,
      `Please fix the error. Only modify the files that need changes.`,
      `Do NOT add explanatory text — just output the corrected files.`,
      attempt >= 2 ? `Previous fix attempts failed. Try a different approach — consider restructuring the component or simplifying the code.` : '',
    );

    return lines.filter(Boolean).join('\n');
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
