import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TourProgressProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export const TourProgress = ({ currentStep, totalSteps, onStepClick }: TourProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <button
          key={index}
          onClick={() => onStepClick?.(index)}
          disabled={!onStepClick}
          className={cn(
            "relative h-2 rounded-full transition-all duration-300",
            index === currentStep ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
            onStepClick && "cursor-pointer"
          )}
        >
          {index === currentStep && (
            <motion.div
              layoutId="activeDot"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          {index < currentStep && (
            <div className="absolute inset-0 bg-primary/60 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};
