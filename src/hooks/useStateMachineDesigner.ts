import { useState, useCallback } from 'react';

export interface FSMState {
  id: string;
  name: string;
  isInitial: boolean;
  isFinal: boolean;
}

export interface FSMTransition {
  id: string;
  from: string;
  to: string;
  event: string;
  guard?: string;
  action?: string;
}

export interface FSMConfig {
  name: string;
  states: FSMState[];
  transitions: FSMTransition[];
  context: { key: string; type: string; defaultValue: string }[];
}

export function useStateMachineDesigner() {
  const [config, setConfig] = useState<FSMConfig>({
    name: 'appMachine',
    states: [
      { id: '1', name: 'idle', isInitial: true, isFinal: false },
      { id: '2', name: 'loading', isInitial: false, isFinal: false },
      { id: '3', name: 'success', isInitial: false, isFinal: true },
      { id: '4', name: 'error', isInitial: false, isFinal: false },
    ],
    transitions: [
      { id: 't1', from: 'idle', to: 'loading', event: 'FETCH' },
      { id: 't2', from: 'loading', to: 'success', event: 'RESOLVE' },
      { id: 't3', from: 'loading', to: 'error', event: 'REJECT' },
      { id: 't4', from: 'error', to: 'loading', event: 'RETRY' },
    ],
    context: [],
  });

  const addState = useCallback((name: string) => {
    setConfig(prev => ({
      ...prev,
      states: [...prev.states, { id: crypto.randomUUID(), name, isInitial: false, isFinal: false }],
    }));
  }, []);

  const removeState = useCallback((id: string) => {
    setConfig(prev => {
      const state = prev.states.find(s => s.id === id);
      return {
        ...prev,
        states: prev.states.filter(s => s.id !== id),
        transitions: prev.transitions.filter(t => t.from !== state?.name && t.to !== state?.name),
      };
    });
  }, []);

  const updateState = useCallback((id: string, updates: Partial<FSMState>) => {
    setConfig(prev => ({
      ...prev,
      states: prev.states.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const addTransition = useCallback((from: string, to: string, event: string) => {
    setConfig(prev => ({
      ...prev,
      transitions: [...prev.transitions, { id: crypto.randomUUID(), from, to, event }],
    }));
  }, []);

  const removeTransition = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      transitions: prev.transitions.filter(t => t.id !== id),
    }));
  }, []);

  const updateTransition = useCallback((id: string, updates: Partial<FSMTransition>) => {
    setConfig(prev => ({
      ...prev,
      transitions: prev.transitions.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, []);

  const addContextField = useCallback((key: string, type: string, defaultValue: string) => {
    setConfig(prev => ({
      ...prev,
      context: [...prev.context, { key, type, defaultValue }],
    }));
  }, []);

  const removeContextField = useCallback((key: string) => {
    setConfig(prev => ({
      ...prev,
      context: prev.context.filter(c => c.key !== key),
    }));
  }, []);

  const setMachineName = useCallback((name: string) => {
    setConfig(prev => ({ ...prev, name }));
  }, []);

  const generateCode = useCallback((): string => {
    const initial = config.states.find(s => s.isInitial)?.name || config.states[0]?.name || 'idle';
    const stateNames = config.states.map(s => `'${s.name}'`).join(' | ');
    const eventNames = [...new Set(config.transitions.map(t => t.event))].map(e => `'${e}'`).join(' | ');

    const contextType = config.context.length > 0
      ? `interface ${config.name}Context {\n${config.context.map(c => `  ${c.key}: ${c.type};`).join('\n')}\n}\n\n`
      : '';

    const contextDefault = config.context.length > 0
      ? `const initialContext: ${config.name}Context = {\n${config.context.map(c => `  ${c.key}: ${c.defaultValue},`).join('\n')}\n};\n\n`
      : '';

    // Build transition map
    const transitionMap: Record<string, Record<string, string>> = {};
    for (const t of config.transitions) {
      if (!transitionMap[t.from]) transitionMap[t.from] = {};
      transitionMap[t.from][t.event] = t.to;
    }

    const statesConfig = config.states.map(s => {
      const trans = transitionMap[s.name] || {};
      const onEntries = Object.entries(trans).map(([event, target]) => `        ${event}: '${target}',`).join('\n');
      return `    ${s.name}: {\n      on: {\n${onEntries}\n      },\n    },`;
    }).join('\n');

    return `// Generated State Machine: ${config.name}
// States: ${stateNames}
// Events: ${eventNames}

${contextType}${contextDefault}type ${config.name}State = ${stateNames};
type ${config.name}Event = ${eventNames};

interface MachineConfig {
  id: string;
  initial: ${config.name}State;
  states: Record<${config.name}State, { on: Partial<Record<${config.name}Event, ${config.name}State>> }>;
}

export const ${config.name}Config: MachineConfig = {
  id: '${config.name}',
  initial: '${initial}',
  states: {
${statesConfig}
  },
};

// Lightweight state machine interpreter
export function createMachine(config: MachineConfig) {
  let currentState = config.initial;
  const listeners = new Set<(state: ${config.name}State) => void>();

  return {
    getState: () => currentState,
    send: (event: ${config.name}Event) => {
      const stateConfig = config.states[currentState];
      const nextState = stateConfig?.on?.[event];
      if (nextState) {
        currentState = nextState;
        listeners.forEach(fn => fn(currentState));
      }
      return currentState;
    },
    subscribe: (fn: (state: ${config.name}State) => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// React hook
import { useState, useCallback, useEffect } from 'react';

export function use${config.name.charAt(0).toUpperCase() + config.name.slice(1)}() {
  const [machine] = useState(() => createMachine(${config.name}Config));
  const [state, setState] = useState(machine.getState());

  useEffect(() => {
    return machine.subscribe(setState);
  }, [machine]);

  const send = useCallback((event: ${config.name}Event) => {
    machine.send(event);
  }, [machine]);

  return { state, send };
}
`;
  }, [config]);

  return {
    config, setConfig, setMachineName,
    addState, removeState, updateState,
    addTransition, removeTransition, updateTransition,
    addContextField, removeContextField,
    generateCode,
  };
}
