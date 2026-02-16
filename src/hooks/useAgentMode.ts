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
  planSummary?: string;
  filesToModify?: string[];
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

export type AgentNotification = {
  id: string;
  taskId: string;
  type: 'success' | 'error' | 'warning';
  title: string;
  detail?: string;
  timestamp: Date;
};

const MAX_FIX_RETRIES = 3;
const VERIFY_TIMEOUT_MS = 3000;

// Planning prompt that asks AI to return structured JSON
const PLANNING_SYSTEM_PROMPT = `[PLANNING MODE — Do NOT generate code. Return ONLY a JSON object.]

Analyze the user's request in context of the current project files and return a structured plan as JSON:

{
  "approach": "Brief 1-2 sentence summary of the approach",
  "filesToCreate": ["path/to/new-file.tsx"],
  "filesToModify": ["path/to/existing-file.tsx"],
  "steps": ["Step 1 description", "Step 2 description"],
  "dependencies": []
}

Return ONLY valid JSON, no markdown, no explanation.`;

function tryParseJSON(text: string): { approach?: string; filesToCreate?: string[]; filesToModify?: string[]; steps?: string[] } | null {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1].trim()); } catch { /* fall through */ }
    }
    // Try to find first { ... } block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try { return JSON.parse(braceMatch[0]); } catch { /* fall through */ }
    }
    return null;
  }
}

const STORAGE_KEY = 'agent-task-history';

function loadPersistedTasks(): AgentTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AgentTask[];
    // Only restore completed/failed tasks as history (not queued/running)
    return parsed
      .filter(t => ['completed', 'failed', 'cancelled'].includes(t.status))
      .slice(0, 20)
      .map(t => ({ ...t, createdAt: new Date(t.createdAt), completedAt: t.completedAt ? new Date(t.completedAt) : undefined }));
  } catch { return []; }
}

