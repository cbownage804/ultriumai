/**
 * #6 — Deterministic scaffold lock.
 * Boot files (index.html, main.tsx, vite.config, tsconfig, tailwind.config,
 * postcss.config) come from a fixed template and the AI may NOT regenerate
 * them unless the user explicitly asks. The orchestrator strips any AI op
 * that targets a locked path so generation effectively becomes diff-only.
 */
import type { EditOp } from './editSchema';

export const LOCKED_PATHS = new Set([
  'index.html',
  'src/main.tsx',
  'vite.config.ts',
  'vite.config.js',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'postcss.config.js',
  'postcss.config.cjs',
  'tailwind.config.ts',
  'tailwind.config.js',
]);

export interface ScaffoldFilterResult {
  kept: EditOp[];
  dropped: { op: EditOp; reason: string }[];
}

export function filterScaffoldOps(ops: EditOp[], userExplicitlyAllowed = false): ScaffoldFilterResult {
  if (userExplicitlyAllowed) return { kept: ops, dropped: [] };
  const kept: EditOp[] = [];
  const dropped: { op: EditOp; reason: string }[] = [];
  for (const op of ops) {
    if (LOCKED_PATHS.has(op.path) && (op.op === 'create' || op.op === 'rewrite' || op.op === 'delete')) {
      dropped.push({ op, reason: `locked scaffold file (${op.path}) — not regenerable without explicit user request` });
      continue;
    }
    kept.push(op);
  }
  return { kept, dropped };
}

/** System-prompt fragment that tells the model not to touch boot files. */
export const SCAFFOLD_LOCK_PROMPT = `
[SCAFFOLD LOCK]
Do NOT generate or rewrite these files unless the user explicitly asked:
${[...LOCKED_PATHS].map(p => `  - ${p}`).join('\n')}
They already exist with correct contents. Generate only the diff.
`.trim();
