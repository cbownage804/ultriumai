import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { History, FileCode, Plus, Minus, Pencil, ChevronDown, ChevronRight, Clock } from 'lucide-react';

export interface ChangelogEntry {
  id: string;
  timestamp: Date;
  type: 'ai-build' | 'manual-edit' | 'file-create' | 'file-delete';
  label: string;
  files: { path: string; action: 'added' | 'modified' | 'deleted' }[];
}

interface ChangelogPanelProps {
  open: boolean;
  onClose: () => void;
  entries: ChangelogEntry[];
}

export function ChangelogPanel({ open, onClose, entries }: ChangelogPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const groups = new Map<string, ChangelogEntry[]>();
    entries.forEach(e => {
      const dateKey = e.timestamp.toLocaleDateString();
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(e);
    });
    return Array.from(groups.entries());
  }, [entries]);

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getTypeIcon = (type: ChangelogEntry['type']) => {
    switch (type) {
      case 'ai-build': return <span className="text-[10px]">🤖</span>;
      case 'manual-edit': return <Pencil className="h-2.5 w-2.5 text-amber-400/60" />;
      case 'file-create': return <Plus className="h-2.5 w-2.5 text-emerald-400/60" />;
      case 'file-delete': return <Minus className="h-2.5 w-2.5 text-red-400/60" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'added': return 'text-emerald-400/70';
      case 'modified': return 'text-amber-400/70';
      case 'deleted': return 'text-red-400/70';
      default: return 'text-white/40';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'added': return <Plus className="h-2 w-2" />;
      case 'modified': return <Pencil className="h-2 w-2" />;
      case 'deleted': return <Minus className="h-2 w-2" />;
      default: return null;
    }
  };

  if (!open) return null;

  return (
    <div className="w-64 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-white/70">Changelog</span>
          <span className="text-[9px] text-white/20 font-mono">{entries.length}</span>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white/50 text-xs">✕</button>
      </div>

      <ScrollArea className="flex-1">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <History className="h-6 w-6 text-white/10 mb-2" />
            <div className="text-[11px] text-white/30">No changes yet</div>
            <div className="text-[9px] text-white/15 mt-1">Changes will appear here as you build</div>
          </div>
        ) : (
          <div className="py-1">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <div className="px-3 py-1.5 text-[9px] font-semibold text-white/20 uppercase tracking-widest sticky top-0 bg-[#0d0d14]">
                  {date}
                </div>
                <div className="space-y-0.5 px-1">
                  {items.map(entry => {
                    const isExpanded = expandedIds.has(entry.id);
                    return (
                      <div key={entry.id}>
                        <button
                          onClick={() => toggleExpand(entry.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors group text-left"
                        >
                          {getTypeIcon(entry.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-white/50 font-medium truncate">{entry.label}</div>
                            <div className="flex items-center gap-1 text-[9px] text-white/20">
                              <Clock className="h-2 w-2" />
                              {formatTime(entry.timestamp)}
                              <span className="ml-1">{entry.files.length} file{entry.files.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown className="h-2.5 w-2.5 text-white/15" /> : <ChevronRight className="h-2.5 w-2.5 text-white/15" />}
                        </button>
                        {isExpanded && (
                          <div className="ml-5 pl-2 border-l border-white/[0.04] space-y-0.5 pb-1">
                            {entry.files.map((f, i) => (
                              <div key={i} className={cn("flex items-center gap-1.5 text-[9px] px-1.5 py-0.5 rounded", getActionColor(f.action))}>
                                {getActionIcon(f.action)}
                                <span className="truncate font-mono">{f.path}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
