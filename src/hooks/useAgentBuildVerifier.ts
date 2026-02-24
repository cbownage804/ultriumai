import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface BuildError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface BuildResult {
  success: boolean;
  errors: BuildError[];
  warnings: BuildError[];
  duration: number;
}

/**
 * Runs esbuild-wasm compilation against modified files to catch
 * TypeScript/syntax errors before the preview renders.
 */
export function useAgentBuildVerifier() {
  const esbuildRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<any> | null>(null);

  const initEsbuild = useCallback(async () => {
    if (esbuildRef.current) return esbuildRef.current;
    if (initPromiseRef.current) return initPromiseRef.current;

    initPromiseRef.current = (async () => {
      try {
        const esbuild = await import('esbuild-wasm');
        await esbuild.initialize({
          wasmURL: 'https://unpkg.com/esbuild-wasm@0.27.3/esbuild.wasm',
        });
        esbuildRef.current = esbuild;
        return esbuild;
      } catch (err) {
        console.warn('[build-verifier] esbuild init failed:', err);
        initPromiseRef.current = null;
        return null;
      }
    })();

    return initPromiseRef.current;
  }, []);

  const verifyBuild = useCallback(async (
    modifiedFiles: ProjectFile[],
    allFiles: ProjectFile[],
  ): Promise<BuildResult> => {
    const start = performance.now();
    const errors: BuildError[] = [];
    const warnings: BuildError[] = [];

    const tsFiles = modifiedFiles.filter(f =>
      /\.(ts|tsx|js|jsx)$/.test(f.path)
    );

    if (tsFiles.length === 0) {
      return { success: true, errors: [], warnings: [], duration: 0 };
    }

    const esbuild = await initEsbuild();
    if (!esbuild) {
      // Fallback: basic syntax check via regex
      for (const file of tsFiles) {
        const syntaxErrors = basicSyntaxCheck(file);
        errors.push(...syntaxErrors);
      }
      return {
        success: errors.length === 0,
        errors,
        warnings,
        duration: performance.now() - start,
      };
    }

    // Build a virtual file system for esbuild
    const virtualFS: Record<string, string> = {};
    allFiles.forEach(f => { virtualFS[f.path] = f.content; });

    for (const file of tsFiles) {
      try {
        await esbuild.transform(file.content, {
          loader: file.path.endsWith('.tsx') ? 'tsx' :
                  file.path.endsWith('.ts') ? 'ts' :
                  file.path.endsWith('.jsx') ? 'jsx' : 'js',
          jsx: 'automatic',
          target: 'es2020',
        });
      } catch (err: any) {
        const esbuildErrors = err.errors || [];
        const esbuildWarnings = err.warnings || [];

        for (const e of esbuildErrors) {
          errors.push({
            file: file.path,
            line: e.location?.line,
            column: e.location?.column,
            message: e.text || String(e),
            severity: 'error',
          });
        }
        for (const w of esbuildWarnings) {
          warnings.push({
            file: file.path,
            line: w.location?.line,
            column: w.location?.column,
            message: w.text || String(w),
            severity: 'warning',
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
      duration: performance.now() - start,
    };
  }, [initEsbuild]);

  return { verifyBuild };
}

/**
 * Basic syntax checks when esbuild is unavailable.
 */
function basicSyntaxCheck(file: ProjectFile): BuildError[] {
  const errors: BuildError[] = [];
  const content = file.content;

  // Check balanced braces/brackets/parens
  const opens = { '{': 0, '[': 0, '(': 0 };
  const closeMap: Record<string, keyof typeof opens> = { '}': '{', ']': '[', ')': '(' };
  
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inLineComment = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inComment) {
      if (ch === '*' && next === '/') { inComment = false; i++; }
      continue;
    }
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === stringChar) inString = false;
      continue;
    }

    if (ch === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { inComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inString = true; stringChar = ch; continue; }

    if (ch in opens) opens[ch as keyof typeof opens]++;
    if (ch in closeMap) opens[closeMap[ch]]--;
  }

  for (const [bracket, count] of Object.entries(opens)) {
    if (count !== 0) {
      errors.push({
        file: file.path,
        message: `Unbalanced '${bracket}': ${count > 0 ? `${count} unclosed` : `${-count} extra closing`}`,
        severity: 'error',
      });
    }
  }

  return errors;
}