function persistTasks(tasks: AgentTask[]) {
  try {
    const toSave = tasks
      .filter(t => ['completed', 'failed', 'cancelled'].includes(t.status))
      .slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

export function useAgentMode() {
  const [taskQueue, setTaskQueue] = useState<AgentTask[]>(() => loadPersistedTasks());
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [agentHistory, setAgentHistory] = useState<AgentRun[]>([]);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef(false);
  const errorBufferRef = useRef<string[]>([]);

  // Persist completed tasks to localStorage
  useEffect(() => {
    persistTasks(taskQueue);
  }, [taskQueue]);

  // Emit a notification
  const emitNotification = useCallback((taskId: string, type: AgentNotification['type'], title: string, detail?: string) => {
    const notif: AgentNotification = {
      id: crypto.randomUUID(),
      taskId,
      type,
      title,
      detail,
      timestamp: new Date(),
    };
    setNotifications(prev => [notif, ...prev].slice(0, 50));

    // Also show toast
    if (type === 'success') {
      toast.success(title, { description: detail });
    } else if (type === 'error') {
      toast.error(title, { description: detail });
    } else {
      toast.warning(title, { description: detail });
    }
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

  // Listen for preview errors via postMessage — real capture
  const waitForPreviewErrors = useCallback((): Promise<string[]> => {
    return new Promise((resolve) => {
      errorBufferRef.current = [];

      const handler = (event: MessageEvent) => {
        // Capture both __PREVIEW_ERROR__ (from ConsolePanel wiring) and generic error formats
        if (
          event.data?.type === '__PREVIEW_ERROR__' ||
          event.data?.type === 'preview-error' ||
          event.data?.type === '__CONSOLE_LOG__' && event.data?.level === 'error'
        ) {
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
    isProcessingRef.current = true;

    const planStepId = crypto.randomUUID();
    const execStepId = crypto.randomUUID();
    const verifyStepId = crypto.randomUUID();

    const run: AgentRun = {
      id: crypto.randomUUID(),
      prompt: task.prompt,
      steps: [
        { id: planStepId, type: 'plan', label: 'Analyzing & planning', status: 'pending', startedAt: Date.now() },
        { id: execStepId, type: 'execute', label: 'Generating code', status: 'pending' },
        { id: verifyStepId, type: 'verify', label: 'Verifying output', status: 'pending' },
      ],
      status: 'running',
      startedAt: new Date(),
    };
    setCurrentRun(run);

    // Update task status
    setTaskQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running' as const, run } : t));

    try {
      // ─── Step 1: Intelligent Planning ───
      updateStep(planStepId, { status: 'running', startedAt: Date.now() });

      if (controller.signal.aborted) return;

      // Build file tree summary for context (no separate API call — just enrich the prompt)
      const fileTree = currentFiles.map(f => f.path).join('\n');

      // Mark planning as done immediately (planning is embedded in the build prompt)
      updateStep(planStepId, { status: 'done', detail: 'Plan ready', completedAt: Date.now() });

      // ─── Step 2: Execute (single sendMessage call — plan + build combined) ───
      updateStep(execStepId, { status: 'running', startedAt: Date.now() });

      const buildPrompt = `${task.prompt}\n\n[Project file tree:\n${fileTree}]`;

      await sendMessage(buildPrompt, currentFiles, ...extraArgs);

      if (controller.signal.aborted) return;
      updateStep(execStepId, { status: 'done', detail: 'Code generated', completedAt: Date.now() });

      // ─── Step 3: Verify ───
      updateStep(verifyStepId, { status: 'running', startedAt: Date.now() });

      // Wait for preview to load and capture errors from iframe
      const errors = await waitForPreviewErrors();

      if (controller.signal.aborted) return;

      let fixCount = 0;

      if (errors.length === 0) {
        updateStep(verifyStepId, { status: 'done', detail: 'No errors detected', completedAt: Date.now() });
      } else {
        // Error detected — enter self-correction loop
        updateStep(verifyStepId, { status: 'error', detail: `${errors.length} error(s) found`, completedAt: Date.now() });

        while (errors.length > 0 && fixCount < MAX_FIX_RETRIES) {
          if (controller.signal.aborted) return;
          fixCount++;

          const errorSummary = errors.slice(0, 3).join('\n');

          // Add fix step
          const fixStepId = crypto.randomUUID();
          const reVerifyStepId = crypto.randomUUID();
          setCurrentRun(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              steps: [
                ...prev.steps,
                { id: fixStepId, type: 'fix' as const, label: `Auto-fixing: ${errors[0].slice(0, 50)}${errors[0].length > 50 ? '...' : ''}`, status: 'pending' as const, startedAt: Date.now() },
                { id: reVerifyStepId, type: 'verify' as const, label: 'Re-verifying output', status: 'pending' as const },
              ],
            };
          });

          await new Promise(r => setTimeout(r, 100));
          updateStep(fixStepId, { status: 'running', startedAt: Date.now() });

          const escalation = fixCount > 1
            ? `\n\nThis is auto-fix attempt ${fixCount}/${MAX_FIX_RETRIES}. Previous fixes didn't resolve it. Try a completely different approach.`
            : '';

          const fixPrompt = `Auto-fix error in the generated code:\n\n${errorSummary}${escalation}\n\nReturn the corrected file(s).`;

          await sendMessage(fixPrompt, currentFiles, ...extraArgs);

          if (controller.signal.aborted) return;
          updateStep(fixStepId, { status: 'done', detail: `Fix attempt ${fixCount}`, completedAt: Date.now() });

          // Re-verify
          updateStep(reVerifyStepId, { status: 'running', startedAt: Date.now() });

          const retryErrors = await waitForPreviewErrors();

          if (retryErrors.length === 0) {
            updateStep(reVerifyStepId, { status: 'done', detail: 'No errors detected', completedAt: Date.now() });
            break;
          } else {
            updateStep(reVerifyStepId, { status: 'error', detail: `${retryErrors.length} error(s) remain`, completedAt: Date.now() });
            errors.splice(0, errors.length, ...retryErrors);
          }
        }

        if (fixCount >= MAX_FIX_RETRIES && errors.length > 0) {
          emitNotification(task.id, 'warning', 'Agent: needs attention', `${errors.length} error(s) remain after ${MAX_FIX_RETRIES} fix attempts`);
        }
      }

      // Task completed
      setTaskQueue(prev => prev.map(t =>
        t.id === task.id
          ? { ...t, status: 'completed' as const, completedAt: new Date(), errorCount: fixCount }
          : t
      ));
      completeRun('completed');
      emitNotification(task.id, 'success', 'Agent task completed', fixCount > 0 ? `Applied ${fixCount} fix(es)` : undefined);

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setTaskQueue(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: 'failed' as const, completedAt: new Date() } : t
        ));
        completeRun('failed');
        emitNotification(task.id, 'error', 'Agent task failed', (err as Error).message);
      }
    } finally {
      abortRef.current = null;
      isProcessingRef.current = false;
    }
  }, [updateStep, completeRun, waitForPreviewErrors, emitNotification]);

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

  // Auto-process queue: when no task is running, start the next queued task
  const getNextQueuedTask = useCallback(() => {
    return taskQueue.find(t => t.status === 'queued');
  }, [taskQueue]);

  const isAnyRunning = taskQueue.some(t => t.status === 'running');

  // Reorder queued tasks (drag & drop)
  const reorderQueue = useCallback((newOrder: AgentTask[]) => {
    setTaskQueue(newOrder);
  }, []);

  // Legacy compatibility
  const startAgentRun = useCallback((prompt: string): AgentRun => {
    enqueueTask(prompt);
    return {
      id: crypto.randomUUID(),
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
    notifications,
    isAnyRunning,
    startAgentRun,
    updateStep,
    completeRun,
    cancelRun,
    enqueueTask,
    cancelTask,
    retryTask,
    clearCompleted,
    reorderQueue,
    executeAgentTask,
    getNextQueuedTask,
  };
}
