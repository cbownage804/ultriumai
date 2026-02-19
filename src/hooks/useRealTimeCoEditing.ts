import { useState, useCallback, useRef } from 'react';

export interface CRDTOperation {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
  vectorClock: Record<string, number>;
}

export interface CoEditingSession {
  id: string;
  filePath: string;
  participants: { userId: string; email: string; color: string; cursorPos: number }[];
  operations: CRDTOperation[];
  status: 'active' | 'paused' | 'ended';
  createdAt: Date;
}

export function useRealTimeCoEditing() {
  const [sessions, setSessions] = useState<CoEditingSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);
  const vectorClockRef = useRef<Record<string, number>>({});

  const startSession = useCallback((filePath: string, userId: string, email: string) => {
    const session: CoEditingSession = {
      id: crypto.randomUUID(),
      filePath,
      participants: [{ userId, email, color: '#06b6d4', cursorPos: 0 }],
      operations: [],
      status: 'active',
      createdAt: new Date(),
    };
    setSessions(prev => [...prev, session]);
    setActiveSessionId(session.id);
    setIsConnected(true);
    return session;
  }, []);

  const joinSession = useCallback((sessionId: string, userId: string, email: string) => {
    const colors = ['#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6'];
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const idx = s.participants.length % colors.length;
      return { ...s, participants: [...s.participants, { userId, email, color: colors[idx], cursorPos: 0 }] };
    }));
    setActiveSessionId(sessionId);
    setIsConnected(true);
  }, []);

  const applyOperation = useCallback((sessionId: string, op: Omit<CRDTOperation, 'id' | 'timestamp' | 'vectorClock'>) => {
    const clock = { ...vectorClockRef.current };
    clock[op.userId] = (clock[op.userId] || 0) + 1;
    vectorClockRef.current = clock;

    const fullOp: CRDTOperation = {
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      vectorClock: { ...clock },
    };

    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, operations: [...s.operations, fullOp].slice(-200) } : s
    ));
    return fullOp;
  }, []);

  const resolveConflict = useCallback((op1: CRDTOperation, op2: CRDTOperation): CRDTOperation => {
    setConflictCount(c => c + 1);
    // Last-writer-wins with vector clock tiebreak
    if (op1.timestamp > op2.timestamp) return op1;
    if (op2.timestamp > op1.timestamp) return op2;
    return op1.userId < op2.userId ? op1 : op2;
  }, []);

  const endSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, status: 'ended' } : s
    ));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setIsConnected(false);
    }
  }, [activeSessionId]);

  const getActiveSession = useCallback(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  return {
    sessions,
    activeSessionId,
    isConnected,
    conflictCount,
    startSession,
    joinSession,
    applyOperation,
    resolveConflict,
    endSession,
    getActiveSession,
  };
}
