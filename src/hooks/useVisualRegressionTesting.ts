import { useState, useCallback } from 'react';

export interface Snapshot {
  id: string;
  pagePath: string;
  label: string;
  timestamp: Date;
  imageDataUrl: string;
  viewport: { width: number; height: number };
}

export interface DiffResult {
  id: string;
  baselineId: string;
  currentId: string;
  pagePath: string;
  diffPercentage: number;
  status: 'pass' | 'fail' | 'new';
  changedPixels: number;
  totalPixels: number;
  timestamp: Date;
}

export function useVisualRegressionTesting() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [diffs, setDiffs] = useState<DiffResult[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [threshold, setThreshold] = useState(0.5); // % difference threshold

  const captureSnapshot = useCallback((pagePath: string, label: string, viewport = { width: 1280, height: 720 }): Snapshot => {
    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      pagePath,
      label,
      timestamp: new Date(),
      imageDataUrl: '', // Would be populated by actual screenshot capture
      viewport,
    };
    setSnapshots(prev => [snapshot, ...prev].slice(0, 200));
    return snapshot;
  }, []);

  const compareSnapshots = useCallback((baselineId: string, currentId: string): DiffResult => {
    const baseline = snapshots.find(s => s.id === baselineId);
    const current = snapshots.find(s => s.id === currentId);
    const simulatedDiff = Math.random() * 5;
    const totalPixels = (baseline?.viewport.width || 1280) * (baseline?.viewport.height || 720);
    const changedPixels = Math.round(totalPixels * (simulatedDiff / 100));

    const diff: DiffResult = {
      id: crypto.randomUUID(),
      baselineId,
      currentId,
      pagePath: current?.pagePath || baseline?.pagePath || '/',
      diffPercentage: Math.round(simulatedDiff * 100) / 100,
      status: simulatedDiff > threshold ? 'fail' : 'pass',
      changedPixels,
      totalPixels,
      timestamp: new Date(),
    };
    setDiffs(prev => [diff, ...prev].slice(0, 100));
    return diff;
  }, [snapshots, threshold]);

  const runFullSuite = useCallback((pages: string[]) => {
    setIsCapturing(true);
    const results: DiffResult[] = pages.map(page => {
      const existing = snapshots.filter(s => s.pagePath === page).slice(0, 2);
      if (existing.length >= 2) {
        return compareSnapshots(existing[1].id, existing[0].id);
      }
      const snap = captureSnapshot(page, 'auto');
      return { id: crypto.randomUUID(), baselineId: snap.id, currentId: snap.id, pagePath: page, diffPercentage: 0, status: 'new' as const, changedPixels: 0, totalPixels: 921600, timestamp: new Date() };
    });
    setDiffs(prev => [...results, ...prev].slice(0, 100));
    setIsCapturing(false);
    return results;
  }, [snapshots, compareSnapshots, captureSnapshot]);

  const approveBaseline = useCallback((snapshotId: string) => {
    setSnapshots(prev => prev.map(s => s.id === snapshotId ? { ...s, label: `baseline-${s.label}` } : s));
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  }, []);

  return { snapshots, diffs, isCapturing, threshold, setThreshold, captureSnapshot, compareSnapshots, runFullSuite, approveBaseline, deleteSnapshot };
}
