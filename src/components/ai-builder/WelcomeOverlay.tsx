/**
 * WelcomeOverlay — First-run welcome with "Build in 60 seconds" quick-start flow
 * Shows once for new users, then stores completion in localStorage
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Wand2, Eye, Code2, Rocket, Layers,
  ChevronRight, X, Brain, ArrowRight, Smartphone, Zap,
  Globe, Database, Shield, Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'ai-builder-welcome-shown';

type WelcomeStep = 'hero' | 'quickstart' | 'features';

const QUICK_START_PROMPTS = [
  { icon: '🚀', label: 'Landing Page', prompt: 'Build a modern SaaS landing page with hero section, features grid, pricing cards, and footer', color: 'from-rose-500/20 to-orange-500/10 border-rose-500/20' },
  { icon: '📊', label: 'Dashboard', prompt: 'Build an analytics dashboard with sidebar navigation, stat cards, line chart, and recent activity table', color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20' },
  { icon: '🛒', label: 'E-commerce', prompt: 'Build an e-commerce storefront with product grid, filters, shopping cart drawer, and checkout form', color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/20' },
  { icon: '💬', label: 'Chat App', prompt: 'Build a real-time chat interface with conversation list sidebar, message bubbles, and input with file upload', color: 'from-violet-500/20 to-purple-500/10 border-violet-500/20' },
];

const FEATURES = [
  { icon: Wand2, title: 'Describe → Build', desc: 'Type what you want. Production-ready code appears instantly.', color: 'text-cyan-400' },
  { icon: Eye, title: 'Live Preview', desc: 'See your app running in real-time with responsive viewports.', color: 'text-emerald-400' },
  { icon: Code2, title: 'Full Code Editor', desc: 'Monaco editor with AI autocomplete and multi-file tabs.', color: 'text-violet-400' },
  { icon: Database, title: 'Full-Stack Ready', desc: 'Database, auth, storage, and API — auto-detected from your prompts.', color: 'text-amber-400' },
  { icon: Smartphone, title: 'Mobile Export', desc: 'Export as PWA or native app for App Store & Google Play.', color: 'text-pink-400' },
  { icon: Rocket, title: 'One-Click Deploy', desc: 'Deploy to Vercel, Netlify, Docker, or export as ZIP.', color: 'text-orange-400' },
];

interface WelcomeOverlayProps {
  onDismiss?: () => void;
  onQuickStart?: (prompt: string) => void;
}

export function WelcomeOverlay({ onDismiss, onQuickStart }: WelcomeOverlayProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<WelcomeStep>('hero');

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

  const handleQuickStart = (prompt: string) => {
    handleDismiss();
    onQuickStart?.(prompt);
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
          <AnimatePresence mode="wait">
            {step === 'hero' && (
              <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                {/* Header */}
                <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-violet-500/[0.04] to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-gradient-to-b from-cyan-500/[0.08] to-transparent blur-3xl pointer-events-none" />
                  
                  <button onClick={handleDismiss} className="absolute top-4 right-4 h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 z-10">
                    <X className="h-4 w-4" />
                  </button>

                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
                      <Sparkles className="h-7 w-7 text-cyan-400" />
                    </div>
                  </motion.div>
                  <h2 className="text-xl font-bold text-white/95 relative z-10">Welcome to AI App Builder</h2>
                  <p className="text-sm text-white/40 mt-1.5 relative z-10">Build full-stack apps with natural language — in under 60 seconds</p>
                </div>

                {/* Quick actions */}
                <div className="px-6 pb-4 space-y-2">
                  <button
                    onClick={() => setStep('quickstart')}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Zap className="h-4 w-4" />
                    Quick Start — Pick a Template
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep('features')}
                      className="flex-1 h-10 rounded-xl border border-white/[0.08] text-white/50 text-xs font-medium hover:bg-white/[0.04] hover:text-white/70 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      See All Features
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="flex-1 h-10 rounded-xl border border-white/[0.08] text-white/50 text-xs font-medium hover:bg-white/[0.04] hover:text-white/70 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      Start from Scratch
                    </button>
                  </div>
                </div>

                {/* Pro tips */}
                <div className="mx-6 mb-6 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="h-3 w-3 text-violet-400" />
                    <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Pro Tips</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-white/40">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400/50 shrink-0">•</span>
                      <span>Press <kbd className="px-1 py-0.5 bg-white/[0.05] rounded text-[9px] font-mono text-cyan-400/70">⌘K</kbd> anytime for the command palette</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400/50 shrink-0">•</span>
                      <span>Use <strong className="text-white/60">Build</strong> mode for code, <strong className="text-white/60">Chat</strong> mode for planning</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400/50 shrink-0">•</span>
                      <span>Errors auto-fix up to 3 times — just click <strong className="text-white/60">Smart Fix</strong></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'quickstart' && (
              <motion.div key="quickstart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white/90">Pick a starting point</h3>
                    <p className="text-[11px] text-white/35 mt-0.5">The AI will build it instantly — then you can customize with follow-up prompts</p>
                  </div>
                  <button onClick={handleDismiss} className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-6 pb-4 space-y-2">
                  {QUICK_START_PROMPTS.map((p, i) => (
                    <motion.button
                      key={p.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => handleQuickStart(p.prompt)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border bg-gradient-to-r transition-all hover:scale-[1.01] hover:shadow-lg group",
                        p.color
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white/80">{p.label}</div>
                          <div className="text-[10px] text-white/35 mt-0.5 line-clamp-1">{p.prompt}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="px-6 pb-6 flex gap-2">
                  <button onClick={() => setStep('hero')} className="flex-1 h-9 rounded-lg border border-white/[0.08] text-white/40 text-xs hover:bg-white/[0.04] transition-colors">
                    ← Back
                  </button>
                  <button onClick={handleDismiss} className="flex-1 h-9 rounded-lg border border-white/[0.08] text-white/40 text-xs hover:bg-white/[0.04] transition-colors">
                    Skip — I'll type my own
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'features' && (
              <motion.div key="features" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white/90">Everything you need</h3>
                    <p className="text-[11px] text-white/35 mt-0.5">Full-stack app development, powered by AI</p>
                  </div>
                  <button onClick={handleDismiss} className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-6 pb-4 grid grid-cols-2 gap-2">
                  {FEATURES.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <Icon className={cn("h-4 w-4 mb-1.5", f.color)} />
                        <h4 className="text-[11px] font-semibold text-white/80">{f.title}</h4>
                        <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">{f.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="px-6 pb-6 flex gap-2">
                  <button onClick={() => setStep('hero')} className="flex-1 h-9 rounded-lg border border-white/[0.08] text-white/40 text-xs hover:bg-white/[0.04] transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep('quickstart')}
                    className="flex-1 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-1"
                  >
                    Start Building <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}