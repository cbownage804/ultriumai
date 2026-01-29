import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight, CheckCircle, Sparkles, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TourProgress } from './TourProgress';
import { TourStep } from '../ProductTour';

interface TourCardProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightRect: DOMRect | null;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onStepClick: (step: number) => void;
}

export const TourCard = ({
  step,
  currentStep,
  totalSteps,
  position,
  highlightRect,
  onNext,
  onPrevious,
  onSkip,
  onStepClick,
}: TourCardProps) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const getPositionClasses = () => {
    if (position === 'center') return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    if (position === 'top') return 'top-4 left-1/2 -translate-x-1/2';
    if (position === 'bottom') return 'bottom-4 left-1/2 -translate-x-1/2';
    if (position === 'left') return 'left-4 top-1/2 -translate-y-1/2';
    if (position === 'right') return 'right-4 top-1/2 -translate-y-1/2';
    if (!highlightRect) return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    return 'bottom-4 left-1/2 -translate-x-1/2';
  };

  return (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn('fixed z-[103] w-full max-w-md p-4', getPositionClasses())}
    >
      <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="text-xs font-medium text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="p-1.5 rounded-full hover:bg-muted transition-colors group"
              aria-label="Close tour"
            >
              <X className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="mb-5">
            <TourProgress 
              currentStep={currentStep} 
              totalSteps={totalSteps}
              onStepClick={onStepClick}
            />
          </div>

          {/* Image */}
          {step.image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-4 rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={step.image}
                alt={step.title}
                className="w-full h-40 object-cover"
              />
            </motion.div>
          )}

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2 mb-6"
          >
            <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </motion.div>

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
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={isFirstStep}
              className="gap-1.5 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip tour
            </Button>

            <Button
              size="sm"
              onClick={onNext}
              className="gap-1.5 min-w-[100px] transition-all"
            >
              {isLastStep ? (
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

          {/* Keyboard hint */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-muted-foreground/60"
          >
            <Keyboard className="h-3 w-3" />
            <span>Use arrow keys to navigate • Esc to close</span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
