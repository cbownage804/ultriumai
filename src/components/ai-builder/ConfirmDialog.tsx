/**
 * ConfirmDialog — Reusable confirmation dialog for destructive actions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm',
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      iconBg: 'from-red-500/20 to-red-600/10',
      button: 'bg-red-500/80 hover:bg-red-500 text-white',
    },
    warning: {
      icon: 'text-amber-400',
      iconBg: 'from-amber-500/20 to-amber-600/10',
      button: 'bg-amber-500/80 hover:bg-amber-500 text-black',
    },
    info: {
      icon: 'text-cyan-400',
      iconBg: 'from-cyan-500/20 to-cyan-600/10',
      button: 'bg-cyan-500/80 hover:bg-cyan-500 text-black',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-[#0d0d14] border border-white/[0.08] rounded-xl shadow-2xl p-5"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", styles.iconBg)}>
              <AlertTriangle className={cn("h-5 w-5", styles.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white/90">{title}</h3>
              <p className="text-[12px] text-white/40 mt-1 leading-relaxed">{description}</p>
            </div>
            <button onClick={onClose} className="h-6 w-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 shrink-0">
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="flex gap-2 mt-5 justify-end">
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={cn("h-8 px-4 rounded-lg text-xs font-medium transition-all", styles.button)}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
