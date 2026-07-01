#!/usr/bin/env node
/**
 * Wrayth Button Audit
 * Flags Buttons and click handlers likely to be dead or debug-only.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const ROOT = process.cwd();
const IGNORE = new Set(['node_modules', 'dist', '.git', 'migrations', 'ui']); // shadcn primitives in components/ui
const CODE = /\.(tsx?|jsx?)$/;

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

const files = walk(join(ROOT, 'src'));
const findings = [];

for (const f of files) {
  const rel = relative(ROOT, f);
  if (rel.startsWith('src/dev/') || rel.includes('.test.') || rel.includes('.spec.')) continue;
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    const ln = i + 1;

    // Empty click handler
    if (/onClick=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(line)) {
      findings.push({ severity: 'P0', area: 'button', file: rel, line: ln, message: 'Empty onClick handler — button does nothing.' });
    }
    // Handler that only logs
    if (/onClick=\{\s*\(\s*\)\s*=>\s*console\.(log|debug|info)/.test(line)) {
      findings.push({ severity: 'P0', area: 'button', file: rel, line: ln, message: 'onClick only logs — placeholder handler.' });
    }
    // TODO/FIXME right next to onClick
    if (/onClick[\s\S]{0,60}(TODO|FIXME)/i.test(line)) {
      findings.push({ severity: 'P1', area: 'button', file: rel, line: ln, message: 'Button handler marked TODO/FIXME.' });
    }
    // href="#" links
    if (/href=(?:"|')#(?:"|')/.test(line) && /<a\s/.test(line)) {
      findings.push({ severity: 'P1', area: 'button', file: rel, line: ln, message: 'Anchor with href="#" — dead link.' });
    }
    // <Button ...> with no obvious handler: look at 3 lines back + 6 forward for Link/DialogTrigger asChild/onClick/type/form/asChild
    if (/<Button(\s|>)/.test(line) && !/onClick|type=|asChild|form=/.test(line)) {
      const start = Math.max(0, i - 3);
      const chunk = lines.slice(start, i + 6).join(' ');
      const wrappedByLink = /<Link[\s\S]*?<Button/.test(chunk);
      const insideAsChild = /asChild[\s\S]*?<Button/.test(chunk);
      const hasHandler = /(onClick|type=|form=|to=|href=)/.test(chunk);
      if (!wrappedByLink && !insideAsChild && !hasHandler) {
        findings.push({ severity: 'P1', area: 'button', file: rel, line: ln, message: '<Button> with no onClick, type, form, Link wrapper, or asChild parent.' });
      }
    }
  });
}

const outFile = join(ROOT, 'src/dev/launchIssues.buttons.json');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
console.log(`audit-buttons → ${findings.length} findings`);
