import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CreditCard, AlertTriangle } from 'lucide-react';

export function GracePeriodManager() {
  const { subscription, openCustomerPortal } = useSubscription();
  const { user } = useAuth();
  const [gracePeriodInfo, setGracePeriodInfo] = useState<{
    isInGracePeriod: boolean;
    gracePeriodEnd: Date | null;
    daysRemaining: number;
  }>({
    isInGracePeriod: false,
    gracePeriodEnd: null,
    daysRemaining: 0
  });

  useEffect(() => {
    if (!subscription.subscription_end || subscription.subscribed) {
      setGracePeriodInfo({
        isInGracePeriod: false,
        gracePeriodEnd: null,
        daysRemaining: 0
      });
      return;
    }

    const subscriptionEndDate = new Date(subscription.subscription_end);
    const now = new Date();
    const gracePeriodDays = 7; // 7-day grace period
    const gracePeriodEnd = new Date(subscriptionEndDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
    
    const isExpired = subscriptionEndDate < now;
    const isInGracePeriod = isExpired && now < gracePeriodEnd;
    const daysRemaining = isInGracePeriod 
      ? Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    setGracePeriodInfo({
      isInGracePeriod,
      gracePeriodEnd: isInGracePeriod ? gracePeriodEnd : null,
      daysRemaining
    });
  }, [subscription.subscription_end, subscription.subscribed]);

  if (!gracePeriodInfo.isInGracePeriod) {
    return null;
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-amber-800 dark:text-amber-200">
            Payment Failed - Grace Period Active
          </CardTitle>
        </div>
        <CardDescription>
          Your subscription payment failed, but you still have access for a limited time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-200 dark:border-amber-800">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium text-amber-800 dark:text-amber-200">
              {gracePeriodInfo.daysRemaining} day{gracePeriodInfo.daysRemaining !== 1 ? 's' : ''} remaining
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Access will be restricted on {gracePeriodInfo.gracePeriodEnd?.toLocaleDateString()}
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">What happens next?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Update your payment method to restore your subscription</li>
            <li>• Contact support if you're experiencing billing issues</li>
            <li>• Access to premium features will be restricted after the grace period</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => openCustomerPortal('safesuite')} className="flex-1">
            <CreditCard className="w-4 h-4 mr-2" />
            Update Payment Method
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/contact'}
          >
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}