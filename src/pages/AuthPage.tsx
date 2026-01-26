import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Building, Users, Eye, EyeOff, Mail, Shield, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";
import safesuiteLogo from '@/assets/safesuite-logo.png';
import vanguardLogo from '@/assets/vanguard-logo.png';

// Product subdomain URLs
const PRODUCT_URLS: Record<string, string> = {
  safesuite: 'https://safesuite.ultriumai.com',
  vanguard: 'https://vanguard.ultriumai.com',
};

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [accountType, setAccountType] = useState('individual');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Prevent double-submit (can cause a successful signup + a second failing request,
  // leaving the UI stuck showing "Database error saving new user").
  const submitLockRef = useRef(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Get return product and path from URL params
  const returnProduct = searchParams.get('return');
  const returnPath = searchParams.get('path') || '/dashboard';

  const from = location.state?.from?.pathname || '/hub';

  // Handle post-login redirect based on return params - with delay for subdomain redirects
  useEffect(() => {
    if (user && !redirecting) {
      // If returning to a specific product, redirect to its subdomain
      if (returnProduct && PRODUCT_URLS[returnProduct]) {
        setRedirecting(true);
        
        // Wait 1 second to ensure session cookie is fully written before redirecting
        const timer = setTimeout(() => {
          const targetUrl = `${PRODUCT_URLS[returnProduct]}${returnPath}`;
          window.location.href = targetUrl;
        }, 1000);
        
        return () => clearTimeout(timer);
      }
      // Otherwise navigate to the Product Hub (or original location)
      navigate(from === '/' ? '/hub' : from, { replace: true });
    }
  }, [user, navigate, from, returnProduct, returnPath, redirecting]);

  // Show loading state while redirecting to subdomain
  if (redirecting) {
    return <AuthLoadingScreen 
      message="Redirecting to your product"
      showProgress={true}
    />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(mapAuthError(error));
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      submitLockRef.current = false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      submitLockRef.current = false;
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      submitLockRef.current = false;
      return;
    }

    setLoading(true);
    setError('');

    try {
      const metadata = {
        full_name: fullName,
        company_name: companyName,
        account_type: accountType,
      };

      const { error } = await signUp(email, password, metadata);
      if (error) {
        setError(mapAuthError(error));
      } else {
        setSignupSuccess(true);
        setActiveTab('signin');
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      submitLockRef.current = false;
    }
  };

  const mapAuthError = (error: any): string => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('email not confirmed')) {
      return 'Please verify your email address before signing in. Check your inbox for the confirmation link.';
    }
    if (message.includes('user already registered') || message.includes('already been registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (message.includes('password')) {
      return 'Password must be at least 6 characters long.';
    }
    if (message.includes('rate limit')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return error?.message || 'An error occurred. Please try again.';
  };

  const getAccountTypeIcon = () => {
    switch (accountType) {
      case 'business':
        return <Building className="h-4 w-4" />;
      case 'msp':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Determine branding based on return product
  const getBranding = () => {
    if (returnProduct === 'safesuite') {
      return {
        logo: safesuiteLogo,
        name: 'SafeSuite',
        tagline: 'Personal & Business Security',
        bgClass: 'from-emerald-500/5 via-background to-emerald-500/5',
      };
    }
    if (returnProduct === 'vanguard') {
      return {
        logo: vanguardLogo,
        name: 'Vanguard',
        tagline: 'Enterprise Security Operations',
        bgClass: 'from-cyan-500/5 via-background to-purple-500/5',
      };
    }
    return {
      logo: ultraiumAiLogo,
      name: 'UltriumAI',
      tagline: 'UltriumAI',
      bgClass: 'from-primary/5 via-background to-secondary/5',
    };
  };

  const branding = getBranding();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${branding.bgClass} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md space-y-6">
        {/* Header - Dynamic Branding */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Link to="/">
              <img src={branding.logo} alt={branding.name} className="h-14 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">{branding.tagline}</p>
          {returnProduct && (
            <p className="text-xs text-muted-foreground mt-2">
              Sign in to continue to {branding.name}
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            {/* Vanguard is invite-only - no signup allowed */}
            {returnProduct === 'vanguard' ? (
              <div className="text-center">
                <h2 className="text-lg font-semibold">Sign In</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Vanguard access is by invitation only
                </p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </CardHeader>

          <CardContent>
            {signupSuccess && (
              <Alert className="mb-4 border-green-500/50 bg-green-500/10">
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
              <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {/* Sign In Form - Always shown for Vanguard, or when signin tab is active */}
            {(returnProduct === 'vanguard' || activeTab === 'signin') && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

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

                <div className="text-center space-y-2">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline block"
                  >
                    Forgot your password?
                  </Link>
                  <Link 
                    to="/mfa-recovery" 
                    className="text-sm text-muted-foreground hover:text-primary hover:underline block"
                  >
                    Lost access to your authenticator?
                  </Link>
                </div>
              </form>
            )}

            {/* Sign Up Form - Hidden for Vanguard */}
            {returnProduct !== 'vanguard' && activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-type">Account Type</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        {getAccountTypeIcon()}
                        <SelectValue placeholder="Select account type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Individual
                        </div>
                      </SelectItem>
                      <SelectItem value="business">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Business
                        </div>
                      </SelectItem>
                      <SelectItem value="msp">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          MSP / IT Provider
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(accountType === 'business' || accountType === 'msp') && (
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      type="text"
                      placeholder="Your Company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
