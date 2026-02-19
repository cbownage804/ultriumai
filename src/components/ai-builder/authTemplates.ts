/**
 * Phase 17: Auth Flow Generation Templates
 * Pre-built, tested auth patterns for the AI App Builder.
 * These inject real, working Supabase Auth code into generated projects.
 */

export interface AuthTemplate {
  id: string;
  name: string;
  description: string;
  /** Files to inject into the project */
  files: { path: string; content: string }[];
  /** Context string appended to the AI system prompt */
  aiContext: string;
}

// ── Shared auth utilities ──

const AUTH_LISTENER_JS = `
// ── Auth state listener (auto-injected) ──
let currentUser = null;
const authListeners = new Set();

function onAuthChange(callback) {
  authListeners.add(callback);
  if (currentUser) callback(currentUser);
  return () => authListeners.delete(callback);
}

function notifyAuthListeners(user) {
  currentUser = user;
  authListeners.forEach(cb => cb(user));
}

supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user ?? null;
  notifyAuthListeners(user);
  if (event === 'SIGNED_OUT') {
    if (window.router) window.router.navigate('/login');
  }
});

// Check initial session
supabase.auth.getSession().then(({ data: { session } }) => {
  notifyAuthListeners(session?.user ?? null);
});

function requireAuth(renderFn) {
  return function(container) {
    if (!currentUser) {
      if (window.router) window.router.navigate('/login');
      else {
        container.innerHTML = '<div style="text-align:center;padding:4rem;color:#888;">Please sign in to continue.</div>';
      }
      return;
    }
    renderFn(container, currentUser);
  };
}

function getCurrentUser() { return currentUser; }
`;

const AUTH_LISTENER_REACT = `
// ── Auth context & hooks (auto-injected) ──
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function ProtectedRoute({ children, fallback }) {
  const { user, loading } = useAuth();
  if (loading) return fallback || <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}>Loading...</div>;
  if (!user) {
    window.location.hash = '#/login';
    return null;
  }
  return children;
}
`;

// ── Login page (vanilla) ──

const LOGIN_PAGE_JS = `
function renderLoginPage(container) {
  container.innerHTML = \`
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-dark,#0a0a0f);padding:1rem;">
      <div style="width:100%;max-width:400px;">
        <div style="text-align:center;margin-bottom:2rem;">
          <h1 style="font-size:1.75rem;font-weight:700;color:#fff;">Welcome Back</h1>
          <p style="color:#888;margin-top:0.5rem;">Sign in to your account</p>
        </div>
        <form id="login-form" style="display:flex;flex-direction:column;gap:1rem;">
          <div>
            <label style="display:block;color:#ccc;font-size:0.875rem;margin-bottom:0.25rem;">Email</label>
            <input type="email" id="login-email" required placeholder="you@example.com"
              style="width:100%;padding:0.75rem;border-radius:0.5rem;border:1px solid #333;background:#111;color:#fff;outline:none;"/>
          </div>
          <div>
            <label style="display:block;color:#ccc;font-size:0.875rem;margin-bottom:0.25rem;">Password</label>
            <input type="password" id="login-password" required placeholder="••••••••"
              style="width:100%;padding:0.75rem;border-radius:0.5rem;border:1px solid #333;background:#111;color:#fff;outline:none;"/>
          </div>
          <button type="submit" id="login-btn"
            style="padding:0.75rem;border-radius:0.5rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:600;border:none;cursor:pointer;">
            Sign In
          </button>
          <div id="auth-providers" style="display:flex;flex-direction:column;gap:0.5rem;"></div>
          <div style="text-align:center;margin-top:0.5rem;">
            <a href="#" id="to-signup" style="color:#8b5cf6;font-size:0.875rem;">Don't have an account? Sign up</a>
          </div>
          <div style="text-align:center;">
            <a href="#" id="to-reset" style="color:#666;font-size:0.8rem;">Forgot password?</a>
          </div>
          <div id="login-error" style="color:#ef4444;font-size:0.875rem;text-align:center;display:none;"></div>
        </form>
      </div>
    </div>
  \`;

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errDiv = document.getElementById('login-error');
    btn.textContent = 'Signing in...'; btn.disabled = true; errDiv.style.display = 'none';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      errDiv.textContent = error.message; errDiv.style.display = 'block';
      btn.textContent = 'Sign In'; btn.disabled = false;
    } else {
      if (window.router) window.router.navigate('/');
    }
  });

  document.getElementById('to-signup')?.addEventListener('click', (e) => { e.preventDefault(); if (window.router) window.router.navigate('/signup'); });
  document.getElementById('to-reset')?.addEventListener('click', (e) => { e.preventDefault(); if (window.router) window.router.navigate('/reset-password'); });
}
`;

