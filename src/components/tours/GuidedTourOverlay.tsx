/**
 * Guided Tour Overlay - Interactive step-by-step walkthrough
 * Highlights UI elements and provides contextual guidance
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, SkipForward, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Re-export TourStep from ProductTour for consistency
import { TourStep } from '@/components/onboarding/ProductTour';
export type { TourStep } from '@/components/onboarding/ProductTour';

interface GuidedTourOverlayProps {
  tourId: string;
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  persistCompletion?: boolean;
}

const COMPLETED_TOURS_KEY = 'ultrium_completed_tours';

export function GuidedTourOverlay({
  tourId,
  steps,
  isOpen,
  onClose,
  onComplete,
  persistCompletion = true,
}: GuidedTourOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight target element
  useEffect(() => {
    if (!isOpen || !step?.target) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(step.target!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    // Delay to allow DOM to settle
    const timeout = setTimeout(findTarget, 100);
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget);
    };
  }, [isOpen, step?.target, currentStep]);

  // Execute step action
  useEffect(() => {
    if (isOpen && step?.action?.onClick) {
      step.action.onClick();
    }
  }, [isOpen, step, currentStep]);

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    if (isLastStep) {
      // Mark tour as completed
      if (persistCompletion) {
        const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
        if (!completed.includes(tourId)) {
          completed.push(tourId);
          localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(completed));
        }
      }
      onComplete?.();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [isLastStep, onComplete, onClose, persistCompletion, tourId, isAnimating]);

  const handlePrev = useCallback(() => {
    if (isAnimating || isFirstStep) return;
    setIsAnimating(true);
    setCurrentStep(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isFirstStep, isAnimating]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleSkip]);

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect || step?.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 200;

    switch (step?.position) {
      case 'top':
        return {
          position: 'fixed' as const,
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'left':
        return {
          position: 'fixed' as const,
          top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding))}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
        };
      case 'right':
        return {
          position: 'fixed' as const,
          top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding))}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-auto"
      >
        {/* Backdrop with spotlight cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight ring animation */}
        {targetRect && (
          <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed pointer-events-none"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          >
            <div className="absolute inset-0 border-2 border-primary rounded-lg animate-pulse" />
            <div className="absolute inset-0 border-2 border-primary/50 rounded-lg animate-ping" />
          </motion.div>
        )}

        {/* Tour tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl w-[360px] max-w-[calc(100vw-32px)] overflow-hidden",
          )}
          style={getTooltipPosition()}
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-primary/10 via-transparent to-cyan-500/10 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progress} className="h-1 mt-3" />
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <h3 className="text-lg font-semibold mb-2">{step?.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step?.description}
            </p>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-muted/30 border-t border-border/30 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <SkipForward className="h-4 w-4 mr-1" />
              Skip Tour
            </Button>
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Done
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to check if a tour has been completed
export function useTourCompletion(tourId: string) {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    setIsCompleted(completed.includes(tourId));
  }, [tourId]);

  const markCompleted = useCallback(() => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    if (!completed.includes(tourId)) {
      completed.push(tourId);
      localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(completed));
      setIsCompleted(true);
    }
  }, [tourId]);

  const resetCompletion = useCallback(() => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    const updated = completed.filter((id: string) => id !== tourId);
    localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(updated));
    setIsCompleted(false);
  }, [tourId]);

  return { isCompleted, markCompleted, resetCompletion };
}
