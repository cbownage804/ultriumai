import { useState, useCallback } from 'react';
import type { BuildLogEntry } from '@/components/ai-builder/BuildLogPanel';

export function useBuildLog() {
  const [entries, setEntries] = useState<BuildLogEntry[]>([]);

  const addEntry = useCallback((type: BuildLogEntry['type'], message: string, duration?: number) => {
    setEntries(prev => [...prev.slice(-99), {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date(),
      duration,
    }]);
  }, []);

  const logBuildStart = useCallback((prompt: string) => {
    addEntry('step', `Build started: "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`);
    addEntry('info', 'Analyzing requirements...');
  }, [addEntry]);

  const logBuildPhase = useCallback((phase: string) => {
    const messages: Record<string, string> = {
      analyzing: '📋 Analyzing your request...',
      planning: '🏗️ Planning architecture...',
      writing: '✍️ Writing code...',
    };
    addEntry('info', messages[phase] || `Phase: ${phase}`);
  }, [addEntry]);

  const logBuildComplete = useCallback((fileCount: number, durationMs: number) => {
    addEntry('success', `✓ Build complete: ${fileCount} file${fileCount !== 1 ? 's' : ''} generated`, durationMs);
  }, [addEntry]);

  const logBuildError = useCallback((error: string) => {
    addEntry('error', `✗ Build failed: ${error}`);
  }, [addEntry]);

  const logFileWrite = useCallback((path: string) => {
    addEntry('info', `  → ${path}`);
  }, [addEntry]);

  const clear = useCallback(() => setEntries([]), []);

  return {
    entries,
    addEntry,
    logBuildStart,
    logBuildPhase,
    logBuildComplete,
    logBuildError,
    logFileWrite,
    clear,
  };
}
