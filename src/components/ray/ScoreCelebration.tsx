/**
 * ScoreCelebration — one-shot celebration when Ray's score reaches 100.
 *
 * Renders a calm, premium violet burst with confetti-like particles.
 * Guards itself per-user via localStorage so it only fires once per
 * milestone (re-fires if the score drops and recovers to 100).
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "wrayth:score100:lastCelebratedAt";

export function ScoreCelebration({ score }: { score: number | null | undefined }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (score !== 100) return;
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      // Re-celebrate if more than 7 days since last hit — feels intentional, not spammy.
      if (last && Date.now() - Number(last) < 7 * 24 * 3600_000) return;
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [score]);

  // Reset gate if score drops below 100, so next 100 fires again.
  useEffect(() => {
    if (score != null && score < 100) {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }, [score]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          {/* Particles */}
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute h-1.5 w-1.5 rounded-full bg-violet-300"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: Math.cos((i / 24) * Math.PI * 2) * (180 + Math.random() * 80),
                y: Math.sin((i / 24) * Math.PI * 2) * (180 + Math.random() * 80),
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 1.8, delay: 0.1 + (i % 6) * 0.05, ease: "easeOut" }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="relative max-w-md w-[92%] rounded-3xl border border-violet-400/30 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 text-center shadow-[0_0_120px_-20px_rgba(167,139,250,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              className="mx-auto mb-4 h-14 w-14 rounded-full bg-violet-500/15 border border-violet-400/40 flex items-center justify-center"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-6 w-6 text-violet-200" />
            </motion.div>

            <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300/90 mb-2">
              Ray Score
            </div>
            <div className="text-6xl font-semibold tabular-nums text-white">100</div>

            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Every account is strong. Every recommendation is handled. I'll keep watch and
              tell you the moment anything changes.
            </p>
            <div className="mt-1 text-xs text-slate-500">— Ray</div>

            <Button
              variant="outline"
              size="sm"
              className="mt-6 bg-white/5 border-white/10 text-slate-100 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Keep watch
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ScoreCelebration;
