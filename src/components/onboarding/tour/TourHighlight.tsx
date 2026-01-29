import { motion } from 'framer-motion';

interface TourHighlightProps {
  rect: DOMRect;
}

export const TourHighlight = ({ rect }: TourHighlightProps) => {
  const padding = 12;
  
  return (
    <>
      {/* Spotlight cutout */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-[101] pointer-events-none"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          borderRadius: '16px',
        }}
      />
      
      {/* Glowing border container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="fixed z-[102] pointer-events-none"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }}
      >
        {/* Animated gradient border */}
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.5), hsl(var(--primary)))',
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-2xl bg-primary/10 backdrop-blur-[1px]" />
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>

      {/* Outer glow rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4, scale: 1 }}
          animate={{ opacity: 0, scale: 1.15 + i * 0.1 }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeOut",
            delay: i * 0.4 
          }}
          className="fixed z-[100] pointer-events-none rounded-2xl"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            border: '2px solid hsl(var(--primary) / 0.4)',
            boxShadow: '0 0 20px hsl(var(--primary) / 0.2)',
          }}
        />
      ))}

      {/* Corner accents */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <motion.div
          key={pos}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
          className={`fixed z-[103] pointer-events-none ${pos} w-3 h-3`}
          style={{
            top: pos.includes('top') ? rect.top - padding - 4 : rect.top + rect.height + padding - 8,
            left: pos.includes('left') ? rect.left - padding - 4 : rect.left + rect.width + padding - 8,
          }}
        >
          <div className="w-full h-full rounded-full bg-primary shadow-lg shadow-primary/50" />
        </motion.div>
      ))}
    </>
  );
};