const SIGNUP_PAGE_JS = `
function renderSignupPage(container) {
  container.innerHTML = \`
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-dark,#0a0a0f);padding:1rem;">
      <div style="width:100%;max-width:400px;">
        <div style="text-align:center;margin-bottom:2rem;">
          <h1 style="font-size:1.75rem;font-weight:700;color:#fff;">Create Account</h1>
          <p style="color:#888;margin-top:0.5rem;">Sign up to get started</p>
        </div>
        <form id="signup-form" style="display:flex;flex-direction:column;gap:1rem;">
          <div>
            <label style="display:block;color:#ccc;font-size:0.875rem;margin-bottom:0.25rem;">Full Name</label>
            <input type="text" id="signup-name" required placeholder="Jane Smith"
              style="width:100%;padding:0.75rem;border-radius:0.5rem;border:1px solid #333;background:#111;color:#fff;outline:none;"/>
          </div>
          <div>
            <label style="display:block;color:#ccc;font-size:0.875rem;margin-bottom:0.25rem;">Email</label>
            <input type="email" id="signup-email" required placeholder="you@example.com"
              style="width:100%;padding:0.75rem;border-radius:0.5rem;border:1px solid #333;background:#111;color:#fff;outline:none;"/>
          </div>
          <div>
            <label style="display:block;color:#ccc;font-size:0.875rem;margin-bottom:0.25rem;">Password</label>
            <input type="password" id="signup-password" required placeholder="Min 6 characters" minlength="6"
              style="width:100%;padding:0.75rem;border-radius:0.5rem;border:1px solid #333;background:#111;color:#fff;outline:none;"/>
          </div>
          <button type="submit" id="signup-btn"
            style="padding:0.75rem;border-radius:0.5rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:600;border:none;cursor:pointer;">
            Create Account
          </button>
          <div style="text-align:center;margin-top:0.5rem;">
            <a href="#" id="to-login" style="color:#8b5cf6;font-size:0.875rem;">Already have an account? Sign in</a>
          </div>
          <div id="signup-error" style="color:#ef4444;font-size:0.875rem;text-align:center;display:none;"></div>
          <div id="signup-success" style="color:#22c55e;font-size:0.875rem;text-align:center;display:none;"></div>
        </form>
      </div>
    </div>
  \`;

  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const btn = document.getElementById('signup-btn');
    const errDiv = document.getElementById('signup-error');
    const successDiv = document.getElementById('signup-success');
    btn.textContent = 'Creating...'; btn.disabled = true; errDiv.style.display = 'none'; successDiv.style.display = 'none';
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) {
      errDiv.textContent = error.message; errDiv.style.display = 'block';
      btn.textContent = 'Create Account'; btn.disabled = false;
    } else {
      successDiv.textContent = 'Check your email to confirm your account!'; successDiv.style.display = 'block';
      btn.textContent = 'Create Account'; btn.disabled = false;
    }
  });

  document.getElementById('to-login')?.addEventListener('click', (e) => { e.preventDefault(); if (window.router) window.router.navigate('/login'); });
}
`;

