/**
 * #8 — All-or-nothing batch apply.
 * Wraps useAtomicFileApply with AST validation + invariant checks.
 * A batch is applied IFF every file parses AND project invariants
 * still hold after the batch is materialized in memory.
 */
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { validateBatch } from './astEditor';
import { checkInvariants, isFatal, formatForPrompt } from './projectInvariants';

export interface BatchOutcome {
  ok: boolean;
  files: ProjectFile[];
  reason?: string;
  feedback?: string;
}

export function safeBatchApply(
  current: ProjectFile[],
  incoming: ProjectFile[],
): BatchOutcome {
  // 1. Per-file parse
  const parse = validateBatch(incoming);
  if (!parse.ok) {
    return {
      ok: false,
      files: current,
      reason: 'parse_error',
      feedback: parse.failures.map(f => `${f.path}${f.line ? ':' + f.line : ''} — ${f.error}`).join('\n'),
    };
  }

  // 2. Materialize merged set
  const map = new Map(current.map(f => [f.path, f]));
  for (const f of incoming) map.set(f.path, f);
  const merged = [...map.values()];

  // 3. Invariants
  const violations = checkInvariants(merged);
  if (isFatal(violations)) {
    return {
      ok: false,
      files: current,
      reason: 'invariant_violation',
      feedback: formatForPrompt(violations),
    };
  }

  return { ok: true, files: merged };
}
