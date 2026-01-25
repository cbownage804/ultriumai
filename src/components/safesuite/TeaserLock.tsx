/**
 * TeaserLock Component
 * Shows blurred teaser content with upgrade overlay for restricted features
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useFeatureAccess, useSafeSuiteSubscription } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, formatMonthlyPrice, TierFeatures } from '@/config/safeSuiteTiers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Sparkles, 
  Crown, 
  ArrowRight,
  Zap,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSafeSuiteDomain } from '@/utils/subdomain';

interface TeaserLockProps {
  feature: keyof TierFeatures;
  children: ReactNode;
  className?: string;
  /** Optional teaser content to show instead of blurred children */
  teaserContent?: ReactNode;
  /** Size of the overlay - compact for inline, full for page sections */
  variant?: 'compact' | 'full' | 'inline';
  /** Show sample data behind blur */
  showSampleData?: boolean;
  /** Custom message */
  message?: string;
}

export function TeaserLock({
  feature,
  children,
  className,
  teaserContent,
  variant = 'full',
  showSampleData = true,
  message
}: TeaserLockProps) {
  const { checkFeatureAccess, getRequiredTier } = useFeatureAccess();
  const { tier } = useSafeSuiteSubscription();
  
  const access = checkFeatureAccess(feature);
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredTier = getRequiredTier(feature);
  const requiredTierConfig = SAFESUITE_TIERS[requiredTier];
  
  const billingPath = isSafeSuiteDomain() ? '/billing' : '/safesuite/billing';

  // Feature is accessible - render children normally
  if (access.allowed) {
    return <>{children}</>;
  }

  // Determine tier styling
  const isPro = requiredTier === 'pro';
  const isBusiness = requiredTier === 'business';

  if (variant === 'inline') {
    return (
      <div className={cn('relative inline-flex items-center gap-2', className)}>
        <Lock className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">
          {message || `Upgrade to ${requiredTierConfig.name}`}
        </span>
        <Link to={billingPath}>
          <Badge 
            variant="outline" 
            className={cn(
              'cursor-pointer hover:opacity-80 transition-opacity',
              isBusiness && 'border-amber-500/50 text-amber-400',
              isPro && 'border-violet-500/50 text-violet-400'
            )}
          >
            Unlock
          </Badge>
        </Link>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('relative rounded-lg overflow-hidden', className)}>
        {/* Blurred content */}
        {showSampleData && (
          <div className="blur-sm opacity-50 pointer-events-none select-none" aria-hidden="true">
            {teaserContent || children}
          </div>
        )}
        
        {/* Overlay */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          'bg-background/80 backdrop-blur-sm'
        )}>
          <div className="flex items-center gap-3 p-3">
            <div className={cn(
              'p-2 rounded-full',
              isBusiness && 'bg-amber-500/10',
              isPro && 'bg-violet-500/10',
              !isPro && !isBusiness && 'bg-primary/10'
            )}>
              {isBusiness ? (
                <Crown className="h-5 w-5 text-amber-500" />
              ) : isPro ? (
                <Zap className="h-5 w-5 text-violet-500" />
              ) : (
                <Lock className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{message || access.reason}</p>
              <Link to={billingPath}>
                <Button 
                  size="sm" 
                  variant="link" 
                  className={cn(
                    'h-auto p-0 gap-1',
                    isBusiness && 'text-amber-400',
                    isPro && 'text-violet-400'
                  )}
                >
                  Upgrade to {requiredTierConfig.name}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full variant - detailed overlay
  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      {/* Blurred teaser content */}
      {showSampleData && (
        <div className="blur-md opacity-40 pointer-events-none select-none" aria-hidden="true">
          {teaserContent || children}
        </div>
      )}
      
      {/* Upgrade overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          'bg-gradient-to-br',
          isBusiness && 'from-amber-500/5 via-background/95 to-orange-500/5',
          isPro && 'from-violet-500/5 via-background/95 to-purple-500/5',
          !isPro && !isBusiness && 'from-primary/5 via-background/95 to-primary/5'
        )}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center max-w-md p-6"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className={cn(
              'mx-auto mb-4 h-16 w-16 rounded-full flex items-center justify-center',
              isBusiness && 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-2 ring-amber-500/30',
              isPro && 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 ring-2 ring-violet-500/30',
              !isPro && !isBusiness && 'bg-primary/10 ring-2 ring-primary/30'
            )}
          >
            {isBusiness ? (
              <Crown className="h-8 w-8 text-amber-400" />
            ) : isPro ? (
              <Zap className="h-8 w-8 text-violet-400" />
            ) : (
              <Lock className="h-8 w-8 text-primary" />
            )}
          </motion.div>

          {/* Title */}
          <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
            {featureInfo.name}
            <Badge 
              variant="secondary" 
              className={cn(
                'font-normal',
                isBusiness && 'bg-amber-500/20 text-amber-400',
                isPro && 'bg-violet-500/20 text-violet-400'
              )}
            >
              {requiredTierConfig.name}+
            </Badge>
          </h3>

          {/* Description */}
          <p className="text-muted-foreground mb-4">
            {message || access.reason || featureInfo.description}
          </p>

          {/* Preview badge */}
          {showSampleData && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
              <Eye className="h-3 w-3" />
              <span>Preview of what you'll unlock</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-muted-foreground text-sm">Starting at</span>
            <span className={cn(
              'text-2xl font-bold',
              isBusiness && 'text-amber-400',
              isPro && 'text-violet-400',
              !isPro && !isBusiness && 'text-primary'
            )}>
              {formatMonthlyPrice(requiredTierConfig)}
            </span>
          </div>

          {/* CTA Button */}
          <Link to={billingPath}>
            <Button 
              size="lg"
              className={cn(
                'gap-2 w-full',
                isBusiness && 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black',
                isPro && 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600'
              )}
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to {requiredTierConfig.name}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          {/* Compare plans link */}
          <Link 
            to={billingPath} 
            className="inline-block mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Compare all plans →
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * FeatureTeaser - A simpler wrapper that just applies TeaserLock
 */
interface FeatureTeaserProps {
  feature: keyof TierFeatures;
  children: ReactNode;
  teaserContent?: ReactNode;
}

export function FeatureTeaser({ feature, children, teaserContent }: FeatureTeaserProps) {
  return (
    <TeaserLock feature={feature} teaserContent={teaserContent}>
      {children}
    </TeaserLock>
  );
}
