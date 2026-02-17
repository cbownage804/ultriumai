import { useState, useCallback } from 'react';

export interface Phase {
  id: string;
  number: number;
  title: string;
  description: string;
  prompt: string;
  status: 'pending' | 'active' | 'done' | 'skipped';
  estimatedCredits: number;
}

export interface PhasePlan {
  id: string;
  originalPrompt: string;
  phases: Phase[];
  currentPhaseIndex: number;
  autoAdvance: boolean;
}

// Heuristics for detecting a large/complex prompt
const LARGE_PROMPT_THRESHOLD = 800;
const SECTION_MARKERS = /\b(CORE|ARCHITECTURE|DATABASE|UI|DESIGN|INTEGRATION|AUTOMATION|AUTH|API|SCOPE|FEATURES?|TABLES?|REQUIREMENTS?|ENGINE|ACTIONS?|DEMO|OUTPUT)\b/gi;
const NUMBERED_SECTIONS = /^\d+[.)]\s+/gm;
const HEADING_MARKERS = /^#{1,4}\s+|^[A-Z][A-Z\s&]+$/gm;

/** Estimate credits for a phase based on prompt complexity */
function estimatePhaseCredits(prompt: string): number {
  const charLen = prompt.length;
  const lineCount = prompt.split('\n').filter(l => l.trim()).length;
  const sectionCount = (prompt.match(SECTION_MARKERS) || []).length;

  // Base: 1 credit per ~200 chars, +1 per 5 lines, +1 per section keyword
  let estimate = Math.ceil(charLen / 200) + Math.ceil(lineCount / 5) + sectionCount;
  return Math.max(1, Math.min(estimate, 25)); // clamp 1–25
}

function isLargePrompt(input: string): boolean {
  if (input.length < LARGE_PROMPT_THRESHOLD) return false;

  const sectionCount = (input.match(SECTION_MARKERS) || []).length;
  const numberedCount = (input.match(NUMBERED_SECTIONS) || []).length;
  const headingCount = (input.match(HEADING_MARKERS) || []).length;
  const lineCount = input.split('\n').filter(l => l.trim()).length;

  return (sectionCount >= 3) || (numberedCount >= 5) || (headingCount >= 4) || (lineCount >= 30);
}

// --- Smarter decomposition with dependency-aware ordering ---

interface ParsedSection {
  title: string;
  lines: string[];
  category: string;
  priority: number;
}

const CATEGORY_CONFIG: Record<string, { keywords: string[]; priority: number }> = {
  'Foundation & Database': {
    keywords: ['DATABASE', 'TABLES', 'SCHEMA', 'ARCHITECTURE', 'CORE', 'DATA', 'MODELS', 'MIGRATION', 'STRUCTURE', 'MULTI-TENANT', 'MULTI_TENANT', 'RLS'],
    priority: 1,
  },
  'Authentication & Roles': {
    keywords: ['AUTH', 'LOGIN', 'ROLES', 'USERS', 'ACCESS', 'PERMISSION', 'SECURITY', 'SSO', 'OAUTH', 'SIGNUP', 'REGISTER'],
    priority: 2,
  },
  'Integrations & APIs': {
    keywords: ['INTEGRATION', 'API', 'WEBHOOK', 'GRAPH', 'MICROSOFT', 'STRIPE', 'EXTERNAL', 'THIRD-PARTY', 'SDK', 'CONNECT'],
    priority: 3,
  },
  'Core Features': {
    keywords: ['FEATURES', 'ENGINE', 'DETECTION', 'ACTIONS', 'SCANNING', 'WORKFLOW', 'PROCESSING', 'LOGIC', 'RULES', 'NOTIFICATIONS'],
    priority: 4,
  },
  'UI & Design': {
    keywords: ['UI', 'DESIGN', 'THEME', 'LAYOUT', 'DASHBOARD', 'PAGES', 'COMPONENTS', 'RESPONSIVE', 'DARK', 'LIGHT', 'STYLE', 'COLOR'],
    priority: 5,
  },
  'Automation & Polish': {
    keywords: ['AUTOMATION', 'DEMO', 'OUTPUT', 'DEPLOYMENT', 'SCOPE', 'REQUIREMENTS', 'TESTING', 'SEED', 'MOCK', 'POLISH', 'MVP'],
    priority: 6,
  },
};

