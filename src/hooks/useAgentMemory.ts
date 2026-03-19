import { useState, useCallback, useRef } from 'react';

export interface ProjectMemoryEntry {
  key: string;
  value: string;
  source: 'auto' | 'user';
  timestamp: number;
}

export interface UserRule {
  id: string;
  rule: string;
  source: string; // the original user message
  createdAt: number;
}

export interface ProjectMemory {
  conventions: ProjectMemoryEntry[];
  preferences: ProjectMemoryEntry[];
  patterns: ProjectMemoryEntry[];
  errorFixes: ProjectMemoryEntry[];
  userRules: UserRule[];
}

const MEMORY_STORAGE_KEY = 'agent-project-memory';
const MAX_ENTRIES_PER_CATEGORY = 20;
const MAX_USER_RULES = 15;

function loadMemory(): ProjectMemory {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { conventions: [], preferences: [], patterns: [], errorFixes: [], userRules: [], ...parsed };
    }
  } catch { /* ignore */ }
  return { conventions: [], preferences: [], patterns: [], errorFixes: [], userRules: [] };
}

function saveMemory(memory: ProjectMemory) {
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
  } catch { /* ignore */ }
}

/** Detect project conventions from AI output and user prompts. */
function extractConventions(text: string): ProjectMemoryEntry[] {
  const entries: ProjectMemoryEntry[] = [];
  const now = Date.now();
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

/** Extract error patterns and their fixes. */
function extractErrorFix(error: string, fix: string): ProjectMemoryEntry | null {
  if (!error || !fix || error.length < 10) return null;
  const fingerprint = error.slice(0, 80).replace(/\s+/g, ' ').trim();
  return { key: `err:${fingerprint}`, value: `Error: ${fingerprint}\nFix: ${fix.slice(0, 200)}`, source: 'auto', timestamp: Date.now() };
}

/** Correction pattern regexes for detecting user rules from follow-up messages. */
const CORRECTION_PATTERNS: RegExp[] = [
  /(?:don'?t|do not|never|stop|avoid)\s+(?:change|modify|touch|alter|edit|remove|delete)\s+(?:the\s+)?(.+)/i,
  /(?:don'?t|do not|never|stop)\s+(?:add|use|include)\s+(.+)/i,
  /(?:always|make sure|ensure|remember)\s+(?:to\s+)?(?:keep|preserve|maintain|use)\s+(.+)/i,
  /(?:keep|preserve|maintain)\s+(?:the\s+)?(.+?)(?:\s+as.is|\s+unchanged|\s+the\s+same)/i,
  /(?:i told you|i said|i asked you)\s+(?:to|not to)\s+(.+)/i,
  /(?:use|prefer)\s+(.+?)\s+instead\s+of\s+(.+)/i,
  /(?:i prefer|i want|i like)\s+(.+?)(?:\s+not\s+(.+))?$/i,
];

/** Detect if a user message contains a correction/rule. */
function detectCorrectionRule(message: string): string | null {
  for (const pattern of CORRECTION_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return match[0].slice(0, 150).trim();
    }
  }
  return null;
}

/** Build a PROJECT_MEMORY.md-style string for injection into the system prompt. */
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
  if (sections.length === 0 && (!memory.userRules || memory.userRules.length === 0)) return '';
  return `\n\n[PROJECT MEMORY — Accumulated knowledge from previous sessions]\n${sections.join('\n\n')}\n[/PROJECT MEMORY]`;
}

/** Build user rules directive for system prompt injection. */
function buildUserRulesContext(memory: ProjectMemory): string {
  if (!memory.userRules || memory.userRules.length === 0) return '';
  const rules = memory.userRules.map((r, i) => `${i + 1}. ${r.rule}`).join('\n');
  return `\n[USER RULES — HARD CONSTRAINTS from previous corrections. ALWAYS obey these.]\n${rules}\n[/USER RULES]`;
}

export function useAgentMemory() {
  const [memory, setMemory] = useState<ProjectMemory>(loadMemory);
  const memoryRef = useRef(memory);
  memoryRef.current = memory;

  const addEntry = useCallback((category: keyof ProjectMemory, entry: ProjectMemoryEntry) => {
    setMemory(prev => {
      const existing = prev[category] as ProjectMemoryEntry[];
      if (!existing || existing.some(e => e.key === entry.key)) return prev;
      const updated = { ...prev, [category]: [...existing, entry].slice(-MAX_ENTRIES_PER_CATEGORY) };
      saveMemory(updated);
      return updated;
    });
  }, []);

  const removeEntry = useCallback((category: keyof ProjectMemory, key: string) => {
    setMemory(prev => {
      const existing = prev[category];
      if (!Array.isArray(existing)) return prev;
      const updated = { ...prev, [category]: (existing as ProjectMemoryEntry[]).filter(e => e.key !== key) };
      saveMemory(updated);
      return updated;
    });
  }, []);

  const addUserPreference = useCallback((value: string) => {
    addEntry('preferences', {
      key: `pref:${value.slice(0, 30).toLowerCase().replace(/\s+/g, '-')}`,
      value, source: 'user', timestamp: Date.now(),
    });
  }, [addEntry]);

  const learnFromInteraction = useCallback((userPrompt: string, aiResponse: string) => {
    const conventions = extractConventions(userPrompt + '\n' + aiResponse);
    for (const entry of conventions) addEntry('conventions', entry);
  }, [addEntry]);

  const recordErrorFix = useCallback((error: string, fix: string) => {
    const entry = extractErrorFix(error, fix);
    if (entry) addEntry('errorFixes', entry);
  }, [addEntry]);

  /** Detect and learn correction rules from user follow-up messages. */
  const learnFromCorrection = useCallback((userMessage: string) => {
    const rule = detectCorrectionRule(userMessage);
    if (!rule) return;
    setMemory(prev => {
      // Deduplicate by lowercase comparison
      if (prev.userRules.some(r => r.rule.toLowerCase() === rule.toLowerCase())) return prev;
      const newRule: UserRule = {
        id: crypto.randomUUID(),
        rule,
        source: userMessage.slice(0, 200),
        createdAt: Date.now(),
      };
      const updated = { ...prev, userRules: [...prev.userRules, newRule].slice(-MAX_USER_RULES) };
      saveMemory(updated);
      return updated;
    });
  }, []);

  /** Remove a specific user rule. */
  const removeUserRule = useCallback((id: string) => {
    setMemory(prev => {
      const updated = { ...prev, userRules: prev.userRules.filter(r => r.id !== id) };
      saveMemory(updated);
      return updated;
    });
  }, []);

  const getMemoryContext = useCallback((): string => {
    return buildMemoryContext(memoryRef.current);
  }, []);

  /** Get user rules context for system prompt injection. */
  const getUserRulesContext = useCallback((): string => {
    return buildUserRulesContext(memoryRef.current);
  }, []);

  const clearMemory = useCallback(() => {
    const empty: ProjectMemory = { conventions: [], preferences: [], patterns: [], errorFixes: [], userRules: [] };
    setMemory(empty);
    saveMemory(empty);
  }, []);

  const updateMemoryMarkdown = useCallback((markdown: string) => {
    const newMemory: ProjectMemory = { conventions: [], preferences: [], patterns: [], errorFixes: [], userRules: memoryRef.current.userRules };
    const now = Date.now();
    let currentSection = 'preferences' as string;
    for (const line of markdown.split('\n')) {
      if (/^##\s*conventions/i.test(line)) { currentSection = 'conventions'; continue; }
      if (/^##\s*user\s*preferences/i.test(line)) { currentSection = 'preferences'; continue; }
      if (/^##\s*code\s*patterns/i.test(line)) { currentSection = 'patterns'; continue; }
      if (/^##\s*known\s*error/i.test(line)) { currentSection = 'errorFixes'; continue; }
      if (/^##\s*user\s*rules/i.test(line)) { currentSection = 'userRules'; continue; }
      if (line.startsWith('- ') && currentSection !== 'userRules') {
        const value = line.slice(2).trim();
        if (value) {
          (newMemory[currentSection] as ProjectMemoryEntry[]).push({
            key: `${currentSection}:${value.slice(0, 30).toLowerCase().replace(/\s+/g, '-')}`,
            value, source: 'user', timestamp: now,
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
    learnFromCorrection,
    removeUserRule,
    getMemoryContext,
    getUserRulesContext,
    clearMemory,
    updateMemoryMarkdown,
    buildMemoryContext,
    userRuleCount: memory.userRules?.length || 0,
  };
}
