import { useCallback, useRef, useState } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface ValidationDiagnostic {
  id: string;
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
  source: string;
}

export interface ValidationResult {
  diagnostics: ValidationDiagnostic[];
  errorCount: number;
  warningCount: number;
  isValid: boolean;
  validationTimeMs: number;
}

/**
 * TypeScript Validation Layer: Performs static analysis on project files
 * before preview rendering. Catches common errors that would crash at runtime.
 *
 * This performs lightweight pattern-based validation (not full TS compiler)
 * optimized for the in-browser VFS environment.
 */
export function useTypeScriptValidator() {
  const [lastResult, setLastResult] = useState<ValidationResult | null>(null);
  const fileIndexRef = useRef<Map<string, Set<string>>>(new Map());

  /**
   * Build an index of exported symbols across all files.
   */
  const buildExportIndex = useCallback((files: ProjectFile[]) => {
    const index = new Map<string, Set<string>>();

    for (const file of files) {
      if (file.language !== 'javascript' && file.language !== 'typescript') continue;
      const symbols = new Set<string>();

      // Named exports
      const patterns = [
        /export\s+(?:function|const|let|var|class|async\s+function)\s+(\w+)/g,
        /export\s+default\s+(?:function|class|async\s+function)?\s*(\w+)/g,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(file.content)) !== null) {
          if (match[1]) symbols.add(match[1]);
        }
      }

      // Re-exports
      const reExportPattern = /export\s*\{\s*([^}]+)\s*\}/g;
      let match;
      while ((match = reExportPattern.exec(file.content)) !== null) {
        const names = match[1].split(',').map(n =>
          n.trim().split(/\s+as\s+/).pop()?.trim()
        ).filter(Boolean) as string[];
        names.forEach(n => symbols.add(n));
      }

      index.set(file.path, symbols);
    }

    fileIndexRef.current = index;
    return index;
  }, []);

  /**
   * Validate all project files for common issues.
   */
  const validate = useCallback((files: ProjectFile[]): ValidationResult => {
    const startTime = performance.now();
    const diagnostics: ValidationDiagnostic[] = [];
    const exportIndex = buildExportIndex(files);
    const fileMap = new Map(files.map(f => [f.path, f]));

    for (const file of files) {
      if (file.language !== 'javascript' && file.language !== 'typescript') continue;

      const lines = file.content.split('\n');

      // === Check 1: Unresolved imports ===
      const importRegex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const specifier = match[1];
        // Only check relative imports
        if (specifier.startsWith('.') || specifier.startsWith('/')) {
          const resolved = resolveImportPath(specifier, file.path, fileMap);
          if (!resolved) {
            const line = file.content.slice(0, match.index).split('\n').length;
            diagnostics.push({
              id: crypto.randomUUID(),
              file: file.path,
              line,
              column: 0,
              message: `Cannot find module '${specifier}'`,
              severity: 'error',
              code: 'TS2307',
              source: 'ts-validator',
            });
          }
        }
      }

      // === Check 2: Undefined references to imported names ===
      const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
      while ((match = namedImportRegex.exec(file.content)) !== null) {
        const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]?.trim()).filter(Boolean);
        const specifier = match[2];

        if (specifier.startsWith('.') || specifier.startsWith('/')) {
          const resolved = resolveImportPath(specifier, file.path, fileMap);
          if (resolved) {
            const targetExports = exportIndex.get(resolved);
            if (targetExports) {
              for (const name of names) {
                if (name === 'type' || name.startsWith('type ')) continue; // Skip type imports
                const cleanName = name.replace(/^type\s+/, '');
                if (!targetExports.has(cleanName)) {
                  const line = file.content.slice(0, match.index).split('\n').length;
                  diagnostics.push({
                    id: crypto.randomUUID(),
                    file: file.path,
                    line,
                    column: 0,
                    message: `Module '${specifier}' has no exported member '${cleanName}'`,
                    severity: 'warning',
                    code: 'TS2305',
                    source: 'ts-validator',
                  });
                }
              }
            }
          }
        }
      }

      // === Check 3: Common syntax errors ===
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detect unclosed template literals (basic check)
        const backtickCount = (trimmed.match(/(?<!\\)`/g) || []).length;
        if (backtickCount % 2 !== 0) {
          // Could be multi-line — check if any subsequent line closes it
          let closed = false;
          for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
            const nextBackticks = (lines[j].match(/(?<!\\)`/g) || []).length;
            if (nextBackticks > 0) { closed = true; break; }
          }
          if (!closed) {
            diagnostics.push({
              id: crypto.randomUUID(),
              file: file.path,
              line: i + 1,
              column: 0,
              message: 'Potentially unclosed template literal',
              severity: 'warning',
              code: 'SYNTAX',
              source: 'ts-validator',
            });
          }
        }

        // Detect console.log statements (info level)
        if (/\bconsole\.log\b/.test(trimmed) && !trimmed.startsWith('//')) {
          diagnostics.push({
            id: crypto.randomUUID(),
            file: file.path,
            line: i + 1,
            column: line.indexOf('console.log'),
            message: 'console.log statement detected — consider removing for production',
            severity: 'info',
            code: 'NO_CONSOLE',
            source: 'ts-validator',
          });
        }

        // Detect potential null reference: accessing property without optional chaining
        // on a variable that was declared with possible null/undefined
        if (/\w+\.\w+/.test(trimmed) && /(?:null|undefined)/.test(trimmed)) {
          // Simple heuristic — don't flag if already using optional chaining
          if (!trimmed.includes('?.') && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
            diagnostics.push({
              id: crypto.randomUUID(),
              file: file.path,
              line: i + 1,
              column: 0,
              message: 'Possible null reference — consider using optional chaining (?.) ',
              severity: 'info',
              code: 'NULL_REF',
              source: 'ts-validator',
            });
          }
        }
      }

      // === Check 4: Duplicate function/variable declarations ===
      const declRegex = /(?:function|const|let|var|class)\s+(\w+)/g;
      const declarations = new Map<string, number[]>();
      while ((match = declRegex.exec(file.content)) !== null) {
        const name = match[1];
        const line = file.content.slice(0, match.index).split('\n').length;
        if (!declarations.has(name)) declarations.set(name, []);
        declarations.get(name)!.push(line);
      }

      for (const [name, lines_arr] of declarations) {
        if (lines_arr.length > 1 && !['i', 'j', 'k', 'e', 'err', 'error', 'match', 'result'].includes(name)) {
          diagnostics.push({
            id: crypto.randomUUID(),
            file: file.path,
            line: lines_arr[1],
            column: 0,
            message: `Duplicate identifier '${name}' (first declared at line ${lines_arr[0]})`,
            severity: 'warning',
            code: 'TS2300',
            source: 'ts-validator',
          });
        }
      }
    }

    const result: ValidationResult = {
      diagnostics,
      errorCount: diagnostics.filter(d => d.severity === 'error').length,
      warningCount: diagnostics.filter(d => d.severity === 'warning').length,
      isValid: diagnostics.filter(d => d.severity === 'error').length === 0,
      validationTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
    };

    setLastResult(result);
    return result;
  }, [buildExportIndex]);

  /**
   * Quick validation — only checks for critical errors, skipping info diagnostics.
   * Used during streaming to give fast feedback.
   */
  const quickValidate = useCallback((files: ProjectFile[]): boolean => {
    const fileMap = new Map(files.map(f => [f.path, f]));

    for (const file of files) {
      if (file.language !== 'javascript' && file.language !== 'typescript') continue;

      // Check bracket balance
      let braces = 0, parens = 0, brackets = 0;
      let inString = false;
      let stringChar = '';

      for (let i = 0; i < file.content.length; i++) {
        const ch = file.content[i];
        if (inString) {
          if (ch === '\\') { i++; continue; }
          if (ch === stringChar) inString = false;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') { inString = true; stringChar = ch; continue; }
        if (ch === '{') braces++;
        if (ch === '}') braces--;
        if (ch === '(') parens++;
        if (ch === ')') parens--;
        if (ch === '[') brackets++;
        if (ch === ']') brackets--;
      }

      if (braces !== 0 || parens !== 0 || brackets !== 0) return false;
    }

    return true;
  }, []);

  return {
    validate,
    quickValidate,
    lastResult,
  };
}

// === Utility ===

function resolveImportPath(
  specifier: string,
  fromPath: string,
  fileMap: Map<string, ProjectFile>,
): string | null {
  const fromDir = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : '';
  let resolved = specifier;

  if (specifier.startsWith('./')) {
    resolved = fromDir ? `${fromDir}/${specifier.slice(2)}` : specifier.slice(2);
  } else if (specifier.startsWith('../')) {
    const parts = fromDir.split('/');
    let spec = specifier;
    while (spec.startsWith('../')) { parts.pop(); spec = spec.slice(3); }
    resolved = parts.length > 0 ? `${parts.join('/')}/${spec}` : spec;
  }

  if (fileMap.has(resolved)) return resolved;
  for (const ext of ['.js', '.ts', '.jsx', '.tsx']) {
    if (fileMap.has(resolved + ext)) return resolved + ext;
  }
  return null;
}
