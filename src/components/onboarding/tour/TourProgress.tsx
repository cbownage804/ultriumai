import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface TourProgressProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export const TourProgress = ({ currentStep, totalSteps, onStepClick }: TourProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        
        return (
          <button
            key={index}
            onClick={() => onStepClick?.(index)}
            disabled={!onStepClick}
            className={cn(
              "relative transition-all duration-300 ease-out",
              onStepClick && "cursor-pointer group"
            )}
          >
            {/* Connector line */}
            {index < totalSteps - 1 && (
              <div 
                className={cn(
                  "absolute top-1/2 left-full w-3 h-0.5 -translate-y-1/2 transition-colors duration-300",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
            
            {/* Dot container */}
            <motion.div
              className={cn(
                "relative flex items-center justify-center rounded-full transition-all duration-300",
                isActive ? "w-10 h-3" : "w-3 h-3",
                isActive && "bg-primary shadow-lg shadow-primary/30",
                isCompleted && "bg-primary",
                !isActive && !isCompleted && "bg-muted-foreground/20 group-hover:bg-muted-foreground/40"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active indicator with gradient */}
              {isActive && (
                <motion.div
                  layoutId="activeStep"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-primary to-primary/80"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* Completed checkmark */}
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center justify-center"
                >
                  <Check className="w-2 h-2 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              )}
              
              {/* Pulse for active */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
            
            {/* Step number tooltip on hover */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap"
            >
              Step {index + 1}
            </motion.div>
          </button>
        );
      })}
    </div>
  );
};
