import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Building, Eye, EyeOff, Shield, Mail, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import vanguardLogo from '@/assets/vanguard-logo.png';

const VanguardAuthPage = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Request access form state
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestCompany, setRequestCompany] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/app';

  useEffect(() => {
    document.title = 'Sign In | Ultrium Vanguard';
  }, []);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else {
          setError(error.message);
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in to Vanguard.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // In a real implementation, this would send an email or create a pending user request
    // For now, we'll just show a success message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRequestSubmitted(true);
    setLoading(false);
    
    toast({
      title: "Request Submitted!",
      description: "We'll review your request and get back to you within 24-48 hours.",
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-600/5 to-[#0a0a0f]" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <img src={vanguardLogo} alt="Ultrium Vanguard" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white">Ultrium Vanguard</h1>
          <p className="text-white/60">
            Enterprise Security Platform
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/5">
                <TabsTrigger value="signin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="request" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  Request Access
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="mb-4 border-red-500/50 bg-red-500/10 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-white/80">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-white/80">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-white/60 hover:text-white hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0" 
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Request Access Tab */}
              <TabsContent value="request">
                {requestSubmitted ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Request Submitted!</h3>
                    <p className="text-white/60 max-w-xs mx-auto">
                      Thank you for your interest in Ultrium Vanguard. Our team will review your request and contact you within 24-48 hours.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('signin')}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield className="h-6 w-6 text-cyan-400" />
                      </div>
                      <p className="text-sm text-white/60">
                        Vanguard access is by invitation only. Submit a request below and our team will review your application.
                      </p>
                    </div>

                    <form onSubmit={handleRequestAccess} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="request-name" className="text-white/80">Full Name</Label>
                        <Input
                          id="request-name"
                          type="text"
                          placeholder="John Doe"
                          value={requestName}
                          onChange={(e) => setRequestName(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="request-email" className="text-white/80">Work Email</Label>
                        <Input
                          id="request-email"
                          type="email"
                          placeholder="you@company.com"
                          value={requestEmail}
                          onChange={(e) => setRequestEmail(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="request-company" className="text-white/80">Company Name</Label>
                        <Input
                          id="request-company"
                          type="text"
                          placeholder="Your Company Inc."
                          value={requestCompany}
                          onChange={(e) => setRequestCompany(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="request-message" className="text-white/80">Tell us about your security needs</Label>
                        <Textarea
                          id="request-message"
                          placeholder="Describe your organization's security requirements..."
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          rows={3}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500 resize-none"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0" 
                        disabled={loading}
                      >
                        {loading ? 'Submitting...' : 'Request Access'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>

                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm text-white/50 text-center mb-3">Or contact us directly:</p>
                      <div className="flex flex-col gap-2">
                        <a 
                          href="mailto:security@ultriumai.com" 
                          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 justify-center"
                        >
                          <Mail className="h-4 w-4" />
                          security@ultriumai.com
                        </a>
                        <a 
                          href="tel:+18888888888" 
                          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 justify-center"
                        >
                          <Phone className="h-4 w-4" />
                          (888) 888-8888
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-white/40">
          <p>
            By continuing, you agree to our{' '}
            <a href="https://ultriumai.com/terms" className="text-cyan-400 hover:text-cyan-300">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="https://ultriumai.com/privacy" className="text-cyan-400 hover:text-cyan-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VanguardAuthPage;
