import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface Branch {
  id: string;
  name: string;
  files: ProjectFile[];
  createdAt: Date;
  parentBranch?: string;
}

export function useBranching() {
  const [branches, setBranches] = useState<Branch[]>([
    { id: 'main', name: 'main', files: [], createdAt: new Date() },
  ]);
  const [activeBranch, setActiveBranch] = useState('main');

  const createBranch = useCallback((name: string, currentFiles: ProjectFile[], parentId?: string) => {
    const branch: Branch = {
      id: crypto.randomUUID(),
      name,
      files: [...currentFiles],
      createdAt: new Date(),
      parentBranch: parentId || activeBranch,
    };
    setBranches(prev => [...prev, branch]);
    setActiveBranch(branch.id);
    return branch;
  }, [activeBranch]);

  const switchBranch = useCallback((branchId: string, currentFiles: ProjectFile[]): ProjectFile[] | null => {
    // Save current files to active branch
    setBranches(prev =>
      prev.map(b => b.id === activeBranch ? { ...b, files: [...currentFiles] } : b)
    );
    const target = branches.find(b => b.id === branchId);
    if (!target) return null;
    setActiveBranch(branchId);
    return target.files;
  }, [activeBranch, branches]);

  const mergeBranch = useCallback((sourceBranchId: string, currentFiles: ProjectFile[]): ProjectFile[] => {
    const source = branches.find(b => b.id === sourceBranchId);
    if (!source) return currentFiles;

    // Simple merge: source files overwrite, keep files not in source
    const mergedMap = new Map<string, ProjectFile>();
    for (const f of currentFiles) mergedMap.set(f.path, f);
    for (const f of source.files) mergedMap.set(f.path, f);

    return Array.from(mergedMap.values());
  }, [branches]);

  const deleteBranch = useCallback((branchId: string) => {
    if (branchId === 'main') return;
    setBranches(prev => prev.filter(b => b.id !== branchId));
    if (activeBranch === branchId) setActiveBranch('main');
  }, [activeBranch]);

  const updateBranchFiles = useCallback((files: ProjectFile[]) => {
    setBranches(prev =>
      prev.map(b => b.id === activeBranch ? { ...b, files: [...files] } : b)
    );
  }, [activeBranch]);

  return {
    branches,
    activeBranch,
    activeBranchName: branches.find(b => b.id === activeBranch)?.name || 'main',
    createBranch,
    switchBranch,
    mergeBranch,
    deleteBranch,
    updateBranchFiles,
  };
}
