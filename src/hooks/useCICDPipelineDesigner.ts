import { useState, useCallback } from 'react';

export interface PipelineStage {
  id: string;
  name: string;
  type: 'lint' | 'test' | 'build' | 'deploy' | 'security' | 'notify' | 'custom';
  enabled: boolean;
  dependsOn: string[];
  env: Record<string, string>;
  command: string;
  timeout: number;
  retries: number;
}

export interface Pipeline {
  id: string;
  name: string;
  trigger: 'push' | 'pull_request' | 'tag' | 'schedule' | 'manual';
  branch: string;
  stages: PipelineStage[];
  runner: string;
  cacheEnabled: boolean;
  artifactPaths: string[];
}

const DEFAULT_STAGES: Omit<PipelineStage, 'id'>[] = [
  { name: 'Lint', type: 'lint', enabled: true, dependsOn: [], env: {}, command: 'npm run lint', timeout: 300, retries: 0 },
  { name: 'Unit Tests', type: 'test', enabled: true, dependsOn: ['Lint'], env: {}, command: 'npm test -- --coverage', timeout: 600, retries: 1 },
  { name: 'Build', type: 'build', enabled: true, dependsOn: ['Unit Tests'], env: { NODE_ENV: 'production' }, command: 'npm run build', timeout: 600, retries: 0 },
  { name: 'Security Scan', type: 'security', enabled: false, dependsOn: ['Build'], env: {}, command: 'npm audit --audit-level=high', timeout: 300, retries: 0 },
  { name: 'Deploy', type: 'deploy', enabled: false, dependsOn: ['Build'], env: {}, command: 'echo "Deploy step"', timeout: 900, retries: 1 },
  { name: 'Notify', type: 'notify', enabled: false, dependsOn: ['Deploy'], env: {}, command: 'echo "Sending notification"', timeout: 60, retries: 0 },
];

export function useCICDPipelineDesigner() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    {
      id: crypto.randomUUID(),
      name: 'CI Pipeline',
      trigger: 'push',
      branch: 'main',
      stages: DEFAULT_STAGES.map(s => ({ ...s, id: crypto.randomUUID() })),
      runner: 'ubuntu-latest',
      cacheEnabled: true,
      artifactPaths: ['dist/', 'coverage/'],
    },
  ]);
  const [activePipelineId, setActivePipelineId] = useState<string>(pipelines[0]?.id || '');

  const getActivePipeline = useCallback(() => pipelines.find(p => p.id === activePipelineId) || null, [pipelines, activePipelineId]);

  const createPipeline = useCallback((name: string) => {
    const p: Pipeline = {
      id: crypto.randomUUID(), name, trigger: 'push', branch: 'main',
      stages: DEFAULT_STAGES.map(s => ({ ...s, id: crypto.randomUUID() })),
      runner: 'ubuntu-latest', cacheEnabled: true, artifactPaths: [],
    };
    setPipelines(prev => [...prev, p]);
    setActivePipelineId(p.id);
  }, []);

  const deletePipeline = useCallback((id: string) => {
    setPipelines(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePipeline = useCallback((id: string, updates: Partial<Pipeline>) => {
    setPipelines(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const addStage = useCallback((pipelineId: string, name: string, type: PipelineStage['type']) => {
    setPipelines(prev => prev.map(p => p.id === pipelineId ? {
      ...p, stages: [...p.stages, { id: crypto.randomUUID(), name, type, enabled: true, dependsOn: [], env: {}, command: `echo "${name}"`, timeout: 300, retries: 0 }]
    } : p));
  }, []);

  const removeStage = useCallback((pipelineId: string, stageId: string) => {
    setPipelines(prev => prev.map(p => p.id === pipelineId ? { ...p, stages: p.stages.filter(s => s.id !== stageId) } : p));
  }, []);

  const toggleStage = useCallback((pipelineId: string, stageId: string) => {
    setPipelines(prev => prev.map(p => p.id === pipelineId ? {
      ...p, stages: p.stages.map(s => s.id === stageId ? { ...s, enabled: !s.enabled } : s)
    } : p));
  }, []);

  const generateGitHubActions = useCallback((pipeline: Pipeline): string => {
    const lines: string[] = [];
    lines.push(`name: ${pipeline.name}`);
    lines.push('');
    lines.push('on:');
    if (pipeline.trigger === 'push') lines.push(`  push:\n    branches: [${pipeline.branch}]`);
    else if (pipeline.trigger === 'pull_request') lines.push(`  pull_request:\n    branches: [${pipeline.branch}]`);
    else if (pipeline.trigger === 'tag') lines.push(`  push:\n    tags: ['v*']`);
    else if (pipeline.trigger === 'schedule') lines.push(`  schedule:\n    - cron: '0 0 * * *'`);
    else lines.push('  workflow_dispatch:');
    lines.push('');
    lines.push('jobs:');

    const enabledStages = pipeline.stages.filter(s => s.enabled);
    enabledStages.forEach(stage => {
      const jobId = stage.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      lines.push(`  ${jobId}:`);
      lines.push(`    runs-on: ${pipeline.runner}`);
      if (stage.timeout) lines.push(`    timeout-minutes: ${Math.ceil(stage.timeout / 60)}`);
      const deps = stage.dependsOn.map(d => {
        const dep = enabledStages.find(s => s.name === d);
        return dep ? dep.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;
      }).filter(Boolean);
      if (deps.length > 0) lines.push(`    needs: [${deps.join(', ')}]`);
      if (Object.keys(stage.env).length > 0) {
        lines.push(`    env:`);
        Object.entries(stage.env).forEach(([k, v]) => lines.push(`      ${k}: "${v}"`));
      }
      lines.push(`    steps:`);
      lines.push(`      - uses: actions/checkout@v4`);
      lines.push(`      - uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n          cache: 'npm'`);
      if (pipeline.cacheEnabled) {
        lines.push(`      - uses: actions/cache@v4\n        with:\n          path: node_modules\n          key: \${{ runner.os }}-node-\${{ hashFiles('package-lock.json') }}`);
      }
      lines.push(`      - run: npm ci`);
      lines.push(`      - name: ${stage.name}\n        run: ${stage.command}`);
      if (stage.retries > 0) lines.push(`        continue-on-error: true`);
      lines.push('');
    });

    if (pipeline.artifactPaths.length > 0) {
      lines.push(`      - uses: actions/upload-artifact@v4\n        with:\n          name: build-artifacts\n          path: |\n${pipeline.artifactPaths.map(p => `            ${p}`).join('\n')}`);
    }

    return lines.join('\n');
  }, []);

  return { pipelines, activePipelineId, setActivePipelineId, getActivePipeline, createPipeline, deletePipeline, updatePipeline, addStage, removeStage, toggleStage, generateGitHubActions };
}
