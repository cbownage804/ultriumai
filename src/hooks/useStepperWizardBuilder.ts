import { useState, useCallback } from 'react';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  validationRule: string;
  icon: string;
}

export interface WizardConfig {
  id: string;
  name: string;
  steps: WizardStep[];
  orientation: 'horizontal' | 'vertical';
  allowSkip: boolean;
  showProgress: boolean;
  variant: 'dots' | 'numbers' | 'icons' | 'bars';
}

const PRESETS: Omit<WizardConfig, 'id'>[] = [
  { name: 'Onboarding', steps: [
    { id: '1', title: 'Welcome', description: 'Get started', validationRule: '', icon: '👋' },
    { id: '2', title: 'Profile', description: 'Set up your profile', validationRule: 'required', icon: '👤' },
    { id: '3', title: 'Preferences', description: 'Choose preferences', validationRule: '', icon: '⚙️' },
    { id: '4', title: 'Complete', description: 'All done!', validationRule: '', icon: '✅' },
  ], orientation: 'horizontal', allowSkip: false, showProgress: true, variant: 'numbers' },
  { name: 'Checkout', steps: [
    { id: '1', title: 'Cart', description: 'Review items', validationRule: '', icon: '🛒' },
    { id: '2', title: 'Shipping', description: 'Delivery address', validationRule: 'required', icon: '📦' },
    { id: '3', title: 'Payment', description: 'Payment method', validationRule: 'required', icon: '💳' },
    { id: '4', title: 'Confirm', description: 'Place order', validationRule: '', icon: '✅' },
  ], orientation: 'horizontal', allowSkip: false, showProgress: true, variant: 'dots' },
  { name: 'Survey', steps: [
    { id: '1', title: 'About You', description: 'Basic info', validationRule: '', icon: '📝' },
    { id: '2', title: 'Experience', description: 'Your experience', validationRule: '', icon: '💼' },
    { id: '3', title: 'Feedback', description: 'Share thoughts', validationRule: '', icon: '💬' },
  ], orientation: 'vertical', allowSkip: true, showProgress: true, variant: 'bars' },
];

export function useStepperWizardBuilder() {
  const [wizards, setWizards] = useState<WizardConfig[]>([]);
  const [activeWizard, setActiveWizard] = useState<string | null>(null);

  const createWizard = useCallback((preset?: string) => {
    const p = preset ? PRESETS.find(pr => pr.name === preset) : undefined;
    const w: WizardConfig = {
      id: crypto.randomUUID(),
      name: p?.name || `Wizard ${wizards.length + 1}`,
      steps: p?.steps.map(s => ({ ...s, id: crypto.randomUUID() })) || [
        { id: crypto.randomUUID(), title: 'Step 1', description: '', validationRule: '', icon: '1️⃣' },
      ],
      orientation: p?.orientation || 'horizontal',
      allowSkip: p?.allowSkip ?? false,
      showProgress: p?.showProgress ?? true,
      variant: p?.variant || 'numbers',
    };
    setWizards(prev => [...prev, w]);
    setActiveWizard(w.id);
    return w;
  }, [wizards.length]);

  const updateWizard = useCallback((id: string, updates: Partial<WizardConfig>) => {
    setWizards(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const deleteWizard = useCallback((id: string) => {
    setWizards(prev => prev.filter(w => w.id !== id));
    if (activeWizard === id) setActiveWizard(null);
  }, [activeWizard]);

  const addStep = useCallback((wizId: string) => {
    setWizards(prev => prev.map(w => w.id === wizId ? { ...w, steps: [...w.steps, { id: crypto.randomUUID(), title: `Step ${w.steps.length + 1}`, description: '', validationRule: '', icon: '📋' }] } : w));
  }, []);

  const removeStep = useCallback((wizId: string, stepId: string) => {
    setWizards(prev => prev.map(w => w.id === wizId ? { ...w, steps: w.steps.filter(s => s.id !== stepId) } : w));
  }, []);

  const updateStep = useCallback((wizId: string, stepId: string, updates: Partial<WizardStep>) => {
    setWizards(prev => prev.map(w => w.id === wizId ? { ...w, steps: w.steps.map(s => s.id === stepId ? { ...s, ...updates } : s) } : w));
  }, []);

  const generateCode = useCallback((id: string): string => {
    const w = wizards.find(wz => wz.id === id);
    if (!w) return '';
    const stepsArr = w.steps.map(s => `  { title: ${JSON.stringify(s.title)}, description: ${JSON.stringify(s.description)}, icon: ${JSON.stringify(s.icon)} }`).join(',\n');
    return `import { useState } from 'react';\n\nconst steps = [\n${stepsArr}\n];\n\nexport function ${w.name.replace(/\\s+/g, '')}Wizard() {\n  const [current, setCurrent] = useState(0);\n  const next = () => setCurrent(c => Math.min(c + 1, steps.length - 1));\n  const prev = () => setCurrent(c => Math.max(c - 1, 0));\n\n  return (\n    <div className="space-y-6">\n      <div className="flex ${w.orientation === 'vertical' ? 'flex-col gap-2' : 'items-center justify-between'}">\n        {steps.map((step, i) => (\n          <div key={i} className={\`flex items-center gap-2 \${i <= current ? 'text-primary' : 'text-muted-foreground'}\`}>\n            <span className="text-lg">{step.icon}</span>\n            <div>\n              <p className="text-sm font-medium">{step.title}</p>\n              <p className="text-xs">{step.description}</p>\n            </div>\n          </div>\n        ))}\n      </div>\n      ${w.showProgress ? '<div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: \\`\\${((current + 1) / steps.length) * 100}%\\` }} /></div>' : ''}\n      <div className="flex gap-2">\n        <button onClick={prev} disabled={current === 0} className="px-4 py-2 border rounded">Back</button>\n        <button onClick={next} disabled={current === steps.length - 1} className="px-4 py-2 bg-primary text-primary-foreground rounded">{current === steps.length - 1 ? 'Finish' : 'Next'}</button>\n      </div>\n    </div>\n  );\n}`;
  }, [wizards]);

  const getActive = useCallback(() => wizards.find(w => w.id === activeWizard) || null, [wizards, activeWizard]);

  return { wizards, activeWizard, setActiveWizard, createWizard, updateWizard, deleteWizard, addStep, removeStep, updateStep, generateCode, getActive, presetNames: PRESETS.map(p => p.name) };
}
