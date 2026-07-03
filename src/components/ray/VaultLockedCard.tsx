/**
 * VaultLockedCard — Ray's sealed-vault surface.
 *
 * The vault is zero-knowledge for *contents*, but non-sensitive inventory
 * metadata (the item count and when Ray last ran a health check) is safe
 * to show even while sealed — it stops Home from appearing to lose data
 * every time the vault re-locks.
 *
 * Never shows: password names, domains, usernames, per-item strength,
 * reuse relationships, or breach→vault mappings. Those only appear after
 * unlock.
 */

import { motion } from 'framer-motion';
import { Lock, Check, KeyRound, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { VaultUnlockDialog } from '@/components/ray/VaultUnlockDialog';

const GUARANTEES = [
  'Zero-knowledge encryption',
  'AES-256-GCM',
  'Master password never leaves your device',
];

interface Props {
  /** Persistent inventory count from safe metadata (row count only). */
  vaultCount?: number;
  /** Timestamp of the last vault health check, if known. */
  lastHealthCheckAt?: string | Date | null;
  /** Non-sensitive one-line summary of the last known health check. */
  lastHealthSummary?: string | null;
  /** Optional Ray line, e.g. "A new breach may affect one of your accounts." */
  rayNote?: string;
}

export function VaultLockedCard({
  vaultCount,
  lastHealthCheckAt,
  lastHealthSummary,
  rayNote,
}: Props) {
  const count = typeof vaultCount === 'number' ? vaultCount : null;
  const checkedAt = lastHealthCheckAt ? new Date(lastHealthCheckAt) : null;

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
              Vault sealed
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-light text-foreground">
              {count === null
                ? 'Your passwords are encrypted on this device.'
                : count === 1
                  ? '1 password stored · sealed on this device.'
                  : `${count} passwords stored · sealed on this device.`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
              {rayNote ?? (
                <>
                  I can see the inventory count, but not what's in it. Names, domains,
                  strength, and reuse relationships stay encrypted until you unlock.
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

      {(count !== null || checkedAt || lastHealthSummary) && (
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {count !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs text-foreground/80">
              <Shield className="h-3.5 w-3.5 text-violet-300 shrink-0" />
              <span className="tabular-nums">
                {count} {count === 1 ? 'password' : 'passwords'} stored
              </span>
            </div>
          )}
          {checkedAt && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="text-foreground/70">Last health check</span>
              <span>· {formatDistanceToNow(checkedAt, { addSuffix: true })}</span>
            </div>
          )}
          {lastHealthSummary && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs text-foreground/80 sm:col-span-1">
              {lastHealthSummary}
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
        Vault counts are stored as safe metadata. Password contents and item details
        stay encrypted until you unlock.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
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
