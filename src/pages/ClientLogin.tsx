import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const ClientLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState('');

  // Get client info from URL params
  const clientId = searchParams.get('client');
  const [clientInfo, setClientInfo] = useState<any>(null);

  useEffect(() => {
    // If user is already logged in, redirect to their portal
    if (user) {
      checkUserClientAccess();
    }
  }, [user]);

  useEffect(() => {
    // Load client branding info
    if (clientId) {
      loadClientInfo();
    }
  }, [clientId]);

  const checkUserClientAccess = async () => {
    if (!user) return;

    try {
      // Check if user has access to any client portal
      const { data: clientUser, error } = await supabase
        .from('client_users')
        .select(`
          client_id,
          role,
          is_active,
          msp_clients!inner(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error checking client access:', error);
        return;
      }

      if (clientUser) {
        // Redirect to their client portal
        navigate(`/client-portal/${clientUser.client_id}`);
      }
    } catch (error) {
      console.error('Error checking client access:', error);
    }
  };

  const loadClientInfo = async () => {
    if (!clientId) return;

    try {
      const { data: client, error: clientError } = await supabase
        .from('msp_clients')
        .select('company_name, msp_id')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      const { data: msp, error: mspError } = await supabase
        .from('msps')
        .select('brand_name, brand_color, logo_url')
        .eq('id', client.msp_id)
        .single();

      if (mspError) throw mspError;

      setClientInfo({
        ...client,
        ...msp
      });
    } catch (error) {
      console.error('Error loading client info:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const result = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName
            }
          }
        });
        
        if (result.error) {
          throw result.error;
        }

        toast({
          title: "Account Created",
          description: "Please check your email to verify your account before signing in."
        });
        setIsSignUp(false);
      } else {
        const result = await signIn(formData.email, formData.password);
        
        if (result.error) {
          throw result.error;
        }

        // User will be redirected by the useEffect
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const brandColor = clientInfo?.brand_color || '#3b82f6';
  const brandName = clientInfo?.brand_name || 'Ultrium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            {clientInfo?.logo_url ? (
              <img 
                src={clientInfo.logo_url} 
                alt={`${brandName} Logo`}
                className="h-12 w-auto"
              />
            ) : (
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: brandColor }}
              >
                <Shield className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: brandColor }}>
            {clientInfo?.company_name || brandName} Portal
          </h1>
          {clientInfo?.company_name && (
            <p className="text-muted-foreground">
              {clientInfo.company_name}
            </p>
          )}
        </div>

        {/* Login/Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Create your account to access the portal'
                : 'Enter your credentials to access your portal'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required={isSignUp}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                style={{ backgroundColor: brandColor }}
                disabled={loading}
              >
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>

            {!isSignUp && (
              <div className="mt-2 text-center">
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground"
                  onClick={() => navigate('/auth/forgot-password')}
                >
                  Forgot your password?
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to MSP */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/hub')}
            className="text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hub
          </Button>
        </div>
      </div>
    </div>
  );
};