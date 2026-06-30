import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginMFAGate } from '@/components/auth/LoginMFAGate';
import { isWraythDomain, isVanguardDomain } from '@/utils/subdomain';
import { Mail, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);
  const [forceChecking, setForceChecking] = useState(false);
  
  const isOnSubdomain = isWraythDomain() || isVanguardDomain();
  
  // On subdomains, explicitly force session check
  useEffect(() => {
    if (isOnSubdomain && !user && !loading) {
      setForceChecking(true);
      supabase.auth.getSession().then(() => {
        setTimeout(() => {
          setSessionCheckComplete(true);
          setForceChecking(false);
        }, 2000);
      }).catch(() => {
        setSessionCheckComplete(true);
        setForceChecking(false);
      });
      const timer = setTimeout(() => {
        setSessionCheckComplete(true);
        setForceChecking(false);
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setSessionCheckComplete(true);
      setForceChecking(false);
    }
  }, [isOnSubdomain, user, loading]);

  if (loading || forceChecking || (isOnSubdomain && !user && !sessionCheckComplete)) {
    return <AuthLoadingScreen 
      message={isOnSubdomain && !user ? 'Restoring your session' : 'Loading your dashboard'}
      showProgress={isOnSubdomain && !user}
    />;
  }

  if (!user) {
    const returnPath = location.pathname;
    
    // Determine product context for return routing
    let returnProduct = '';
    if (isWraythDomain()) {
      returnProduct = 'safesuite';
    } else if (isVanguardDomain()) {
      returnProduct = 'vanguard';
    } else if (location.pathname.startsWith('/app')) {
      returnProduct = 'safesuite';
    } else if (location.pathname.startsWith('/vanguard')) {
      returnProduct = 'vanguard';
    }
    
    // If on main domain or preview, use local navigation
    if (!isOnSubdomain) {
      const authUrl = returnProduct 
        ? `/auth?return=${returnProduct}&path=${encodeURIComponent(returnPath)}`
        : '/auth';
      return <Navigate to={authUrl} state={{ from: location }} replace />;
    }
    
    // On production subdomain: redirect to main domain auth
    const hostname = window.location.hostname;
    const isProductionSubdomain = hostname.endsWith('.ultriumai.com');
    
    if (isProductionSubdomain) {
      const appDomain = 'https://ultriumai.app';
      const authUrl = `${appDomain}/auth?return=${returnProduct}&path=${encodeURIComponent(returnPath)}`;
      window.location.href = authUrl;
      return null;
    }
    
    // On preview subdomain: use local auth
    const authUrl = `/auth?return=${returnProduct}&path=${encodeURIComponent(returnPath)}`;
    return <Navigate to={authUrl} state={{ from: location }} replace />;
  }

  // Check if email is confirmed
  const isEmailConfirmed = user.email_confirmed_at != null;

  if (!isEmailConfirmed) {
    // Determine correct redirect URL based on product context
    const getProductRedirectUrl = () => {
      // Check subdomain first
      if (isWraythDomain()) {
        return `${window.location.origin}/dashboard`;
      }
      if (isVanguardDomain()) {
        return `${window.location.origin}/dashboard`;
      }
      
      // Check URL path prefix
      if (location.pathname.startsWith('/app')) {
        return `${window.location.origin}/safesuite/dashboard`;
      }
      if (location.pathname.startsWith('/vanguard')) {
        return `${window.location.origin}/vanguard/dashboard`;
      }
      
      // Default to main domain dashboard
      return `${window.location.origin}/dashboard`;
    };

    const handleResendVerification = async () => {
      setResending(true);
      try {
        const redirectUrl = getProductRedirectUrl();
        await supabase.functions.invoke('send-auth-email', {
          body: {
            type: 'confirmation',
            email: user.email,
            redirectUrl,
          },
        });
        toast({
          title: "Verification email sent",
          description: "Please check your inbox and click the confirmation link.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to resend verification email. Please try again.",
          variant: "destructive",
        });
      } finally {
        setResending(false);
      }
    };

    const handleSignOut = async () => {
      await signOut();
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle className="text-xl">Verify Your Email</CardTitle>
            <CardDescription>
              We sent a verification link to <span className="font-medium text-foreground">{user.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please check your inbox and click the confirmation link to access your account. 
              This helps us keep your account secure and prevent impersonation.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleResendVerification} 
                disabled={resending}
                variant="outline"
                className="w-full"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSignOut} 
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                Sign out and try a different email
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Already verified? Try refreshing this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <LoginMFAGate>{children}</LoginMFAGate>;
}
