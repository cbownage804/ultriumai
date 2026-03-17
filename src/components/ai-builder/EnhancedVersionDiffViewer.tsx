import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  X, FileCode, FilePlus, FileMinus, FileEdit, ChevronDown, ChevronRight,
  RotateCcw, Check, Copy, GitCompare,
} from 'lucide-react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { TimelineSnapshot } from '@/hooks/useVersionTimeline';
import { toast } from 'sonner';

interface EnhancedVersionDiffViewerProps {
  prevSnapshot: TimelineSnapshot | null;
  currSnapshot: TimelineSnapshot;
  diff: { added: string[]; removed: string[]; modified: string[] };
  onClose: () => void;
  /** Cherry-pick rollback: restore individual files from prevSnapshot */
  onRollbackFiles?: (files: ProjectFile[]) => void;
  /** Full rollback to this snapshot */
  onRollbackAll?: (snapshot: TimelineSnapshot) => void;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'separator';
  content: string;
  oldLine?: number;
  newLine?: number;
}

type ViewMode = 'split' | 'unified';

export function EnhancedVersionDiffViewer({
  prevSnapshot,
  currSnapshot,
  diff,
  onClose,
  onRollbackFiles,
  onRollbackAll,
}: EnhancedVersionDiffViewerProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const hasChanges = diff.added.length + diff.removed.length + diff.modified.length > 0;
  const allFiles = [...diff.modified, ...diff.added, ...diff.removed];

  const getFileContent = (path: string, snapshot: TimelineSnapshot | null): string | null => {
    if (!snapshot) return null;
    return snapshot.files.find(f => f.path === path)?.content ?? null;
  };

  const computeLineDiff = (oldContent: string | null, newContent: string | null): DiffLine[] => {
    const oldLines = oldContent?.split('\n') ?? [];
    const newLines = newContent?.split('\n') ?? [];
    const result: DiffLine[] = [];
    let oi = 0, ni = 0;

    while (oi < oldLines.length || ni < newLines.length) {
      if (oi >= oldLines.length) {
        result.push({ type: 'added', content: newLines[ni], newLine: ni + 1 });
        ni++;
      } else if (ni >= newLines.length) {
        result.push({ type: 'removed', content: oldLines[oi], oldLine: oi + 1 });
        oi++;
      } else if (oldLines[oi] === newLines[ni]) {
        result.push({ type: 'unchanged', content: oldLines[oi], oldLine: oi + 1, newLine: ni + 1 });
        oi++; ni++;
      } else {
        const lookAhead = 5;
        let foundNew = -1, foundOld = -1;
        for (let k = 1; k <= lookAhead; k++) {
          if (ni + k < newLines.length && oldLines[oi] === newLines[ni + k]) { foundNew = k; break; }
          if (oi + k < oldLines.length && oldLines[oi + k] === newLines[ni]) { foundOld = k; break; }
        }
        if (foundNew > 0) {
          for (let k = 0; k < foundNew; k++) {
            result.push({ type: 'added', content: newLines[ni + k], newLine: ni + k + 1 });
          }
          ni += foundNew;
        } else if (foundOld > 0) {
          for (let k = 0; k < foundOld; k++) {
            result.push({ type: 'removed', content: oldLines[oi + k], oldLine: oi + k + 1 });
          }
          oi += foundOld;
        } else {
          result.push({ type: 'removed', content: oldLines[oi], oldLine: oi + 1 });
          result.push({ type: 'added', content: newLines[ni], newLine: ni + 1 });
          oi++; ni++;
        }
      }
    }
    return result;
  };

  const toggleFileSelect = useCallback((path: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleCherryPick = useCallback(() => {
    if (!prevSnapshot || !onRollbackFiles || selectedFiles.size === 0) return;
    const filesToRestore = prevSnapshot.files.filter(f => selectedFiles.has(f.path));
    onRollbackFiles(filesToRestore);
    toast.success(`Rolled back ${filesToRestore.length} file(s)`);
    setSelectedFiles(new Set());
  }, [prevSnapshot, onRollbackFiles, selectedFiles]);

  const handleRollbackAll = useCallback(() => {
    if (!prevSnapshot || !onRollbackAll) return;
    onRollbackAll(prevSnapshot);
    toast.success('Rolled back to previous version');
  }, [prevSnapshot, onRollbackAll]);

  if (!hasChanges) {
    return (
      <div className="border border-white/[0.06] rounded-lg bg-[#0d0d14] p-4 text-center">
        <p className="text-[11px] text-white/30">No changes in this snapshot</p>
        <button onClick={onClose} className="mt-2 text-[10px] text-cyan-400/60 hover:text-cyan-400">Close</button>
      </div>
    );
  }

  const getFileIcon = (path: string) => {
    if (diff.added.includes(path)) return <FilePlus className="h-3 w-3 text-green-400" />;
    if (diff.removed.includes(path)) return <FileMinus className="h-3 w-3 text-red-400" />;
    return <FileEdit className="h-3 w-3 text-yellow-400" />;
  };

  const getChangeStats = (path: string) => {
    const oldContent = getFileContent(path, prevSnapshot);
    const newContent = getFileContent(path, currSnapshot);
    const lines = computeLineDiff(oldContent, newContent);
    const added = lines.filter(l => l.type === 'added').length;
    const removed = lines.filter(l => l.type === 'removed').length;
    return { added, removed };
  };

  return (
    <div className="border border-white/[0.06] rounded-lg bg-[#0d0d14] overflow-hidden flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          <GitCompare className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs text-white/70 font-medium">
            {prevSnapshot?.label || 'Initial'} → {currSnapshot.label}
          </span>
          <span className="text-[10px] text-white/30">
            {allFiles.length} file{allFiles.length !== 1 ? 's' : ''} changed
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* View mode toggle */}
          <div className="flex items-center bg-white/[0.04] rounded p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={cn("px-1.5 py-0.5 rounded text-[10px] transition-colors",
                viewMode === 'split' ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
              )}
            >Split</button>
            <button
              onClick={() => setViewMode('unified')}
              className={cn("px-1.5 py-0.5 rounded text-[10px] transition-colors",
                viewMode === 'unified' ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
              )}
            >Unified</button>
          </div>

          {/* Cherry-pick rollback */}
          {selectedFiles.size > 0 && onRollbackFiles && (
            <button
              onClick={handleCherryPick}
              className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-[10px] hover:bg-yellow-500/20 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Rollback {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''}
            </button>
          )}

          {/* Full rollback */}
          {prevSnapshot && onRollbackAll && (
            <button
              onClick={handleRollbackAll}
              className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] hover:bg-red-500/20 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Rollback all
            </button>
          )}

          <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* File list + diff */}
      <div className="flex-1 overflow-y-auto">
        {allFiles.map((path) => {
          const isExpanded = expandedFile === path;
          const stats = getChangeStats(path);

          return (
            <div key={path} className="border-b border-white/[0.03]">
              {/* File row */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.02] cursor-pointer group"
                onClick={() => setExpandedFile(isExpanded ? null : path)}
              >
                {/* Checkbox for cherry-pick */}
                {onRollbackFiles && prevSnapshot && diff.modified.includes(path) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFileSelect(path); }}
                    className={cn(
                      "h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                      selectedFiles.has(path)
                        ? "bg-purple-500 border-purple-500"
                        : "border-white/20 hover:border-white/40"
                    )}
                  >
                    {selectedFiles.has(path) && <Check className="h-2.5 w-2.5 text-white" />}
                  </button>
                )}

                {isExpanded ? <ChevronDown className="h-3 w-3 text-white/30" /> : <ChevronRight className="h-3 w-3 text-white/30" />}
                {getFileIcon(path)}
                <span className="text-[11px] text-white/70 font-mono flex-1 truncate">{path}</span>
                <span className="text-[10px] text-green-400/60">+{stats.added}</span>
                <span className="text-[10px] text-red-400/60">-{stats.removed}</span>
              </div>

              {/* Expanded diff */}
              {isExpanded && (
                <div className="bg-[#080810] border-t border-white/[0.03] overflow-x-auto">
                  {viewMode === 'split' ? (
                    <SplitDiffView
                      oldContent={getFileContent(path, prevSnapshot)}
                      newContent={getFileContent(path, currSnapshot)}
                      computeLineDiff={computeLineDiff}
                    />
                  ) : (
                    <UnifiedDiffView
                      oldContent={getFileContent(path, prevSnapshot)}
                      newContent={getFileContent(path, currSnapshot)}
                      computeLineDiff={computeLineDiff}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SplitDiffView({
  oldContent,
  newContent,
  computeLineDiff,
}: {
  oldContent: string | null;
  newContent: string | null;
  computeLineDiff: (a: string | null, b: string | null) => DiffLine[];
}) {
  const lines = computeLineDiff(oldContent, newContent);

  return (
    <div className="flex text-[11px] font-mono leading-5">
      {/* Old side */}
      <div className="flex-1 border-r border-white/[0.04]">
        {lines.map((line, i) => (
          line.type !== 'added' && (
            <div
              key={`old-${i}`}
              className={cn(
                "flex px-2",
                line.type === 'removed' && "bg-red-500/[0.06]",
              )}
            >
              <span className="w-8 text-right pr-2 text-white/15 select-none flex-shrink-0">
                {line.oldLine || ''}
              </span>
              <span className={cn(
                "whitespace-pre",
                line.type === 'removed' ? "text-red-300/80" : "text-white/40"
              )}>
                {line.type === 'removed' && <span className="text-red-400 mr-1">-</span>}
                {line.content}
              </span>
            </div>
          )
        ))}
      </div>
      {/* New side */}
      <div className="flex-1">
        {lines.map((line, i) => (
          line.type !== 'removed' && (
            <div
              key={`new-${i}`}
              className={cn(
                "flex px-2",
                line.type === 'added' && "bg-green-500/[0.06]",
              )}
            >
              <span className="w-8 text-right pr-2 text-white/15 select-none flex-shrink-0">
                {line.newLine || ''}
              </span>
              <span className={cn(
                "whitespace-pre",
                line.type === 'added' ? "text-green-300/80" : "text-white/40"
              )}>
                {line.type === 'added' && <span className="text-green-400 mr-1">+</span>}
                {line.content}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function UnifiedDiffView({
  oldContent,
  newContent,
  computeLineDiff,
}: {
  oldContent: string | null;
  newContent: string | null;
  computeLineDiff: (a: string | null, b: string | null) => DiffLine[];
}) {
  const lines = computeLineDiff(oldContent, newContent);

  return (
    <div className="text-[11px] font-mono leading-5">
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "flex px-2",
            line.type === 'added' && "bg-green-500/[0.06]",
            line.type === 'removed' && "bg-red-500/[0.06]",
          )}
        >
          <span className="w-8 text-right pr-2 text-white/15 select-none flex-shrink-0">
            {line.oldLine || ''}
          </span>
          <span className="w-8 text-right pr-2 text-white/15 select-none flex-shrink-0">
            {line.newLine || ''}
          </span>
          <span className={cn(
            "whitespace-pre flex-1",
            line.type === 'added' && "text-green-300/80",
            line.type === 'removed' && "text-red-300/80",
            line.type === 'unchanged' && "text-white/40",
          )}>
            {line.type === 'added' && <span className="text-green-400 mr-1 select-none">+</span>}
            {line.type === 'removed' && <span className="text-red-400 mr-1 select-none">-</span>}
            {line.type === 'unchanged' && <span className="mr-2 select-none"> </span>}
            {line.content}
          </span>
        </div>
      ))}
    </div>
  );
}
