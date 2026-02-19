import { useState, useCallback } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  highlightType: 'overlay' | 'spotlight' | 'border';
  position: 'top' | 'bottom' | 'left' | 'right';
  action: 'click' | 'type' | 'observe' | 'navigate';
  actionValue?: string;
  isCompleted: boolean;
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  triggerType: 'auto' | 'button' | 'firstVisit';
  isActive: boolean;
  createdAt: Date;
}

export function useTutorialCreator() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [previewStepIndex, setPreviewStepIndex] = useState(0);

  const createTutorial = useCallback((name: string) => {
    const tutorial: Tutorial = {
      id: crypto.randomUUID(), name, description: '',
      steps: [], triggerType: 'button', isActive: true, createdAt: new Date(),
    };
    setTutorials(prev => [...prev, tutorial]);
    setActiveTutorialId(tutorial.id);
    return tutorial;
  }, []);

  const updateTutorial = useCallback((id: string, update: Partial<Tutorial>) => {
    setTutorials(prev => prev.map(t => t.id === id ? { ...t, ...update } : t));
  }, []);

  const removeTutorial = useCallback((id: string) => {
    setTutorials(prev => prev.filter(t => t.id !== id));
  }, []);

  const addStep = useCallback((tutorialId: string) => {
    const step: TutorialStep = {
      id: crypto.randomUUID(), title: 'New Step', description: 'Describe this step',
      targetSelector: '', highlightType: 'spotlight', position: 'bottom',
      action: 'observe', isCompleted: false,
    };
    setTutorials(prev => prev.map(t => t.id === tutorialId ? { ...t, steps: [...t.steps, step] } : t));
  }, []);

  const updateStep = useCallback((tutorialId: string, stepId: string, update: Partial<TutorialStep>) => {
    setTutorials(prev => prev.map(t => t.id === tutorialId ? {
      ...t, steps: t.steps.map(s => s.id === stepId ? { ...s, ...update } : s),
    } : t));
  }, []);

  const removeStep = useCallback((tutorialId: string, stepId: string) => {
    setTutorials(prev => prev.map(t => t.id === tutorialId ? {
      ...t, steps: t.steps.filter(s => s.id !== stepId),
    } : t));
  }, []);

  const reorderSteps = useCallback((tutorialId: string, fromIndex: number, toIndex: number) => {
    setTutorials(prev => prev.map(t => {
      if (t.id !== tutorialId) return t;
      const steps = [...t.steps];
      const [moved] = steps.splice(fromIndex, 1);
      steps.splice(toIndex, 0, moved);
      return { ...t, steps };
    }));
  }, []);

  const getActiveTutorial = useCallback(() => tutorials.find(t => t.id === activeTutorialId) || null, [tutorials, activeTutorialId]);

  const generateTutorialCode = useCallback((tutorialId: string): string => {
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return '';
    return `import { useState, useEffect } from 'react';

const steps = ${JSON.stringify(tutorial.steps.map(s => ({ title: s.title, description: s.description, target: s.targetSelector, position: s.position, highlight: s.highlightType })), null, 2)};

export function ${tutorial.name.replace(/\s+/g, '')}Tour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(${tutorial.triggerType === 'auto' ? 'true' : 'false'});

  if (!isActive || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={() => setIsActive(false)} />
      <div className="absolute bg-white rounded-lg shadow-xl p-4 max-w-sm" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <h3 className="font-semibold text-lg">{step.title}</h3>
        <p className="text-gray-600 mt-1">{step.description}</p>
        <div className="flex justify-between mt-4">
          <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}>Back</button>
          <span>{currentStep + 1} / {steps.length}</span>
          <button onClick={() => setCurrentStep(s => s + 1)}>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}`;
  }, [tutorials]);

  return {
    tutorials, activeTutorialId, setActiveTutorialId, getActiveTutorial,
    previewStepIndex, setPreviewStepIndex,
    createTutorial, updateTutorial, removeTutorial,
    addStep, updateStep, removeStep, reorderSteps, generateTutorialCode,
  };
}
