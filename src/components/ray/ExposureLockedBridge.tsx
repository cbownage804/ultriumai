/**
 * ExposureLockedBridge — Ray reasoning across domains.
 *
 * When Exposure detects breach hits on watched identities but the vault
 * is locked, Ray can't determine impact. This surfaces that reasoning:
 * "I found something. Unlock so I can tell you whether you're affected."
 *
 * Renders nothing when the vault is unlocked (ExposureVaultImpact handles
 * the follow-through) or when there are no breach hits to reason about.
 */

import { motion } from 'framer-motion';
import { ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { VaultUnlockDialog } from '@/components/ray/VaultUnlockDialog';

interface Asset {
  id: string;
  asset_type: string;
  asset_value: string;
  threats_found?: number;
}

interface Props {
  assets: Asset[];
}

export function ExposureLockedBridge({ assets }: Props) {
  const { isUnlocked, hasUserSetMasterPassword } = useMasterPassword();
  if (isUnlocked || !hasUserSetMasterPassword()) return null;

  const breachedEmails = assets.filter(
    (a) => a.asset_type === 'email' && (a.threats_found ?? 0) > 0,
  );
  if (breachedEmails.length === 0) return null;

  const count = breachedEmails.length;
  const reason =
    count === 1
      ? `A breach was detected on ${breachedEmails[0].asset_value}. Unlock your vault so I can check whether that password is still in use.`
      : `Breaches were detected on ${count} of your watched identities. Unlock your vault so I can check which of those passwords are still in use.`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="wrayth-chamfer border border-yellow-500/30 bg-yellow-500/[0.04] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-500/10 text-yellow-200 shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
              <Sparkles className="h-3 w-3" />
              Ray needs the vault
            </div>
            <h3 className="mt-1 text-base font-medium text-foreground">
              {count === 1
                ? 'I found something — but I can only take it further with your vault open.'
                : `I found ${count} things — but I can only take them further with your vault open.`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {reason}
            </p>
          </div>
        </div>
        <VaultUnlockDialog
          reason={reason}
          capabilities={[
            'Check whether you still use the breached password',
            'Find every other account where it is reused',
            'Rank which account to rotate first',
            'Confirm whether MFA already protects each one',
          ]}
          trigger={
            <Button className="bg-violet-500 text-white hover:bg-violet-500/90 shrink-0">
              Unlock Vault
            </Button>
          }
        />
      </div>
    </motion.section>
  );
}
