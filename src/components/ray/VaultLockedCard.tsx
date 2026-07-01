/**
 * VaultLockedCard — Ray's "encrypted black box" treatment.
 *
 * When the vault has passwords but is locked on this device, the dashboard
 * shouldn't pretend it can see them. This card leans into the zero-knowledge
 * story instead: Ray shows what he *can't* know until you unlock, plus the
 * guarantees that make that true.
 *
 * Renders inline on the dashboard in place of Vault metrics.
 */

import { motion } from 'framer-motion';
import { Lock, Check, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VaultUnlockDialog } from '@/components/ray/VaultUnlockDialog';

const GUARANTEES = [
  'Zero-knowledge encryption',
  'AES-256-GCM',
  'Master password never leaves your device',
];

interface Props {
  /** Optional Ray line, e.g. "A new breach may affect one of your accounts." */
  rayNote?: string;
}

export function VaultLockedCard({ rayNote }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="wrayth-chamfer border border-border bg-card/60 p-5 sm:p-7"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Vault locked
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-light text-foreground">
              Your passwords are encrypted on this device.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
              {rayNote ?? (
                <>
                  I can only analyze your passwords after you unlock the vault. Nothing about
                  them — not the count, not the strength, not the sites — reaches me until you do.
                </>
              )}
            </p>
          </div>
        </div>
        <VaultUnlockDialog
          trigger={
            <Button
              size="lg"
              className="bg-violet-500 text-white hover:bg-violet-500/90 gap-2 shrink-0"
            >
              <KeyRound className="h-4 w-4" />
              Unlock Vault
            </Button>
          }
        />
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {GUARANTEES.map((g) => (
          <div
            key={g}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs text-foreground/80"
          >
            <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
            {g}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
