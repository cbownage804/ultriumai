#!/usr/bin/env node
/**
 * Wrayth Route Audit
 * Enumerates every <Route path=...> in src/App.tsx and cross-references the
 * lazy-loaded page component to check for common QA gaps.
 *
 * Findings shape: { severity, area:'route', file, line, message, path }
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const APP = readFileSync(join(ROOT, 'src/App.tsx'), 'utf8');
const findings = [];

// 1) Grab lazy import map: const Name = lazy(() => import('@/pages/…'));
const lazyRe = /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)\)/g;
const importMap = new Map();
for (const m of APP.matchAll(lazyRe)) {
  const alias = m[2].replace('@/', 'src/');
  const candidates = [`${alias}.tsx`, `${alias}.ts`, `${alias}/index.tsx`];
  const resolved = candidates.find((c) => existsSync(join(ROOT, c)));
  if (resolved) importMap.set(m[1], resolved);
}

// 2) Enumerate <Route path=... element={... <Comp /> ...} />
const routeRe = /<Route\s+path=(?:"([^"]+)"|'([^']+)')[^>]*element=\{([\s\S]*?)\}\s*\/?>/g;
const routes = [];
let match;
while ((match = routeRe.exec(APP)) !== null) {
  const path = match[1] ?? match[2];
  const element = match[3];
  const compMatch = element.match(/<(\w+)\s*\/?>/g);
  const comps = compMatch ? compMatch.map((c) => c.replace(/[<>/\s]/g, '')) : [];
  const pageComp = comps.find((c) => importMap.has(c));
  routes.push({ path, pageComp, raw: element });
}

// 3) For each real page route, check the page file for QA signals
for (const route of routes) {
  if (!route.pageComp) continue;
  const file = importMap.get(route.pageComp);
  const src = readFileSync(join(ROOT, file), 'utf8');

  // supabase.<something>(...) without a surrounding try / catch or .catch()
  const supaCalls = [...src.matchAll(/supabase\.\w[\w.]*\s*\(/g)];
  if (supaCalls.length > 0) {
    const hasErrorHandling = /\.catch\s*\(|try\s*\{[\s\S]*?\}\s*catch\s*[\(\{]/.test(src);
    if (!hasErrorHandling) {
      findings.push({
        severity: 'P1',
        area: 'route',
        file,
        line: src.slice(0, supaCalls[0].index).split('\n').length,
        message: `Page calls supabase without try/catch or .catch — errors will surface as unhandled promise rejections.`,
        path: route.path,
      });
    }
  }

  // Missing loading state signal (isLoading / loading / Skeleton / Spinner)
  const hasLoadingUi = /(isLoading|isFetching|isPending|isDownloading|isUploading|isSaving|isSubmitting|\bloading\b|<Skeleton|<LoadingSpinner|<Loader|animate-spin)/.test(src);
  const doesFetch = supaCalls.length > 0 || /useQuery\s*\(/.test(src) || /fetch\s*\(/.test(src);
  if (doesFetch && !hasLoadingUi) {
    findings.push({
      severity: 'P1',
      area: 'route',
      file,
      line: 1,
      message: 'Page fetches data but renders no loading state (no isLoading/Skeleton/Spinner).',
      path: route.path,
    });
  }

  // Missing empty state for list-shaped pages
  // Wizards / onboarding flows are step-driven, not list-shaped — exempt them.
  const isWizard = /onboarding|wizard|setup|tour/i.test(file) || /type\s+Step\s*=/.test(src);
  const looksLikeList = /\.map\s*\(\s*\(?\w+\)?\s*=>/.test(src) && /(items|rows|records|list|data)\s*\??\.length/.test(src);
  const hasEmptyState = /(No\s+\w+\s+yet|Nothing here|empty state|EmptyState|No results)/i.test(src);
  if (looksLikeList && !hasEmptyState && !isWizard) {
    findings.push({
      severity: 'P2',
      area: 'route',
      file,
      line: 1,
      message: 'List-shaped page has no visible empty-state copy.',
      path: route.path,
    });
  }
}

const outFile = join(ROOT, 'src/dev/launchIssues.routes.json');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
console.log(`audit-routes → ${findings.length} findings written to ${outFile}`);
