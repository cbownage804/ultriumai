import { X, Camera, CheckCircle2, XCircle, ImageIcon } from 'lucide-react';
import type { Snapshot, DiffResult } from '@/hooks/useVisualRegressionTesting';

interface Props {
  open: boolean;
  onClose: () => void;
  snapshots: Snapshot[];
  diffs: DiffResult[];
  isCapturing: boolean;
  threshold: number;
  onSetThreshold: (v: number) => void;
  onCapture: (page: string, label: string) => void;
  onRunSuite: (pages: string[]) => void;
  onApprove: (id: string) => void;
}

export function VisualRegressionPanel({ open, onClose, snapshots, diffs, isCapturing, threshold, onSetThreshold, onCapture, onRunSuite, onApprove }: Props) {
  if (!open) return null;
  const passed = diffs.filter(d => d.status === 'pass').length;
  const failed = diffs.filter(d => d.status === 'fail').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[560px] max-h-[75vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-violet-400" /><span className="text-sm font-semibold text-white">Visual Regression Testing</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
          <button onClick={() => onRunSuite(['/', '/dashboard', '/settings'])} disabled={isCapturing} className="px-3 py-1.5 text-[11px] bg-violet-500/20 text-violet-300 rounded-lg hover:bg-violet-500/30 disabled:opacity-40">
            {isCapturing ? 'Capturing...' : 'Run Full Suite'}
          </button>
          <button onClick={() => onCapture('/', 'manual')} className="px-3 py-1.5 text-[11px] bg-white/5 text-white/50 rounded-lg hover:bg-white/10">Capture Current</button>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] text-white/30">Threshold:</span>
            <input type="number" value={threshold} onChange={e => onSetThreshold(Number(e.target.value))} step={0.1} min={0} max={10} className="w-14 bg-white/5 border border-white/10 rounded text-[10px] text-white/60 px-1.5 py-0.5" />
            <span className="text-[10px] text-white/30">%</span>
          </div>
        </div>

        {diffs.length > 0 && (
          <div className="px-4 py-2 border-b border-white/[0.06] flex gap-3">
            <span className="text-[10px] text-emerald-400">✓ {passed} passed</span>
            <span className="text-[10px] text-red-400">✕ {failed} failed</span>
            <span className="text-[10px] text-amber-400">{diffs.filter(d => d.status === 'new').length} new</span>
          </div>
        )}

        <div className="px-4 py-3 max-h-[50vh] overflow-y-auto space-y-2">
          {diffs.map(d => (
            <div key={d.id} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
              {d.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : d.status === 'fail' ? <XCircle className="h-4 w-4 text-red-400 shrink-0" /> : <ImageIcon className="h-4 w-4 text-amber-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/60 font-mono truncate">{d.pagePath}</div>
                <div className="text-[9px] text-white/30">{d.diffPercentage}% changed · {d.changedPixels.toLocaleString()} pixels</div>
              </div>
              {d.status === 'fail' && <button onClick={() => onApprove(d.currentId)} className="px-2 py-1 text-[10px] bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30">Approve</button>}
            </div>
          ))}
          {diffs.length === 0 && <div className="text-center text-white/20 text-xs py-8">Run a suite to capture and compare snapshots</div>}
        </div>
      </div>
    </div>
  );
}
