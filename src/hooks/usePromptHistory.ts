import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'ai-builder-prompt-history';
const MAX_HISTORY = 200;

export interface PromptHistoryEntry {
  id: string;
  prompt: string;
  timestamp: string;
  category: 'ui' | 'backend' | 'fix' | 'refactor' | 'general';
  isFavorite: boolean;
  resultFileCount: number;
  model: string;
}

function categorizePrompt(prompt: string): PromptHistoryEntry['category'] {
  const lower = prompt.toLowerCase();
  if (/\b(fix|bug|error|broken|crash|not working|issue)\b/.test(lower)) return 'fix';
  if (/\b(refactor|clean|simplify|optimize|restructure)\b/.test(lower)) return 'refactor';
  if (/\b(api|database|supabase|edge function|backend|server|auth|rls|storage)\b/.test(lower)) return 'backend';
  if (/\b(button|layout|page|modal|form|style|color|font|ui|ux|design|component|card|hero|nav|footer|header|sidebar|responsive)\b/.test(lower)) return 'ui';
  return 'general';
}

export function usePromptHistory() {
  const [history, setHistory] = useState<PromptHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((entries: PromptHistoryEntry[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
  }, []);

  const addEntry = useCallback((prompt: string, model: string, resultFileCount: number) => {
    if (!prompt.trim() || prompt.length < 5) return;
    setHistory(prev => {
      // Deduplicate exact same prompt within last 5 entries
      if (prev.slice(-5).some(e => e.prompt === prompt)) return prev;
      const entry: PromptHistoryEntry = {
        id: crypto.randomUUID(),
        prompt,
        timestamp: new Date().toISOString(),
        category: categorizePrompt(prompt),
        isFavorite: false,
        resultFileCount,
        model,
      };
      const next = [...prev, entry].slice(-MAX_HISTORY);
      persist(next);
      return next;
    });
  }, [persist]);

  const toggleFavorite = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.map(e => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e);
      persist(next);
      return next;
    });
  }, [persist]);

  const removeEntry = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(e => e.id !== id);
      persist(next);
      return next;
    });
  }, [persist]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const searchHistory = useCallback((query: string): PromptHistoryEntry[] => {
    if (!query.trim()) return history;
    const lower = query.toLowerCase();
    return history.filter(e => e.prompt.toLowerCase().includes(lower));
  }, [history]);

  const getFavorites = useCallback(() => history.filter(e => e.isFavorite), [history]);

  const exportHistory = useCallback((): string => {
    return JSON.stringify(history, null, 2);
  }, [history]);

  const importHistory = useCallback((json: string) => {
    try {
      const imported = JSON.parse(json) as PromptHistoryEntry[];
      if (!Array.isArray(imported)) return;
      setHistory(prev => {
        const ids = new Set(prev.map(e => e.id));
        const merged = [...prev, ...imported.filter(e => !ids.has(e.id))].slice(-MAX_HISTORY);
        persist(merged);
        return merged;
      });
    } catch { /* ignore */ }
  }, [persist]);

  return {
    history,
    addEntry,
    toggleFavorite,
    removeEntry,
    clearHistory,
    searchHistory,
    getFavorites,
    exportHistory,
    importHistory,
  };
}
