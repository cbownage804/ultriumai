import { useState } from 'react';
import { Undo2, Redo2, Clock, FileCode, Plus, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { UndoEntry } from '@/hooks/useUndoRedo';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface UndoPreviewPopoverProps {
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
  canUndo: boolean;
  canRedo: boolean;
  currentFiles: ProjectFile[];
  onUndo: () => void;
  onRedo: () => void;
  onSelectiveUndo?: (entryId: string, filePath: string) => void;
}

function computeFileDiffs(before: ProjectFile[], after: ProjectFile[]): Array<{
  path: string;
  status: 'added' | 'removed' | 'modified';
  linesDiff: number;
}> {
  const beforeMap = new Map(before.map(f => [f.path, f]));
  const afterMap = new Map(after.map(f => [f.path, f]));
  const diffs: Array<{ path: string; status: 'added' | 'removed' | 'modified'; linesDiff: number }> = [];

  for (const [path, file] of afterMap) {
    const prev = beforeMap.get(path);
    if (!prev) {
      diffs.push({ path, status: 'added', linesDiff: file.content.split('\n').length });
    } else if (prev.content !== file.content) {
      const oldLines = prev.content.split('\n').length;
      const newLines = file.content.split('\n').length;
      diffs.push({ path, status: 'modified', linesDiff: newLines - oldLines });
    }
  }

  for (const [path] of beforeMap) {
    if (!afterMap.has(path)) {
      diffs.push({ path, status: 'removed', linesDiff: -(beforeMap.get(path)?.content.split('\n').length || 0) });
    }
  }

  return diffs;
}

export function UndoPreviewPopover({
  undoStack, redoStack, canUndo, canRedo, currentFiles, onUndo, onRedo,
}: UndoPreviewPopoverProps) {
  const [showHistory, setShowHistory] = useState(false);

  const topUndo = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
  const undoDiffs = topUndo ? computeFileDiffs(topUndo.files, currentFiles) : [];

  return (
    <div className="flex items-center gap-0.5">
      {/* Undo with preview popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            disabled={!canUndo}
            className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center transition-all",
              canUndo ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/[0.08] cursor-not-allowed"
            )}
            onClick={onUndo}
            title="Undo (hover for preview)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        {canUndo && undoDiffs.length > 0 && (
          <PopoverContent side="bottom" align="start" className="w-64 p-0 bg-[#13131f] border-white/[0.08]">
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <p className="text-[10px] font-medium text-white/60">Undo will revert:</p>
              <p className="text-[9px] text-white/30 mt-0.5">{topUndo?.label}</p>
            </div>
            <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
              {undoDiffs.map(diff => (
                <div key={diff.path} className="flex items-center gap-2 px-2 py-1 rounded text-[10px]">
                  {diff.status === 'added' && <Plus className="h-2.5 w-2.5 text-emerald-400 shrink-0" />}
                  {diff.status === 'removed' && <Minus className="h-2.5 w-2.5 text-red-400 shrink-0" />}
                  {diff.status === 'modified' && <FileCode className="h-2.5 w-2.5 text-amber-400 shrink-0" />}
                  <span className="text-white/50 truncate font-mono">{diff.path}</span>
                  {diff.linesDiff !== 0 && (
                    <span className={cn("text-[8px] shrink-0",
                      diff.linesDiff > 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                      {diff.linesDiff > 0 ? '+' : ''}{diff.linesDiff}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>

      {/* Redo */}
      <button
        disabled={!canRedo}
        onClick={onRedo}
        className={cn(
          "h-7 w-7 rounded-md flex items-center justify-center transition-all",
          canRedo ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/[0.08] cursor-not-allowed"
        )}
        title="Redo"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>

      {/* History toggle */}
      {undoStack.length > 1 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-all" title="Undo history">
              <Clock className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-72 p-0 bg-[#13131f] border-white/[0.08]">
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <p className="text-[10px] font-medium text-white/60">Undo History</p>
            </div>
            <ScrollArea className="max-h-64">
              <div className="p-1.5 space-y-0.5">
                {[...undoStack].reverse().map((entry, i) => {
                  const diffs = computeFileDiffs(entry.files, i === 0 ? currentFiles : undoStack[undoStack.length - i].files);
                  return (
                    <div key={entry.id} className="rounded-md px-2.5 py-1.5 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/50">{entry.label}</span>
                        <span className="text-[8px] text-white/20">
                          {entry.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {diffs.slice(0, 3).map(d => (
                          <span key={d.path} className="text-[8px] text-white/20 font-mono truncate max-w-[80px]">
                            {d.path.split('/').pop()}
                          </span>
                        ))}
                        {diffs.length > 3 && <span className="text-[8px] text-white/15">+{diffs.length - 3}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
