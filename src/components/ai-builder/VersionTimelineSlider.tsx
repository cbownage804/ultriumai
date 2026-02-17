import { cn } from '@/lib/utils';
import { GitBranch, Clock, ChevronLeft, ChevronRight, X, FileCode, FilePlus, FileMinus, FileEdit } from 'lucide-react';
import type { TimelineSnapshot } from '@/hooks/useVersionTimeline';

interface VersionTimelineSliderProps {
  snapshots: TimelineSnapshot[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onExit: () => void;
  getDiff: (index: number) => { added: string[]; removed: string[]; modified: string[] };
  onToggleDiff?: () => void;
  showDiff?: boolean;
}

export function VersionTimelineSlider({ snapshots, currentIndex, onNavigate, onExit, getDiff, onToggleDiff, showDiff }: VersionTimelineSliderProps) {
  if (snapshots.length === 0) return null;

  const current = snapshots[currentIndex] || snapshots[snapshots.length - 1];
  const diff = currentIndex > 0 ? getDiff(currentIndex) : { added: [], removed: [], modified: [] };
  const hasChanges = diff.added.length + diff.removed.length + diff.modified.length > 0;

  return (
    <div className="border-t border-white/[0.06] bg-[#0d0d14] px-3 py-2 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-cyan-400/60" />
          <span className="text-[11px] font-medium text-white/60">Version Timeline</span>
          <span className="text-[9px] text-white/20 font-mono">{currentIndex + 1} / {snapshots.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {onToggleDiff && currentIndex > 0 && (
            <button
              onClick={onToggleDiff}
              className={cn("h-5 px-1.5 rounded text-[9px] font-medium flex items-center gap-1 transition-colors",
                showDiff ? "bg-cyan-500/15 text-cyan-400" : "text-white/30 hover:text-white/50 hover:bg-white/5"
              )}
            >
              <FileCode className="h-2.5 w-2.5" />
              Diff
            </button>
          )}
          <button onClick={onExit} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      {/* Slider */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
          disabled={currentIndex <= 0}
          className={cn("h-6 w-6 rounded flex items-center justify-center transition-colors", currentIndex > 0 ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/10")}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="range"
            min={0}
            max={Math.max(0, snapshots.length - 1)}
            value={currentIndex}
            onChange={(e) => onNavigate(parseInt(e.target.value))}
            className="w-full h-1 appearance-none bg-white/[0.06] rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.4)]"
          />
          {/* Dot markers */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between pointer-events-none px-1">
            {snapshots.length <= 20 && snapshots.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === currentIndex ? "bg-cyan-400" : i < currentIndex ? "bg-cyan-400/30" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => onNavigate(Math.min(snapshots.length - 1, currentIndex + 1))}
          disabled={currentIndex >= snapshots.length - 1}
          className={cn("h-6 w-6 rounded flex items-center justify-center transition-colors", currentIndex < snapshots.length - 1 ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/10")}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Current snapshot info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "h-4 px-1.5 rounded text-[8px] font-medium flex items-center gap-1",
            current?.type === 'ai-generation' ? "bg-cyan-500/10 text-cyan-400" :
            current?.type === 'manual' ? "bg-violet-500/10 text-violet-400" :
            current?.type === 'revert' ? "bg-amber-500/10 text-amber-400" :
            "bg-white/[0.04] text-white/30"
          )}>
            <GitBranch className="h-2 w-2" />
            {current?.type || 'auto'}
          </div>
          <span className="text-[10px] text-white/50 truncate">{current?.label || 'Unknown'}</span>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 text-[9px] shrink-0">
            {diff.added.length > 0 && (
              <span className="flex items-center gap-0.5 text-emerald-400/60">
                <FilePlus className="h-2.5 w-2.5" />+{diff.added.length}
              </span>
            )}
            {diff.modified.length > 0 && (
              <span className="flex items-center gap-0.5 text-amber-400/60">
                <FileEdit className="h-2.5 w-2.5" />~{diff.modified.length}
              </span>
            )}
            {diff.removed.length > 0 && (
              <span className="flex items-center gap-0.5 text-red-400/60">
                <FileMinus className="h-2.5 w-2.5" />-{diff.removed.length}
              </span>
            )}
          </div>
        )}

        <span className="text-[9px] text-white/15 font-mono shrink-0 ml-2">
          {current?.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
