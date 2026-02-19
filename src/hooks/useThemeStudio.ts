import { useState, useCallback } from 'react';

export interface ThemeToken {
  id: string;
  name: string;
  cssVar: string;
  lightValue: string;
  darkValue: string;
  category: 'color' | 'spacing' | 'radius' | 'font' | 'shadow';
}

export interface ThemePreset {
  name: string;
  tokens: Omit<ThemeToken, 'id'>[];
}

const DEFAULT_TOKENS: ThemeToken[] = [
  { id: '1', name: 'Background', cssVar: '--background', lightValue: '0 0% 100%', darkValue: '240 10% 4%', category: 'color' },
  { id: '2', name: 'Foreground', cssVar: '--foreground', lightValue: '240 10% 4%', darkValue: '0 0% 98%', category: 'color' },
  { id: '3', name: 'Primary', cssVar: '--primary', lightValue: '262 83% 58%', darkValue: '262 83% 58%', category: 'color' },
  { id: '4', name: 'Primary FG', cssVar: '--primary-foreground', lightValue: '0 0% 98%', darkValue: '0 0% 98%', category: 'color' },
  { id: '5', name: 'Secondary', cssVar: '--secondary', lightValue: '240 5% 96%', darkValue: '240 4% 16%', category: 'color' },
  { id: '6', name: 'Accent', cssVar: '--accent', lightValue: '240 5% 96%', darkValue: '240 4% 16%', category: 'color' },
  { id: '7', name: 'Muted', cssVar: '--muted', lightValue: '240 5% 96%', darkValue: '240 4% 16%', category: 'color' },
  { id: '8', name: 'Border', cssVar: '--border', lightValue: '240 6% 90%', darkValue: '240 4% 16%', category: 'color' },
  { id: '9', name: 'Radius', cssVar: '--radius', lightValue: '0.5rem', darkValue: '0.5rem', category: 'radius' },
];

const PRESETS: ThemePreset[] = [
  { name: 'Default', tokens: DEFAULT_TOKENS.map(({ id, ...rest }) => rest) },
  { name: 'Ocean', tokens: [
    { name: 'Background', cssVar: '--background', lightValue: '200 20% 98%', darkValue: '210 40% 8%', category: 'color' },
    { name: 'Primary', cssVar: '--primary', lightValue: '200 90% 45%', darkValue: '200 90% 55%', category: 'color' },
    { name: 'Accent', cssVar: '--accent', lightValue: '180 60% 90%', darkValue: '180 30% 20%', category: 'color' },
  ]},
  { name: 'Sunset', tokens: [
    { name: 'Background', cssVar: '--background', lightValue: '30 30% 98%', darkValue: '20 30% 6%', category: 'color' },
    { name: 'Primary', cssVar: '--primary', lightValue: '15 90% 55%', darkValue: '15 90% 60%', category: 'color' },
    { name: 'Accent', cssVar: '--accent', lightValue: '45 90% 55%', darkValue: '45 80% 45%', category: 'color' },
  ]},
  { name: 'Forest', tokens: [
    { name: 'Background', cssVar: '--background', lightValue: '120 10% 98%', darkValue: '150 20% 6%', category: 'color' },
    { name: 'Primary', cssVar: '--primary', lightValue: '150 60% 40%', darkValue: '150 60% 50%', category: 'color' },
    { name: 'Accent', cssVar: '--accent', lightValue: '80 50% 50%', darkValue: '80 40% 40%', category: 'color' },
  ]},
];

export function useThemeStudio() {
  const [tokens, setTokens] = useState<ThemeToken[]>(DEFAULT_TOKENS);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('dark');
  const [activePreset, setActivePreset] = useState('Default');

  const updateToken = useCallback((id: string, field: 'lightValue' | 'darkValue', value: string) => {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  }, []);

  const addToken = useCallback((name: string, cssVar: string, category: ThemeToken['category']) => {
    setTokens(prev => [...prev, { id: crypto.randomUUID(), name, cssVar, lightValue: '', darkValue: '', category }]);
  }, []);

  const removeToken = useCallback((id: string) => {
    setTokens(prev => prev.filter(t => t.id !== id));
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const preset = PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    setActivePreset(presetName);
    const newTokens = preset.tokens.map(t => ({ ...t, id: crypto.randomUUID() }));
    // Merge: keep tokens not in preset, update ones that match
    setTokens(prev => {
      const presetVars = new Set(newTokens.map(t => t.cssVar));
      const kept = prev.filter(t => !presetVars.has(t.cssVar));
      return [...newTokens, ...kept];
    });
  }, []);

  const generateCSS = useCallback((): string => {
    const lightVars = tokens.filter(t => t.lightValue).map(t => `  ${t.cssVar}: ${t.lightValue};`).join('\n');
    const darkVars = tokens.filter(t => t.darkValue).map(t => `  ${t.cssVar}: ${t.darkValue};`).join('\n');

    return `:root {\n${lightVars}\n}\n\n.dark {\n${darkVars}\n}`;
  }, [tokens]);

  const generateTailwindConfig = useCallback((): string => {
    const colorTokens = tokens.filter(t => t.category === 'color');
    const entries = colorTokens.map(t => {
      const name = t.cssVar.replace('--', '');
      return `    '${name}': 'hsl(var(${t.cssVar}))',`;
    }).join('\n');
    return `// tailwind.config.ts extend.colors\ncolors: {\n${entries}\n}`;
  }, [tokens]);

  const exportTokens = useCallback(() => JSON.stringify(tokens, null, 2), [tokens]);

  return {
    tokens, previewMode, setPreviewMode, activePreset, presets: PRESETS,
    updateToken, addToken, removeToken, applyPreset,
    generateCSS, generateTailwindConfig, exportTokens,
  };
}
