import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Terminal, Maximize2, Minimize2, Copy, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp: Date;
}

interface TerminalEmulatorProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
}

const LOCAL_COMMANDS = new Set(['help', 'clear', 'exit']);

const HELP_TEXT = `Available commands:
  help          Show this help
  clear         Clear terminal
  ls            List files
  cat <file>    Show file contents
  echo <text>   Print text
  pwd           Print working directory
  date          Show current date
  whoami        Current user
  node --eval   Execute JS expression
  npx           Run npx commands
  grep          Search text
  exit          Close terminal

Commands run in a secure sandboxed environment.`;

export function TerminalEmulator({ open, onClose, projectName }: TerminalEmulatorProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '1', type: 'system', text: `AI Studio Terminal v2.0.0 — ${projectName || 'project'}`, timestamp: new Date() },
    { id: '2', type: 'system', text: 'Type "help" for available commands. Commands execute in a secure sandbox.', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const addLine = useCallback((type: TerminalLine['type'], text: string) => {
    setLines(prev => [...prev, { id: crypto.randomUUID(), type, text, timestamp: new Date() }]);
  }, []);

  const executeRemote = useCallback(async (command: string) => {
    setIsExecuting(true);
    try {
      const { data, error } = await supabase.functions.invoke('terminal-exec', {
        body: { command },
      });

      if (error) {
        addLine('error', `Error: ${error.message}`);
        return;
      }

      if (!data.success) {
        addLine('error', data.error || 'Command failed');
        if (data.stderr) addLine('error', data.stderr);
        return;
      }

      if (data.stdout) addLine('output', data.stdout);
      if (data.stderr) addLine('error', data.stderr);
      if (!data.stdout && !data.stderr) addLine('system', '(no output)');
    } catch (err) {
      addLine('error', `Failed to execute: ${(err as Error).message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [addLine]);

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addLine('input', `$ ${trimmed}`);
    setHistory(prev => [trimmed, ...prev].slice(0, 50));
    setHistoryIndex(-1);

    const [command] = trimmed.split(/\s+/);
    const lowerCmd = command.toLowerCase();

    // Handle local-only commands
    if (lowerCmd === 'help') {
      addLine('output', HELP_TEXT);
      return;
    }
    if (lowerCmd === 'clear') {
      setLines([]);
      return;
    }
    if (lowerCmd === 'exit') {
      onClose();
      return;
    }

    // Everything else goes to the remote sandbox
    executeRemote(trimmed);
  }, [addLine, onClose, executeRemote]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExecuting) {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  if (!open) return null;

  return (
    <div className={cn(
      "border-t border-white/[0.06] bg-[#0a0a10] flex flex-col transition-all duration-200",
      isExpanded ? "h-80" : "h-48"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-8 bg-white/[0.02] border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Terminal</span>
          <div className="flex gap-1 ml-2">
            <div className={cn("h-2 w-2 rounded-full", isExecuting ? "bg-amber-400/60 animate-pulse" : "bg-emerald-400/40")} />
            <div className="h-2 w-2 rounded-full bg-amber-400/20" />
            <div className="h-2 w-2 rounded-full bg-red-400/20" />
          </div>
          {isExecuting && <span className="text-[8px] text-amber-400/60 ml-1">executing...</span>}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => { navigator.clipboard.writeText(lines.map(l => l.text).join('\n')); toast.success('Copied'); }} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors">
            <Copy className="h-2.5 w-2.5" />
          </button>
          <button onClick={() => setLines([])} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors">
            <Trash2 className="h-2.5 w-2.5" />
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors">
            {isExpanded ? <Minimize2 className="h-2.5 w-2.5" /> : <Maximize2 className="h-2.5 w-2.5" />}
          </button>
          <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors">
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-2 font-mono text-[11px] leading-5" onClick={() => inputRef.current?.focus()}>
        {lines.map(line => (
          <div key={line.id} className={cn(
            "whitespace-pre-wrap",
            line.type === 'input' && 'text-white/60',
            line.type === 'output' && 'text-white/50',
            line.type === 'error' && 'text-red-400/80',
            line.type === 'system' && 'text-cyan-400/60',
          )}>
            {line.text}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center gap-1">
          {isExecuting ? (
            <Loader2 className="h-3 w-3 text-amber-400/60 animate-spin" />
          ) : (
            <span className="text-emerald-400/60">$</span>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white/80 outline-none caret-emerald-400"
            autoFocus
            spellCheck={false}
            disabled={isExecuting}
            placeholder={isExecuting ? 'Executing...' : ''}
          />
        </div>
      </div>
    </div>
  );
}
