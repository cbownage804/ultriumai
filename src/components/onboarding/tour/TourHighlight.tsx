import { motion } from 'framer-motion';

interface TourHighlightProps {
  rect: DOMRect;
}

export const TourHighlight = ({ rect }: TourHighlightProps) => {
  return (
    <>
      {/* Spotlight cutout with pulse effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed z-[101] pointer-events-none"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          borderRadius: '12px',
        }}
      />
      
      {/* Animated border */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-[102] pointer-events-none"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          borderRadius: '12px',
        }}
      >
        <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse" />
        <div className="absolute inset-0 rounded-xl bg-primary/10" />
      </motion.div>

      {/* Pulse rings */}
      <motion.div
        initial={{ opacity: 0.6, scale: 1 }}
        animate={{ opacity: 0, scale: 1.3 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        className="fixed z-[101] pointer-events-none border-2 border-primary/50 rounded-xl"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      />
    </>
  );
};
