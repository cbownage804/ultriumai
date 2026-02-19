import { X, Brain, DollarSign } from 'lucide-react';
import type { AIUsageSummary } from '@/hooks/useAIUsageAnalytics';

interface Props {
  open: boolean;
  onClose: () => void;
  summary: AIUsageSummary;
  estimatedMonthlyCost: number;
}

export function AIUsagePanel({ open, onClose, summary, estimatedMonthlyCost }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-violet-400" /><span className="text-sm font-medium text-white">AI Usage Analytics</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-violet-400">{summary.totalPrompts}</div>
              <div className="text-[10px] text-white/30">Prompts</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-cyan-400">{(summary.totalTokens / 1000).toFixed(1)}k</div>
              <div className="text-[10px] text-white/30">Tokens</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-emerald-400">${summary.totalCost}</div>
              <div className="text-[10px] text-white/30">Total Cost</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-amber-400">{summary.successRate}%</div>
              <div className="text-[10px] text-white/30">Success Rate</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
            <div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-violet-400" /><span className="text-xs text-white/70">Est. Monthly Cost</span></div>
            <div className="text-lg font-bold text-violet-400 mt-1">${estimatedMonthlyCost}</div>
          </div>

          {summary.byModel.length > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-2">Usage by Model</div>
              {summary.byModel.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-white/[0.02] text-xs mb-1">
                  <span className="text-white/60">{m.model}</span>
                  <div className="flex items-center gap-3 text-white/30">
                    <span>{m.count} calls</span>
                    <span>{(m.tokens / 1000).toFixed(1)}k tokens</span>
                    <span className="text-emerald-400/70">${m.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {summary.byCategory.length > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-2">By Category</div>
              <div className="flex flex-wrap gap-2">
                {summary.byCategory.map((c, i) => (
                  <div key={i} className="px-2 py-1 rounded bg-white/[0.03] text-[10px] text-white/50">
                    {c.category}: {c.count} (${c.cost})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
