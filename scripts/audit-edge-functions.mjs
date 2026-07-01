#!/usr/bin/env node
/**
 * Wrayth Edge Function Audit
 * For each supabase/functions/*/index.ts, verify baseline resilience.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const ROOT = process.cwd();
const FN_ROOT = join(ROOT, 'supabase/functions');
const findings = [];

if (!existsSync(FN_ROOT)) {
  console.log('audit-edge-functions → no supabase/functions/ directory');
  process.exit(0);
}

for (const name of readdirSync(FN_ROOT)) {
  if (name.startsWith('_') || name.startsWith('.')) continue;
  const idx = join(FN_ROOT, name, 'index.ts');
  if (!existsSync(idx)) continue;
  const rel = relative(ROOT, idx);
  const src = readFileSync(idx, 'utf8');

  const hasCors = /Access-Control-Allow-Origin|corsHeaders/.test(src);
  const hasOptions = /req\.method\s*===\s*['"]OPTIONS['"]/.test(src);
  const hasTryCatch = /try\s*\{[\s\S]*?catch\s*\(/.test(src);
  const returnsJsonError = /catch[\s\S]{0,400}Response[\s\S]{0,200}(JSON\.stringify|application\/json)/.test(src);
  const readsUser = /getClaims\(|getUser\(|auth\.uid\(/.test(src);
  const authHeaderCheck = /Authorization|authorization/.test(src);
  const isPublicWebhook = /stripe-webhook|send-auth-email|serve-preview|ms-graph-oauth-callback/.test(name);

  if (!hasCors) findings.push({ severity: 'P1', area: 'edge', file: rel, line: 1, message: `Function "${name}" has no CORS headers — browser calls will fail.` });
  if (!hasOptions && !isPublicWebhook) findings.push({ severity: 'P1', area: 'edge', file: rel, line: 1, message: `Function "${name}" has no OPTIONS preflight handler.` });
  if (!hasTryCatch) findings.push({ severity: 'P0', area: 'edge', file: rel, line: 1, message: `Function "${name}" has no top-level try/catch — one throw crashes the request.` });
  else if (!returnsJsonError) findings.push({ severity: 'P1', area: 'edge', file: rel, line: 1, message: `Function "${name}" catches errors but doesn't return JSON — clients see raw text.` });
  if (!readsUser && !isPublicWebhook && !authHeaderCheck) {
    findings.push({ severity: 'P1', area: 'edge', file: rel, line: 1, message: `Function "${name}" never verifies caller identity (no getClaims/getUser/Authorization check).` });
  }
  // Flag legacy-named functions (rename candidates for beta)
  if (/^(safepass|safeweb|safescan|safesuite|safeassist|safetrack)-/.test(name)) {
    findings.push({ severity: 'P2', area: 'edge', file: rel, line: 1, message: `Function "${name}" still carries a legacy product prefix — rename post-beta or alias.` });
  }
}

const outFile = join(ROOT, 'src/dev/launchIssues.edge.json');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
console.log(`audit-edge-functions → ${findings.length} findings`);
