import { useState, useCallback } from 'react';

export interface SessionConfig {
  timeoutMinutes: number;
  idleTimeoutMinutes: number;
  refreshRotation: boolean;
  showWarningBeforeSeconds: number;
  autoLogoutRoute: string;
}

export function useSessionManager() {
  const [config, setConfig] = useState<SessionConfig>({
    timeoutMinutes: 60,
    idleTimeoutMinutes: 15,
    refreshRotation: true,
    showWarningBeforeSeconds: 60,
    autoLogoutRoute: '/auth',
  });

  const updateConfig = useCallback((updates: Partial<SessionConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const generateCode = useCallback((): string => {
    return `import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SESSION_TIMEOUT = ${config.timeoutMinutes} * 60 * 1000;
const IDLE_TIMEOUT = ${config.idleTimeoutMinutes} * 60 * 1000;
const WARNING_BEFORE = ${config.showWarningBeforeSeconds} * 1000;

export function useSessionTimeout() {
  const navigate = useNavigate();
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const warningTimer = useRef<ReturnType<typeof setTimeout>>();
  const [showWarning, setShowWarning] = useState(false);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('${config.autoLogoutRoute}');
  }, [navigate]);

  const resetIdleTimer = useCallback(() => {
    setShowWarning(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    idleTimer.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [resetIdleTimer]);
${config.refreshRotation ? `
  useEffect(() => {
    const interval = setInterval(async () => {
      const { error } = await supabase.auth.refreshSession();
      if (error) logout();
    }, SESSION_TIMEOUT / 2);
    return () => clearInterval(interval);
  }, [logout]);
` : ''}
  return { showWarning, extendSession: resetIdleTimer, logout };
}

export function SessionWarningBanner() {
  const { showWarning, extendSession, logout } = useSessionTimeout();
  if (!showWarning) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-destructive/90 text-destructive-foreground p-3 text-center text-sm">
      Your session is about to expire.
      <button onClick={extendSession} className="ml-2 underline font-medium">Stay logged in</button>
      <button onClick={logout} className="ml-2 underline opacity-70">Log out</button>
    </div>
  );
}`;
  }, [config]);

  return { config, updateConfig, generateCode };
}
