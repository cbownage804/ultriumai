import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { GitBranch } from 'lucide-react';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

interface CodeDiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName: string;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const max = oldLines.length + newLines.length;
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  let oi = 0;
  let ni = 0;
  let lineNum = 1;

  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      result.push({ type: 'unchanged', content: oldLines[oi], lineNumber: lineNum++ });
      oi++;
      ni++;
    } else if (oi < oldLines.length && !newSet.has(oldLines[oi])) {
      result.push({ type: 'removed', content: oldLines[oi], lineNumber: lineNum++ });
      oi++;
    } else if (ni < newLines.length && !oldSet.has(newLines[ni])) {
      result.push({ type: 'added', content: newLines[ni], lineNumber: lineNum++ });
      ni++;
    } else if (oi < oldLines.length) {
      result.push({ type: 'removed', content: oldLines[oi], lineNumber: lineNum++ });
      oi++;
    } else {
      result.push({ type: 'added', content: newLines[ni], lineNumber: lineNum++ });
      ni++;
    }
  }

  return result;
}

export function CodeDiffViewer({ oldContent, newContent, fileName }: CodeDiffViewerProps) {
  const diffLines = useMemo(() => computeDiff(oldContent, newContent), [oldContent, newContent]);

  const addedCount = diffLines.filter(l => l.type === 'added').length;
  const removedCount = diffLines.filter(l => l.type === 'removed').length;

  if (addedCount === 0 && removedCount === 0) return null;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/40 overflow-hidden text-[11px] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-white/60">
          <GitBranch className="h-3 w-3" />
          <span>{fileName}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {addedCount > 0 && <span className="text-emerald-400">+{addedCount}</span>}
          {removedCount > 0 && <span className="text-red-400">-{removedCount}</span>}
        </div>
      </div>

      {/* Diff lines - show only changed lines with context */}
      <div className="max-h-48 overflow-auto">
        {diffLines
          .map((line, i) => {
            // Show changed lines and 1 line of context
            const isNearChange =
              line.type !== 'unchanged' ||
              diffLines[i - 1]?.type !== 'unchanged' ||
              diffLines[i + 1]?.type !== 'unchanged';

            if (!isNearChange) return null;

            return (
              <div
                key={i}
                className={cn(
                  'flex',
                  line.type === 'added' && 'bg-emerald-500/[0.08]',
                  line.type === 'removed' && 'bg-red-500/[0.08]',
                )}
              >
                <span className={cn(
                  "w-8 text-right pr-2 select-none shrink-0 border-r border-white/[0.04]",
                  line.type === 'added' ? 'text-emerald-500/50' :
                  line.type === 'removed' ? 'text-red-500/50' : 'text-white/15'
                )}>
                  {line.lineNumber}
                </span>
                <span className={cn(
                  "w-4 text-center select-none shrink-0",
                  line.type === 'added' ? 'text-emerald-400' :
                  line.type === 'removed' ? 'text-red-400' : 'text-transparent'
                )}>
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </span>
                <span className={cn(
                  "flex-1 px-2 whitespace-pre",
                  line.type === 'added' ? 'text-emerald-300/80' :
                  line.type === 'removed' ? 'text-red-300/80 line-through opacity-60' : 'text-white/40'
                )}>
                  {line.content || ' '}
                </span>
              </div>
            );
          })
          .filter(Boolean)}
      </div>
    </div>
  );
}
