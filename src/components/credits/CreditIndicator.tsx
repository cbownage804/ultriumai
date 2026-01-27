import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Coins, Clock, Zap, Plus, TrendingUp, Calendar } from 'lucide-react';
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
    dailyRemaining,
    monthlyRemaining,
    totalRemaining,
    getTimeUntilDailyReset,
    getTimeUntilMonthlyReset,
    isLoading 
  } = useUserCredits();
  const navigate = useNavigate();
  const [timeUntilDailyReset, setTimeUntilDailyReset] = useState('');
  const [timeUntilMonthlyReset, setTimeUntilMonthlyReset] = useState('');

  // Update countdown every minute
  useEffect(() => {
    const updateTime = () => {
      setTimeUntilDailyReset(getTimeUntilDailyReset());
      setTimeUntilMonthlyReset(getTimeUntilMonthlyReset());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [getTimeUntilDailyReset, getTimeUntilMonthlyReset]);

  const getStatusColor = () => {
    if (totalRemaining <= 0) return 'text-red-500';
    if (dailyRemaining <= 1) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getDailyProgressColor = () => {
    const usagePercent = (credits.daily_credits_used / credits.daily_credits_limit) * 100;
    if (dailyRemaining <= 0) return 'bg-red-500';
    if (usagePercent >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getMonthlyProgressColor = () => {
    if (credits.monthly_credits_limit === 0) return 'bg-muted';
    const usagePercent = (credits.monthly_credits_used / credits.monthly_credits_limit) * 100;
    if (monthlyRemaining <= 0) return 'bg-red-500';
    if (usagePercent >= 80) return 'bg-amber-500';
    return 'bg-blue-500';
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
              totalRemaining <= 5 && "border-amber-500/50 animate-pulse",
              className
            )}
          >
            <Coins className={cn("h-4 w-4", getStatusColor())} />
            <span className={cn("font-medium tabular-nums", getStatusColor())}>
              {totalRemaining.toLocaleString()}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI Credits</p>
                  <p className="text-xs text-muted-foreground">Daily + Monthly</p>
                </div>
              </div>
              <Badge variant="outline" className={cn("text-xs", getStatusColor())}>
                {totalRemaining} total
              </Badge>
            </div>

            {/* Daily Credits */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-sm font-medium">Daily Credits</span>
                </div>
                <span className="text-xs text-muted-foreground">Resets: {timeUntilDailyReset}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Free daily allowance</span>
                <span className="font-medium">{credits.daily_credits_used} / {credits.daily_credits_limit}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-500", getDailyProgressColor())}
                  style={{ width: `${Math.min((credits.daily_credits_used / credits.daily_credits_limit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Monthly Credits (only show if subscribed) */}
            {credits.monthly_credits_limit > 0 && (
              <div className="space-y-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">Monthly Credits</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Resets: {timeUntilMonthlyReset}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subscription allowance</span>
                  <span className="font-medium">{credits.monthly_credits_used} / {credits.monthly_credits_limit}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-500", getMonthlyProgressColor())}
                    style={{ width: `${Math.min((credits.monthly_credits_used / credits.monthly_credits_limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

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

            {/* Free tier message */}
            {credits.monthly_credits_limit === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                Upgrade to get monthly credits that roll over
              </div>
            )}

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
            <p className="text-xs text-muted-foreground">Lovable-style credit system</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-bold tabular-nums", getStatusColor())}>
            {totalRemaining.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">total available</p>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Daily Credits
          </span>
          <span className="font-medium">{credits.daily_credits_used} / {credits.daily_credits_limit}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500 rounded-full", getDailyProgressColor())}
            style={{ width: `${Math.min((credits.daily_credits_used / credits.daily_credits_limit) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">Resets in {timeUntilDailyReset}</p>
      </div>

      {/* Monthly Progress Bar (if subscribed) */}
      {credits.monthly_credits_limit > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Monthly Credits
            </span>
            <span className="font-medium">{credits.monthly_credits_used} / {credits.monthly_credits_limit}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500 rounded-full", getMonthlyProgressColor())}
              style={{ width: `${Math.min((credits.monthly_credits_used / credits.monthly_credits_limit) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Resets in {timeUntilMonthlyReset}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
          <p className="text-lg font-bold text-emerald-500">{dailyRemaining}</p>
          <p className="text-xs text-muted-foreground">Daily</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 text-center">
          <p className="text-lg font-bold text-blue-500">{monthlyRemaining}</p>
          <p className="text-xs text-muted-foreground">Monthly</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 text-center">
          <p className="text-lg font-bold text-amber-500">+{credits.bonus_credits}</p>
          <p className="text-xs text-muted-foreground">Bonus</p>
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
