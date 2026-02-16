import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Crown, CreditCard, Calendar, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIStudioUpgradeModal } from '@/components/ai-studio/AIStudioUpgradeModal';

export function SubscriptionStatus() {
  const { subscription, isLoading, openCustomerPortal } = useSubscription();
  const { user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-muted h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trial info
  const userCreatedAt = user?.created_at ? new Date(user.created_at) : new Date();
  const now = new Date();
  const daysSinceSignup = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  const trialDays = subscription.subscription_tier === 'free' ? 14 : 7;
  const remainingTrialDays = Math.max(0, trialDays - daysSinceSignup);
  const trialProgress = Math.min(100, (daysSinceSignup / trialDays) * 100);
  
  const isInTrial = remainingTrialDays > 0 && !subscription.subscribed;
  const isSubscriptionExpired = subscription.subscription_end && 
    new Date(subscription.subscription_end) < now;

  const getStatusBadge = () => {
    if (subscription.subscribed && !isSubscriptionExpired) {
      return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
        <Crown className="w-3 h-3 mr-1" />
        {subscription.subscription_tier.charAt(0).toUpperCase() + subscription.subscription_tier.slice(1)}
      </Badge>;
    }
    if (isInTrial) {
      return <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        Trial - {Math.ceil(remainingTrialDays)} days left
      </Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
  };

  const getExpirationDate = () => {
    if (subscription.subscription_end) {
      return new Date(subscription.subscription_end).toLocaleDateString();
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription Status
            </CardTitle>
            <CardDescription>
              Current plan and usage information
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trial countdown for trial users */}
        {isInTrial && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Trial Progress</span>
                  <span>{Math.ceil(remainingTrialDays)} days remaining</span>
                </div>
                <Progress value={trialProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Your trial expires on {new Date(userCreatedAt.getTime() + trialDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription expiration warning */}
        {isSubscriptionExpired && (
          <Alert variant="destructive">
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Your subscription expired on {getExpirationDate()}. Please renew to continue using premium features.
            </AlertDescription>
          </Alert>
        )}

        {/* Current plan details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Plan</p>
            <p className="font-medium capitalize">{subscription.subscription_tier}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium">
              {subscription.subscribed && !isSubscriptionExpired ? 'Active' : 
               isInTrial ? 'Trial' : 'Inactive'}
            </p>
          </div>
          {subscription.subscription_end && (
            <>
              <div>
                <p className="text-muted-foreground">Next Billing</p>
                <p className="font-medium">{getExpirationDate()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Auto-Renew</p>
                <p className="font-medium">
                  {subscription.subscribed ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {!subscription.subscribed || isSubscriptionExpired ? (
            <Button className="flex-1" onClick={() => setUpgradeModalOpen(true)}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          ) : (
            <Button variant="outline" onClick={() => openCustomerPortal('ai-studio')} className="flex-1">
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          )}
          {isInTrial && (
            <Button onClick={() => setUpgradeModalOpen(true)}>
              <Crown className="w-4 h-4 mr-2" />
              Subscribe Now
            </Button>
          )}
        </div>
      </CardContent>
      <AIStudioUpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </Card>
  );
}