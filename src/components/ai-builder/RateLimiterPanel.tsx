import { X, Gauge, Trash2 } from 'lucide-react';
import type { RateLimitRule } from '@/hooks/useRateLimiter';

interface Props {
  open: boolean;
  onClose: () => void;
  rules: RateLimitRule[];
  onAdd: (fn: string) => void;
  onUpdate: (id: string, updates: Partial<RateLimitRule>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onGenerateMiddleware: (rule: RateLimitRule) => string;
  onInsertCode: (code: string) => void;
}

export function RateLimiterPanel({ open, onClose, rules, onAdd, onUpdate, onRemove, onToggle, onGenerateMiddleware, onInsertCode }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-amber-400" /><span className="text-sm font-medium text-white">Rate Limiter</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button onClick={() => onAdd('my-function')} className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30">
            + Add Rate Limit Rule
          </button>

          {rules.map(rule => (
            <div key={rule.id} className={`p-3 rounded-lg border ${rule.enabled ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.03] opacity-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={rule.enabled} onChange={() => onToggle(rule.id)} className="rounded" />
                  <span className="text-xs text-white/70 font-mono">{rule.functionName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onInsertCode(onGenerateMiddleware(rule))} className="text-[10px] text-cyan-400 hover:text-cyan-300 mr-2">Generate</button>
                  <button onClick={() => onRemove(rule.id)} className="p-1 text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-white/30">Req/min</label>
                  <input type="number" value={rule.requestsPerMinute} onChange={e => onUpdate(rule.id, { requestsPerMinute: +e.target.value })} className="w-full px-2 py-1 bg-white/[0.05] border border-white/[0.08] rounded text-xs text-white/70" />
                </div>
                <div>
                  <label className="text-[9px] text-white/30">Req/hour</label>
                  <input type="number" value={rule.requestsPerHour} onChange={e => onUpdate(rule.id, { requestsPerHour: +e.target.value })} className="w-full px-2 py-1 bg-white/[0.05] border border-white/[0.08] rounded text-xs text-white/70" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40">
                <label className="flex items-center gap-1"><input type="checkbox" checked={rule.perIP} onChange={e => onUpdate(rule.id, { perIP: e.target.checked })} className="rounded" />Per IP</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={rule.perUser} onChange={e => onUpdate(rule.id, { perUser: e.target.checked })} className="rounded" />Per User</label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
