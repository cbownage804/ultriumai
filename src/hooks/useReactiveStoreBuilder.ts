import { useState, useCallback } from 'react';

export interface StoreField {
  id: string;
  name: string;
  type: string;
  defaultValue: string;
}

export interface StoreAction {
  id: string;
  name: string;
  params: string;
  body: string;
}

export interface StoreSelector {
  id: string;
  name: string;
  body: string;
}

export interface StoreSlice {
  id: string;
  name: string;
  fields: StoreField[];
  actions: StoreAction[];
  selectors: StoreSelector[];
  persist: boolean;
  persistKey: string;
  devtools: boolean;
}

export function useReactiveStoreBuilder() {
  const [slices, setSlices] = useState<StoreSlice[]>([
    {
      id: '1', name: 'appStore',
      fields: [
        { id: 'f1', name: 'count', type: 'number', defaultValue: '0' },
        { id: 'f2', name: 'user', type: 'User | null', defaultValue: 'null' },
        { id: 'f3', name: 'theme', type: "'light' | 'dark'", defaultValue: "'light'" },
      ],
      actions: [
        { id: 'a1', name: 'increment', params: '', body: 'set((s) => ({ count: s.count + 1 }))' },
        { id: 'a2', name: 'setUser', params: 'user: User | null', body: 'set({ user })' },
        { id: 'a3', name: 'toggleTheme', params: '', body: "set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' }))" },
      ],
      selectors: [
        { id: 's1', name: 'useCount', body: '(state) => state.count' },
        { id: 's2', name: 'useUser', body: '(state) => state.user' },
      ],
      persist: true, persistKey: 'app-store', devtools: true,
    },
  ]);
  const [activeSliceId, setActiveSliceId] = useState('1');

  const getActiveSlice = useCallback(() => slices.find(s => s.id === activeSliceId) || null, [slices, activeSliceId]);

  const createSlice = useCallback((name: string) => {
    const slice: StoreSlice = {
      id: crypto.randomUUID(), name, fields: [], actions: [], selectors: [],
      persist: false, persistKey: name.toLowerCase(), devtools: true,
    };
    setSlices(prev => [...prev, slice]);
    setActiveSliceId(slice.id);
  }, []);

  const deleteSlice = useCallback((id: string) => {
    setSlices(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSlice = useCallback((id: string, updates: Partial<StoreSlice>) => {
    setSlices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const addField = useCallback((sliceId: string, name: string, type: string, defaultValue: string) => {
    setSlices(prev => prev.map(s => s.id === sliceId ? { ...s, fields: [...s.fields, { id: crypto.randomUUID(), name, type, defaultValue }] } : s));
  }, []);

  const removeField = useCallback((sliceId: string, fieldId: string) => {
    setSlices(prev => prev.map(s => s.id === sliceId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s));
  }, []);

  const addAction = useCallback((sliceId: string, name: string, params: string, body: string) => {
    setSlices(prev => prev.map(s => s.id === sliceId ? { ...s, actions: [...s.actions, { id: crypto.randomUUID(), name, params, body }] } : s));
  }, []);

  const removeAction = useCallback((sliceId: string, actionId: string) => {
    setSlices(prev => prev.map(s => s.id === sliceId ? { ...s, actions: s.actions.filter(a => a.id !== actionId) } : s));
  }, []);

  const addSelector = useCallback((sliceId: string, name: string, body: string) => {
    setSlices(prev => prev.map(s => s.id === sliceId ? { ...s, selectors: [...s.selectors, { id: crypto.randomUUID(), name, body }] } : s));
  }, []);

  const removeSelector = useCallback((sliceId: string, selectorId: string) => {
    setSlices(prev => prev.map(s => s.id === sliceId ? { ...s, selectors: s.selectors.filter(sel => sel.id !== selectorId) } : s));
  }, []);

  const generateCode = useCallback((): string => {
    const slice = getActiveSlice();
    if (!slice) return '// No slice selected';

    const stateType = `interface ${slice.name}State {\n${slice.fields.map(f => `  ${f.name}: ${f.type};`).join('\n')}\n}`;
    const actionsType = `interface ${slice.name}Actions {\n${slice.actions.map(a => `  ${a.name}: (${a.params}) => void;`).join('\n')}\n}`;

    const storeBody = [
      ...slice.fields.map(f => `    ${f.name}: ${f.defaultValue},`),
      ...slice.actions.map(a => `    ${a.name}: (${a.params}) => ${a.body},`),
    ].join('\n');

    const middlewareOpen: string[] = [];
    const middlewareClose: string[] = [];
    if (slice.devtools) { middlewareOpen.push('devtools('); middlewareClose.push(')'); }
    if (slice.persist) { middlewareOpen.push(`persist(`); middlewareClose.push(`, { name: '${slice.persistKey}' })`); }

    const createFn = `${middlewareOpen.join('')}(set, get) => ({\n${storeBody}\n})${middlewareClose.reverse().join('')}`;

    const imports = [
      "import { create } from 'zustand';",
      slice.devtools ? "import { devtools } from 'zustand/middleware';" : '',
      slice.persist ? "import { persist } from 'zustand/middleware';" : '',
    ].filter(Boolean).join('\n');

    const selectors = slice.selectors.length > 0
      ? `\n// Selectors\n${slice.selectors.map(s => `export const ${s.name} = (state: ${slice.name}State & ${slice.name}Actions) => ${s.body.replace('(state) => ', '')};\n// Usage: const val = use${slice.name}(${s.name});`).join('\n')}`
      : '';

    return `${imports}

${stateType}

${actionsType}

export const use${slice.name.charAt(0).toUpperCase() + slice.name.slice(1)} = create<${slice.name}State & ${slice.name}Actions>()(
  ${createFn}
);
${selectors}
`;
  }, [getActiveSlice]);

  return {
    slices, activeSliceId, setActiveSliceId,
    getActiveSlice, createSlice, deleteSlice, updateSlice,
    addField, removeField, addAction, removeAction,
    addSelector, removeSelector, generateCode,
  };
}
