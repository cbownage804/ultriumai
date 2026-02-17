import { useState, useCallback } from 'react';

export interface Phase {
  id: string;
  number: number;
  title: string;
  description: string;
  prompt: string;
  status: 'pending' | 'active' | 'done' | 'skipped';
}

export interface PhasePlan {
  id: string;
  originalPrompt: string;
  phases: Phase[];
  currentPhaseIndex: number;
}

// Heuristics for detecting a large/complex prompt
const LARGE_PROMPT_THRESHOLD = 800; // characters
const SECTION_MARKERS = /\b(CORE|ARCHITECTURE|DATABASE|UI|DESIGN|INTEGRATION|AUTOMATION|AUTH|API|SCOPE|FEATURES?|TABLES?|REQUIREMENTS?|ENGINE|ACTIONS?|DEMO|OUTPUT)\b/gi;
const NUMBERED_SECTIONS = /^\d+[.)]\s+/gm;
const HEADING_MARKERS = /^#{1,4}\s+|^[A-Z][A-Z\s&]+$/gm;

/**
 * Detect whether a prompt is large enough to warrant phased execution
 */
function isLargePrompt(input: string): boolean {
  if (input.length < LARGE_PROMPT_THRESHOLD) return false;
  
  const sectionCount = (input.match(SECTION_MARKERS) || []).length;
  const numberedCount = (input.match(NUMBERED_SECTIONS) || []).length;
  const headingCount = (input.match(HEADING_MARKERS) || []).length;
  const lineCount = input.split('\n').filter(l => l.trim()).length;
  
  // Multiple signals of a complex spec
  return (sectionCount >= 3) || (numberedCount >= 5) || (headingCount >= 4) || (lineCount >= 30);
}

/**
 * Break a large prompt into logical phases
 */
function decomposeIntoPhases(input: string): Phase[] {
  const lines = input.split('\n');
  const sections: { title: string; lines: string[] }[] = [];
  let currentSection: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentSection?.lines.push(line);
      continue;
    }

    // Detect section headers: ALL CAPS, markdown headings, or labeled sections
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
      currentSection = { title: trimmed.replace(/^#{1,4}\s+/, '').replace(/^\d+[.)]\s+/, ''), lines: [] };
    } else {
      if (!currentSection) {
        currentSection = { title: 'Project Setup', lines: [] };
      }
      currentSection.lines.push(line);
    }
  }
  if (currentSection && currentSection.lines.some(l => l.trim())) {
    sections.push(currentSection);
  }

  // Group small related sections into logical phases
  const phases: Phase[] = [];
  const phaseGroups = groupSectionsIntoPhases(sections);

  for (let i = 0; i < phaseGroups.length; i++) {
    const group = phaseGroups[i];
    phases.push({
      id: crypto.randomUUID(),
      number: i + 1,
      title: group.title,
      description: group.description,
      prompt: group.prompt,
      status: 'pending',
    });
  }

  return phases;
}

interface SectionGroup {
  title: string;
  description: string;
  prompt: string;
}

function groupSectionsIntoPhases(sections: { title: string; lines: string[] }[]): SectionGroup[] {
  if (sections.length === 0) return [];

  // Category mapping for intelligent grouping
  const categoryMap: Record<string, string[]> = {
    'Foundation & Database': ['DATABASE', 'TABLES', 'SCHEMA', 'ARCHITECTURE', 'CORE', 'DATA'],
    'Authentication & Roles': ['AUTH', 'LOGIN', 'ROLES', 'USERS', 'ACCESS', 'PERMISSION', 'SECURITY'],
    'Core Features': ['FEATURES', 'ENGINE', 'DETECTION', 'INTEGRATION', 'API', 'ACTIONS', 'SCANNING'],
    'UI & Design': ['UI', 'DESIGN', 'THEME', 'LAYOUT', 'DASHBOARD', 'PAGES', 'COMPONENTS'],
    'Automation & Polish': ['AUTOMATION', 'DEMO', 'OUTPUT', 'DEPLOYMENT', 'SCOPE', 'REQUIREMENTS'],
  };

  const grouped: Map<string, { title: string; lines: string[] }[]> = new Map();

  for (const section of sections) {
    const upperTitle = section.title.toUpperCase();
    let assignedGroup = 'Core Features'; // default

    for (const [groupName, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => upperTitle.includes(kw))) {
        assignedGroup = groupName;
        break;
      }
    }

    if (!grouped.has(assignedGroup)) {
      grouped.set(assignedGroup, []);
    }
    grouped.get(assignedGroup)!.push(section);
  }

  // Convert to phase groups, maintaining a logical order
  const orderedGroups = [
    'Foundation & Database',
    'Authentication & Roles',
    'Core Features',
    'UI & Design',
    'Automation & Polish',
  ];

  const result: SectionGroup[] = [];
  for (const groupName of orderedGroups) {
    const groupSections = grouped.get(groupName);
    if (!groupSections || groupSections.length === 0) continue;

    const allLines = groupSections.flatMap(s => [`## ${s.title}`, ...s.lines]).join('\n');
    const sectionTitles = groupSections.map(s => s.title).join(', ');

    result.push({
      title: `Phase ${result.length + 1}: ${groupName}`,
      description: `Covers: ${sectionTitles}`,
      prompt: allLines.trim(),
    });
  }

  // If grouping produced only 1 phase, split more aggressively
  if (result.length <= 1 && sections.length >= 3) {
    const chunkSize = Math.ceil(sections.length / Math.min(sections.length, 5));
    const fallback: SectionGroup[] = [];
    for (let i = 0; i < sections.length; i += chunkSize) {
      const chunk = sections.slice(i, i + chunkSize);
      const allLines = chunk.flatMap(s => [`## ${s.title}`, ...s.lines]).join('\n');
      fallback.push({
        title: `Phase ${fallback.length + 1}: ${chunk.map(c => c.title).join(' & ')}`,
        description: chunk.map(c => c.title).join(', '),
        prompt: allLines.trim(),
      });
    }
    return fallback;
  }

  return result;
}

