/**
 * usePlaybookRun — subscribes a component to a single playbook run.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  archiveRun as archive,
  getRun,
  pauseRun as pause,
  resumeRun as resume,
  toggleTask,
  type PlaybookRun,
} from '@/lib/ray/playbooks';
import type { RayTaskId } from '@/lib/ray/playbooks';

export function usePlaybookRun(id: string | undefined) {
  const [run, setRun] = useState<PlaybookRun | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const r = await getRun(id);
    setRun(r);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const advance = useCallback(
    async (taskId: RayTaskId) => {
      if (!run) return;
      const next = await toggleTask(run, taskId);
      setRun(next);
    },
    [run],
  );

  const doPause = useCallback(async () => {
    if (!run) return;
    await pause(run.id);
    setRun({ ...run, status: 'paused', paused_at: new Date().toISOString() });
  }, [run]);

  const doResume = useCallback(async () => {
    if (!run) return;
    await resume(run.id);
    setRun({ ...run, status: 'in_progress', paused_at: null });
  }, [run]);

  const doArchive = useCallback(async () => {
    if (!run) return;
    await archive(run.id);
    setRun({ ...run, status: 'archived', archived_at: new Date().toISOString() });
  }, [run]);

  return { run, loading, refresh, advance, pause: doPause, resume: doResume, archive: doArchive };
}
