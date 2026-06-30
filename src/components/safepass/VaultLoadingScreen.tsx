import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Key, Fingerprint } from 'lucide-react';

const loadingMessages = [
  { text: "Unlocking your secure vault...", icon: Lock },
  { text: "Decrypting credentials with AES-256...", icon: Shield },
  { text: "Verifying encryption keys...", icon: Key },
  { text: "Establishing secure connection...", icon: Fingerprint },
  { text: "Loading your digital fortress...", icon: Shield },
  { text: "Preparing zero-knowledge access...", icon: Lock },
  { text: "Retrieving encrypted data...", icon: Key },
];

interface VaultLoadingScreenProps {
  isLoading: boolean;
}

export const VaultLoadingScreen = ({ isLoading }: VaultLoadingScreenProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setMessageIndex(0);
      return;
    }

    // Rotate messages every 1.5 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Cap at 90% until actually loaded
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  const currentMessage = loadingMessages[messageIndex];
  const IconComponent = currentMessage.icon;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          {/* Animated Lock Icon */}
          <div className="relative mb-8">
            {/* Outer ring animation */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              style={{ width: 120, height: 120, margin: -20 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Middle ring animation */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              style={{ width: 100, height: 100, margin: -10 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Icon container */}
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30"
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(245, 158, 11, 0.2)",
                  "0 0 40px rgba(245, 158, 11, 0.4)",
                  "0 0 20px rgba(245, 158, 11, 0.2)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={messageIndex}
                  initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconComponent className="h-10 w-10 text-primary" />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Loading message */}
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-primary font-medium text-lg mb-6 text-center"
            >
              {currentMessage.text}
            </motion.p>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="w-64 h-1 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 90)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Security badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Shield className="h-3 w-3 text-primary/60" />
            <span>Protected with military-grade encryption</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VaultLoadingScreen;
