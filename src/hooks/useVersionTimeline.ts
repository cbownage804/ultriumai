import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface TimelineSnapshot {
  id: string;
  label: string;
  files: ProjectFile[];
  timestamp: Date;
  messageId?: string;
  type: 'auto' | 'manual' | 'ai-generation' | 'revert';
}

/**
 * Enhanced version history with timeline slider support.
 * Stores snapshots and allows navigating between them.
 */
export function useVersionTimeline() {
  const [snapshots, setSnapshots] = useState<TimelineSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPreviewingHistory, setIsPreviewingHistory] = useState(false);

  const addSnapshot = useCallback((label: string, files: ProjectFile[], type: TimelineSnapshot['type'] = 'auto', messageId?: string) => {
    if (files.length === 0) return;
    const snapshot: TimelineSnapshot = {
      id: crypto.randomUUID(),
      label,
      files: files.map(f => ({ ...f })),
      timestamp: new Date(),
      messageId,
      type,
    };
    setSnapshots(prev => {
      const newSnapshots = [...prev, snapshot].slice(-50); // Keep last 50
      return newSnapshots;
    });
    setCurrentIndex(prev => prev + 1);
  }, []);

  const navigateToSnapshot = useCallback((index: number): ProjectFile[] | null => {
    if (index < 0 || index >= snapshots.length) return null;
    setCurrentIndex(index);
    setIsPreviewingHistory(true);
    return snapshots[index].files;
  }, [snapshots]);

  const exitHistoryPreview = useCallback(() => {
    setIsPreviewingHistory(false);
    setCurrentIndex(snapshots.length - 1);
  }, [snapshots.length]);

  const getSnapshotDiff = useCallback((index: number): { added: string[]; removed: string[]; modified: string[] } => {
    if (index <= 0 || index >= snapshots.length) return { added: [], removed: [], modified: [] };
    const prev = snapshots[index - 1];
    const curr = snapshots[index];

    const prevPaths = new Set(prev.files.map(f => f.path));
    const currPaths = new Set(curr.files.map(f => f.path));

    const added = curr.files.filter(f => !prevPaths.has(f.path)).map(f => f.path);
    const removed = prev.files.filter(f => !currPaths.has(f.path)).map(f => f.path);
    const modified = curr.files
      .filter(f => prevPaths.has(f.path))
      .filter(f => {
        const prevFile = prev.files.find(pf => pf.path === f.path);
        return prevFile && prevFile.content !== f.content;
      })
      .map(f => f.path);

    return { added, removed, modified };
  }, [snapshots]);

  return {
    snapshots,
    currentIndex,
    isPreviewingHistory,
    addSnapshot,
    navigateToSnapshot,
    exitHistoryPreview,
    getSnapshotDiff,
    totalSnapshots: snapshots.length,
  };
}
