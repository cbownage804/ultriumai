import { useState, useCallback } from 'react';

export interface OAuthProvider {
  id: string;
  name: string;
  enabled: boolean;
  clientId: string;
  callbackUrl: string;
  scopes: string[];
}

const DEFAULT_PROVIDERS: OAuthProvider[] = [
  { id: 'google', name: 'Google', enabled: false, clientId: '', callbackUrl: '/auth/callback', scopes: ['openid', 'email', 'profile'] },
  { id: 'github', name: 'GitHub', enabled: false, clientId: '', callbackUrl: '/auth/callback', scopes: ['read:user', 'user:email'] },
  { id: 'discord', name: 'Discord', enabled: false, clientId: '', callbackUrl: '/auth/callback', scopes: ['identify', 'email'] },
];

export function useOAuthProviderSetup() {
  const [providers, setProviders] = useState<OAuthProvider[]>(DEFAULT_PROVIDERS);
  const [redirectUrl, setRedirectUrl] = useState('/dashboard');

  const toggleProvider = useCallback((id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  }, []);

  const updateProvider = useCallback((id: string, updates: Partial<OAuthProvider>) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const generateCode = useCallback((): string => {
    const enabled = providers.filter(p => p.enabled);
    if (enabled.length === 0) return '// Enable at least one OAuth provider';

    const imports = `import { supabase } from '@/integrations/supabase/client';\nimport { useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';`;

    const signInFns = enabled.map(p => `
export async function signInWith${p.name}() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: '${p.id}',
    options: {
      redirectTo: \`\${window.location.origin}${p.callbackUrl}\`,
      scopes: '${p.scopes.join(' ')}',
    },
  });
  if (error) throw error;
  return data;
}`).join('\n');

    const callbackComponent = `
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('${redirectUrl}');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}`;

    const buttonComponent = `
export function OAuthButtons() {
  return (
    <div className="flex flex-col gap-2">
${enabled.map(p => `      <button
        onClick={() => signInWith${p.name}()}
        className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
      >
        Sign in with ${p.name}
      </button>`).join('\n')}
    </div>
  );
}`;

    return [imports, signInFns, callbackComponent, buttonComponent].join('\n\n');
  }, [providers, redirectUrl]);

  return { providers, redirectUrl, setRedirectUrl, toggleProvider, updateProvider, generateCode };
}
