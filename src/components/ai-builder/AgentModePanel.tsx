import { useState } from 'react';
import { CheckCircle2, Loader2, XCircle, Wrench, Brain, Code2, Search, ChevronDown, X, RotateCcw, Shield, FileCode, ArrowRight, Undo2, Zap, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentRun, AgentStep, AgentTask, AgentPlan } from '@/hooks/useAgentMode';

const STEP_META: Record<AgentStep['type'], { icon: typeof Brain; label: string }> = {
  plan: { icon: Brain, label: 'Analyzing & planning' },
  execute: { icon: Code2, label: 'Generating code' },
  verify: { icon: Search, label: 'Verifying output' },
  fix: { icon: Wrench, label: 'Fixing issues' },
  research: { icon: Search, label: 'Researching docs' },
  compile: { icon: Code2, label: 'Build verification' },
  tool: { icon: Zap, label: 'Tool call' },
};

function formatElapsed(startMs?: number, endMs?: number): string {
  if (!startMs) return '';
  const elapsed = (endMs || Date.now()) - startMs;
  return elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(1)}s`;
}

function formatTokens(tokens?: number): string {
  if (!tokens) return '';
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${tokens}`;
}

interface PlanApprovalCardProps {
  plan: AgentPlan;
  onApprove: () => void;
  onReject: () => void;
}

