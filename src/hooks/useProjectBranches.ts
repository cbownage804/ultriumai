/**
 * Wave 15: Git-Style Experiment Branches
 * Snapshot, switch, and merge project states using IndexedDB.
 */

import { useState, useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface ProjectBranch {
  id: string;
  name: string;
  files: ProjectFile[];
  createdAt: number;
  parentBranchId: string | null;
  description?: string;
}

const DB_NAME = 'ai-builder-branches';
const STORE_NAME = 'branches';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveBranch(branch: ProjectBranch): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(branch);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadAllBranches(): Promise<ProjectBranch[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteBranchFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function useProjectBranches() {
  const [branches, setBranches] = useState<ProjectBranch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentFilesRef = useRef<ProjectFile[]>([]);

  /** Load branches from IndexedDB. */
  const loadBranches = useCallback(async () => {
    try {
      const loaded = await loadAllBranches();
      setBranches(loaded.sort((a, b) => b.createdAt - a.createdAt));
      setIsLoaded(true);
    } catch { /* ignore */ }
  }, []);

  /** Create a new branch from current state. */
  const createBranch = useCallback(async (
    name: string,
    currentFiles: ProjectFile[],
    description?: string,
  ): Promise<ProjectBranch> => {
    const branch: ProjectBranch = {
      id: crypto.randomUUID(),
      name,
      files: currentFiles.map(f => ({ ...f })),
      createdAt: Date.now(),
      parentBranchId: activeBranchId,
      description,
    };
    await saveBranch(branch);
    setBranches(prev => [branch, ...prev]);
    return branch;
  }, [activeBranchId]);

  /** Switch to a branch — returns the branch's files. */
  const switchBranch = useCallback(async (
    branchId: string,
    currentFiles: ProjectFile[],
  ): Promise<ProjectFile[] | null> => {
    // Auto-save current state before switching
    if (activeBranchId) {
      const existing = branches.find(b => b.id === activeBranchId);
      if (existing) {
        existing.files = currentFiles.map(f => ({ ...f }));
        await saveBranch(existing);
      }
    }

    const target = branches.find(b => b.id === branchId);
    if (!target) return null;

    setActiveBranchId(branchId);
    currentFilesRef.current = target.files;
    return target.files;
  }, [activeBranchId, branches]);

  /** Delete a branch. */
  const deleteBranch = useCallback(async (branchId: string) => {
    if (branchId === activeBranchId) return; // Can't delete active
    await deleteBranchFromDB(branchId);
    setBranches(prev => prev.filter(b => b.id !== branchId));
  }, [activeBranchId]);

  /** Return to main (no branch). */
  const exitBranch = useCallback(async (currentFiles: ProjectFile[]) => {
    // Save current branch state
    if (activeBranchId) {
      const existing = branches.find(b => b.id === activeBranchId);
      if (existing) {
        existing.files = currentFiles.map(f => ({ ...f }));
        await saveBranch(existing);
      }
    }
    setActiveBranchId(null);
  }, [activeBranchId, branches]);

  /** Compare two branches — returns files that differ. */
  const compareBranches = useCallback((branchA: string, branchB: string): {
    added: string[];
    removed: string[];
    modified: string[];
  } => {
    const a = branches.find(b => b.id === branchA);
    const b = branches.find(b2 => b2.id === branchB);
    if (!a || !b) return { added: [], removed: [], modified: [] };

    const aMap = new Map(a.files.map(f => [f.path, f.content]));
    const bMap = new Map(b.files.map(f => [f.path, f.content]));

    const added = b.files.filter(f => !aMap.has(f.path)).map(f => f.path);
    const removed = a.files.filter(f => !bMap.has(f.path)).map(f => f.path);
    const modified = b.files
      .filter(f => aMap.has(f.path) && aMap.get(f.path) !== f.content)
      .map(f => f.path);

    return { added, removed, modified };
  }, [branches]);

  return {
    branches,
    activeBranchId,
    isLoaded,
    loadBranches,
    createBranch,
    switchBranch,
    deleteBranch,
    exitBranch,
    compareBranches,
    branchCount: branches.length,
  };
}
