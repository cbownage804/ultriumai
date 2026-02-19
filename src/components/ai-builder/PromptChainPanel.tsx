import { useState } from 'react';
import { X, Play, SkipForward, Plus, Star, Trash2, ChevronRight, CheckCircle2, Circle, Loader2, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptChain, PromptChainStep } from '@/hooks/usePromptChains';

interface PromptChainPanelProps {
  open: boolean;
  onClose: () => void;
  chains: PromptChain[];
  activeChain: PromptChain | null;
  currentStepIndex: number;
  isComplete: boolean;
  presets: Omit<PromptChain, 'id' | 'createdAt' | 'isFavorite'>[];
  onStartChain: (chainId: string) => void;
  onLoadPreset: (index: number) => void;
  onAdvance: () => void;
  onSkip: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRunStep: (prompt: string) => void;
  isGenerating: boolean;
}

const statusIcons: Record<PromptChainStep['status'], React.ReactNode> = {
  pending: <Circle className="h-3.5 w-3.5 text-white/20" />,
  running: <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  skipped: <Ban className="h-3.5 w-3.5 text-white/20" />,
  failed: <X className="h-3.5 w-3.5 text-red-400" />,
};

export function PromptChainPanel({
  open, onClose, chains, activeChain, currentStepIndex, isComplete,
  presets, onStartChain, onLoadPreset, onAdvance, onSkip, onCancel,
  onDelete, onToggleFavorite, onRunStep, isGenerating,
}: PromptChainPanelProps) {
  const [tab, setTab] = useState<'active' | 'library' | 'presets'>('active');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[480px] max-h-[75vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-white">Prompt Chains</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Multi-step automated workflows</p>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-white/[0.06]">
          {(['active', 'library', 'presets'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors", tab === t ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50")}>
              {t === 'active' ? '🔄 Active' : t === 'library' ? '📚 My Chains' : '⚡ Presets'}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 max-h-[55vh] overflow-y-auto">
          {tab === 'active' && (
            activeChain ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-white">{activeChain.name}</h3>
                  {isComplete ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Complete</span>
                  ) : (
                    <span className="text-[10px] text-white/30">Step {currentStepIndex + 1}/{activeChain.steps.length}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {activeChain.steps.map((step, i) => (
                    <div key={step.id} className={cn("flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors", i === currentStepIndex ? "bg-cyan-500/[0.06] border-cyan-500/20" : "bg-white/[0.01] border-transparent")}>
                      {statusIcons[step.status]}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[11px] font-medium", i === currentStepIndex ? "text-cyan-300" : "text-white/60")}>{step.title}</p>
                        <p className="text-[10px] text-white/30 mt-0.5 line-clamp-2">{step.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  {!isComplete && (
                    <>
                      <button onClick={() => { const prompt = activeChain.steps[currentStepIndex]?.prompt; if (prompt) onRunStep(prompt); }} disabled={isGenerating} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[11px] font-medium hover:bg-cyan-500/30 disabled:opacity-30">
                        <Play className="h-3 w-3" /> Run Step
                      </button>
                      <button onClick={onSkip} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 text-white/40 text-[11px] hover:bg-white/10">
                        <SkipForward className="h-3 w-3" /> Skip
                      </button>
                    </>
                  )}
                  <button onClick={onCancel} className="ml-auto text-[11px] text-red-400/60 hover:text-red-400">Cancel Chain</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-white/20 text-xs">No active chain — start one from Presets or Library</div>
            )
          )}

          {tab === 'library' && (
            chains.length > 0 ? (
              <div className="space-y-2">
                {chains.map(chain => (
                  <div key={chain.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white/70">{chain.name}</p>
                      <p className="text-[10px] text-white/30">{chain.steps.length} steps · {chain.category}</p>
                    </div>
                    <button onClick={() => onToggleFavorite(chain.id)} className={cn("h-6 w-6 rounded flex items-center justify-center", chain.isFavorite ? "text-amber-400" : "text-white/15 hover:text-white/30")}>
                      <Star className="h-3 w-3" fill={chain.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => onStartChain(chain.id)} className="h-6 px-2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] hover:bg-cyan-500/30">
                      <Play className="h-3 w-3" />
                    </button>
                    <button onClick={() => onDelete(chain.id)} className="h-6 w-6 rounded flex items-center justify-center text-white/15 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/20 text-xs">No saved chains — create one from Presets</div>
            )
          )}

          {tab === 'presets' && (
            <div className="space-y-2">
              {presets.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => onLoadPreset(i)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/20 hover:bg-violet-500/[0.04] transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white/70">{preset.name}</p>
                    <p className="text-[10px] text-white/30">{preset.description}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {preset.steps.map((s, j) => (
                        <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">{s.title}</span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/15 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
