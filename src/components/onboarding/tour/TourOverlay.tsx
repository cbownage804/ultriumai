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
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100]"
      onClick={onClick}
    >
      {/* Multi-layer gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-primary/5" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
    </motion.div>
  );
};
