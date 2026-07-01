#!/usr/bin/env node
/**
 * Wrayth Copy Audit
 * Flags legacy brand strings visible to users and Ray voice drift.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const ROOT = process.cwd();
const SCAN_ROOTS = ['src', 'supabase/functions'];
const IGNORE = new Set(['node_modules', 'dist', '.git', 'migrations']);
const CODE = /\.(tsx?|jsx?|css|md|json)$/;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (CODE.test(name)) out.push(p);
  }
  return out;
}

const files = SCAN_ROOTS.flatMap((r) => walk(join(ROOT, r)));
const findings = [];

const LEGACY = /\b(SafePass|SafeScan|SafeWeb|SafeSuite|SafeAssist|SafeTrack)\b/;

for (const f of files) {
  const rel = relative(ROOT, f);
  if (rel.startsWith('src/dev/')) continue;

  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    const ln = i + 1;
    if (!LEGACY.test(line)) return;

    // Skip import/export paths and route-string internals — internal file paths are not user-facing.
    if (/^\s*(import|export)\s.+from\s+['"]/.test(line)) return;
    if (/import\(['"][^'"]+['"]\)/.test(line)) return;
    if (/require\(['"][^'"]+['"]\)/.test(line)) return;

    // Ray's system prompt intentionally references legacy product names to explain platform history.
    const isRayPrompt = /ray-chat|BASE_SYSTEM_PROMPT|systemPrompt|"role"\s*:\s*"system"/.test(src);
    if (isRayPrompt && /you\s+are\s+ray|persona/i.test(src)) return;

    // User-facing string: inside JSX text, string literal, or template literal
    const looksUserFacing =
      /['"`][^'"`]*\b(SafePass|SafeScan|SafeWeb|SafeSuite|SafeAssist|SafeTrack)\b[^'"`]*['"`]/.test(line) ||
      />[^<>{}]*\b(SafePass|SafeScan|SafeWeb|SafeSuite|SafeAssist|SafeTrack)\b[^<>{}]*</.test(line);

    findings.push({
      severity: looksUserFacing ? 'P1' : 'P2',
      area: 'copy',
      file: rel,
      line: ln,
      message: looksUserFacing
        ? 'User-facing legacy brand name — replace with Wrayth / Vault / Scan / Watch / Ray.'
        : 'Legacy brand identifier in internal code — safe but noisy.',
    });
  });
}

const outFile = join(ROOT, 'src/dev/launchIssues.copy.json');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
console.log(`audit-copy → ${findings.length} findings`);
