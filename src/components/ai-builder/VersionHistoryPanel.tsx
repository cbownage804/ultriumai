import { useState } from 'react';
import { History, RotateCcw, ChevronDown, ChevronRight, FileDiff, Clock, GitBranch, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { VersionSnapshot } from '@/hooks/useAIAppBuilder';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState, EMPTY_STATES } from './EmptyStates';

interface VersionHistoryPanelProps {
  versions: VersionSnapshot[];
  currentFiles: ProjectFile[];
  onRestore: (versionId: string) => void;
  onClose: () => void;
  open: boolean;
  activeBranchName?: string;
}

function computeDiff(oldContent: string, newContent: string) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const changes: { type: 'add' | 'remove' | 'same'; content: string; lineNum: number }[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length) {
      changes.push({ type: 'add', content: newLines[i], lineNum: i + 1 });
    } else if (i >= newLines.length) {
      changes.push({ type: 'remove', content: oldLines[i], lineNum: i + 1 });
    } else if (oldLines[i] !== newLines[i]) {
      changes.push({ type: 'remove', content: oldLines[i], lineNum: i + 1 });
      changes.push({ type: 'add', content: newLines[i], lineNum: i + 1 });
    } else {
      changes.push({ type: 'same', content: oldLines[i], lineNum: i + 1 });
    }
  }
  return changes;
}

function getFileDiffs(oldFiles: ProjectFile[], newFiles: ProjectFile[]) {
  const diffs: { path: string; added: number; removed: number; status: 'modified' | 'added' | 'deleted' }[] = [];
  const oldMap = new Map(oldFiles.map(f => [f.path, f]));
  const newMap = new Map(newFiles.map(f => [f.path, f]));

  for (const [path, newFile] of newMap) {
    const oldFile = oldMap.get(path);
    if (!oldFile) {
      diffs.push({ path, added: newFile.content.split('\n').length, removed: 0, status: 'added' });
    } else if (oldFile.content !== newFile.content) {
      const changes = computeDiff(oldFile.content, newFile.content);
      diffs.push({
        path,
        added: changes.filter(c => c.type === 'add').length,
        removed: changes.filter(c => c.type === 'remove').length,
        status: 'modified',
      });
    }
  }

  for (const path of oldMap.keys()) {
    if (!newMap.has(path)) {
      diffs.push({ path, added: 0, removed: oldMap.get(path)!.content.split('\n').length, status: 'deleted' });
    }
  }

  return diffs;
}

