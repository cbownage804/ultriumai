import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="hub-dashboard"]',
    title: 'Your Command Center',
    description: 'Monitor KPIs across all your products at a glance. Click "Customize" to add or remove widgets.',
    position: 'bottom',
  },
  {
    target: '[data-tour="hub-products"]',
    title: 'Product Cards',
    description: 'Access AI Studio, SafeSuite, and Vanguard from here. Each card shows your plan status and key features.',
    position: 'top',
  },
  {
    target: '[data-tour="hub-activity"]',
    title: 'Activity Feed',
    description: 'Track recent actions across all products — tickets, scans, AI runs — in one timeline.',
    position: 'top',
  },
  {
    target: '[data-tour="hub-search"]',
    title: 'Global Search (⌘K)',
    description: 'Press ⌘K anywhere to search pages, navigate between products, and run commands instantly.',
    position: 'bottom',
  },
];

const STORAGE_KEY = 'hub-onboarding-tour-completed';

export function HubOnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const findTarget = () => {
      const el = document.querySelector(step.target);
      if (el) {
        setHighlightRect(el.getBoundingClientRect());
      } else {
        setHighlightRect(null);
      }
    };

    findTarget();
    const interval = setInterval(findTarget, 500);
    return () => clearInterval(interval);
  }, [isActive, currentStep]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const pad = 16;
    switch (step.position) {
      case 'top':
        return { bottom: `calc(100vh - ${highlightRect.top}px + ${pad}px)`, left: Math.min(highlightRect.left + highlightRect.width / 2, window.innerWidth - 160), transform: 'translateX(-50%)' };
      case 'bottom':
        return { top: highlightRect.bottom + pad, left: Math.min(highlightRect.left + highlightRect.width / 2, window.innerWidth - 160), transform: 'translateX(-50%)' };
      case 'left':
        return { top: highlightRect.top + highlightRect.height / 2, right: `calc(100vw - ${highlightRect.left}px + ${pad}px)`, transform: 'translateY(-50%)' };
      case 'right':
        return { top: highlightRect.top + highlightRect.height / 2, left: highlightRect.right + pad, transform: 'translateY(-50%)' };
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60"
            onClick={handleComplete}
          />

          {highlightRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: highlightRect.top - 4,
                left: highlightRect.left - 4,
                width: highlightRect.width + 8,
                height: highlightRect.height + 8,
                borderRadius: 8,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                border: '2px solid hsl(var(--primary) / 0.5)',
              }}
            />
          )}

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[10000] w-72 p-4 rounded-xl bg-card border border-border shadow-2xl"
            style={getTooltipStyle()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground/50">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={handleComplete}
                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">{step.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === currentStep ? 'w-4 bg-primary' : i < currentStep ? 'w-1.5 bg-primary/30' : 'w-1.5 bg-muted'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-1">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="h-7 px-2 rounded-md flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="h-7 px-3 rounded-md flex items-center gap-1 text-[10px] bg-primary/20 text-primary hover:bg-primary/30 font-medium"
                >
                  {isLast ? 'Done' : 'Next'}
                  {!isLast && <ChevronRight className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
