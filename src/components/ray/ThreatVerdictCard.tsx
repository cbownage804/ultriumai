/**
 * ThreatVerdictCard — renders one URL/file/email verdict from Ray.
 *
 * The card is honest in two layers:
 *   1. What Ray can score on its own (safe / suspicious / malicious).
 *   2. What Ray *can't* determine without the vault — which of the user's
 *      real accounts this actually touches. When the vault is locked, the
 *      card carries a concrete, verdict-specific unlock reason instead of
 *      a generic prompt.
 */
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VaultUnlockDialog } from '@/components/ray/VaultUnlockDialog';
import {
  useRayContextAvailability,
  confidenceWithContext,
} from '@/lib/ray/contextAvailability';
import type { ThreatVerdict } from '@/lib/ray/threatVerdict';
import { cn } from '@/lib/utils';

interface Props {
  verdict: ThreatVerdict;
  /** Optional: accounts Ray already matched from an unlocked vault. */
  matchedAccounts?: Array<{ label: string; hasMfa?: boolean }>;
  className?: string;
}

const TONE = {
  safe: {
    icon: ShieldCheck,
    ring: 'border-emerald-500/25 bg-emerald-500/[0.04]',
    chip: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    label: 'Safe',
  },
  suspicious: {
    icon: ShieldAlert,
    ring: 'border-yellow-500/30 bg-yellow-500/[0.04]',
    chip: 'text-yellow-200 border-yellow-500/30 bg-yellow-500/10',
    label: 'Suspicious',
  },
  malicious: {
    icon: ShieldX,
    ring: 'border-red-500/30 bg-red-500/[0.05]',
    chip: 'text-red-200 border-red-500/30 bg-red-500/10',
    label: 'Malicious',
  },
} as const;

export function ThreatVerdictCard({ verdict, matchedAccounts, className }: Props) {
  const context = useRayContextAvailability();
  const tone = TONE[verdict.severity];
  const Icon = tone.icon;

  const needsVault = verdict.severity !== 'safe' && verdict.brands.length > 0;
  const vaultLocked = needsVault && !context.vault;

  const confidence = confidenceWithContext(
    verdict.baseConfidence,
    needsVault ? ['vault'] : [],
    context,
  );

  const personalized = matchedAccounts && matchedAccounts.length > 0;

  const unlockReason =
    verdict.brands.length === 1
      ? `I see this targets ${verdict.brands[0]}. Unlock so I can tell you whether you actually use ${verdict.brands[0]} — and if the password you use there is safe.`
      : `I see this targets ${verdict.brands.join(', ')}. Unlock so I can tell you which of those you actually use, whether any share a password, and which to rotate first.`;

  const unlockCapabilities = [
    `Check whether you have an account at ${verdict.brands.join(', ')}`,
    'Tell you if the password on that account is reused anywhere else',
    'Confirm whether MFA is already protecting it',
    'Rank which account to fix first based on real blast radius',
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('wrayth-chamfer border p-5 sm:p-6', tone.ring, className)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border', tone.chip)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em]">
            <span className={cn('rounded-full border px-2 py-0.5', tone.chip)}>{tone.label}</span>
            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-violet-200">
              {confidence}% confidence
            </span>
            <span className="text-muted-foreground/70">{verdict.kind}</span>
          </div>

          <h3 className="mt-2 text-base font-medium text-foreground">{verdict.headline}</h3>

          <p className="mt-1 truncate text-xs text-muted-foreground" title={verdict.input}>
            {verdict.input}
          </p>

          {verdict.reasons.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {verdict.reasons.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-violet-300/80">·</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Personalized layer — only meaningful with vault context. */}
          {personalized && (
            <div className="mt-4 rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-violet-200">
                <Eye className="h-3 w-3" /> Ray recommends
              </div>
              <p className="mt-1 text-sm text-foreground">
                {matchedAccounts!.length === 1
                  ? `You use ${matchedAccounts![0].label}. ${matchedAccounts![0].hasMfa ? 'MFA is already on it — rotate the password today.' : 'MFA is not on it yet. Rotate the password and turn on MFA first.'}`
                  : `${matchedAccounts!.length} of your accounts are in scope. Start with the ones without MFA.`}
              </p>
            </div>
          )}

          {vaultLocked && (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-yellow-500/25 bg-yellow-500/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                I can tell you what this is. I can only tell you if it affects <em>you</em> with your vault open.
              </p>
              <VaultUnlockDialog
                reason={unlockReason}
                capabilities={unlockCapabilities}
                trigger={
                  <Button size="sm" className="bg-violet-500 text-white hover:bg-violet-500/90 shrink-0">
                    Unlock to personalize
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
