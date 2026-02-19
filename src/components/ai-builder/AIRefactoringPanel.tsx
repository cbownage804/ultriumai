/**
 * AI Refactoring Panel — Phase 154
 */
import { X, RefreshCw, Trash2, Zap, AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { RefactorSuggestion } from '@/hooks/useAIRefactoring';

interface Props {
  suggestions: RefactorSuggestion[];
  isAnalyzing: boolean;
  stats: { total: number; errors: number; warnings: number; info: number };
  onAnalyze: () => void;
  onApplyRefactor: (suggestion: RefactorSuggestion) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const SEV_ICON = { error: XCircle, warning: AlertTriangle, info: Info };
const SEV_COLOR = { error: 'text-red-400', warning: 'text-amber-400', info: 'text-blue-400' };

export function AIRefactoringPanel({ suggestions, isAnalyzing, stats, onAnalyze, onApplyRefactor, onDismiss, onClearAll, onClose }: Props) {
  const pending = suggestions.filter(s => s.status === 'pending');

  return (
    <div className="absolute inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/[0.06] flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">AI Refactoring</span>
          {stats.total > 0 && <Badge variant="secondary" className="text-[10px]">{stats.total}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={onAnalyze} disabled={isAnalyzing}>
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={onClearAll}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {stats.total > 0 && (
        <div className="flex gap-3 px-4 py-2 border-b border-white/[0.06] text-[11px]">
          {stats.errors > 0 && <span className="text-red-400">● {stats.errors} critical</span>}
          {stats.warnings > 0 && <span className="text-amber-400">● {stats.warnings} warnings</span>}
          {stats.info > 0 && <span className="text-blue-400">● {stats.info} hints</span>}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {pending.length === 0 && (
            <div className="text-center py-8 text-white/30 text-xs">
              {isAnalyzing ? 'Analyzing project...' : 'Click refresh to scan for refactoring opportunities'}
            </div>
          )}
          {pending.map(s => {
            const Icon = SEV_ICON[s.severity];
            return (
              <div key={s.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${SEV_COLOR[s.severity]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white">{s.title}</div>
                    <div className="text-[11px] text-white/40 truncate">{s.filePath}:{s.line}</div>
                  </div>
                </div>
                <div className="text-[11px] text-white/50">{s.description}</div>
                <code className="block text-[10px] text-white/30 bg-black/30 rounded px-2 py-1 truncate">{s.originalCode}</code>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-6 text-[10px] gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300" onClick={() => onApplyRefactor(s)}>
                    <Zap className="w-3 h-3" /> Refactor with AI
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30" onClick={() => onDismiss(s.id)}>Dismiss</Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
