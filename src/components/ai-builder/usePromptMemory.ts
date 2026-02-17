import { useCallback, useState, useEffect } from 'react';

const STORAGE_KEY = 'ai-builder-prompt-memory';
const MAX_MEMORIES = 30;

export interface PromptMemoryEntry {
  id: string;
  pattern: string; // What the user corrected (e.g., "don't use inline styles")
  context: string; // What triggered it
  createdAt: string;
  usageCount: number;
}

/**
 * Prompt Memory: Remembers user corrections across sessions
 * and automatically injects them into future prompts.
 */
export function usePromptMemory() {
  const [memories, setMemories] = useState<PromptMemoryEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMemories(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (memories.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
      } catch { /* ignore */ }
    }
  }, [memories]);

  /** Detect correction patterns in user messages. */
  const detectCorrection = useCallback((message: string): string | null => {
    const correctionPatterns = [
      /(?:don'?t|do not|never|stop|avoid|quit)\s+(?:use|using|add|adding)\s+(.+)/i,
      /(?:always|make sure|ensure|remember to)\s+(.+)/i,
      /(?:i told you|i said|i asked you)\s+(?:to|not to)\s+(.+)/i,
      /(?:please|pls)\s+(?:don'?t|stop|no more)\s+(.+)/i,
      /(?:use|prefer)\s+(.+?)\s+instead\s+of\s+(.+)/i,
      /(?:i prefer|i like|i want)\s+(.+?)(?:\s+not\s+(.+))?$/i,
    ];

    for (const pattern of correctionPatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[0].slice(0, 120);
      }
    }
    return null;
  }, []);

  /** Add a new correction to memory. */
  const addMemory = useCallback((pattern: string, context: string) => {
    setMemories(prev => {
      // Deduplicate similar patterns
      const existing = prev.find(m => m.pattern.toLowerCase() === pattern.toLowerCase());
      if (existing) {
        return prev.map(m => m.id === existing.id ? { ...m, usageCount: m.usageCount + 1 } : m);
      }
      const entry: PromptMemoryEntry = {
        id: crypto.randomUUID(),
        pattern,
        context,
        createdAt: new Date().toISOString(),
        usageCount: 1,
      };
      return [...prev, entry].slice(-MAX_MEMORIES);
    });
  }, []);

  /** Process a user message — detect and store corrections. */
  const processUserMessage = useCallback((message: string) => {
    const correction = detectCorrection(message);
    if (correction) {
      addMemory(correction, message.slice(0, 200));
    }
  }, [detectCorrection, addMemory]);

  /** Build context string to inject into system prompt. */
  const buildMemoryContext = useCallback((): string => {
    if (memories.length === 0) return '';

    const sorted = [...memories].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10);
    const rules = sorted.map(m => `• ${m.pattern}`).join('\n');

    return `\n[USER PREFERENCES — ALWAYS FOLLOW]\nThe user has previously stated these preferences. Apply them to ALL code you generate:\n${rules}\n`;
  }, [memories]);

  /** Remove a specific memory. */
  const removeMemory = useCallback((id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  /** Clear all memories. */
  const clearMemories = useCallback(() => {
    setMemories([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    memories,
    processUserMessage,
    buildMemoryContext,
    removeMemory,
    clearMemories,
    totalMemories: memories.length,
  };
}
