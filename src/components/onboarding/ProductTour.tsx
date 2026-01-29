import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  image?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ProductTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

const COMPLETED_TOURS_KEY = 'ultrium_completed_tours';

export const ProductTour = ({
  tourId,
  steps,
  onComplete,
  onSkip,
  autoStart = true,
}: ProductTourProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if tour was already completed
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    if (completed.includes(tourId)) {
      return;
    }

    if (autoStart) {
      // Delay start to let page render
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [tourId, autoStart]);

  // Update highlight position when step changes
  useEffect(() => {
    if (!isActive || !steps[currentStep]?.target) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const element = document.querySelector(steps[currentStep].target!);
      if (element) {
        setHighlightRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [isActive, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = useCallback(() => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify([...completed, tourId]));
    setIsActive(false);
    onComplete?.();
  }, [tourId, onComplete]);

  const handleSkip = () => {
    setIsActive(false);
    onSkip?.();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  if (!isActive || !step) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={handleSkip}
      />

      {/* Highlight cutout */}
      {highlightRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[101] pointer-events-none"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            borderRadius: '8px',
            border: '2px solid hsl(var(--primary))',
          }}
        />
      )}

      {/* Tour card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed z-[102] w-full max-w-md p-4',
            step.position === 'center' && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            step.position === 'top' && 'top-4 left-1/2 -translate-x-1/2',
            step.position === 'bottom' && 'bottom-4 left-1/2 -translate-x-1/2',
            step.position === 'left' && 'left-4 top-1/2 -translate-y-1/2',
            step.position === 'right' && 'right-4 top-1/2 -translate-y-1/2',
            !step.position && !highlightRect && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            !step.position && highlightRect && 'bottom-4 left-1/2 -translate-x-1/2'
          )}
        >
          <Card className="shadow-2xl border-primary/20">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <Badge variant="outline" className="text-xs">
                    Step {currentStep + 1} of {steps.length}
                  </Badge>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Progress */}
              <Progress value={progress} className="h-1 mb-4" />

              {/* Image */}
              {step.image && (
                <div className="mb-4 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              {/* Custom action */}
              {step.action && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={step.action.onClick}
                  className="w-full mb-4"
                >
                  {step.action.label}
                </Button>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip tour
                </Button>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

// Hook to start a tour programmatically
export const useProductTour = (tourId: string) => {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    setIsCompleted(completed.includes(tourId));
  }, [tourId]);

  const resetTour = () => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    localStorage.setItem(
      COMPLETED_TOURS_KEY,
      JSON.stringify(completed.filter((id: string) => id !== tourId))
    );
    setIsCompleted(false);
  };

  return { isCompleted, resetTour };
};

// Utility to reset all tours (for testing)
export const resetAllProductTours = () => {
  localStorage.removeItem(COMPLETED_TOURS_KEY);
};
