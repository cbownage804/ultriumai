/**
 * Wave 10: Multi-Model Output Comparison
 * Side-by-side comparison of outputs from two AI models.
 */

import { useState } from 'react';
import { X, Check, Loader2, FileCode, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ModelOutput {
  modelId: string;
  modelLabel: string;
  modelIcon: string;
  fileNames: string[];
  summary: string;
  isLoading: boolean;
}

interface ModelComparisonModalProps {
  open: boolean;
  onClose: () => void;
  modelA: ModelOutput;
  modelB: ModelOutput;
  onSelectModel: (modelId: string) => void;
}

export function ModelComparisonModal({
  open, onClose, modelA, modelB, onSelectModel,
}: ModelComparisonModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  const isLoading = modelA.isLoading || modelB.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[720px] max-h-[80vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Compare Model Outputs</h2>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
          {[modelA, modelB].map((model) => (
            <div
              key={model.modelId}
              className={cn(
                "p-4 cursor-pointer transition-all",
                selected === model.modelId
                  ? "bg-cyan-500/[0.06] ring-1 ring-inset ring-cyan-500/30"
                  : "hover:bg-white/[0.02]"
              )}
              onClick={() => !isLoading && setSelected(model.modelId)}
            >
              {/* Model header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{model.modelIcon}</span>
                <span className="text-[13px] font-semibold text-white/80">{model.modelLabel}</span>
                {selected === model.modelId && (
                  <Check className="h-4 w-4 text-cyan-400 ml-auto" />
                )}
              </div>

              {/* Content */}
              {model.isLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  <span className="text-[12px] text-white/40">Generating...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* File list */}
                  <div className="space-y-1">
                    {model.fileNames.slice(0, 6).map((name, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <FileCode className="h-3 w-3 text-white/30 shrink-0" />
                        <span className="text-[11px] text-white/50 font-mono truncate">{name.split('/').pop()}</span>
                      </div>
                    ))}
                    {model.fileNames.length > 6 && (
                      <span className="text-[10px] text-white/25 pl-5">+{model.fileNames.length - 6} more</span>
                    )}
                  </div>

                  {/* Summary */}
                  {model.summary && (
                    <p className="text-[11px] text-white/40 leading-relaxed mt-2 border-t border-white/[0.06] pt-2">
                      {model.summary.slice(0, 200)}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-3 text-[10px] text-white/25 mt-2">
                    <span>{model.fileNames.length} files</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[12px] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onSelectModel(selected)}
            disabled={!selected || isLoading}
            className={cn(
              "px-4 py-2 rounded-lg text-[12px] font-medium transition-all",
              selected && !isLoading
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                : "bg-white/[0.04] text-white/25 border border-white/[0.06]"
            )}
          >
            Apply Selected Output
          </button>
        </div>
      </motion.div>
    </div>
  );
}