function categorizeSection(title: string): { category: string; priority: number } {
  const upper = title.toUpperCase();
  for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
    if (config.keywords.some(kw => upper.includes(kw))) {
      return { category, priority: config.priority };
    }
  }
  return { category: 'Core Features', priority: 4 };
}

function decomposeIntoPhases(input: string): Phase[] {
  const lines = input.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentSection?.lines.push(line);
      continue;
    }

    const isHeader = (
      /^#{1,4}\s+/.test(trimmed) ||
      /^[A-Z][A-Z\s&/()]{4,}$/.test(trimmed) ||
      /^\d+[.)]\s+[A-Z]/.test(trimmed) ||
      /^[-•*]\s+[A-Z][A-Z\s]+:/.test(trimmed)
    );

    if (isHeader && trimmed.length < 80) {
      if (currentSection && currentSection.lines.some(l => l.trim())) {
        sections.push(currentSection);
      }
      const cleanTitle = trimmed.replace(/^#{1,4}\s+/, '').replace(/^\d+[.)]\s+/, '');
      const { category, priority } = categorizeSection(cleanTitle);
      currentSection = { title: cleanTitle, lines: [], category, priority };
    } else {
      if (!currentSection) {
        currentSection = { title: 'Project Setup', lines: [], category: 'Foundation & Database', priority: 1 };
      }
      currentSection.lines.push(line);
    }
  }
  if (currentSection && currentSection.lines.some(l => l.trim())) {
    sections.push(currentSection);
  }

  // Group by category and sort by priority
  const grouped = new Map<string, ParsedSection[]>();
  for (const section of sections) {
    if (!grouped.has(section.category)) grouped.set(section.category, []);
    grouped.get(section.category)!.push(section);
  }

  const orderedCategories = Object.entries(CATEGORY_CONFIG)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([name]) => name);

  const phases: Phase[] = [];
  for (const category of orderedCategories) {
    const groupSections = grouped.get(category);
    if (!groupSections || groupSections.length === 0) continue;

    const allLines = groupSections.flatMap(s => [`## ${s.title}`, ...s.lines]).join('\n');
    const sectionTitles = groupSections.map(s => s.title).join(', ');

    phases.push({
      id: crypto.randomUUID(),
      number: phases.length + 1,
      title: category,
      description: sectionTitles.length > 80 ? sectionTitles.slice(0, 77) + '...' : sectionTitles,
      prompt: allLines.trim(),
      status: 'pending',
      estimatedCredits: estimatePhaseCredits(allLines),
    });
  }

  // If grouping produced only 1 phase, split more aggressively
  if (phases.length <= 1 && sections.length >= 3) {
    const chunkSize = Math.ceil(sections.length / Math.min(sections.length, 5));
    const fallback: Phase[] = [];
    for (let i = 0; i < sections.length; i += chunkSize) {
      const chunk = sections.slice(i, i + chunkSize);
      const allLines = chunk.flatMap(s => [`## ${s.title}`, ...s.lines]).join('\n');
      fallback.push({
        id: crypto.randomUUID(),
        number: fallback.length + 1,
        title: chunk.map(c => c.title).join(' & '),
        description: chunk.map(c => c.title).join(', '),
        prompt: allLines.trim(),
        status: 'pending',
        estimatedCredits: estimatePhaseCredits(allLines),
      });
    }
    return fallback;
  }

  return phases;
}

