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

  if (!data || !data.html) {
    throw new Error('Vite sandbox returned empty result');
  }

  if (hasUnmappedBareImportsInModuleScripts(data.html)) {
    throw new Error('Vite sandbox returned unresolved bare imports');
  }

  console.info('[ViteSandbox] ✅ Compiled via real Vite in', Date.now() - t0, 'ms, HTML:', data.html.length, 'chars');

  return {
    html: data.html,
    isReactProject: true,
    componentCount: data.componentCount || 0,
    errors: data.errors || [],
  };
}

export function useWorkerCompiler() {
  /** AbortController for the currently in-flight compile */
  const activeAbortRef = useRef<AbortController | null>(null);

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
    // Abort any prior in-flight compilation
    if (activeAbortRef.current) {
      console.info('[Compiler] Aborting prior in-flight compilation');
      activeAbortRef.current.abort();
    }
    const ac = new AbortController();
    activeAbortRef.current = ac;
    const { signal } = ac;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.info(`[Compiler] 🔄 Retry attempt ${attempt}/${MAX_TRANSIENT_RETRIES}`);
          // Brief backoff before retry
          await new Promise(r => setTimeout(r, 1000 * attempt));
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        }

        console.info('[Compiler] ⏱ Compiling via Vite Sandbox', { fileCount: files.length, attempt });
        const result = await Promise.race([
          compileViaViteSandbox(files, options, signal),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Vite sandbox timeout (${VITE_TIMEOUT_MS / 1000}s)`)), VITE_TIMEOUT_MS)
          ),
        ]);
        console.info('[Compiler] ✅ Vite Sandbox compiled:', result.html?.length, 'chars');
        return result;
      } catch (err: any) {
        if (signal.aborted && ac !== activeAbortRef.current) {
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
  }, []);

  /** Abort any in-flight compilation */
  const abortCompilation = useCallback(() => {
    if (activeAbortRef.current) {
      console.info('[Compiler] abortCompilation called — cancelling in-flight requests');
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }
  }, []);

  return { compileReactProject, abortCompilation };
}
