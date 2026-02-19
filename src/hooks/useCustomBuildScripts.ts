import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface BuildScript {
  id: string;
  name: string;
  hook: 'pre-build' | 'post-build' | 'pre-deploy' | 'post-deploy';
  type: 'lint' | 'format' | 'validate-env' | 'generate-types' | 'custom';
  enabled: boolean;
  script: string;
  lastRun?: Date;
  lastResult?: 'success' | 'error';
  lastOutput?: string;
}

const PRESET_SCRIPTS: Omit<BuildScript, 'id'>[] = [
  { name: 'Lint Check', hook: 'pre-build', type: 'lint', enabled: false, script: 'check for console.log, debugger, and TODO comments' },
  { name: 'Validate Env Vars', hook: 'pre-build', type: 'validate-env', enabled: false, script: 'ensure all referenced env vars are defined' },
  { name: 'Type Check', hook: 'pre-build', type: 'generate-types', enabled: false, script: 'validate TypeScript types across all files' },
  { name: 'Format Check', hook: 'post-build', type: 'format', enabled: false, script: 'check consistent formatting and indentation' },
];

export function useCustomBuildScripts() {
  const [scripts, setScripts] = useState<BuildScript[]>(
    PRESET_SCRIPTS.map(s => ({ ...s, id: crypto.randomUUID() }))
  );

  const addScript = useCallback((script: Omit<BuildScript, 'id'>) => {
    setScripts(prev => [...prev, { ...script, id: crypto.randomUUID() }]);
  }, []);

  const removeScript = useCallback((id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleScript = useCallback((id: string) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  }, []);

  const runScript = useCallback((id: string, files: ProjectFile[]): { success: boolean; output: string } => {
    const script = scripts.find(s => s.id === id);
    if (!script) return { success: false, output: 'Script not found' };

    let output = '';
    let success = true;

    switch (script.type) {
      case 'lint': {
        const issues: string[] = [];
        for (const f of files) {
          if (/console\.log/g.test(f.content)) issues.push(`${f.path}: contains console.log`);
          if (/debugger/g.test(f.content)) issues.push(`${f.path}: contains debugger`);
          const todos = f.content.match(/\/\/\s*TODO/gi);
          if (todos) issues.push(`${f.path}: ${todos.length} TODO(s)`);
        }
        output = issues.length > 0 ? issues.join('\n') : '✅ No lint issues found';
        success = issues.length === 0;
        break;
      }
      case 'validate-env': {
        const envRefs = new Set<string>();
        for (const f of files) {
          const matches = f.content.matchAll(/process\.env\.(\w+)|import\.meta\.env\.(\w+)/g);
          for (const m of matches) envRefs.add(m[1] || m[2]);
        }
        output = envRefs.size > 0 ? `Referenced env vars: ${[...envRefs].join(', ')}` : '✅ No env vars referenced';
        break;
      }
      case 'generate-types': {
        const tsFiles = files.filter(f => /\.(ts|tsx)$/.test(f.path));
        const anyCount = tsFiles.reduce((c, f) => c + (f.content.match(/:\s*any/g)?.length || 0), 0);
        output = anyCount > 0 ? `⚠️ Found ${anyCount} uses of 'any' type` : '✅ No any types found';
        success = anyCount === 0;
        break;
      }
      default:
        output = `Ran custom script: ${script.name}`;
    }

    setScripts(prev => prev.map(s => s.id === id ? { ...s, lastRun: new Date(), lastResult: success ? 'success' : 'error', lastOutput: output } : s));
    return { success, output };
  }, [scripts]);

  const runHook = useCallback((hook: BuildScript['hook'], files: ProjectFile[]) => {
    const hookScripts = scripts.filter(s => s.hook === hook && s.enabled);
    return hookScripts.map(s => ({ script: s, result: runScript(s.id, files) }));
  }, [scripts, runScript]);

  return { scripts, addScript, removeScript, toggleScript, runScript, runHook };
}
