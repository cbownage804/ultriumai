import { useState, useCallback } from 'react';

export interface WorkflowConfig {
  name: string;
  trigger: 'push' | 'pull_request' | 'schedule' | 'manual';
  branch: string;
  steps: WorkflowStep[];
  schedule?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'checkout' | 'setup-node' | 'install' | 'lint' | 'test' | 'build' | 'deploy' | 'lighthouse' | 'notify-slack' | 'custom';
  enabled: boolean;
  config?: Record<string, string>;
}

const DEFAULT_STEPS: WorkflowStep[] = [
  { id: '1', name: 'Checkout', type: 'checkout', enabled: true },
  { id: '2', name: 'Setup Node.js', type: 'setup-node', enabled: true, config: { nodeVersion: '20' } },
  { id: '3', name: 'Install Dependencies', type: 'install', enabled: true },
  { id: '4', name: 'Lint', type: 'lint', enabled: true },
  { id: '5', name: 'Run Tests', type: 'test', enabled: true },
  { id: '6', name: 'Build', type: 'build', enabled: true },
  { id: '7', name: 'Lighthouse Audit', type: 'lighthouse', enabled: false },
  { id: '8', name: 'Deploy', type: 'deploy', enabled: false },
  { id: '9', name: 'Notify Slack', type: 'notify-slack', enabled: false },
];

export function useGitHubActionsGenerator() {
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([
    { name: 'CI', trigger: 'push', branch: 'main', steps: DEFAULT_STEPS },
  ]);

  const generateYAML = useCallback((wf: WorkflowConfig): string => {
    const lines: string[] = [];
    lines.push(`name: ${wf.name}`);
    lines.push('');
    lines.push('on:');
    if (wf.trigger === 'push') lines.push(`  push:\n    branches: [${wf.branch}]`);
    else if (wf.trigger === 'pull_request') lines.push(`  pull_request:\n    branches: [${wf.branch}]`);
    else if (wf.trigger === 'schedule') lines.push(`  schedule:\n    - cron: '${wf.schedule || '0 0 * * *'}'`);
    else if (wf.trigger === 'manual') lines.push('  workflow_dispatch:');
    lines.push('');
    lines.push('jobs:');
    lines.push('  build:');
    lines.push('    runs-on: ubuntu-latest');
    lines.push('    steps:');

    wf.steps.filter(s => s.enabled).forEach(step => {
      switch (step.type) {
        case 'checkout':
          lines.push('      - uses: actions/checkout@v4');
          break;
        case 'setup-node':
          lines.push(`      - uses: actions/setup-node@v4\n        with:\n          node-version: '${step.config?.nodeVersion || '20'}'\n          cache: 'npm'`);
          break;
        case 'install':
          lines.push('      - run: npm ci');
          break;
        case 'lint':
          lines.push('      - run: npm run lint');
          break;
        case 'test':
          lines.push('      - run: npm test');
          break;
        case 'build':
          lines.push('      - run: npm run build');
          break;
        case 'lighthouse':
          lines.push('      - name: Lighthouse Audit\n        uses: treosh/lighthouse-ci-action@v11\n        with:\n          urls: |\n            ${{ env.DEPLOY_URL }}\n          budgetPath: ./budget.json');
          break;
        case 'deploy':
          lines.push('      - name: Deploy\n        run: |\n          echo "Deploying to production..."\n          # Add your deployment command here');
          break;
        case 'notify-slack':
          lines.push('      - name: Notify Slack\n        if: always()\n        uses: 8398a7/action-slack@v3\n        with:\n          status: ${{ job.status }}\n          fields: repo,message,commit,author\n        env:\n          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}');
          break;
        case 'custom':
          lines.push(`      - name: ${step.name}\n        run: ${step.config?.command || 'echo "custom step"'}`);
          break;
      }
    });

    return lines.join('\n');
  }, []);

  const addWorkflow = useCallback((name: string, trigger: WorkflowConfig['trigger']) => {
    setWorkflows(prev => [...prev, { name, trigger, branch: 'main', steps: [...DEFAULT_STEPS] }]);
  }, []);

  const updateWorkflow = useCallback((index: number, updates: Partial<WorkflowConfig>) => {
    setWorkflows(prev => prev.map((w, i) => i === index ? { ...w, ...updates } : w));
  }, []);

  const toggleStep = useCallback((wfIndex: number, stepId: string) => {
    setWorkflows(prev => prev.map((w, i) => i === wfIndex ? { ...w, steps: w.steps.map(s => s.id === stepId ? { ...s, enabled: !s.enabled } : s) } : w));
  }, []);

  const removeWorkflow = useCallback((index: number) => {
    setWorkflows(prev => prev.filter((_, i) => i !== index));
  }, []);

  return { workflows, addWorkflow, updateWorkflow, removeWorkflow, toggleStep, generateYAML };
}
