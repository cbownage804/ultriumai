/**
 * Phase 113: Split Diff Editor Panel
 */
import { X, GitCompare, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileDiff, DiffLine } from '@/hooks/useSplitDiffEditor';

interface SplitDiffPanelProps {
  open: boolean;
  onClose: () => void;
  diff: FileDiff | null;
  onSelectFile?: (path: string) => void;
}

export function SplitDiffPanel({ open, onClose, diff }: SplitDiffPanelProps) {
  if (!open || !diff) return null;

  return (
    <div className="fixed inset-4 bg-[#0d0d14] border border-white/[0.08] rounded-2xl z-50 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <GitCompare className="h-4 w-4 text-violet-400/60" />
          <span className="text-sm font-medium text-white/80">{diff.filePath}</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-emerald-400/70 flex items-center gap-0.5"><Plus className="h-3 w-3" />{diff.addedCount}</span>
            <span className="text-red-400/70 flex items-center gap-0.5"><Minus className="h-3 w-3" />{diff.removedCount}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left (before) */}
        <div className="flex-1 overflow-auto border-r border-white/[0.06]">
          <div className="px-3 py-1.5 text-[10px] text-white/25 bg-white/[0.02] border-b border-white/[0.04] sticky top-0">
            {diff.leftLabel}
          </div>
          <div className="font-mono text-[11px] leading-5">
            {diff.diffLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'flex px-2',
                  line.type === 'removed' && 'bg-red-500/10 text-red-300/80',
                  line.type === 'added' && 'invisible h-5',
                  line.type === 'unchanged' && 'text-white/40',
                )}
              >
                <span className="w-10 shrink-0 text-right pr-2 text-white/15 select-none">
                  {line.leftLineNum || ''}
                </span>
                <span className="w-5 shrink-0 text-center select-none">
                  {line.type === 'removed' ? '−' : ''}
                </span>
                <span className="flex-1 whitespace-pre">{line.type !== 'added' ? line.content : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right (after) */}
        <div className="flex-1 overflow-auto">
          <div className="px-3 py-1.5 text-[10px] text-white/25 bg-white/[0.02] border-b border-white/[0.04] sticky top-0">
            {diff.rightLabel}
          </div>
          <div className="font-mono text-[11px] leading-5">
            {diff.diffLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'flex px-2',
                  line.type === 'added' && 'bg-emerald-500/10 text-emerald-300/80',
                  line.type === 'removed' && 'invisible h-5',
                  line.type === 'unchanged' && 'text-white/40',
                )}
              >
                <span className="w-10 shrink-0 text-right pr-2 text-white/15 select-none">
                  {line.rightLineNum || ''}
                </span>
                <span className="w-5 shrink-0 text-center select-none">
                  {line.type === 'added' ? '+' : ''}
                </span>
                <span className="flex-1 whitespace-pre">{line.type !== 'removed' ? line.content : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
