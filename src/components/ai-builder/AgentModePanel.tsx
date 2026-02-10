import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, Wrench, Brain, Code2, Search, ChevronDown, ChevronRight, Clock, RotateCcw, X, ListTodo, FileCode, GripVertical, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import type { AgentRun, AgentStep, AgentTask } from '@/hooks/useAgentMode';

const STEP_ICONS: Record<AgentStep['type'], typeof Brain> = {
  plan: Brain,
  execute: Code2,
  verify: Search,
  fix: Wrench,
};

const STEP_LABELS: Record<AgentStep['type'], string> = {
  plan: 'Planning',
  execute: 'Building',
  verify: 'Verifying',
  fix: 'Fixing',
};

function formatElapsed(startMs?: number, endMs?: number): string {
  if (!startMs) return '';
  const elapsed = (endMs || Date.now()) - startMs;
  if (elapsed < 1000) return `${elapsed}ms`;
  return `${(elapsed / 1000).toFixed(1)}s`;
}

function StatusDot({ status }: { status: AgentTask['status'] }) {
  return (
    <div className={cn("h-2 w-2 rounded-full shrink-0 transition-colors", {
      'bg-white/20': status === 'queued',
      'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]': status === 'running',
      'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.3)]': status === 'completed',
      'bg-red-400': status === 'failed',
      'bg-white/10': status === 'cancelled',
    })} />
  );
}

function StepRow({ step }: { step: AgentStep }) {
  const Icon = STEP_ICONS[step.type];
  const elapsed = formatElapsed(step.startedAt, step.completedAt);
  const isActive = step.status === 'running';
  const isDone = step.status === 'done';
  const isError = step.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all",
        isActive && "bg-cyan-500/[0.06]",
      )}
    >
      <div className={cn(
        "h-5 w-5 rounded-md flex items-center justify-center shrink-0",
        isActive && "bg-cyan-500/15",
        isDone && "bg-emerald-500/10",
        isError && "bg-red-500/10",
        !isActive && !isDone && !isError && "bg-white/[0.04]",
      )}>
        {isActive ? (
          <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
        ) : isDone ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        ) : isError ? (
          <XCircle className="h-3 w-3 text-red-400" />
        ) : (
          <Circle className="h-3 w-3 text-white/15" />
        )}
      </div>

      <Icon className={cn("h-3 w-3 shrink-0", isActive ? "text-cyan-400" : isDone ? "text-white/30" : "text-white/15")} />

      <span className={cn(
        "text-[11px] flex-1 truncate",
        isActive ? "text-white/80 font-medium" : isDone ? "text-white/40" : "text-white/20"
      )}>
        {step.label}
      </span>

      {elapsed && (
        <span className="text-[9px] text-white/20 font-mono tabular-nums">{elapsed}</span>
      )}
    </motion.div>
  );
}

