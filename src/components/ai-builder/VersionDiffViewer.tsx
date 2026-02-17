import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, FileCode, FilePlus, FileMinus, FileEdit, ChevronDown, ChevronRight } from 'lucide-react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { TimelineSnapshot } from '@/hooks/useVersionTimeline';

interface VersionDiffViewerProps {
  prevSnapshot: TimelineSnapshot | null;
  currSnapshot: TimelineSnapshot;
  diff: { added: string[]; removed: string[]; modified: string[] };
  onClose: () => void;
}

export function VersionDiffViewer({ prevSnapshot, currSnapshot, diff, onClose }: VersionDiffViewerProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const hasChanges = diff.added.length + diff.removed.length + diff.modified.length > 0;

  if (!hasChanges) {
    return (
      <div className="border border-white/[0.06] rounded-lg bg-[#0d0d14] p-4 text-center">
        <p className="text-[11px] text-white/30">No changes in this snapshot</p>
        <button onClick={onClose} className="mt-2 text-[10px] text-cyan-400/60 hover:text-cyan-400">Close</button>
      </div>
    );
  }

  const getFileContent = (path: string, snapshot: TimelineSnapshot | null): string | null => {
    if (!snapshot) return null;
    return snapshot.files.find(f => f.path === path)?.content ?? null;
  };

  const computeLineDiff = (oldContent: string | null, newContent: string | null): DiffLine[] => {
    const oldLines = oldContent?.split('\n') ?? [];
    const newLines = newContent?.split('\n') ?? [];
    const result: DiffLine[] = [];

    // Simple LCS-based diff
    const maxLines = Math.max(oldLines.length, newLines.length);
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
        // Look ahead to find match
        const lookAhead = 5;
        let foundOld = -1, foundNew = -1;
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
      if (result.length > 500) break; // Safety cap
    }

    return result;
  };

  const toggleFile = (path: string) => {
    setExpandedFile(prev => prev === path ? null : path);
  };

  const allFiles = [
    ...diff.added.map(p => ({ path: p, type: 'added' as const })),
    ...diff.modified.map(p => ({ path: p, type: 'modified' as const })),
    ...diff.removed.map(p => ({ path: p, type: 'removed' as const })),
  ];

  return (
    <div className="border border-white/[0.06] rounded-lg bg-[#0d0d14] overflow-hidden max-h-[400px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="h-3.5 w-3.5 text-cyan-400/60" />
          <span className="text-[11px] font-medium text-white/60">Changes in "{currSnapshot.label}"</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[9px]">
            {diff.added.length > 0 && <span className="text-emerald-400/80">+{diff.added.length} added</span>}
            {diff.modified.length > 0 && <span className="text-amber-400/80">~{diff.modified.length} modified</span>}
            {diff.removed.length > 0 && <span className="text-red-400/80">-{diff.removed.length} removed</span>}
          </div>
          <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {allFiles.map(({ path, type }) => {
          const isExpanded = expandedFile === path;
          const Icon = type === 'added' ? FilePlus : type === 'removed' ? FileMinus : FileEdit;
          const color = type === 'added' ? 'text-emerald-400' : type === 'removed' ? 'text-red-400' : 'text-amber-400';

          return (
            <div key={path} className="border-b border-white/[0.03] last:border-0">
              <button
                onClick={() => toggleFile(path)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.02] transition-colors text-left"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3 text-white/20 shrink-0" /> : <ChevronRight className="h-3 w-3 text-white/20 shrink-0" />}
                <Icon className={cn("h-3 w-3 shrink-0", color)} />
                <span className="text-[10px] font-mono text-white/50 truncate">{path}</span>
                <span className={cn("text-[8px] uppercase font-medium ml-auto shrink-0", color)}>{type}</span>
              </button>

              {isExpanded && type !== 'removed' && (
                <div className="bg-black/30 overflow-x-auto max-h-[250px] overflow-y-auto">
                  <DiffBlock
                    lines={computeLineDiff(
                      getFileContent(path, prevSnapshot),
                      getFileContent(path, currSnapshot),
                    )}
                  />
                </div>
              )}
              {isExpanded && type === 'removed' && (
                <div className="px-4 py-2 bg-red-500/5 text-[10px] text-red-400/60 font-mono">
                  File was removed
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLine?: number;
  newLine?: number;
}

function DiffBlock({ lines }: { lines: DiffLine[] }) {
  // Collapse unchanged sections
  const collapsed: (DiffLine | { type: 'collapse'; count: number })[] = [];
  let unchangedBuffer: DiffLine[] = [];

  const flushUnchanged = () => {
    if (unchangedBuffer.length <= 4) {
      collapsed.push(...unchangedBuffer);
    } else {
      collapsed.push(unchangedBuffer[0], unchangedBuffer[1]);
      collapsed.push({ type: 'collapse', count: unchangedBuffer.length - 4 });
      collapsed.push(unchangedBuffer[unchangedBuffer.length - 2], unchangedBuffer[unchangedBuffer.length - 1]);
    }
    unchangedBuffer = [];
  };

  for (const line of lines) {
    if (line.type === 'unchanged') {
      unchangedBuffer.push(line);
    } else {
      flushUnchanged();
      collapsed.push(line);
    }
  }
  flushUnchanged();

  return (
    <table className="w-full text-[10px] font-mono leading-relaxed">
      <tbody>
        {collapsed.map((item, i) => {
          if ('count' in item) {
            return (
              <tr key={i} className="bg-white/[0.02]">
                <td colSpan={3} className="text-center text-white/15 py-0.5 text-[9px]">
                  ··· {item.count} unchanged lines ···
                </td>
              </tr>
            );
          }
          const line = item as DiffLine;
          return (
            <tr
              key={i}
              className={cn(
                line.type === 'added' && 'bg-emerald-500/[0.06]',
                line.type === 'removed' && 'bg-red-500/[0.06]',
              )}
            >
              <td className="w-8 text-right pr-2 select-none text-white/10 align-top">
                {line.oldLine ?? ''}
              </td>
              <td className="w-8 text-right pr-2 select-none text-white/10 align-top">
                {line.newLine ?? ''}
              </td>
              <td className="pl-2 pr-4 whitespace-pre">
                <span className={cn(
                  "select-all",
                  line.type === 'added' ? 'text-emerald-300/70' :
                  line.type === 'removed' ? 'text-red-300/60 line-through' :
                  'text-white/30'
                )}>
                  {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                  {line.content}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
