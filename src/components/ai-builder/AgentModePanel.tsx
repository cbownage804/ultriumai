import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, Wrench, Brain, Code2, Search, ChevronDown, X, FileCode, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentRun, AgentStep, AgentTask } from '@/hooks/useAgentMode';

const STEP_ICONS: Record<AgentStep['type'], typeof Brain> = {
  plan: Brain, execute: Code2, verify: Search, fix: Wrench,
};

function formatElapsed(startMs?: number, endMs?: number): string {
  if (!startMs) return '';
  const elapsed = (endMs || Date.now()) - startMs;
  return elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(1)}s`;
}

function StepDot({ step }: { step: AgentStep }) {
  const Icon = STEP_ICONS[step.type];
  const isActive = step.status === 'running';
  const isDone = step.status === 'done';
  const isError = step.status === 'error';

  return (
    <div className={cn(
      "h-5 w-5 rounded-full flex items-center justify-center transition-all",
      isActive && "bg-cyan-500/20 ring-1 ring-cyan-400/30",
      isDone && "bg-emerald-500/15",
      isError && "bg-red-500/15",
      !isActive && !isDone && !isError && "bg-white/[0.04]",
    )}>
      {isActive ? (
        <Loader2 className="h-2.5 w-2.5 text-cyan-400 animate-spin" />
      ) : isDone ? (
        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400/70" />
      ) : isError ? (
        <XCircle className="h-2.5 w-2.5 text-red-400/70" />
      ) : (
        <Circle className="h-2.5 w-2.5 text-white/10" />
      )}
    </div>
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

export function AgentModePanel({ run, taskQueue, onCancel, onCancelTask, onRetryTask, onClearCompleted }: AgentModePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = run || taskQueue.length > 0;
  if (!hasContent) return null;

  const isRunning = run?.status === 'running' || taskQueue.some(t => t.status === 'running');
  const activeTask = taskQueue.find(t => t.status === 'running');
  const queuedCount = taskQueue.filter(t => t.status === 'queued').length;
  const completedCount = taskQueue.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status)).length;
  const doneSteps = run ? run.steps.filter(s => s.status === 'done').length : 0;
  const totalSteps = run ? run.steps.length : 0;
  const activeStep = run?.steps.find(s => s.status === 'running');

  // Current status label
  const statusLabel = isRunning
    ? activeStep?.label || 'Working…'
    : run?.status === 'completed'
    ? 'Done'
    : run?.status === 'failed'
    ? 'Failed'
    : `${queuedCount} queued`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className="mx-4 mb-2"
    >
      <div className={cn(
        "rounded-lg border transition-colors overflow-hidden",
        isRunning
          ? "border-cyan-500/15 bg-cyan-500/[0.03]"
          : "border-white/[0.06] bg-white/[0.02]",
      )}>
        {/* Compact bar — always visible */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="w-full flex items-center gap-2 px-3 py-2 group"
        >
          {/* Icon */}
          <div className="relative shrink-0">
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            ) : run?.status === 'completed' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60" />
            ) : run?.status === 'failed' ? (
              <AlertTriangle className="h-3.5 w-3.5 text-red-400/60" />
            ) : (
              <Brain className="h-3.5 w-3.5 text-white/25" />
            )}
          </div>

          {/* Step dots — inline progress */}
          {run && run.steps.length > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              {run.steps.map(step => (
                <StepDot key={step.id} step={step} />
              ))}
            </div>
          )}

          {/* Status text */}
          <span className={cn(
            "text-[11px] truncate flex-1 text-left",
            isRunning ? "text-white/60" : "text-white/30"
          )}>
            {activeTask ? activeTask.prompt.slice(0, 50) + (activeTask.prompt.length > 50 ? '…' : '') : statusLabel}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {queuedCount > 0 && (
              <span className="text-[9px] bg-white/[0.06] text-white/35 rounded-full px-1.5 py-0.5 font-mono">
                +{queuedCount}
              </span>
            )}
            {activeTask && activeTask.filesModified.length > 0 && (
              <span className="text-[9px] text-cyan-400/50 bg-cyan-500/[0.06] rounded px-1.5 py-0.5 font-mono flex items-center gap-0.5">
                <FileCode className="h-2 w-2" />{activeTask.filesModified.length}
              </span>
            )}
          </div>

          {/* Stop / expand */}
          {isRunning && onCancel && (
            <button
              onClick={e => { e.stopPropagation(); onCancel(); }}
              className="text-[9px] text-red-400/50 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-red-500/[0.06] shrink-0"
            >
              Stop
            </button>
          )}

          <ChevronDown className={cn(
            "h-3 w-3 text-white/15 transition-transform shrink-0",
            isExpanded && "rotate-180"
          )} />
        </button>

        {/* Progress bar */}
        {isRunning && run && totalSteps > 0 && (
          <div className="px-3 pb-1.5">
            <div className="h-[1.5px] rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500/80 to-cyan-400/80"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.max(5, (doneSteps / totalSteps) * 100)}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Expanded detail drawer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] space-y-2 max-h-48 overflow-y-auto">
                {/* Running task details */}
                {activeTask?.run?.planSummary && (
                  <div className="text-[10px] text-white/30 bg-white/[0.02] rounded-md px-2 py-1.5 leading-relaxed">
                    <span className="text-white/45 font-medium">Plan: </span>{activeTask.run.planSummary}
                  </div>
                )}

                {/* Active step detail */}
                {activeStep && (
                  <div className="flex items-center gap-2 text-[10px] text-cyan-400/60">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    {activeStep.label}
                    <span className="text-white/15 font-mono">{formatElapsed(activeStep.startedAt)}</span>
                  </div>
                )}

                {/* Queue list */}
                {taskQueue.length > 1 && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider">Queue</span>
                    {taskQueue.filter(t => t.id !== activeTask?.id).map(task => (
                      <div key={task.id} className="flex items-center gap-2 py-1 group/task">
                        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", {
                          'bg-white/15': task.status === 'queued',
                          'bg-emerald-400/50': task.status === 'completed',
                          'bg-red-400/50': task.status === 'failed',
                          'bg-white/8': task.status === 'cancelled',
                        })} />
                        <span className="text-[10px] text-white/30 truncate flex-1">
                          {task.prompt.slice(0, 60)}{task.prompt.length > 60 ? '…' : ''}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                          {(task.status === 'failed' || task.status === 'cancelled') && onRetryTask && (
                            <button onClick={() => onRetryTask(task.id)} className="p-0.5 text-white/20 hover:text-cyan-400"><RotateCcw className="h-2.5 w-2.5" /></button>
                          )}
                          {task.status === 'queued' && onCancelTask && (
                            <button onClick={() => onCancelTask(task.id)} className="p-0.5 text-white/20 hover:text-red-400"><X className="h-2.5 w-2.5" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Files changed */}
                {activeTask && activeTask.filesModified.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activeTask.filesModified.map(f => (
                      <span key={f} className="text-[8px] text-cyan-400/40 bg-cyan-500/[0.05] rounded px-1 py-0.5 font-mono">
                        {f.split('/').pop()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Clear */}
                {completedCount > 0 && onClearCompleted && (
                  <button onClick={onClearCompleted} className="text-[9px] text-white/20 hover:text-white/40 transition-colors">
                    Clear finished
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
