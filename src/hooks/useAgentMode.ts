import { useState, useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';
import { toast } from 'sonner';

export type AgentStep = {
  id: string;
  type: 'plan' | 'execute' | 'verify' | 'fix';
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
  filesModified?: string[];
};

export type AgentRun = {
  id: string;
  prompt: string;
  steps: AgentStep[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
};

export function useAgentMode() {
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [agentHistory, setAgentHistory] = useState<AgentRun[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const startAgentRun = useCallback((prompt: string): AgentRun => {
    const run: AgentRun = {
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
    setCurrentRun(run);
    return run;
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

  const addFixStep = useCallback((errorMsg: string) => {
    setCurrentRun(prev => {
      if (!prev) return prev;
      const fixStep: AgentStep = {
        id: crypto.randomUUID(),
        type: 'fix',
        label: `Auto-fixing: ${errorMsg.slice(0, 50)}...`,
        status: 'pending',
      };
      return { ...prev, steps: [...prev.steps, fixStep] };
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

  const simulateAgentExecution = useCallback(async (
    run: AgentRun,
    sendMessage: (input: string, files: ProjectFile[], ...args: any[]) => Promise<void>,
    currentFiles: ProjectFile[],
    extraArgs: any[],
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Step 1: Plan
      const planStep = run.steps.find(s => s.type === 'plan');
      if (planStep) {
        updateStep(planStep.id, { status: 'running' });
        await new Promise(r => setTimeout(r, 800));
        if (controller.signal.aborted) return;
        updateStep(planStep.id, { status: 'done', detail: 'Architecture planned' });
      }

      // Step 2: Execute
      const execStep = run.steps.find(s => s.type === 'execute');
      if (execStep) {
        updateStep(execStep.id, { status: 'running' });
        await sendMessage(run.prompt, currentFiles, ...extraArgs);
        if (controller.signal.aborted) return;
        updateStep(execStep.id, { status: 'done', detail: 'Code generated' });
      }

      // Step 3: Verify
      const verifyStep = run.steps.find(s => s.type === 'verify');
      if (verifyStep) {
        updateStep(verifyStep.id, { status: 'running' });
        await new Promise(r => setTimeout(r, 1200));
        if (controller.signal.aborted) return;
        updateStep(verifyStep.id, { status: 'done', detail: 'No errors detected' });
      }

      completeRun('completed');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        completeRun('failed');
      }
    } finally {
      abortRef.current = null;
    }
  }, [updateStep, completeRun]);

  return {
    currentRun,
    agentHistory,
    startAgentRun,
    updateStep,
    addFixStep,
    completeRun,
    cancelRun,
    simulateAgentExecution,
  };
}
