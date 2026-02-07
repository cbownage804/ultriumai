import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface UndoEntry {
  id: string;
  label: string;
  files: ProjectFile[];
  timestamp: Date;
}

const MAX_UNDO_STACK = 30;

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);

  const pushUndo = useCallback((label: string, files: ProjectFile[]) => {
    setUndoStack(prev => [
      ...prev.slice(-(MAX_UNDO_STACK - 1)),
      { id: crypto.randomUUID(), label, files: [...files], timestamp: new Date() },
    ]);
    setRedoStack([]); // Clear redo on new action
  }, []);

  const undo = useCallback((currentFiles: ProjectFile[]): ProjectFile[] | null => {
    if (undoStack.length === 0) return null;
    const entry = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [
      ...prev,
      { id: crypto.randomUUID(), label: 'Redo', files: [...currentFiles], timestamp: new Date() },
    ]);
    return entry.files;
  }, [undoStack]);

  const redo = useCallback((currentFiles: ProjectFile[]): ProjectFile[] | null => {
    if (redoStack.length === 0) return null;
    const entry = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [
      ...prev,
      { id: crypto.randomUUID(), label: 'Undo', files: [...currentFiles], timestamp: new Date() },
    ]);
    return entry.files;
  }, [redoStack]);

  return {
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    pushUndo,
    undo,
    redo,
  };
}
