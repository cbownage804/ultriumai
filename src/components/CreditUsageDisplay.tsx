import { useState } from 'react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIStudioUpgradeModal } from '@/components/ai-studio/AIStudioUpgradeModal';

export function CreditUsageDisplay() {
  const { credits, isLoading, usagePercentage } = useUserCredits();
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

  const usagePercentageValue = usagePercentage;
  const isLowCredits = usagePercentageValue > 80;
  const isOutOfCredits = credits.credits_limit - credits.credits_used <= 0;

  const getUsageBadge = () => {
    if (isOutOfCredits) {
      return <Badge variant="destructive">Credits Exhausted</Badge>;
    }
    if (isLowCredits) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
        Low Credits
      </Badge>;
    }
    return <Badge variant="default" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
      Available
    </Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" />
              AI Credits
            </CardTitle>
          </div>
          {getUsageBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credit usage warning */}
        {isLowCredits && (
          <Alert variant={isOutOfCredits ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isOutOfCredits 
                ? "You've used all your credits. Purchase more to continue using AI features."
                : "You're running low on credits. Consider upgrading your plan or purchasing additional credits."
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Usage progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Credits Used</span>
            <span>{credits.credits_used.toLocaleString()} / {credits.credits_limit.toLocaleString()}</span>
          </div>
          <Progress 
            value={usagePercentageValue} 
            className={`h-2 ${isOutOfCredits ? 'bg-destructive/20' : isLowCredits ? 'bg-amber-200' : ''}`}
          />
          <p className="text-xs text-muted-foreground">
            {(credits.credits_limit - credits.credits_used).toLocaleString()} credits remaining
          </p>
        </div>

        {/* Credit details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Used This Month</p>
            <p className="font-medium">{credits.credits_used.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Monthly Limit</p>
            <p className="font-medium">{credits.credits_limit.toLocaleString()}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {(credits.credits_limit - credits.credits_used) < 100 && (
            <Button className="flex-1" onClick={() => window.location.href = '/credits'}>
              <Zap className="w-4 h-4 mr-2" />
              Purchase Credits
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setUpgradeModalOpen(true)}
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </CardContent>
      <AIStudioUpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </Card>
  );
}