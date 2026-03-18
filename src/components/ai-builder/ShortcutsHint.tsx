import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const STORAGE_KEY = 'ai-builder-shortcuts-hint-dismissed';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Command palette' },
  { keys: ['⌘', 'S'], label: 'Save project' },
  { keys: ['⌘', 'Z'], label: 'Undo' },
  { keys: ['⌘', '⇧', 'Z'], label: 'Redo' },
  { keys: ['⌘', 'P'], label: 'Quick file switch' },
  { keys: ['⌘', '⇧', 'F'], label: 'Search in files' },
  { keys: ['⌘', 'Enter'], label: 'Send message' },
];

export function ShortcutsHint() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Show after a delay so it doesn't overwhelm with the welcome overlay
      const t = setTimeout(() => setShow(true), 8000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="fixed bottom-20 right-4 z-[100]"
      >
        {!expanded ? (
          <div className="flex items-center gap-1 rounded-xl bg-[#0d0d14] border border-white/[0.08] shadow-xl shadow-black/40 pr-1">
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2 px-3 py-2 transition-colors group"
            >
              <Keyboard className="h-3.5 w-3.5 text-cyan-400/60 group-hover:text-cyan-400" />
              <span className="text-[11px] text-white/40 group-hover:text-white/60">
                Press <kbd className="px-1 py-0.5 bg-white/[0.05] rounded text-[9px] font-mono text-cyan-400/70 mx-0.5">⌘K</kbd> for shortcuts
              </span>
            </button>
            <button onClick={dismiss} className="h-4 w-4 rounded flex items-center justify-center text-white/15 hover:text-white/40">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <div className="w-56 rounded-xl bg-[#0d0d14] border border-white/[0.08] shadow-xl shadow-black/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Keyboard className="h-3 w-3 text-cyan-400/60" />
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Shortcuts</span>
              </div>
              <button onClick={dismiss} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5">
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1">
              {SHORTCUTS.map(s => (
                <div key={s.label} className="flex items-center justify-between text-[10px]">
                  <span className="text-white/35">{s.label}</span>
                  <div className="flex items-center gap-0.5">
                    {s.keys.map((k, i) => (
                      <kbd key={i} className="px-1 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-[8px] font-mono text-white/30 min-w-[16px] text-center">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={dismiss}
              className="w-full mt-2 h-6 rounded-lg text-[9px] text-white/25 hover:text-white/40 hover:bg-white/[0.03] transition-colors"
            >
              Got it, don't show again
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}