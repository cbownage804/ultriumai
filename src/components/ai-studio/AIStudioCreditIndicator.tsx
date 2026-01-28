import { useState } from 'react';
import { useAIStudioCredits } from '@/hooks/useAIStudioCredits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, AlertTriangle, Gauge, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AIStudioUpgradeModal } from './AIStudioUpgradeModal';

interface AIStudioCreditIndicatorProps {
  variant?: 'compact' | 'full';
  showUpgrade?: boolean;
}

export function AIStudioCreditIndicator({ 
  variant = 'compact',
  showUpgrade = true 
}: AIStudioCreditIndicatorProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { 
    credits, 
    isLoading, 
    usagePercentage, 
    daysUntilReset,
    burnRate,
    estimatedDaysRemaining 
  } = useAIStudioCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (!credits) return null;

  const capacityRemaining = 100 - usagePercentage;
  const isLow = capacityRemaining <= 20;
  const isExhausted = credits.credits_remaining <= 0;

  // Compact variant for headers/sidebars (admin only)
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <Gauge className={`h-4 w-4 ${isExhausted ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-primary'}`} />
              <span className="text-sm font-medium">
                {Math.round(capacityRemaining)}%
              </span>
              <div className="w-16 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    isExhausted ? 'bg-destructive' : isLow ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${capacityRemaining}%` }}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-3 max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">AI Capacity</p>
              <p className="text-sm text-muted-foreground">
                {credits.credits_remaining.toLocaleString()} / {credits.monthly_credit_limit.toLocaleString()} remaining
              </p>
              <p className="text-xs text-muted-foreground">
                Resets in {daysUntilReset} days
              </p>
              {burnRate > 0 && (
                <p className="text-xs text-muted-foreground">
                  ~{estimatedDaysRemaining === Infinity ? '∞' : estimatedDaysRemaining} days at current rate
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant for admin dashboards
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            AI Capacity
          </CardTitle>
          <Badge 
            variant={isExhausted ? 'destructive' : isLow ? 'secondary' : 'default'}
            className={!isExhausted && !isLow ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : ''}
          >
            {isExhausted ? 'Exhausted' : isLow ? 'Running Low' : 'Healthy'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning for low/exhausted capacity */}
        {(isLow || isExhausted) && (
          <div className={`p-3 rounded-lg flex items-start gap-2 ${
            isExhausted ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'
          }`}>
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {isExhausted ? 'AI capacity exhausted' : 'AI capacity running low'}
              </p>
              <p className="text-xs mt-1 opacity-80">
                {isExhausted 
                  ? 'Add capacity to restore AI assistant availability.'
                  : `Estimated ${estimatedDaysRemaining === Infinity ? 'unlimited' : estimatedDaysRemaining + ' days'} remaining at current burn rate.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Capacity meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly Capacity Used</span>
            <span className="font-medium">
              {credits.credits_used_this_period.toLocaleString()} / {credits.monthly_credit_limit.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-2 ${isExhausted ? 'bg-destructive/20' : isLow ? 'bg-amber-200' : ''}`}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <Gauge className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="font-medium">{Math.round(capacityRemaining)}%</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="font-medium">{daysUntilReset}</p>
            <p className="text-xs text-muted-foreground">Days to Reset</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="font-medium">{Math.round(burnRate)}/day</p>
            <p className="text-xs text-muted-foreground">Burn Rate</p>
          </div>
        </div>

        {/* Overage indicator */}
        {credits.overage_enabled && credits.overage_credits_used > 0 && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
            Overage capacity used: {credits.overage_credits_used.toLocaleString()}
          </div>
        )}

        {/* Upgrade/Add capacity button */}
        {showUpgrade && (
          <>
            <Button 
              className="w-full" 
              variant={isLow ? 'default' : 'outline'}
              onClick={() => setUpgradeModalOpen(true)}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {isExhausted ? 'Add Capacity' : 'Upgrade Plan'}
            </Button>
            <AIStudioUpgradeModal 
              open={upgradeModalOpen} 
              onOpenChange={setUpgradeModalOpen} 
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
