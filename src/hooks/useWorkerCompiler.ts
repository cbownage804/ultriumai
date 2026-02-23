/**
 * useWorkerCompiler — Hook that communicates with the compiler Web Worker.
 * 
 * Replaces direct calls to useReactCompiler's compileReactProject,
 * moving all compilation off the main thread.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import type { CDNPackageEntry } from '@/lib/cdnPackageRegistry';
import type { CompileRequest, CompileResponse, CompileErrorResponse, WorkerResponse } from '@/workers/compiler.worker';

export interface WorkerCompilerResult {
  html: string;
  isReactProject: boolean;
  componentCount: number;
  errors: string[];
}

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
    // Delay termination to survive quick remounts (React strict mode, route transitions)
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
      // Reject any pending compilations
      for (const [, { reject }] of pendingRef.current) {
        reject(new Error('Worker compiler unmounted'));
      }
      pendingRef.current.clear();
      releaseSharedWorker();
      workerRef.current = null;
    };
  }, []);

  const compileReactProject = useCallback(async (
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
          userPackages: options.userPackages as any,
        } : undefined,
      };

      worker.postMessage(request);
    });
  }, []);

  return { compileReactProject };
}
