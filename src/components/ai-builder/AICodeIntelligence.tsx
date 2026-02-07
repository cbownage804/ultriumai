import { useState, useCallback } from 'react';
import { X, Sparkles, Lightbulb, AlertTriangle, Wrench, ChevronRight, Copy, Check, Brain, Zap, Bug, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface CodeSuggestion {
  id: string;
  type: 'autocomplete' | 'error' | 'refactor' | 'hint';
  title: string;
  description: string;
  code?: string;
  filePath?: string;
  line?: number;
  severity?: 'info' | 'warning' | 'error';
  timestamp: Date;
}

interface AICodeIntelligenceProps {
  open: boolean;
  onClose: () => void;
  suggestions: CodeSuggestion[];
  onApplySuggestion: (suggestion: CodeSuggestion) => void;
  onDismiss: (id: string) => void;
  onRefresh: () => void;
  activeFilePath?: string | null;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/10 transition-colors"
    >
      {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
    </button>
  );
}

const TYPE_CONFIG = {
  autocomplete: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Suggestion' },
  error: { icon: Bug, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Error Fix' },
  refactor: { icon: Wrench, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', label: 'Refactor' },
  hint: { icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Hint' },
};

export function AICodeIntelligence({ open, onClose, suggestions, onApplySuggestion, onDismiss, onRefresh, activeFilePath }: AICodeIntelligenceProps) {
  const [filter, setFilter] = useState<'all' | 'autocomplete' | 'error' | 'refactor' | 'hint'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === 'all' ? suggestions : suggestions.filter(s => s.type === filter);
  const fileSuggestions = activeFilePath ? filtered.filter(s => !s.filePath || s.filePath === activeFilePath) : filtered;

  if (!open) return null;

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-white/80">Code Intelligence</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onRefresh} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <RefreshCw className="h-2.5 w-2.5" />
          </button>
          <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.04] shrink-0">
        {(['all', 'error', 'refactor', 'hint', 'autocomplete'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "h-5 px-2 rounded text-[9px] transition-colors",
              filter === f ? "bg-white/10 text-white/70" : "text-white/25 hover:text-white/50"
            )}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Suggestions list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {fileSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-5 w-5 text-white/10 mb-2" />
              <p className="text-[11px] text-white/25">No suggestions yet</p>
              <p className="text-[9px] text-white/15 mt-1">Write some code and I'll analyze it</p>
            </div>
          ) : (
            fileSuggestions.map(suggestion => {
              const config = TYPE_CONFIG[suggestion.type];
              const Icon = config.icon;
              const isExpanded = expandedId === suggestion.id;

              return (
                <div
                  key={suggestion.id}
                  className={cn(
                    "rounded-lg border transition-all",
                    config.border,
                    isExpanded ? "bg-white/[0.03]" : "bg-white/[0.01] hover:bg-white/[0.02]"
                  )}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                    className="w-full flex items-start gap-2 px-2.5 py-2 text-left"
                  >
                    <div className={cn("h-5 w-5 rounded flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                      <Icon className={cn("h-3 w-3", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-[9px] font-medium uppercase tracking-wider", config.color)}>{config.label}</span>
                        {suggestion.line && (
                          <span className="text-[8px] text-white/15 font-mono">L{suggestion.line}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70 mt-0.5 leading-snug">{suggestion.title}</p>
                    </div>
                    <ChevronRight className={cn("h-3 w-3 text-white/15 shrink-0 mt-1 transition-transform", isExpanded && "rotate-90")} />
                  </button>

                  {isExpanded && (
                    <div className="px-2.5 pb-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <p className="text-[10px] text-white/40 leading-relaxed">{suggestion.description}</p>
                      
                      {suggestion.code && (
                        <div className="relative">
                          <div className="flex items-center justify-between px-2 py-1 bg-black/30 border border-white/[0.06] rounded-t-md">
                            <span className="text-[8px] text-white/20 font-mono">suggested fix</span>
                            <CopyBtn text={suggestion.code} />
                          </div>
                          <pre className="px-2 py-1.5 bg-black/20 border border-t-0 border-white/[0.06] rounded-b-md overflow-x-auto">
                            <code className="text-[10px] font-mono text-white/60 leading-4">{suggestion.code}</code>
                          </pre>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onApplySuggestion(suggestion)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-medium hover:bg-cyan-500/20 transition-colors"
                        >
                          <Sparkles className="h-2.5 w-2.5" /> Apply
                        </button>
                        <button
                          onClick={() => onDismiss(suggestion.id)}
                          className="px-2.5 py-1 rounded-md text-white/30 text-[10px] hover:text-white/50 hover:bg-white/5 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Summary footer */}
      <div className="px-3 py-1.5 border-t border-white/[0.06] text-[9px] text-white/20 flex items-center gap-2 shrink-0">
        <span>{suggestions.filter(s => s.type === 'error').length} errors</span>
        <span>·</span>
        <span>{suggestions.filter(s => s.type === 'refactor').length} refactors</span>
        <span>·</span>
        <span>{suggestions.filter(s => s.type === 'hint').length} hints</span>
      </div>
    </div>
  );
}
