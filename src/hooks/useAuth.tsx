import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { isWraythDomain, isVanguardDomain } from '@/utils/subdomain';
import { devLog } from '@/lib/logger';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  updateProfile: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session FIRST before setting up listener
    // This prevents race conditions where the listener fires before initial session is set
    // Use a timeout to prevent infinite loading when Supabase is down
    let sessionTimeout: ReturnType<typeof setTimeout>;

    const initSession = supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(sessionTimeout);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile with its own timeout
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data: profileData }) => {
            setProfile(profileData);
          });
        
        // Don't let profile fetch block loading forever
        Promise.race([
          profilePromise,
          new Promise(resolve => setTimeout(resolve, 8000))
        ]).then(() => setLoading(false));
        return;
      }
      
      setLoading(false);
    }).catch((err) => {
      clearTimeout(sessionTimeout);
      devLog.warn('Auth session fetch failed, continuing as unauthenticated:', err);
      setLoading(false);
    });

    // Hard timeout: if getSession takes >10s, stop loading anyway
    sessionTimeout = setTimeout(() => {
      devLog.warn('Auth session fetch timed out after 10s — continuing as unauthenticated');
      setLoading(false);
    }, 10000);

    // Set up auth state listener AFTER getting initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Don't set user to null during token refresh - only update if we have a new session
        // This prevents the ProtectedRoute from redirecting during token refresh
        if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          return;
        }
        
        // For sign out or session expiry, properly clear state
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }
        
        // For other events (SIGNED_IN, USER_UPDATED, etc.)
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Fetch user profile - use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', newSession.user.id)
              .single();
            
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      devLog.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    try {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const returnProduct = searchParams.get('return');

      // Use production domain for email redirect URLs, not preview domains
      const isProduction = hostname === 'ultriumai.com' || hostname === 'www.ultriumai.com' ||
                           hostname === 'ultriumai.app' || hostname === 'www.ultriumai.app' ||
                           hostname.endsWith('.ultriumai.com') || hostname.endsWith('.ultriumai.app');
      const origin = isProduction ? 'https://ultriumai.app' : window.location.origin;

      // Ensure email confirmation links return to the correct dashboard for subdomains
      // and for prefixed product routes on the main domain.
      let redirectPath = '/auth/callback';
      if (isWraythDomain()) {
        redirectPath = '/auth/callback';
      } else if (returnProduct === 'safesuite') {
        redirectPath = '/auth/callback?return=safesuite';
      } else if (pathname.startsWith('/app')) {
        redirectPath = '/auth/callback?return=safesuite';
      } else if (isVanguardDomain()) {
        redirectPath = '/auth/callback';
      } else if (returnProduct === 'vanguard') {
        redirectPath = '/auth/callback?return=vanguard';
      } else if (pathname.startsWith('/vanguard')) {
        redirectPath = '/auth/callback?return=vanguard';
      }

      const redirectUrl = `${origin}${redirectPath}`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });
      return { error };
    } catch (error) {
      devLog.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      // Always clear local state - even if server returns error (session may already be expired)
      // This prevents loops where local state thinks user is logged in but server disagrees
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Set a flag to prevent redirect loops
      sessionStorage.setItem('signing-out', 'true');
      
      // Clear all auth cookies manually before reload
      const authKey = 'sb-nsyobmjpdpvesjwdphlh-auth-token';
      const expireDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Try all cookie deletion variations
      document.cookie = `${authKey}=; expires=${expireDate}; path=/`;
      document.cookie = `${authKey}=; expires=${expireDate}; path=/; domain=ultriumai.com`;
      document.cookie = `${authKey}=; expires=${expireDate}; path=/; domain=.ultriumai.com`;
      
      // Clear localStorage
      try {
        localStorage.removeItem(authKey);
        localStorage.clear();
      } catch (e) {
        devLog.warn('Could not clear localStorage:', e);
      }
      
      // Wait for storage clearing to complete, then reload
      setTimeout(() => {
        window.location.href = '/auth';
      }, 200);
      
      return { error };
    } catch (error) {
      devLog.error('Sign out error:', error);
      // Clear state even on exception to prevent stuck states
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear cookies even on error
      const authKey = 'sb-nsyobmjpdpvesjwdphlh-auth-token';
      const expireDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = `${authKey}=; expires=${expireDate}; path=/`;
      document.cookie = `${authKey}=; expires=${expireDate}; path=/; domain=ultriumai.com`;
      document.cookie = `${authKey}=; expires=${expireDate}; path=/; domain=.ultriumai.com`;
      
      try {
        localStorage.clear();
      } catch (e) {
        devLog.warn('Could not clear localStorage:', e);
      }
      
      setTimeout(() => {
        window.location.href = '/auth';
      }, 200);
      
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }

      return { error };
    } catch (error) {
      devLog.error('Update profile error:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};