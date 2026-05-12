/**
 * #3 + #4 — Constrained edit schema with anchor verification.
 *
 * The AI is instructed to emit edits as JSON envelopes matching `EditOp`.
 * Each non-create op carries `before_anchor` + `after_anchor` (3 lines each)
 * that MUST appear contiguously in the target file or the edit is rejected
 * before it is applied — eliminating "wrong-line" failures.
 */
import { z } from 'zod';
import { parseFile } from './astEditor';

export const EditOpSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('create'),
    path: z.string().min(1),
    content: z.string(),
  }),
  z.object({
    op: z.literal('replace'),
    path: z.string().min(1),
    before_anchor: z.string().min(1),
    target: z.string(),
    after_anchor: z.string().min(1),
    replacement: z.string(),
  }),
  z.object({
    op: z.literal('delete'),
    path: z.string().min(1),
  }),
  z.object({
    op: z.literal('rewrite'),
    path: z.string().min(1),
    content: z.string(),
    reason: z.string().optional(),
  }),
]);

export type EditOp = z.infer<typeof EditOpSchema>;

export const EditBatchSchema = z.object({
  version: z.literal(1),
  ops: z.array(EditOpSchema).min(1),
});

export type EditBatch = z.infer<typeof EditBatchSchema>;

export interface ApplyResult {
  ok: boolean;
  rejected: { op: EditOp; reason: string }[];
  newFiles: { path: string; content: string }[];
}

/** Parse JSON output from the model. Returns null if not a valid edit batch. */
export function parseEditBatch(raw: string): EditBatch | null {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    const parsed = JSON.parse(raw.slice(start, end + 1));
    const result = EditBatchSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Apply an edit batch transactionally with anchor verification + AST validation.
 * Caller passes the current file map; result is the new file map or rejection list.
 */
export function applyEditBatch(
  batch: EditBatch,
  currentFiles: Record<string, string>,
): ApplyResult {
  const next: Record<string, string> = { ...currentFiles };
  const rejected: { op: EditOp; reason: string }[] = [];

  for (const op of batch.ops) {
    switch (op.op) {
      case 'create':
      case 'rewrite': {
        const parse = parseFile(op.path, op.content);
        if (!parse.ok) {
          rejected.push({ op, reason: `parse: ${parse.error?.message}` });
          continue;
        }
        next[op.path] = op.content;
        break;
      }
      case 'delete': {
        if (!(op.path in next)) {
          rejected.push({ op, reason: 'file not found' });
          continue;
        }
        delete next[op.path];
        break;
      }
      case 'replace': {
        const file = next[op.path];
        if (file === undefined) { rejected.push({ op, reason: 'file not found' }); continue; }
        const needle = op.before_anchor + op.target + op.after_anchor;
        const idx = file.indexOf(needle);
        if (idx === -1) {
          rejected.push({ op, reason: 'anchor block not found (verbatim match required)' });
          continue;
        }
        if (file.indexOf(needle, idx + 1) !== -1) {
          rejected.push({ op, reason: 'anchor block matched in multiple locations' });
          continue;
        }
        const updated =
          file.slice(0, idx) +
          op.before_anchor + op.replacement + op.after_anchor +
          file.slice(idx + needle.length);
        const parse = parseFile(op.path, updated);
        if (!parse.ok) {
          rejected.push({ op, reason: `post-edit parse: ${parse.error?.message}` });
          continue;
        }
        next[op.path] = updated;
        break;
      }
    }
  }

  if (rejected.length > 0) {
    // Atomic — rollback
    return { ok: false, rejected, newFiles: [] };
  }

  return {
    ok: true,
    rejected: [],
    newFiles: Object.entries(next).map(([path, content]) => ({ path, content })),
  };
}

/** System-prompt fragment that documents the schema for the model. */
export const EDIT_SCHEMA_PROMPT = `
[EDIT PROTOCOL — JSON ONLY]
Respond with a single JSON object matching:
{
  "version": 1,
  "ops": [
    { "op": "create", "path": "src/components/Foo.tsx", "content": "..." } |
    { "op": "rewrite", "path": "src/App.tsx", "content": "...", "reason": "..." } |
    { "op": "delete", "path": "src/old.tsx" } |
    { "op": "replace", "path": "src/X.tsx",
      "before_anchor": "<<3 verbatim source lines immediately preceding the change>>",
      "target": "<<the lines to remove (may be empty for pure insertions)>>",
      "after_anchor": "<<3 verbatim source lines immediately following the change>>",
      "replacement": "<<new lines that replace target>>" }
  ]
}
RULES:
- Anchors must be byte-for-byte identical to the file. No paraphrasing.
- Prefer "replace" over "rewrite" for any change under 40 lines.
- Each op is rejected if anchors don't match uniquely OR the resulting file fails to parse.
- Do not include markdown fences. Do not write commentary outside the JSON.
`.trim();
