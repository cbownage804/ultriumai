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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className={cn(
        'overflow-hidden border',
        isBusiness && 'border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5',
        isPro && !isBusiness && 'border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5',
        !isSubscribed && 'border-border bg-card'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Current Plan Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant={isBusiness ? 'default' : isPro ? 'secondary' : 'outline'}
                  className={cn(
                    'gap-1',
                    isBusiness && 'bg-gradient-to-r from-amber-500 to-orange-500 border-0',
                    isPro && !isBusiness && 'bg-gradient-to-r from-violet-500 to-purple-500 border-0'
                  )}
                >
                  {isBusiness && <Crown className="h-3 w-3" />}
                  {isPro && !isBusiness && <Zap className="h-3 w-3" />}
                  {!isSubscribed && <Shield className="h-3 w-3" />}
                  {currentTier.name} Plan
                </Badge>
                {currentTier.badge && tier !== 'free' && (
                  <span className="text-xs text-muted-foreground">{currentTier.badge}</span>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {currentTier.description}
              </p>

              {/* Restrictions for non-business users */}
              {!isBusiness && restrictions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {restrictions.slice(0, 3).map((restriction, i) => (
                    <span 
                      key={i}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded"
                    >
                      <Lock className="h-3 w-3" />
                      {restriction}
                    </span>
                  ))}
                  {restrictions.length > 3 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      +{restrictions.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Business tier benefits */}
              {isBusiness && (
                <div className="flex flex-wrap gap-2">
                  {['Unlimited everything', 'Team management', 'Priority support'].map((benefit, i) => (
                    <span 
                      key={i}
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded"
                    >
                      <CheckCircle className="h-3 w-3" />
                      {benefit}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Upgrade CTA */}
            {nextTier && (
              <div className="flex-shrink-0">
                <Link to={billingPath}>
                  <Button 
                    className={cn(
                      'gap-2',
                      tier === 'free' && 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600',
                      tier === 'pro' && 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black'
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    Upgrade to {nextTier.name}
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Starting at {formatMonthlyPrice(nextTier)}
                </p>
              </div>
            )}
          </div>

          {/* Usage Summary for free/pro users */}
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
