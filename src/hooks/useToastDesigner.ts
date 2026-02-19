import { useState } from 'react';

export interface ToastPreset {
  id: string;
  name: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'default';
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  duration: number;
  title: string;
  description: string;
  hasAction: boolean;
  actionLabel: string;
  hasCloseButton: boolean;
  richColors: boolean;
}

const defaultPreset: ToastPreset = {
  id: crypto.randomUUID(),
  name: 'Default Toast',
  type: 'default',
  position: 'bottom-right',
  duration: 4000,
  title: 'Notification',
  description: 'Something happened.',
  hasAction: false,
  actionLabel: 'Undo',
  hasCloseButton: true,
  richColors: true,
};

export function useToastDesigner() {
  const [presets, setPresets] = useState<ToastPreset[]>([defaultPreset]);
  const [activePresetId, setActivePresetId] = useState(defaultPreset.id);

  const getActivePreset = () => presets.find(p => p.id === activePresetId) || null;

  const createPreset = (name: string) => {
    const p: ToastPreset = { ...defaultPreset, id: crypto.randomUUID(), name };
    setPresets(prev => [...prev, p]);
    setActivePresetId(p.id);
  };

  const updatePreset = (id: string, updates: Partial<ToastPreset>) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    if (activePresetId === id) setActivePresetId(presets[0]?.id || '');
  };

  const generateCode = (preset?: ToastPreset): string => {
    const p = preset || getActivePreset();
    if (!p) return '// No preset selected';

    const args: string[] = [];
    if (p.description) args.push(`description: '${p.description}'`);
    if (p.duration !== 4000) args.push(`duration: ${p.duration}`);
    if (p.hasAction) args.push(`action: { label: '${p.actionLabel}', onClick: () => console.log('action clicked') }`);
    if (p.hasCloseButton) args.push(`closeButton: true`);
    if (p.position !== 'bottom-right') args.push(`position: '${p.position}'`);

    const method = p.type === 'default' ? 'toast' : `toast.${p.type}`;
    const argsStr = args.length > 0 ? `, {\n  ${args.join(',\n  ')}\n}` : '';

    return `import { toast } from 'sonner';

// ${p.name}
${method}('${p.title}'${argsStr});`;
  };

  return {
    presets, activePresetId, setActivePresetId, getActivePreset,
    createPreset, updatePreset, removePreset, generateCode,
  };
}
