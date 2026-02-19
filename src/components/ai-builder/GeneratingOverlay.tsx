import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, FileCode } from 'lucide-react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface GeneratingOverlayProps {
  isGenerating: boolean;
  isCompiling?: boolean;
  phase?: string;
  partialFiles?: ProjectFile[];
  completedFileCount?: number;
}

export function GeneratingOverlay({ isGenerating, isCompiling, phase, partialFiles = [], completedFileCount = 0 }: GeneratingOverlayProps) {
  const showOverlay = isGenerating || isCompiling;
  const totalFiles = partialFiles.length;
  const progress = totalFiles > 0 ? (completedFileCount / totalFiles) * 100 : 0;

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-10 pointer-events-none"
        >
          {/* Top shimmer bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Corner badge with file list */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden min-w-[180px]"
          >
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
              <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
              <span className="text-[10px] text-white/60 font-medium">
                {isCompiling && !isGenerating ? 'Compiling preview...' : phase === 'writing' ? 'Writing code...' : phase === 'planning' ? 'Planning...' : 'Generating...'}
              </span>
            </div>

            {totalFiles > 0 && (
              <>
                <div className="px-3 py-1.5 space-y-1 max-h-[140px] overflow-auto">
                  {partialFiles.map((file, i) => {
                    const isComplete = i < completedFileCount;
                    const fileName = file.path.split('/').pop()!;
                    return (
                      <motion.div
                        key={file.path}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-1.5"
                      >
                        {isComplete ? (
                          <Check className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                        ) : (
                          <FileCode className="h-2.5 w-2.5 text-cyan-400/50 animate-pulse shrink-0" />
                        )}
                        <span className={`text-[10px] font-mono truncate ${isComplete ? 'text-white/50' : 'text-cyan-400/80'}`}>
                          {fileName}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="px-3 pb-2 pt-1">
                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(progress, 5)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="text-[9px] text-white/30 mt-1 text-right">
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
