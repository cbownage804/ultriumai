import { Zap } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderCreditsIndicatorProps {
  onOpenBilling: () => void;
}

export function HeaderCreditsIndicator({ onOpenBilling }: HeaderCreditsIndicatorProps) {
  const { dailyRemaining, monthlyRemaining, totalRemaining, isLoading } = useUserCredits();

  if (isLoading) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onOpenBilling}
          className="flex items-center gap-1.5 h-6 px-2 rounded-md text-[11px] font-medium text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <Zap className="h-3 w-3 text-violet-400" />
          <span className="tabular-nums">{Math.max(0, totalRemaining)}</span>
          <span className="text-white/25">credits</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-blue-400">Daily:</span>
            <span>{Math.max(0, dailyRemaining)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-violet-400">Monthly:</span>
            <span>{Math.max(0, monthlyRemaining)}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
