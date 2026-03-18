/**
 * useWorkerCompiler — Hook that compiles projects via server-side Vite Sandbox.
 * 
 * SINGLE PATH: Calls the `compile-vite` edge function → Vite Sandbox droplet.
 * On failure: returns a clear error. No browser fallbacks.
 */

import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import type { CDNPackageEntry } from '@/workers/packageData';
import { supabase } from '@/integrations/supabase/client';

export interface WorkerCompilerResult {
  html: string;
  isReactProject: boolean;
  componentCount: number;
  errors: string[];
  errorMessage?: string;
}

const VITE_TIMEOUT_MS = 25_000; // Single path — generous but bounded
const MAX_TRANSIENT_RETRIES = 1; // Retry once on transient failures

function isTransientError(err: Error): boolean {
  const msg = err.message?.toLowerCase() || '';
  return (
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('failed to fetch') ||
    msg.includes('unavailable') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('econnrefused')
  );
}

function hasUnmappedBareImportsInModuleScripts(html: string): boolean {
  const hasImportMap = /<script\b[^>]*type\s*=\s*["']importmap["'][^>]*>/i.test(html);
  if (hasImportMap) return false;

  const moduleScriptRegex = /<script\b[^>]*type\s*=\s*["']module["'][^>]*>([\s\S]*?)<\/script>/gi;
  const staticBareImportRegex = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"./][^'"]*)['"]/;
  const dynamicBareImportRegex = /\bimport\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/;

  let match: RegExpExecArray | null;
  while ((match = moduleScriptRegex.exec(html)) !== null) {
    const moduleCode = match[1] || '';
    if (staticBareImportRegex.test(moduleCode) || dynamicBareImportRegex.test(moduleCode)) {
      return true;
    }
  }

  return false;
}

// ── Vite Sandbox compilation (true Vite on Droplet) ──
async function compileViaViteSandbox(
  files: ProjectFile[],
  options?: {
    supabaseConfig?: { url: string; anonKey: string } | null;
    stripeConfig?: { publishableKey: string } | null;
    envVars?: { key: string; value: string }[];
    userPackages?: CDNPackageEntry[];
  },
  signal?: AbortSignal,
): Promise<WorkerCompilerResult> {
  const t0 = Date.now();
  console.info('[ViteSandbox] Calling compile-vite edge function with', files.length, 'files');

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const { data, error } = await supabase.functions.invoke('compile-vite', {
    body: {
      files: files.map(f => ({ path: f.path, content: f.content, language: f.language })),
      options: options ? {
        supabaseConfig: options.supabaseConfig || undefined,
        stripeConfig: options.stripeConfig || undefined,
        envVars: options.envVars,
        userPackages: options.userPackages,
      } : undefined,
    },
  });

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  if (error) {
    throw new Error(`Vite sandbox error: ${error.message}`);
  }

  if (data?.fallback) {
    throw new Error(data.error || 'Vite sandbox unavailable');
  }

  const sandboxErrors = Array.isArray(data?.errors)
    ? data.errors.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
    : [];
  
  // Extract actionable error messages from esbuild crash logs
  // esbuild crashes produce `failureErrorWithLog` with the real error buried in the log
  const processedErrors = sandboxErrors.map(extractActionableError);
  
  const html = typeof data?.html === 'string' ? data.html : '';

  if (!html) {
    if (processedErrors.length > 0) {
      return {
        html: '',
        isReactProject: true,
        componentCount: data?.componentCount || 0,
        errors: processedErrors,
        errorMessage: processedErrors[0],
      };
    }

    throw new Error('Vite sandbox returned empty result');
  }

  if (hasUnmappedBareImportsInModuleScripts(html)) {
    throw new Error('Vite sandbox returned unresolved bare imports');
  }

  console.info('[ViteSandbox] ✅ Compiled via real Vite in', Date.now() - t0, 'ms, HTML:', html.length, 'chars');

  return {
    html,
    isReactProject: true,
    componentCount: data.componentCount || 0,
    errors: processedErrors,
  };
}

/**
 * Extract actionable error info from raw esbuild crash logs.
 * esbuild's `failureErrorWithLog` wraps the real error in a verbose log.
 * This extracts the relevant file:line:col + message for auto-heal.
 */
function extractActionableError(raw: string): string {
  // Pattern: "ERROR: ... in src/file.tsx:line:col" buried in crash log
  const esbuildErrorMatch = raw.match(/ERROR:\s*(.+?)(?:\n|$)/i);
  if (esbuildErrorMatch) {
    const errorLine = esbuildErrorMatch[1].trim();
    // Also extract file location if present
    const locMatch = raw.match(/([\w/.-]+\.(?:tsx?|jsx?)):(\d+):(\d+)/);
    if (locMatch) {
      return `${locMatch[1]}:${locMatch[2]}:${locMatch[3]} - error: ${errorLine}`;
    }
    return errorLine;
  }

  // Pattern: "Transform failed with X error(s):" — extract first error line after it
  const transformMatch = raw.match(/Transform failed[\s\S]*?\n\s*>\s*\d+\s*\|(.+)/);
  if (transformMatch) {
    const locMatch = raw.match(/([\w/.-]+\.(?:tsx?|jsx?)):(\d+):(\d+)/);
    const snippet = transformMatch[1].trim();
    if (locMatch) {
      return `${locMatch[1]}:${locMatch[2]}:${locMatch[3]} - error: Syntax error near: ${snippet}`;
    }
    return `Syntax error near: ${snippet}`;
  }

  // Pattern: stack traces with "failureErrorWithLog" — extract the message before the stack
  const failureMatch = raw.match(/^(.+?)(?:\n\s+at\s)/s);
  if (failureMatch && failureMatch[1].length < 500) {
    return failureMatch[1].trim();
  }

  // Truncate excessively long error messages (crash logs can be huge)
  if (raw.length > 500) {
    return raw.slice(0, 500) + '…';
  }

  return raw;
}

export function useWorkerCompiler() {
  /** AbortController for the primary compile lane */
  const activeAbortRef = useRef<AbortController | null>(null);
  /** AbortController for best-effort local/streaming compiles */
  const localAbortRef = useRef<AbortController | null>(null);

  /**
   * Single compilation path — Vite Sandbox only.
   * On failure: throws with a descriptive error. No fallbacks.
   */
  const compileReactProject = useCallback(async (
    files: ProjectFile[],
    options?: {
      supabaseConfig?: { url: string; anonKey: string } | null;
      stripeConfig?: { publishableKey: string } | null;
      envVars?: { key: string; value: string }[];
      userPackages?: CDNPackageEntry[];
      localOnly?: boolean;
    }
  ): Promise<WorkerCompilerResult> => {
    const useLocalLane = options?.localOnly === true;
    const abortRef = useLocalLane ? localAbortRef : activeAbortRef;

    // Abort only prior work on the same lane.
    if (abortRef.current) {
      console.info('[Compiler] Aborting prior in-flight compilation', { lane: useLocalLane ? 'local' : 'primary' });
      abortRef.current.abort();
    }
    const ac = new AbortController();
    abortRef.current = ac;
    const { signal } = ac;

    let lastError: Error | null = null;

    try {
      for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            console.info(`[Compiler] 🔄 Retry attempt ${attempt}/${MAX_TRANSIENT_RETRIES}`);
            // Brief backoff before retry
            await new Promise(r => setTimeout(r, 1000 * attempt));
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
          }

          console.info('[Compiler] ⏱ Compiling via Vite Sandbox', {
            fileCount: files.length,
            attempt,
            lane: useLocalLane ? 'local' : 'primary',
          });
          const result = await Promise.race([
            compileViaViteSandbox(files, options, signal),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Vite sandbox timeout (${VITE_TIMEOUT_MS / 1000}s)`)), VITE_TIMEOUT_MS)
            ),
          ]);
          console.info('[Compiler] ✅ Vite Sandbox compiled:', result.html?.length, 'chars');
          return result;
        } catch (err: any) {
          if (signal.aborted && ac !== abortRef.current) {
            throw new DOMException('Aborted', 'AbortError');
          }
          lastError = err instanceof Error ? err : new Error(String(err));

          // Only retry on transient errors
          if (attempt < MAX_TRANSIENT_RETRIES && isTransientError(lastError)) {
            console.warn(`[Compiler] ⚠️ Transient failure (attempt ${attempt + 1}):`, lastError.message);
            continue;
          }
          break;
        }
      }

      const message = lastError?.message || 'Unknown compilation error';
      console.error('[Compiler] ❌ Compilation failed after retries:', message);
      throw new Error(`Compilation failed: ${message}`);
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null;
      }
    }
  }, []);

  /** Lock to prevent spurious aborts during critical post-generation compiles */
  const compileLockRef = useRef(false);

  /** Lock compilation — prevents abortCompilation from cancelling in-flight work */
  const lockCompile = useCallback(() => { compileLockRef.current = true; }, []);
  /** Unlock compilation */
  const unlockCompile = useCallback(() => { compileLockRef.current = false; }, []);

  /** Abort any in-flight compilation (skipped if compile is locked) */
  const abortCompilation = useCallback((force = false) => {
    if (compileLockRef.current && !force) {
      console.info('[Compiler] abortCompilation SKIPPED — compile is locked (post-generation critical path)');
      return;
    }
    if (activeAbortRef.current) {
      console.info('[Compiler] abortCompilation called — cancelling primary in-flight requests');
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }
    if (localAbortRef.current) {
      console.info('[Compiler] abortCompilation called — cancelling local in-flight requests');
      localAbortRef.current.abort();
      localAbortRef.current = null;
    }
  }, []);

  return { compileReactProject, abortCompilation };
}
