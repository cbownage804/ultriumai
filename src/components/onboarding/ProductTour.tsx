import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { TourOverlay, TourHighlight, TourCard } from './tour';

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

  // Auto-start logic
  useEffect(() => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    if (completed.includes(tourId)) {
      return;
    }

    if (autoStart) {
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [tourId, autoStart]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'Escape':
          e.preventDefault();
          handleSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, steps.length]);

  // Update highlight position when step changes
  useEffect(() => {
    if (!isActive || !steps[currentStep]?.target) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = (shouldScroll = false) => {
      const element = document.querySelector(steps[currentStep].target!);
      if (element) {
        // Scroll element into view first if needed
        if (shouldScroll) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
        
        // Update rect after a brief delay to let scroll settle
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setHighlightRect(rect);
        }, shouldScroll ? 300 : 0);
      }
    };

    // Initial update with scroll
    const timer = setTimeout(() => updateHighlight(true), 150);
    
    // Debounced resize handler (no scroll)
    let resizeTimeout: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => updateHighlight(false), 50);
    };
    
    window.addEventListener('resize', debouncedUpdate);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedUpdate);
    };
  }, [isActive, currentStep, steps]);

  const triggerConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify([...completed, tourId]));
    setIsActive(false);
    triggerConfetti();
    toast.success('🎉 Tour completed! You can replay it anytime from the Help Center.');
    onComplete?.();
  }, [tourId, onComplete, triggerConfetti]);

  const handleSkip = useCallback(() => {
    // Save to localStorage so tour doesn't show again
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    if (!completed.includes(tourId)) {
      localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify([...completed, tourId]));
    }
    setIsActive(false);
    toast.info('Tour skipped. You can replay it anytime from the Help Center.');
    onSkip?.();
  }, [tourId, onSkip]);

  const handleStepClick = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const step = steps[currentStep];

  if (!isActive || !step) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {/* Overlay */}
      <TourOverlay key="tour-overlay" onClick={handleSkip} />

      {/* Highlight */}
      {highlightRect && <TourHighlight key="tour-highlight" rect={highlightRect} />}

      {/* Tour card */}
      <TourCard
        key="tour-card"
        step={step}
        currentStep={currentStep}
        totalSteps={steps.length}
        position={step.position}
        highlightRect={highlightRect}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        onStepClick={handleStepClick}
      />
    </AnimatePresence>
  );
};

// Hook to manage tour state
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

// Reset all tours
export const resetAllProductTours = () => {
  localStorage.removeItem(COMPLETED_TOURS_KEY);
};
