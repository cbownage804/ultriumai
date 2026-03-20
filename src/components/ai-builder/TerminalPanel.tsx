/**
 * Wave 15: Integrated Terminal Panel
 * Shows build logs, compilation output, and supports simulated commands.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Terminal, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'info' | 'success';
  content: string;
  timestamp: Date;
}

interface TerminalPanelProps {
  open: boolean;
  onClose: () => void;
  buildLogs: TerminalLine[];
  onCommand?: (cmd: string) => void;
}

export function TerminalPanel({ open, onClose, buildLogs, onCommand }: TerminalPanelProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [localLines, setLocalLines] = useState<TerminalLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Merge build logs with local terminal lines
  const allLines = [...buildLogs, ...localLines].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allLines.length]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    setLocalLines(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      content,
      timestamp: new Date(),
    }]);
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addLine('input', `$ ${trimmed}`);
    setHistory(prev => [...prev.slice(-50), trimmed]);
    setHistoryIndex(-1);

    // Built-in commands
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
      case 'clear':
        setLocalLines([]);
        break;
      case 'help':
        addLine('info', 'Available commands:');
        addLine('info', '  clear       — Clear terminal');
        addLine('info', '  help        — Show this help');
        addLine('info', '  files       — List project files');
        addLine('info', '  npm install — Add a package (simulated)');
        addLine('info', '  build       — Show build status');
        addLine('info', '  env         — Show environment info');
        break;
      case 'npm':
        if (parts[1] === 'install' || parts[1] === 'i') {
          const pkg = parts[2];
          if (pkg) {
            addLine('info', `📦 Adding ${pkg} to project...`);
            onCommand?.(`npm install ${pkg}`);
            setTimeout(() => addLine('success', `✓ ${pkg} added successfully`), 500);
          } else {
            addLine('info', '📦 Installing dependencies...');
            setTimeout(() => addLine('success', '✓ Dependencies installed'), 800);
          }
        } else {
          addLine('error', `Unknown npm command: ${parts[1]}`);
        }
        break;
      case 'build':
        addLine('info', '🔨 Build status: Check the preview panel for compilation status');
        break;
      case 'env':
        addLine('info', 'Environment: Browser Sandbox (Vite + esbuild-wasm)');
        addLine('info', 'Runtime: React 18 + TypeScript 5');
        addLine('info', 'Styling: Tailwind CSS 3');
        break;
      case 'files':
        onCommand?.('list-files');
        break;
      default:
        addLine('error', `Command not found: ${command}. Type 'help' for available commands.`);
    }
  }, [addLine, onCommand]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  if (!open) return null;

  const lineColors: Record<TerminalLine['type'], string> = {
    input: 'text-blue-400',
    output: 'text-zinc-300',
    error: 'text-red-400',
    info: 'text-zinc-500',
    success: 'text-emerald-400',
  };

  return (
    <div className="border-t border-white/[0.06] bg-[#0a0a0a] flex flex-col" style={{ height: 200 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-medium">Terminal</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-600">{allLines.length} lines</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLocalLines([])}
            className="p-1 rounded hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs space-y-0.5">
        {allLines.length === 0 && (
          <div className="text-zinc-600 py-4 text-center">
            Type 'help' for available commands
          </div>
        )}
        {allLines.map(line => (
          <div key={line.id} className={cn('whitespace-pre-wrap break-all', lineColors[line.type])}>
            {line.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/[0.06]">
        <span className="text-emerald-400 text-xs font-mono">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-zinc-200 placeholder:text-zinc-600"
          placeholder="Type a command..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
