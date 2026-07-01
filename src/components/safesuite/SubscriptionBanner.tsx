/**
 * Subscription Banner Component
 * Shows current plan status and restrictions on the dashboard
 */

import { Link } from 'react-router-dom';
import { useWraythSubscription } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS, formatMonthlyPrice, FEATURE_DESCRIPTIONS } from '@/config/safeSuiteTiers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Sparkles, 
  CheckCircle, 
  Lock, 
  ArrowRight,
  Zap,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isWraythDomain } from '@/utils/subdomain';
import { UsageSummary } from './UsageMeter';

interface SubscriptionBannerProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function SubscriptionBanner({ className, variant = 'full' }: SubscriptionBannerProps) {
  const { tier, tierConfig, isSubscribed, isPro, isBusiness, loading } = useWraythSubscription();

  if (loading) return null;

  const currentTier = SAFESUITE_TIERS[tier];
  const nextTier = tier === 'free' ? SAFESUITE_TIERS.pro : tier === 'pro' ? SAFESUITE_TIERS.business : null;
  const billingPath = isWraythDomain() ? '/billing' : '/app/billing';

  // Get key restrictions for current tier
  const restrictions: string[] = [];
  if (!currentTier.features.watch.enabled) restrictions.push('No dark web monitoring');
  
  if (!currentTier.features.team.enabled) restrictions.push('No team features');
  if (currentTier.features.vault.limit !== -1) restrictions.push(`${currentTier.features.vault.limit} password limit`);
  if (currentTier.features.scan.limit !== -1 && currentTier.features.scan.limit > 0) {
    restrictions.push(`${currentTier.features.scan.limit} scans/month`);
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50', className)}>
        <Badge 
          variant={isBusiness ? 'default' : isPro ? 'secondary' : 'outline'}
          className={cn(
            'gap-1',
            isBusiness && 'bg-gradient-to-r from-amber-500 to-orange-500',
            isPro && 'bg-gradient-to-r from-violet-500 to-purple-500'
          )}
        >
          {isBusiness && <Crown className="h-3 w-3" />}
          {isPro && !isBusiness && <Zap className="h-3 w-3" />}
          {currentTier.name}
        </Badge>
        {!isBusiness && (
          <Link to={billingPath} className="ml-auto">
            <Button size="sm" variant="ghost" className="gap-1 text-xs">
              Upgrade <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Business tier — no upsell, celebrate the plan.
  if (isBusiness) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className="overflow-hidden border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                <Crown className="h-3 w-3" />
                {currentTier.name} Plan
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">{currentTier.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {['Unlimited everything', 'Team management', 'Priority support'].map((b) => (
                <span key={b} className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                  <CheckCircle className="h-3 w-3" />
                  {b}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!nextTier) return null;

  // Ray-authored upgrade advice — reads like a teammate suggestion, not an ad.
  const reasons: string[] = [];
  if (!currentTier.features.watch.enabled && nextTier.features.watch.enabled) {
    reasons.push('Dark web monitoring for your identities');
  }
  if (currentTier.features.vault.limit !== -1 && nextTier.features.vault.limit === -1) {
    reasons.push('Unlimited passwords in your vault');
  } else if (currentTier.features.vault.limit !== -1) {
    reasons.push(`Room for ${nextTier.features.vault.limit === -1 ? 'unlimited' : nextTier.features.vault.limit} passwords`);
  }
  if (currentTier.features.scan.limit !== -1 && nextTier.features.scan.limit === -1) {
    reasons.push('Unlimited threat scans');
  }
  if (!currentTier.features.team?.enabled && nextTier.features.team?.enabled) {
    reasons.push('Team management for the people you protect');
  }
  if (reasons.length === 0) {
    reasons.push(`Everything in ${nextTier.name}, unlocked`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="overflow-hidden border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.06] via-card to-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
            <Sparkles className="h-3 w-3" />
            Ray suggests
          </div>
          <h3 className="mt-2 text-base sm:text-lg font-light text-foreground">
            I think <span className="font-medium text-foreground">{nextTier.name}</span> would help you, because…
          </h3>
          <ul className="mt-3 space-y-1.5">
            {reasons.slice(0, 4).map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Starts at {formatMonthlyPrice(nextTier)} · cancel anytime
            </p>
            <Link to={billingPath}>
              <Button size="sm" className="gap-2">
                Upgrade to {nextTier.name}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {!isBusiness && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <UsageSummary features={['vault', 'scan']} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Tier comparison component for billing page
 */
export function TierRestrictionsList({ currentTier }: { currentTier: 'free' | 'pro' | 'business' }) {
  const tierConfig = SAFESUITE_TIERS[currentTier];
  const features = tierConfig.features;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Your {tierConfig.name} Plan Includes:</h4>
      
      {Object.entries(features).map(([key, config]) => {
        const featureKey = key as keyof typeof features;
        const description = FEATURE_DESCRIPTIONS[featureKey];
        
        return (
          <div 
            key={key}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg',
              config.enabled ? 'bg-emerald-500/10' : 'bg-muted/50 opacity-60'
            )}
          >
            {config.enabled ? (
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{description.name}</span>
              {config.enabled && config.limit !== -1 && config.limit > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Limit: {config.limit} {description.limitUnitPlural})
                </span>
              )}
              {config.enabled && config.limit === -1 && (
                <span className="text-xs text-emerald-400 ml-2">Unlimited</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
