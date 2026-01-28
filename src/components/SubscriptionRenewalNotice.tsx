import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, X } from 'lucide-react';

export function SubscriptionRenewalNotice() {
  const { subscription, openCustomerPortal } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!subscription.subscription_end || !subscription.subscribed || dismissed) {
      setShowNotice(false);
      return;
    }

    const subscriptionEndDate = new Date(subscription.subscription_end);
    const now = new Date();
    const daysUntilRenewal = Math.ceil((subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Show notice 7 days before renewal
    setShowNotice(daysUntilRenewal <= 7 && daysUntilRenewal > 0);
  }, [subscription.subscription_end, subscription.subscribed, dismissed]);

  if (!showNotice) {
    return null;
  }

  const subscriptionEndDate = new Date(subscription.subscription_end!);
  const daysUntilRenewal = Math.ceil((subscriptionEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Alert className="border-blue-200 dark:border-blue-800">
      <Calendar className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-medium">
              Your subscription renews in {daysUntilRenewal} day{daysUntilRenewal !== 1 ? 's' : ''}
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              Next billing date: {subscriptionEndDate.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => openCustomerPortal('safesuite')}
              className="shrink-0"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Manage Billing
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDismissed(true)}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}