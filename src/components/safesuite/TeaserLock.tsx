/**
 * TeaserLock Component
 * Shows beautiful branded upgrade overlay for restricted features
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useFeatureAccess, useWraythSubscription } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, formatMonthlyPrice, TierFeatures } from '@/config/safeSuiteTiers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Sparkles, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isWraythDomain } from '@/utils/subdomain';

// Product logos
import safepassLogo from '@/assets/safepass-logo.png';
import safescanLogo from '@/assets/safescan-logo.png';
import safewebLogo from '@/assets/safeweb-logo.png';
import safetrackLogo from '@/assets/safetrack-logo.png';
import safeassistLogo from '@/assets/safeassist-logo-horizontal.png';

// Hero backgrounds
import heroSafepass from '@/assets/hero-safepass-bg.jpg';
import heroSafescan from '@/assets/hero-safescan-bg.jpg';
import heroSafeweb from '@/assets/hero-safeweb-bg.jpg';
import heroSafetrack from '@/assets/hero-safetrack-bg.jpg';
import heroSafeassist from '@/assets/hero-safeassist-bg.jpg';

// Map features to their branded assets
const FEATURE_BRANDING: Record<string, { 
  logo: string; 
  hero: string; 
  gradient: string;
  glow: string;
}> = {
  safepass: {
    logo: safepassLogo,
    hero: heroSafepass,
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    glow: 'shadow-[0_0_60px_rgba(245,158,11,0.3)]'
  },
  safescan: {
    logo: safescanLogo,
    hero: heroSafescan,
    gradient: 'from-red-500/20 via-rose-500/10 to-transparent',
    glow: 'shadow-[0_0_60px_rgba(239,68,68,0.3)]'
  },
  safeweb: {
    logo: safewebLogo,
    hero: heroSafeweb,
    gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
    glow: 'shadow-[0_0_60px_rgba(139,92,246,0.3)]'
  },
  safetrack: {
    logo: safetrackLogo,
    hero: heroSafetrack,
    gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
    glow: 'shadow-[0_0_60px_rgba(16,185,129,0.3)]'
  },
  safeassist: {
    logo: safeassistLogo,
    hero: heroSafeassist,
    gradient: 'from-cyan-500/20 via-teal-500/10 to-transparent',
    glow: 'shadow-[0_0_60px_rgba(6,182,212,0.3)]'
  },
  safeassist_voice: {
    logo: safeassistLogo,
    hero: heroSafeassist,
    gradient: 'from-cyan-500/20 via-teal-500/10 to-transparent',
    glow: 'shadow-[0_0_60px_rgba(6,182,212,0.3)]'
  },
  team: {
    logo: safepassLogo,
    hero: heroSafepass,
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    glow: 'shadow-[0_0_60px_rgba(245,158,11,0.3)]'
  },
  whitelabeling: {
    logo: safepassLogo,
    hero: heroSafepass,
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    glow: 'shadow-[0_0_60px_rgba(245,158,11,0.3)]'
  }
};

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
  const { tier } = useWraythSubscription();
  
  const access = checkFeatureAccess(feature);
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredTier = getRequiredTier(feature);
  const requiredTierConfig = SAFESUITE_TIERS[requiredTier];
  const branding = FEATURE_BRANDING[feature] || FEATURE_BRANDING.safepass;
  
  const billingPath = isWraythDomain() ? '/billing' : '/safesuite/billing';

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
            <img 
              src={branding.logo} 
              alt={featureInfo?.name || 'Feature'} 
              className="h-8 w-auto object-contain"
            />
            <div>
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

  // Full variant - beautiful branded overlay matching other tabs
  return (
    <div className={cn('relative rounded-xl overflow-hidden min-h-[60vh]', className)}>
      {/* Hero background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${branding.hero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/95 to-background" />
      </div>
      
      {/* Upgrade overlay content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 flex items-center justify-center min-h-[60vh] p-8"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
          className={cn(
            'text-center max-w-lg p-8 rounded-2xl',
            'bg-black/60 backdrop-blur-xl border border-white/10',
            branding.glow
          )}
        >
          {/* Product Logo - Large and prominent */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <img 
              src={branding.logo} 
              alt={featureInfo?.name || 'Feature'}
              className="h-20 md:h-24 w-auto mx-auto object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Tier badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Badge 
              variant="outline" 
              className={cn(
                'text-sm px-4 py-1.5 font-medium',
                isBusiness && 'border-amber-500/50 text-amber-400 bg-amber-500/10',
                isPro && 'border-violet-500/50 text-violet-400 bg-violet-500/10'
              )}
            >
              {requiredTierConfig.name} Feature
            </Badge>
          </motion.div>

          {/* Price */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <span className={cn(
              'text-4xl font-bold',
              isBusiness && 'text-amber-400',
              isPro && 'text-violet-400'
            )}>
              {formatMonthlyPrice(requiredTierConfig)}
            </span>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to={billingPath}>
              <Button 
                size="lg"
                className={cn(
                  'gap-2 w-full text-lg py-6',
                  isBusiness && 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold',
                  isPro && 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 font-semibold'
                )}
              >
                <Sparkles className="h-5 w-5" />
                Upgrade to {requiredTierConfig.name}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>

            {/* Compare plans link */}
            <Link 
              to={billingPath} 
              className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Compare all plans
            </Link>
          </motion.div>
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
