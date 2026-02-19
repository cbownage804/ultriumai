import { useState, useCallback } from 'react';

export interface ScreenAnnotation {
  id: string;
  type: 'arrow' | 'rectangle' | 'circle' | 'text' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  userId: string;
  timestamp: Date;
}

export interface ScreenShareSession {
  id: string;
  hostUserId: string;
  hostEmail: string;
  viewers: { userId: string; email: string }[];
  annotations: ScreenAnnotation[];
  isActive: boolean;
  startedAt: Date;
}

export function useScreenShare() {
  const [sessions, setSessions] = useState<ScreenShareSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ScreenAnnotation['type']>('arrow');
  const [annotationColor, setAnnotationColor] = useState('#f43f5e');

  const startSharing = useCallback((userId: string, email: string) => {
    const session: ScreenShareSession = {
      id: crypto.randomUUID(),
      hostUserId: userId,
      hostEmail: email,
      viewers: [],
      annotations: [],
      isActive: true,
      startedAt: new Date(),
    };
    setSessions(prev => [...prev, session]);
    setActiveSessionId(session.id);
    setIsSharing(true);
    return session;
  }, []);

  const stopSharing = useCallback(() => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, isActive: false } : s
    ));
    setActiveSessionId(null);
    setIsSharing(false);
  }, [activeSessionId]);

  const joinViewing = useCallback((sessionId: string, userId: string, email: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, viewers: [...s.viewers, { userId, email }] } : s
    ));
    setActiveSessionId(sessionId);
    setIsViewing(true);
  }, []);

  const addAnnotation = useCallback((sessionId: string, annotation: Omit<ScreenAnnotation, 'id' | 'timestamp'>) => {
    const full: ScreenAnnotation = { ...annotation, id: crypto.randomUUID(), timestamp: new Date() };
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, annotations: [...s.annotations, full] } : s
    ));
    return full;
  }, []);

  const clearAnnotations = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, annotations: [] } : s
    ));
  }, []);

  const getActiveSession = useCallback(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  return {
    sessions,
    activeSessionId,
    isSharing,
    isViewing,
    selectedTool,
    annotationColor,
    setSelectedTool,
    setAnnotationColor,
    startSharing,
    stopSharing,
    joinViewing,
    addAnnotation,
    clearAnnotations,
    getActiveSession,
  };
}
