import { X, Bug, Skull, Shield } from 'lucide-react';
import type { MutationReport } from '@/hooks/useMutationTesting';

interface Props {
  open: boolean;
  onClose: () => void;
  report: MutationReport | null;
  isRunning: boolean;
  onRun: () => void;
  onGoToFile: (path: string) => void;
}

export function MutationTestingPanel({ open, onClose, report, isRunning, onRun, onGoToFile }: Props) {
  if (!open) return null;
  const statusIcon = (s: string) => s === 'killed' ? <Shield className="h-3 w-3 text-emerald-400" /> : s === 'survived' ? <Skull className="h-3 w-3 text-red-400" /> : <Bug className="h-3 w-3 text-amber-400" />;
  const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[560px] max-h-[75vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Bug className="h-4 w-4 text-amber-400" /><span className="text-sm font-semibold text-white">Mutation Testing</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-4 py-3 border-b border-white/[0.06]">
          <button onClick={onRun} disabled={isRunning} className="px-3 py-1.5 text-[11px] bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 disabled:opacity-40">
            {isRunning ? 'Mutating...' : 'Run Mutation Tests'}
          </button>
        </div>

        {report && (
          <div className="px-4 py-3 space-y-3 max-h-[55vh] overflow-y-auto">
            <div className="text-center py-2">
              <div className={`text-3xl font-bold ${scoreColor(report.score)}`}>{report.score}%</div>
              <div className="text-[10px] text-white/30">Mutation Score · {report.killed} killed / {report.mutants.length} total</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-emerald-500/10 text-center"><div className="text-sm font-bold text-emerald-400">{report.killed}</div><div className="text-[9px] text-white/30">Killed</div></div>
              <div className="p-2 rounded bg-red-500/10 text-center"><div className="text-sm font-bold text-red-400">{report.survived}</div><div className="text-[9px] text-white/30">Survived</div></div>
              <div className="p-2 rounded bg-amber-500/10 text-center"><div className="text-sm font-bold text-amber-400">{report.timeout}</div><div className="text-[9px] text-white/30">Timeout</div></div>
            </div>

            <div className="space-y-1.5">
              {report.mutants.filter(m => m.status === 'survived').slice(0, 15).map(m => (
                <div key={m.id} className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-1">
                    {statusIcon(m.status)}
                    <span className="text-[10px] text-white/40 font-mono">{m.mutationType}</span>
                    <button onClick={() => onGoToFile(m.file)} className="text-[9px] text-cyan-400/50 hover:text-cyan-400 ml-auto">{m.file.split('/').pop()}:{m.line}</button>
                  </div>
                  <div className="text-[10px] text-red-400/50 font-mono line-through">{m.original}</div>
                  <div className="text-[10px] text-emerald-400/50 font-mono">{m.mutated}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
