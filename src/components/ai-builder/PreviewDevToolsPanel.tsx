import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trash2, Search, AlertTriangle, Info, XCircle, Globe, Clock, ArrowDown, ArrowUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ConsoleEntry {
  id: string;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  source?: string;
  timestamp: Date;
  count: number;
}

interface NetworkEntry {
  id: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  type: string;
  size: string;
  time: number;
  timestamp: Date;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
}

interface PreviewDevToolsPanelProps {
  open: boolean;
  onClose: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

const levelIcons: Record<string, React.ReactNode> = {
  log: <Info className="h-3 w-3 text-white/30" />,
  info: <Info className="h-3 w-3 text-blue-400" />,
  warn: <AlertTriangle className="h-3 w-3 text-amber-400" />,
  error: <XCircle className="h-3 w-3 text-red-400" />,
  debug: <Info className="h-3 w-3 text-violet-400" />,
};

const levelColors: Record<string, string> = {
  log: 'text-white/70',
  info: 'text-blue-300',
  warn: 'text-amber-300 bg-amber-500/5',
  error: 'text-red-300 bg-red-500/5',
  debug: 'text-violet-300',
};

const statusColor = (status: number) => {
  if (status >= 200 && status < 300) return 'text-emerald-400';
  if (status >= 300 && status < 400) return 'text-blue-400';
  if (status >= 400 && status < 500) return 'text-amber-400';
  if (status >= 500) return 'text-red-400';
  return 'text-white/40';
};

export function PreviewDevToolsPanel({ open, onClose, iframeRef }: PreviewDevToolsPanelProps) {
  const [tab, setTab] = useState<'console' | 'network'>('console');
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [networkLogs, setNetworkLogs] = useState<NetworkEntry[]>([]);
  const [consoleFilter, setConsoleFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<Set<string>>(new Set(['log', 'info', 'warn', 'error', 'debug']));
  const [selectedRequest, setSelectedRequest] = useState<NetworkEntry | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Listen for console/network messages from preview iframe via postMessage
  useEffect(() => {
    if (!open) return;

    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;

      // Support both old ('preview-console') and new ('__CONSOLE_LOG__') message formats
      if (e.data.type === 'preview-console' || e.data.type === '__CONSOLE_LOG__') {
        const { level, message, source } = e.data;
        setConsoleLogs(prev => {
          const last = prev[prev.length - 1];
          if (last && last.message === message && last.level === level) {
            return [...prev.slice(0, -1), { ...last, count: last.count + 1 }];
          }
          return [...prev, {
            id: crypto.randomUUID(),
            level: level || 'log',
            message: String(message),
            source,
            timestamp: new Date(),
            count: 1,
          }].slice(-500);
        });
      }

      // Support both old ('preview-network') and new ('__NETWORK_LOG__') message formats
      if (e.data.type === 'preview-network' || e.data.type === '__NETWORK_LOG__') {
        const { method, url, status, statusText, type, size, time, duration, requestHeaders, responseHeaders, requestBody, responseBody } = e.data;
        setNetworkLogs(prev => [...prev, {
          id: crypto.randomUUID(),
          method: method || 'GET',
          url: url || '',
          status: status || 0,
          statusText: statusText || '',
          type: type || 'fetch',
          size: size || '0 B',
          time: time || duration || 0,
          timestamp: new Date(),
          requestHeaders,
          responseHeaders,
          requestBody,
          responseBody,
        }].slice(-200));
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [open]);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  // Console/network interceptors are now injected at compile time via getCompiledHTML (Phase 4A)
  // No need for manual injection here.

  const filteredConsole = consoleLogs.filter(entry =>
    levelFilter.has(entry.level) &&
    (!consoleFilter || entry.message.toLowerCase().includes(consoleFilter.toLowerCase()))
  );

  const filteredNetwork = networkLogs.filter(entry =>
    !networkFilter || entry.url.toLowerCase().includes(networkFilter.toLowerCase()) || entry.method.toLowerCase().includes(networkFilter.toLowerCase())
  );

  const toggleLevel = (level: string) => {
    setLevelFilter(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level); else next.add(level);
      return next;
    });
  };

  if (!open) return null;

  const errorCount = consoleLogs.filter(l => l.level === 'error').length;
  const warnCount = consoleLogs.filter(l => l.level === 'warn').length;

  return (
    <div className="h-full flex flex-col bg-[#0a0a12] border-l border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between h-9 px-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/70">DevTools</span>
          {errorCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">{errorCount} error{errorCount > 1 ? 's' : ''}</span>
          )}
          {warnCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">{warnCount} warn{warnCount > 1 ? 's' : ''}</span>
          )}
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-white/[0.06] shrink-0">
        <button onClick={() => setTab('console')} className={cn("px-4 py-1.5 text-[11px] font-medium transition-colors border-b-2", tab === 'console' ? 'text-white/80 border-cyan-500' : 'text-white/35 border-transparent hover:text-white/55')}>
          Console
        </button>
        <button onClick={() => setTab('network')} className={cn("px-4 py-1.5 text-[11px] font-medium transition-colors border-b-2", tab === 'network' ? 'text-white/80 border-cyan-500' : 'text-white/35 border-transparent hover:text-white/55')}>
          Network
          {networkLogs.length > 0 && <span className="ml-1 text-white/25">({networkLogs.length})</span>}
        </button>
      </div>

      {/* Console Tab */}
      {tab === 'console' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-white/[0.04] shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
              <input
                value={consoleFilter}
                onChange={e => setConsoleFilter(e.target.value)}
                placeholder="Filter..."
                className="w-full h-6 pl-7 pr-2 text-[11px] bg-white/[0.04] border border-white/[0.06] rounded text-white/70 placeholder:text-white/20 outline-none focus:border-white/[0.12]"
              />
            </div>
            <div className="flex items-center gap-0.5">
              {['error', 'warn', 'info', 'log', 'debug'].map(level => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={cn("h-5 px-1.5 rounded text-[9px] font-medium transition-colors", levelFilter.has(level) ? levelColors[level] : 'text-white/15')}
                >
                  {level}
                </button>
              ))}
            </div>
            <button onClick={() => setConsoleLogs([])} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors" title="Clear">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px]">
            {filteredConsole.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/15 text-xs">No console output</div>
            ) : (
              filteredConsole.map(entry => (
                <div key={entry.id} className={cn("flex items-start gap-2 px-3 py-1 border-b border-white/[0.03] hover:bg-white/[0.02]", levelColors[entry.level])}>
                  <div className="shrink-0 mt-0.5">{levelIcons[entry.level]}</div>
                  <pre className="flex-1 whitespace-pre-wrap break-all text-[11px] leading-relaxed">{entry.message}</pre>
                  {entry.count > 1 && (
                    <span className="shrink-0 text-[9px] bg-white/10 text-white/50 rounded-full px-1.5 py-0.5 font-medium">{entry.count}</span>
                  )}
                  <span className="shrink-0 text-[9px] text-white/15">{entry.timestamp.toLocaleTimeString()}</span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}

      {/* Network Tab */}
      {tab === 'network' && !selectedRequest && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-white/[0.04] shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
              <input
                value={networkFilter}
                onChange={e => setNetworkFilter(e.target.value)}
                placeholder="Filter by URL..."
                className="w-full h-6 pl-7 pr-2 text-[11px] bg-white/[0.04] border border-white/[0.06] rounded text-white/70 placeholder:text-white/20 outline-none focus:border-white/[0.12]"
              />
            </div>
            <button onClick={() => setNetworkLogs([])} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors" title="Clear">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-[60px_1fr_60px_70px_60px] gap-2 px-3 py-1 text-[9px] text-white/25 font-semibold uppercase tracking-wider border-b border-white/[0.04] shrink-0">
            <span>Method</span><span>URL</span><span>Status</span><span>Size</span><span>Time</span>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px]">
            {filteredNetwork.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/15 text-xs">No requests captured</div>
            ) : (
              filteredNetwork.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedRequest(entry)}
                  className="w-full grid grid-cols-[60px_1fr_60px_70px_60px] gap-2 px-3 py-1.5 border-b border-white/[0.03] hover:bg-white/[0.03] text-left transition-colors"
                >
                  <span className="text-violet-400 font-semibold">{entry.method}</span>
                  <span className="text-white/60 truncate">{entry.url.replace(/https?:\/\/[^/]+/, '')}</span>
                  <span className={statusColor(entry.status)}>{entry.status || '—'}</span>
                  <span className="text-white/40">{entry.size}</span>
                  <span className="text-white/30">{entry.time}ms</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Network detail view */}
      {tab === 'network' && selectedRequest && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04] shrink-0">
            <button onClick={() => setSelectedRequest(null)} className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">← Back</button>
            <span className="text-violet-400 font-semibold text-[11px]">{selectedRequest.method}</span>
            <span className={cn("text-[11px] font-medium", statusColor(selectedRequest.status))}>{selectedRequest.status} {selectedRequest.statusText}</span>
            <span className="text-white/30 text-[10px] ml-auto">{selectedRequest.time}ms</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 text-[11px] font-mono space-y-3">
            <div>
              <div className="text-white/40 font-semibold uppercase text-[9px] tracking-wider mb-1">URL</div>
              <div className="text-white/60 break-all">{selectedRequest.url}</div>
            </div>
            {selectedRequest.requestHeaders && (
              <div>
                <div className="text-white/40 font-semibold uppercase text-[9px] tracking-wider mb-1">Request Headers</div>
                {Object.entries(selectedRequest.requestHeaders).map(([k, v]) => (
                  <div key={k} className="text-white/50"><span className="text-cyan-400/60">{k}:</span> {v}</div>
                ))}
              </div>
            )}
            {selectedRequest.responseBody && (
              <div>
                <div className="text-white/40 font-semibold uppercase text-[9px] tracking-wider mb-1">Response Body</div>
                <pre className="text-white/50 whitespace-pre-wrap break-all bg-white/[0.03] p-2 rounded max-h-60 overflow-auto">{selectedRequest.responseBody}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
