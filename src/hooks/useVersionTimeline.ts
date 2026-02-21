import { useState, useCallback, useEffect, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface TimelineSnapshot {
  id: string;
  label: string;
  files: ProjectFile[];
  timestamp: Date;
  messageId?: string;
  type: 'auto' | 'manual' | 'ai-generation' | 'revert';
  commitMessage?: string;
}

const IDB_NAME = 'ai-builder-versions';
const IDB_STORE = 'snapshots';
const IDB_VERSION = 1;
const MAX_IDB_VERSIONS = 50;

/** Phase 84: Persist version snapshots to IndexedDB */
function openVersionDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveSnapshotsToIDB(snapshots: TimelineSnapshot[]): Promise<void> {
  try {
    const db = await openVersionDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    // Only persist the last MAX_IDB_VERSIONS
    const toSave = snapshots.slice(-MAX_IDB_VERSIONS);
    for (const snap of toSave) {
      store.put({
        ...snap,
        timestamp: snap.timestamp.toISOString(),
      });
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch (err) {
    console.warn('[VersionTimeline] IDB save failed:', err);
  }
}

async function loadSnapshotsFromIDB(): Promise<TimelineSnapshot[]> {
  try {
    const db = await openVersionDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        db.close();
        const results = (req.result || []).map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
        // Sort by timestamp, keep last 20
        results.sort((a: TimelineSnapshot, b: TimelineSnapshot) => a.timestamp.getTime() - b.timestamp.getTime());
        resolve(results.slice(-20));
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return [];
  }
}

/**
 * Enhanced version history with timeline slider support.
 * Phase 84: Persists snapshots to IndexedDB across page reloads.
 */
export function useVersionTimeline() {
  const [snapshots, setSnapshots] = useState<TimelineSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPreviewingHistory, setIsPreviewingHistory] = useState(false);
  const saveDebounce = useRef<ReturnType<typeof setTimeout>>();
  const initialized = useRef(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadSnapshotsFromIDB().then(loaded => {
      if (loaded.length > 0) {
        setSnapshots(loaded);
        setCurrentIndex(loaded.length - 1);
      }
    });
  }, []);

  // Debounced save to IndexedDB when snapshots change
  useEffect(() => {
    if (snapshots.length === 0) return;
    clearTimeout(saveDebounce.current);
    saveDebounce.current = setTimeout(() => {
      saveSnapshotsToIDB(snapshots);
    }, 2000);
    return () => clearTimeout(saveDebounce.current);
  }, [snapshots]);

  const addSnapshot = useCallback((label: string, files: ProjectFile[], type: TimelineSnapshot['type'] = 'auto', messageId?: string, commitMessage?: string) => {
    if (files.length === 0) return;
    const snapshot: TimelineSnapshot = {
      id: crypto.randomUUID(),
      label,
      files: files.map(f => ({ ...f })),
      timestamp: new Date(),
      messageId,
      type,
      commitMessage,
    };
    setSnapshots(prev => {
      const newSnapshots = [...prev, snapshot].slice(-50);
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
