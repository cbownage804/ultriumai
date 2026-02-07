import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Terminal, Maximize2, Minimize2, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

const HELP_TEXT = `Available commands:
  help          Show this help
  clear         Clear terminal
  ls            List project files
  cat <file>    Show file contents
  echo <text>   Print text
  pwd           Print working directory
  date          Show current date
  whoami        Current user
  npm run dev   Simulated dev server
  npm run build Simulated build
  exit          Close terminal`;

export function TerminalEmulator({ open, onClose, projectName }: TerminalEmulatorProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '1', type: 'system', text: `AI Studio Terminal v1.0.0 — ${projectName || 'project'}`, timestamp: new Date() },
    { id: '2', type: 'system', text: 'Type "help" for available commands.', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addLine('input', `$ ${trimmed}`);
    setHistory(prev => [trimmed, ...prev].slice(0, 50));
    setHistoryIndex(-1);

    const [command, ...args] = trimmed.split(/\s+/);

    switch (command.toLowerCase()) {
      case 'help':
        addLine('output', HELP_TEXT);
        break;
      case 'clear':
        setLines([]);
        break;
      case 'ls':
        addLine('output', 'index.html  styles.css  app.js  components/  package.json');
        break;
      case 'cat':
        if (!args[0]) addLine('error', 'cat: missing file operand');
        else addLine('output', `// Contents of ${args[0]}\n// (simulated — use the Code tab for actual files)`);
        break;
      case 'echo':
        addLine('output', args.join(' '));
        break;
      case 'pwd':
        addLine('output', `/home/user/${projectName || 'project'}`);
        break;
      case 'date':
        addLine('output', new Date().toString());
        break;
      case 'whoami':
        addLine('output', 'developer');
        break;
      case 'npm':
        if (args[0] === 'run' && args[1] === 'dev') {
          addLine('system', '> vite');
          addLine('output', '  VITE v5.4.0  ready in 280ms');
          addLine('output', '  ➜  Local:   http://localhost:3000/');
          addLine('output', '  ➜  Network: http://192.168.1.42:3000/');
        } else if (args[0] === 'run' && args[1] === 'build') {
          addLine('system', '> vite build');
          addLine('output', 'vite v5.4.0 building for production...');
          addLine('output', '✓ 42 modules transformed.');
          addLine('output', 'dist/index.html          0.45 kB │ gzip: 0.29 kB');
          addLine('output', 'dist/assets/index.js    145.23 kB │ gzip: 47.12 kB');
          addLine('output', 'dist/assets/index.css    12.34 kB │ gzip:  3.21 kB');
          addLine('output', '✓ built in 1.23s');
        } else if (args[0] === 'install' || args[0] === 'i') {
          addLine('system', 'Installing dependencies...');
          setTimeout(() => addLine('output', 'added 42 packages in 2.3s'), 500);
        } else {
          addLine('error', `npm: unknown command "${args.join(' ')}"`);
        }
        break;
      case 'exit':
        onClose();
        break;
      case 'git':
        if (args[0] === 'status') {
          addLine('output', 'On branch main\nnothing to commit, working tree clean');
        } else if (args[0] === 'log') {
          addLine('output', 'commit abc1234 (HEAD -> main)\nAuthor: developer\nDate: ' + new Date().toLocaleDateString() + '\n\n    Latest changes');
        } else {
          addLine('output', `git ${args.join(' ')} — simulated`);
        }
        break;
      default:
        addLine('error', `command not found: ${command}`);
    }
  }, [addLine, projectName, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
            <div className="h-2 w-2 rounded-full bg-emerald-400/40" />
            <div className="h-2 w-2 rounded-full bg-amber-400/20" />
            <div className="h-2 w-2 rounded-full bg-red-400/20" />
          </div>
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
          <span className="text-emerald-400/60">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white/80 outline-none caret-emerald-400"
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
