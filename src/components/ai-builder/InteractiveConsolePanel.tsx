import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal, Trash2, AlertTriangle, XCircle, Info, ChevronDown,
  ChevronUp, Filter, Search, Copy, Download, Wifi, Bug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ConsoleLogEntry {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  line?: number;
  timestamp: Date;
  count?: number; // For deduplication
}

export interface NetworkLogEntry {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  body?: string;
  timestamp: Date;
}

type Tab = 'console' | 'network';
type LogFilter = 'all' | 'error' | 'warn' | 'info' | 'log';

interface InteractiveConsolePanelProps {
  open: boolean;
  onToggle: () => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  /** Height in pixels */
  height?: number;
}

export function InteractiveConsolePanel({
  open,
  onToggle,
  iframeRef,
  height = 200,
}: InteractiveConsolePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('console');
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const [networkLogs, setNetworkLogs] = useState<NetworkLogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const logIdCounter = useRef(0);

  // Listen for console and network messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.type) return;

      if (e.data.type === '__CONSOLE_LOG__') {
        const entry: ConsoleLogEntry = {
          id: `log-${logIdCounter.current++}`,
          level: e.data.level || 'log',
          message: e.data.message || '',
          source: e.data.source,
          line: e.data.line,
          timestamp: new Date(),
        };

        setConsoleLogs(prev => {
          // Deduplicate consecutive identical messages
          const last = prev[prev.length - 1];
          if (last && last.message === entry.message && last.level === entry.level) {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, count: (last.count || 1) + 1 };
            return updated;
          }
          // Cap at 500 entries
          const next = [...prev, entry];
          return next.length > 500 ? next.slice(-400) : next;
        });
      }

      if (e.data.type === '__NETWORK_LOG__') {
        const entry: NetworkLogEntry = {
          id: `net-${logIdCounter.current++}`,
          method: e.data.method || 'GET',
          url: e.data.url || '',
          status: e.data.status || 0,
          duration: e.data.duration || 0,
          body: e.data.body,
          timestamp: new Date(),
        };
        setNetworkLogs(prev => {
          const next = [...prev, entry];
          return next.length > 200 ? next.slice(-150) : next;
        });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLogs, networkLogs]);

  const clearLogs = useCallback(() => {
    if (activeTab === 'console') setConsoleLogs([]);
    else setNetworkLogs([]);
  }, [activeTab]);

  const copyLogs = useCallback(() => {
    const text = activeTab === 'console'
      ? consoleLogs.map(l => `[${l.level.toUpperCase()}] ${l.message}`).join('\n')
      : networkLogs.map(n => `${n.method} ${n.url} → ${n.status} (${n.duration}ms)`).join('\n');
    navigator.clipboard.writeText(text);
  }, [activeTab, consoleLogs, networkLogs]);

  const filteredLogs = consoleLogs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const errorCount = consoleLogs.filter(l => l.level === 'error').length;
  const warnCount = consoleLogs.filter(l => l.level === 'warn').length;

  const levelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />;
      case 'warn': return <AlertTriangle className="h-3 w-3 text-yellow-400 flex-shrink-0" />;
      case 'info': return <Info className="h-3 w-3 text-blue-400 flex-shrink-0" />;
      case 'debug': return <Bug className="h-3 w-3 text-gray-400 flex-shrink-0" />;
      default: return <Terminal className="h-3 w-3 text-white/40 flex-shrink-0" />;
    }
  };

  const statusColor = (status: number) => {
    if (status >= 500) return 'text-red-400';
    if (status >= 400) return 'text-yellow-400';
    if (status >= 300) return 'text-blue-400';
    if (status >= 200) return 'text-green-400';
    return 'text-white/40';
  };

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 h-7 px-3 bg-white/[0.03] border-t border-white/[0.06] text-white/50 hover:text-white/80 text-xs transition-colors w-full"
      >
        <Terminal className="h-3 w-3" />
        <span>Console</span>
        {errorCount > 0 && (
          <span className="bg-red-500/20 text-red-400 px-1.5 rounded text-[10px] font-medium">{errorCount}</span>
        )}
        {warnCount > 0 && (
          <span className="bg-yellow-500/20 text-yellow-400 px-1.5 rounded text-[10px] font-medium">{warnCount}</span>
        )}
        <ChevronUp className="h-3 w-3 ml-auto" />
      </button>
    );
  }

  return (
    <div
      className="flex flex-col border-t border-white/[0.06] bg-[#0c0c18]"
      style={{ height }}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 h-7 px-2 border-b border-white/[0.04] flex-shrink-0">
        {/* Tabs */}
        <button
          onClick={() => setActiveTab('console')}
          className={cn(
            "px-2 h-5 rounded text-[11px] transition-colors",
            activeTab === 'console' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
          )}
        >
          Console
          {errorCount > 0 && <span className="ml-1 text-red-400">({errorCount})</span>}
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={cn(
            "px-2 h-5 rounded text-[11px] flex items-center gap-1 transition-colors",
            activeTab === 'network' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
          )}
        >
          <Wifi className="h-2.5 w-2.5" />
          Network
          {networkLogs.length > 0 && <span className="text-white/30">({networkLogs.length})</span>}
        </button>

        <div className="flex-1" />

        {/* Filter (console only) */}
        {activeTab === 'console' && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogFilter)}
            className="h-4 bg-transparent text-[10px] text-white/40 border-none outline-none cursor-pointer"
          >
            <option value="all">All</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="log">Log</option>
          </select>
        )}

        {/* Search */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="h-4 w-4 flex items-center justify-center text-white/30 hover:text-white/60"
        >
          <Search className="h-3 w-3" />
        </button>

        {/* Copy */}
        <button onClick={copyLogs} className="h-4 w-4 flex items-center justify-center text-white/30 hover:text-white/60" title="Copy logs">
          <Copy className="h-3 w-3" />
        </button>

        {/* Clear */}
        <button onClick={clearLogs} className="h-4 w-4 flex items-center justify-center text-white/30 hover:text-white/60" title="Clear">
          <Trash2 className="h-3 w-3" />
        </button>

        {/* Collapse */}
        <button onClick={onToggle} className="h-4 w-4 flex items-center justify-center text-white/30 hover:text-white/60">
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center h-6 px-2 border-b border-white/[0.04] gap-1">
          <Search className="h-3 w-3 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter logs..."
            className="flex-1 bg-transparent text-xs text-white/80 outline-none placeholder:text-white/20"
            autoFocus
          />
        </div>
      )}

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-[11px]"
        onScroll={(e) => {
          const el = e.currentTarget;
          autoScrollRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
        }}
      >
        {activeTab === 'console' ? (
          filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/20 text-xs">
              No console output
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "flex items-start gap-1.5 px-2 py-0.5 border-b border-white/[0.02] hover:bg-white/[0.02]",
                  log.level === 'error' && "bg-red-500/[0.04]",
                  log.level === 'warn' && "bg-yellow-500/[0.03]"
                )}
              >
                {levelIcon(log.level)}
                <span className={cn(
                  "flex-1 whitespace-pre-wrap break-all leading-4",
                  log.level === 'error' && "text-red-300",
                  log.level === 'warn' && "text-yellow-300",
                  log.level === 'info' && "text-blue-300",
                  !['error', 'warn', 'info'].includes(log.level) && "text-white/70"
                )}>
                  {log.message}
                </span>
                {(log.count || 0) > 1 && (
                  <span className="bg-white/10 text-white/50 px-1 rounded text-[9px] flex-shrink-0">
                    ×{log.count}
                  </span>
                )}
                <span className="text-white/15 text-[9px] flex-shrink-0 tabular-nums">
                  {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )
        ) : (
          networkLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/20 text-xs">
              No network requests
            </div>
          ) : (
            networkLogs.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-2 px-2 py-0.5 border-b border-white/[0.02] hover:bg-white/[0.02]"
              >
                <span className={cn(
                  "font-semibold text-[10px] w-8 flex-shrink-0",
                  req.method === 'GET' ? 'text-green-400' :
                  req.method === 'POST' ? 'text-blue-400' :
                  req.method === 'DELETE' ? 'text-red-400' : 'text-yellow-400'
                )}>
                  {req.method}
                </span>
                <span className={cn("w-8 text-center flex-shrink-0 font-semibold", statusColor(req.status))}>
                  {req.status || '—'}
                </span>
                <span className="flex-1 text-white/60 truncate">{req.url}</span>
                <span className="text-white/25 text-[9px] flex-shrink-0 tabular-nums">
                  {req.duration}ms
                </span>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
