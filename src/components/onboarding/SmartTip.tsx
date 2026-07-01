import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSmartTriggers, SMART_TIPS } from '@/hooks/useSmartTriggers';
import { useOnboardingPersistence } from '@/hooks/useOnboardingPersistence';
import { useOnboardingABTest, ONBOARDING_TESTS, TIP_DISPLAY_VARIANTS } from '@/hooks/useOnboardingABTest';
import { useScreenSize } from '@/hooks/useScreenSize';

interface SmartTipProps {
  featureId: string;
  onAction?: () => void;
  delay?: number;
  className?: string;
}

export const SmartTip = ({ featureId, onAction, delay = 1500, className }: SmartTipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const { isMobile } = useScreenSize();
  const { 
    isLoaded, 
    trackFeatureVisit, 
    evaluateTips, 
    markTipShown,
    getTriggerState 
  } = useSmartTriggers();
  const { trackEvent } = useOnboardingPersistence();
  const { getVariantContent, trackEngagement } = useOnboardingABTest();
  const hasTrackedVisit = useRef(false);

  // Get variant for this test
  const { variant, content: displayConfig } = getVariantContent(
    ONBOARDING_TESTS.tipDisplayMode,
    TIP_DISPLAY_VARIANTS
  );

  // Find applicable tip for this feature
  const applicableTips = SMART_TIPS.filter(tip => tip.featureId === featureId);

  useEffect(() => {
    if (!isLoaded || hasTrackedVisit.current) return;
    
    // Track the feature visit
    trackFeatureVisit(featureId);
    hasTrackedVisit.current = true;

    // Check if any tips should be shown after a delay
    const timer = setTimeout(() => {
      const tipToShow = evaluateTips(applicableTips);
      if (tipToShow) {
        setIsVisible(true);
        setStartTime(Date.now());
        trackEvent({
          event_type: 'tip_shown',
          item_id: tipToShow.id,
          variant,
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoaded, featureId, delay, applicableTips, evaluateTips, trackFeatureVisit, trackEvent, variant]);

  const activeTip = evaluateTips(applicableTips);

  const handleDismiss = () => {
    if (activeTip) {
      const engagementMs = Date.now() - startTime;
      markTipShown(featureId);
      trackEngagement(activeTip.id, variant, engagementMs, 'dismiss');
    }
    setIsVisible(false);
  };

  const handleAction = () => {
    if (activeTip) {
      const engagementMs = Date.now() - startTime;
      markTipShown(featureId);
      trackEngagement(activeTip.id, variant, engagementMs, 'click');
    }
    setIsVisible(false);
    onAction?.();
  };

  if (!isVisible || !activeTip) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed z-[140]',
          isMobile 
            ? 'bottom-4 left-4 right-4' 
            : 'bottom-6 right-6 w-80',
          className
        )}
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {/* Background */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/5" />
          
          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(270 100% 60% / 0.4), transparent 50%, hsl(290 100% 60% / 0.3))',
              padding: '1px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
            animate={displayConfig.animationStyle === 'playful' ? {
              background: [
                'linear-gradient(0deg, hsl(270 100% 60% / 0.4), transparent 50%, hsl(290 100% 60% / 0.3))',
                'linear-gradient(180deg, hsl(270 100% 60% / 0.4), transparent 50%, hsl(290 100% 60% / 0.3))',
                'linear-gradient(360deg, hsl(270 100% 60% / 0.4), transparent 50%, hsl(290 100% 60% / 0.3))',
              ],
            } : undefined}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />

          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-red-500" />

          {/* Content */}
          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {displayConfig.showIcon && (
                  <motion.div
                    className="p-2 rounded-xl bg-violet-500/10"
                    animate={displayConfig.animationStyle === 'prominent' ? { 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : undefined}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-5 w-5 text-violet-500" />
                  </motion.div>
                )}
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                  Pro Tip
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tip content */}
            <div className="space-y-2 mb-4">
              <h4 className="font-semibold text-base">{activeTip.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {activeTip.content}
              </p>
            </div>

            {/* Action */}
            {onAction && (
              <motion.button
                onClick={handleAction}
                className="flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                whileHover={{ x: 4 }}
              >
                Learn more
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Feature tracker component - invisible, just tracks visits
export const FeatureTracker = ({ featureId }: { featureId: string }) => {
  const { trackFeatureVisit, isLoaded } = useSmartTriggers();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (isLoaded && !hasTracked.current) {
      trackFeatureVisit(featureId);
      hasTracked.current = true;
    }
  }, [isLoaded, featureId, trackFeatureVisit]);

  return null;
};

// Action tracker - wrap buttons/actions to track usage
export const ActionTracker = ({ 
  featureId, 
  children,
  onClick 
}: { 
  featureId: string; 
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  const { trackFeatureAction } = useSmartTriggers();

  const handleClick = () => {
    trackFeatureAction(featureId);
    onClick?.();
  };

  return (
    <div onClick={handleClick}>
      {children}
    </div>
  );
};
