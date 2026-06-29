/**
 * Hook for managing customer portal session
 */

import { useState, useEffect, useCallback } from 'react';

interface PortalUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  canViewAllTickets: boolean;
  clientId: string;
  mustChangePassword: boolean;
}

interface WraythAccess {
  safepass_enabled: boolean;
  safescan_enabled: boolean;
  safeweb_enabled: boolean;
  safetrack_enabled: boolean;
}

interface PortalSession {
  sessionToken: string;
  user: PortalUser;
  safeSuiteAccess: WraythAccess;
}

export function usePortalSession() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load session from localStorage on mount
    const storedSession = localStorage.getItem('portal_session');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
      } catch (e) {
        console.error('Failed to parse stored session:', e);
        localStorage.removeItem('portal_session');
        localStorage.removeItem('portal_session_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newSession: PortalSession) => {
    localStorage.setItem('portal_session', JSON.stringify(newSession));
    localStorage.setItem('portal_session_token', newSession.sessionToken);
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('portal_session');
    localStorage.removeItem('portal_session_token');
    setSession(null);
  }, []);

  const updateSession = useCallback((updates: Partial<PortalSession>) => {
    if (session) {
      const newSession = { ...session, ...updates };
      localStorage.setItem('portal_session', JSON.stringify(newSession));
      setSession(newSession);
    }
  }, [session]);

  const getSessionToken = useCallback(() => {
    return localStorage.getItem('portal_session_token');
  }, []);

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    login,
    logout,
    updateSession,
    getSessionToken,
  };
}
