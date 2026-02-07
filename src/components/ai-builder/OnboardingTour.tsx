import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector or data attribute
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="chat-input"]',
    title: 'Chat with AI',
    description: 'Type your ideas here. Describe what you want to build and the AI will generate the code for you.',
    position: 'top',
  },
  {
    target: '[data-tour="mode-toggle"]',
    title: 'Build vs Discuss Mode',
    description: 'Switch between Build mode (generates code) and Discuss mode (plans architecture) to control the AI\'s behavior.',
    position: 'bottom',
  },
  {
    target: '[data-tour="preview"]',
    title: 'Live Preview',
    description: 'Your app renders here in real-time. You can interact with it, resize it, and even visually edit elements.',
    position: 'left',
  },
  {
    target: '[data-tour="code-editor"]',
    title: 'Code Editor',
    description: 'Switch to Code view to see and edit the generated code directly with Monaco editor, autocomplete, and Tailwind hints.',
    position: 'left',
  },
  {
    target: '[data-tour="command-palette"]',
    title: 'Command Palette (⌘K)',
    description: 'Press ⌘K anytime for quick actions: search files, switch branches, toggle panels, and more.',
    position: 'bottom',
  },
];

const STORAGE_KEY = 'ai-builder-tour-completed';

interface OnboardingTourProps {
  /** Force show even if already completed */
  forceShow?: boolean;
}

export function OnboardingTour({ forceShow }: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (forceShow) {
      setIsActive(true);
      setCurrentStep(0);
      return;
    }
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Delay start so UI has time to render
      const timer = setTimeout(() => setIsActive(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  // Find and highlight the target element
  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const findTarget = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    };

    findTarget();
    const interval = setInterval(findTarget, 500);
    return () => clearInterval(interval);
  }, [isActive, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // Position the tooltip relative to the highlight
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const pad = 16;
    switch (step.position) {
      case 'top':
        return { bottom: `calc(100vh - ${highlightRect.top}px + ${pad}px)`, left: highlightRect.left + highlightRect.width / 2, transform: 'translateX(-50%)' };
      case 'bottom':
        return { top: highlightRect.bottom + pad, left: highlightRect.left + highlightRect.width / 2, transform: 'translateX(-50%)' };
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60"
            onClick={handleSkip}
          />

          {/* Highlight cutout */}
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
                border: '2px solid rgba(34, 211, 238, 0.5)',
              }}
            />
          )}

          {/* Tooltip card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[10000] w-72 p-4 rounded-xl bg-[#0d0d14] border border-white/[0.08] shadow-2xl shadow-black/50"
            style={getTooltipStyle()}
          >
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-[10px] text-white/30">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <h3 className="text-sm font-semibold text-white/90 mb-1">{step.title}</h3>
            <p className="text-[11px] text-white/40 leading-relaxed mb-4">{step.description}</p>

            {/* Progress dots */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === currentStep ? 'w-4 bg-cyan-400' : i < currentStep ? 'w-1.5 bg-cyan-400/30' : 'w-1.5 bg-white/10'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-1">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="h-7 px-2 rounded-md flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="h-7 px-3 rounded-md flex items-center gap-1 text-[10px] bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium"
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
