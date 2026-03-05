/**
 * useWorkerCompiler — Hook that compiles projects via server-side Edge Function.
 * 
 * PRIMARY PATH: Calls the `compile-project` edge function for reliable,
 * server-side compilation (Lovable parity).
 * 
 * FALLBACK: If the edge function fails (network error, timeout), falls back
 * to the in-browser Web Worker compiler.
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

  useEffect(() => {
    const worker = getSharedWorkerSafe();
    workerRef.current = worker;

    worker.onerror = (e) => {
      console.error('[WorkerCompiler] Worker error:', e.message || e);
    };

    const handler = (e: MessageEvent<WorkerResponse>) => {
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

    worker.addEventListener('message', handler);

    return () => {
      worker.removeEventListener('message', handler);
      for (const [, { reject }] of pendingRef.current) {
        reject(new Error('Worker compiler unmounted'));
      }
      pendingRef.current.clear();
      activeAbortRef.current?.abort();
      releaseSharedWorker();
      workerRef.current = null;
    };
  }, []);

  const compileViaWorker = useCallback(async (
    files: ProjectFile[],
    options?: {
      supabaseConfig?: { url: string; anonKey: string } | null;
      stripeConfig?: { publishableKey: string } | null;
      envVars?: { key: string; value: string }[];
      userPackages?: CDNPackageEntry[];
    }
  ): Promise<WorkerCompilerResult> => {
    const worker = workerRef.current;
    if (!worker) {
      throw new Error('Compiler worker not initialized');
    }

    const id = `compile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return new Promise<WorkerCompilerResult>((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });

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

      worker.postMessage(request);
    });
  }, []);

  /**
   * Primary compilation function — Vite Sandbox ONLY (no fallback tiers).
   * Each new call aborts the prior in-flight compile so the Vite sandbox droplet
   * doesn't accumulate stale connections and exhaust its concurrency cap (5).
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

    // ── Vite Sandbox — sole compilation path ──
    // Generous timeout (30s) to handle cold starts and complex projects.
    // No fallback tiers — if the sandbox fails, surface the error directly.
    const VITE_TIMEOUT_MS = 30_000;

    try {
      console.info('[Compiler] Compiling via Vite Sandbox (sole path)', { fileCount: files.length });
      const result = await Promise.race([
        compileViaViteSandbox(files, options, signal),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Vite sandbox timeout (${VITE_TIMEOUT_MS / 1000}s)`)), VITE_TIMEOUT_MS)
        ),
      ]);
      console.info('[Compiler] ✅ Vite Sandbox compiled:', result.html?.length, 'chars');
      return result;
    } catch (err: any) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      console.error('[Compiler] ❌ Vite Sandbox failed:', err.message);
      throw err;
    }
  }, []);

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
