import { useState, useCallback } from 'react';

export interface Keyframe {
  id: string;
  offset: number; // 0-1
  properties: Record<string, string | number>;
}

export interface AnimationConfig {
  id: string;
  name: string;
  duration: number; // ms
  delay: number;
  easing: string;
  iterations: number | 'infinite';
  direction: 'normal' | 'reverse' | 'alternate';
  keyframes: Keyframe[];
}

const EASING_PRESETS: Record<string, string> = {
  'Linear': 'linear',
  'Ease': 'ease',
  'Ease In': 'ease-in',
  'Ease Out': 'ease-out',
  'Ease In Out': 'ease-in-out',
  'Spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'Bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

const ANIMATION_PRESETS: Omit<AnimationConfig, 'id'>[] = [
  {
    name: 'Fade In',
    duration: 500,
    delay: 0,
    easing: 'ease-out',
    iterations: 1,
    direction: 'normal',
    keyframes: [
      { id: '1', offset: 0, properties: { opacity: 0 } },
      { id: '2', offset: 1, properties: { opacity: 1 } },
    ],
  },
  {
    name: 'Slide Up',
    duration: 600,
    delay: 0,
    easing: 'ease-out',
    iterations: 1,
    direction: 'normal',
    keyframes: [
      { id: '1', offset: 0, properties: { opacity: 0, translateY: 20 } },
      { id: '2', offset: 1, properties: { opacity: 1, translateY: 0 } },
    ],
  },
  {
    name: 'Scale In',
    duration: 400,
    delay: 0,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    iterations: 1,
    direction: 'normal',
    keyframes: [
      { id: '1', offset: 0, properties: { scale: 0.8, opacity: 0 } },
      { id: '2', offset: 1, properties: { scale: 1, opacity: 1 } },
    ],
  },
  {
    name: 'Pulse',
    duration: 1000,
    delay: 0,
    easing: 'ease-in-out',
    iterations: 'infinite',
    direction: 'alternate',
    keyframes: [
      { id: '1', offset: 0, properties: { scale: 1 } },
      { id: '2', offset: 0.5, properties: { scale: 1.05 } },
      { id: '3', offset: 1, properties: { scale: 1 } },
    ],
  },
];

export function useAnimationBuilder() {
  const [animations, setAnimations] = useState<AnimationConfig[]>([]);
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const createAnimation = useCallback((preset?: string) => {
    const presetConfig = preset ? ANIMATION_PRESETS.find(p => p.name === preset) : undefined;
    const anim: AnimationConfig = {
      id: crypto.randomUUID(),
      name: presetConfig?.name || `Animation ${animations.length + 1}`,
      duration: presetConfig?.duration || 500,
      delay: presetConfig?.delay || 0,
      easing: presetConfig?.easing || 'ease-out',
      iterations: presetConfig?.iterations || 1,
      direction: presetConfig?.direction || 'normal',
      keyframes: presetConfig?.keyframes?.map(k => ({ ...k, id: crypto.randomUUID() })) || [
        { id: crypto.randomUUID(), offset: 0, properties: { opacity: 0 } },
        { id: crypto.randomUUID(), offset: 1, properties: { opacity: 1 } },
      ],
    };
    setAnimations(prev => [...prev, anim]);
    setActiveAnimation(anim.id);
    return anim;
  }, [animations.length]);

  const updateAnimation = useCallback((id: string, updates: Partial<AnimationConfig>) => {
    setAnimations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const deleteAnimation = useCallback((id: string) => {
    setAnimations(prev => prev.filter(a => a.id !== id));
    if (activeAnimation === id) setActiveAnimation(null);
  }, [activeAnimation]);

  const addKeyframe = useCallback((animId: string, offset: number, properties: Record<string, string | number>) => {
    setAnimations(prev => prev.map(a =>
      a.id === animId ? { ...a, keyframes: [...a.keyframes, { id: crypto.randomUUID(), offset, properties }].sort((x, y) => x.offset - y.offset) } : a
    ));
  }, []);

  const removeKeyframe = useCallback((animId: string, keyframeId: string) => {
    setAnimations(prev => prev.map(a =>
      a.id === animId ? { ...a, keyframes: a.keyframes.filter(k => k.id !== keyframeId) } : a
    ));
  }, []);

  const exportAsFramerMotion = useCallback((anim: AnimationConfig): string => {
    const initial = anim.keyframes[0]?.properties || {};
    const animate = anim.keyframes[anim.keyframes.length - 1]?.properties || {};
    return `<motion.div\n  initial={${JSON.stringify(initial)}}\n  animate={${JSON.stringify(animate)}}\n  transition={{ duration: ${anim.duration / 1000}, ease: "${anim.easing}", delay: ${anim.delay / 1000}${anim.iterations === 'infinite' ? ', repeat: Infinity' : ''} }}\n>\n  {children}\n</motion.div>`;
  }, []);

  const exportAsCSS = useCallback((anim: AnimationConfig): string => {
    const name = anim.name.replace(/\s+/g, '-').toLowerCase();
    const keyframeRules = anim.keyframes.map(k => {
      const props = Object.entries(k.properties).map(([p, v]) => `    ${p}: ${v};`).join('\n');
      return `  ${Math.round(k.offset * 100)}% {\n${props}\n  }`;
    }).join('\n');
    return `@keyframes ${name} {\n${keyframeRules}\n}\n\n.${name} {\n  animation: ${name} ${anim.duration}ms ${anim.easing} ${anim.delay}ms ${anim.iterations === 'infinite' ? 'infinite' : anim.iterations} ${anim.direction};\n}`;
  }, []);

  const getActive = useCallback(() => animations.find(a => a.id === activeAnimation) || null, [animations, activeAnimation]);

  return {
    animations, activeAnimation, setActiveAnimation, isPlaying, setIsPlaying,
    createAnimation, updateAnimation, deleteAnimation, addKeyframe, removeKeyframe,
    exportAsFramerMotion, exportAsCSS, getActive,
    presetNames: ANIMATION_PRESETS.map(p => p.name),
    easingPresets: EASING_PRESETS,
  };
}
