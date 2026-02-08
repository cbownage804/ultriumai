/**
 * WelcomeOverlay — First-run welcome with feature highlights
 * Shows once for new users, then stores completion in localStorage
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Wand2, Eye, Code2, GitBranch, Rocket, Layers,
  ChevronRight, X, Brain, MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'ai-builder-welcome-shown';

const FEATURES = [
  {
    icon: Wand2,
    title: 'Describe → Build',
    desc: 'Type what you want and watch production-ready code appear instantly.',
    color: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-400',
  },
  {
    icon: Eye,
    title: 'Live Preview',
    desc: 'See your app running in real-time with responsive viewports and visual editing.',
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Code2,
    title: 'Full Code Editor',
    desc: 'Monaco editor with AI autocomplete, inline actions, and multi-file support.',
    color: 'from-violet-500/20 to-violet-600/10',
    iconColor: 'text-violet-400',
  },
  {
    icon: Rocket,
    title: 'Export & Deploy',
    desc: 'One-click deploy or export as Docker, Full-Stack, or ZIP — production-ready.',
    color: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-400',
  },
];

interface WelcomeOverlayProps {
  onDismiss?: () => void;
}

export function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    onDismiss?.();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9997] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-[#0d0d14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-violet-500/[0.04] to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-gradient-to-b from-cyan-500/[0.08] to-transparent blur-3xl pointer-events-none" />
            
            <button onClick={handleDismiss} className="absolute top-4 right-4 h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 z-10">
              <X className="h-4 w-4" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="relative z-10"
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
                <Sparkles className="h-7 w-7 text-cyan-400" />
              </div>
            </motion.div>
            <h2 className="text-xl font-bold text-white/95 relative z-10">Welcome to AI App Builder</h2>
            <p className="text-sm text-white/40 mt-1.5 relative z-10">Build full-stack apps with natural language</p>
          </div>

          {/* Features grid */}
          <div className="px-6 pb-4 grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
                >
                  <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2 border border-white/[0.04]", f.color)}>
                    <Icon className={cn("h-4 w-4", f.iconColor)} />
                  </div>
                  <h4 className="text-[12px] font-semibold text-white/80">{f.title}</h4>
                  <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Pro tips */}
          <div className="mx-6 mb-4 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Pro Tips</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-white/40">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400/50 shrink-0">•</span>
                <span>Use <kbd className="px-1 py-0.5 bg-white/[0.05] rounded text-[9px] font-mono text-cyan-400/70">⌘K</kbd> for the command palette — search files, run actions, switch views</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400/50 shrink-0">•</span>
                <span>Toggle between <strong className="text-white/60">Chat</strong> and <strong className="text-white/60">Build</strong> mode in the input bar</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400/50 shrink-0">•</span>
                <span>Click the <strong className="text-white/60">? icon</strong> in the sidebar anytime for help</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <button
              onClick={handleDismiss}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              Start Building
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
