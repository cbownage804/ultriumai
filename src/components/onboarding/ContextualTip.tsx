import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEEN_TIPS_KEY = 'ultrium_seen_tips';
const TIPS_ENABLED_KEY = 'ultrium_tips_enabled';

export interface ContextualTipConfig {
  id: string;
  title: string;
  content: string;
  learnMoreUrl?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number; // ms before showing
  showOnce?: boolean; // Only show first time (default true)
}

interface ContextualTipProps extends ContextualTipConfig {
  children: ReactNode;
  forceShow?: boolean;
  className?: string;
}

export const ContextualTip = ({
  id,
  title,
  content,
  learnMoreUrl,
  position = 'top',
  delay = 500,
  showOnce = true,
  children,
  forceShow = false,
  className,
}: ContextualTipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  // Check if tip was already seen
  useEffect(() => {
    const seenTips = JSON.parse(localStorage.getItem(SEEN_TIPS_KEY) || '[]');
    const tipsEnabled = localStorage.getItem(TIPS_ENABLED_KEY) !== 'false';
    
    if (seenTips.includes(id) && showOnce) {
      setHasSeen(true);
    }
    
    if (!tipsEnabled) {
      setHasSeen(true);
    }
  }, [id, showOnce]);

  const handleMouseEnter = useCallback(() => {
    if (hasSeen && !forceShow) return;
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [hasSeen, forceShow, delay]);

  const handleMouseLeave = useCallback(() => {
    if (!hasInteracted) {
      setIsVisible(false);
    }
  }, [hasInteracted]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setHasSeen(true);
    
    // Save to localStorage
    const seenTips = JSON.parse(localStorage.getItem(SEEN_TIPS_KEY) || '[]');
    if (!seenTips.includes(id)) {
      localStorage.setItem(SEEN_TIPS_KEY, JSON.stringify([...seenTips, id]));
    }
  }, [id]);

  const handleTipInteraction = () => {
    setHasInteracted(true);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-background',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-background',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-background',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-background',
  };

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? -5 : position === 'top' ? 5 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'absolute z-[200] w-64 pointer-events-auto',
              positionClasses[position]
            )}
            onClick={handleTipInteraction}
            onMouseEnter={handleTipInteraction}
          >
            {/* Tip card */}
            <div className="relative rounded-xl overflow-hidden shadow-xl">
              {/* Background */}
              <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-yellow-500/5" />
              
              {/* Border */}
              <div 
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent, hsl(45 100% 50% / 0.2))',
                  padding: '1px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />

              {/* Content */}
              <div className="relative p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Pro Tip
                    </span>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Title & Content */}
                <h4 className="font-semibold text-sm mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>

                {/* Learn more */}
                {learnMoreUrl && (
                  <a
                    href={learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-primary hover:underline"
                  >
                    Learn more
                    <ChevronRight className="h-3 w-3" />
                  </a>
                )}

                {/* Got it button */}
                <button
                  onClick={handleDismiss}
                  className="w-full mt-3 py-1.5 text-xs font-medium rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>

            {/* Arrow */}
            <div 
              className={cn(
                'absolute w-0 h-0 border-[6px]',
                arrowClasses[position]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Floating tip that appears near a target element
interface FloatingTipProps {
  tipId: string;
  targetSelector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  onDismiss?: () => void;
}

export const FloatingTip = ({
  tipId,
  targetSelector,
  title,
  content,
  position = 'right',
  delay = 1000,
  onDismiss,
}: FloatingTipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if already seen
    const seenTips = JSON.parse(localStorage.getItem(SEEN_TIPS_KEY) || '[]');
    if (seenTips.includes(tipId)) return;

    // Find target element
    const timer = setTimeout(() => {
      const target = document.querySelector(targetSelector);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
        setIsVisible(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [tipId, targetSelector, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    const seenTips = JSON.parse(localStorage.getItem(SEEN_TIPS_KEY) || '[]');
    localStorage.setItem(SEEN_TIPS_KEY, JSON.stringify([...seenTips, tipId]));
    onDismiss?.();
  };

  if (!isVisible || !targetRect) return null;

  const getPosition = () => {
    switch (position) {
      case 'top':
        return { top: targetRect.top - 10, left: targetRect.left + targetRect.width / 2 };
      case 'bottom':
        return { top: targetRect.bottom + 10, left: targetRect.left + targetRect.width / 2 };
      case 'left':
        return { top: targetRect.top + targetRect.height / 2, left: targetRect.left - 10 };
      case 'right':
        return { top: targetRect.top + targetRect.height / 2, left: targetRect.right + 10 };
    }
  };

  const pos = getPosition();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-[200] w-56"
        style={{
          top: pos.top,
          left: pos.left,
          transform: position === 'top' ? 'translate(-50%, -100%)' :
                    position === 'bottom' ? 'translate(-50%, 0)' :
                    position === 'left' ? 'translate(-100%, -50%)' :
                    'translate(0, -50%)',
        }}
      >
        <div className="rounded-xl overflow-hidden shadow-xl bg-background/95 backdrop-blur-xl border border-amber-500/20">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold">{title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{content}</p>
            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-1 text-xs font-medium rounded bg-muted/50 hover:bg-muted transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook to manage contextual tips
export const useContextualTips = () => {
  const [tipsEnabled, setTipsEnabled] = useState(true);

  useEffect(() => {
    const enabled = localStorage.getItem(TIPS_ENABLED_KEY) !== 'false';
    setTipsEnabled(enabled);
  }, []);

  const enableTips = () => {
    localStorage.setItem(TIPS_ENABLED_KEY, 'true');
    setTipsEnabled(true);
  };

  const disableTips = () => {
    localStorage.setItem(TIPS_ENABLED_KEY, 'false');
    setTipsEnabled(false);
  };

  const resetSeenTips = () => {
    localStorage.removeItem(SEEN_TIPS_KEY);
  };

  const hasSeenTip = (tipId: string) => {
    const seenTips = JSON.parse(localStorage.getItem(SEEN_TIPS_KEY) || '[]');
    return seenTips.includes(tipId);
  };

  const markTipSeen = (tipId: string) => {
    const seenTips = JSON.parse(localStorage.getItem(SEEN_TIPS_KEY) || '[]');
    if (!seenTips.includes(tipId)) {
      localStorage.setItem(SEEN_TIPS_KEY, JSON.stringify([...seenTips, tipId]));
    }
  };

  return {
    tipsEnabled,
    enableTips,
    disableTips,
    resetSeenTips,
    hasSeenTip,
    markTipSeen,
  };
};

// Reset all tips
export const resetContextualTips = () => {
  localStorage.removeItem(SEEN_TIPS_KEY);
};
