import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  X, CheckCircle2, Circle, ArrowRight, RotateCcw, 
  Sparkles, Target, Hand, MousePointer, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useScreenSize } from '@/hooks/useScreenSize';

export interface TutorialStep {
  id: string;
  title: string;
  instruction: string;
  hint?: string;
  target?: string; // CSS selector to highlight
  action: 'click' | 'type' | 'select' | 'toggle' | 'custom';
  validation?: () => boolean; // Custom validation function
  expectedValue?: string; // For type actions
  onComplete?: () => void;
}

interface InteractiveTutorialProps {
  tutorialId: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  onComplete?: () => void;
  onExit?: () => void;
  children?: ReactNode;
}

const COMPLETED_TUTORIALS_KEY = 'ultrium_completed_tutorials';
const TUTORIAL_PROGRESS_KEY = 'ultrium_tutorial_progress';

export const InteractiveTutorial = ({
  tutorialId,
  title,
  description,
  steps,
  onComplete,
  onExit,
}: InteractiveTutorialProps) => {
  const [isActive, setIsActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isWaitingForAction, setIsWaitingForAction] = useState(true);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [showHint, setShowHint] = useState(false);
  const { isMobile, isTablet } = useScreenSize();

  const step = steps[currentStep];
  const progress = (completedSteps.size / steps.length) * 100;

  // Save progress
  useEffect(() => {
    if (completedSteps.size > 0) {
      const progressData = JSON.parse(localStorage.getItem(TUTORIAL_PROGRESS_KEY) || '{}');
      progressData[tutorialId] = {
        currentStep,
        completedSteps: Array.from(completedSteps),
        lastUpdated: Date.now(),
      };
      localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(progressData));
    }
  }, [tutorialId, currentStep, completedSteps]);

  // Update highlight position
  useEffect(() => {
    if (!isActive || !step?.target) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const element = document.querySelector(step.target!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const timer = setTimeout(updateHighlight, 200);
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [isActive, step]);

  // Listen for user actions
  useEffect(() => {
    if (!isActive || !step?.target) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return;

    const handleAction = (e: Event) => {
      let isValid = false;

      switch (step.action) {
        case 'click':
          isValid = true;
          break;
        case 'type':
          if (step.expectedValue && e.target instanceof HTMLInputElement) {
            isValid = e.target.value.toLowerCase().includes(step.expectedValue.toLowerCase());
          } else {
            isValid = true;
          }
          break;
        case 'select':
        case 'toggle':
          isValid = true;
          break;
        case 'custom':
          isValid = step.validation?.() ?? true;
          break;
      }

      if (isValid) {
        completeCurrentStep();
      }
    };

    const eventType = step.action === 'type' ? 'input' : 'click';
    targetElement.addEventListener(eventType, handleAction);

    return () => {
      targetElement.removeEventListener(eventType, handleAction);
    };
  }, [isActive, step, currentStep]);

  const completeCurrentStep = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setIsWaitingForAction(false);
    step?.onComplete?.();

    // Small celebration
    toast.success(`Step ${currentStep + 1} completed!`, { duration: 1500 });

    // Auto-advance after brief delay
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setIsWaitingForAction(true);
        setShowHint(false);
      } else {
        handleComplete();
      }
    }, 800);
  }, [currentStep, steps.length, step]);

  const handleComplete = useCallback(() => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TUTORIALS_KEY) || '[]');
    localStorage.setItem(COMPLETED_TUTORIALS_KEY, JSON.stringify([...completed, tutorialId]));
    
    // Big celebration
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999,
    });

    setIsActive(false);
    toast.success('🎉 Tutorial completed! Great job!');
    onComplete?.();
  }, [tutorialId, onComplete]);

  const handleExit = useCallback(() => {
    setIsActive(false);
    toast.info('Tutorial paused. Resume anytime from the Help Center.');
    onExit?.();
  }, [onExit]);

  const handleSkipStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowHint(false);
    }
  }, [currentStep, steps.length]);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsWaitingForAction(true);
    setShowHint(false);
  }, []);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </motion.div>

      {/* Highlight */}
      {highlightRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed z-[101]"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            borderRadius: '12px',
            pointerEvents: 'none',
          }}
        >
          {/* Pulsing border */}
          <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse" />
          <div className="absolute inset-0 rounded-xl bg-primary/5" />
          
          {/* Action indicator */}
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {step.action === 'click' && <MousePointer className="h-3 w-3" />}
            {step.action === 'type' && <Hand className="h-3 w-3" />}
            <span>{step.action === 'click' ? 'Click here' : step.action === 'type' ? 'Type here' : 'Interact'}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Allow interaction with highlighted element */}
      {highlightRect && (
        <div
          className="fixed z-[102]"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            pointerEvents: 'auto',
          }}
        />
      )}

      {/* Tutorial Panel */}
      <motion.div
        initial={{ opacity: 0, x: isMobile ? 0 : 20, y: isMobile ? 20 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: isMobile ? 0 : 20, y: isMobile ? 20 : 0 }}
        className={cn(
          "fixed z-[103] pointer-events-auto",
          isMobile 
            ? "bottom-4 left-4 right-4 w-auto" 
            : isTablet 
              ? "top-4 right-4 w-72"
              : "top-4 right-4 w-80"
        )}
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl">
          {/* Background */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          
          {/* Border */}
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent)',
              padding: '1px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <button
                onClick={handleExit}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedSteps.size} of {steps.length}</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {/* Step list - shorter on mobile */}
            <div className={cn(
              "space-y-2 mb-4 overflow-y-auto",
              isMobile ? "max-h-32" : "max-h-48"
            )}>
              {steps.map((s, idx) => {
                const isCompleted = completedSteps.has(idx);
                const isCurrent = idx === currentStep;
                
                return (
                  <motion.div
                    key={s.id}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-lg transition-colors",
                      isCurrent && "bg-primary/10 ring-1 ring-primary/20",
                      isCompleted && "opacity-60"
                    )}
                    animate={isCurrent ? { scale: [1, 1.01, 1] } : {}}
                    transition={{ duration: 1, repeat: isCurrent ? Infinity : 0 }}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Circle className="h-4 w-4 text-primary fill-primary/20" />
                        </motion.div>
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs font-medium truncate",
                        isCompleted && "line-through"
                      )}>
                        {s.title}
                      </p>
                      {isCurrent && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-muted-foreground mt-1"
                        >
                          {s.instruction}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Hint */}
            {step?.hint && (
              <AnimatePresence>
                {showHint ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">{step.hint}</p>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Need a hint?
                  </button>
                )}
              </AnimatePresence>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restart
              </Button>
              
              <div className="flex-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipStep}
                disabled={currentStep >= steps.length - 1}
                className="text-xs text-muted-foreground"
              >
                Skip step
              </Button>
            </div>

            {/* Completion badge preview */}
            {completedSteps.size === steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-500/10 border border-yellow-500/20"
              >
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-xs font-medium">Almost there!</p>
                    <p className="text-[10px] text-muted-foreground">Complete the last step to earn your badge</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook to manage tutorials
export const useInteractiveTutorial = (tutorialId: string) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState<{ currentStep: number; completedSteps: number[] } | null>(null);

  useEffect(() => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TUTORIALS_KEY) || '[]');
    setIsCompleted(completed.includes(tutorialId));

    const progressData = JSON.parse(localStorage.getItem(TUTORIAL_PROGRESS_KEY) || '{}');
    if (progressData[tutorialId]) {
      setProgress(progressData[tutorialId]);
    }
  }, [tutorialId]);

  const resetTutorial = () => {
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TUTORIALS_KEY) || '[]');
    localStorage.setItem(
      COMPLETED_TUTORIALS_KEY,
      JSON.stringify(completed.filter((id: string) => id !== tutorialId))
    );
    
    const progressData = JSON.parse(localStorage.getItem(TUTORIAL_PROGRESS_KEY) || '{}');
    delete progressData[tutorialId];
    localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(progressData));
    
    setIsCompleted(false);
    setProgress(null);
  };

  return { isCompleted, progress, resetTutorial };
};

// Reset all tutorials
export const resetAllTutorials = () => {
  localStorage.removeItem(COMPLETED_TUTORIALS_KEY);
  localStorage.removeItem(TUTORIAL_PROGRESS_KEY);
};
