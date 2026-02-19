import { X, Accessibility, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { A11yScore } from '@/hooks/useAccessibilityScoring';

interface Props {
  open: boolean;
  onClose: () => void;
  score: A11yScore | null;
  isScanning: boolean;
  onScan: () => void;
  onGoToFile: (path: string) => void;
}

export function AccessibilityPanel({ open, onClose, score, isScanning, onScan, onGoToFile }: Props) {
  if (!open) return null;
  const impactColor = (i: string) => i === 'critical' ? 'text-red-400 bg-red-500/10' : i === 'serious' ? 'text-orange-400 bg-orange-500/10' : i === 'moderate' ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10';
  const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[520px] max-h-[75vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Accessibility className="h-4 w-4 text-cyan-400" /><span className="text-sm font-semibold text-white">Accessibility Score</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-4 py-3 border-b border-white/[0.06]">
          <button onClick={onScan} disabled={isScanning} className="px-3 py-1.5 text-[11px] bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 disabled:opacity-40">
            {isScanning ? 'Scanning...' : 'Run WCAG Audit'}
          </button>
        </div>

        {score && (
          <div className="px-4 py-3 space-y-3 max-h-[55vh] overflow-y-auto">
            <div className="text-center py-2">
              <div className={`text-3xl font-bold ${scoreColor(score.overall)}`}>{score.overall}/100</div>
              <div className="text-[10px] text-white/30 mt-1">{score.filesScanned} files · {score.violations.length} violations</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {score.categories.map(c => (
                <div key={c.name} className="p-2 rounded bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-[10px] text-white/40">{c.name}</div>
                  <div className={`text-sm font-semibold ${scoreColor(Math.round((c.score / c.maxScore) * 100))}`}>{c.score}/{c.maxScore}</div>
                </div>
              ))}
            </div>

            {score.violations.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] text-white/40 font-medium">Violations</div>
                {score.violations.slice(0, 20).map(v => (
                  <div key={v.id} className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${impactColor(v.impact)}`}>{v.impact}</span>
                      <span className="text-[10px] text-white/50 font-mono">{v.rule}</span>
                    </div>
                    <div className="text-[10px] text-white/40">{v.description}</div>
                    <div className="text-[10px] text-emerald-400/60 mt-1">Fix: {v.fix}</div>
                    <button onClick={() => onGoToFile(v.file)} className="text-[9px] text-cyan-400/50 hover:text-cyan-400 mt-1">{v.file}</button>
                  </div>
                ))}
              </div>
            )}

            {score.violations.length === 0 && <div className="text-center py-4 text-emerald-400 text-xs">✓ No accessibility violations found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
