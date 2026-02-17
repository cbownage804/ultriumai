import React, { useState } from 'react';
import { CheckCircle, Circle, Play, SkipForward, X, Layers, ChevronRight, GripVertical, Pencil, Trash2, Zap, RotateCw, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { PhasePlan } from './usePromptPhasePlanner';

interface PhasePlannerPanelProps {
  plan: PhasePlan;
  onProceed: () => void;
  onSkip: () => void;
  onCancel: () => void;
  isGenerating: boolean;
  onToggleAutoAdvance?: () => void;
  onEditTitle?: (phaseId: string, title: string) => void;
  onRemovePhase?: (phaseId: string) => void;
  onReorder?: (from: number, to: number) => void;
  totalEstimatedCredits?: number;
}

export function PhasePlannerPanel({
  plan,
  onProceed,
  onSkip,
  onCancel,
  isGenerating,
  onToggleAutoAdvance,
  onEditTitle,
  onRemovePhase,
  onReorder,
  totalEstimatedCredits = 0,
}: PhasePlannerPanelProps) {
  const currentPhase = plan.phases[plan.currentPhaseIndex];
  const isComplete = plan.currentPhaseIndex >= plan.phases.length;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const commitEdit = () => {
    if (editingId && onEditTitle && editValue.trim()) {
      onEditTitle(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const creditsUsed = plan.phases
    .filter(p => p.status === 'done')
    .reduce((sum, p) => sum + p.estimatedCredits, 0);
  const creditsRemaining = totalEstimatedCredits - creditsUsed;

  return (
    <div className="mx-3 my-2 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Phase Planner</span>
          <span className="text-xs text-muted-foreground">
            {Math.min(plan.currentPhaseIndex + 1, plan.phases.length)} of {plan.phases.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Credit estimate badge */}
          {totalEstimatedCredits > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Coins className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] font-mono text-amber-400">
                ~{creditsRemaining} credits left
              </span>
            </div>
          )}
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Phase List */}
      <div className="px-4 py-3 space-y-1.5">
        {plan.phases.map((phase, idx) => {
          const isCurrent = idx === plan.currentPhaseIndex;
          const isDone = phase.status === 'done';
          const isSkipped = phase.status === 'skipped';
          const isPending = phase.status === 'pending';
          const isEditing = editingId === phase.id;

          return (
            <div
              key={phase.id}
              draggable={isPending && !!onReorder}
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== idx && onReorder) {
                  onReorder(dragIdx, idx);
                }
                setDragIdx(null);
              }}
              className={`group flex items-start gap-2 py-2 px-3 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-primary/10 border border-primary/20'
                  : isDone
                  ? 'opacity-60'
                  : isSkipped
                  ? 'opacity-30'
                  : 'opacity-50 hover:opacity-70'
              }`}
            >
              {/* Drag handle */}
              {isPending && onReorder && (
                <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : isCurrent ? (
                  <ChevronRight className="h-4 w-4 text-primary animate-pulse" />
                ) : isSkipped ? (
                  <SkipForward className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    className="h-6 text-xs py-0 px-1"
                    autoFocus
                  />
                ) : (
                  <p className={`text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {phase.title}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground truncate flex-1">{phase.description}</p>
                  <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0 flex items-center gap-0.5">
                    <Zap className="h-2.5 w-2.5" />~{phase.estimatedCredits}
                  </span>
                </div>
              </div>

              {/* Edit/remove actions (only for pending phases) */}
              {isPending && !isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {onEditTitle && (
                    <button
                      onClick={() => startEdit(phase.id, phase.title)}
                      className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                  {onRemovePhase && plan.phases.length > 2 && (
                    <button
                      onClick={() => onRemovePhase(phase.id)}
                      className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      {!isComplete && currentPhase && (
        <div className="px-4 py-3 border-t border-primary/10 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onProceed}
              disabled={isGenerating}
              className="flex-1 gap-2"
            >
              {isGenerating ? (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {plan.currentPhaseIndex === 0 ? 'Start Phase 1' : `Proceed to Phase ${plan.currentPhaseIndex + 1}`}
              <span className="text-[10px] opacity-60 ml-1">~{currentPhase.estimatedCredits} credits</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onSkip}
              disabled={isGenerating}
              title="Skip this phase"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Auto-advance toggle */}
          {onToggleAutoAdvance && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Auto-continue through phases</span>
              <Switch
                checked={plan.autoAdvance}
                onCheckedChange={onToggleAutoAdvance}
                className="scale-75"
              />
            </div>
          )}
        </div>
      )}

      {isComplete && (
        <div className="px-4 py-3 border-t border-primary/10 text-center">
          <p className="text-sm text-green-500 font-medium">✅ All phases complete!</p>
          <p className="text-[10px] text-muted-foreground mt-1">~{creditsUsed} credits used</p>
          <Button size="sm" variant="ghost" onClick={onCancel} className="mt-2 text-xs">
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