export function usePromptPhasePlanner() {
  const [activePlan, setActivePlan] = useState<PhasePlan | null>(null);

  /**
   * Analyze a prompt. If it's large, returns a phase plan.
   * If it's small enough, returns null (proceed normally).
   */
  const analyzePrompt = useCallback((input: string): PhasePlan | null => {
    if (!isLargePrompt(input)) return null;

    const phases = decomposeIntoPhases(input);
    if (phases.length <= 1) return null; // Not decomposable

    const plan: PhasePlan = {
      id: crypto.randomUUID(),
      originalPrompt: input,
      phases,
      currentPhaseIndex: 0,
    };

    setActivePlan(plan);
    return plan;
  }, []);

  /**
   * Get the current phase's prompt to send to the AI
   */
  const getCurrentPhasePrompt = useCallback((): string | null => {
    if (!activePlan) return null;
    const phase = activePlan.phases[activePlan.currentPhaseIndex];
    if (!phase) return null;

    // Add context about the overall plan
    const phaseContext = `[PHASE ${phase.number}/${activePlan.phases.length}: ${phase.title}]\n\nThis is part of a larger project. Focus ONLY on this phase:\n\n${phase.prompt}\n\nDo NOT implement features from other phases. Keep the code modular so future phases can extend it.`;
    return phaseContext;
  }, [activePlan]);

  /**
   * Mark current phase as done and advance to next
   */
  const advancePhase = useCallback(() => {
    setActivePlan(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      updated.phases = [...prev.phases];
      updated.phases[prev.currentPhaseIndex] = {
        ...updated.phases[prev.currentPhaseIndex],
        status: 'done',
      };
      updated.currentPhaseIndex = prev.currentPhaseIndex + 1;
      if (updated.currentPhaseIndex < updated.phases.length) {
        updated.phases[updated.currentPhaseIndex] = {
          ...updated.phases[updated.currentPhaseIndex],
          status: 'active',
        };
      }
      return updated;
    });
  }, []);

  /**
   * Skip a phase
   */
  const skipPhase = useCallback(() => {
    setActivePlan(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      updated.phases = [...prev.phases];
      updated.phases[prev.currentPhaseIndex] = {
        ...updated.phases[prev.currentPhaseIndex],
        status: 'skipped',
      };
      updated.currentPhaseIndex = prev.currentPhaseIndex + 1;
      if (updated.currentPhaseIndex < updated.phases.length) {
        updated.phases[updated.currentPhaseIndex] = {
          ...updated.phases[updated.currentPhaseIndex],
          status: 'active',
        };
      }
      return updated;
    });
  }, []);

  /**
   * Cancel the entire plan
   */
  const cancelPlan = useCallback(() => {
    setActivePlan(null);
  }, []);

  /**
   * Check if all phases are complete
   */
  const isComplete = activePlan
    ? activePlan.currentPhaseIndex >= activePlan.phases.length
    : false;

  return {
    activePlan,
    analyzePrompt,
    getCurrentPhasePrompt,
    advancePhase,
    skipPhase,
    cancelPlan,
    isComplete,
  };
}
