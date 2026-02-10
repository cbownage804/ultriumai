import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, Wrench, Brain, Code2, Search, ChevronDown, ChevronRight, Clock, Trash2, RotateCcw, X, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentRun, AgentStep, AgentTask } from '@/hooks/useAgentMode';

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

const TASK_STATUS_COLORS: Record<AgentTask['status'], string> = {
  queued: 'text-white/30',
  running: 'text-cyan-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  cancelled: 'text-white/20',
};

function formatElapsed(startMs?: number, endMs?: number): string {
  if (!startMs) return '';
  const elapsed = (endMs || Date.now()) - startMs;
  if (elapsed < 1000) return `${elapsed}ms`;
  return `${(elapsed / 1000).toFixed(1)}s`;
}

interface AgentModePanelProps {
  run: AgentRun | null;
  taskQueue: AgentTask[];
  onCancel?: () => void;
  onCancelTask?: (taskId: string) => void;
  onRetryTask?: (taskId: string) => void;
  onClearCompleted?: () => void;
}

export function AgentModePanel({ run, taskQueue, onCancel, onCancelTask, onRetryTask, onClearCompleted }: AgentModePanelProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(true);

  const hasContent = run || taskQueue.length > 0;
  if (!hasContent) return null;

  const queuedCount = taskQueue.filter(t => t.status === 'queued').length;
  const completedCount = taskQueue.filter(t => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled').length;

  return (
    <div className="mx-4 mb-3 rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", run?.status === 'running' ? "bg-violet-400 animate-pulse" : "bg-white/20")} />
          <span className="text-[11px] font-medium text-white/60">Agent Mode</span>
          {queuedCount > 0 && (
            <span className="text-[9px] bg-cyan-500/20 text-cyan-400 rounded-full px-1.5 py-0.5 font-mono">
              {queuedCount} queued
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {completedCount > 0 && onClearCompleted && (
            <button
              onClick={onClearCompleted}
              className="text-[9px] text-white/30 hover:text-white/60 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
            >
              Clear done
            </button>
          )}
          {run?.status === 'running' && onCancel && (
            <button onClick={onCancel} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-red-500/10">
              Cancel
            </button>
          )}
          {run?.status === 'completed' && (
            <span className="text-[10px] text-emerald-400/60">Completed</span>
          )}
          {run?.status === 'failed' && (
            <span className="text-[10px] text-red-400/60">Failed</span>
          )}
        </div>
      </div>

      {/* Current run steps */}
      {run && run.status !== 'idle' && (
        <div className="px-3 py-2 space-y-1.5 border-b border-white/[0.04]">
          {run.steps.map((step) => {
            const StepIcon = STEP_ICONS[step.type];
            const StatusIcon = STEP_STATUS_ICON[step.status];
            const elapsed = formatElapsed(step.startedAt, step.completedAt);
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
                {elapsed && (
                  <span className="text-[9px] text-white/15 font-mono">{elapsed}</span>
                )}
                {step.detail && (
                  <span className="text-[9px] text-white/20">{step.detail}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task queue */}
      {taskQueue.length > 0 && (
        <div className="px-3 py-2">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors mb-1.5 w-full"
          >
            {showQueue ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
            <ListTodo className="h-2.5 w-2.5" />
            <span>Task Queue ({taskQueue.length})</span>
          </button>

          {showQueue && (
            <div className="space-y-1">
              {taskQueue.map((task) => (
                <div key={task.id} className="group/task">
                  <div className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-white/[0.03] transition-colors">
                    {/* Status dot */}
                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", {
                      'bg-white/20': task.status === 'queued',
                      'bg-cyan-400 animate-pulse': task.status === 'running',
                      'bg-emerald-400': task.status === 'completed',
                      'bg-red-400': task.status === 'failed',
                      'bg-white/10': task.status === 'cancelled',
                    })} />

                    {/* Prompt preview */}
                    <span className={cn(
                      "text-[10px] flex-1 truncate",
                      TASK_STATUS_COLORS[task.status]
                    )}>
                      {task.prompt.slice(0, 60)}{task.prompt.length > 60 ? '...' : ''}
                    </span>

                    {/* Error count badge */}
                    {task.errorCount > 0 && (
                      <span className="text-[8px] text-amber-400/60 bg-amber-500/10 rounded px-1 py-0.5 font-mono">
                        {task.errorCount} fix{task.errorCount > 1 ? 'es' : ''}
                      </span>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                      {(task.status === 'failed' || task.status === 'cancelled') && onRetryTask && (
                        <button
                          onClick={() => onRetryTask(task.id)}
                          className="h-4 w-4 rounded flex items-center justify-center text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          title="Retry"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                        </button>
                      )}
                      {(task.status === 'queued' || task.status === 'running') && onCancelTask && (
                        <button
                          onClick={() => onCancelTask(task.id)}
                          className="h-4 w-4 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
