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
  }
): Promise<WorkerCompilerResult> {
  const t0 = Date.now();
  console.info('[ViteSandbox] Calling compile-vite edge function with', files.length, 'files');

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
  }
): Promise<WorkerCompilerResult> {
  const t0 = Date.now();
  console.info('[ServerCompiler] Calling compile-project edge function with', files.length, 'files');

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
   * Primary compilation function:
   * 1. Try server-side edge function (fast, reliable, Lovable parity)
   * 2. Fall back to in-browser worker if edge function fails
   *
   * @param localOnly — If true, skip edge function and compile locally only.
   *   Used for incremental edits where speed matters more than full server parity.
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
    // For incremental edits, skip the network round-trip entirely
    if (options?.localOnly) {
      console.info('[Compiler] Local-only mode — skipping edge function for instant update');
      try {
        return await Promise.race([
          compileViaWorker(files, options),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Local compilation timeout (15s)')), 15_000)
          ),
        ]);
      } catch (workerErr: any) {
        console.warn('[Compiler] Local compilation failed:', workerErr.message);
        // Fall through to server as last resort
      }
    }

    // 1. Try Vite Sandbox (true Vite on Droplet — Lovable parity)
    // Short timeout (10s) so fallback is fast when sandbox is down
    try {
      const result = await Promise.race([
        compileViaViteSandbox(files, options),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Vite sandbox timeout (10s)')), 10_000)
        ),
      ]);
      return result;
    } catch (viteErr: any) {
      console.warn('[Compiler] Vite sandbox failed, trying legacy server:', viteErr.message);
    }

    // 2. Fall back to legacy esbuild edge function
    try {
      const result = await Promise.race([
        compileViaEdgeFunction(files, options),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Server compilation timeout (15s)')), 15_000)
        ),
      ]);
      return result;
    } catch (serverErr: any) {
      console.warn('[Compiler] Legacy server compilation failed, falling back to worker:', serverErr.message);
    }

    // 3. Last resort: in-browser worker
    return compileViaWorker(files, options);
  }, [compileViaWorker]);

  return { compileReactProject };
}
