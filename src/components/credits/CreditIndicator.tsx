import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Coins, Clock, Zap, Plus, TrendingUp } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CreditIndicatorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const CreditIndicator = ({ variant = 'compact', className }: CreditIndicatorProps) => {
  const { 
    credits, 
    remainingCredits, 
    dailyRemaining,
    usagePercentage, 
    getTimeUntilReset,
    isLoading 
  } = useUserCredits();
  const navigate = useNavigate();
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Update countdown every minute
  useEffect(() => {
    const updateTime = () => setTimeUntilReset(getTimeUntilReset());
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [getTimeUntilReset]);

  const getStatusColor = () => {
    if (remainingCredits <= 0) return 'text-red-500';
    if (usagePercentage >= 80) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getProgressColor = () => {
    if (remainingCredits <= 0) return 'bg-red-500';
    if (usagePercentage >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (isLoading) {
    return (
      <div className={cn("animate-pulse flex items-center gap-2", className)}>
        <div className="h-6 w-20 bg-muted rounded" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 px-3 h-9 rounded-full border bg-background/50 backdrop-blur-sm hover:bg-accent/50 transition-all",
              remainingCredits <= 10 && "border-amber-500/50 animate-pulse",
              className
            )}
          >
            <Coins className={cn("h-4 w-4", getStatusColor())} />
            <span className={cn("font-medium tabular-nums", getStatusColor())}>
              {remainingCredits.toLocaleString()}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI Credits</p>
                  <p className="text-xs text-muted-foreground">Daily allocation</p>
                </div>
              </div>
              <Badge variant="outline" className={cn("text-xs", getStatusColor())}>
                {remainingCredits} left
              </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Daily Usage</span>
                <span className="font-medium">{credits.credits_used} / {credits.credits_limit}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-500", getProgressColor())}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Bonus Credits */}
            {credits.bonus_credits > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Bonus Credits</span>
                </div>
                <span className="text-sm font-semibold text-amber-500">
                  +{credits.bonus_credits.toLocaleString()}
                </span>
              </div>
            )}

            {/* Reset Timer */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Resets in</span>
              </div>
              <span className="font-medium">{timeUntilReset}</span>
            </div>

            {/* Buy More Button */}
            <Button 
              onClick={() => navigate('/credits')} 
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Buy More Credits
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Full variant for dashboard
  return (
    <div className={cn("p-4 rounded-xl border bg-gradient-to-br from-card to-card/50 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Credits</h3>
            <p className="text-xs text-muted-foreground">Daily usage tracking</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-bold tabular-nums", getStatusColor())}>
            {remainingCredits.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">available</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Today's Usage</span>
          <span className="font-medium">{credits.credits_used} / {credits.credits_limit}</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500 rounded-full", getProgressColor())}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-lg font-bold">{dailyRemaining}</p>
          <p className="text-xs text-muted-foreground">Daily Left</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 text-center">
          <p className="text-lg font-bold text-amber-500">+{credits.bonus_credits}</p>
          <p className="text-xs text-muted-foreground">Bonus</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-lg font-bold">{timeUntilReset}</p>
          <p className="text-xs text-muted-foreground">Reset In</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          onClick={() => navigate('/credits')} 
          className="flex-1 gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Buy Credits
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/credits?tab=history')} 
          className="gap-2"
          size="sm"
        >
          <TrendingUp className="h-4 w-4" />
          History
        </Button>
      </div>
    </div>
  );
};