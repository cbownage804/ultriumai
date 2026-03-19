import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Trash2, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, Wrench, Globe, Bug, DollarSign, ScrollText, GripHorizontal, Play } from 'lucide-react';
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

interface TerminalEntry {
  id: string;
  type: 'input' | 'output' | 'system';
  text: string;
  timestamp: Date;
}

interface ConsolePanelProps {
  open: boolean;
  onToggle: () => void;
  onFixError?: (errorMessage: string) => void;
  onNavigateToFile?: (path: string, line?: number) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  fileCount?: number;
}

type ActiveTab = 'console' | 'problems' | 'network' | 'terminal' | 'output' | 'logs';

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  timestamp: Date;
}

interface OutputEntry {
  id: string;
  text: string;
  type: 'build' | 'deploy' | 'info';
  timestamp: Date;
}

export function ConsolePanel({ open, onToggle, onFixError, onNavigateToFile, iframeRef, fileCount }: ConsolePanelProps) {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [networkEntries, setNetworkEntries] = useState<NetworkEntry[]>([]);
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [outputEntries, setOutputEntries] = useState<OutputEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'log'>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('console');
  const [terminalInput, setTerminalInput] = useState('');
  const [panelHeight, setPanelHeight] = useState(192);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // Drag to resize
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = panelHeight;
  }, [panelHeight]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const delta = dragStartY.current - e.clientY;
      setPanelHeight(Math.max(120, Math.min(500, dragStartHeight.current + delta)));
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__CONSOLE_LOG__') {
        setEntries(prev => [...prev.slice(-199), {
          id: crypto.randomUUID(), type: e.data.level || 'log', message: e.data.message,
          source: e.data.source, line: e.data.line, timestamp: new Date(),
        }]);
      }
      if (e.data?.type === '__PREVIEW_ERROR__') {
        setEntries(prev => [...prev.slice(-199), {
          id: crypto.randomUUID(), type: e.data.isWarning ? 'warn' : 'error', message: e.data.message,
          source: e.data.source, line: e.data.line, timestamp: new Date(),
        }]);
      }
      if (e.data?.type === '__NETWORK_LOG__') {
        setNetworkEntries(prev => [...prev.slice(-99), {
          id: crypto.randomUUID(), method: e.data.method || 'GET', url: e.data.url || '',
          status: e.data.status || 0, duration: e.data.duration || 0, timestamp: new Date(),
        }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Build output when file count changes
  const prevFileCountRef = useRef(fileCount);
  useEffect(() => {
    if (fileCount !== undefined && prevFileCountRef.current !== undefined && fileCount !== prevFileCountRef.current && fileCount > 0) {
      const dur = (Math.random() * 0.4 + 0.1).toFixed(1);
      const msg = `[vite] hot reload: ${fileCount} module${fileCount !== 1 ? 's' : ''} updated. (${dur}s)`;
      setTerminalEntries(prev => [...prev.slice(-49), { id: crypto.randomUUID(), type: 'system', text: msg, timestamp: new Date() }]);
      setOutputEntries(prev => [...prev.slice(-49), { id: crypto.randomUUID(), type: 'build', text: msg, timestamp: new Date() }]);
    }
    prevFileCountRef.current = fileCount;
  }, [fileCount]);

  // Simulated backend logs
  useEffect(() => {
    const messages = [
      { level: 'info' as const, msg: 'Request completed successfully', src: 'edge-fn' },
      { level: 'info' as const, msg: 'User session validated', src: 'auth' },
      { level: 'debug' as const, msg: 'Query executed in 12ms', src: 'db' },
      { level: 'warn' as const, msg: 'Rate limit approaching threshold', src: 'edge-fn' },
      { level: 'info' as const, msg: 'File uploaded: 2.4KB', src: 'storage' },
    ];
    const interval = setInterval(() => {
      if (Math.random() > 0.6) return;
      const entry = messages[Math.floor(Math.random() * messages.length)];
      setLogEntries(prev => [...prev.slice(-99), { id: crypto.randomUUID(), level: entry.level, message: entry.msg, source: entry.src, timestamp: new Date() }]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTerminalCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    setTerminalEntries(prev => [...prev, { id: crypto.randomUUID(), type: 'input', text: `$ ${cmd}`, timestamp: new Date() }]);
    let output = '';
    switch (trimmed) {
      case 'clear': setTerminalEntries([]); return;
      case 'help': output = 'Available: clear, help, build, dev, ls, whoami'; break;
      case 'build': output = `✓ Build complete. ${fileCount || 0} files compiled.`; break;
      case 'dev': output = '✓ Dev server running at http://localhost:5173'; break;
      case 'ls': output = `${fileCount || 0} files in project`; break;
      case 'whoami': output = 'ultrium-ai-builder'; break;
      default: output = `command not found: ${trimmed}. Type "help".`;
    }
    setTerminalEntries(prev => [...prev, { id: crypto.randomUUID(), type: 'output', text: output, timestamp: new Date() }]);
  }, [fileCount]);

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

  const tabs: { id: ActiveTab; label: string; icon: typeof Terminal; count?: number }[] = [
    { id: 'console', label: 'Console', icon: Terminal },
    { id: 'problems', label: 'Problems', icon: Bug, count: problemEntries.length },
    { id: 'output', label: 'Output', icon: Play, count: outputEntries.length },
    { id: 'network', label: 'Network', icon: Globe, count: networkEntries.length },
    { id: 'terminal', label: 'Terminal', icon: DollarSign },
    { id: 'logs', label: 'Logs', icon: ScrollText, count: logEntries.length },
  ];

  return (
    <div className={cn("border-t border-white/[0.06] bg-[#0a0a10] transition-all flex flex-col", open ? '' : 'h-8')} style={open ? { height: panelHeight } : undefined}>
      {/* Drag handle + toggle bar */}
      <div className="relative">
        {open && (
          <div
            onMouseDown={handleDragStart}
            className={cn(
              "absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-10 flex items-center justify-center",
              isDragging ? "bg-cyan-500/20" : "hover:bg-white/[0.04]"
            )}
          >
            <GripHorizontal className="h-2.5 w-2.5 text-white/10" />
          </div>
        )}
        <button onClick={onToggle} className="w-full flex items-center justify-between px-3 h-8 hover:bg-white/[0.03] transition-colors shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="h-3 w-3 text-white/30" />
            <span className="text-[10px] font-medium text-white/40">Panel</span>
            {errorCount > 0 && <Badge className="h-4 text-[9px] px-1.5 bg-red-500/10 text-red-400 border-red-500/20">{errorCount}</Badge>}
            {warnCount > 0 && <Badge className="h-4 text-[9px] px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">{warnCount}</Badge>}
          </div>
          {open ? <ChevronDown className="h-3 w-3 text-white/20" /> : <ChevronUp className="h-3 w-3 text-white/20" />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Tabs */}
          <div className="flex items-center gap-0.5 px-2 h-7 border-b border-white/[0.04] shrink-0">
            {tabs.map(tab => (
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
                  <button key={f} onClick={() => setFilter(f)} className={cn("h-5 px-1.5 rounded text-[9px] transition-colors", filter === f ? "bg-white/10 text-white/70" : "text-white/25 hover:text-white/50")}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </>
            )}

            <div className="flex-1" />
            <button onClick={() => { setEntries([]); setNetworkEntries([]); setTerminalEntries([]); setLogEntries([]); setOutputEntries([]); }} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors" title="Clear all">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          {/* Content */}
          {activeTab === 'terminal' ? (
            <div className="flex flex-col flex-1 min-h-0">
              <ScrollArea className="flex-1">
                <div className="p-1.5 space-y-px font-mono text-[10px]">
                  {terminalEntries.length === 0 ? (
                    <div className="text-white/15 py-2 px-2">Welcome to the terminal. Type "help" for commands.</div>
                  ) : (
                    terminalEntries.map(entry => (
                      <div key={entry.id} className={cn("px-2 py-0.5 leading-4", entry.type === 'input' ? "text-cyan-400/70" : entry.type === 'system' ? "text-amber-400/60" : "text-white/40")}>
                        {entry.text}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-1 px-2 py-1 border-t border-white/[0.04] shrink-0">
                <span className="text-[10px] text-cyan-400/50 font-mono">$</span>
                <input
                  ref={terminalInputRef}
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && terminalInput.trim()) {
                      handleTerminalCommand(terminalInput);
                      setTerminalInput('');
                    }
                  }}
                  className="flex-1 bg-transparent text-[10px] text-white/60 font-mono outline-none placeholder:text-white/15"
                  placeholder="Type a command..."
                />
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              <div ref={scrollRef} className="p-1.5 space-y-px font-mono text-[10px]">
                {activeTab === 'console' && (
                  filteredEntries.length === 0 ? (
                    <div className="text-center text-white/15 py-6">No console output</div>
                  ) : filteredEntries.map(entry => (
                    <div key={entry.id} className={cn("flex items-start gap-1.5 px-2 py-1 rounded group", entry.type === 'error' && "bg-red-500/5", entry.type === 'warn' && "bg-amber-500/5")}>
                      {typeIcon(entry.type)}
                      <span className={cn("flex-1 break-all leading-4", entry.type === 'error' ? "text-red-300/70" : entry.type === 'warn' ? "text-amber-300/70" : "text-white/40")}>{entry.message}</span>
                      {entry.source && (
                        <button
                          onClick={() => onNavigateToFile?.(entry.source!, entry.line)}
                          className="text-[8px] text-white/15 shrink-0 hover:text-cyan-400 hover:underline cursor-pointer transition-colors"
                          title={`Open ${entry.source}${entry.line ? `:${entry.line}` : ''}`}
                        >
                          {entry.source}{entry.line ? `:${entry.line}` : ''}
                        </button>
                      )}
                      <span className="text-[8px] text-white/10 shrink-0">{entry.timestamp.toLocaleTimeString()}</span>
                      {entry.type === 'error' && onFixError && (
                        <button onClick={() => onFixError(`Fix this console error: "${entry.message}"`)} className="opacity-0 group-hover:opacity-100 h-4 px-1.5 rounded bg-cyan-500/10 text-cyan-400 text-[8px] hover:bg-cyan-500/20 transition-all shrink-0 flex items-center gap-0.5">
                          <Wrench className="h-2.5 w-2.5" />Fix
                        </button>
                      )}
                    </div>
                  ))
                )}
                {activeTab === 'problems' && (
                  problemEntries.length === 0 ? (
                    <div className="text-center text-white/15 py-6 flex flex-col items-center gap-1">
                      <Bug className="h-4 w-4 text-white/10" />
                      <span>No problems detected</span>
                    </div>
                  ) : problemEntries.map(entry => (
                    <div key={entry.id} className={cn("flex items-start gap-1.5 px-2 py-1 rounded group", entry.type === 'error' ? "bg-red-500/5" : "bg-amber-500/5")}>
                      {typeIcon(entry.type)}
                      <span className={cn("flex-1 break-all leading-4", entry.type === 'error' ? "text-red-300/70" : "text-amber-300/70")}>{entry.message}</span>
                      {entry.source && <span className="text-[8px] text-white/15 shrink-0">{entry.source}{entry.line ? `:${entry.line}` : ''}</span>}
                      {entry.type === 'error' && onFixError && (
                        <button onClick={() => onFixError(`Fix this error: "${entry.message}"`)} className="opacity-0 group-hover:opacity-100 h-4 px-1.5 rounded bg-cyan-500/10 text-cyan-400 text-[8px] hover:bg-cyan-500/20 transition-all shrink-0 flex items-center gap-0.5">
                          <Wrench className="h-2.5 w-2.5" />Fix
                        </button>
                      )}
                    </div>
                  ))
                )}
                {activeTab === 'output' && (
                  outputEntries.length === 0 ? (
                    <div className="text-center text-white/15 py-6 flex flex-col items-center gap-1">
                      <Play className="h-4 w-4 text-white/10" />
                      <span>No build output</span>
                    </div>
                  ) : outputEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.02]">
                      <span className={cn("text-[9px] font-bold w-10 shrink-0 uppercase", entry.type === 'build' ? "text-emerald-400" : entry.type === 'deploy' ? "text-violet-400" : "text-white/30")}>{entry.type}</span>
                      <span className="flex-1 text-white/40 truncate">{entry.text}</span>
                      <span className="text-[8px] text-white/15 shrink-0">{entry.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
                {activeTab === 'network' && (
                  networkEntries.length === 0 ? (
                    <div className="text-center text-white/15 py-6 flex flex-col items-center gap-1">
                      <Globe className="h-4 w-4 text-white/10" />
                      <span>No network requests captured</span>
                    </div>
                  ) : networkEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.02]">
                      <span className="text-[9px] font-bold text-white/30 w-8 shrink-0">{entry.method}</span>
                      <span className={cn("text-[9px] font-bold w-6 shrink-0", statusColor(entry.status))}>{entry.status || '...'}</span>
                      <span className="flex-1 text-white/40 truncate">{entry.url}</span>
                      <span className="text-[8px] text-white/20 shrink-0">{entry.duration}ms</span>
                    </div>
                  ))
                )}
                {activeTab === 'logs' && (
                  logEntries.length === 0 ? (
                    <div className="text-center text-white/15 py-6 flex flex-col items-center gap-1">
                      <ScrollText className="h-4 w-4 text-white/10" />
                      <span>No backend logs</span>
                    </div>
                  ) : logEntries.map(entry => (
                    <div key={entry.id} className={cn("flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.02]", entry.level === 'error' && "bg-red-500/5", entry.level === 'warn' && "bg-amber-500/5")}>
                      <span className={cn("text-[9px] font-bold w-10 shrink-0 uppercase",
                        entry.level === 'error' ? "text-red-400" : entry.level === 'warn' ? "text-amber-400" : entry.level === 'debug' ? "text-white/20" : "text-emerald-400"
                      )}>{entry.level}</span>
                      <span className="text-[9px] text-violet-400/60 w-14 shrink-0 font-mono">{entry.source}</span>
                      <span className="flex-1 text-white/40 truncate text-[10px]">{entry.message}</span>
                      <span className="text-[8px] text-white/15 shrink-0">{entry.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
