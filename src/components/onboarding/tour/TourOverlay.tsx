import { motion } from 'framer-motion';

interface TourOverlayProps {
  onClick: () => void;
}

export const TourOverlay = ({ onClick }: TourOverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black/40"
      onClick={onClick}
      style={{ 
        // Use will-change for better GPU acceleration on tablets
        willChange: 'opacity',
        // Disable backdrop-blur on touch devices to prevent glitchy scroll
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Simple gradient overlay - no blur to avoid iOS/tablet glitches */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-primary/5 pointer-events-none" />
    </motion.div>
  );
};
