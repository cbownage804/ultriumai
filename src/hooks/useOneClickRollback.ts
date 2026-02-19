import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface DeploySnapshot {
  id: string;
  version: string;
  files: ProjectFile[];
  deployedAt: Date;
  label: string;
  fileCount: number;
  diff?: { added: string[]; removed: string[]; modified: string[] };
}

export function useOneClickRollback() {
  const [snapshots, setSnapshots] = useState<DeploySnapshot[]>([]);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const captureSnapshot = useCallback((files: ProjectFile[], label: string) => {
    const snapshot: DeploySnapshot = {
      id: crypto.randomUUID(),
      version: `v${snapshots.length + 1}`,
      files: files.map(f => ({ ...f })),
      deployedAt: new Date(),
      label,
      fileCount: files.length,
    };
    setSnapshots(prev => [snapshot, ...prev].slice(0, 50));
    return snapshot;
  }, [snapshots.length]);

  const rollback = useCallback((snapshotId: string): ProjectFile[] | null => {
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return null;
    setIsRollingBack(true);
    setTimeout(() => setIsRollingBack(false), 500);
    return snapshot.files;
  }, [snapshots]);

  const getDiff = useCallback((snapshotId: string, currentFiles: ProjectFile[]) => {
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return null;
    const oldPaths = new Set(snapshot.files.map(f => f.path));
    const newPaths = new Set(currentFiles.map(f => f.path));
    return {
      added: currentFiles.filter(f => !oldPaths.has(f.path)).map(f => f.path),
      removed: snapshot.files.filter(f => !newPaths.has(f.path)).map(f => f.path),
      modified: currentFiles.filter(f => {
        const old = snapshot.files.find(o => o.path === f.path);
        return old && old.content !== f.content;
      }).map(f => f.path),
    };
  }, [snapshots]);

  return { snapshots, isRollingBack, captureSnapshot, rollback, getDiff };
}
