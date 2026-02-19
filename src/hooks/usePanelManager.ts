/**
 * Panel State Manager — Phase 56
 * Consolidates panel toggle logic into a single reducer.
 */

import { useReducer, useCallback } from 'react';

type PanelAction =
  | { type: 'toggle'; panel: string }
  | { type: 'open'; panel: string }
  | { type: 'close'; panel: string }
  | { type: 'closeAll' }
  | { type: 'exclusiveOpen'; panel: string; group: string[] };

type PanelState = Record<string, boolean>;

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'toggle':
      return { ...state, [action.panel]: !state[action.panel] };
    case 'open':
      return { ...state, [action.panel]: true };
    case 'close':
      return { ...state, [action.panel]: false };
    case 'closeAll':
      return Object.fromEntries(Object.keys(state).map(k => [k, false]));
    case 'exclusiveOpen': {
      const next = { ...state };
      for (const p of action.group) next[p] = false;
      next[action.panel] = !state[action.panel];
      return next;
    }
    default:
      return state;
  }
}

export function usePanelManager(initialPanels: string[] = []) {
  const initialState: PanelState = {};
  for (const p of initialPanels) initialState[p] = false;

  const [panels, dispatch] = useReducer(panelReducer, initialState);

  const toggle = useCallback((panel: string) => dispatch({ type: 'toggle', panel }), []);
  const open = useCallback((panel: string) => dispatch({ type: 'open', panel }), []);
  const close = useCallback((panel: string) => dispatch({ type: 'close', panel }), []);
  const closeAll = useCallback(() => dispatch({ type: 'closeAll' }), []);
  const exclusiveOpen = useCallback((panel: string, group: string[]) =>
    dispatch({ type: 'exclusiveOpen', panel, group }), []);

  const isOpen = useCallback((panel: string) => !!panels[panel], [panels]);

  return { panels, toggle, open, close, closeAll, exclusiveOpen, isOpen, dispatch };
}
