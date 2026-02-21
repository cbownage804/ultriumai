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
    const trySet = (json: string): boolean => {
      try {
        localStorage.setItem(DRAFT_KEY, json);
        return true;
      } catch {
        return false;
      }
    };

    const baseDraft: DraftData = {
      name,
      files: files.map(f => ({ path: f.path, content: f.content, language: f.language })),
      messages,
      savedAt: new Date().toISOString(),
    };

    // Backup old draft in memory BEFORE removing — so we can restore on failure
    const backup = localStorage.getItem(DRAFT_KEY);

    // Remove old value once to free quota
    localStorage.removeItem(DRAFT_KEY);

    // Tier 1: Full save (files + messages)
    const fullJson = JSON.stringify(baseDraft);
    if (trySet(fullJson)) return;

    // Tier 2: Files + slim messages (strip large content)
    console.warn('[Draft] localStorage quota exceeded, saving without message content');
    const slimMessages = messages.map((m: any) => ({
      role: m.role, timestamp: m.timestamp,
      content: typeof m.content === 'string' ? m.content.slice(0, 200) : '',
    }));
    if (trySet(JSON.stringify({ ...baseDraft, messages: slimMessages }))) return;

    // Tier 3: Files only (no messages)
    console.warn('[Draft] localStorage still full, saving files only');
    if (trySet(JSON.stringify({ ...baseDraft, messages: [] }))) return;

    // Tier 4: All writes failed — restore the old draft so we don't lose data
    console.warn('[Draft] localStorage completely full, restoring previous draft');
    if (backup) {
      try { localStorage.setItem(DRAFT_KEY, backup); } catch { /* truly full */ }
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
