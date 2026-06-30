/**
 * Wrayth Auth Page
 * Login/Signup for Wrayth portal
 */

import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader';

export default function WraythAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'login';
  
  const { signIn, signUp, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        setError(error.message);
        return;
      }
      toast.success('Welcome back!');
      // Send first-time users to Ray. Returning users go straight to dashboard.
      const { data: { user: signedIn } } = await supabase.auth.getUser();
      const onboarded = signedIn && localStorage.getItem(`wrayth.ray.onboarded:${signedIn.id}`) === 'true';
      navigate(onboarded ? '/app/dashboard' : '/onboarding/ray');
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signupEmail || !signupPassword || !signupConfirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      const { error } = await signUp(signupEmail, signupPassword, { full_name: signupName });
      if (error) {
        if (error.message.includes('User already registered') || 
            error.message.includes('users_email_partial_key') ||
            error.message.toLowerCase().includes('duplicate key value')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Database error saving new user')) {
          setError('This email may already be registered. Check your inbox or spam folder for a confirmation email, or try signing in.');
        } else {
          setError(error.message);
        }
        return;
      }
      
      setSignupSuccess(true);
      setActiveTab('login');
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/app" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Wrayth
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/app" className="block mb-8">
            <AuthBrandHeader />
          </Link>

          {/* Auth card */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin}>
                  <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>Sign in to access your security dashboard</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {signupSuccess && (
                      <Alert className="border-green-500/50 bg-green-500/10">
                        <Mail className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-400">
                          <strong>Account created!</strong> We've sent a confirmation email. 
                          <span className="block mt-1 text-muted-foreground">
                            Can't find it? <strong>Check your spam or junk folder</strong> – emails sometimes end up there.
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {error}
                          {error.toLowerCase().includes('email not confirmed') && (
                            <span className="block mt-1 text-muted-foreground">
                              Can't find the confirmation email? <strong>Check your spam or junk folder.</strong>
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                    <div className="flex flex-col items-center gap-2">
                      <Link to="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
                        Forgot your password?
                      </Link>
                      <Link to="/auth/mfa-recovery" className="text-sm text-muted-foreground hover:text-foreground">
                        Lost access to your authenticator?
                      </Link>
                    </div>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup}>
                  <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>Start your free trial today</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Name (optional)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By signing up, you agree to our{' '}
                      <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
                    </p>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}
