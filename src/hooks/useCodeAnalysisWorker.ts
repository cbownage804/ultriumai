import { useCallback, useRef, useEffect } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import type { CodeSuggestion } from '@/components/ai-builder/AICodeIntelligence';

/**
 * Offloads code smell detection and custom linting to a Web Worker
 * so heavy regex processing never blocks the main thread.
 */
export function useCodeAnalysisWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (data: any) => void>>(new Map());
  const requestIdRef = useRef(0);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/codeAnalysis.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { requestId, ...rest } = e.data;
      const cb = callbacksRef.current.get(requestId);
      if (cb) {
        cb(rest);
        callbacksRef.current.delete(requestId);
      }
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      callbacksRef.current.clear();
    };
  }, []);

  const postMessage = useCallback(<T>(type: string, payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }
      const requestId = `req-${++requestIdRef.current}`;
      const timeout = setTimeout(() => {
        callbacksRef.current.delete(requestId);
        reject(new Error('Worker timeout'));
      }, 10000);

      callbacksRef.current.set(requestId, (data) => {
        clearTimeout(timeout);
        if (data.type === 'error') reject(new Error(data.error));
        else resolve(data as T);
      });

      workerRef.current.postMessage({ type, payload, requestId });
    });
  }, []);

  /** Analyze files for code smells — returns suggestions off-thread */
  const analyzeFiles = useCallback(async (files: ProjectFile[]): Promise<CodeSuggestion[]> => {
    try {
      const result = await postMessage<{ results: any[] }>('analyzeSmells', {
        files: files.map(f => ({ path: f.path, content: f.content })),
      });
      // Add timestamp (Date is not transferable)
      return result.results.map(r => ({ ...r, timestamp: new Date() }));
    } catch {
      // Fallback: return empty on worker failure
      return [];
    }
  }, [postMessage]);

  /** Run custom lint rules on a single file */
  const runLint = useCallback(async (
    code: string,
    fileName: string,
    rules: { pattern: string; severity: string; message: string }[],
  ) => {
    try {
      const result = await postMessage<{ results: any[] }>('runLint', {
        code, fileName, rules,
      });
      return result.results;
    } catch {
      return [];
    }
  }, [postMessage]);

  return { analyzeFiles, runLint };
}