export function VersionHistoryPanel({ versions, currentFiles, onRestore, onClose, open, activeBranchName }: VersionHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [diffFile, setDiffFile] = useState<{ path: string; versionId: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'ai' | 'manual'>('all');

  if (!open) return null;

  const allVersions = [
    ...versions,
    { id: '__current__', label: 'Current state', files: currentFiles, timestamp: new Date(), messageId: '' },
  ];

  const selectedDiff = diffFile
    ? (() => {
        const versionIdx = allVersions.findIndex(v => v.id === diffFile.versionId);
        const prevVersion = versionIdx > 0 ? allVersions[versionIdx - 1] : null;
        if (!prevVersion) return null;
        const oldFile = prevVersion.files.find(f => f.path === diffFile.path);
        const newFile = allVersions[versionIdx].files.find(f => f.path === diffFile.path);
        return computeDiff(oldFile?.content || '', newFile?.content || '');
      })()
    : null;

  const filteredVersions = filter === 'all' ? allVersions
    : filter === 'ai' ? allVersions.filter(v => v.label.toLowerCase().includes('ai') || v.label.toLowerCase().includes('generat'))
    : allVersions.filter(v => !v.label.toLowerCase().includes('ai') && !v.label.toLowerCase().includes('generat'));

  return (
    <div className="w-72 h-full border-r border-white/[0.06] bg-[#0a0a10] flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <History className="h-3.5 w-3.5" />
          Version History
        </div>
        <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">Close</button>
      </div>

      {/* Branch indicator + filter */}
      <div className="px-3 py-2 border-b border-white/[0.04] space-y-2">
        {activeBranchName && (
          <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/60">
            <GitBranch className="h-3 w-3" />
            <span className="font-mono">{activeBranchName}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {(['all', 'ai', 'manual'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-[9px] px-2 py-0.5 rounded-full transition-colors capitalize",
                filter === f ? "bg-white/10 text-white/70" : "text-white/25 hover:text-white/50"
              )}
            >
              {f}
            </button>
          ))}
          <span className="text-[9px] text-white/15 ml-auto">{filteredVersions.length - 1} changes</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1 relative">
          {/* Visual timeline line */}
          <div className="absolute left-[22px] top-2 bottom-2 w-px bg-white/[0.04]" />
          {[...filteredVersions].reverse().map((version, idx) => {
            const isExpanded = expandedId === version.id;
            const prevVersion = idx < allVersions.length - 1
              ? allVersions[allVersions.length - 2 - idx]
              : null;
            const fileDiffs = prevVersion ? getFileDiffs(prevVersion.files, version.files) : [];

            const isAI = version.label.toLowerCase().includes('ai') || version.label.toLowerCase().includes('generat');
            return (
              <div key={version.id} className="rounded-lg border border-white/[0.04] bg-white/[0.02] relative ml-3">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute -left-[14px] top-3 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a10] z-10",
                  version.id === '__current__' ? "bg-emerald-400" : isAI ? "bg-violet-400" : "bg-cyan-400"
                )} />
                <button
                  onClick={() => setExpandedId(isExpanded ? null : version.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-white/[0.03] transition-colors rounded-lg"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] text-white/70 truncate">{version.label}</p>
                      {isAI && <Tag className="h-2.5 w-2.5 text-violet-400/50 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-white/20" />
                      <span className="text-[9px] text-white/25">
                        {formatDistanceToNow(version.timestamp, { addSuffix: true })}
                      </span>
                      {version.files.length > 0 && (
                        <span className="text-[9px] text-white/20">{version.files.length} files</span>
                      )}
                      {fileDiffs.length > 0 && (
                        <span className="text-[9px] text-emerald-400/40">+{fileDiffs.reduce((s, d) => s + d.added, 0)}</span>
                      )}
                      {fileDiffs.length > 0 && (
                        <span className="text-[9px] text-red-400/40">-{fileDiffs.reduce((s, d) => s + d.removed, 0)}</span>
                      )}
                    </div>
                  </div>
                  {version.id !== '__current__' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRestore(version.id); }}
                          className="h-6 w-6 rounded flex items-center justify-center text-white/20 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">Restore this version</TooltipContent>
                    </Tooltip>
                  )}
                </button>

                {isExpanded && fileDiffs.length > 0 && (
                  <div className="px-2.5 pb-2 space-y-0.5">
                    {fileDiffs.map(d => (
                      <button
                        key={d.path}
                        onClick={() => setDiffFile({ path: d.path, versionId: version.id })}
                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-left hover:bg-white/[0.04] transition-colors group"
                      >
                        <FileDiff className="h-3 w-3 text-white/20 group-hover:text-white/40 shrink-0" />
                        <span className="text-[10px] text-white/50 truncate flex-1">{d.path}</span>
                        <div className="flex items-center gap-1">
                          {d.added > 0 && <span className="text-[9px] text-emerald-400/70">+{d.added}</span>}
                          {d.removed > 0 && <span className="text-[9px] text-red-400/70">-{d.removed}</span>}
                          <Badge className={cn(
                            "h-4 text-[8px] px-1",
                            d.status === 'added' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            d.status === 'deleted' && "bg-red-500/10 text-red-400 border-red-500/20",
                            d.status === 'modified' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          )}>
                            {d.status[0].toUpperCase()}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Inline Diff Viewer */}
      {selectedDiff && diffFile && (
        <div className="border-t border-white/[0.06] h-52 flex flex-col">
          <div className="flex items-center justify-between px-3 h-7 bg-black/30 shrink-0">
            <span className="text-[10px] text-white/40 truncate">{diffFile.path}</span>
            <button onClick={() => setDiffFile(null)} className="text-[9px] text-white/25 hover:text-white/50">×</button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 font-mono text-[10px] leading-4">
              {selectedDiff.filter(c => c.type !== 'same').slice(0, 60).map((change, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-2 py-0.5 rounded-sm",
                    change.type === 'add' && "bg-emerald-500/10 text-emerald-300/80",
                    change.type === 'remove' && "bg-red-500/10 text-red-300/80 line-through",
                  )}
                >
                  <span className="text-white/20 mr-2">{change.type === 'add' ? '+' : '-'}</span>
                  {change.content || ' '}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
