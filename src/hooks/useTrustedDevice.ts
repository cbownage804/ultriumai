/**
 * Hook to manage trusted devices for MFA bypass
 * Allows users to skip MFA verification for 24 hours on trusted devices
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Generate a simple device fingerprint
const generateFingerprint = (): string => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
  ];
  
  // Simple hash
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

interface TrustedDeviceState {
  loading: boolean;
  isTrusted: boolean;
  error: string | null;
}

export function useTrustedDevice() {
  const { user } = useAuth();
  const [state, setState] = useState<TrustedDeviceState>({
    loading: true,
    isTrusted: false,
    error: null
  });

  const fingerprint = generateFingerprint();

  const checkTrustedDevice = useCallback(async () => {
    if (!user) {
      setState({ loading: false, isTrusted: false, error: null });
      return false;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('mfa_trusted_devices')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .eq('device_fingerprint', fingerprint)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error checking trusted device:', error);
        setState({ loading: false, isTrusted: false, error: error.message });
        return false;
      }

      const isTrusted = !!data;
      setState({ loading: false, isTrusted, error: null });
      return isTrusted;
    } catch (err) {
      console.error('Error checking trusted device:', err);
      setState({ loading: false, isTrusted: false, error: 'Failed to check device trust' });
      return false;
    }
  }, [user, fingerprint]);

  const trustDevice = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete any existing trust for this device first
      await supabase
        .from('mfa_trusted_devices')
        .delete()
        .eq('user_id', user.id)
        .eq('device_fingerprint', fingerprint);

      // Insert new trust with 30-day expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase
        .from('mfa_trusted_devices')
        .insert({
          user_id: user.id,
          device_fingerprint: fingerprint,
          user_agent: navigator.userAgent,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('Error trusting device:', error);
        return false;
      }

      setState({ loading: false, isTrusted: true, error: null });
      return true;
    } catch (err) {
      console.error('Error trusting device:', err);
      return false;
    }
  }, [user, fingerprint]);

  const revokeTrust = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mfa_trusted_devices')
        .delete()
        .eq('user_id', user.id)
        .eq('device_fingerprint', fingerprint);

      if (error) {
        console.error('Error revoking device trust:', error);
        return false;
      }

      setState({ loading: false, isTrusted: false, error: null });
      return true;
    } catch (err) {
      console.error('Error revoking device trust:', err);
      return false;
    }
  }, [user, fingerprint]);

  const revokeAllDevices = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mfa_trusted_devices')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error revoking all devices:', error);
        return false;
      }

      setState({ loading: false, isTrusted: false, error: null });
      return true;
    } catch (err) {
      console.error('Error revoking all devices:', err);
      return false;
    }
  }, [user]);

  useEffect(() => {
    checkTrustedDevice();
  }, [checkTrustedDevice]);

  return {
    ...state,
    fingerprint,
    checkTrustedDevice,
    trustDevice,
    revokeTrust,
    revokeAllDevices
  };
}
