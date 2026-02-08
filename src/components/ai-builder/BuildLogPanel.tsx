import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Trash2, ChevronUp, ChevronDown, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BuildLogEntry {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'step';
  message: string;
  timestamp: Date;
  duration?: number;
}

interface BuildLogPanelProps {
  entries: BuildLogEntry[];
  isBuilding: boolean;
  onClear: () => void;
}

export function BuildLogPanel({ entries, isBuilding, onClear }: BuildLogPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const viewport = el.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      const target = viewport || el;
      requestAnimationFrame(() => { target.scrollTop = target.scrollHeight; });
    }
  }, [entries]);

  const getIcon = (type: BuildLogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />;
      case 'error': return <XCircle className="h-3 w-3 text-red-400 shrink-0" />;
      case 'warning': return <Clock className="h-3 w-3 text-amber-400 shrink-0" />;
      case 'step': return <Loader2 className="h-3 w-3 text-cyan-400 animate-spin shrink-0" />;
      default: return <span className="h-3 w-3 text-white/20 shrink-0 text-[10px] leading-3 text-center">›</span>;
    }
  };

  const getColor = (type: BuildLogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400/80';
      case 'error': return 'text-red-400/80';
      case 'warning': return 'text-amber-400/80';
      case 'step': return 'text-cyan-400/80';
      default: return 'text-white/40';
    }
  };

  return (
    <div className="border-t border-white/[0.06] bg-[#0a0a10]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 h-7 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-white/30" />
          <span className="text-[10px] font-medium text-white/40">Build Log</span>
          {isBuilding && (
            <div className="flex items-center gap-1">
              <Loader2 className="h-2.5 w-2.5 text-cyan-400 animate-spin" />
              <span className="text-[9px] text-cyan-400/60">Building...</span>
            </div>
          )}
          {entries.length > 0 && (
            <span className="text-[9px] text-white/15 font-mono">{entries.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {entries.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="h-4 w-4 rounded flex items-center justify-center text-white/15 hover:text-white/40 transition-colors"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          )}
          {isExpanded ? <ChevronDown className="h-3 w-3 text-white/20" /> : <ChevronUp className="h-3 w-3 text-white/20" />}
        </div>
      </button>

      {isExpanded && entries.length > 0 && (
        <ScrollArea className="max-h-40" ref={scrollRef}>
          <div className="px-2 pb-2 space-y-px font-mono text-[10px]">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-start gap-1.5 px-1.5 py-0.5 rounded hover:bg-white/[0.02]">
                {getIcon(entry.type)}
                <span className="text-[8px] text-white/15 w-14 shrink-0">
                  {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={cn("flex-1 leading-4", getColor(entry.type))}>
                  {entry.message}
                </span>
                {entry.duration !== undefined && (
                  <span className="text-[8px] text-white/15 shrink-0">{entry.duration}ms</span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
