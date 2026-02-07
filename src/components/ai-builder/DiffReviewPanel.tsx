import { useState } from 'react';
import { X, Check, XCircle, ChevronDown, ChevronRight, FileCode, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface FileChange {
  path: string;
  oldContent: string;
  newContent: string;
  isNew: boolean;
}

interface DiffReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  changes: FileChange[];
  onApprove: () => void;
  onReject: () => void;
  onApproveFile: (path: string) => void;
  onRejectFile: (path: string) => void;
}

function computeDiff(oldText: string, newText: string): { type: 'same' | 'added' | 'removed'; text: string }[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: { type: 'same' | 'added' | 'removed'; text: string }[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  let oi = 0, ni = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      result.push({ type: 'same', text: oldLines[oi] });
      oi++; ni++;
    } else if (ni < newLines.length && (oi >= oldLines.length || !oldLines.includes(newLines[ni]))) {
      result.push({ type: 'added', text: newLines[ni] });
      ni++;
    } else if (oi < oldLines.length) {
      result.push({ type: 'removed', text: oldLines[oi] });
      oi++;
    }
    if (result.length > 500) break; // safety cap
  }

  return result;
}

function FileDiff({ change }: { change: FileChange }) {
  const [expanded, setExpanded] = useState(true);
  const diff = computeDiff(change.oldContent, change.newContent);
  const added = diff.filter(d => d.type === 'added').length;
  const removed = diff.filter(d => d.type === 'removed').length;

  return (
    <div className="border border-white/[0.06] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
      >
        {expanded ? <ChevronDown className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />}
        <FileCode className="h-3 w-3 text-cyan-400/60 shrink-0" />
        <span className="text-[11px] font-mono text-white/70 truncate flex-1">{change.path}</span>
        {change.isNew && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">NEW</span>
        )}
        <span className="text-[9px] text-emerald-400 font-mono">+{added}</span>
        <span className="text-[9px] text-red-400 font-mono">-{removed}</span>
      </button>

      {expanded && (
        <div className="max-h-64 overflow-auto font-mono text-[11px] leading-5">
          {diff.map((line, i) => (
            <div
              key={i}
              className={cn(
                "px-3 flex gap-2",
                line.type === 'added' && "bg-emerald-500/[0.06] text-emerald-300/80",
                line.type === 'removed' && "bg-red-500/[0.06] text-red-300/80",
                line.type === 'same' && "text-white/30"
              )}
            >
              <span className="w-4 text-right text-white/10 select-none shrink-0">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <span className="whitespace-pre">{line.text || ' '}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DiffReviewPanel({ isOpen, onClose, changes, onApprove, onReject, onApproveFile, onRejectFile }: DiffReviewPanelProps) {
  if (!isOpen || changes.length === 0) return null;

  const totalAdded = changes.reduce((sum, c) => {
    const diff = computeDiff(c.oldContent, c.newContent);
    return sum + diff.filter(d => d.type === 'added').length;
  }, 0);
  const totalRemoved = changes.reduce((sum, c) => {
    const diff = computeDiff(c.oldContent, c.newContent);
    return sum + diff.filter(d => d.type === 'removed').length;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0d0d18] border border-white/[0.08] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-white/[0.06]">
              <GitBranch className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Review Changes</h2>
              <p className="text-[10px] text-white/30">
                {changes.length} file{changes.length !== 1 ? 's' : ''} changed · 
                <span className="text-emerald-400 ml-1">+{totalAdded}</span>
                <span className="text-red-400 ml-1">-{totalRemoved}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Diff list */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {changes.map(change => (
            <FileDiff key={change.path} change={change} />
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex justify-between items-center">
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject All
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
          >
            <Check className="h-3.5 w-3.5" />
            Approve All ({changes.length} files)
          </button>
        </div>
      </div>
    </div>
  );
}
