import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Crown, X } from 'lucide-react';
import { useState } from 'react';

export function TrialBanner() {
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed || subscription.subscribed) return null;

  // Calculate trial info
  const userCreatedAt = new Date(user.created_at);
  const now = new Date();
  const daysSinceSignup = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  const trialDays = 14; // 14 days max trial
  const remainingTrialDays = Math.max(0, trialDays - daysSinceSignup);
  
  const isInTrial = remainingTrialDays > 0;
  const isTrialExpired = remainingTrialDays <= 0;

  if (!isInTrial && !isTrialExpired) return null;

  return (
    <Alert className={`relative ${isTrialExpired ? 'border-destructive' : 'border-amber-500'}`}>
      <Clock className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isTrialExpired ? (
              <span className="text-destructive font-medium">
                Your trial has expired. Subscribe now to continue using premium features.
              </span>
            ) : (
              <span>
                <strong>{Math.ceil(remainingTrialDays)} days left</strong> in your trial. 
                Subscribe now to continue accessing all features.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button 
              size="sm" 
              onClick={() => window.location.href = '/pricing'}
              className="shrink-0"
            >
              <Crown className="w-4 h-4 mr-1" />
              {isTrialExpired ? 'Subscribe' : 'Upgrade Now'}
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