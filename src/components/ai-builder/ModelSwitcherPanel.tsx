import { useState } from 'react';
import { X, Zap, Clock, Crown, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_PROVIDERS } from '@/types/aiProviders';
import { useModelSwitcher, type ModelCostEstimate } from '@/hooks/useModelSwitcher';

interface ModelSwitcherPanelProps {
  open: boolean;
  onClose: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  currentPrompt?: string;
}

const speedColors = { fast: 'text-emerald-400', medium: 'text-amber-400', slow: 'text-red-400' };
const speedLabels = { fast: 'Fast', medium: 'Balanced', slow: 'Thorough' };
const qualityColors = { standard: 'text-white/40', high: 'text-cyan-400', premium: 'text-violet-400' };

export function ModelSwitcherPanel({ open, onClose, selectedModel, onModelChange, currentPrompt }: ModelSwitcherPanelProps) {
  const { getModelCost, recommendModel, getModelsByCategory } = useModelSwitcher();
  const [filter, setFilter] = useState<'all' | 'fast' | 'balanced' | 'premium'>('all');

  if (!open) return null;

  const recommendation = currentPrompt ? recommendModel(currentPrompt) : null;
  const categories = getModelsByCategory();

  const filteredProviders = AI_PROVIDERS.map(p => ({
    ...p,
    models: p.models.filter(m => {
      if (filter === 'all') return true;
      const cost = getModelCost(m.id);
      if (filter === 'fast') return cost?.speed === 'fast';
      if (filter === 'balanced') return cost?.speed === 'medium';
      if (filter === 'premium') return cost?.quality === 'premium';
      return true;
    }),
  })).filter(p => p.models.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[520px] max-h-[80vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-white">Model Switcher</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Choose the best model for your task</p>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* AI Recommendation */}
        {recommendation && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-violet-500/[0.08] border border-violet-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-[11px] font-medium text-violet-300">Recommended for this task</span>
            </div>
            <p className="text-[11px] text-white/50 mt-1">{recommendation.reason}</p>
            <button
              onClick={() => { onModelChange(recommendation.modelId); onClose(); }}
              className="mt-2 flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300"
            >
              Use {AI_PROVIDERS.flatMap(p => p.models).find(m => m.id === recommendation.modelId)?.name || recommendation.modelId}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-2">
          {(['all', 'fast', 'balanced', 'premium'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
                filter === f ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"
              )}
            >
              {f === 'all' ? 'All' : f === 'fast' ? '⚡ Fast' : f === 'balanced' ? '⚖️ Balanced' : '👑 Premium'}
            </button>
          ))}
        </div>

        {/* Model list */}
        <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto space-y-4">
          {filteredProviders.map(provider => (
            <div key={provider.id}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{provider.icon}</span>
                <span className="text-[11px] font-medium text-white/60">{provider.name}</span>
              </div>
              <div className="space-y-1">
                {provider.models.map(model => {
                  const cost = getModelCost(model.id);
                  const isSelected = selectedModel === model.id;
                  const isRecommended = recommendation?.modelId === model.id;

                  return (
                    <button
                      key={model.id}
                      onClick={() => { onModelChange(model.id); onClose(); }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left",
                        isSelected
                          ? "bg-cyan-500/10 border border-cyan-500/30 ring-1 ring-cyan-500/20"
                          : "bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[12px] font-medium", isSelected ? "text-cyan-300" : "text-white/80")}>
                            {model.name}
                          </span>
                          {isRecommended && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/30 mt-0.5">{model.description} · {(model.contextWindow / 1000).toFixed(0)}k context</p>
                      </div>

                      {cost && (
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <div className="flex items-center gap-1">
                            <Zap className={cn("h-3 w-3", speedColors[cost.speed])} />
                            <span className={cn("text-[10px]", speedColors[cost.speed])}>{speedLabels[cost.speed]}</span>
                          </div>
                          <div className="text-[10px] text-white/30">
                            ~${cost.estimatedCost.toFixed(3)}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
