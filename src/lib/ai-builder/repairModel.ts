/**
 * #7 — Two-model pipeline.
 * - Planner/writer: heavy model (Claude / Gemini Pro / GPT-5)
 * - Repairer: fast/cheap model (Gemini Flash 2.5 / GPT-4.1-mini)
 *
 * Picks the model for a given phase. Repair calls bias toward the small
 * model — they are short, well-scoped, and benefit from low latency.
 */

export type Phase = 'plan' | 'generate' | 'repair' | 'truncation_continue';

export interface ModelChoice {
  /** Lovable AI Gateway model id */
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

const HEAVY = 'google/gemini-2.5-pro';
const FAST = 'google/gemini-2.5-flash';

export function pickModel(phase: Phase, attempt = 0): ModelChoice {
  switch (phase) {
    case 'plan':
      return { model: HEAVY, temperature: 0.4, maxOutputTokens: 4_000 };
    case 'generate':
      return { model: HEAVY, temperature: 0.5, maxOutputTokens: 16_000 };
    case 'truncation_continue':
      return { model: HEAVY, temperature: 0.2, maxOutputTokens: 8_000 };
    case 'repair':
      // Always use the fast model for repair — short, scoped, latency matters.
      // Bump temperature slightly each retry to escape local minima.
      return { model: FAST, temperature: Math.min(0.1 + attempt * 0.15, 0.5), maxOutputTokens: 6_000 };
  }
}

/** Heuristic — should this attempt go to the heavy model instead? */
export function shouldEscalate(attempt: number, lastErrorCategory?: string): boolean {
  if (attempt >= 3) return true;
  if (lastErrorCategory === 'unknown') return true;
  return false;
}
