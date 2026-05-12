import { useCallback, useRef } from 'react';
import type { ParsedViteError } from './parseViteErrors';
import { classifyCompileError, type CompileErrorCategory } from './compileErrorClassifier';
import { buildRepairContext } from './repairContextBuilder';
import { recordFailure, recordResolution } from '@/lib/ai-builder/failureTelemetry';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * useAutoHealCompile — Automatically re-prompts the AI when compilation
 * fails, sending the error message + LKG diff context for self-correction.
 *
 * Enhancements:
 * - Per-category retry budget (high-confidence errors get more attempts)
 * - LKG auto-pin: after 2 consecutive failed generations, pin LKG and
 *   require explicit user confirmation before next attempt
 * - Diff-only repair: send only broken files + their direct importers
 */

export interface AutoHealAttempt {
  attemptNumber: number;
  errorMessage: string;
  category: CompileErrorCategory;
  timestamp: number;
  resolved: boolean;
}

export interface AutoHealConfig {
  maxAttempts: number;
  /** Minimum time between heal attempts (ms) */
  cooldownMs: number;
  /** Number of consecutive failed generations before LKG auto-pin engages */
  autoPinThreshold: number;
}

const DEFAULT_CONFIG: AutoHealConfig = {
  maxAttempts: 3,
  cooldownMs: 2000,
  autoPinThreshold: 2,
};

// Per-category retry budgets — high-confidence errors get more attempts,
// low-confidence (unknown) errors get capped to avoid runaway loops.
const CATEGORY_BUDGETS: Partial<Record<CompileErrorCategory, number>> = {
  missing_import: 4,
  jsx_error: 4,
  missing_module: 4,
  duplicate_export: 3,
  syntax_error: 3,
  null_access: 3,
  hook_violation: 3,
  type_error: 2,
  runtime_crash: 2,
  unknown: 1,
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
  /** Counts consecutive failed generations across resets — for LKG auto-pin */
  const consecutiveFailedGenerationsRef = useRef(0);
  /** When true, auto-heal is paused until user explicitly retries */
  const autoPinnedRef = useRef(false);

  /** Reset heal state — call when a new generation starts */
  const resetHealState = useCallback(() => {
    attemptsRef.current = [];
    isHealingRef.current = false;
    lastHealTimeRef.current = 0;
  }, []);

  /** Called when an entire generation succeeds — clears the auto-pin counter */
  const noteGenerationSuccess = useCallback(() => {
    consecutiveFailedGenerationsRef.current = 0;
    autoPinnedRef.current = false;
  }, []);

  /** Called when an entire generation fails (max attempts exhausted) */
  const noteGenerationFailure = useCallback(() => {
    consecutiveFailedGenerationsRef.current++;
    if (consecutiveFailedGenerationsRef.current >= mergedConfig.autoPinThreshold) {
      autoPinnedRef.current = true;
      console.warn(`[AutoHeal] 🔒 LKG auto-pin engaged after ${consecutiveFailedGenerationsRef.current} consecutive failed generations`);
    }
  }, [mergedConfig]);

  /** User explicitly opted to continue past the auto-pin */
  const overrideAutoPin = useCallback(() => {
    autoPinnedRef.current = false;
    consecutiveFailedGenerationsRef.current = 0;
  }, []);

  /** Check if auto-heal should trigger for this error */
  const shouldAutoHeal = useCallback((errorMessage: string, errorDetails: string[] = []): boolean => {
    // Don't heal if LKG is auto-pinned
    if (autoPinnedRef.current) {
      console.info('[AutoHeal] Skipped — LKG is auto-pinned (user must explicitly retry)');
      return false;
    }

    // Don't heal if already healing
    if (isHealingRef.current) return false;

    // Per-category retry budget: high-confidence errors get more attempts,
    // unknown/low-confidence get capped to prevent runaway loops.
    const classified = classifyCompileError(errorMessage, errorDetails);
    const categoryBudget = CATEGORY_BUDGETS[classified.category] ?? mergedConfig.maxAttempts;
    const effectiveLimit = Math.min(categoryBudget, mergedConfig.maxAttempts + 1);
    if (attemptsRef.current.length >= effectiveLimit) {
      console.info(`[AutoHeal] Budget exhausted for ${classified.category} (${attemptsRef.current.length}/${effectiveLimit})`);
      return false;
    }

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

  /** Build the auto-heal prompt for the AI, including error locality + diff-only repair context */
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
    /** All project files — used to compute diff-only importer context */
    allFiles?: ProjectFile[],
  ): string => {
    const attempt = attemptsRef.current.length + 1;

    // Classify the error for specialized fix instructions
    const classified = classifyCompileError(errorMessage, errorDetails);

    const lines = [
      `🔧 **Auto-fix (attempt ${attempt}/${mergedConfig.maxAttempts})** — ${classified.label} (confidence: ${Math.round(classified.confidence * 100)}%)`,
      ``,
      `The build failed with the following error:`,
      `\`\`\``,
      errorMessage,
      ...errorDetails.slice(0, 5).map(d => `  ${d}`),
      `\`\`\``,
      ``,
      `[SPECIALIZED FIX INSTRUCTIONS for ${classified.category.toUpperCase()}]`,
      classified.specializedPrompt,
    ];

    // Diff-only repair context: include direct importers of broken files so the AI
    // understands the call sites without seeing the entire project.
    if (allFiles && parsedErrors && parsedErrors.length > 0) {
      const ctx = buildRepairContext(parsedErrors, allFiles, 5);
      if (ctx.importerFiles.length > 0) {
        lines.push(``, `**Importers of broken files (read-only context — do NOT modify unless required):**`);
        for (const imp of ctx.importerFiles) {
          const head = imp.content.split('\n').slice(0, 60).join('\n');
          lines.push(``, `\`\`\`tsx`, `// ${imp.path} (first 60 lines)`, head, `\`\`\``);
        }
      }
    }

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
  const recordAttempt = useCallback((errorMessage: string, errorDetails: string[] = []): AutoHealAttempt => {
    const classified = classifyCompileError(errorMessage, errorDetails);
    const attempt: AutoHealAttempt = {
      attemptNumber: attemptsRef.current.length + 1,
      errorMessage,
      category: classified.category,
      timestamp: Date.now(),
      resolved: false,
    };
    attemptsRef.current.push(attempt);
    isHealingRef.current = true;
    lastHealTimeRef.current = Date.now();
    // Telemetry — fire-and-forget; never throws.
    recordFailure({
      phase: 'compile',
      category: classified.category,
      errorMessage: errorMessage.slice(0, 1000),
      attempt: attempt.attemptNumber,
    });
    return attempt;
  }, []);

  /** Mark healing as complete (success or failure) */
  const completeHeal = useCallback((resolved: boolean) => {
    isHealingRef.current = false;
    const last = attemptsRef.current[attemptsRef.current.length - 1];
    if (last) {
      last.resolved = resolved;
      if (resolved) {
        recordResolution({
          phase: 'repair',
          category: last.category,
          errorMessage: last.errorMessage.slice(0, 1000),
          attempt: last.attemptNumber,
        });
      }
    }
  }, []);

  return {
    shouldAutoHeal,
    buildHealPrompt,
    recordAttempt,
    completeHeal,
    resetHealState,
    noteGenerationSuccess,
    noteGenerationFailure,
    overrideAutoPin,
    isAutoPinned: () => autoPinnedRef.current,
    isHealing: () => isHealingRef.current,
    getAttempts: () => [...attemptsRef.current],
    attemptsRemaining: () => mergedConfig.maxAttempts - attemptsRef.current.length,
  };
}
