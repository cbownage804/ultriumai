/**
 * #2 — Whole-project symbol/import sanity check.
 * Lightweight cross-file analysis without spinning up tsc:
 *  - every relative import resolves to an existing file
 *  - every named import maps to a real export from that file
 *  - no duplicate default exports per file
 *
 * Catches the "renamed export / missing route component" bugs that per-file
 * checks miss, in <50ms for typical projects.
 */
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface CrossFileIssue {
  severity: 'error' | 'warning';
  path: string;
  message: string;
}

const RESOLVE_EXTS = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];

function resolveImport(importer: string, spec: string, fileSet: Set<string>): string | null {
  if (!spec.startsWith('.') && !spec.startsWith('/') && !spec.startsWith('@/')) return null;
  let base: string;
  if (spec.startsWith('@/')) {
    base = 'src/' + spec.slice(2);
  } else if (spec.startsWith('/')) {
    base = spec.slice(1);
  } else {
    const dir = importer.split('/').slice(0, -1).join('/');
    const parts = (dir + '/' + spec).split('/');
    const stack: string[] = [];
    for (const p of parts) {
      if (p === '..') stack.pop();
      else if (p && p !== '.') stack.push(p);
    }
    base = stack.join('/');
  }
  if (fileSet.has(base)) return base;
  for (const ext of RESOLVE_EXTS) {
    const cand = base + ext;
    if (fileSet.has(cand)) return cand;
  }
  return null;
}

function extractExports(content: string): { named: Set<string>; hasDefault: boolean; defaultCount: number } {
  const named = new Set<string>();
  let defaultCount = 0;
  const namedRe = /export\s+(?:const|let|var|function|class|type|interface|enum)\s+(\w+)/g;
  const reExportRe = /export\s*\{\s*([^}]+)\s*\}/g;
  const defaultRe = /export\s+default\b/g;
  let m: RegExpExecArray | null;
  while ((m = namedRe.exec(content)) !== null) named.add(m[1]);
  while ((m = reExportRe.exec(content)) !== null) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/i).pop()!.trim();
      if (name) named.add(name);
    }
  }
  while (defaultRe.exec(content) !== null) defaultCount++;
  return { named, hasDefault: defaultCount > 0, defaultCount };
}

function extractImports(content: string): { spec: string; defaultName?: string; named: string[] }[] {
  const out: { spec: string; defaultName?: string; named: string[] }[] = [];
  const re = /import\s+(?:(\w+)\s*,?\s*)?(?:\{\s*([^}]+)\s*\})?\s*from\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const named = m[2]
      ? m[2].split(',').map(s => s.trim().split(/\s+as\s+/i)[0].trim()).filter(Boolean)
      : [];
    out.push({ spec: m[3], defaultName: m[1], named });
  }
  return out;
}

export function checkCrossFile(files: ProjectFile[]): CrossFileIssue[] {
  const issues: CrossFileIssue[] = [];
  const fileSet = new Set(files.map(f => f.path));
  const exportCache = new Map<string, ReturnType<typeof extractExports>>();

  for (const f of files) {
    if (!/\.(tsx?|jsx?)$/i.test(f.path)) continue;

    const exp = extractExports(f.content);
    exportCache.set(f.path, exp);
    if (exp.defaultCount > 1) {
      issues.push({ severity: 'error', path: f.path, message: `${exp.defaultCount} default exports — only one allowed` });
    }
  }

  for (const f of files) {
    if (!/\.(tsx?|jsx?)$/i.test(f.path)) continue;
    const imports = extractImports(f.content);
    for (const imp of imports) {
      const resolved = resolveImport(f.path, imp.spec, fileSet);
      if (!imp.spec.startsWith('.') && !imp.spec.startsWith('@/') && !imp.spec.startsWith('/')) continue;
      if (!resolved) {
        issues.push({ severity: 'error', path: f.path, message: `Cannot resolve import "${imp.spec}"` });
        continue;
      }
      const target = exportCache.get(resolved);
      if (!target) continue;
      if (imp.defaultName && !target.hasDefault) {
        issues.push({ severity: 'error', path: f.path, message: `"${imp.spec}" has no default export (needed by ${imp.defaultName})` });
      }
      for (const n of imp.named) {
        if (!target.named.has(n)) {
          issues.push({ severity: 'warning', path: f.path, message: `"${imp.spec}" may not export "${n}"` });
        }
      }
    }
  }

  return issues;
}
