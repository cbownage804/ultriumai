/**
 * Hook to manage Vault linked accounts for multi-account switching
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface LinkedAccount {
  id: string;
  primary_user_id: string;
  linked_email: string;
  linked_user_id: string | null;
  display_name: string;
  is_active: boolean;
  last_accessed_at: string;
  created_at: string;
}

interface SessionCache {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const SESSION_CACHE_KEY = 'safepass_sessions';
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

export function useLinkedAccounts() {
  const { user } = useAuth();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentAccountEmail, setCurrentAccountEmail] = useState<string | null>(null);

  // Load linked accounts
  const loadLinkedAccounts = useCallback(async () => {
    if (!user) {
      setLinkedAccounts([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('safepass_linked_accounts')
        .select('*')
        .eq('primary_user_id', user.id)
        .eq('is_active', true)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;
      setLinkedAccounts((data as LinkedAccount[]) || []);
    } catch (error) {
      console.error('Error loading linked accounts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLinkedAccounts();
    setCurrentAccountEmail(user?.email || null);
  }, [loadLinkedAccounts, user?.email]);

  // Add a new linked account
  const addLinkedAccount = async (email: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Check if already linked
    const existing = linkedAccounts.find(a => a.linked_email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, error: 'This account is already linked' };
    }

    try {
      const { data, error } = await supabase
        .from('safepass_linked_accounts')
        .insert({
          primary_user_id: user.id,
          linked_email: email.toLowerCase(),
          display_name: displayName || 'Account',
        })
        .select()
        .single();

      if (error) throw error;
      
      setLinkedAccounts(prev => [data as LinkedAccount, ...prev]);
      return { success: true };
    } catch (error: any) {
      console.error('Error adding linked account:', error);
      return { success: false, error: error.message || 'Failed to add account' };
    }
  };

  // Remove a linked account
  const removeLinkedAccount = async (accountId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('safepass_linked_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      
      setLinkedAccounts(prev => prev.filter(a => a.id !== accountId));
      
      // Clear cached session for this account
      clearCachedSession(linkedAccounts.find(a => a.id === accountId)?.linked_email || '');
      
      return true;
    } catch (error) {
      console.error('Error removing linked account:', error);
      return false;
    }
  };

  // Update display name
  const updateDisplayName = async (accountId: string, displayName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('safepass_linked_accounts')
        .update({ display_name: displayName })
        .eq('id', accountId);

      if (error) throw error;
      
      setLinkedAccounts(prev => 
        prev.map(a => a.id === accountId ? { ...a, display_name: displayName } : a)
      );
      return true;
    } catch (error) {
      console.error('Error updating display name:', error);
      return false;
    }
  };

  // Session caching helpers
  const getCachedSessions = (): Record<string, SessionCache> => {
    try {
      const cached = localStorage.getItem(SESSION_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  };

  const setCachedSession = (email: string, accessToken: string, refreshToken: string) => {
    const sessions = getCachedSessions();
    sessions[email.toLowerCase()] = {
      email: email.toLowerCase(),
      accessToken,
      refreshToken,
      expiresAt: Date.now() + SESSION_TTL,
    };
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessions));
  };

  const getCachedSession = (email: string): SessionCache | null => {
    const sessions = getCachedSessions();
    const cached = sessions[email.toLowerCase()];
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }
    // Clear expired session
    if (cached) {
      clearCachedSession(email);
    }
    return null;
  };

  const clearCachedSession = (email: string) => {
    const sessions = getCachedSessions();
    delete sessions[email.toLowerCase()];
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessions));
  };

  const clearAllCachedSessions = () => {
    localStorage.removeItem(SESSION_CACHE_KEY);
  };

  // Cache current session before switching
  const cacheCurrentSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email && session.access_token && session.refresh_token) {
      setCachedSession(session.user.email, session.access_token, session.refresh_token);
    }
  };

  // Switch to a linked account
  const switchToAccount = async (email: string): Promise<{ success: boolean; needsPassword: boolean; error?: string }> => {
    if (!user) return { success: false, needsPassword: false, error: 'Not authenticated' };
    
    setIsSwitching(true);
    
    try {
      // Cache current session first
      await cacheCurrentSession();
      
      // Check if we have a cached session for target account
      const cachedSession = getCachedSession(email);
      
      if (cachedSession) {
        // Try to restore the session
        const { error } = await supabase.auth.setSession({
          access_token: cachedSession.accessToken,
          refresh_token: cachedSession.refreshToken,
        });
        
        if (!error) {
          // Update last accessed time
          await supabase
            .from('safepass_linked_accounts')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('linked_email', email.toLowerCase());
          
          setCurrentAccountEmail(email);
          setIsSwitching(false);
          return { success: true, needsPassword: false };
        }
        
        // Session expired or invalid, clear it
        clearCachedSession(email);
      }
      
      // No cached session - user needs to authenticate
      setIsSwitching(false);
      return { success: false, needsPassword: true };
    } catch (error: any) {
      console.error('Error switching account:', error);
      setIsSwitching(false);
      return { success: false, needsPassword: false, error: error.message };
    }
  };

  // Authenticate and switch to account
  const authenticateAndSwitch = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsSwitching(true);
    
    try {
      // Cache current session first
      await cacheCurrentSession();
      
      // Sign in to the new account
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.session) {
        // Cache the new session
        setCachedSession(email, data.session.access_token, data.session.refresh_token);
        
        // Update last accessed time
        await supabase
          .from('safepass_linked_accounts')
          .update({ last_accessed_at: new Date().toISOString() })
          .eq('linked_email', email.toLowerCase());
        
        setCurrentAccountEmail(email);
        setIsSwitching(false);
        return { success: true };
      }
      
      throw new Error('No session returned');
    } catch (error: any) {
      console.error('Error authenticating:', error);
      setIsSwitching(false);
      return { success: false, error: error.message || 'Authentication failed' };
    }
  };

  // Switch back to primary account
  const switchToPrimary = async (): Promise<{ success: boolean; needsPassword: boolean; error?: string }> => {
    if (!user?.email) return { success: false, needsPassword: true };
    return switchToAccount(user.email);
  };

  return {
    linkedAccounts,
    currentAccountEmail,
    isLoading,
    isSwitching,
    addLinkedAccount,
    removeLinkedAccount,
    updateDisplayName,
    switchToAccount,
    authenticateAndSwitch,
    switchToPrimary,
    clearAllCachedSessions,
    loadLinkedAccounts,
  };
}
