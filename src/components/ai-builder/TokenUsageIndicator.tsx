import { Gauge, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenUsageIndicatorProps {
  tokensUsed: number;
  maxTokens: number;
  messageCount: number;
}

export function TokenUsageIndicator({ tokensUsed, maxTokens, messageCount }: TokenUsageIndicatorProps) {
  const percentage = Math.min((tokensUsed / maxTokens) * 100, 100);
  const isHigh = percentage > 75;
  const isMedium = percentage > 50;

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
      <Gauge className={cn(
        "h-3 w-3",
        isHigh ? "text-red-400" : isMedium ? "text-amber-400" : "text-emerald-400"
      )} />
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isHigh ? "bg-red-400" : isMedium ? "bg-amber-400" : "bg-emerald-400"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-[9px] text-white/30 font-mono whitespace-nowrap">
          {(tokensUsed / 1000).toFixed(1)}k
        </span>
      </div>
      <div className="flex items-center gap-0.5 text-[9px] text-white/20">
        <Zap className="h-2.5 w-2.5" />
        {messageCount}
      </div>
    </div>
  );
}
