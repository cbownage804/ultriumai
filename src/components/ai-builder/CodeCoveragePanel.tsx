import { X, BarChart3 } from 'lucide-react';
import type { CoverageReport } from '@/hooks/useCodeCoverageVisualizer';

interface Props {
  open: boolean;
  onClose: () => void;
  report: CoverageReport | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onGoToFile: (path: string) => void;
}

export function CodeCoveragePanel({ open, onClose, report, isAnalyzing, onAnalyze, onGoToFile }: Props) {
  if (!open) return null;
  const pctColor = (p: number) => p >= 80 ? 'text-emerald-400' : p >= 50 ? 'text-amber-400' : 'text-red-400';
  const barColor = (p: number) => p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[540px] max-h-[75vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-400" /><span className="text-sm font-semibold text-white">Code Coverage</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-4 py-3 border-b border-white/[0.06]">
          <button onClick={onAnalyze} disabled={isAnalyzing} className="px-3 py-1.5 text-[11px] bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 disabled:opacity-40">
            {isAnalyzing ? 'Analyzing...' : 'Analyze Coverage'}
          </button>
        </div>

        {report && (
          <div className="px-4 py-3 space-y-3 max-h-[55vh] overflow-y-auto">
            <div className="text-center py-2">
              <div className={`text-3xl font-bold ${pctColor(report.overallPercentage)}`}>{report.overallPercentage}%</div>
              <div className="text-[10px] text-white/30">{report.coveredLines.toLocaleString()} / {report.totalLines.toLocaleString()} lines</div>
            </div>

            <div className="space-y-1">
              {report.files.slice(0, 30).map(f => (
                <button key={f.path} onClick={() => onGoToFile(f.path)} className="w-full flex items-center gap-2 p-2 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-white/50 font-mono truncate">{f.path}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(f.percentage)}`} style={{ width: `${f.percentage}%` }} />
                      </div>
                      <span className={`text-[9px] font-medium w-8 text-right ${pctColor(f.percentage)}`}>{f.percentage}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
