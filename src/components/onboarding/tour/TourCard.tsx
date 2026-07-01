import { Button } from '@/components/ui/button';
import { X, ArrowLeft, ArrowRight, CheckCircle, Sparkles, Keyboard, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TourProgress } from './TourProgress';
import { TourStep } from '../ProductTour';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useMemo } from 'react';

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

const CARD_WIDTH = 380;
const CARD_HEIGHT = 320;
const SPACING = 16;

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
  const { isMobile, isTablet, width: screenWidth, height: screenHeight } = useScreenSize();
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Calculate smart position based on highlight rect and available space
  const cardStyle = useMemo(() => {
    // No highlight - center the card
    if (!highlightRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const cardWidth = isMobile ? screenWidth - 32 : isTablet ? Math.min(CARD_WIDTH, screenWidth - 32) : CARD_WIDTH;
    const cardHeight = CARD_HEIGHT;

    // Calculate available space in each direction
    const spaceAbove = highlightRect.top - SPACING;
    const spaceBelow = screenHeight - highlightRect.bottom - SPACING;
    const spaceLeft = highlightRect.left - SPACING;
    const spaceRight = screenWidth - highlightRect.right - SPACING;

    // Determine best position based on preferred position and available space
    let bestPosition = position || 'bottom';
    
    // Check if preferred position works, otherwise find best alternative
    const canFitBelow = spaceBelow >= cardHeight + SPACING;
    const canFitAbove = spaceAbove >= cardHeight + SPACING;
    const canFitRight = spaceRight >= cardWidth + SPACING && !isMobile;
    const canFitLeft = spaceLeft >= cardWidth + SPACING && !isMobile;

    if (bestPosition === 'bottom' && !canFitBelow) {
      bestPosition = canFitAbove ? 'top' : canFitRight ? 'right' : canFitLeft ? 'left' : 'bottom';
    } else if (bestPosition === 'top' && !canFitAbove) {
      bestPosition = canFitBelow ? 'bottom' : canFitRight ? 'right' : canFitLeft ? 'left' : 'top';
    } else if (bestPosition === 'right' && !canFitRight) {
      bestPosition = canFitLeft ? 'left' : canFitBelow ? 'bottom' : canFitAbove ? 'top' : 'right';
    } else if (bestPosition === 'left' && !canFitLeft) {
      bestPosition = canFitRight ? 'right' : canFitBelow ? 'bottom' : canFitAbove ? 'top' : 'left';
    }

    // For mobile/tablet, prefer bottom or top positioning
    if (isMobile || isTablet) {
      bestPosition = canFitBelow ? 'bottom' : canFitAbove ? 'top' : 'bottom';
    }

    // Calculate position coordinates
    const highlightCenterX = highlightRect.left + highlightRect.width / 2;
    const highlightCenterY = highlightRect.top + highlightRect.height / 2;

    let top: number | string = 'auto';
    let left: number | string = 'auto';
    let transform = '';

    switch (bestPosition) {
      case 'bottom':
        top = highlightRect.bottom + SPACING;
        left = Math.max(16, Math.min(highlightCenterX - cardWidth / 2, screenWidth - cardWidth - 16));
        break;
      case 'top':
        top = highlightRect.top - cardHeight - SPACING;
        left = Math.max(16, Math.min(highlightCenterX - cardWidth / 2, screenWidth - cardWidth - 16));
        break;
      case 'right':
        top = Math.max(16, Math.min(highlightCenterY - cardHeight / 2, screenHeight - cardHeight - 16));
        left = highlightRect.right + SPACING;
        break;
      case 'left':
        top = Math.max(16, Math.min(highlightCenterY - cardHeight / 2, screenHeight - cardHeight - 16));
        left = highlightRect.left - cardWidth - SPACING;
        break;
      default:
        top = highlightRect.bottom + SPACING;
        left = Math.max(16, Math.min(highlightCenterX - cardWidth / 2, screenWidth - cardWidth - 16));
    }

    return {
      top: typeof top === 'number' ? `${top}px` : top,
      left: typeof left === 'number' ? `${left}px` : left,
      transform,
      width: isMobile ? 'calc(100% - 32px)' : `${cardWidth}px`,
      maxWidth: isMobile ? 'none' : `${cardWidth}px`,
    };
  }, [highlightRect, position, isMobile, isTablet, screenWidth, screenHeight]);

  return (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed z-[103]"
      style={cardStyle}
    >
      {/* Card with glassmorphism */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        
        {/* Animated border gradient */}
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent, hsl(var(--primary) / 0.2))',
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        
        {/* Shimmer effect on card */}
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1">
          <div className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        </div>
        
        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="p-1.5 rounded-lg bg-primary/10"
                >
                  {isLastStep ? (
                    <Rocket className="h-4 w-4 text-primary" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                </motion.div>
                <motion.div
                  className="absolute -inset-1 rounded-lg bg-primary/20 blur-sm"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="text-xs font-semibold text-primary">
                {currentStep + 1} / {totalSteps}
              </span>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onSkip}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              aria-label="Close tour"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </div>

          {/* Progress */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <TourProgress 
              currentStep={currentStep} 
              totalSteps={totalSteps}
              onStepClick={onStepClick}
            />
          </motion.div>

          {/* Image */}
          {step.image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-5 rounded-xl overflow-hidden ring-1 ring-white/10"
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3 mb-6"
          >
            <h3 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </motion.div>

          {/* Custom action */}
          {step.action && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={step.action.onClick}
                className="w-full mb-4 border-primary/20 hover:bg-primary/5"
              >
                {step.action.label}
              </Button>
            </motion.div>
          )}

          {/* Navigation */}
          <motion.div 
            className={cn(
              "flex items-center gap-2",
              isMobile ? "flex-col-reverse" : "justify-between"
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {isMobile ? (
              // Mobile: Stack buttons vertically
              <>
                <Button
                  size="sm"
                  onClick={onNext}
                  className={cn(
                    "w-full gap-1.5 transition-all shadow-lg",
                    isLastStep 
                      ? "bg-gradient-to-r from-green-500 to-green-500 hover:from-green-600 hover:to-green-600 shadow-green-500/25" 
                      : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-primary/25"
                  )}
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPrevious}
                    disabled={isFirstStep}
                    className="gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                    className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    Skip
                  </Button>
                </div>
              </>
            ) : (
              // Desktop: Horizontal layout
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrevious}
                  disabled={isFirstStep}
                  className="gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
                >
                  Skip
                </Button>

                <Button
                  size="sm"
                  onClick={onNext}
                  className={cn(
                    "gap-1.5 min-w-[110px] transition-all shadow-lg",
                    isLastStep 
                      ? "bg-gradient-to-r from-green-500 to-green-500 hover:from-green-600 hover:to-green-600 shadow-green-500/25" 
                      : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-primary/25"
                  )}
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}
          </motion.div>

          {/* Keyboard hint - hide on mobile */}
          {!isMobile && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-border/50"
            >
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <Keyboard className="h-3 w-3" />
                <span>Arrow keys</span>
                <span className="mx-1">•</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-[9px] font-mono">Esc</kbd>
                <span>to close</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
