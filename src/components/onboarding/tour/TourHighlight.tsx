import { motion } from 'framer-motion';

interface TourHighlightProps {
  rect: DOMRect;
  intensity?: 'subtle' | 'normal' | 'prominent';
  color?: 'primary' | 'amber' | 'cyan' | 'violet';
}

export const TourHighlight = ({ 
  rect, 
  intensity = 'normal',
  color = 'primary' 
}: TourHighlightProps) => {
  const padding = 12;
  
  // Color configurations
  const colorConfig = {
    primary: {
      border: 'hsl(var(--primary))',
      glow: 'hsl(var(--primary) / 0.4)',
      ring: 'hsl(var(--primary) / 0.2)',
    },
    amber: {
      border: 'hsl(45 100% 50%)',
      glow: 'hsl(45 100% 50% / 0.4)',
      ring: 'hsl(45 100% 50% / 0.2)',
    },
    cyan: {
      border: 'hsl(180 100% 50%)',
      glow: 'hsl(180 100% 50% / 0.4)',
      ring: 'hsl(180 100% 50% / 0.2)',
    },
    violet: {
      border: 'hsl(270 100% 60%)',
      glow: 'hsl(270 100% 60% / 0.4)',
      ring: 'hsl(270 100% 60% / 0.2)',
    },
  };

  const colors = colorConfig[color];
  
  // Intensity configurations
  const intensityConfig = {
    subtle: { pulseScale: 1.05, ringCount: 1, overlayOpacity: 0.3 },
    normal: { pulseScale: 1.1, ringCount: 3, overlayOpacity: 0.45 },
    prominent: { pulseScale: 1.15, ringCount: 4, overlayOpacity: 0.6 },
  };

  const config = intensityConfig[intensity];
  
  return (
    <>
      {/* Spotlight cutout with enhanced shadow */}
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
          boxShadow: `0 0 0 9999px rgba(0,0,0,${config.overlayOpacity})`,
          borderRadius: '16px',
        }}
      />
      
      {/* Glowing border container with pulse */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ 
          opacity: 1, 
          scale: [1, config.pulseScale, 1],
        }}
        transition={{ 
          opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="fixed z-[102] pointer-events-none"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }}
      >
        {/* Animated gradient border */}
        <motion.div 
          className="absolute inset-0 rounded-2xl"
          animate={{
            background: [
              `linear-gradient(0deg, ${colors.border}, ${colors.glow}, ${colors.border})`,
              `linear-gradient(90deg, ${colors.border}, ${colors.glow}, ${colors.border})`,
              `linear-gradient(180deg, ${colors.border}, ${colors.glow}, ${colors.border})`,
              `linear-gradient(270deg, ${colors.border}, ${colors.glow}, ${colors.border})`,
              `linear-gradient(360deg, ${colors.border}, ${colors.glow}, ${colors.border})`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        
        {/* Inner glow */}
        <motion.div 
          className="absolute inset-0 rounded-2xl backdrop-blur-[1px]"
          animate={{ 
            backgroundColor: [
              `${colors.ring}`,
              `${colors.glow}`,
              `${colors.ring}`,
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Enhanced shimmer effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>

      {/* Multiple expanding glow rings */}
      {Array.from({ length: config.ringCount }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ 
            opacity: 0, 
            scale: 1.2 + i * 0.1,
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeOut",
            delay: i * 0.5 
          }}
          className="fixed z-[100] pointer-events-none rounded-2xl"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            border: `2px solid ${colors.glow}`,
            boxShadow: `0 0 30px ${colors.ring}, inset 0 0 20px ${colors.ring}`,
          }}
        />
      ))}

      {/* Particle effect for prominent intensity */}
      {intensity === 'prominent' && (
        <>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = Math.max(rect.width, rect.height) / 2 + 30;
            return (
              <motion.div
                key={`particle-${i}`}
                className="fixed z-[103] pointer-events-none w-2 h-2 rounded-full"
                style={{
                  backgroundColor: colors.border,
                  boxShadow: `0 0 10px ${colors.glow}`,
                  top: rect.top + rect.height / 2,
                  left: rect.left + rect.width / 2,
                }}
                animate={{
                  x: [0, Math.cos(angle) * radius],
                  y: [0, Math.sin(angle) * radius],
                  opacity: [1, 0],
                  scale: [0.5, 1.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </>
      )}

      {/* Corner accents with enhanced glow */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <motion.div
          key={pos}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.8, 1, 0.8], 
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            opacity: { duration: 2, repeat: Infinity, delay: i * 0.15 },
            scale: { delay: 0.2 + i * 0.05, duration: 2, repeat: Infinity },
          }}
          className={`fixed z-[103] pointer-events-none ${pos} w-3 h-3`}
          style={{
            top: pos.includes('top') ? rect.top - padding - 4 : rect.top + rect.height + padding - 8,
            left: pos.includes('left') ? rect.left - padding - 4 : rect.left + rect.width + padding - 8,
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: colors.border,
              boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.ring}`,
            }}
          />
        </motion.div>
      ))}

      {/* Floating indicator dots */}
      {intensity !== 'subtle' && (
        <motion.div
          className="fixed z-[104] pointer-events-none"
          style={{
            top: rect.top - padding - 20,
            left: rect.left + rect.width / 2 - 4,
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: colors.border,
              boxShadow: `0 0 10px ${colors.glow}`,
            }}
          />
        </motion.div>
      )}
    </>
  );
};
