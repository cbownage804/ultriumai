/**
 * TodayPriorityCard — one obvious next action Ray wants you to take.
 * Deliberately singular so users don't get decision fatigue. If there's
 * nothing meaningful, render nothing.
 */
import { ArrowRight, Clock, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface TodayPriority {
  action: string;
  detail?: string;
  estimatedTime?: string;
  riskReduction?: 'Low' | 'Medium' | 'High' | 'Critical';
  href?: string;
  onClick?: () => void;
}

interface Props {
  priority?: TodayPriority | null;
  className?: string;
}

export function TodayPriorityCard({ priority, className }: Props) {
  if (!priority) return null;

  const body = (
    <div
      className={cn(
        'wrayth-chamfer border border-violet-400/30 bg-violet-500/[0.05] p-5 sm:p-6',
        'group transition-colors hover:bg-violet-500/[0.08]',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
        <Zap className="h-3 w-3" /> Today's priority
      </div>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base sm:text-lg font-light text-foreground">{priority.action}</div>
          {priority.detail && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{priority.detail}</p>
          )}
        </div>
        {(priority.href || priority.onClick) && (
          <ArrowRight className="h-4 w-4 text-violet-200 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
        )}
      </div>
      {(priority.estimatedTime || priority.riskReduction) && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {priority.estimatedTime && (
            <div className="flex items-center gap-2 text-xs text-foreground/80">
              <Clock className="h-3.5 w-3.5 text-violet-200/80" />
              Estimated time: <span className="text-foreground">{priority.estimatedTime}</span>
            </div>
          )}
          {priority.riskReduction && (
            <div className="flex items-center gap-2 text-xs text-foreground/80">
              <ShieldCheck className="h-3.5 w-3.5 text-green-300/80" />
              Risk reduction: <span className="text-foreground">{priority.riskReduction}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (priority.href) {
    return (
      <Link to={priority.href} className="block">
        {body}
      </Link>
    );
  }
  if (priority.onClick) {
    return (
      <button type="button" onClick={priority.onClick} className="block w-full text-left">
        {body}
      </button>
    );
  }
  return body;
}

export default TodayPriorityCard;