function PlanApprovalCard({ plan, onApprove, onReject }: PlanApprovalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="mx-3 mb-3 rounded-lg border border-violet-500/20 bg-violet-500/[0.05] overflow-hidden"
    >
      {/* Plan header */}
      <div className="px-3 py-2 border-b border-violet-500/10 flex items-center gap-2">
        <Shield className="h-3 w-3 text-violet-400" />
        <span className="text-[10px] font-medium text-violet-300/80">Plan Approval Required</span>
      </div>

      {/* Approach */}
      <div className="px-3 py-2 space-y-2">
        <p className="text-[10px] text-white/50 leading-relaxed">{plan.approach}</p>

        {/* Steps */}
        {plan.steps.length > 0 && (
          <div className="space-y-1">
            <span className="text-[8px] text-white/25 uppercase tracking-wider">Steps</span>
            {plan.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <ArrowRight className="h-2.5 w-2.5 text-violet-400/40 mt-0.5 shrink-0" />
                <span className="text-[10px] text-white/40">{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Files */}
        {(plan.filesToCreate.length > 0 || plan.filesToModify.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {plan.filesToCreate.map(f => (
              <span key={f} className="text-[8px] text-emerald-400/50 bg-emerald-500/[0.08] rounded px-1.5 py-0.5 font-mono">
                + {f.split('/').pop()}
              </span>
            ))}
            {plan.filesToModify.map(f => (
              <span key={f} className="text-[8px] text-cyan-400/50 bg-cyan-500/[0.08] rounded px-1.5 py-0.5 font-mono">
                ~ {f.split('/').pop()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-t border-violet-500/10 flex items-center gap-2 justify-end">
        <button
          onClick={onReject}
          className="text-[10px] text-white/30 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/[0.08] transition-colors"
        >
          Reject
        </button>
        <button
          onClick={onApprove}
          className="text-[10px] text-white font-medium bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 px-3 py-1 rounded transition-colors"
        >
          Approve & Build
        </button>
      </div>

      {/* Auto-approve timer */}
      <div className="px-3 pb-1.5">
        <div className="h-[1px] bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-violet-500/30"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 30, ease: 'linear' }}
          />
        </div>
        <span className="text-[8px] text-white/15 mt-0.5 block">Auto-approves in 30s</span>
      </div>
    </motion.div>
  );
}

interface AgentModePanelProps {
  run: AgentRun | null;
  taskQueue: AgentTask[];
  pendingApproval?: { taskId: string; plan: AgentPlan } | null;
  onCancel?: () => void;
  onCancelTask?: (taskId: string) => void;
  onRetryTask?: (taskId: string) => void;
  onClearCompleted?: () => void;
  onReorderQueue?: (newOrder: AgentTask[]) => void;
  onApprovePlan?: () => void;
  onRejectPlan?: () => void;
  onRollbackToStep?: (stepId: string) => void;
  streamingContent?: string;
}

export function AgentModePanel({ run, taskQueue, pendingApproval, onCancel, onCancelTask, onRetryTask, onClearCompleted, onApprovePlan, onRejectPlan, onRollbackToStep, streamingContent }: AgentModePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveContent = run || taskQueue.some(t => ['queued', 'running', 'awaiting_approval'].includes(t.status));
  if (!hasActiveContent) return null;

  const isRunning = run?.status === 'running' || taskQueue.some(t => t.status === 'running');
  const isAwaitingApproval = run?.status === 'awaiting_approval' || !!pendingApproval;
  const activeTask = taskQueue.find(t => t.status === 'running' || t.status === 'awaiting_approval');
  const queuedTasks = taskQueue.filter(t => t.status === 'queued');
  const finishedTasks = taskQueue.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status));
  const activeStep = run?.steps.find(s => s.status === 'running');
  const completedSteps = run?.steps.filter(s => s.status === 'done') || [];
  const allDone = run?.status === 'completed' && !isRunning;

  const activeLabel = isAwaitingApproval
    ? 'Awaiting approval…'
    : activeStep
      ? STEP_META[activeStep.type].label
      : 'Working…';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      className="flex gap-3 justify-start"
    >
      {/* Avatar column */}
      <div className="h-8 w-8 mt-0.5 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
        {isAwaitingApproval ? (
          <Shield className="h-4 w-4 text-violet-400 animate-pulse" />
        ) : isRunning ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Brain className="h-4 w-4 text-violet-400" />
          </motion.div>
        ) : allDone ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400/70" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400/60" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn(
        "rounded-lg overflow-hidden transition-colors min-w-[200px] max-w-[340px]",
        "bg-muted/50 border border-white/[0.06]",
        isAwaitingApproval && "border-violet-500/20",
      )}>
        {/* Compact header */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-left group"
        >
          <div className="relative shrink-0">
            {isAwaitingApproval ? (
              <Shield className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
            ) : isRunning ? (
              <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            ) : allDone ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-red-400/50" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-[11px] font-medium truncate",
                isAwaitingApproval ? "text-violet-300/80" : isRunning ? "text-white/70" : allDone ? "text-white/40" : "text-red-300/60"
              )}>
                {isAwaitingApproval ? 'Awaiting approval' : isRunning ? activeLabel : allDone ? 'Task complete' : 'Task failed'}
              </span>
              {activeStep && (
                <span className="text-[9px] text-white/20 font-mono tabular-nums shrink-0">
                  {formatElapsed(activeStep.startedAt)}
                </span>
              )}
            </div>

            {run && run.steps.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {run.steps.map((step) => {
                  const isActive = step.status === 'running';
                  const isDone = step.status === 'done';
                  const isError = step.status === 'error';
                  return (
                    <div key={step.id} className="flex items-center gap-1">
                      <div className={cn(
                        "h-1.5 rounded-full transition-all",
                        isActive ? "w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]" : "w-1.5",
                        isDone && "bg-emerald-400/60",
                        isError && "bg-red-400/60",
                        !isActive && !isDone && !isError && "bg-white/10",
                      )} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {queuedTasks.length > 0 && (
              <span className="text-[8px] bg-white/[0.06] text-white/30 rounded-full px-1.5 py-0.5 font-mono">
                +{queuedTasks.length}
              </span>
            )}
            {(isRunning || isAwaitingApproval) && onCancel && (
              <button
                onClick={e => { e.stopPropagation(); onCancel(); }}
                className="text-[9px] text-red-400/40 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-red-500/[0.08] transition-colors"
              >
                Stop
              </button>
            )}
            <ChevronDown className={cn(
              "h-3 w-3 text-white/15 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </div>
        </button>

        {/* Plan approval card */}
        <AnimatePresence>
          {isAwaitingApproval && pendingApproval && onApprovePlan && onRejectPlan && (
            <PlanApprovalCard
              plan={pendingApproval.plan}
              onApprove={onApprovePlan}
              onReject={onRejectPlan}
            />
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {isRunning && run && run.steps.length > 0 && (
          <div className="px-3 pb-1.5">
            <div className="h-[1px] rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500/70 to-cyan-400/70"
                animate={{ width: `${Math.max(5, (completedSteps.length / run.steps.length) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Expandable details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1.5 border-t border-white/[0.04] space-y-2 max-h-56 overflow-y-auto">
                {/* Step list */}
                {run && run.steps.length > 0 && (
                  <div className="space-y-0.5">
                    {run.steps.map(step => {
                      const meta = STEP_META[step.type];
                      const Icon = meta.icon;
                      const isActive = step.status === 'running';
                      const isDone = step.status === 'done';
                      const isError = step.status === 'error';
                      const hasSnapshot = !!step.preSnapshot;
                      const isParallel = !!step.parallel;
                      return (
                        <div key={step.id} className={cn(
                          "flex items-center gap-2 py-1 px-1.5 rounded-md group/step",
                          isActive && "bg-cyan-500/[0.05]",
                          isParallel && "ml-3 border-l-2 border-violet-500/20 pl-2",
                        )}>
                          {isActive ? (
                            <Loader2 className="h-3 w-3 text-cyan-400 animate-spin shrink-0" />
                          ) : isDone ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400/60 shrink-0" />
                          ) : isError ? (
                            <XCircle className="h-3 w-3 text-red-400/60 shrink-0" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-white/10 shrink-0" />
                          )}
                          <Icon className={cn("h-3 w-3 shrink-0", isActive ? "text-cyan-400/60" : "text-white/15")} />
                          <span className={cn(
                            "text-[10px] flex-1",
                            isActive ? "text-white/60" : isDone ? "text-white/30" : "text-white/15"
                          )}>
                            {step.label || meta.label}
                          </span>
                          {/* Token count */}
                          {step.tokensUsed && step.tokensUsed > 0 && (
                            <span className="text-[7px] text-white/15 font-mono flex items-center gap-0.5">
                              <Coins className="h-2 w-2" />{formatTokens(step.tokensUsed)}
                            </span>
                          )}
                          {/* Rollback button */}
                          {hasSnapshot && (isDone || isError) && onRollbackToStep && (
                            <button
                              onClick={() => onRollbackToStep(step.id)}
                              className="opacity-0 group-hover/step:opacity-100 p-0.5 text-white/15 hover:text-amber-400 transition-all"
                              title="Revert to this step"
                            >
                              <Undo2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {(isDone || isActive) && (
                            <span className="text-[8px] text-white/15 font-mono tabular-nums">
                              {formatElapsed(step.startedAt, step.completedAt)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Streaming preview for active step */}
                {isRunning && activeStep && streamingContent && (
                  <div className="rounded bg-white/[0.02] border border-white/[0.04] p-1.5 max-h-20 overflow-hidden">
                    <span className="text-[8px] text-white/20 uppercase tracking-wider block mb-1">Live output</span>
                    <pre className="text-[8px] text-white/25 font-mono whitespace-pre-wrap leading-relaxed overflow-hidden">
                      {streamingContent.slice(-300)}
                    </pre>
                  </div>
                )}

                {/* Total token summary */}
                {allDone && run && (() => {
                  const totalTokens = run.steps.reduce((sum, s) => sum + (s.tokensUsed || 0), 0);
                  if (totalTokens === 0) return null;
                  return (
                    <div className="flex items-center gap-1.5 text-[8px] text-white/20 bg-white/[0.02] rounded px-2 py-1">
                      <Coins className="h-2.5 w-2.5" />
                      <span>Total: {formatTokens(totalTokens)} tokens</span>
                    </div>
                  );
                })()}

                {/* Plan summary */}
                {activeTask?.run?.planSummary && (
                  <div className="text-[10px] text-white/25 bg-white/[0.02] rounded px-2 py-1.5 leading-relaxed">
                    {activeTask.run.planSummary}
                  </div>
                )}

                {/* Files changed */}
                {activeTask && activeTask.filesModified.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[8px] text-white/20 uppercase tracking-wider w-full mb-0.5">Files changed</span>
                    {activeTask.filesModified.map(f => (
                      <span key={f} className="text-[8px] text-cyan-400/40 bg-cyan-500/[0.05] rounded px-1 py-0.5 font-mono">
                        {f.split('/').pop()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Queued tasks */}
                {queuedTasks.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[8px] text-white/20 uppercase tracking-wider">Queued</span>
                    {queuedTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 group/q">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/10 shrink-0" />
                        <span className="text-[10px] text-white/25 truncate flex-1">{task.prompt.slice(0, 60)}</span>
                        {onCancelTask && (
                          <button
                            onClick={() => onCancelTask(task.id)}
                            className="opacity-0 group-hover/q:opacity-100 p-0.5 text-white/15 hover:text-red-400 transition-all"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Finished tasks */}
                {finishedTasks.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {finishedTasks.map(t => (
                        <div key={t.id} className="flex items-center gap-1 group/f">
                          <div className={cn("h-1.5 w-1.5 rounded-full", {
                            'bg-emerald-400/50': t.status === 'completed',
                            'bg-red-400/50': t.status === 'failed',
                            'bg-white/10': t.status === 'cancelled',
                          })} />
                          {(t.status === 'failed' || t.status === 'cancelled') && onRetryTask && (
                            <button
                              onClick={() => onRetryTask(t.id)}
                              className="opacity-0 group-hover/f:opacity-100 text-white/15 hover:text-cyan-400 transition-all"
                            >
                              <RotateCcw className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {onClearCompleted && (
                      <button onClick={onClearCompleted} className="text-[8px] text-white/15 hover:text-white/30 transition-colors">
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
