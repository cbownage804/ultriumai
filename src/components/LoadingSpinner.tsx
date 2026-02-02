import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  className,
  text 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10'
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {/* Outer glow ring */}
          <div className={cn(
            "absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse",
            size === 'lg' && 'scale-150'
          )} />
          {/* Spinner */}
          <Loader2 className={cn(
            "animate-spin text-primary relative z-10 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]", 
            sizeClasses[size]
          )} />
        </div>
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export const PageLoadingSpinner = ({ text }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
    {/* Background decoration */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px] animate-[pulse_3s_ease-in-out_infinite]" />
    </div>
    <LoadingSpinner size="lg" text={text || "Loading..."} />
  </div>
);

export default LoadingSpinner;