import { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp, Zap, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PreviewError {
  id: string;
  message: string;
  source?: string;
  line?: number;
  timestamp: Date;
  type: 'error' | 'warning';
}

interface ErrorConsoleProps {
  errors: PreviewError[];
  onClear: () => void;
  onFixRequest: (error: PreviewError) => void;
}

export function ErrorConsole({ errors, onClear, onFixRequest }: ErrorConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (errors.length === 0) return null;

  const errorCount = errors.filter(e => e.type === 'error').length;
  const warnCount = errors.filter(e => e.type === 'warning').length;

  return (
    <div className="border-t border-red-500/20 bg-red-500/[0.03]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 h-8 hover:bg-red-500/[0.05] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="h-3.5 w-3.5 text-red-400" />
          <span className="text-[11px] font-medium text-red-400">
            {errorCount > 0 && `${errorCount} error${errorCount > 1 ? 's' : ''}`}
            {errorCount > 0 && warnCount > 0 && ' · '}
            {warnCount > 0 && `${warnCount} warning${warnCount > 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5"
          >
            <X className="h-3 w-3" />
          </button>
          {isExpanded ? <ChevronDown className="h-3 w-3 text-white/30" /> : <ChevronUp className="h-3 w-3 text-white/30" />}
        </div>
      </button>

      {/* Error list */}
      {isExpanded && (
        <div className="max-h-32 overflow-auto">
          {errors.map((err) => (
            <div
              key={err.id}
              className={cn(
                "flex items-start gap-2 px-3 py-1.5 border-t",
                err.type === 'error' ? 'border-red-500/10' : 'border-amber-500/10'
              )}
            >
              <AlertTriangle className={cn(
                "h-3 w-3 shrink-0 mt-0.5",
                err.type === 'error' ? 'text-red-400' : 'text-amber-400'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/70 font-mono truncate">{err.message}</p>
                {err.source && (
                  <p className="text-[9px] text-white/30 font-mono">
                    {err.source}{err.line ? `:${err.line}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => onFixRequest(err)}
                className="shrink-0 flex items-center gap-1 text-[10px] text-cyan-400/70 hover:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15 rounded px-1.5 py-0.5 transition-colors"
              >
                <Zap className="h-2.5 w-2.5" />
                Fix
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
