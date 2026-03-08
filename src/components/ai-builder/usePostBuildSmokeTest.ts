import { useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { BuildLogEntry } from './BuildLogPanel';

export interface SmokeTestResult {
  passed: boolean;
  warnings: SmokeWarning[];
  errors: SmokeWarning[];
}

export interface SmokeWarning {
  file: string;
  line?: number;
  message: string;
  severity: 'warning' | 'error';
}

/**
 * Post-build smoke test that validates generated code for common issues.
 * Runs automatically after every AI generation to catch bugs before the user sees them.
 */
export function usePostBuildSmokeTest(
  addBuildLogEntry: (type: BuildLogEntry['type'], message: string) => void,
) {
  const runSmokeTest = useCallback((files: ProjectFile[]): SmokeTestResult => {
    const warnings: SmokeWarning[] = [];
    const errors: SmokeWarning[] = [];

    for (const file of files) {
      const ext = file.path.split('.').pop()?.toLowerCase() || '';
      if (!['html', 'js', 'ts', 'jsx', 'tsx', 'css'].includes(ext)) continue;

      const lines = file.content.split('\n');

      // --- JS/TS checks ---
      if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) {
        // 1. Undefined references: addEventListener on non-existent querySelector
        const querySelectorCalls = file.content.match(/querySelector\(['"`]([^'"`]+)['"`]\)/g);
        if (querySelectorCalls) {
          for (const call of querySelectorCalls) {
            const selector = call.match(/querySelector\(['"`]([^'"`]+)['"`]\)/)?.[1];
            if (selector?.startsWith('#')) {
              const id = selector.slice(1);
              const htmlFile = files.find(f => f.path.endsWith('.html'));
              if (htmlFile && !htmlFile.content.includes(`id="${id}"`) && !htmlFile.content.includes(`id='${id}'`)) {
                errors.push({ file: file.path, message: `querySelector references #${id} but no element with that ID found in HTML`, severity: 'error' });
              }
            }
          }
        }

        // 2. Duplicate function declarations
        const funcDecls = new Map<string, number>();
        lines.forEach((line, i) => {
          const match = line.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*(?:=\s*(?:\(|function)|\()/);
          if (match) {
            const name = match[1];
            if (funcDecls.has(name)) {
              warnings.push({ file: file.path, line: i + 1, message: `Duplicate declaration: "${name}" (also at line ${funcDecls.get(name)})`, severity: 'warning' });
            }
            funcDecls.set(name, i + 1);
          }
        });

        // 3. innerHTML with event listeners (common anti-pattern)
        if (file.content.includes('innerHTML') && file.content.includes('addEventListener')) {
          warnings.push({ file: file.path, message: 'Uses innerHTML with addEventListener — listeners on replaced elements will be lost', severity: 'warning' });
        }

        // 4. .splice() mutation without re-assignment (common state bug)
        const spliceMatches = file.content.match(/\.\s*splice\s*\(/g);
        if (spliceMatches && spliceMatches.length > 0) {
          if (!file.content.includes('[...') && !file.content.includes('.filter(') && !file.content.includes('Array.from')) {
            warnings.push({ file: file.path, message: 'Uses .splice() without immutable copy — may cause state sync issues', severity: 'warning' });
          }
        }

        // 5. localStorage key mismatches within the same project
        const setMatches = [...file.content.matchAll(/localStorage\.setItem\(['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
        const getMatches = [...file.content.matchAll(/localStorage\.getItem\(['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
        // Collect all keys across all files later
        if (setMatches.length > 0 || getMatches.length > 0) {
          // Will be checked in cross-file pass below
        }

        // 6. console.log left in code (info only)
        const consoleCount = (file.content.match(/console\.log\(/g) || []).length;
        if (consoleCount > 5) {
          warnings.push({ file: file.path, message: `${consoleCount} console.log() calls — consider cleaning up`, severity: 'warning' });
        }
      }

      // --- HTML checks ---
      if (ext === 'html' || ext === 'htm') {
        // 7. Script tags referencing files that don't exist
        const scriptSrcs = [...file.content.matchAll(/<script[^>]+src=['"]([^'"]+)['"]/g)].map(m => m[1]);
        for (const src of scriptSrcs) {
          if (src.startsWith('http') || src.startsWith('//')) continue;
          const normalized = src.startsWith('./') ? src.slice(2) : src;
          if (!files.some(f => f.path === normalized || f.path.endsWith('/' + normalized))) {
            errors.push({ file: file.path, message: `<script src="${src}"> references missing file`, severity: 'error' });
          }
        }

        // 8. Link tags referencing missing CSS
        const linkHrefs = [...file.content.matchAll(/<link[^>]+href=['"]([^'"]+\.css)['"]/g)].map(m => m[1]);
        for (const href of linkHrefs) {
          if (href.startsWith('http') || href.startsWith('//')) continue;
          const normalized = href.startsWith('./') ? href.slice(2) : href;
          if (!files.some(f => f.path === normalized || f.path.endsWith('/' + normalized))) {
            errors.push({ file: file.path, message: `<link href="${href}"> references missing CSS file`, severity: 'error' });
          }
        }

        // 9. Buttons without click handlers or type
        const buttonCount = (file.content.match(/<button\b/g) || []).length;
        const handlerCount = (file.content.match(/onclick|addEventListener|@click/gi) || []).length;
        if (buttonCount > 0 && handlerCount === 0 && !files.some(f => f.path.endsWith('.js') || f.path.endsWith('.ts'))) {
          warnings.push({ file: file.path, message: `${buttonCount} button(s) with no event handlers found`, severity: 'warning' });
        }
      }

      // --- CSS checks ---
      if (ext === 'css' || ext === 'scss') {
        // 10. Empty rule blocks
        const emptyRules = file.content.match(/\{[\s]*\}/g);
        if (emptyRules && emptyRules.length > 2) {
          warnings.push({ file: file.path, message: `${emptyRules.length} empty CSS rule blocks`, severity: 'warning' });
        }
      }
    }

    // Cross-file localStorage key validation
    const allSetKeys = new Set<string>();
    const allGetKeys = new Set<string>();
    for (const file of files) {
      [...file.content.matchAll(/localStorage\.setItem\(['"`]([^'"`]+)['"`]/g)].forEach(m => allSetKeys.add(m[1]));
      [...file.content.matchAll(/localStorage\.getItem\(['"`]([^'"`]+)['"`]/g)].forEach(m => allGetKeys.add(m[1]));
    }
    for (const key of allGetKeys) {
      if (!allSetKeys.has(key)) {
        warnings.push({ file: '(cross-file)', message: `localStorage.getItem("${key}") used but never set in any file`, severity: 'warning' });
      }
    }

    // Cross-file import validation — detect imports referencing non-existent project files
    const projectPaths = new Set(files.map(f => f.path));
    for (const file of files) {
      const ext = file.path.split('.').pop()?.toLowerCase() || '';
      if (!['js', 'ts', 'jsx', 'tsx'].includes(ext)) continue;

      // Match relative imports: from './Foo' or from '../components/Bar'
      const relativeImports = [...file.content.matchAll(/from\s+['"](\.[^'"]+)['"]/g)];
      for (const match of relativeImports) {
        const importPath = match[1];
        // Skip CSS/asset imports
        if (/\.(css|scss|png|jpg|svg|json)$/.test(importPath)) continue;

        // Resolve relative to file's directory
        const fileDir = file.path.includes('/') ? file.path.replace(/\/[^/]+$/, '') : '';
        const resolved = resolveRelativePath(fileDir, importPath);

        // Check with common extensions
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
        const found = extensions.some(ext => projectPaths.has(resolved + ext));
        if (!found) {
          warnings.push({
            file: file.path,
            message: `Import "${importPath}" does not match any project file`,
            severity: 'warning',
          });
        }
      }

      // Match alias imports: from '@/components/Foo'
      const aliasImports = [...file.content.matchAll(/from\s+['"]@\/([^'"]+)['"]/g)];
      for (const match of aliasImports) {
        const aliasPath = 'src/' + match[1];
        if (/\.(css|scss|png|jpg|svg|json)$/.test(aliasPath)) continue;
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
        const found = extensions.some(ext => projectPaths.has(aliasPath + ext));
        if (!found) {
          // Only warn if there are enough files to make this meaningful (>5)
          if (files.length > 5) {
            warnings.push({
              file: file.path,
              message: `Import "@/${match[1]}" does not match any project file`,
              severity: 'warning',
            });
          }
        }
      }
    }

    // Log results
    const total = warnings.length + errors.length;
    if (total === 0) {
      addBuildLogEntry('success', '🧪 Smoke test passed — no issues detected');
    } else {
      if (errors.length > 0) {
        addBuildLogEntry('error', `🧪 Smoke test: ${errors.length} error(s) found`);
        errors.slice(0, 3).forEach(e => addBuildLogEntry('error', `  ✗ ${e.file}: ${e.message}`));
      }
      if (warnings.length > 0) {
        addBuildLogEntry('warning' as any, `🧪 Smoke test: ${warnings.length} warning(s)`);
        warnings.slice(0, 3).forEach(w => addBuildLogEntry('info', `  ⚠ ${w.file}: ${w.message}`));
      }
    }

    return { passed: errors.length === 0, warnings, errors };
  }, [addBuildLogEntry]);

  return { runSmokeTest };
}
