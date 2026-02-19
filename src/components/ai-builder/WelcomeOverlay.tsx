/**
 * WelcomeOverlay — First-run welcome with polished quick-start flow
 * Shows once for new users, stores completion in localStorage
 * Dispatches a custom event when dismissed so OnboardingTour can start after
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Wand2, Eye, Code2, Rocket, Layers,
  ChevronRight, X, Brain, ArrowRight, Smartphone, Zap,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const WELCOME_STORAGE_KEY = 'ai-builder-welcome-shown';
export const WELCOME_DISMISSED_EVENT = 'ai-builder-welcome-dismissed';

type WelcomeStep = 'hero' | 'quickstart' | 'features';

const QUICK_START_PROMPTS = [
  { icon: '🚀', label: 'Landing Page', prompt: 'Build a modern SaaS landing page with hero section, features grid, pricing cards, and footer', color: 'border-rose-500/30 bg-rose-500/[0.06] hover:bg-rose-500/[0.12]' },
  { icon: '📊', label: 'Dashboard', prompt: 'Build an analytics dashboard with sidebar navigation, stat cards, line chart, and recent activity table', color: 'border-blue-500/30 bg-blue-500/[0.06] hover:bg-blue-500/[0.12]' },
  { icon: '🛒', label: 'E-commerce', prompt: 'Build an e-commerce storefront with product grid, filters, shopping cart drawer, and checkout form', color: 'border-amber-500/30 bg-amber-500/[0.06] hover:bg-amber-500/[0.12]' },
  { icon: '🎨', label: 'Portfolio', prompt: 'Build a creative portfolio site with hero section, project gallery with modal previews, about section, and contact form', color: 'border-pink-500/30 bg-pink-500/[0.06] hover:bg-pink-500/[0.12]' },
  { icon: '⚡', label: 'SaaS App', prompt: 'Build a SaaS application with authentication, settings page, billing section, team management, and a main dashboard', color: 'border-emerald-500/30 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12]' },
  { icon: '💬', label: 'Chat App', prompt: 'Build a real-time chat interface with conversation list sidebar, message bubbles, and input with file upload', color: 'border-violet-500/30 bg-violet-500/[0.06] hover:bg-violet-500/[0.12]' },
];

const FEATURES = [
  { icon: Wand2, title: 'Describe → Build', desc: 'Type what you want. Production-ready code appears instantly.', color: 'text-cyan-400' },
  { icon: Eye, title: 'Live Preview', desc: 'See your app running in real-time with responsive viewports.', color: 'text-emerald-400' },
  { icon: Code2, title: 'Full Code Editor', desc: 'Monaco editor with AI autocomplete and multi-file tabs.', color: 'text-violet-400' },
  { icon: Database, title: 'Full-Stack Ready', desc: 'Database, auth, storage, and API — auto-detected from prompts.', color: 'text-amber-400' },
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
    const seen = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
    // Tell OnboardingTour it can start now
    window.dispatchEvent(new CustomEvent(WELCOME_DISMISSED_EVENT));
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
        className="fixed inset-0 z-[9997] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="w-full max-w-lg bg-[#0c0c10] border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {step === 'hero' && (
              <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                {/* Header */}
                <div className="relative px-8 pt-10 pb-6 text-center overflow-hidden">
                  {/* Glow effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.08] via-violet-500/[0.05] to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] h-[180px] bg-gradient-to-b from-cyan-500/[0.12] to-transparent blur-3xl pointer-events-none" />
                  
                  <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-colors z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                    className="relative z-10"
                  >
                    <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                    <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-white/[0.15] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-cyan-500/20">
                      <Sparkles className="h-8 w-8 text-cyan-400" />
                    </div>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white relative z-10"
                  >
                    Welcome to AI App Builder
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-white/60 mt-2 relative z-10"
                  >
                    Build full-stack apps with natural language — in under 60 seconds
                  </motion.p>
                </div>

                {/* Quick actions */}
                <div className="px-8 pb-5 space-y-3">
                  <button
                    onClick={() => setStep('quickstart')}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
                  >
                    <Zap className="h-4 w-4" />
                    Quick Start — Pick a Template
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep('features')}
                      className="flex-1 h-11 rounded-xl border border-white/[0.12] text-white/70 text-xs font-medium hover:bg-white/[0.06] hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      See All Features
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="flex-1 h-11 rounded-xl border border-white/[0.12] text-white/70 text-xs font-medium hover:bg-white/[0.06] hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      Start from Scratch
                    </button>
                  </div>
                </div>

                {/* Pro tips */}
                <div className="mx-8 mb-8 rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Brain className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Pro Tips</span>
                  </div>
                  <div className="space-y-2 text-xs text-white/60">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                      <span>Press <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-[10px] font-mono text-cyan-400">⌘K</kbd> anytime for the command palette</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                      <span>Use <strong className="text-white/80">Build</strong> mode for code, <strong className="text-white/80">Chat</strong> mode for planning</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                      <span>Errors auto-fix up to 3 times — just click <strong className="text-white/80">Smart Fix</strong></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'quickstart' && (
              <motion.div key="quickstart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="px-8 pt-8 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Pick a starting point</h3>
                    <p className="text-xs text-white/50 mt-1">The AI will build it instantly — then customize with follow-up prompts</p>
                  </div>
                  <button onClick={handleDismiss} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-8 pb-5 space-y-2">
                  {QUICK_START_PROMPTS.map((p, i) => (
                    <motion.button
                      key={p.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i }}
                      onClick={() => handleQuickStart(p.prompt)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-lg group",
                        p.color
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white/90">{p.label}</div>
                          <div className="text-[11px] text-white/45 mt-0.5 line-clamp-1">{p.prompt}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/25 group-hover:text-white/60 transition-colors shrink-0" />
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="px-8 pb-8 flex gap-2">
                  <button onClick={() => setStep('hero')} className="flex-1 h-10 rounded-xl border border-white/[0.12] text-white/60 text-xs font-medium hover:bg-white/[0.06] hover:text-white transition-colors">
                    ← Back
                  </button>
                  <button onClick={handleDismiss} className="flex-1 h-10 rounded-xl border border-white/[0.12] text-white/60 text-xs font-medium hover:bg-white/[0.06] hover:text-white transition-colors">
                    Skip — I'll type my own
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'features' && (
              <motion.div key="features" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="px-8 pt-8 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Everything you need</h3>
                    <p className="text-xs text-white/50 mt-1">Full-stack app development, powered by AI</p>
                  </div>
                  <button onClick={handleDismiss} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-8 pb-5 grid grid-cols-2 gap-2.5">
                  {FEATURES.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i }}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 hover:bg-white/[0.05] transition-colors"
                      >
                        <Icon className={cn("h-5 w-5 mb-2", f.color)} />
                        <h4 className="text-xs font-semibold text-white/90">{f.title}</h4>
                        <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">{f.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="px-8 pb-8 flex gap-2">
                  <button onClick={() => setStep('hero')} className="flex-1 h-10 rounded-xl border border-white/[0.12] text-white/60 text-xs font-medium hover:bg-white/[0.06] hover:text-white transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep('quickstart')}
                    className="flex-1 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-1"
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