export function usePromptPhasePlanner() {
  const [activePlan, setActivePlan] = useState<PhasePlan | null>(null);

  const analyzePrompt = useCallback((input: string): PhasePlan | null => {
    if (!isLargePrompt(input)) return null;

    const phases = decomposeIntoPhases(input);
    if (phases.length <= 1) return null;

    const plan: PhasePlan = {
      id: crypto.randomUUID(),
      originalPrompt: input,
      phases,
      currentPhaseIndex: 0,
      autoAdvance: false,
    };

    setActivePlan(plan);
    return plan;
  }, []);

  const getCurrentPhasePrompt = useCallback((): string | null => {
    if (!activePlan) return null;
    const phase = activePlan.phases[activePlan.currentPhaseIndex];
    if (!phase) return null;

    const phaseContext = `[PHASE ${phase.number}/${activePlan.phases.length}: ${phase.title}]\n\nThis is part of a larger project. Focus ONLY on this phase:\n\n${phase.prompt}\n\nDo NOT implement features from other phases. Keep the code modular so future phases can extend it.`;
    return phaseContext;
  }, [activePlan]);

  const advancePhase = useCallback(() => {
    setActivePlan(prev => {
      if (!prev) return null;
      const updated = { ...prev, phases: [...prev.phases] };
      updated.phases[prev.currentPhaseIndex] = { ...updated.phases[prev.currentPhaseIndex], status: 'done' };
      updated.currentPhaseIndex = prev.currentPhaseIndex + 1;
      if (updated.currentPhaseIndex < updated.phases.length) {
        updated.phases[updated.currentPhaseIndex] = { ...updated.phases[updated.currentPhaseIndex], status: 'active' };
      }
      return updated;
    });
  }, []);

  const skipPhase = useCallback(() => {
    setActivePlan(prev => {
      if (!prev) return null;
      const updated = { ...prev, phases: [...prev.phases] };
      updated.phases[prev.currentPhaseIndex] = { ...updated.phases[prev.currentPhaseIndex], status: 'skipped' };
      updated.currentPhaseIndex = prev.currentPhaseIndex + 1;
      if (updated.currentPhaseIndex < updated.phases.length) {
        updated.phases[updated.currentPhaseIndex] = { ...updated.phases[updated.currentPhaseIndex], status: 'active' };
      }
      return updated;
    });
  }, []);

  const cancelPlan = useCallback(() => {
    setActivePlan(null);
  }, []);

  /** Toggle auto-advance mode */
  const toggleAutoAdvance = useCallback(() => {
    setActivePlan(prev => prev ? { ...prev, autoAdvance: !prev.autoAdvance } : null);
  }, []);

  /** Edit a phase's title */
  const editPhaseTitle = useCallback((phaseId: string, newTitle: string) => {
    setActivePlan(prev => {
      if (!prev) return null;
      return {
        ...prev,
        phases: prev.phases.map(p => p.id === phaseId ? { ...p, title: newTitle } : p),
      };
    });
  }, []);

  /** Remove a phase */
  const removePhase = useCallback((phaseId: string) => {
    setActivePlan(prev => {
      if (!prev) return null;
      const filtered = prev.phases.filter(p => p.id !== phaseId).map((p, i) => ({ ...p, number: i + 1 }));
      if (filtered.length === 0) return null;
      return { ...prev, phases: filtered, currentPhaseIndex: Math.min(prev.currentPhaseIndex, filtered.length - 1) };
    });
  }, []);

  /** Reorder phases */
  const reorderPhases = useCallback((fromIndex: number, toIndex: number) => {
    setActivePlan(prev => {
      if (!prev) return null;
      const phases = [...prev.phases];
      const [moved] = phases.splice(fromIndex, 1);
      phases.splice(toIndex, 0, moved);
      return { ...prev, phases: phases.map((p, i) => ({ ...p, number: i + 1 })) };
    });
  }, []);

  const isComplete = activePlan ? activePlan.currentPhaseIndex >= activePlan.phases.length : false;

  const totalEstimatedCredits = activePlan
    ? activePlan.phases.reduce((sum, p) => sum + p.estimatedCredits, 0)
    : 0;

  return {
    activePlan,
    analyzePrompt,
    getCurrentPhasePrompt,
    advancePhase,
    skipPhase,
    cancelPlan,
    toggleAutoAdvance,
    editPhaseTitle,
    removePhase,
    reorderPhases,
    isComplete,
    totalEstimatedCredits,
  };
}
