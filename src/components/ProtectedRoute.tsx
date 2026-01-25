import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isSafeSuiteDomain, isVanguardDomain } from '@/utils/subdomain';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate auth page based on subdomain
    if (isSafeSuiteDomain()) {
      // On SafeSuite subdomain, redirect to /auth and preserve intended destination
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    if (isVanguardDomain() || location.pathname.startsWith('/vanguard')) {
      return <Navigate to="/vanguard/auth" state={{ from: location }} replace />;
    }
    // SafeSuite routes on main domain
    if (location.pathname.startsWith('/safesuite')) {
      return <Navigate to="/safesuite/auth" state={{ from: location }} replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  // Check if email is confirmed
  const isEmailConfirmed = user.email_confirmed_at != null;

  if (!isEmailConfirmed) {
    const handleResendVerification = async () => {
      setResending(true);
      try {
        await supabase.functions.invoke('send-auth-email', {
          body: {
            type: 'confirmation',
            email: user.email,
            redirectUrl: `${window.location.origin}/dashboard`,
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

  return <>{children}</>;
}