const RESET_PAGE_JS = `
function renderResetPasswordPage(container) {
  container.innerHTML = \`
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-dark,#0a0a0f);padding:1rem;">
      <div style="width:100%;max-width:400px;">
        <div style="text-align:center;margin-bottom:2rem;">
          <h1 style="font-size:1.75rem;font-weight:700;color:#fff;">Reset Password</h1>
          <p style="color:#888;margin-top:0.5rem;">Enter your email to receive a reset link</p>
        </div>
        <form id="reset-form" style="display:flex;flex-direction:column;gap:1rem;">
          <div>
            <label style="display:block;color:#ccc;font-size:0.875rem;margin-bottom:0.25rem;">Email</label>
            <input type="email" id="reset-email" required placeholder="you@example.com"
              style="width:100%;padding:0.75rem;border-radius:0.5rem;border:1px solid #333;background:#111;color:#fff;outline:none;"/>
          </div>
          <button type="submit" id="reset-btn"
            style="padding:0.75rem;border-radius:0.5rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:600;border:none;cursor:pointer;">
            Send Reset Link
          </button>
          <div style="text-align:center;">
            <a href="#" id="back-to-login" style="color:#8b5cf6;font-size:0.875rem;">Back to login</a>
          </div>
          <div id="reset-msg" style="color:#22c55e;font-size:0.875rem;text-align:center;display:none;"></div>
        </form>
      </div>
    </div>
  \`;

  document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    const btn = document.getElementById('reset-btn');
    const msgDiv = document.getElementById('reset-msg');
    btn.textContent = 'Sending...'; btn.disabled = true;
    await supabase.auth.resetPasswordForEmail(email);
    msgDiv.textContent = 'If an account exists, a reset link was sent to your email.';
    msgDiv.style.display = 'block';
    btn.textContent = 'Send Reset Link'; btn.disabled = false;
  });

  document.getElementById('back-to-login')?.addEventListener('click', (e) => { e.preventDefault(); if (window.router) window.router.navigate('/login'); });
}
`;

// ── OAuth provider buttons ──

function getOAuthButtonCode(provider: string): string {
  const labels: Record<string, string> = {
    google: 'Continue with Google',
    github: 'Continue with GitHub',
  };
  const label = labels[provider] || `Continue with ${provider}`;
  return `
  // ${provider} OAuth button
  (function() {
    const providerDiv = document.getElementById('auth-providers');
    if (providerDiv) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '${label}';
      btn.style.cssText = 'padding:0.75rem;border-radius:0.5rem;background:#222;color:#fff;border:1px solid #333;cursor:pointer;font-weight:500;';
      btn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: '${provider}' });
        if (error) alert(error.message);
      });
      providerDiv.appendChild(btn);
    }
  })();
  `;
}

// ── React auth pages ──

const LOGIN_PAGE_REACT = `import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-center mb-8">Sign in to your account</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white" placeholder="you@example.com"/>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white" placeholder="••••••••"/>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div id="oauth-buttons" className="flex flex-col gap-2"></div>
          <p className="text-center text-sm"><a href="#/signup" className="text-purple-400">Don't have an account? Sign up</a></p>
          <p className="text-center text-xs"><a href="#/reset-password" className="text-gray-500">Forgot password?</a></p>
        </form>
      </div>
    </div>
  );
}
`;

const SIGNUP_PAGE_REACT = `import { useState } from 'react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const { error: err } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name } }
    });
    if (err) { setError(err.message); }
    else { setSuccess('Check your email to confirm your account!'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Create Account</h1>
        <p className="text-gray-400 text-center mb-8">Sign up to get started</p>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white" placeholder="Jane Smith"/>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white" placeholder="you@example.com"/>
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white" placeholder="Min 6 characters"/>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {success && <p className="text-green-400 text-sm text-center">{success}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <p className="text-center text-sm"><a href="#/login" className="text-purple-400">Already have an account? Sign in</a></p>
        </form>
      </div>
    </div>
  );
}
`;

const RESET_PAGE_REACT = `import { useState } from 'react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email);
    setSent(true); setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Reset Password</h1>
        <p className="text-gray-400 text-center mb-8">Enter your email to receive a reset link</p>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white" placeholder="you@example.com"/>
          </div>
          {sent && <p className="text-green-400 text-sm text-center">If an account exists, a reset link was sent.</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p className="text-center text-sm"><a href="#/login" className="text-purple-400">Back to login</a></p>
        </form>
      </div>
    </div>
  );
}
`;

// ── Template builders ──

