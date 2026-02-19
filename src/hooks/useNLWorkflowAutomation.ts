import { useState, useCallback } from 'react';

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'loop';
  name: string;
  config: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isActive: boolean;
  lastRun?: string;
  runCount: number;
}

export function useNLWorkflowAutomation() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1', name: 'Auto-deploy on push', description: 'Build and deploy when code is pushed to main',
      steps: [
        { id: 's1', type: 'trigger', name: 'Git Push to main', config: { branch: 'main' } },
        { id: 's2', type: 'action', name: 'Run Tests', config: { command: 'npm test' } },
        { id: 's3', type: 'condition', name: 'Tests Pass?', config: { field: 'exitCode', operator: '==', value: '0' } },
        { id: 's4', type: 'action', name: 'Deploy to Production', config: { target: 'production' } },
      ],
      isActive: true, runCount: 12,
    },
  ]);
  const [nlPrompt, setNlPrompt] = useState('');

  const addWorkflow = useCallback((name: string, description: string) => {
    setWorkflows(prev => [...prev, {
      id: crypto.randomUUID(), name, description, steps: [], isActive: false, runCount: 0,
    }]);
  }, []);

  const removeWorkflow = useCallback((id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  }, []);

  const toggleWorkflow = useCallback((id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
  }, []);

  const addStep = useCallback((workflowId: string, step: Omit<WorkflowStep, 'id'>) => {
    setWorkflows(prev => prev.map(w =>
      w.id === workflowId ? { ...w, steps: [...w.steps, { ...step, id: crypto.randomUUID() }] } : w
    ));
  }, []);

  const removeStep = useCallback((workflowId: string, stepId: string) => {
    setWorkflows(prev => prev.map(w =>
      w.id === workflowId ? { ...w, steps: w.steps.filter(s => s.id !== stepId) } : w
    ));
  }, []);

  const generateFromNL = useCallback((prompt: string) => {
    const wf: Workflow = {
      id: crypto.randomUUID(),
      name: prompt.slice(0, 50),
      description: prompt,
      steps: [
        { id: crypto.randomUUID(), type: 'trigger', name: 'Manual Trigger', config: {} },
        { id: crypto.randomUUID(), type: 'action', name: 'Execute: ' + prompt.slice(0, 30), config: { prompt } },
      ],
      isActive: false, runCount: 0,
    };
    setWorkflows(prev => [...prev, wf]);
    return wf;
  }, []);

  const generateCode = useCallback(() => {
    return `// Workflow Automation Engine
interface WorkflowStep {
  type: 'trigger' | 'action' | 'condition' | 'loop';
  name: string;
  config: Record<string, any>;
  execute: (ctx: Record<string, any>) => Promise<any>;
}

export class WorkflowEngine {
  private steps: WorkflowStep[] = [];

  addStep(step: WorkflowStep) { this.steps.push(step); }

  async run(initialCtx: Record<string, any> = {}) {
    let ctx = { ...initialCtx };
    for (const step of this.steps) {
      if (step.type === 'condition') {
        const result = await step.execute(ctx);
        if (!result) break;
      } else {
        ctx = { ...ctx, ...(await step.execute(ctx)) };
      }
    }
    return ctx;
  }
}
`;
  }, []);

  return {
    workflows, nlPrompt, setNlPrompt,
    addWorkflow, removeWorkflow, toggleWorkflow,
    addStep, removeStep, generateFromNL, generateCode,
  };
}
