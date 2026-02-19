import { useState, useCallback } from 'react';

export interface CodeReaction {
  id: string;
  filePath: string;
  line: number;
  emoji: string;
  userId: string;
  email: string;
  timestamp: Date;
}

export interface InlineAnnotation {
  id: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  text: string;
  userId: string;
  email: string;
  color: string;
  resolved: boolean;
  timestamp: Date;
}

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '🎉', '🤔', '👀', '🐛', '💡', '✅', '❌'];

export function useCodeReactions() {
  const [reactions, setReactions] = useState<CodeReaction[]>([]);
  const [annotations, setAnnotations] = useState<InlineAnnotation[]>([]);

  const addReaction = useCallback((filePath: string, line: number, emoji: string, userId: string, email: string) => {
    // Toggle: remove if exists, add if not
    setReactions(prev => {
      const existing = prev.find(r => r.filePath === filePath && r.line === line && r.emoji === emoji && r.userId === userId);
      if (existing) return prev.filter(r => r.id !== existing.id);
      return [...prev, { id: crypto.randomUUID(), filePath, line, emoji, userId, email, timestamp: new Date() }];
    });
  }, []);

  const addAnnotation = useCallback((
    filePath: string, lineStart: number, lineEnd: number,
    text: string, userId: string, email: string, color: string
  ) => {
    const annotation: InlineAnnotation = {
      id: crypto.randomUUID(), filePath, lineStart, lineEnd,
      text, userId, email, color, resolved: false, timestamp: new Date(),
    };
    setAnnotations(prev => [...prev, annotation]);
    return annotation;
  }, []);

  const resolveAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);

  const getReactionsForLine = useCallback((filePath: string, line: number) => {
    return reactions.filter(r => r.filePath === filePath && r.line === line);
  }, [reactions]);

  const getAnnotationsForFile = useCallback((filePath: string) => {
    return annotations.filter(a => a.filePath === filePath && !a.resolved);
  }, [annotations]);

  const clearReactionsForFile = useCallback((filePath: string) => {
    setReactions(prev => prev.filter(r => r.filePath !== filePath));
  }, []);

  return {
    reactions,
    annotations,
    availableEmojis: REACTION_EMOJIS,
    addReaction,
    addAnnotation,
    resolveAnnotation,
    deleteAnnotation,
    getReactionsForLine,
    getAnnotationsForFile,
    clearReactionsForFile,
  };
}
