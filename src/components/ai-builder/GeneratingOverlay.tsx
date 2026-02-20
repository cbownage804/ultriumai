import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, FileCode, Sparkles } from 'lucide-react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface GeneratingOverlayProps {
  isGenerating: boolean;
  isCompiling?: boolean;
  phase?: string;
  partialFiles?: ProjectFile[];
  completedFileCount?: number;
  continuationRound?: number;
}

const PHASE_CONFIG: Record<string, { label: string; color: string; gradient: string }> = {
  analyzing: { label: 'Analyzing...', color: 'text-violet-400', gradient: 'from-violet-500 via-violet-400 to-fuchsia-500' },
  planning: { label: 'Planning architecture...', color: 'text-cyan-400', gradient: 'from-cyan-500 via-cyan-400 to-blue-500' },
  writing: { label: 'Writing code...', color: 'text-emerald-400', gradient: 'from-emerald-500 via-cyan-400 to-teal-500' },
};

export function GeneratingOverlay({ isGenerating, isCompiling, phase, partialFiles = [], completedFileCount = 0, continuationRound = 0 }: GeneratingOverlayProps) {
  const showOverlay = isGenerating || isCompiling;
  const totalFiles = partialFiles.length;
  const progress = totalFiles > 0 ? (completedFileCount / totalFiles) * 100 : 0;
  const phaseConfig = phase ? PHASE_CONFIG[phase] : null;
  const shimmerGradient = phaseConfig?.gradient || 'from-cyan-500 via-violet-400 to-cyan-500';

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 z-10 pointer-events-none"
        >
          {/* Top shimmer bar — wider, smoother, phase-colored */}
          <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden">
            <motion.div
              className={`h-full w-[200%] bg-gradient-to-r ${shimmerGradient} opacity-90`}
              animate={{ x: ['-50%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            {/* Glow effect beneath bar */}
            <div className={`absolute top-0 left-0 right-0 h-6 bg-gradient-to-b ${shimmerGradient.includes('emerald') ? 'from-emerald-500/20' : shimmerGradient.includes('violet') ? 'from-violet-500/20' : 'from-cyan-500/20'} to-transparent blur-sm`} />
          </div>

          {/* Corner badge with file list */}
          <motion.div
            initial={{ y: -12, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-3 right-3 bg-black/85 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden min-w-[190px] shadow-2xl shadow-black/50"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
              {isCompiling && !isGenerating ? (
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
              )}
              <span className={`text-[11px] font-medium ${phaseConfig?.color || 'text-white/60'}`}>
                {isCompiling && !isGenerating 
                  ? 'Compiling preview...' 
                  : continuationRound > 0 
                    ? `Generating remaining files... (round ${continuationRound + 1})`
                    : phaseConfig?.label || 'Generating...'}
              </span>
            </div>

            {totalFiles > 0 && (
              <>
                <div className="px-3 py-2 space-y-1.5 max-h-[160px] overflow-auto">
                  {partialFiles.map((file, i) => {
                    const isComplete = i < completedFileCount;
                    const fileName = file.path.split('/').pop()!;
                    return (
                      <motion.div
                        key={file.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
                        className="flex items-center gap-2"
                      >
                        {isComplete ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                            <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                          </motion.div>
                        ) : (
                          <FileCode className="h-3 w-3 text-cyan-400/50 animate-pulse shrink-0" />
                        )}
                        <span className={`text-[10px] font-mono truncate transition-colors duration-300 ${isComplete ? 'text-white/40' : 'text-cyan-300/80'}`}>
                          {fileName}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress bar — smoother, with glow */}
                <div className="px-3 pb-2.5 pt-1">
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden relative">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-400 rounded-full relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(progress, 3)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                      {/* Shimmer on progress bar */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </motion.div>
                  </div>
                  <div className="text-[9px] text-white/25 mt-1.5 text-right font-mono">
                    {completedFileCount}/{totalFiles} files
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
