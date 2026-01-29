import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';
import { useToast } from '@/hooks/use-toast';
import type { AccountType } from '@/hooks/useAccountType';
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('business');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getRedirectPath, shouldRedirectToRole } = useRoleBasedRedirect();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (shouldRedirectToRole()) {
      const redirectPath = getRedirectPath();
      navigate(redirectPath);
    }
  }, [shouldRedirectToRole, getRedirectPath, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: accountType,
            company_name: companyName,
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        if (error.message.includes('User already registered')) {
          setError('This email is already registered. Please try signing in instead.');
        } else if (error.message.includes('Invalid email')) {
          setError('Please enter a valid email address.');
        } else if (error.message.includes('Password')) {
          setError('Password must be at least 6 characters long.');
        } else {
          setError(error.message);
        }
      } else if (data?.user) {
        toast({
          title: "Welcome to UltriumGPT!",
          description: "Your account has been created successfully. Please check your email to confirm your address before signing in.",
        });
        
        // Navigate to appropriate dashboard based on role
        if (data.session) {
          // Small delay to allow role data to be set up
          setTimeout(() => {
            if (shouldRedirectToRole()) {
              const redirectPath = getRedirectPath();
              navigate(redirectPath);
            } else {
              navigate('/');
            }
          }, 500);
        }
      }
    } catch (err: any) {
      console.error('Sign up exception:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Welcome back!",
          description: "You've been successfully signed in.",
        });
        // Small delay to allow role data to be fetched
        setTimeout(() => {
          if (shouldRedirectToRole()) {
            const redirectPath = getRedirectPath();
            navigate(redirectPath);
          } else {
            navigate('/');
          }
        }, 500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden safe-area-all">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-80 h-48 sm:h-80 bg-violet-500/10 rounded-full blur-[60px] sm:blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 fade-slide-in">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-6 sm:mb-10">
          <img src={ultraiumAiLogo} alt="UltriumAI" className="h-12 sm:h-16 w-auto transition-transform duration-300 hover:scale-110" />
          <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">UltriumGPT</span>
        </div>

        <Card className="border-border/50 card-glass shadow-2xl shadow-primary/5">
          <CardHeader className="space-y-2 pb-4 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl text-center text-card-foreground">Welcome</CardTitle>
            <CardDescription className="text-center text-muted-foreground text-sm sm:text-base">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 touch-target">
                <TabsTrigger value="signin" className="text-sm sm:text-base py-2.5">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm sm:text-base py-2.5">Sign Up</TabsTrigger>
              </TabsList>
              
              {error && (
                <Alert className="mb-4 border-destructive/50 text-destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 sm:h-10 text-base sm:text-sm input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 sm:h-10 text-base sm:text-sm input-premium"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 sm:h-10 touch-target tap-scale text-base sm:text-sm" 
                    disabled={loading}
                    variant="hero"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-11 sm:h-10 text-base sm:text-sm input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 sm:h-10 text-base sm:text-sm input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType" className="text-sm font-medium">Account Type</Label>
                    <Select value={accountType} onValueChange={(value: AccountType) => setAccountType(value)}>
                      <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business" className="py-3 sm:py-2">Business</SelectItem>
                        <SelectItem value="msp" className="py-3 sm:py-2">MSP (Managed Service Provider)</SelectItem>
                        <SelectItem value="mssp" className="py-3 sm:py-2">MSSP (Managed Security Service Provider)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(accountType === 'msp' || accountType === 'mssp') && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-sm font-medium">Company Name</Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Enter your company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="h-11 sm:h-10 text-base sm:text-sm input-premium"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="text-sm font-medium">Password</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 sm:h-10 text-base sm:text-sm input-premium"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 sm:h-10 touch-target tap-scale text-base sm:text-sm" 
                    disabled={loading}
                    variant="hero"
                  >
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;