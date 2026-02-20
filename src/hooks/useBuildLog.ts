import { useState, useCallback } from 'react';
import type { BuildLogEntry } from '@/components/ai-builder/BuildLogPanel';

/** Phase 107: Translate raw build log output into user-friendly messages */
function friendlyMessage(type: BuildLogEntry['type'], message: string): string {
  // Strip emoji prefixes for re-formatting
  const clean = message.replace(/^[📋🏗️✍️✓✗→\s]+/, '').trim();

  // Build complete messages
  const completeMatch = clean.match(/Build complete:\s*(\d+)\s*file/i);
  if (completeMatch) {
    return `✅ Generated ${completeMatch[1]} file${parseInt(completeMatch[1]) !== 1 ? 's' : ''} successfully`;
  }

  // Build analytics
  const analyticsMatch = clean.match(/\[Build Analytics\]\s*(\d+)\s*files?\s*generated,\s*(\d+)\s*patched.*?build:\s*(\d+)ms/i);
  if (analyticsMatch) {
    const [, generated, patched, ms] = analyticsMatch;
    const time = parseInt(ms) >= 1000 ? `${(parseInt(ms) / 1000).toFixed(1)}s` : `${ms}ms`;
    const parts = [];
    if (parseInt(generated) > 0) parts.push(`${generated} file${parseInt(generated) !== 1 ? 's' : ''} generated`);
    if (parseInt(patched) > 0) parts.push(`${patched} patched`);
    return `✅ ${parts.join(', ')} (${time})`;
  }

  // Build failed
  if (/Build failed/i.test(clean)) {
    return `❌ ${clean.replace(/^Build failed:\s*/i, 'Build failed: ')}`;
  }

  // File write
  if (clean.startsWith('→') || clean.match(/^\s*→/)) {
    return `📄 ${clean.replace(/^→\s*/, 'Wrote ')}`;
  }

  // Phase messages
  if (/analyzing/i.test(clean)) return '🔍 Analyzing your request...';
  if (/planning/i.test(clean)) return '📐 Planning architecture...';
  if (/writing/i.test(clean)) return '✏️ Writing code...';

  // Build started
  const startMatch = clean.match(/^Build started:\s*"(.+)"/i);
  if (startMatch) return `🚀 Building: "${startMatch[1]}"`;

  return message;
}

export function useBuildLog() {
  const [entries, setEntries] = useState<BuildLogEntry[]>([]);

  const addEntry = useCallback((type: BuildLogEntry['type'], message: string, duration?: number) => {
    setEntries(prev => [...prev.slice(-99), {
      id: crypto.randomUUID(),
      type,
      message: friendlyMessage(type, message),
      timestamp: new Date(),
      duration,
    }]);
  }, []);

  const logBuildStart = useCallback((prompt: string) => {
    addEntry('step', `Build started: "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`);
  }, [addEntry]);

  const logBuildPhase = useCallback((phase: string) => {
    addEntry('info', phase);
  }, [addEntry]);

  const logBuildComplete = useCallback((fileCount: number, durationMs: number) => {
    addEntry('success', `Build complete: ${fileCount} file${fileCount !== 1 ? 's' : ''} generated`, durationMs);
  }, [addEntry]);

  const logBuildError = useCallback((error: string) => {
    addEntry('error', `Build failed: ${error}`);
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
