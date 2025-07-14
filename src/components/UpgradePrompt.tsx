import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Zap, Star } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  requiredTier: 'premium' | 'enterprise';
  description?: string;
  benefits?: string[];
}

export function UpgradePrompt({ 
  feature, 
  requiredTier, 
  description,
  benefits = []
}: UpgradePromptProps) {
  const { subscription } = useSubscription();
  const { user } = useAuth();

  // Calculate trial info
  const userCreatedAt = user?.created_at ? new Date(user.created_at) : new Date();
  const now = new Date();
  const daysSinceSignup = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  const remainingTrialDays = Math.max(0, 14 - daysSinceSignup);
  const isInTrial = remainingTrialDays > 0 && !subscription.subscribed;

  const defaultBenefits = {
    premium: [
      'Custom GPT creation and management',
      'Advanced security tools and monitoring',
      'MSP dashboard and client management',
      'Priority customer support',
      '5,000 monthly AI credits'
    ],
    enterprise: [
      'Everything in Premium',
      'White-label solutions',
      'Advanced API access',
      'Custom integrations',
      '15,000 monthly AI credits',
      'Dedicated account manager'
    ]
  };

  const tierBenefits = benefits.length > 0 ? benefits : defaultBenefits[requiredTier];

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} Feature
        </CardTitle>
        <CardDescription>
          {description || `${feature} requires a ${requiredTier} subscription`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isInTrial && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">
                {Math.ceil(remainingTrialDays)} days left in trial
              </span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Subscribe now to keep access after your trial expires
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium text-sm">What you'll get with {requiredTier}:</h4>
          <ul className="space-y-1">
            {tierBenefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Star className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={() => window.location.href = '/pricing'}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/demos'}
          >
            View Demo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}