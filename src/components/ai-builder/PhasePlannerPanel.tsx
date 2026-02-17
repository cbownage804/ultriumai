import React from 'react';
import { CheckCircle, Circle, Play, SkipForward, X, Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PhasePlan } from './usePromptPhasePlanner';

interface PhasePlannerPanelProps {
  plan: PhasePlan;
  onProceed: () => void;
  onSkip: () => void;
  onCancel: () => void;
  isGenerating: boolean;
}

export function PhasePlannerPanel({ plan, onProceed, onSkip, onCancel, isGenerating }: PhasePlannerPanelProps) {
  const currentPhase = plan.phases[plan.currentPhaseIndex];
  const isComplete = plan.currentPhaseIndex >= plan.phases.length;

  return (
    <div className="mx-3 my-2 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Phase Planner</span>
          <span className="text-xs text-muted-foreground">
            {plan.currentPhaseIndex + 1} of {plan.phases.length}
          </span>
        </div>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Phase List */}
      <div className="px-4 py-3 space-y-2">
        {plan.phases.map((phase, idx) => {
          const isCurrent = idx === plan.currentPhaseIndex;
          const isDone = phase.status === 'done';
          const isSkipped = phase.status === 'skipped';

          return (
            <div
              key={phase.id}
              className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-primary/10 border border-primary/20'
                  : isDone
                  ? 'opacity-60'
                  : 'opacity-40'
              }`}
            >
              <div className="mt-0.5">
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
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {phase.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{phase.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      {!isComplete && currentPhase && (
        <div className="px-4 py-3 border-t border-primary/10 flex items-center gap-2">
          <Button
            size="sm"
            onClick={onProceed}
            disabled={isGenerating}
            className="flex-1 gap-2"
          >
            <Play className="h-3.5 w-3.5" />
            {plan.currentPhaseIndex === 0 ? 'Start Phase 1' : `Proceed to Phase ${plan.currentPhaseIndex + 1}`}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onSkip}
            disabled={isGenerating}
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {isComplete && (
        <div className="px-4 py-3 border-t border-primary/10 text-center">
          <p className="text-sm text-green-500 font-medium">✅ All phases complete!</p>
          <Button size="sm" variant="ghost" onClick={onCancel} className="mt-2 text-xs">
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
