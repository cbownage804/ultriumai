/**
 * Animated Voice Orb Component
 * ElevenLabs-style animated sphere that responds to voice activity
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoiceOrbProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VoiceOrb({ 
  isActive, 
  isSpeaking, 
  isListening,
  size = 'md',
  className 
}: VoiceOrbProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer glow layers */}
      {isActive && (
        <>
          <motion.div
            className={cn(
              "absolute rounded-full bg-cyan-500/10 blur-xl",
              size === 'sm' ? 'w-24 h-24' : size === 'md' ? 'w-36 h-36' : 'w-48 h-48'
            )}
            animate={{
              scale: isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : 1,
              opacity: isSpeaking ? [0.3, 0.5, 0.3] : 0.2,
            }}
            transition={{
              duration: isSpeaking ? 0.5 : 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className={cn(
              "absolute rounded-full bg-blue-500/10 blur-lg",
              size === 'sm' ? 'w-20 h-20' : size === 'md' ? 'w-28 h-28' : 'w-40 h-40'
            )}
            animate={{
              scale: isSpeaking ? [1.1, 0.9, 1.1] : [1, 1.05, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: isSpeaking ? 0.3 : 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.1
            }}
          />
        </>
      )}

      {/* Main orb with conic gradient */}
      <motion.div
        className={cn(
          "relative rounded-full overflow-hidden",
          sizeClasses[size]
        )}
        style={{
          background: isActive 
            ? 'conic-gradient(from 0deg, #0ea5e9, #3b82f6, #1e40af, #0c4a6e, #0ea5e9)'
            : 'conic-gradient(from 0deg, #374151, #4b5563, #374151, #1f2937, #374151)'
        }}
        animate={{
          rotate: isActive ? 360 : 0,
          scale: isSpeaking ? [1, 1.05, 0.98, 1.02, 1] : isListening ? [1, 1.02, 1] : 1,
        }}
        transition={{
          rotate: {
            duration: isSpeaking ? 2 : 8,
            repeat: Infinity,
            ease: "linear"
          },
          scale: {
            duration: isSpeaking ? 0.4 : 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        {/* Inner radial gradient overlay */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)'
          }}
        />
        
        {/* Animated highlight */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)'
          }}
          animate={{
            opacity: isSpeaking ? [0.5, 0.8, 0.5] : 0.6,
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Wave effect when speaking */}
        {isSpeaking && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{
                  scale: [0.8, 1.3],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}

        {/* Pulse rings when listening */}
        {isListening && !isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-500/50"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>

      {/* Center highlight dot */}
      <motion.div
        className={cn(
          "absolute rounded-full bg-white/20",
          size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
        )}
        style={{
          top: size === 'sm' ? '25%' : '28%',
          left: size === 'sm' ? '30%' : '32%',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
