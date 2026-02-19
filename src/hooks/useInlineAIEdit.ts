/**
 * Inline AI Edit — Phase 29 (Cmd+I)
 * Manages inline AI code editing within the Monaco editor.
 */

import { useState, useCallback, useRef } from 'react';

export interface InlineEditState {
  isOpen: boolean;
  filePath: string | null;
  selectedCode: string;
  startLine: number;
  endLine: number;
  prompt: string;
  suggestion: string | null;
  isLoading: boolean;
}

const INITIAL_STATE: InlineEditState = {
  isOpen: false,
  filePath: null,
  selectedCode: '',
  startLine: 0,
  endLine: 0,
  prompt: '',
  suggestion: null,
  isLoading: false,
};

export function useInlineAIEdit(onSendToAI: (prompt: string) => void) {
  const [state, setState] = useState<InlineEditState>(INITIAL_STATE);
  const resolveRef = useRef<((code: string | null) => void) | null>(null);

  const openInlineEdit = useCallback((
    filePath: string,
    selectedCode: string,
    startLine: number,
    endLine: number,
  ) => {
    setState({
      isOpen: true,
      filePath,
      selectedCode,
      startLine,
      endLine,
      prompt: '',
      suggestion: null,
      isLoading: false,
    });
  }, []);

  const submitPrompt = useCallback((prompt: string) => {
    if (!state.filePath || !prompt.trim()) return;

    setState(prev => ({ ...prev, prompt, isLoading: true }));

    const editPrompt = `[INLINE EDIT — DO NOT explain, output ONLY the replacement code block]
File: ${state.filePath} (lines ${state.startLine}-${state.endLine})

SELECTED CODE:
\`\`\`
${state.selectedCode}
\`\`\`

INSTRUCTION: ${prompt}

Output ONLY the replacement code (no markdown fences, no explanation). The output will directly replace the selected code.`;

    onSendToAI(editPrompt);
  }, [state, onSendToAI]);

  const applySuggestion = useCallback((suggestion: string) => {
    setState(prev => ({ ...prev, suggestion }));
    resolveRef.current?.(suggestion);
  }, []);

  const acceptSuggestion = useCallback((): { code: string; startLine: number; endLine: number } | null => {
    if (!state.suggestion) return null;
    const result = {
      code: state.suggestion,
      startLine: state.startLine,
      endLine: state.endLine,
    };
    setState(INITIAL_STATE);
    return result;
  }, [state]);

  const dismissEdit = useCallback(() => {
    setState(INITIAL_STATE);
    resolveRef.current?.(null);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  return {
    inlineEdit: state,
    openInlineEdit,
    submitPrompt,
    applySuggestion,
    acceptSuggestion,
    dismissEdit,
    setLoading,
  };
}