export function buildAuthTemplate(providers: string[], isReactMode: boolean): AuthTemplate {
  const hasEmail = providers.includes('email');
  const hasMagicLink = providers.includes('magic_link');
  const hasGoogle = providers.includes('google');
  const hasGithub = providers.includes('github');
  const oauthProviders = providers.filter(p => ['google', 'github'].includes(p));

  if (isReactMode) {
    return buildReactAuthTemplate(providers, oauthProviders);
  }
  return buildVanillaAuthTemplate(providers, oauthProviders);
}

function buildVanillaAuthTemplate(providers: string[], oauthProviders: string[]): AuthTemplate {
  const files: { path: string; content: string }[] = [];

  // Auth listener (always included)
  files.push({ path: 'auth.js', content: AUTH_LISTENER_JS });

  // Login page
  let loginContent = LOGIN_PAGE_JS;
  for (const p of oauthProviders) {
    loginContent += getOAuthButtonCode(p);
  }
  files.push({ path: 'login.js', content: loginContent });

  // Signup page
  files.push({ path: 'signup.js', content: SIGNUP_PAGE_JS });

  // Reset password page
  files.push({ path: 'reset-password.js', content: RESET_PAGE_JS });

  const providerList = providers.join(', ');

  return {
    id: 'auth-vanilla',
    name: 'Authentication (Vanilla)',
    description: `Login, signup, password reset with ${providerList}`,
    files,
    aiContext: `AUTH SYSTEM INJECTED: The project now has a complete authentication system with ${providerList} providers.
Available globals: currentUser, onAuthChange(callback), requireAuth(renderFn), getCurrentUser().
Auth files: auth.js (listener + helpers), login.js (login page), signup.js (signup page), reset-password.js (password reset).
Routes /login, /signup, /reset-password should be registered in the router.
Wrap protected route handlers with requireAuth(): router.register('/dashboard', requireAuth(renderDashboard)).
The supabase.auth.onAuthStateChange listener auto-redirects to /login on sign-out.
DO NOT regenerate auth pages from scratch — modify the existing auth files instead.`,
  };
}

function buildReactAuthTemplate(providers: string[], oauthProviders: string[]): AuthTemplate {
  const files: { path: string; content: string }[] = [];

  // Auth context
  files.push({ path: 'AuthProvider.tsx', content: AUTH_LISTENER_REACT });

  // Pages
  files.push({ path: 'LoginPage.tsx', content: LOGIN_PAGE_REACT });
  files.push({ path: 'SignupPage.tsx', content: SIGNUP_PAGE_REACT });
  files.push({ path: 'ResetPasswordPage.tsx', content: RESET_PAGE_REACT });

  const providerList = providers.join(', ');

  return {
    id: 'auth-react',
    name: 'Authentication (React)',
    description: `Login, signup, password reset with ${providerList}`,
    files,
    aiContext: `AUTH SYSTEM INJECTED: The project now has a complete React authentication system with ${providerList} providers.
Components: AuthProvider (wraps app), useAuth() hook (returns {user, loading}), ProtectedRoute (wrapper component).
Pages: LoginPage, SignupPage, ResetPasswordPage.
Wrap the App in <AuthProvider> and use <ProtectedRoute> for protected routes.
The useAuth() hook provides the current user and loading state.
DO NOT regenerate auth pages from scratch — modify the existing auth components instead.`,
  };
}

/** Detect if current project files suggest React mode */
export function detectProjectMode(files: { path: string }[]): 'react' | 'vanilla' {
  return files.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) ? 'react' : 'vanilla';
}

/** Auth intent keywords for detection */
export const AUTH_INTENT_KEYWORDS = [
  'login', 'log in', 'sign in', 'signin', 'signup', 'sign up',
  'register', 'auth', 'authentication', 'user account', 'my account',
  'protected', 'private', 'logged in', 'session', 'logout', 'log out',
  'password', 'forgot password', 'reset password', 'magic link',
  'google sign', 'github sign', 'oauth', 'social login',
];

/** Detect if a user message implies auth intent */
export function detectAuthIntent(message: string): boolean {
  const lower = message.toLowerCase();
  return AUTH_INTENT_KEYWORDS.some(kw => lower.includes(kw));
}
