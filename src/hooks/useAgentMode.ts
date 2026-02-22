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
  /** Snapshot of project files taken BEFORE this step executed */
  preSnapshot?: ProjectFile[];
};

export type AgentPlan = {
  approach: string;
  filesToCreate: string[];
  filesToModify: string[];
  steps: string[];
  dependencies: string[];
  approved: boolean;
};

export type AgentRun = {
  id: string;
  prompt: string;
  steps: AgentStep[];
  status: 'idle' | 'running' | 'awaiting_approval' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  planSummary?: string;
  filesToModify?: string[];
  plan?: AgentPlan;
  /** Accumulated context: files modified across all steps so far */
  modifiedFilesContext?: Map<string, string>;
};

export type AgentTask = {
  id: string;
  prompt: string;
  imageDataUrls?: string[] | null;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'awaiting_approval';
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

const MAX_FIX_RETRIES = 2;
const VERIFY_TIMEOUT_MS = 3000;
const AGENT_WALL_CLOCK_MS = 120_000; // 2 min hard cap on entire agent run

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
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1].trim()); } catch { /* fall through */ }
    }
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

/**
 * Take a lightweight snapshot of project files for rollback.
 * Only stores path + content (omits heavy metadata).
 */
function snapshotFiles(files: ProjectFile[]): ProjectFile[] {
  return files.map(f => ({ path: f.path, content: f.content, language: f.language }));
}

/**
 * Build a cross-step context string summarizing what has been modified so far.
 * This prevents the AI from losing track of prior work during multi-step builds.
 */
function buildCrossStepContext(modifiedFiles: Map<string, string>, completedStepLabels: string[]): string {
  if (modifiedFiles.size === 0) return '';

  const fileList = Array.from(modifiedFiles.keys())
    .map(p => `  - ${p}`)
    .join('\n');

  const stepsCompleted = completedStepLabels.length > 0
    ? `\nCompleted steps:\n${completedStepLabels.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`
    : '';

  return `\n\n[AGENT CONTEXT — Files modified in this session:\n${fileList}${stepsCompleted}\n\nBuild on top of these changes. Do NOT recreate or overwrite work already done.]`;
}

