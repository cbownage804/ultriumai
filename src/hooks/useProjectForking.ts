/**
 * Phase 118: Project Transfer & Forking
 * One-click fork a project, transfer ownership with audit trail.
 */
import { useCallback, useState } from 'react';

export interface ForkRecord {
  id: string;
  originalProjectId: string;
  originalProjectName: string;
  forkedProjectId: string;
  forkedProjectName: string;
  forkedBy: string;
  forkedAt: Date;
  includeHistory: boolean;
  fileCount: number;
}

export interface TransferRecord {
  id: string;
  projectId: string;
  projectName: string;
  fromUserId: string;
  fromEmail: string;
  toUserId: string;
  toEmail: string;
  transferredAt: Date;
  reason?: string;
}

export function useProjectForking() {
  const [forks, setForks] = useState<ForkRecord[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);

  const forkProject = useCallback((
    originalId: string,
    originalName: string,
    files: { path: string; content: string }[],
    includeHistory = false,
  ): ForkRecord => {
    const fork: ForkRecord = {
      id: crypto.randomUUID(),
      originalProjectId: originalId,
      originalProjectName: originalName,
      forkedProjectId: crypto.randomUUID(),
      forkedProjectName: `${originalName} (Fork)`,
      forkedBy: 'You',
      forkedAt: new Date(),
      includeHistory,
      fileCount: files.length,
    };
    setForks(prev => [fork, ...prev]);
    return fork;
  }, []);

  const transferProject = useCallback((
    projectId: string,
    projectName: string,
    toEmail: string,
    reason?: string,
  ): TransferRecord => {
    const transfer: TransferRecord = {
      id: crypto.randomUUID(),
      projectId, projectName,
      fromUserId: 'self',
      fromEmail: 'you@example.com',
      toUserId: 'target',
      toEmail,
      transferredAt: new Date(),
      reason,
    };
    setTransfers(prev => [transfer, ...prev]);
    return transfer;
  }, []);

  const getForksOf = useCallback((projectId: string) => {
    return forks.filter(f => f.originalProjectId === projectId);
  }, [forks]);

  const isFork = useCallback((projectId: string) => {
    return forks.some(f => f.forkedProjectId === projectId);
  }, [forks]);

  const getOriginal = useCallback((forkedProjectId: string) => {
    return forks.find(f => f.forkedProjectId === forkedProjectId);
  }, [forks]);

  return {
    forks,
    transfers,
    forkProject,
    transferProject,
    getForksOf,
    isFork,
    getOriginal,
  };
}
