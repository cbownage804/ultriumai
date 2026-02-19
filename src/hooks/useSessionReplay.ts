import { useState, useCallback } from 'react';

export interface ReplayEvent {
  type: 'click' | 'scroll' | 'navigation' | 'input' | 'resize';
  timestamp: number;
  data: Record<string, any>;
}

export interface Session {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  events: ReplayEvent[];
  pages: string[];
  device: string;
  screenSize: string;
  errorCount: number;
}

export function useSessionReplay() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const startRecording = useCallback(() => {
    const session: Session = {
      id: crypto.randomUUID(),
      startedAt: new Date(),
      duration: 0,
      events: [],
      pages: [typeof location !== 'undefined' ? location.pathname : '/'],
      device: /Mobi/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      errorCount: 0,
    };
    setSessions(prev => [session, ...prev].slice(0, 100));
    setActiveSession(session.id);
    setIsRecording(true);
    return session.id;
  }, []);

  const recordEvent = useCallback((type: ReplayEvent['type'], data: Record<string, any>) => {
    if (!activeSession) return;
    const event: ReplayEvent = { type, timestamp: Date.now(), data };
    setSessions(prev => prev.map(s => s.id === activeSession ? {
      ...s,
      events: [...s.events, event].slice(-5000),
      duration: Math.round((Date.now() - s.startedAt.getTime()) / 1000),
      pages: type === 'navigation' ? [...new Set([...s.pages, data.path])] : s.pages,
    } : s));
  }, [activeSession]);

  const stopRecording = useCallback(() => {
    if (activeSession) {
      setSessions(prev => prev.map(s => s.id === activeSession ? { ...s, endedAt: new Date(), duration: Math.round((Date.now() - s.startedAt.getTime()) / 1000) } : s));
    }
    setIsRecording(false);
    setActiveSession(null);
  }, [activeSession]);

  const getSessionById = useCallback((id: string) => sessions.find(s => s.id === id), [sessions]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const generateReplayScript = useCallback((): string => {
    return `<script>
(function() {
  var events = [];
  document.addEventListener('click', function(e) { events.push({ type: 'click', ts: Date.now(), x: e.clientX, y: e.clientY, target: e.target.tagName }); });
  window.addEventListener('scroll', function() { events.push({ type: 'scroll', ts: Date.now(), y: window.scrollY }); });
  setInterval(function() { if (events.length) { fetch('/api/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(events) }); events = []; } }, 5000);
})();
</script>`;
  }, []);

  return { sessions, isRecording, activeSession, startRecording, recordEvent, stopRecording, getSessionById, deleteSession, generateReplayScript };
}
