import { useState, useCallback } from 'react';

export interface GestureMapping {
  id: string;
  name: string;
  gesture: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'pinch' | 'long-press' | 'double-tap' | 'rotate';
  target: string;
  action: string;
  threshold?: number;
  duration?: number;
  animation?: string;
}

const GESTURE_PRESETS: { gesture: GestureMapping['gesture']; label: string; icon: string }[] = [
  { gesture: 'swipe-left', label: 'Swipe Left', icon: '←' },
  { gesture: 'swipe-right', label: 'Swipe Right', icon: '→' },
  { gesture: 'swipe-up', label: 'Swipe Up', icon: '↑' },
  { gesture: 'swipe-down', label: 'Swipe Down', icon: '↓' },
  { gesture: 'pinch', label: 'Pinch', icon: '🤏' },
  { gesture: 'long-press', label: 'Long Press', icon: '👆' },
  { gesture: 'double-tap', label: 'Double Tap', icon: '👆👆' },
  { gesture: 'rotate', label: 'Rotate', icon: '🔄' },
];

const ANIMATION_PRESETS = [
  'fade-out', 'slide-left', 'slide-right', 'scale-down', 'scale-up', 'rotate-90', 'bounce', 'none',
];

export function useGestureBuilder() {
  const [mappings, setMappings] = useState<GestureMapping[]>([]);

  const addMapping = useCallback((mapping: Omit<GestureMapping, 'id'>) => {
    setMappings(prev => [...prev, { ...mapping, id: crypto.randomUUID() }]);
  }, []);

  const updateMapping = useCallback((id: string, partial: Partial<GestureMapping>) => {
    setMappings(prev => prev.map(m => m.id === id ? { ...m, ...partial } : m));
  }, []);

  const removeMapping = useCallback((id: string) => {
    setMappings(prev => prev.filter(m => m.id !== id));
  }, []);

  const generateCode = useCallback(() => {
    const handlers = mappings.map(m => {
      const animVariant = m.animation && m.animation !== 'none'
        ? `\n    animate: { ${m.animation === 'fade-out' ? 'opacity: 0' : m.animation === 'slide-left' ? 'x: -100' : m.animation === 'slide-right' ? 'x: 100' : m.animation === 'scale-down' ? 'scale: 0.8' : m.animation === 'scale-up' ? 'scale: 1.2' : 'opacity: 1'} },`
        : '';

      if (m.gesture.startsWith('swipe')) {
        const dir = m.gesture.replace('swipe-', '');
        const axis = dir === 'left' || dir === 'right' ? 'x' : 'y';
        const sign = dir === 'left' || dir === 'up' ? -1 : 1;
        return `  // ${m.name}: ${m.gesture} on ${m.target}
  const ${m.name}Handlers = {
    onPanEnd: (e, info) => {
      if (Math.abs(info.offset.${axis}) > ${m.threshold || 100} && Math.sign(info.offset.${axis}) === ${sign}) {
        ${m.action};
      }
    },${animVariant}
  };`;
      }
      if (m.gesture === 'long-press') {
        return `  // ${m.name}: long-press on ${m.target}
  const ${m.name}Handlers = {
    onTapStart: () => {
      const timer = setTimeout(() => { ${m.action}; }, ${m.duration || 500});
      return () => clearTimeout(timer);
    },
  };`;
      }
      if (m.gesture === 'pinch') {
        return `  // ${m.name}: pinch on ${m.target}
  const ${m.name}Handlers = {
    onPinch: (e) => {
      if (e.scale !== 1) { ${m.action}; }
    },
  };`;
      }
      return `  // ${m.name}: ${m.gesture} on ${m.target}\n  // Custom gesture handler`;
    }).join('\n\n');

    return `import { motion } from 'framer-motion';

export function GestureHandlers() {
${handlers}

  return { ${mappings.map(m => `${m.name}Handlers`).join(', ')} };
}
`;
  }, [mappings]);

  return {
    mappings, addMapping, updateMapping, removeMapping,
    generateCode, gesturePresets: GESTURE_PRESETS, animationPresets: ANIMATION_PRESETS,
  };
}
