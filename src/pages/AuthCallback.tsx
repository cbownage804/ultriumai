import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { devLog } from '@/lib/logger';

/**
 * Handles OAuth callback from Supabase authentication providers.
 * This page processes the auth callback URL and redirects to the appropriate dashboard.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash (Supabase OAuth flow)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          devLog.error('Auth callback error:', error);
          navigate('/auth?error=callback_failed', { replace: true });
          return;
        }

        if (data.session) {
          devLog.info('Auth callback successful, redirecting to hub');
          // Successfully authenticated - redirect to product hub
          navigate('/hub', { replace: true });
        } else {
          // No session found - try to exchange the code from URL
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const queryParams = new URLSearchParams(window.location.search);
          
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const code = queryParams.get('code');
          
          if (accessToken && refreshToken) {
            // Set the session from tokens
            const { error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (setError) {
              devLog.error('Failed to set session:', setError);
              navigate('/auth?error=session_failed', { replace: true });
              return;
            }
            
            navigate('/hub', { replace: true });
          } else if (code) {
            // Exchange the code for a session
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              devLog.error('Failed to exchange code:', exchangeError);
              navigate('/auth?error=code_exchange_failed', { replace: true });
              return;
            }
            
            navigate('/hub', { replace: true });
          } else {
            devLog.warn('No auth tokens or code found in callback URL');
            navigate('/auth', { replace: true });
          }
        }
      } catch (err) {
        devLog.error('Unexpected auth callback error:', err);
        navigate('/auth?error=unexpected', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
