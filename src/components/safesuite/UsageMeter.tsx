/**
 * UsageMeter Component
 * Shows usage progress with visual indicators and upgrade prompts
 */

import { Link } from 'react-router-dom';
import { useFeatureAccess, useWraythSubscription, useWraythUsage } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, TierFeatures } from '@/config/safeSuiteTiers';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Crown,
  Infinity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isWraythDomain } from '@/utils/subdomain';

interface UsageMeterProps {
  feature: keyof TierFeatures;
  className?: string;
  /** Show as compact inline or full card */
  variant?: 'compact' | 'card' | 'inline';
  /** Show the upgrade button */
  showUpgrade?: boolean;
  /** Custom label */
  label?: string;
}

export function UsageMeter({
  feature,
  className,
  variant = 'card',
  showUpgrade = true,
  label
}: UsageMeterProps) {
  const { checkFeatureAccess } = useFeatureAccess();
  const { tier, isPro, isBusiness } = useWraythSubscription();
  const { usage } = useWraythUsage();
  
  const access = checkFeatureAccess(feature);
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const tierConfig = SAFESUITE_TIERS[tier];
  const featureConfig = tierConfig.features[feature];
  
  const billingPath = isWraythDomain() ? '/billing' : '/safesuite/billing';

  // Feature not enabled for this tier
  if (!featureConfig.enabled) {
    return null;
  }

  // Unlimited - show badge
  if (featureConfig.limit === -1) {
    if (variant === 'inline') {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <Infinity className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">Unlimited {label || featureInfo.name}</span>
        </div>
      );
    }

    return (
      <Badge variant="secondary" className={cn('gap-1 bg-emerald-500/20 text-emerald-400', className)}>
        <Infinity className="h-3 w-3" />
        Unlimited
      </Badge>
    );
  }

  const used = access.used || 0;
  const limit = access.limit || featureConfig.limit;
  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);
  
  // Status thresholds
  const isAtLimit = percentage >= 100;
  const isNearLimit = percentage >= 80;
  const isApproaching = percentage >= 60;

  // Determine status color
  const getStatusColor = () => {
    if (isAtLimit) return 'text-destructive';
    if (isNearLimit) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-destructive';
    if (isNearLimit) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-2', className)}>
              {isAtLimit ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : isNearLimit ? (
                <TrendingUp className="h-4 w-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              )}
              <span className={cn('text-sm font-medium', getStatusColor())}>
                {used}/{limit}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label || featureInfo.name}: {used} of {limit} used</p>
            {remaining > 0 && <p className="text-xs text-muted-foreground">{remaining} remaining</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label || featureInfo.name}</span>
          <span className={cn('font-medium', getStatusColor())}>
            {used}/{limit}
          </span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn('h-full rounded-full', getProgressColor())}
          />
        </div>
      </div>
    );
  }

  // Full card variant
  return (
    <Card className={cn(
      'overflow-hidden transition-colors',
      isAtLimit && 'border-destructive/50 bg-destructive/5',
      isNearLimit && !isAtLimit && 'border-amber-500/50 bg-amber-500/5',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAtLimit ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : isNearLimit ? (
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                )}
                <span className="font-medium">{label || featureInfo.name}</span>
              </div>
              <Badge variant="outline" className={cn('font-mono', getStatusColor())}>
                {used} / {limit}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn('h-full rounded-full', getProgressColor())}
              />
            </div>

            {/* Status message */}
            <AnimatePresence mode="wait">
              {isAtLimit && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-destructive"
                >
                  You've reached your limit. Upgrade to continue using {featureInfo.name}.
                </motion.p>
              )}
              {isNearLimit && !isAtLimit && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-amber-400"
                >
                  {remaining} {featureInfo.limitUnitPlural} remaining this month.
                </motion.p>
              )}
              {!isNearLimit && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground"
                >
                  {remaining} {featureInfo.limitUnitPlural} remaining.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Upgrade button */}
          {showUpgrade && (isAtLimit || isNearLimit) && !isBusiness && (
            <Link to={billingPath}>
              <Button 
                size="sm" 
                variant={isAtLimit ? 'default' : 'outline'}
                className={cn(
                  'gap-1 shrink-0',
                  isAtLimit && tier === 'free' && 'bg-gradient-to-r from-violet-500 to-purple-500',
                  isAtLimit && tier === 'pro' && 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
                )}
              >
                {tier === 'pro' ? (
                  <Crown className="h-3 w-3" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * UsageSummary - Shows all feature usage in a compact grid
 */
interface UsageSummaryProps {
  className?: string;
  features?: (keyof TierFeatures)[];
}

export function UsageSummary({ 
  className,
  features = ['safepass', 'safescan', 'safeweb', 'safetrack'] 
}: UsageSummaryProps) {
  const { tier } = useWraythSubscription();
  const tierConfig = SAFESUITE_TIERS[tier];
  
  // Filter to only show enabled features with limits
  const relevantFeatures = features.filter(f => {
    const config = tierConfig.features[f];
    return config.enabled;
  });

  if (relevantFeatures.length === 0) return null;

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      {relevantFeatures.map(feature => (
        <UsageMeter key={feature} feature={feature} variant="compact" showUpgrade={false} />
      ))}
    </div>
  );
}
