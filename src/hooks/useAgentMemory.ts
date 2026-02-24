import { useState, useCallback, useRef } from 'react';

export interface ProjectMemoryEntry {
  key: string;
  value: string;
  source: 'auto' | 'user';
  timestamp: number;
}

export interface ProjectMemory {
  conventions: ProjectMemoryEntry[];
  preferences: ProjectMemoryEntry[];
  patterns: ProjectMemoryEntry[];
  errorFixes: ProjectMemoryEntry[];
}

const MEMORY_STORAGE_KEY = 'agent-project-memory';
const MAX_ENTRIES_PER_CATEGORY = 20;

function loadMemory(): ProjectMemory {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { conventions: [], preferences: [], patterns: [], errorFixes: [] };
}

function saveMemory(memory: ProjectMemory) {
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
  } catch { /* ignore */ }
}

/**
 * Detect project conventions from AI output and user prompts.
 * Extracts library preferences, coding patterns, architecture decisions.
 */
function extractConventions(text: string): ProjectMemoryEntry[] {
  const entries: ProjectMemoryEntry[] = [];
  const now = Date.now();

  // Detect library preferences
  const libPatterns = [
    /(?:using|prefer|use|with)\s+(tailwind|shadcn|framer.motion|react.query|zustand|jotai|tanstack)/gi,
    /(?:styled.components|emotion|css.modules|vanilla.extract)/gi,
  ];
  for (const pat of libPatterns) {
    const matches = text.matchAll(pat);
    for (const m of matches) {
      entries.push({ key: `lib:${m[1]?.toLowerCase() || m[0].toLowerCase()}`, value: m[0], source: 'auto', timestamp: now });
    }
  }

  // Detect architecture patterns
  const archPatterns = [
    { pattern: /(?:atomic|feature.based|domain.driven|barrel)\s*(?:design|architecture|pattern|structure)/gi, key: 'arch' },
    { pattern: /(?:server.components?|client.components?|RSC|SSR|CSR|SPA)/gi, key: 'rendering' },
  ];
  for (const { pattern, key } of archPatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      entries.push({ key: `${key}:${m[0].toLowerCase().replace(/\s+/g, '-')}`, value: m[0], source: 'auto', timestamp: now });
    }
  }

  return entries;
}

/**
 * Extract error patterns and their fixes for future reference.
 */
function extractErrorFix(error: string, fix: string): ProjectMemoryEntry | null {
  if (!error || !fix || error.length < 10) return null;
  // Create a short fingerprint of the error
  const fingerprint = error.slice(0, 80).replace(/\s+/g, ' ').trim();
  return {
    key: `err:${fingerprint}`,
    value: `Error: ${fingerprint}\nFix: ${fix.slice(0, 200)}`,
    source: 'auto',
    timestamp: Date.now(),
  };
}

/**
 * Build a PROJECT_MEMORY.md-style string for injection into the system prompt.
 */
function buildMemoryContext(memory: ProjectMemory): string {
  const sections: string[] = [];

  if (memory.conventions.length > 0) {
    sections.push('## Conventions\n' + memory.conventions.map(e => `- ${e.value}`).join('\n'));
  }
  if (memory.preferences.length > 0) {
    sections.push('## User Preferences\n' + memory.preferences.map(e => `- ${e.value}`).join('\n'));
  }
  if (memory.patterns.length > 0) {
    sections.push('## Code Patterns\n' + memory.patterns.map(e => `- ${e.value}`).join('\n'));
  }
  if (memory.errorFixes.length > 0) {
    sections.push('## Known Error Fixes\n' + memory.errorFixes.slice(-5).map(e => `- ${e.value}`).join('\n'));
  }

  if (sections.length === 0) return '';
  return `\n\n[PROJECT MEMORY — Accumulated knowledge from previous sessions]\n${sections.join('\n\n')}\n[/PROJECT MEMORY]`;
}

export function useAgentMemory() {
  const [memory, setMemory] = useState<ProjectMemory>(loadMemory);
  const memoryRef = useRef(memory);
  memoryRef.current = memory;

  const addEntry = useCallback((category: keyof ProjectMemory, entry: ProjectMemoryEntry) => {
    setMemory(prev => {
      const existing = prev[category];
      // Deduplicate by key
      if (existing.some(e => e.key === entry.key)) return prev;
      const updated = {
        ...prev,
        [category]: [...existing, entry].slice(-MAX_ENTRIES_PER_CATEGORY),
      };
      saveMemory(updated);
      return updated;
    });
  }, []);

  const removeEntry = useCallback((category: keyof ProjectMemory, key: string) => {
    setMemory(prev => {
      const updated = {
        ...prev,
        [category]: prev[category].filter(e => e.key !== key),
      };
      saveMemory(updated);
      return updated;
    });
  }, []);

  const addUserPreference = useCallback((value: string) => {
    addEntry('preferences', {
      key: `pref:${value.slice(0, 30).toLowerCase().replace(/\s+/g, '-')}`,
      value,
      source: 'user',
      timestamp: Date.now(),
    });
  }, [addEntry]);

  const learnFromInteraction = useCallback((userPrompt: string, aiResponse: string) => {
    const conventions = extractConventions(userPrompt + '\n' + aiResponse);
    for (const entry of conventions) {
      addEntry('conventions', entry);
    }
  }, [addEntry]);

  const recordErrorFix = useCallback((error: string, fix: string) => {
    const entry = extractErrorFix(error, fix);
    if (entry) addEntry('errorFixes', entry);
  }, [addEntry]);

  const getMemoryContext = useCallback((): string => {
    return buildMemoryContext(memoryRef.current);
  }, []);

  const clearMemory = useCallback(() => {
    const empty: ProjectMemory = { conventions: [], preferences: [], patterns: [], errorFixes: [] };
    setMemory(empty);
    saveMemory(empty);
  }, []);

  const updateMemoryMarkdown = useCallback((markdown: string) => {
    // Parse a simple markdown format back into memory entries
    const newMemory: ProjectMemory = { conventions: [], preferences: [], patterns: [], errorFixes: [] };
    const now = Date.now();
    let currentSection: keyof ProjectMemory = 'preferences';

    for (const line of markdown.split('\n')) {
      if (/^##\s*conventions/i.test(line)) { currentSection = 'conventions'; continue; }
      if (/^##\s*user\s*preferences/i.test(line)) { currentSection = 'preferences'; continue; }
      if (/^##\s*code\s*patterns/i.test(line)) { currentSection = 'patterns'; continue; }
      if (/^##\s*known\s*error/i.test(line)) { currentSection = 'errorFixes'; continue; }
      if (line.startsWith('- ')) {
        const value = line.slice(2).trim();
        if (value) {
          newMemory[currentSection].push({
            key: `${currentSection}:${value.slice(0, 30).toLowerCase().replace(/\s+/g, '-')}`,
            value,
            source: 'user',
            timestamp: now,
          });
        }
      }
    }

    setMemory(newMemory);
    saveMemory(newMemory);
  }, []);

  return {
    memory,
    addEntry,
    removeEntry,
    addUserPreference,
    learnFromInteraction,
    recordErrorFix,
    getMemoryContext,
    clearMemory,
    updateMemoryMarkdown,
    buildMemoryContext,
  };
}
