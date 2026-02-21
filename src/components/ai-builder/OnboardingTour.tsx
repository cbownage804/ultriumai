import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { WELCOME_STORAGE_KEY, WELCOME_DISMISSED_EVENT } from './WelcomeOverlay';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="chat-input"]',
    title: 'Chat with AI',
    description: 'Type your ideas here. Describe what you want to build — the AI generates production-ready code instantly.',
    position: 'top',
  },
  {
    target: '[data-tour="mode-toggle"]',
    title: 'Build vs Chat Mode',
    description: 'Build mode generates code with an agent workflow. Chat mode lets you discuss and plan without generating files.',
    position: 'top',
  },
  {
    target: '[data-tour="preview"]',
    title: 'Live Preview',
    description: 'Your app renders here in real-time. Use the responsive toggle, visual edit mode, and zoom controls to inspect your work.',
    position: 'left',
  },
  {
    target: '[data-tour="code-editor"]',
    title: 'Code Editor',
    description: 'Full Monaco editor with AI autocomplete (press Tab), inline AI actions (select code → right-click), and multi-file tabs.',
    position: 'left',
  },
  {
    target: '[data-tour="command-palette"]',
    title: 'Command Palette (⌘K)',
    description: 'Your shortcut to everything — search files, switch branches, toggle panels, run commands, and more.',
    position: 'top',
  },
];

const STORAGE_KEY = 'ai-builder-tour-completed';

interface OnboardingTourProps {
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
    if (completed) return;

    // If welcome overlay hasn't been shown yet, wait for it to be dismissed
    const welcomeSeen = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (!welcomeSeen) {
      const handleWelcomeDismissed = () => {
        setTimeout(() => setIsActive(true), 800);
      };
      window.addEventListener(WELCOME_DISMISSED_EVENT, handleWelcomeDismissed);
      return () => window.removeEventListener(WELCOME_DISMISSED_EVENT, handleWelcomeDismissed);
    }

    // Welcome was already seen in a previous session, start tour after delay
    const timer = setTimeout(() => setIsActive(true), 2000);
    return () => clearTimeout(timer);
  }, [forceShow]);

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
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;
    const centerX = Math.min(Math.max(highlightRect.left + highlightRect.width / 2, 170), viewW - 170);

    switch (step.position) {
      case 'top': {
        const bottomVal = viewH - highlightRect.top + pad;
        // If not enough space above, flip to center
        if (bottomVal > viewH - 100) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        return { bottom: bottomVal, left: centerX, transform: 'translateX(-50%)' };
      }
      case 'bottom': {
        const topVal = highlightRect.bottom + pad;
        if (topVal > viewH - 120) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        return { top: topVal, left: centerX, transform: 'translateX(-50%)' };
      }
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
            className="fixed inset-0 z-[9998] bg-black/70"
            onClick={handleComplete}
          />

          {/* Highlight cutout */}
          {highlightRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: highlightRect.top - 6,
                left: highlightRect.left - 6,
                width: highlightRect.width + 12,
                height: highlightRect.height + 12,
                borderRadius: 10,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                border: '2px solid rgba(34, 211, 238, 0.6)',
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
            className="fixed z-[10000] w-80 p-5 rounded-xl bg-[#0c0c10] border border-white/[0.12] shadow-2xl shadow-black/60"
            style={getTooltipStyle()}
          >
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-[11px] font-medium text-white/50">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={handleComplete}
                className="h-6 w-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <h3 className="text-sm font-bold text-white mb-1.5">{step.title}</h3>
            <p className="text-xs text-white/55 leading-relaxed mb-4">{step.description}</p>

            {/* Progress dots */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep ? 'w-5 bg-cyan-400' : i < currentStep ? 'w-2 bg-cyan-400/40' : 'w-2 bg-white/15'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-1.5">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="h-8 px-4 rounded-lg flex items-center gap-1 text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-semibold transition-colors"
                >
                  {isLast ? 'Done' : 'Next'}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
