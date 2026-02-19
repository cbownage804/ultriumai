import { X, Bug, Check, AlertTriangle } from 'lucide-react';
import type { TrackedError, ErrorStats } from '@/hooks/useErrorTracking';

interface Props {
  open: boolean;
  onClose: () => void;
  errors: TrackedError[];
  stats: ErrorStats;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onInsertCode: (code: string) => void;
  onGenerateBoundary: () => string;
}

export function ErrorTrackingPanel({ open, onClose, errors, stats, onResolve, onDelete, onInsertCode, onGenerateBoundary }: Props) {
  if (!open) return null;
  const severityColor = (s: string) => s === 'fatal' ? 'text-red-400' : s === 'error' ? 'text-orange-400' : 'text-amber-400';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[650px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Bug className="h-4 w-4 text-red-400" /><span className="text-sm font-medium text-white">Error Tracking</span>
            {stats.unresolvedCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">{stats.unresolvedCount} unresolved</span>}
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-red-400">{stats.totalErrors}</div>
              <div className="text-[10px] text-white/30">Total Errors</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-amber-400">{stats.errorRate}%</div>
              <div className="text-[10px] text-white/30">Unresolved Rate</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-emerald-400">{errors.filter(e => e.resolved).length}</div>
              <div className="text-[10px] text-white/30">Resolved</div>
            </div>
          </div>

          {errors.slice(0, 20).map(err => (
            <div key={err.id} className={`p-3 rounded-lg border ${err.resolved ? 'border-white/[0.04] bg-white/[0.01] opacity-50' : 'border-white/[0.06] bg-white/[0.02]'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium uppercase ${severityColor(err.severity)}`}>{err.severity}</span>
                    <span className="text-xs text-white/70 truncate">{err.message}</span>
                  </div>
                  {err.component && <div className="text-[10px] text-white/30 mt-1">in {err.component}</div>}
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-white/20">
                    <span>{err.occurrences}x</span>
                    <span>Last: {err.lastSeen.toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {!err.resolved && <button onClick={() => onResolve(err.id)} className="p-1 text-white/20 hover:text-emerald-400"><Check className="h-3 w-3" /></button>}
                  <button onClick={() => onDelete(err.id)} className="p-1 text-white/20 hover:text-red-400"><X className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          ))}

          <button onClick={() => onInsertCode(onGenerateBoundary())} className="px-3 py-1.5 text-xs bg-white/[0.06] text-white/60 rounded-lg hover:bg-white/[0.1]">
            Insert ErrorBoundary Component
          </button>
        </div>
      </div>
    </div>
  );
}
