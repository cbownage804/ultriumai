import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface GeneratingOverlayProps {
  isGenerating: boolean;
  phase?: string;
}

/**
 * Subtle shimmer overlay shown on the preview while AI is generating code.
 */
export function GeneratingOverlay({ isGenerating, phase }: GeneratingOverlayProps) {
  return (
    <AnimatePresence>
      {isGenerating && (
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

          {/* Corner badge */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1"
          >
            <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
            <span className="text-[10px] text-white/60 font-medium">
              {phase === 'writing' ? 'Writing code...' : phase === 'planning' ? 'Planning...' : 'Generating...'}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
