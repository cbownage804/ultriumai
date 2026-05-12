/**
 * #5 — Hard project invariants gate.
 * Run BEFORE shipping a file set to the sandbox. Returns structured
 * errors the AI can fix in one shot instead of vague compile failures.
 */
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { checkCrossFile } from './crossFileCheck';
import { validateBatch } from './astEditor';

export interface InvariantViolation {
  code: string;
  severity: 'error' | 'warning';
  path?: string;
  message: string;
  hint?: string;
}

const REQUIRED_FILES = ['index.html', 'src/main.tsx', 'src/App.tsx'];

export function checkInvariants(files: ProjectFile[]): InvariantViolation[] {
  const v: InvariantViolation[] = [];
  const map = new Map(files.map(f => [f.path, f]));

  // 1. Required boot files
  for (const req of REQUIRED_FILES) {
    if (!map.has(req)) v.push({ code: 'missing_boot_file', severity: 'error', path: req, message: `Required file ${req} is missing`, hint: 'Restore from golden template' });
  }

  // 2. index.html mounts something
  const html = map.get('index.html');
  if (html && !/id\s*=\s*["'](root|app)["']/.test(html.content)) {
    v.push({ code: 'no_mount_node', severity: 'error', path: 'index.html', message: 'No <div id="root"> mount node' });
  }

  // 3. main.tsx wires App
  const main = map.get('src/main.tsx');
  if (main && (!/createRoot/.test(main.content) || !/\.render\s*\(/.test(main.content))) {
    v.push({ code: 'main_no_render', severity: 'error', path: 'src/main.tsx', message: 'main.tsx must call createRoot(...).render(...)' });
  }

  // 4. App.tsx has default export
  const app = map.get('src/App.tsx');
  if (app && !/export\s+default\b/.test(app.content)) {
    v.push({ code: 'no_default_export', severity: 'error', path: 'src/App.tsx', message: 'App.tsx must `export default`' });
  }

  // 5. AST parse all source files
  const parseResult = validateBatch(files.filter(f => /\.(tsx?|jsx?)$/i.test(f.path)));
  for (const fail of parseResult.failures) {
    v.push({ code: 'parse_error', severity: 'error', path: fail.path, message: `Parse failed${fail.line ? ` at line ${fail.line}` : ''}: ${fail.error}` });
  }

  // 6. Cross-file imports/exports
  for (const issue of checkCrossFile(files)) {
    v.push({ code: issue.severity === 'error' ? 'unresolved_import' : 'unknown_export', severity: issue.severity, path: issue.path, message: issue.message });
  }

  return v;
}

export function isFatal(violations: InvariantViolation[]): boolean {
  return violations.some(v => v.severity === 'error');
}

export function formatForPrompt(violations: InvariantViolation[]): string {
  if (violations.length === 0) return '';
  return [
    '[PRE-COMPILE INVARIANT FAILURES — fix these exactly]',
    ...violations.map((v, i) =>
      `${i + 1}. [${v.code}] ${v.path ? v.path + ': ' : ''}${v.message}${v.hint ? ` — ${v.hint}` : ''}`,
    ),
  ].join('\n');
}
