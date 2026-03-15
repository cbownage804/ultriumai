/**
 * useWorkerCompiler — Hook that compiles projects via server-side Edge Function.
 * 
 * PRIMARY PATH: Calls the `compile-vite` edge function → Vite Sandbox droplet.
 * 
 * FALLBACK: If the Vite Sandbox fails (network error, timeout, 503), falls back
 * to the in-browser Web Worker compiler for a degraded but functional preview.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import type { CDNPackageEntry } from '@/workers/packageData';
import type { CompileRequest, CompileResponse, CompileErrorResponse, WorkerResponse } from '@/workers/compiler.worker';
import { supabase } from '@/integrations/supabase/client';

export interface WorkerCompilerResult {
  html: string;
  isReactProject: boolean;
  componentCount: number;
  errors: string[];
}

// ── Shared Worker for fallback ──
let workerInstance: Worker | null = null;
let workerRefCount = 0;

function getSharedWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('../workers/compiler.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  workerRefCount++;
  return workerInstance;
}

let releaseTimer: ReturnType<typeof setTimeout> | null = null;

function releaseSharedWorker() {
  workerRefCount--;
  if (workerRefCount <= 0) {
    releaseTimer = setTimeout(() => {
      if (workerRefCount <= 0 && workerInstance) {
        workerInstance.terminate();
        workerInstance = null;
        workerRefCount = 0;
      }
    }, 2000);
  }
}

function getSharedWorkerSafe(): Worker {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  return getSharedWorker();
}

// ── Health check cache ──
let lastHealthCheck: { ok: boolean; ts: number } | null = null;
const HEALTH_CACHE_TTL_MS = 30_000;
const DEFAULT_WORKER_REQUEST_TIMEOUT_MS = 35_000;
const EDGE_FALLBACK_TIMEOUT_MS = 20_000;

async function isSandboxHealthy(): Promise<boolean> {
  // Return cached result if fresh
  if (lastHealthCheck && Date.now() - lastHealthCheck.ts < HEALTH_CACHE_TTL_MS) {
    return lastHealthCheck.ok;
  }

  // Default to healthy — let the actual compile attempt be the real test.
  // OPTIONS preflight to Supabase edge functions is unreliable (CORS blocks).
  lastHealthCheck = { ok: true, ts: Date.now() };
  return true;
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

  // Check if already aborted before starting
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

  // Check abort after network completes — discard stale results
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  if (error) {
    throw new Error(`Vite sandbox error: ${error.message}`);
  }

  // If sandbox returned fallback flag, throw to trigger fallback path
  if (data?.fallback) {
    throw new Error(data.error || 'Vite sandbox unavailable — falling back');
  }

  if (!data || !data.html) {
    throw new Error('Vite sandbox returned empty result');
  }

  if (hasUnmappedBareImportsInModuleScripts(data.html)) {
    throw new Error('Vite sandbox returned unresolved bare imports — falling back');
  }

  console.info('[ViteSandbox] ✅ Compiled via real Vite in', Date.now() - t0, 'ms, HTML:', data.html.length, 'chars');

  return {
    html: data.html,
    isReactProject: true,
    componentCount: data.componentCount || 0,
    errors: data.errors || [],
  };
}

// ── Legacy server-side compilation (esbuild edge function) ──
async function compileViaEdgeFunction(
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
  console.info('[ServerCompiler] Calling compile-project edge function with', files.length, 'files');

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const { data, error } = await supabase.functions.invoke('compile-project', {
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
    throw new Error(`Edge function error: ${error.message}`);
  }

  if (!data || !data.html) {
    throw new Error('Edge function returned empty result');
  }

  console.info('[ServerCompiler] Compiled in', Date.now() - t0, 'ms, HTML:', data.html.length, 'chars');

  return {
    html: data.html,
    isReactProject: true,
    componentCount: data.componentCount || 0,
    errors: data.errors || [],
  };
}

export function useWorkerCompiler() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, { resolve: (r: WorkerCompilerResult) => void; reject: (e: Error) => void }>>(new Map());
  /** AbortController for the currently in-flight compile — aborted when a new compile starts */
  const activeAbortRef = useRef<AbortController | null>(null);

  const rejectAllPending = useCallback((reason: string) => {
    if (pendingRef.current.size === 0) return;
    const err = new Error(reason);
    for (const [, { reject }] of pendingRef.current) {
      reject(err);
    }
    pendingRef.current.clear();
  }, []);

  useEffect(() => {
    const worker = getSharedWorkerSafe();
    workerRef.current = worker;

    const handleWorkerMessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === 'compile-result') {
        const pending = pendingRef.current.get(msg.id);
        if (pending) {
          pendingRef.current.delete(msg.id);
          pending.resolve({
            html: msg.html,
            isReactProject: msg.isReactProject,
            componentCount: msg.componentCount,
            errors: msg.errors,
          });
        }
      } else if (msg.type === 'compile-error') {
        const pending = pendingRef.current.get(msg.id);
        if (pending) {
          pendingRef.current.delete(msg.id);
          pending.reject(new Error(msg.error));
        }
      }
    };

    const handleWorkerError = (e: ErrorEvent) => {
      const message = e.message || 'Unknown worker crash';
      console.error('[WorkerCompiler] Worker error:', message);
      rejectAllPending(`Worker crashed: ${message}`);
    };

    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', handleWorkerError);

    return () => {
      worker.removeEventListener('message', handleWorkerMessage);
      worker.removeEventListener('error', handleWorkerError);
      rejectAllPending('Worker compiler unmounted');
      activeAbortRef.current?.abort();
      releaseSharedWorker();
      workerRef.current = null;
    };
  }, [rejectAllPending]);

  const compileViaWorker = useCallback(async (
    files: ProjectFile[],
    options?: {
      supabaseConfig?: { url: string; anonKey: string } | null;
      stripeConfig?: { publishableKey: string } | null;
      envVars?: { key: string; value: string }[];
      userPackages?: CDNPackageEntry[];
    },
    timeoutMs: number = DEFAULT_WORKER_REQUEST_TIMEOUT_MS,
  ): Promise<WorkerCompilerResult> => {
    const worker = workerRef.current;
    if (!worker) {
      throw new Error('Compiler worker not initialized');
    }

    const id = `compile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return new Promise<WorkerCompilerResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const pending = pendingRef.current.get(id);
        if (!pending) return;
        pendingRef.current.delete(id);
        reject(new Error(`Worker compile request timeout (${Math.round(timeoutMs / 1000)}s)`));
      }, timeoutMs);

      pendingRef.current.set(id, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });

      const request: CompileRequest = {
        type: 'compile',
        id,
        files,
        options: options ? {
          supabaseConfig: options.supabaseConfig || undefined,
          stripeConfig: options.stripeConfig || undefined,
          envVars: options.envVars,
          userPackages: options.userPackages,
        } : undefined,
      };

      try {
        worker.postMessage(request);
      } catch (err) {
        clearTimeout(timeoutId);
        pendingRef.current.delete(id);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }, []);

  /**
   * Primary compilation function — Vite Sandbox with resilient fallback chain.
   * Each new call aborts the prior in-flight compile so the Vite sandbox droplet
   * doesn't accumulate stale connections and exhaust its concurrency cap.
   * 
   * Flow: Vite Sandbox → Worker fallback → Legacy edge fallback → throw
   */
  const compileReactProject = useCallback(async (
    files: ProjectFile[],
    options?: {
      supabaseConfig?: { url: string; anonKey: string } | null;
      stripeConfig?: { publishableKey: string } | null;
      envVars?: { key: string; value: string }[];
      userPackages?: CDNPackageEntry[];
      /** Skip edge function — compile locally for instant feedback on edits */
      localOnly?: boolean;
    }
  ): Promise<WorkerCompilerResult> => {
    // Abort any prior in-flight compilation to free droplet concurrency
    if (activeAbortRef.current) {
      console.info('[Compiler] Aborting prior in-flight compilation');
      activeAbortRef.current.abort();
    }
    const ac = new AbortController();
    activeAbortRef.current = ac;
    const { signal } = ac;

    const VITE_TIMEOUT_MS = 20_000;

    let viteError: Error | null = null;

    // ── Attempt 1: Vite Sandbox (primary — 20s timeout) ──
    try {
      console.info('[Compiler] ⏱ Attempt 1: Vite Sandbox', { fileCount: files.length });
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
      if (signal.aborted) {
        console.warn('[Compiler] Signal aborted but no replacement compile — falling through to Worker');
      }
      viteError = err;
      console.warn('[Compiler] ❌ Vite Sandbox failed:', err.message, '— falling back to Worker');
    }

    // ── Attempt 2: Worker fallback (bounded per-request timeout) ──
    try {
      console.info('[Compiler] ⏱ Attempt 2: Web Worker compiler (fallback)');
      const workerResult = await compileViaWorker(files, options, DEFAULT_WORKER_REQUEST_TIMEOUT_MS);
      console.info('[Compiler] ✅ Worker fallback compiled:', workerResult.html?.length, 'chars (degraded)');
      return workerResult;
    } catch (workerErr: any) {
      console.warn('[Compiler] ❌ Worker fallback failed:', workerErr?.message || workerErr, '— trying legacy edge compiler');

      if (signal.aborted && ac !== activeAbortRef.current) {
        throw new DOMException('Aborted', 'AbortError');
      }

      try {
        console.info('[Compiler] ⏱ Attempt 3: Legacy edge compiler fallback');
        const edgeResult = await Promise.race([
          compileViaEdgeFunction(files, options, signal),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Legacy edge timeout (${EDGE_FALLBACK_TIMEOUT_MS / 1000}s)`)), EDGE_FALLBACK_TIMEOUT_MS)
          ),
        ]);
        console.info('[Compiler] ✅ Legacy edge fallback compiled:', edgeResult.html?.length, 'chars');
        return edgeResult;
      } catch (edgeErr: any) {
        const viteMsg = viteError?.message || 'unknown';
        const workerMsg = workerErr?.message || 'unknown';
        const edgeMsg = edgeErr?.message || 'unknown';
        console.error('[Compiler] ❌ All compilation attempts failed');
        console.error('[Compiler]   Vite error:', viteMsg);
        console.error('[Compiler]   Worker error:', workerMsg);
        console.error('[Compiler]   Edge error:', edgeMsg);
        throw new Error(`Compilation failed (vite: ${viteMsg}; worker: ${workerMsg}; edge: ${edgeMsg})`);
      }
    }
  }, [compileViaWorker]);

  /** Abort any in-flight compilation (call when starting a new generation or force-compiling) */
  const abortCompilation = useCallback(() => {
    if (activeAbortRef.current) {
      console.info('[Compiler] abortCompilation called — cancelling in-flight requests');
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
    }
  }, []);

  return { compileReactProject, abortCompilation };
}