export function useAgentMode() {
  const [taskQueue, setTaskQueue] = useState<AgentTask[]>(() => loadPersistedTasks());
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [agentHistory, setAgentHistory] = useState<AgentRun[]>([]);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [pendingApproval, setPendingApproval] = useState<{ taskId: string; plan: AgentPlan } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef(false);
  const errorBufferRef = useRef<string[]>([]);
  const approvalResolverRef = useRef<((approved: boolean) => void) | null>(null);

  useEffect(() => {
    persistTasks(taskQueue);
  }, [taskQueue]);

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
    if (type === 'success') toast.success(title, { description: detail });
    else if (type === 'error') toast.error(title, { description: detail });
    else toast.warning(title, { description: detail });
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
    approvalResolverRef.current?.(false);
    approvalResolverRef.current = null;
    setPendingApproval(null);
    completeRun('failed');
    toast.info('Agent run cancelled');
  }, [completeRun]);

  /**
   * Approve or reject the pending plan.
   */
  const respondToPlan = useCallback((approved: boolean) => {
    setPendingApproval(null);
    approvalResolverRef.current?.(approved);
    approvalResolverRef.current = null;
  }, []);

  const waitForPreviewErrors = useCallback((): Promise<string[]> => {
    return new Promise((resolve) => {
      errorBufferRef.current = [];
      const handler = (event: MessageEvent) => {
        if (
          event.data?.type === '__PREVIEW_ERROR__' ||
          event.data?.type === 'preview-error' ||
          event.data?.type === '__CONSOLE_LOG__' && event.data?.level === 'error'
        ) {
          const raw = event.data.message || event.data.error || event.data;
          const msg = typeof raw === 'string' ? raw : (raw?.message || String(raw));
          if (msg && typeof msg === 'string' && !errorBufferRef.current.includes(msg)) {
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

  /**
   * Rollback files to a pre-step snapshot.
   */
  const rollbackToSnapshot = useCallback((
    snapshot: ProjectFile[],
    applyFiles: (files: ProjectFile[]) => void,
  ) => {
    applyFiles(snapshot);
    toast.info('Rolled back to pre-step snapshot');
  }, []);

  // Core agent execution: Plan > Approve > Execute > Verify > Fix loop
  const executeAgentTask = useCallback(async (
    task: AgentTask,
    sendMessage: (input: string, files: ProjectFile[], ...args: any[]) => Promise<void>,
    currentFiles: ProjectFile[],
    extraArgs: any[],
    applyFiles?: (files: ProjectFile[]) => void,
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;
    isProcessingRef.current = true;

    // Hard wall-clock timeout to prevent infinite agent runs
    const wallClockTimer = setTimeout(() => {
      console.warn('[Agent] Wall-clock timeout reached, aborting');
      controller.abort();
    }, AGENT_WALL_CLOCK_MS);

    const planStepId = crypto.randomUUID();
    const execStepId = crypto.randomUUID();
    const verifyStepId = crypto.randomUUID();

    // Cross-step context accumulator
    const modifiedFilesCtx = new Map<string, string>();
    const completedStepLabels: string[] = [];

    const run: AgentRun = {
      id: crypto.randomUUID(),
      prompt: task.prompt,
      steps: [
        { id: planStepId, type: 'plan', label: 'Analyzing & planning', status: 'pending', startedAt: Date.now(), preSnapshot: snapshotFiles(currentFiles) },
        { id: execStepId, type: 'execute', label: 'Generating code', status: 'pending' },
        { id: verifyStepId, type: 'verify', label: 'Verifying output', status: 'pending' },
      ],
      status: 'running',
      startedAt: new Date(),
      modifiedFilesContext: modifiedFilesCtx,
    };
    setCurrentRun(run);
    setTaskQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running' as const, run } : t));

    try {
      // ─── Step 1: Planning with Approval Gate ───
      updateStep(planStepId, { status: 'running', startedAt: Date.now() });
      if (controller.signal.aborted) return;

      const fileTree = currentFiles.map(f => f.path).join('\n');

      // Parse a lightweight plan from the prompt
      const planData: AgentPlan = {
        approach: `Build: ${task.prompt.slice(0, 100)}`,
        filesToCreate: [],
        filesToModify: currentFiles.filter(f =>
          task.prompt.toLowerCase().includes(f.path.split('/').pop()?.replace(/\.\w+$/, '') || '')
        ).map(f => f.path).slice(0, 5),
        steps: ['Generate code based on requirements', 'Verify output for errors', 'Apply fixes if needed'],
        dependencies: [],
        approved: false,
      };

      updateStep(planStepId, {
        status: 'done',
        detail: `Plan: ${planData.approach.slice(0, 80)}`,
        completedAt: Date.now(),
      });

      // Auto-approve the initial command (no existing files = fresh project)
      const isInitialCommand = currentFiles.length === 0;
      let approved = true;

      if (!isInitialCommand) {
        // Show plan approval UI and wait for user response
        setCurrentRun(prev => prev ? { ...prev, status: 'awaiting_approval', plan: planData } : prev);
        setTaskQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'awaiting_approval' as const } : t));
        setPendingApproval({ taskId: task.id, plan: planData });

        approved = await new Promise<boolean>((resolve) => {
          approvalResolverRef.current = resolve;
          // Auto-approve after 30s if no response
          setTimeout(() => {
            if (approvalResolverRef.current === resolve) {
              approvalResolverRef.current = null;
              setPendingApproval(null);
              resolve(true);
            }
          }, 30000);
        });
      }

      if (!approved || controller.signal.aborted) {
        setTaskQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'cancelled' as const, completedAt: new Date() } : t));
        completeRun('failed');
        emitNotification(task.id, 'warning', 'Agent: plan rejected');
        return;
      }

      planData.approved = true;
      setCurrentRun(prev => prev ? { ...prev, status: 'running', plan: planData } : prev);
      setTaskQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running' as const } : t));
      completedStepLabels.push('Planning complete');

      // ─── Step 2: Execute with pre-step snapshot ───
      const execSnapshot = snapshotFiles(currentFiles);
      updateStep(execStepId, { status: 'running', startedAt: Date.now(), preSnapshot: execSnapshot });

      const crossCtx = buildCrossStepContext(modifiedFilesCtx, completedStepLabels);
      const buildPrompt = `${task.prompt}\n\n[Project file tree:\n${fileTree}]${crossCtx}`;

      await sendMessage(buildPrompt, currentFiles, ...extraArgs);

      if (controller.signal.aborted) return;
      updateStep(execStepId, { status: 'done', detail: 'Code generated', completedAt: Date.now() });
      completedStepLabels.push('Code generation complete');

      // Track modified files for cross-step context
      currentFiles.forEach(f => {
        const snapFile = execSnapshot.find(s => s.path === f.path);
        if (!snapFile || snapFile.content !== f.content) {
          modifiedFilesCtx.set(f.path, f.content);
        }
      });

      // ─── Step 3: Verify ───
      const verifySnapshot = snapshotFiles(currentFiles);
      updateStep(verifyStepId, { status: 'running', startedAt: Date.now(), preSnapshot: verifySnapshot });

      const errors = await waitForPreviewErrors();
      if (controller.signal.aborted) return;

      let fixCount = 0;

      if (errors.length === 0) {
        updateStep(verifyStepId, { status: 'done', detail: 'No errors detected', completedAt: Date.now() });
      } else {
        updateStep(verifyStepId, { status: 'error', detail: `${errors.length} error(s) found`, completedAt: Date.now() });

        while (errors.length > 0 && fixCount < MAX_FIX_RETRIES) {
          if (controller.signal.aborted) return;
          fixCount++;

          const errorSummary = errors.slice(0, 3).join('\n');
          const fixStepId = crypto.randomUUID();
          const reVerifyStepId = crypto.randomUUID();

          // Snapshot before fix attempt
          const fixSnapshot = snapshotFiles(currentFiles);

          setCurrentRun(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              steps: [
                ...prev.steps,
                { id: fixStepId, type: 'fix' as const, label: `Auto-fixing: ${String(errors[0] || '').slice(0, 50)}${String(errors[0] || '').length > 50 ? '...' : ''}`, status: 'pending' as const, startedAt: Date.now(), preSnapshot: fixSnapshot },
                { id: reVerifyStepId, type: 'verify' as const, label: 'Re-verifying output', status: 'pending' as const },
              ],
            };
          });

          await new Promise(r => setTimeout(r, 100));
          updateStep(fixStepId, { status: 'running', startedAt: Date.now() });

          const escalation = fixCount > 1
            ? `\n\nThis is auto-fix attempt ${fixCount}/${MAX_FIX_RETRIES}. Previous fixes didn't resolve it. Try a completely different approach.`
            : '';

          const fixCtx = buildCrossStepContext(modifiedFilesCtx, completedStepLabels);
          const fixPrompt = `Auto-fix error in the generated code:\n\n${errorSummary}${escalation}${fixCtx}\n\nReturn the corrected file(s).`;

          await sendMessage(fixPrompt, currentFiles, ...extraArgs);

          if (controller.signal.aborted) return;
          updateStep(fixStepId, { status: 'done', detail: `Fix attempt ${fixCount}`, completedAt: Date.now() });
          completedStepLabels.push(`Fix attempt ${fixCount}`);

          // Update modified files context
          currentFiles.forEach(f => {
            const snapFile = fixSnapshot.find(s => s.path === f.path);
            if (!snapFile || snapFile.content !== f.content) {
              modifiedFilesCtx.set(f.path, f.content);
            }
          });

          // Re-verify
          updateStep(reVerifyStepId, { status: 'running', startedAt: Date.now() });
          const retryErrors = await waitForPreviewErrors();

          if (retryErrors.length === 0) {
            updateStep(reVerifyStepId, { status: 'done', detail: 'No errors detected', completedAt: Date.now() });
            break;
          } else {
            updateStep(reVerifyStepId, { status: 'error', detail: `${retryErrors.length} error(s) remain`, completedAt: Date.now() });

            // If fix made things worse and we have a rollback function, revert
            if (retryErrors.length > errors.length && applyFiles && fixSnapshot.length > 0) {
              rollbackToSnapshot(fixSnapshot, applyFiles);
              emitNotification(task.id, 'warning', 'Agent: rolled back fix', 'Fix attempt made things worse');
            }

            errors.splice(0, errors.length, ...retryErrors);
          }
        }

        if (fixCount >= MAX_FIX_RETRIES && errors.length > 0) {
          emitNotification(task.id, 'warning', 'Agent: needs attention', `${errors.length} error(s) remain after ${MAX_FIX_RETRIES} fix attempts`);
        }
      }

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
      clearTimeout(wallClockTimer);
      abortRef.current = null;
      isProcessingRef.current = false;
    }
  }, [updateStep, completeRun, waitForPreviewErrors, emitNotification, rollbackToSnapshot]);

  const enqueueTask = useCallback((prompt: string, imageDataUrls?: string[] | null): AgentTask => {
    const task: AgentTask = {
      id: crypto.randomUUID(),
      prompt,
      imageDataUrls,
      status: 'queued',
      run: null,
      createdAt: new Date(),
      errorCount: 0,
      filesModified: [],
    };
    setTaskQueue(prev => [...prev, task]);
    return task;
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    setTaskQueue(prev => prev.map(t => {
      if (t.id === taskId) {
        if (t.status === 'running' || t.status === 'awaiting_approval') {
          abortRef.current?.abort();
          approvalResolverRef.current?.(false);
          approvalResolverRef.current = null;
          setPendingApproval(null);
          completeRun('failed');
        }
        return { ...t, status: 'cancelled' as const, completedAt: new Date() };
      }
      return t;
    }));
  }, [completeRun]);

  const retryTask = useCallback((taskId: string) => {
    setTaskQueue(prev => prev.map(t =>
      t.id === taskId && (t.status === 'failed' || t.status === 'cancelled')
        ? { ...t, status: 'queued' as const, run: null, completedAt: undefined, errorCount: 0 }
        : t
    ));
  }, []);

  const clearCompleted = useCallback(() => {
    setTaskQueue(prev => prev.filter(t => t.status === 'queued' || t.status === 'running' || t.status === 'awaiting_approval'));
  }, []);

  const getNextQueuedTask = useCallback(() => {
    return taskQueue.find(t => t.status === 'queued');
  }, [taskQueue]);

  const isAnyRunning = taskQueue.some(t => t.status === 'running' || t.status === 'awaiting_approval');

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
    pendingApproval,
    isAnyRunning,
    startAgentRun,
    updateStep,
    completeRun,
    cancelRun,
    respondToPlan,
    enqueueTask,
    cancelTask,
    retryTask,
    clearCompleted,
    reorderQueue,
    executeAgentTask,
    getNextQueuedTask,
  };
}
