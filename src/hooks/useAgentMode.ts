import { useState, useCallback, useRef, useEffect } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import { toast } from 'sonner';

export type AgentStep = {
  id: string;
  type: 'plan' | 'execute' | 'verify' | 'fix';
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
  filesModified?: string[];
  startedAt?: number;
  completedAt?: number;
};

export type AgentRun = {
  id: string;
  prompt: string;
  steps: AgentStep[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
};

export type AgentTask = {
  id: string;
  prompt: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  run: AgentRun | null;
  createdAt: Date;
  completedAt?: Date;
  errorCount: number;
  filesModified: string[];
};

const MAX_FIX_RETRIES = 3;
const VERIFY_TIMEOUT_MS = 2500;

export function useAgentMode() {
  const [taskQueue, setTaskQueue] = useState<AgentTask[]>([]);
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [agentHistory, setAgentHistory] = useState<AgentRun[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef(false);
  const errorBufferRef = useRef<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Set iframe ref for error capture
  const setIframeRef = useCallback((ref: HTMLIFrameElement | null) => {
    iframeRef.current = ref;
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<AgentStep>) => {
    setCurrentRun(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
      };
    });
  }, []);

  const addFixStep = useCallback((errorMsg: string): string => {
    const fixStepId = crypto.randomUUID();
    setCurrentRun(prev => {
      if (!prev) return prev;
      const fixStep: AgentStep = {
        id: fixStepId,
        type: 'fix',
        label: `Auto-fixing: ${errorMsg.slice(0, 50)}${errorMsg.length > 50 ? '...' : ''}`,
        status: 'pending',
        startedAt: Date.now(),
      };
      // Also add a new verify step after the fix
      const verifyStep: AgentStep = {
        id: crypto.randomUUID(),
        type: 'verify',
        label: 'Re-verifying output',
        status: 'pending',
      };
      return { ...prev, steps: [...prev.steps, fixStep, verifyStep] };
    });
    return fixStepId;
  }, []);

  const completeRun = useCallback((status: 'completed' | 'failed' = 'completed') => {
    setCurrentRun(prev => {
      if (!prev) return prev;
      const completed = { ...prev, status, completedAt: new Date() };
      setAgentHistory(h => [completed, ...h].slice(0, 20));
      return completed;
    });
  }, []);

  const cancelRun = useCallback(() => {
    abortRef.current?.abort();
    completeRun('failed');
    toast.info('Agent run cancelled');
  }, [completeRun]);

  // Listen for preview errors via postMessage
  const waitForPreviewErrors = useCallback((): Promise<string[]> => {
    return new Promise((resolve) => {
      errorBufferRef.current = [];

      const handler = (event: MessageEvent) => {
        if (event.data?.type === '__PREVIEW_ERROR__' || event.data?.type === 'preview-error') {
          const msg = event.data.message || event.data.error || String(event.data);
          if (msg && !errorBufferRef.current.includes(msg)) {
            errorBufferRef.current.push(msg);
          }
        }
      };

      window.addEventListener('message', handler);

      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve([...errorBufferRef.current]);
      }, VERIFY_TIMEOUT_MS);
    });
  }, []);

  // Core agent execution: Plan > Execute > Verify > Fix loop
  const executeAgentTask = useCallback(async (
    task: AgentTask,
    sendMessage: (input: string, files: ProjectFile[], ...args: any[]) => Promise<void>,
    currentFiles: ProjectFile[],
    extraArgs: any[],
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const run: AgentRun = {
      id: crypto.randomUUID(),
      prompt: task.prompt,
      steps: [
        { id: crypto.randomUUID(), type: 'plan', label: 'Planning approach', status: 'pending', startedAt: Date.now() },
        { id: crypto.randomUUID(), type: 'execute', label: 'Generating code', status: 'pending' },
        { id: crypto.randomUUID(), type: 'verify', label: 'Verifying output', status: 'pending' },
      ],
      status: 'running',
      startedAt: new Date(),
    };
    setCurrentRun(run);

    // Update task status
    setTaskQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running' as const, run } : t));

    try {
      // ─── Step 1: Plan ───
      const planStep = run.steps[0];
      updateStep(planStep.id, { status: 'running', startedAt: Date.now() });

      if (controller.signal.aborted) return;

      // Send planning-mode prompt to AI
      const planPrompt = `[PLANNING MODE - Return only a structured plan, no code yet]\n\nAnalyze this request and create a plan:\n"${task.prompt}"\n\nList the files that need to be created or modified and your approach. Be concise.`;
      await sendMessage(planPrompt, currentFiles, ...extraArgs);

      if (controller.signal.aborted) return;
      updateStep(planStep.id, { status: 'done', detail: 'Plan ready', completedAt: Date.now() });

      // ─── Step 2: Execute ───
      const execStep = run.steps[1];
      updateStep(execStep.id, { status: 'running', startedAt: Date.now() });

      // Send actual build prompt
      await sendMessage(task.prompt, currentFiles, ...extraArgs);

      if (controller.signal.aborted) return;
      updateStep(execStep.id, { status: 'done', detail: 'Code generated', completedAt: Date.now() });

      // ─── Step 3: Verify ───
      let fixCount = 0;
      let verifyStepId = run.steps[2].id;
      updateStep(verifyStepId, { status: 'running', startedAt: Date.now() });

      // Wait for preview to load and capture errors
      const errors = await waitForPreviewErrors();

      if (controller.signal.aborted) return;

      if (errors.length === 0) {
        updateStep(verifyStepId, { status: 'done', detail: 'No errors detected', completedAt: Date.now() });
      } else {
        // Error detected — enter fix loop
        updateStep(verifyStepId, { status: 'error', detail: `${errors.length} error(s) found`, completedAt: Date.now() });

        while (errors.length > 0 && fixCount < MAX_FIX_RETRIES) {
          if (controller.signal.aborted) return;
          fixCount++;

          const errorSummary = errors.slice(0, 3).join('\n');
          const fixStepId = addFixStep(errors[0]);

          // Wait a tick for state to update
          await new Promise(r => setTimeout(r, 100));
          updateStep(fixStepId, { status: 'running', startedAt: Date.now() });

          const escalation = fixCount > 1
            ? `\n\nThis is auto-fix attempt ${fixCount}/${MAX_FIX_RETRIES}. Previous fixes didn't work. Try a completely different approach.`
            : '';

          const fixPrompt = `Auto-fix error in the generated code:\n\n${errorSummary}${escalation}\n\nReturn the corrected file(s).`;

          await sendMessage(fixPrompt, currentFiles, ...extraArgs);

          if (controller.signal.aborted) return;
          updateStep(fixStepId, { status: 'done', detail: `Fix attempt ${fixCount}`, completedAt: Date.now() });

          // Re-verify
          const lastVerifyStep = run.steps[run.steps.length - 1];
          if (lastVerifyStep?.type === 'verify') {
            updateStep(lastVerifyStep.id, { status: 'running', startedAt: Date.now() });
          }

          const retryErrors = await waitForPreviewErrors();

          if (retryErrors.length === 0) {
            if (lastVerifyStep?.type === 'verify') {
              updateStep(lastVerifyStep.id, { status: 'done', detail: 'No errors detected', completedAt: Date.now() });
            }
            break;
          } else {
            if (lastVerifyStep?.type === 'verify') {
              updateStep(lastVerifyStep.id, { status: 'error', detail: `${retryErrors.length} error(s) remain`, completedAt: Date.now() });
            }
            errors.splice(0, errors.length, ...retryErrors);
          }
        }

        if (fixCount >= MAX_FIX_RETRIES && errors.length > 0) {
          toast.warning('Agent: some errors remain after max retries. May need manual attention.');
        }
      }

      // Update task
      setTaskQueue(prev => prev.map(t =>
        t.id === task.id
          ? { ...t, status: 'completed' as const, completedAt: new Date(), errorCount: fixCount }
          : t
      ));
      completeRun('completed');

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setTaskQueue(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: 'failed' as const, completedAt: new Date() } : t
        ));
        completeRun('failed');
      }
    } finally {
      abortRef.current = null;
      isProcessingRef.current = false;
    }
  }, [updateStep, addFixStep, completeRun, waitForPreviewErrors]);

  // Enqueue a new task
  const enqueueTask = useCallback((prompt: string): AgentTask => {
    const task: AgentTask = {
      id: crypto.randomUUID(),
      prompt,
      status: 'queued',
      run: null,
      createdAt: new Date(),
      errorCount: 0,
      filesModified: [],
    };
    setTaskQueue(prev => [...prev, task]);
    return task;
  }, []);

  // Cancel a specific task
  const cancelTask = useCallback((taskId: string) => {
    setTaskQueue(prev => prev.map(t => {
      if (t.id === taskId) {
        if (t.status === 'running') {
          abortRef.current?.abort();
          completeRun('failed');
        }
        return { ...t, status: 'cancelled' as const, completedAt: new Date() };
      }
      return t;
    }));
  }, [completeRun]);

  // Retry a failed task
  const retryTask = useCallback((taskId: string) => {
    setTaskQueue(prev => prev.map(t =>
      t.id === taskId && (t.status === 'failed' || t.status === 'cancelled')
        ? { ...t, status: 'queued' as const, run: null, completedAt: undefined, errorCount: 0 }
        : t
    ));
  }, []);

  // Clear completed/cancelled/failed tasks
  const clearCompleted = useCallback(() => {
    setTaskQueue(prev => prev.filter(t => t.status === 'queued' || t.status === 'running'));
  }, []);

  // Process queue — pick next queued task
  const processQueue = useCallback((
    sendMessage: (input: string, files: ProjectFile[], ...args: any[]) => Promise<void>,
    currentFiles: ProjectFile[],
    extraArgs: any[],
  ) => {
    if (isProcessingRef.current) return;
    const next = taskQueue.find(t => t.status === 'queued');
    if (!next) return;

    isProcessingRef.current = true;
    executeAgentTask(next, sendMessage, currentFiles, extraArgs);
  }, [taskQueue, executeAgentTask]);

  // Legacy compatibility: startAgentRun creates a task and returns a run-like object
  const startAgentRun = useCallback((prompt: string): AgentRun => {
    const task = enqueueTask(prompt);
    return {
      id: task.id,
      prompt,
      steps: [
        { id: crypto.randomUUID(), type: 'plan', label: 'Planning approach', status: 'pending' },
        { id: crypto.randomUUID(), type: 'execute', label: 'Generating code', status: 'pending' },
        { id: crypto.randomUUID(), type: 'verify', label: 'Verifying output', status: 'pending' },
      ],
      status: 'running',
      startedAt: new Date(),
    };
  }, [enqueueTask]);

  return {
    currentRun,
    agentHistory,
    taskQueue,
    startAgentRun,
    updateStep,
    addFixStep,
    completeRun,
    cancelRun,
    enqueueTask,
    cancelTask,
    retryTask,
    clearCompleted,
    processQueue,
    executeAgentTask,
    setIframeRef,
  };
}
