import { CheckCircle2, Circle, Loader2, XCircle, Wrench, Brain, Code2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentRun, AgentStep } from '@/hooks/useAgentMode';

const STEP_ICONS: Record<AgentStep['type'], typeof Brain> = {
  plan: Brain,
  execute: Code2,
  verify: Search,
  fix: Wrench,
};

const STEP_STATUS_ICON = {
  pending: Circle,
  running: Loader2,
  done: CheckCircle2,
  error: XCircle,
};

interface AgentModePanelProps {
  run: AgentRun | null;
  onCancel?: () => void;
}

export function AgentModePanel({ run, onCancel }: AgentModePanelProps) {
  if (!run || run.status === 'idle') return null;

  return (
    <div className="mx-4 mb-3 rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[11px] font-medium text-white/60">Agent Mode</span>
        </div>
        {run.status === 'running' && onCancel && (
          <button onClick={onCancel} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-red-500/10">
            Cancel
          </button>
        )}
        {run.status === 'completed' && (
          <span className="text-[10px] text-emerald-400/60">Completed</span>
        )}
        {run.status === 'failed' && (
          <span className="text-[10px] text-red-400/60">Failed</span>
        )}
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {run.steps.map((step, i) => {
          const StepIcon = STEP_ICONS[step.type];
          const StatusIcon = STEP_STATUS_ICON[step.status];
          return (
            <div key={step.id} className="flex items-center gap-2">
              <StatusIcon className={cn(
                "h-3 w-3 shrink-0",
                step.status === 'running' && "text-cyan-400 animate-spin",
                step.status === 'done' && "text-emerald-400",
                step.status === 'error' && "text-red-400",
                step.status === 'pending' && "text-white/15",
              )} />
              <StepIcon className={cn("h-3 w-3 shrink-0", step.status === 'running' ? "text-cyan-400" : "text-white/20")} />
              <span className={cn(
                "text-[11px] flex-1",
                step.status === 'running' ? "text-white/70" :
                step.status === 'done' ? "text-white/40" : "text-white/20"
              )}>
                {step.label}
              </span>
              {step.detail && (
                <span className="text-[9px] text-white/20">{step.detail}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
