import { X, FlaskConical, Play, Pause, Trash2, Trophy } from 'lucide-react';
import type { ABTest } from '@/hooks/useABTesting';

interface Props {
  open: boolean;
  onClose: () => void;
  tests: ABTest[];
  onCreate: (name: string, component: string, goalEvent: string) => void;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateCode: (test: ABTest) => string;
  onInsertCode: (code: string) => void;
}

export function ABTestingPanel({ open, onClose, tests, onCreate, onStart, onPause, onComplete, onDelete, onGenerateCode, onInsertCode }: Props) {
  if (!open) return null;
  const statusColor = (s: string) => s === 'running' ? 'text-emerald-400' : s === 'paused' ? 'text-amber-400' : s === 'completed' ? 'text-cyan-400' : 'text-white/40';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[650px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-emerald-400" /><span className="text-sm font-medium text-white">A/B Testing</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button onClick={() => onCreate('New Test', 'Component', 'click')} className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30">
            + New A/B Test
          </button>

          {tests.map(test => (
            <div key={test.id} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs text-white/70 font-medium">{test.name}</span>
                  <span className={`ml-2 text-[10px] ${statusColor(test.status)}`}>{test.status}</span>
                </div>
                <div className="flex items-center gap-1">
                  {test.status === 'draft' && <button onClick={() => onStart(test.id)} className="p-1 text-white/20 hover:text-emerald-400"><Play className="h-3 w-3" /></button>}
                  {test.status === 'running' && <button onClick={() => onPause(test.id)} className="p-1 text-white/20 hover:text-amber-400"><Pause className="h-3 w-3" /></button>}
                  {test.status !== 'completed' && <button onClick={() => onComplete(test.id)} className="p-1 text-white/20 hover:text-cyan-400"><Trophy className="h-3 w-3" /></button>}
                  <button onClick={() => onDelete(test.id)} className="p-1 text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="space-y-1">
                {test.variants.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-2 rounded bg-white/[0.02] text-[10px]">
                    <span className="text-white/60">{v.name} ({v.trafficPercent}%)</span>
                    <div className="flex items-center gap-3 text-white/30">
                      <span>{v.impressions} imp</span>
                      <span>{v.conversions} conv</span>
                      <span className={v.conversionRate > 0 ? 'text-emerald-400' : ''}>{v.conversionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => onInsertCode(onGenerateCode(test))} className="mt-2 text-[10px] text-cyan-400 hover:text-cyan-300">Insert component code</button>
            </div>
          ))}

          {tests.length === 0 && <div className="text-center text-white/20 text-xs py-8">Create your first A/B test</div>}
        </div>
      </div>
    </div>
  );
}
