import { useEffect, useRef, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

const DRAFT_KEY = 'ai-builder-draft';
const DEBOUNCE_MS = 2000;

export interface DraftData {
  name: string;
  files: ProjectFile[];
  messages: any[];
  savedAt: string;
}

/** Persist work-in-progress to localStorage so it survives accidental refresh. */
export function useDraftPersistence() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeDraft = useCallback((name: string, files: ProjectFile[], messages: any[]) => {
    try {
      const draft: DraftData = {
        name,
        files: files.map(f => ({ path: f.path, content: f.content, language: f.language })),
        messages,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, []);

  const saveDraft = useCallback((name: string, files: ProjectFile[], messages: any[]) => {
    if (files.length === 0 && messages.length === 0) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      writeDraft(name, files, messages);
    }, DEBOUNCE_MS);
  }, [writeDraft]);

  /** Save immediately — use on visibilitychange / beforeunload / unmount */
  const saveDraftImmediate = useCallback((name: string, files: ProjectFile[], messages: any[]) => {
    if (files.length === 0 && messages.length === 0) return;
    if (timer.current) clearTimeout(timer.current);
    writeDraft(name, files, messages);
  }, [writeDraft]);

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as DraftData;
    } catch {
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const hasDraft = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw) as DraftData;
      return draft.files.length > 0 || draft.messages.length > 0;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { saveDraft, saveDraftImmediate, loadDraft, clearDraft, hasDraft };
}
