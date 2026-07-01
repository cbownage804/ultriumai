#!/usr/bin/env node
/**
 * Wrayth Launch Audit
 * Grep-based checks that feed the dev-only Launch Checklist.
 * Writes src/dev/auditReport.json.
 *
 * Usage: node scripts/audit.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_ROOTS = ['src', 'supabase/functions', 'extension', 'public'];
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', '.next', 'migrations']);
const CODE_EXT = /\.(ts|tsx|js|jsx|css|html|json|md)$/;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (CODE_EXT.test(name)) out.push(p);
  }
  return out;
}

const files = SCAN_ROOTS.flatMap((r) => walk(join(ROOT, r)));

function scan(pattern, { skipSelf = true } = {}) {
  const re = new RegExp(pattern, 'g');
  const hits = [];
  for (const f of files) {
    const rel = relative(ROOT, f);
    if (skipSelf && rel.startsWith('scripts/audit.mjs')) continue;
    if (rel.startsWith('src/dev/')) continue;
    const src = readFileSync(f, 'utf8');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (re.test(line)) hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 160) });
      re.lastIndex = 0;
    });
  }
  return hits;
}

// Exclude import/require/dynamic-import lines: legacy names in internal file paths are not user-facing.
const legacyBrand = scan('SafePass|SafeScan|SafeWeb|SafeSuite|SafeAssist|SafeTrack').filter(
  (h) =>
    !/^\s*(import|export)\s.+from\s+['"]/.test(h.text) &&
    !/import\(['"][^'"]*(SafePass|SafeScan|SafeWeb|SafeSuite|SafeAssist|SafeTrack)/.test(h.text) &&
    !/require\(['"][^'"]*(SafePass|SafeScan|SafeWeb|SafeSuite|SafeAssist|SafeTrack)/.test(h.text)
);
const todos = scan('\\b(TODO|FIXME|XXX|HACK)\\b');
const consoles = scan("console\\.(log|debug|info|warn)\\(");
const hardcodedHex = scan("#[0-9a-fA-F]{6}\\b").filter((h) => !/(index\.css|tailwind\.config|tokens)/.test(h.file));
const arbitraryColors = scan("(text|bg|border)-\\[#");
const anyTypes = scan(":\\s*any(\\s|,|\\)|>|=)");

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    filesScanned: files.length,
    legacyBrand: legacyBrand.length,
    todos: todos.length,
    consoles: consoles.length,
    hardcodedHex: hardcodedHex.length,
    arbitraryColors: arbitraryColors.length,
    anyTypes: anyTypes.length,
  },
  legacyBrand: legacyBrand.slice(0, 200),
  todos: todos.slice(0, 200),
  consoles: consoles.slice(0, 200),
  hardcodedHex: hardcodedHex.slice(0, 200),
  arbitraryColors: arbitraryColors.slice(0, 200),
};

const outDir = join(ROOT, 'src/dev');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'auditReport.json'), JSON.stringify(report, null, 2));
console.log('Wrayth audit complete →', report.totals);
