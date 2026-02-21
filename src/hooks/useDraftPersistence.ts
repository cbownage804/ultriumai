import { useEffect, useRef, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

const DRAFT_KEY = 'ai-builder-draft';
const DEBOUNCE_MS = 1500;

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
    const baseDraft: DraftData = {
      name,
      files: files.map(f => ({ path: f.path, content: f.content, language: f.language })),
      messages,
      savedAt: new Date().toISOString(),
    };

    // Build tiered payloads BEFORE touching storage
    const payloads: string[] = [];
    try {
      payloads.push(JSON.stringify(baseDraft));
    } catch { /* serialization failed */ }

    // Tier 2: slim messages
    const slimMessages = messages.map((m: any) => ({
      role: m.role, timestamp: m.timestamp,
      content: typeof m.content === 'string' ? m.content.slice(0, 200) : '',
    }));
    try {
      payloads.push(JSON.stringify({ ...baseDraft, messages: slimMessages }));
    } catch { /* */ }

    // Tier 3: files only
    try {
      payloads.push(JSON.stringify({ ...baseDraft, messages: [] }));
    } catch { /* */ }

    if (payloads.length === 0) return; // nothing serializable

    // Snapshot old value BEFORE any mutation
    const backup = localStorage.getItem(DRAFT_KEY);

    // Free quota by removing old value
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }

    // Try each tier until one succeeds
    for (const json of payloads) {
      try {
        localStorage.setItem(DRAFT_KEY, json);
        return; // success — done
      } catch {
        // quota exceeded, try next tier
      }
    }

    // ALL tiers failed — restore the backup so we don't lose existing data
    console.warn('[Draft] All localStorage writes failed, restoring backup');
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
    if (files.length === 0 && messages.length === 0) {
      console.info('[Draft] Skipping immediate save — no files or messages');
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    console.info('[Draft] Immediate save: %d files, %d msgs, name=%s', files.length, messages.length, name);
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
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }
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
