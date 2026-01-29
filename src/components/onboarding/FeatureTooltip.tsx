import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeatureTooltipProps {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  children: React.ReactNode;
  showOnce?: boolean;
  delay?: number;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  isNew?: boolean;
}

const DISMISSED_TOOLTIPS_KEY = 'ultrium_dismissed_tooltips';

export const FeatureTooltip = ({
  id,
  title,
  description,
  position = 'bottom',
  align = 'center',
  children,
  showOnce = true,
  delay = 500,
  onDismiss,
  actionLabel,
  onAction,
  isNew = false,
}: FeatureTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_TOOLTIPS_KEY) || '[]');
    if (dismissed.includes(id)) {
      setIsDismissed(true);
      return;
    }

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [id, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    
    if (showOnce) {
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_TOOLTIPS_KEY) || '[]');
      localStorage.setItem(DISMISSED_TOOLTIPS_KEY, JSON.stringify([...dismissed, id]));
      setIsDismissed(true);
    }
    
    onDismiss?.();
  };

  const handleAction = () => {
    onAction?.();
    handleDismiss();
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const alignClasses = {
    start: position === 'top' || position === 'bottom' ? 'left-0' : 'top-0',
    center: position === 'top' || position === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
    end: position === 'top' || position === 'bottom' ? 'right-0' : 'bottom-0',
  };

  const arrowClasses = {
    top: 'bottom-0 translate-y-full border-t-primary/90 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-0 -translate-y-full border-b-primary/90 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-0 translate-x-full border-l-primary/90 border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-0 -translate-x-full border-r-primary/90 border-t-transparent border-b-transparent border-l-transparent',
  };

  if (isDismissed) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute z-50 w-72 p-4 rounded-lg shadow-lg',
              'bg-gradient-to-br from-primary/95 to-primary text-primary-foreground',
              'backdrop-blur-sm border border-primary-foreground/10',
              positionClasses[position],
              alignClasses[align]
            )}
          >
            {/* Arrow */}
            <div 
              className={cn(
                'absolute w-0 h-0 border-[8px]',
                arrowClasses[position],
                align === 'center' 
                  ? (position === 'top' || position === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2')
                  : align === 'start' 
                    ? (position === 'top' || position === 'bottom' ? 'left-6' : 'top-6')
                    : (position === 'top' || position === 'bottom' ? 'right-6' : 'bottom-6')
              )}
            />
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary-foreground/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isNew && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary-foreground/20 rounded-full">
                    NEW
                  </span>
                )}
                <Sparkles className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-xs text-primary-foreground/80">{description}</p>
              
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDismiss}
                  className="text-xs h-7"
                >
                  Got it
                </Button>
                {actionLabel && onAction && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAction}
                    className="text-xs h-7 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    {actionLabel}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Utility to reset all tooltips (for testing)
export const resetFeatureTooltips = () => {
  localStorage.removeItem(DISMISSED_TOOLTIPS_KEY);
};

// Hook to check if a tooltip has been dismissed
export const useFeatureTooltipStatus = (id: string) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_TOOLTIPS_KEY) || '[]');
    setIsDismissed(dismissed.includes(id));
  }, [id]);

  return isDismissed;
};
