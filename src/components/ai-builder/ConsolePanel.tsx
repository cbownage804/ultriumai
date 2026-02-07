import { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, Wrench, Globe, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  source?: string;
  line?: number;
  timestamp: Date;
}

export interface NetworkEntry {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: Date;
}

interface ConsolePanelProps {
  open: boolean;
  onToggle: () => void;
  onFixError?: (errorMessage: string) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

type ActiveTab = 'console' | 'problems' | 'network';

export function ConsolePanel({ open, onToggle, onFixError, iframeRef }: ConsolePanelProps) {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [networkEntries, setNetworkEntries] = useState<NetworkEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'log'>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('console');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__CONSOLE_LOG__') {
        setEntries(prev => [...prev.slice(-199), {
          id: crypto.randomUUID(),
          type: e.data.level || 'log',
          message: e.data.message,
          source: e.data.source,
          line: e.data.line,
          timestamp: new Date(),
        }]);
      }
      if (e.data?.type === '__PREVIEW_ERROR__') {
        setEntries(prev => [...prev.slice(-199), {
          id: crypto.randomUUID(),
          type: e.data.isWarning ? 'warn' : 'error',
          message: e.data.message,
          source: e.data.source,
          line: e.data.line,
          timestamp: new Date(),
        }]);
      }
      if (e.data?.type === '__NETWORK_LOG__') {
        setNetworkEntries(prev => [...prev.slice(-99), {
          id: crypto.randomUUID(),
          method: e.data.method || 'GET',
          url: e.data.url || '',
          status: e.data.status || 0,
          duration: e.data.duration || 0,
          timestamp: new Date(),
        }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const filteredEntries = filter === 'all' ? entries : entries.filter(e => e.type === filter);
  const errorCount = entries.filter(e => e.type === 'error').length;
  const warnCount = entries.filter(e => e.type === 'warn').length;
  const problemEntries = entries.filter(e => e.type === 'error' || e.type === 'warn');

  const typeIcon = (type: ConsoleEntry['type']) => {
    switch (type) {
      case 'error': return <XCircle className="h-3 w-3 text-red-400 shrink-0" />;
      case 'warn': return <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />;
      case 'info': return <Info className="h-3 w-3 text-blue-400 shrink-0" />;
      default: return <span className="h-3 w-3 text-white/20 shrink-0">›</span>;
    }
  };

  const statusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 300 && status < 400) return 'text-amber-400';
    if (status >= 400) return 'text-red-400';
    return 'text-white/40';
  };

  return (
    <div className={cn(
      "border-t border-white/[0.06] bg-[#0a0a10] transition-all",
      open ? "h-48" : "h-8"
    )}>
      {/* Tab bar */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 h-8 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-white/30" />
          <span className="text-[10px] font-medium text-white/40">Console</span>
          {errorCount > 0 && (
            <Badge className="h-4 text-[9px] px-1.5 bg-red-500/10 text-red-400 border-red-500/20">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {warnCount > 0 && (
            <Badge className="h-4 text-[9px] px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
              {warnCount} warn{warnCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {open ? <ChevronDown className="h-3 w-3 text-white/20" /> : <ChevronUp className="h-3 w-3 text-white/20" />}
      </button>

      {open && (
        <div className="flex flex-col h-[calc(100%-2rem)]">
          {/* Toolbar with tabs */}
          <div className="flex items-center gap-1 px-2 h-7 border-b border-white/[0.04] shrink-0">
            {([
              { id: 'console' as ActiveTab, label: 'Console', icon: Terminal },
              { id: 'problems' as ActiveTab, label: 'Problems', icon: Bug, count: problemEntries.length },
              { id: 'network' as ActiveTab, label: 'Network', icon: Globe, count: networkEntries.length },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-5 px-2 rounded text-[9px] transition-colors flex items-center gap-1",
                  activeTab === tab.id ? "bg-white/10 text-white/70" : "text-white/25 hover:text-white/50"
                )}
              >
                <tab.icon className="h-2.5 w-2.5" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-[8px] bg-white/10 rounded px-1">{tab.count}</span>
                )}
              </button>
            ))}

            {activeTab === 'console' && (
              <>
                <div className="w-px h-3 bg-white/[0.06] mx-1" />
                {(['all', 'error', 'warn', 'log'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "h-5 px-1.5 rounded text-[9px] transition-colors",
                      filter === f ? "bg-white/10 text-white/70" : "text-white/25 hover:text-white/50"
                    )}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </>
            )}

            <div className="flex-1" />
            <button
              onClick={() => { setEntries([]); setNetworkEntries([]); }}
              className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
              title="Clear"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="p-1.5 space-y-px font-mono text-[10px]">
              {activeTab === 'console' && (
                filteredEntries.length === 0 ? (
                  <div className="text-center text-white/15 py-6 text-[10px]">No console output</div>
                ) : (
                  filteredEntries.map(entry => (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-start gap-1.5 px-2 py-1 rounded group",
                        entry.type === 'error' && "bg-red-500/5",
                        entry.type === 'warn' && "bg-amber-500/5",
                      )}
                    >
                      {typeIcon(entry.type)}
                      <span className={cn(
                        "flex-1 break-all leading-4",
                        entry.type === 'error' ? "text-red-300/70" :
                        entry.type === 'warn' ? "text-amber-300/70" :
                        "text-white/40"
                      )}>
                        {entry.message}
                      </span>
                      {entry.source && (
                        <span className="text-[8px] text-white/15 shrink-0">
                          {entry.source}{entry.line ? `:${entry.line}` : ''}
                        </span>
                      )}
                      {entry.type === 'error' && onFixError && (
                        <button
                          onClick={() => onFixError(`Fix this console error: "${entry.message}"`)}
                          className="opacity-0 group-hover:opacity-100 h-4 px-1.5 rounded bg-cyan-500/10 text-cyan-400 text-[8px] hover:bg-cyan-500/20 transition-all shrink-0 flex items-center gap-0.5"
                        >
                          <Wrench className="h-2.5 w-2.5" />
                          Fix
                        </button>
                      )}
                    </div>
                  ))
                )
              )}

              {activeTab === 'problems' && (
                problemEntries.length === 0 ? (
                  <div className="text-center text-white/15 py-6 text-[10px]">No problems detected</div>
                ) : (
                  problemEntries.map(entry => (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-start gap-1.5 px-2 py-1 rounded group",
                        entry.type === 'error' ? "bg-red-500/5" : "bg-amber-500/5",
                      )}
                    >
                      {typeIcon(entry.type)}
                      <span className={cn(
                        "flex-1 break-all leading-4",
                        entry.type === 'error' ? "text-red-300/70" : "text-amber-300/70"
                      )}>
                        {entry.message}
                      </span>
                      {entry.source && (
                        <span className="text-[8px] text-white/15 shrink-0">
                          {entry.source}{entry.line ? `:${entry.line}` : ''}
                        </span>
                      )}
                      {entry.type === 'error' && onFixError && (
                        <button
                          onClick={() => onFixError(`Fix this error: "${entry.message}"`)}
                          className="opacity-0 group-hover:opacity-100 h-4 px-1.5 rounded bg-cyan-500/10 text-cyan-400 text-[8px] hover:bg-cyan-500/20 transition-all shrink-0 flex items-center gap-0.5"
                        >
                          <Wrench className="h-2.5 w-2.5" />
                          Fix
                        </button>
                      )}
                    </div>
                  ))
                )
              )}

              {activeTab === 'network' && (
                networkEntries.length === 0 ? (
                  <div className="text-center text-white/15 py-6 text-[10px]">No network requests captured</div>
                ) : (
                  networkEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.02]">
                      <span className="text-[9px] font-bold text-white/30 w-8 shrink-0">{entry.method}</span>
                      <span className={cn("text-[9px] font-bold w-6 shrink-0", statusColor(entry.status))}>
                        {entry.status || '...'}
                      </span>
                      <span className="flex-1 text-white/40 truncate">{entry.url}</span>
                      <span className="text-[8px] text-white/20 shrink-0">{entry.duration}ms</span>
                    </div>
                  ))
                )
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
