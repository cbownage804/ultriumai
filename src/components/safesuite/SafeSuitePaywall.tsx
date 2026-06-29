/**
 * Wrayth Paywall Component
 * Shows upgrade prompts when users hit tier limits
 */

import { Link } from 'react-router-dom';
import { useFeatureAccess, useWraythSubscription } from '@/hooks/useWrayth';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, formatMonthlyPrice, formatLimitWithUnit, TierFeatures } from '@/config/safeSuiteTiers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Sparkles,
  Crown,
  Check,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeaserLock } from './TeaserLock';

interface WraythPaywallProps {
  feature: keyof TierFeatures;
  action?: 'view' | 'use';
  children?: React.ReactNode;
  className?: string;
}

export function WraythPaywall({ 
  feature, 
  action = 'use',
  children,
  className 
}: WraythPaywallProps) {
  const { checkFeatureAccess, getRequiredTier } = useFeatureAccess();
  const { tier } = useWraythSubscription();
  
  const access = checkFeatureAccess(feature, action);
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredTier = getRequiredTier(feature);
  const requiredTierConfig = SAFESUITE_TIERS[requiredTier];

  // Feature is accessible
  if (access.allowed) {
    return <>{children}</>;
  }

  // Show paywall
  return (
    <Card className={cn('border-dashed', className)}>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {featureInfo.name}
          <Badge variant="secondary" className="font-normal">
            {requiredTierConfig.name}+
          </Badge>
        </CardTitle>
        <CardDescription className="text-base">
          {access.reason}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-4">
          {featureInfo.description}
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-muted-foreground">Starting at</span>
          <span className="text-2xl font-bold text-primary">
            {formatMonthlyPrice(requiredTierConfig)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link to="/safesuite/billing" className="w-full">
          <Button className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Upgrade to {requiredTierConfig.name}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/safesuite/billing" className="text-sm text-muted-foreground hover:text-foreground">
          Compare all plans
        </Link>
      </CardFooter>
    </Card>
  );
}

/**
 * TierLimitInfo - Always shows current tier limits to encourage upselling
 * Unlike UsageLimitBanner, this shows at any usage level
 */
interface TierLimitInfoProps {
  feature: keyof TierFeatures;
  className?: string;
}

export function TierLimitInfo({ feature, className }: TierLimitInfoProps) {
  const { checkFeatureAccess, getRequiredTier } = useFeatureAccess();
  const { tier } = useWraythSubscription();
  const access = checkFeatureAccess(feature);
  const featureInfo = FEATURE_DESCRIPTIONS[feature];

  // Don't show if unlimited or feature is disabled
  if (!access.allowed) return null;
  if (access.limit === -1) return null;

  const usedPercentage = access.limit ? ((access.used || 0) / access.limit) * 100 : 0;
  const isNearLimit = usedPercentage >= 80;
  const isAtLimit = usedPercentage >= 100;
  
  const currentTierConfig = SAFESUITE_TIERS[tier];
  const nextTier = tier === 'free' ? 'pro' : tier === 'pro' ? 'business' : null;
  const nextTierConfig = nextTier ? SAFESUITE_TIERS[nextTier] : null;
  const nextTierLimit = nextTierConfig?.features[feature]?.limit;

  return (
    <Card className={cn(
      'border bg-card/50 backdrop-blur-sm',
      isAtLimit && 'border-destructive/50 bg-destructive/5',
      isNearLimit && !isAtLimit && 'border-amber-500/50 bg-amber-500/5',
      !isNearLimit && 'border-border/50',
      className
    )}>
      <CardContent className="flex items-center gap-4 py-3 px-4">
        <div className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
          isAtLimit && 'bg-destructive/20',
          isNearLimit && !isAtLimit && 'bg-amber-500/20',
          !isNearLimit && 'bg-primary/10'
        )}>
          {isAtLimit ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : isNearLimit ? (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm font-medium truncate">
              {featureInfo.name} • <span className="text-muted-foreground">{currentTierConfig.name} Plan</span>
            </span>
            <span className={cn(
              'text-sm font-semibold whitespace-nowrap',
              isAtLimit && 'text-destructive',
              isNearLimit && !isAtLimit && 'text-amber-500'
            )}>
              {access.used || 0} / {access.limit} {featureInfo.limitUnitPlural}
            </span>
          </div>
          <Progress 
            value={Math.min(usedPercentage, 100)} 
            className={cn(
              'h-2',
              isAtLimit && '[&>div]:bg-destructive',
              isNearLimit && !isAtLimit && '[&>div]:bg-amber-500'
            )}
          />
        </div>
        
        {nextTierConfig && (
          <Link to="/safesuite/billing" className="flex-shrink-0">
            <Button 
              size="sm" 
              variant={isAtLimit ? 'default' : 'outline'}
              className="gap-1.5"
            >
              <Crown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {nextTierLimit === -1 ? 'Unlimited' : `${nextTierLimit}+`}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

interface UsageLimitBannerProps {
  feature: keyof TierFeatures;
  className?: string;
}

export function UsageLimitBanner({ feature, className }: UsageLimitBannerProps) {
  const { checkFeatureAccess } = useFeatureAccess();
  const access = checkFeatureAccess(feature);

  if (!access.limit || access.limit === -1) return null;

  const usedPercentage = ((access.used || 0) / access.limit) * 100;
  const isNearLimit = usedPercentage >= 80;
  const isAtLimit = usedPercentage >= 100;

  if (usedPercentage < 50) return null;

  return (
    <Card className={cn(
      'border',
      isAtLimit && 'border-destructive bg-destructive/5',
      isNearLimit && !isAtLimit && 'border-warning bg-warning/5',
      className
    )}>
      <CardContent className="flex items-center gap-4 py-3">
        <AlertCircle className={cn(
          'h-5 w-5',
          isAtLimit && 'text-destructive',
          isNearLimit && !isAtLimit && 'text-warning'
        )} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {isAtLimit ? 'Limit reached' : 'Approaching limit'}
            </span>
            <span className="text-sm text-muted-foreground">
              {access.used || 0} / {access.limit}
            </span>
          </div>
          <Progress value={Math.min(usedPercentage, 100)} className="h-2" />
        </div>
        <Link to="/safesuite/billing">
          <Button size="sm" variant={isAtLimit ? 'default' : 'outline'}>
            Upgrade
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

interface FeatureGateProps {
  feature: keyof TierFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { canUseFeature } = useFeatureAccess();

  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Use beautiful TeaserLock instead of plain paywall
  return (
    <TeaserLock 
      feature={feature} 
      className="min-h-[80vh]"
    >
      <div />
    </TeaserLock>
  );
}

interface TierComparisonProps {
  highlightTier?: string;
  className?: string;
}

export function TierComparison({ highlightTier, className }: TierComparisonProps) {
  const tiers = Object.values(SAFESUITE_TIERS);

  return (
    <div className={cn('grid gap-6 md:grid-cols-3', className)}>
      {tiers.map((tier) => (
        <Card
          key={tier.id}
          className={cn(
            'relative',
            highlightTier === tier.id && 'border-primary shadow-lg',
            tier.popular && 'border-primary/50'
          )}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="gap-1 bg-primary">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {tier.id === 'business' && <Crown className="h-5 w-5 text-amber-500" />}
              {tier.name}
            </CardTitle>
            <CardDescription>{tier.description}</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-bold">
                {formatMonthlyPrice(tier)}
              </span>
              {tier.price > 0 && (
                <span className="text-muted-foreground ml-1">
                  billed monthly
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(tier.features).map(([key, value]) => {
                const featureInfo = FEATURE_DESCRIPTIONS[key as keyof TierFeatures];
                return (
                  <li key={key} className="flex items-center gap-2">
                    {value.enabled ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={cn(!value.enabled && 'text-muted-foreground')}>
                      {featureInfo.name}
                      {value.enabled && value.limit !== 0 && (
                        <span className="text-muted-foreground ml-1">
                          ({formatLimitWithUnit(key as keyof TierFeatures, value.limit)})
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
          <CardFooter>
            <Link to="/safesuite/billing" className="w-full">
              <Button 
                variant={tier.popular ? 'default' : 'outline'} 
                className="w-full"
              >
                {tier.price === 0 ? 'Current Plan' : `Get ${tier.name}`}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
