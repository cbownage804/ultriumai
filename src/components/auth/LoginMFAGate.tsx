/**
 * LoginMFAGate — wraps the post-login redirect logic.
 * After successful email/password auth, checks if the user has 2FA enabled.
 * If yes AND the device is not trusted, shows the MFA challenge.
 * Stores verification in sessionStorage so it persists across page navigations
 * but clears when the browser tab closes.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTrustedDevice } from '@/hooks/useTrustedDevice';
import { MFALoginChallenge } from '@/components/safesuite/MFALoginChallenge';
import { Loader2 } from 'lucide-react';

const getMfaSessionKey = (userId: string) => `mfa_login_verified_${userId}`;

interface LoginMFAGateProps {
  children: React.ReactNode;
}

export function LoginMFAGate({ children }: LoginMFAGateProps) {
  const { user } = useAuth();
  const { loading: trustLoading, isTrusted } = useTrustedDevice();
  const [checking, setChecking] = useState(true);
  const [needsMFA, setNeedsMFA] = useState(false);

  useEffect(() => {
    if (!user || trustLoading) {
      if (!user) setChecking(false);
      return;
    }

    // Already verified this browser session
    const sessionKey = getMfaSessionKey(user.id);
    if (sessionStorage.getItem(sessionKey) === 'true') {
      setChecking(false);
      setNeedsMFA(false);
      return;
    }

    // Device is trusted (30-day bypass) — skip MFA
    if (isTrusted) {
      sessionStorage.setItem(sessionKey, 'true');
      setChecking(false);
      setNeedsMFA(false);
      return;
    }

    // Check if user has MFA enabled
    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('security_settings')
          .select('two_factor_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data?.two_factor_enabled) {
          setNeedsMFA(true);
        } else {
          setNeedsMFA(false);
        }
      } catch {
        setNeedsMFA(false);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [user?.id, trustLoading, isTrusted]);

  const handleMfaSuccess = () => {
    if (user) {
      sessionStorage.setItem(getMfaSessionKey(user.id), 'true');
    }
    setNeedsMFA(false);
  };

  if (checking || trustLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsMFA && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <MFALoginChallenge onSuccess={handleMfaSuccess} />
      </div>
    );
  }

  return <>{children}</>;
}
