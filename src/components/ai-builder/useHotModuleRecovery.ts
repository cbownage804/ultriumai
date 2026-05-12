import { useCallback, useRef } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { BuildLogEntry } from './BuildLogPanel';
import { hasUserGeneratedFiles } from './goldenTemplate';

/**
 * Hot Module Recovery: When the preview iframe crashes (unresponsive or white-screen),
 * automatically roll back to the last known-good snapshot.
 *
 * Safety rule: we ONLY snapshot / restore states that contain user-generated content.
 * Rolling back to the empty golden scaffold would silently destroy the user's work
 * (e.g. wipe a generated barbershop site back to "Welcome to your app").
 */
export function useHotModuleRecovery(
  addBuildLogEntry: (type: BuildLogEntry['type'], message: string) => void,
) {
  const lastGoodSnapshot = useRef<ProjectFile[] | null>(null);
  const crashCount = useRef(0);
  const MAX_CRASHES_BEFORE_ROLLBACK = 2;

  /** Mark the current files as "known good" (call after a successful preview render). */
  const markAsGood = useCallback((files: ProjectFile[]) => {
    // Refuse to snapshot the empty golden welcome — restoring it would wipe user work.
    if (files.length > 0 && hasUserGeneratedFiles(files)) {
      lastGoodSnapshot.current = files.map(f => ({ ...f }));
      crashCount.current = 0;
    }
  }, []);

  /** Report a crash. Returns the rollback files if threshold exceeded, or null. */
  const reportCrash = useCallback((errorMessage: string): ProjectFile[] | null => {
    crashCount.current += 1;
    addBuildLogEntry('error', `🔥 Preview crash #${crashCount.current}: ${errorMessage.slice(0, 120)}`);

    if (
      crashCount.current >= MAX_CRASHES_BEFORE_ROLLBACK &&
      lastGoodSnapshot.current &&
      hasUserGeneratedFiles(lastGoodSnapshot.current)
    ) {
      addBuildLogEntry('info', `🔄 Auto-rolling back to last working snapshot (${lastGoodSnapshot.current.length} files)`);
      crashCount.current = 0;
      return lastGoodSnapshot.current;
    }
    return null;
  }, [addBuildLogEntry]);

  /** Check if an iframe appears crashed (blank body or unresponsive). */
  const checkIframeHealth = useCallback((iframe: HTMLIFrameElement | null): boolean => {
    if (!iframe) return false;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return false;
      const body = doc.body;
      if (!body) return false;
      // A blank or nearly-blank body means something went wrong
      return body.innerHTML.trim().length > 10;
    } catch {
      // Cross-origin or security error — can't check
      return true;
    }
  }, []);

  return { markAsGood, reportCrash, checkIframeHealth };
}
