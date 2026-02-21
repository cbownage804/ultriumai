import { useState, useEffect, type RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, FileCode, Sparkles } from 'lucide-react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface GeneratingOverlayProps {
  isGenerating: boolean;
  isCompiling?: boolean;
  phase?: string;
  partialFilesRef: RefObject<ProjectFile[]>;
  completedFileCountRef: RefObject<number>;
  continuationRound?: number;
}

const PHASE_CONFIG: Record<string, { label: string; color: string; gradient: string }> = {
  analyzing: { label: 'Analyzing...', color: 'text-violet-400', gradient: 'from-violet-500 via-violet-400 to-fuchsia-500' },
  planning: { label: 'Planning architecture...', color: 'text-cyan-400', gradient: 'from-cyan-500 via-cyan-400 to-blue-500' },
  writing: { label: 'Writing code...', color: 'text-emerald-400', gradient: 'from-emerald-500 via-cyan-400 to-teal-500' },
};

export function GeneratingOverlay({ isGenerating, isCompiling, phase, partialFilesRef, completedFileCountRef, continuationRound = 0 }: GeneratingOverlayProps) {
  const showOverlay = isGenerating || isCompiling;

  // Local polling state — reads from refs every 500ms, only THIS component re-renders
  const [localFiles, setLocalFiles] = useState<ProjectFile[]>([]);
  const [localCompleted, setLocalCompleted] = useState(0);

  useEffect(() => {
    if (!showOverlay) {
      setLocalFiles([]);
      setLocalCompleted(0);
      return;
    }
    // Phase 6: Skip polling during compilation-only phase (no new files to show)
    if (isCompiling && !isGenerating) return;
    const interval = setInterval(() => {
      const files = partialFilesRef.current;
      const completed = completedFileCountRef.current;
      setLocalFiles(prev => prev.length !== files.length || prev !== files ? files : prev);
      setLocalCompleted(prev => prev !== completed ? completed : prev);
    }, 2000);
    return () => clearInterval(interval);
  }, [showOverlay, isCompiling, isGenerating, partialFilesRef, completedFileCountRef]);

  const totalFiles = localFiles.length;
  const progress = totalFiles > 0 ? (localCompleted / totalFiles) * 100 : 0;
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
          {/* Top shimmer bar — CSS-only to avoid JS animation overhead */}
          <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden">
            <div
              className={`h-full w-[200%] bg-gradient-to-r ${shimmerGradient} opacity-90`}
              style={{ animation: 'shimmer-slide 2s linear infinite' }}
            />
          </div>

          {/* Corner badge with file list */}
          <motion.div
            initial={{ y: -12, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-3 right-3 bg-[#0a0a14]/95 border border-white/[0.08] rounded-xl overflow-hidden min-w-[190px] shadow-2xl shadow-black/50"
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
                  {localFiles.map((file, i) => {
                    const isComplete = i < localCompleted;
                    const fileName = file.path.split('/').pop()!;
                    return (
                      <div
                        key={file.path}
                        className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        {isComplete ? (
                          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                        ) : (
                          <FileCode className="h-3 w-3 text-cyan-400/50 animate-pulse shrink-0" />
                        )}
                        <span className={`text-[10px] font-mono truncate transition-colors duration-300 ${isComplete ? 'text-white/40' : 'text-cyan-300/80'}`}>
                          {fileName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="px-3 pb-2.5 pt-1">
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(progress, 3)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-white/25 mt-1.5 text-right font-mono">
                    {localCompleted}/{totalFiles} files
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
