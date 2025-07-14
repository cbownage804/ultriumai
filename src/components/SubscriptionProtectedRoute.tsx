import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
  requiresPremium?: boolean;
  requiresEnterprise?: boolean;
}

export default function SubscriptionProtectedRoute({ 
  children, 
  requiresPremium = false,
  requiresEnterprise = false 
}: SubscriptionProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();

  // Still loading
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if subscription has expired
  const isSubscriptionExpired = subscription.subscription_end && 
    new Date(subscription.subscription_end) < new Date();

  // Check if user has required subscription level
  const hasRequiredAccess = () => {
    if (requiresEnterprise) {
      return subscription.subscription_tier === 'enterprise' && subscription.subscribed && !isSubscriptionExpired;
    }
    if (requiresPremium) {
      return (subscription.subscription_tier === 'premium' || subscription.subscription_tier === 'enterprise') 
        && subscription.subscribed && !isSubscriptionExpired;
    }
    // For basic access, either free tier or any paid subscription that hasn't expired
    return subscription.subscription_tier === 'free' || 
      (subscription.subscribed && !isSubscriptionExpired);
  };

  // Check if this is within trial period (first 7-14 days)
  const isInTrialPeriod = () => {
    if (!user.created_at) return false;
    const userCreatedAt = new Date(user.created_at);
    const now = new Date();
    const daysSinceSignup = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // 14 days trial for platform features, 7 days for GPT creation
    const trialDays = requiresPremium || requiresEnterprise ? 14 : 7;
    return daysSinceSignup <= trialDays;
  };

  // Allow access if user has required subscription or is in trial period
  if (hasRequiredAccess() || isInTrialPeriod()) {
    return <>{children}</>;
  }

  // Show subscription required screen
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle>Subscription Required</CardTitle>
          <CardDescription>
            {isSubscriptionExpired 
              ? "Your subscription has expired. Please renew to continue using this feature."
              : requiresEnterprise 
                ? "This feature requires an Enterprise subscription."
                : requiresPremium
                  ? "This feature requires a Premium or Enterprise subscription."
                  : "Your trial period has ended. Please subscribe to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full" 
            onClick={() => window.location.href = '/pricing'}
          >
            View Pricing Plans
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/dashboard'}
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}