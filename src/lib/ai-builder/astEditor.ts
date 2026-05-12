/**
 * #1 — AST-based edit applier.
 * Validates that a TS/TSX/JS/JSX file parses cleanly before accepting it,
 * and provides safe AST-aware string replacement that refuses to apply
 * an edit if the resulting file no longer parses.
 *
 * Used as a guard in front of useIncrementalApply / useAtomicFileApply
 * to eliminate "edit landed mid-token / unbalanced JSX" failures.
 */
import { parse } from '@babel/parser';
import MagicString from 'magic-string';

export interface ParseResult {
  ok: boolean;
  error?: { message: string; line?: number; column?: number };
}

const TS_EXT = /\.(tsx?|jsx?|mjs|mts|cts)$/i;

export function isParseable(path: string): boolean {
  return TS_EXT.test(path);
}

/** Try to parse a file; returns ok or a structured error. */
export function parseFile(path: string, content: string): ParseResult {
  if (!isParseable(path)) return { ok: true };
  try {
    parse(content, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      errorRecovery: false,
      plugins: [
        'jsx',
        'typescript',
        'topLevelAwait',
        'classProperties',
        'decorators-legacy',
        'optionalChaining',
        'nullishCoalescingOperator',
      ],
    });
    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        message: err?.message || String(err),
        line: err?.loc?.line,
        column: err?.loc?.column,
      },
    };
  }
}

/**
 * Apply a precise replacement only if the resulting file still parses.
 * Returns the new content on success, or { ok:false } with the parse error.
 */
export function safeReplace(
  path: string,
  original: string,
  search: string,
  replacement: string,
): { ok: true; content: string } | { ok: false; reason: string } {
  const idx = original.indexOf(search);
  if (idx === -1) return { ok: false, reason: 'search anchor not found' };
  const occurrences = original.split(search).length - 1;
  if (occurrences > 1) return { ok: false, reason: `ambiguous: ${occurrences} matches` };

  const ms = new MagicString(original);
  ms.overwrite(idx, idx + search.length, replacement);
  const next = ms.toString();
  const result = parseFile(path, next);
  if (!result.ok) return { ok: false, reason: `parse error: ${result.error?.message}` };
  return { ok: true, content: next };
}

/** Validate a batch of files; returns the first parse failure if any. */
export function validateBatch(files: { path: string; content: string }[]): {
  ok: boolean;
  failures: { path: string; error: string; line?: number }[];
} {
  const failures: { path: string; error: string; line?: number }[] = [];
  for (const f of files) {
    const res = parseFile(f.path, f.content);
    if (!res.ok) failures.push({ path: f.path, error: res.error!.message, line: res.error!.line });
  }
  return { ok: failures.length === 0, failures };
}
