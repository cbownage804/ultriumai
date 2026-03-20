import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Wave 16: Auth Flow Template Engine
 * One-command auth scaffolding via /auth slash command.
 * Generates complete auth flows with Supabase integration.
 */

export type AuthTemplate = 'full' | 'login-only' | 'magic-link' | 'oauth';

interface AuthScaffoldResult {
  files: ProjectFile[];
  routeInstructions: string;
  summary: string;
}

// ── Auth Provider ──
function generateAuthProvider(): ProjectFile {
  return {
    path: 'src/components/auth/AuthProvider.tsx',
    content: `import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
`,
    language: 'typescript',
  };
}

// ── Protected Route ──
function generateProtectedRoute(): ProjectFile {
  return {
    path: 'src/components/auth/ProtectedRoute.tsx',
    content: `import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
`,
    language: 'typescript',
  };
}

// ── Login Page ──
function generateLoginPage(template: AuthTemplate): ProjectFile {
  const hasPasswordAuth = template !== 'magic-link';
  const hasMagicLink = template === 'magic-link' || template === 'full';
  const hasOAuth = template === 'oauth' || template === 'full';

  return {
    path: 'src/pages/LoginPage.tsx',
    content: `import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
${hasMagicLink ? "  const [isMagicLink, setIsMagicLink] = useState(false);" : ''}

${hasPasswordAuth ? `  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully');
      navigate('/');
    }
    setIsLoading(false);
  };` : ''}

${hasMagicLink ? `  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for a login link!');
    }
    setIsLoading(false);
  };` : ''}

${hasOAuth ? `  const handleOAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) toast.error(error.message);
  };` : ''}

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

${hasOAuth ? `        <div className="space-y-2">
          <button onClick={() => handleOAuth('google')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">
            Continue with Google
          </button>
          <button onClick={() => handleOAuth('github')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">
            Continue with GitHub
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
          </div>
        </div>` : ''}

        <form onSubmit={${hasPasswordAuth ? (hasMagicLink ? 'isMagicLink ? handleMagicLink : handleLogin' : 'handleLogin') : 'handleMagicLink'}} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="you@example.com" />
          </div>
${hasPasswordAuth ? `          {${hasMagicLink ? '!isMagicLink && ' : ''}(
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
            </div>
          )}` : ''}
          <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {isLoading ? 'Loading...' : ${hasMagicLink ? "(isMagicLink ? 'Send magic link' : 'Sign in')" : "'Sign in'"}}
          </button>
        </form>

${hasMagicLink ? `        <button onClick={() => setIsMagicLink(!isMagicLink)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          {isMagicLink ? 'Use password instead' : 'Sign in with magic link'}
        </button>` : ''}

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
`,
    language: 'typescript',
  };
}

// ── Signup Page ──
function generateSignupPage(): ProjectFile {
  return {
    path: 'src/pages/SignupPage.tsx',
    content: `import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Check your email to verify.');
      navigate('/login');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Get started for free</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Full name</label>
            <input id="name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="John Doe" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {isLoading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
`,
    language: 'typescript',
  };
}

/**
 * Generate all auth scaffold files for a given template.
 */
export function scaffoldAuthFlow(
  template: AuthTemplate = 'full',
  existingFiles: ProjectFile[] = [],
): AuthScaffoldResult {
  const files: ProjectFile[] = [
    generateAuthProvider(),
    generateProtectedRoute(),
    generateLoginPage(template),
    generateSignupPage(),
  ];

  // Only include files that don't already exist
  const existingPaths = new Set(existingFiles.map(f => f.path));
  const newFiles = files.filter(f => !existingPaths.has(f.path));

  return {
    files: newFiles,
    routeInstructions: `
Add these routes to your App.tsx:
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

Wrap your app with <AuthProvider> in main.tsx or App.tsx.`,
    summary: `Generated ${newFiles.length} auth files: ${newFiles.map(f => f.path.split('/').pop()).join(', ')}`,
  };
}

/**
 * Parse /auth command and determine template type.
 */
export function parseAuthCommand(input: string): AuthTemplate | null {
  const match = input.match(/^\/auth\s*(full|login|magic-?link|oauth)?/i);
  if (!match) return null;
  const type = (match[1] || 'full').toLowerCase();
  if (type === 'login') return 'login-only';
  if (type.includes('magic')) return 'magic-link';
  if (type === 'oauth') return 'oauth';
  return 'full';
}
