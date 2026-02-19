import { useState, useCallback } from 'react';

export interface PromptChainStep {
  id: string;
  title: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  resultSummary?: string;
}

export interface PromptChain {
  id: string;
  name: string;
  description: string;
  category: 'fullstack' | 'frontend' | 'backend' | 'testing' | 'custom';
  steps: PromptChainStep[];
  createdAt: Date;
  isFavorite: boolean;
}

const PRESET_CHAINS: Omit<PromptChain, 'id' | 'createdAt' | 'isFavorite'>[] = [
  {
    name: 'Full-Stack CRUD App',
    description: 'Generate schema → Build CRUD UI → Add auth → Write tests',
    category: 'fullstack',
    steps: [
      { id: '1', title: 'Database Schema', prompt: 'Create a Supabase database schema with tables, relationships, and RLS policies for this app.', status: 'pending' },
      { id: '2', title: 'CRUD UI', prompt: 'Build a complete CRUD interface with list, create, edit, and delete views using the schema above.', status: 'pending' },
      { id: '3', title: 'Authentication', prompt: 'Add user authentication with login, signup, and protected routes. Wire up RLS policies.', status: 'pending' },
      { id: '4', title: 'Unit Tests', prompt: 'Generate Vitest unit tests for all components and hooks created above.', status: 'pending' },
    ],
  },
  {
    name: 'Landing Page + Auth',
    description: 'Hero section → Features → Pricing → Auth flow',
    category: 'frontend',
    steps: [
      { id: '1', title: 'Hero & Navigation', prompt: 'Create a modern landing page with a hero section, navigation bar, and call-to-action.', status: 'pending' },
      { id: '2', title: 'Features Section', prompt: 'Add a features section with icon cards, descriptions, and animations.', status: 'pending' },
      { id: '3', title: 'Pricing Table', prompt: 'Add a pricing section with 3 tiers, feature comparison, and CTA buttons.', status: 'pending' },
      { id: '4', title: 'Auth Pages', prompt: 'Create login and signup pages with form validation and Supabase auth integration.', status: 'pending' },
    ],
  },
  {
    name: 'API + Edge Functions',
    description: 'Design API → Create edge functions → Add webhook → Test endpoints',
    category: 'backend',
    steps: [
      { id: '1', title: 'API Design', prompt: 'Design RESTful API endpoints for this application with request/response schemas.', status: 'pending' },
      { id: '2', title: 'Edge Functions', prompt: 'Create Supabase Edge Functions for each API endpoint with proper error handling and CORS.', status: 'pending' },
      { id: '3', title: 'Webhooks', prompt: 'Add webhook handlers for external service integrations with signature verification.', status: 'pending' },
      { id: '4', title: 'API Tests', prompt: 'Write integration tests for all API endpoints using fetch with test data.', status: 'pending' },
    ],
  },
  {
    name: 'Dashboard + Analytics',
    description: 'Data models → Charts → Filters → Export',
    category: 'frontend',
    steps: [
      { id: '1', title: 'Data Models', prompt: 'Create TypeScript interfaces and mock data generators for dashboard metrics.', status: 'pending' },
      { id: '2', title: 'Chart Components', prompt: 'Build reusable chart components (line, bar, pie, area) using Recharts with responsive design.', status: 'pending' },
      { id: '3', title: 'Filter System', prompt: 'Add date range pickers, category filters, and search functionality to the dashboard.', status: 'pending' },
      { id: '4', title: 'Export Features', prompt: 'Add CSV/PDF export functionality for dashboard data and charts.', status: 'pending' },
    ],
  },
];

export function usePromptChains() {
  const [chains, setChains] = useState<PromptChain[]>(() => {
    try {
      const saved = localStorage.getItem('app-builder-prompt-chains');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [activeChain, setActiveChain] = useState<PromptChain | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const persist = useCallback((updated: PromptChain[]) => {
    setChains(updated);
    localStorage.setItem('app-builder-prompt-chains', JSON.stringify(updated));
  }, []);

  const createChain = useCallback((name: string, description: string, category: PromptChain['category'], steps: { title: string; prompt: string }[]) => {
    const chain: PromptChain = {
      id: crypto.randomUUID(),
      name,
      description,
      category,
      steps: steps.map((s, i) => ({ id: String(i + 1), title: s.title, prompt: s.prompt, status: 'pending' as const })),
      createdAt: new Date(),
      isFavorite: false,
    };
    persist([chain, ...chains]);
    return chain;
  }, [chains, persist]);

  const loadPreset = useCallback((index: number) => {
    const preset = PRESET_CHAINS[index];
    if (!preset) return null;
    return createChain(preset.name, preset.description, preset.category, preset.steps.map(s => ({ title: s.title, prompt: s.prompt })));
  }, [createChain]);

  const startChain = useCallback((chainId: string) => {
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return null;
    const updated = { ...chain, steps: chain.steps.map(s => ({ ...s, status: 'pending' as const })) };
    setActiveChain(updated);
    setCurrentStepIndex(0);
    return updated;
  }, [chains]);

  const getCurrentStepPrompt = useCallback((): string | null => {
    if (!activeChain) return null;
    const step = activeChain.steps[currentStepIndex];
    return step?.prompt || null;
  }, [activeChain, currentStepIndex]);

  const advanceStep = useCallback(() => {
    if (!activeChain) return;
    const updated = { ...activeChain };
    updated.steps = [...updated.steps];
    updated.steps[currentStepIndex] = { ...updated.steps[currentStepIndex], status: 'completed' };
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= updated.steps.length) {
      setActiveChain(updated);
      return;
    }
    updated.steps[nextIndex] = { ...updated.steps[nextIndex], status: 'running' };
    setActiveChain(updated);
    setCurrentStepIndex(nextIndex);
  }, [activeChain, currentStepIndex]);

  const skipStep = useCallback(() => {
    if (!activeChain) return;
    const updated = { ...activeChain };
    updated.steps = [...updated.steps];
    updated.steps[currentStepIndex] = { ...updated.steps[currentStepIndex], status: 'skipped' };
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < updated.steps.length) {
      setCurrentStepIndex(nextIndex);
    }
    setActiveChain(updated);
  }, [activeChain, currentStepIndex]);

  const cancelChain = useCallback(() => {
    setActiveChain(null);
    setCurrentStepIndex(0);
  }, []);

  const deleteChain = useCallback((id: string) => {
    persist(chains.filter(c => c.id !== id));
  }, [chains, persist]);

  const toggleFavorite = useCallback((id: string) => {
    persist(chains.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  }, [chains, persist]);

  const isComplete = activeChain ? activeChain.steps.every(s => s.status === 'completed' || s.status === 'skipped') : false;

  return {
    chains,
    activeChain,
    currentStepIndex,
    isComplete,
    presets: PRESET_CHAINS,
    createChain,
    loadPreset,
    startChain,
    getCurrentStepPrompt,
    advanceStep,
    skipStep,
    cancelChain,
    deleteChain,
    toggleFavorite,
  };
}
