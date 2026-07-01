#!/usr/bin/env node
/**
 * Wrayth Launch Aggregator
 * Runs the four scanners, merges their output into src/dev/launchIssues.json,
 * and prints a triage summary.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const scanners = [
  'scripts/audit-routes.mjs',
  'scripts/audit-buttons.mjs',
  'scripts/audit-copy.mjs',
  'scripts/audit-edge-functions.mjs',
];

for (const s of scanners) {
  const r = spawnSync('node', [s], { stdio: 'inherit', cwd: ROOT });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const parts = [
  'src/dev/launchIssues.routes.json',
  'src/dev/launchIssues.buttons.json',
  'src/dev/launchIssues.copy.json',
  'src/dev/launchIssues.edge.json',
];

const all = [];
for (const p of parts) {
  if (!existsSync(join(ROOT, p))) continue;
  const j = JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
  for (const f of j.findings) all.push(f);
}

const bySev = { P0: 0, P1: 0, P2: 0 };
const byArea = {};
for (const f of all) {
  bySev[f.severity] = (bySev[f.severity] ?? 0) + 1;
  byArea[f.area] = (byArea[f.area] ?? 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  totals: { total: all.length, ...bySev, byArea },
  findings: all.sort((a, b) => (a.severity + a.file).localeCompare(b.severity + b.file)),
};

writeFileSync(join(ROOT, 'src/dev/launchIssues.json'), JSON.stringify(report, null, 2));
console.log('\nWrayth launch audit →', report.totals);
