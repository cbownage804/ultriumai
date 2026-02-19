import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, User, X } from 'lucide-react';
import type { BlameFile, TimelineEntry } from '@/hooks/useGitBlameTimeline';

interface GitBlameTimelinePanelProps {
  blameFiles: BlameFile[];
  timeline: TimelineEntry[];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  selectedLine: number | null;
  setSelectedLine: (line: number | null) => void;
  getActiveFile: () => BlameFile | null;
  getLineInfo: (line: number) => any;
  getAuthorStats: () => { author: string; lines: number; percentage: number }[];
  onClose: () => void;
}

const authorColors = ['bg-blue-500/20 text-blue-400', 'bg-green-500/20 text-green-400', 'bg-purple-500/20 text-purple-400', 'bg-orange-500/20 text-orange-400'];

export function GitBlameTimelinePanel({
  blameFiles, timeline, activeFileId, setActiveFileId,
  selectedLine, setSelectedLine, getActiveFile, getLineInfo, getAuthorStats, onClose,
}: GitBlameTimelinePanelProps) {
  const active = getActiveFile();
  const authorStats = getAuthorStats();
  const [tab, setTab] = React.useState<'blame' | 'timeline'>('blame');

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Git Blame / Timeline</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex border-b border-border">
        <button className={`flex-1 py-2 text-xs font-medium ${tab === 'blame' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setTab('blame')}>Blame</button>
        <button className={`flex-1 py-2 text-xs font-medium ${tab === 'timeline' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setTab('timeline')}>Timeline</button>
      </div>

      {tab === 'blame' && (
        <>
          {!active && (
            <ScrollArea className="flex-1 p-3">
              {blameFiles.map(f => (
                <div key={f.id} className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer mb-1" onClick={() => setActiveFileId(f.id)}>
                  <div>
                    <p className="text-sm font-medium">{f.filePath.split('/').pop()}</p>
                    <p className="text-xs text-muted-foreground">{f.lines.length} lines · {f.totalAuthors} authors</p>
                  </div>
                </div>
              ))}
              {blameFiles.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Open a file to view blame information.</p>}
            </ScrollArea>
          )}

          {active && (
            <>
              <div className="p-3 border-b border-border">
                <Button variant="ghost" size="sm" onClick={() => setActiveFileId(null)}>← Back</Button>
                <p className="text-sm font-medium mt-1">{active.filePath}</p>

                {authorStats.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {authorStats.map((a, i) => (
                      <div key={a.author} className="flex items-center gap-2">
                        <div className="w-20 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="text-xs truncate">{a.author}</span>
                        </div>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className={`h-full rounded-full ${authorColors[i % authorColors.length].split(' ')[0]}`} style={{ width: `${a.percentage}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8">{a.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="font-mono text-xs">
                  {active.lines.slice(0, 100).map(line => (
                    <div
                      key={line.lineNumber}
                      className={`flex hover:bg-muted/50 cursor-pointer ${selectedLine === line.lineNumber ? 'bg-primary/10' : ''}`}
                      onClick={() => setSelectedLine(line.lineNumber)}
                    >
                      <div className="w-8 text-right pr-2 text-muted-foreground select-none border-r border-border">{line.lineNumber}</div>
                      <div className="w-20 px-1 text-muted-foreground truncate border-r border-border" title={line.author}>{line.author.slice(0, 10)}</div>
                      <div className="w-16 px-1 text-muted-foreground border-r border-border">{line.commitHash}</div>
                      <div className="flex-1 px-2 whitespace-pre">{line.content || ' '}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {selectedLine && (() => {
                const info = getLineInfo(selectedLine);
                if (!info) return null;
                return (
                  <div className="p-3 border-t border-border bg-muted/30">
                    <p className="text-xs font-medium">{info.commitMessage}</p>
                    <p className="text-[10px] text-muted-foreground">{info.author} · {info.commitHash} · {new Date(info.timestamp).toLocaleDateString()}</p>
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}

      {tab === 'timeline' && (
        <ScrollArea className="flex-1 p-3">
          {timeline.map(entry => (
            <div key={entry.id} className="relative pl-4 pb-4 border-l-2 border-border ml-2">
              <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary" />
              <div className="pb-1">
                <p className="text-xs font-medium">{entry.message}</p>
                <p className="text-[10px] text-muted-foreground">{entry.author} · {new Date(entry.timestamp).toLocaleDateString()}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{entry.commitHash}</Badge>
                  <span className="text-[10px] text-green-400">+{entry.linesAdded}</span>
                  <span className="text-[10px] text-red-400">-{entry.linesRemoved}</span>
                </div>
              </div>
            </div>
          ))}
          {timeline.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No timeline data. Analyze a file first.</p>}
        </ScrollArea>
      )}
    </div>
  );
}
