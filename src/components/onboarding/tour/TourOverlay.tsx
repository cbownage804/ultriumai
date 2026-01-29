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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
      onClick={onClick}
    />
  );
};
