import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const FIRST_VISIT_TIPS_KEY = 'ultrium_first_visit_tips';

interface FirstVisitTip {
  id: string;
  title: string;
  content: string;
  icon?: React.ReactNode;
}

interface FirstVisitTipsProps {
  pageId: string;
  tips: FirstVisitTip[];
  delay?: number;
}

export const FirstVisitTips = ({ pageId, tips, delay = 2000 }: FirstVisitTipsProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    // Check if user has seen tips for this page
    const seenPages = JSON.parse(localStorage.getItem(FIRST_VISIT_TIPS_KEY) || '[]');
    if (seenPages.includes(pageId)) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [pageId, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    const seenPages = JSON.parse(localStorage.getItem(FIRST_VISIT_TIPS_KEY) || '[]');
    localStorage.setItem(FIRST_VISIT_TIPS_KEY, JSON.stringify([...seenPages, pageId]));
  };

  const handleNext = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentTip > 0) {
      setCurrentTip(currentTip - 1);
    }
  };

  if (!isVisible || tips.length === 0) return null;

  const tip = tips[currentTip];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 right-6 z-[150] w-80"
      >
        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {/* Background */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5" />
          
          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(45 100% 50% / 0.4), transparent 50%, hsl(30 100% 50% / 0.3))',
              padding: '1px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
            animate={{
              background: [
                'linear-gradient(135deg, hsl(45 100% 50% / 0.4), transparent 50%, hsl(30 100% 50% / 0.3))',
                'linear-gradient(225deg, hsl(45 100% 50% / 0.4), transparent 50%, hsl(30 100% 50% / 0.3))',
                'linear-gradient(315deg, hsl(45 100% 50% / 0.4), transparent 50%, hsl(30 100% 50% / 0.3))',
                'linear-gradient(135deg, hsl(45 100% 50% / 0.4), transparent 50%, hsl(30 100% 50% / 0.3))',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />

          {/* Content */}
          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="p-2 rounded-xl bg-amber-500/10"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                </motion.div>
                <div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Quick Tips
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {currentTip + 1} of {tips.length}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tip content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="font-semibold text-base mb-2">{tip.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip.content}</p>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {tips.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTip(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    idx === currentTip 
                      ? "w-6 bg-amber-500" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handlePrev}
                disabled={currentTip === 0}
                className={cn(
                  "flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                  currentTip === 0 
                    ? "text-muted-foreground/40 cursor-not-allowed" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <ChevronLeft className="h-3 w-3" />
                Previous
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1 text-xs font-medium px-4 py-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                {currentTip === tips.length - 1 ? 'Got it!' : 'Next'}
                {currentTip < tips.length - 1 && <ChevronRight className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Reset first visit tips
export const resetFirstVisitTips = () => {
  localStorage.removeItem(FIRST_VISIT_TIPS_KEY);
};

// Check if user has seen tips for a page
export const hasSeenFirstVisitTips = (pageId: string): boolean => {
  const seenPages = JSON.parse(localStorage.getItem(FIRST_VISIT_TIPS_KEY) || '[]');
  return seenPages.includes(pageId);
};