function TaskCard({
  task,
  isExpanded,
  onToggle,
  onCancel,
  onRetry,
}: {
  task: AgentTask;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}) {
  const isActive = task.status === 'running';
  const isDone = task.status === 'completed';
  const isFailed = task.status === 'failed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      className={cn(
        "rounded-lg border transition-all",
        isActive
          ? "border-cyan-500/20 bg-cyan-500/[0.04]"
          : isDone
          ? "border-emerald-500/10 bg-white/[0.01]"
          : isFailed
          ? "border-red-500/15 bg-red-500/[0.03]"
          : "border-white/[0.06] bg-white/[0.02]",
      )}
    >
      {/* Task header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left group"
      >
        {task.status === 'queued' && (
          <GripVertical className="h-3 w-3 text-white/15 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0" />
        )}

        <StatusDot status={task.status} />

        <span className={cn(
          "text-[11px] flex-1 truncate",
          isActive ? "text-white/80 font-medium" : isDone ? "text-white/50" : isFailed ? "text-red-300/70" : "text-white/35"
        )}>
          {task.prompt.slice(0, 80)}{task.prompt.length > 80 ? '…' : ''}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {task.errorCount > 0 && (
            <span className="text-[8px] text-amber-400/70 bg-amber-500/10 rounded px-1.5 py-0.5 font-mono">
              {task.errorCount} fix{task.errorCount > 1 ? 'es' : ''}
            </span>
          )}
          {task.filesModified.length > 0 && (
            <span className="text-[8px] text-cyan-400/60 bg-cyan-500/10 rounded px-1.5 py-0.5 font-mono flex items-center gap-0.5">
              <FileCode className="h-2 w-2" />
              {task.filesModified.length}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {(isFailed || task.status === 'cancelled') && onRetry && (
            <button
              onClick={e => { e.stopPropagation(); onRetry(); }}
              className="h-5 w-5 rounded-md flex items-center justify-center text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              title="Retry"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
          {(task.status === 'queued' || isActive) && onCancel && (
            <button
              onClick={e => { e.stopPropagation(); onCancel(); }}
              className="h-5 w-5 rounded-md flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Cancel"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <ChevronDown className={cn(
          "h-3 w-3 text-white/20 transition-transform shrink-0",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04] pt-2">
              {/* Plan summary */}
              {task.run?.planSummary && (
                <div className="text-[10px] text-white/30 bg-white/[0.02] rounded-md px-2.5 py-2 leading-relaxed">
                  <span className="text-white/50 font-medium">Plan:</span> {task.run.planSummary}
                </div>
              )}

              {/* Steps */}
              {task.run && task.run.steps.length > 0 && (
                <div className="space-y-0.5">
                  {task.run.steps.map(step => (
                    <StepRow key={step.id} step={step} />
                  ))}
                </div>
              )}

              {/* Files modified */}
              {task.filesModified.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] text-white/25 uppercase tracking-wider font-medium">Files changed</span>
                  <div className="flex flex-wrap gap-1">
                    {task.filesModified.map(f => (
                      <span key={f} className="text-[9px] text-cyan-400/50 bg-cyan-500/[0.06] rounded px-1.5 py-0.5 font-mono">
                        {f.split('/').pop()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error details */}
              {isFailed && task.run?.steps.some(s => s.status === 'error') && (
                <div className="flex items-start gap-1.5 text-[10px] text-red-400/60 bg-red-500/[0.05] rounded-md px-2.5 py-2">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>{task.run.steps.find(s => s.status === 'error')?.detail || 'Task failed'}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface AgentModePanelProps {
  run: AgentRun | null;
  taskQueue: AgentTask[];
  onCancel?: () => void;
  onCancelTask?: (taskId: string) => void;
  onRetryTask?: (taskId: string) => void;
  onClearCompleted?: () => void;
  onReorderQueue?: (newOrder: AgentTask[]) => void;
}

export function AgentModePanel({ run, taskQueue, onCancel, onCancelTask, onRetryTask, onClearCompleted, onReorderQueue }: AgentModePanelProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Auto-expand the running task
  useEffect(() => {
    const running = taskQueue.find(t => t.status === 'running');
    if (running) setExpandedTaskId(running.id);
  }, [taskQueue]);

  const hasContent = run || taskQueue.length > 0;
  if (!hasContent) return null;

  const queuedCount = taskQueue.filter(t => t.status === 'queued').length;
  const completedCount = taskQueue.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status)).length;
  const isRunning = run?.status === 'running' || taskQueue.some(t => t.status === 'running');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="mx-4 mb-3"
    >
      <div className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Brain className={cn("h-3.5 w-3.5", isRunning ? "text-violet-400" : "text-white/25")} />
              {isRunning && (
                <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              )}
            </div>
            <span className="text-[11px] font-medium text-white/50">Agent</span>
            {queuedCount > 0 && (
              <span className="text-[9px] bg-white/[0.06] text-white/40 rounded-full px-2 py-0.5 font-mono">
                {queuedCount} pending
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {completedCount > 0 && onClearCompleted && (
              <button
                onClick={onClearCompleted}
                className="text-[10px] text-white/25 hover:text-white/50 transition-colors px-2 py-0.5 rounded-md hover:bg-white/[0.04]"
              >
                Clear
              </button>
            )}
            {isRunning && onCancel && (
              <button onClick={onCancel} className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors px-2 py-0.5 rounded-md hover:bg-red-500/[0.06]">
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Current run progress bar */}
        {isRunning && run && (
          <div className="px-4 pb-1">
            <div className="h-[2px] rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                initial={{ width: '0%' }}
                animate={{
                  width: `${Math.max(10, (run.steps.filter(s => s.status === 'done').length / run.steps.length) * 100)}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Task list */}
        {taskQueue.length > 0 && (
          <div className="px-3 pb-3 pt-1 space-y-1.5">
            <AnimatePresence mode="popLayout">
              {taskQueue.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isExpanded={expandedTaskId === task.id}
                  onToggle={() => setExpandedTaskId(prev => prev === task.id ? null : task.id)}
                  onCancel={onCancelTask ? () => onCancelTask(task.id) : undefined}
                  onRetry={onRetryTask ? () => onRetryTask(task.id) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty / completed state */}
        {!isRunning && taskQueue.length === 0 && run?.status === 'completed' && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-emerald-400/50" />
            <span className="text-[10px] text-emerald-400/40">All tasks completed</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
