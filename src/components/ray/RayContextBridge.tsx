/**
 * RayContextBridge — generic "Ray needs more context" surface.
 *
 * Any feature can drop this in to say: "I detected X. To tell you how it
 * affects you, I need context Y." Today Y is almost always the vault, but
 * the shape supports future contexts (browser, M365, agent) without a
 * rewrite.
 *
 * Pattern per the product philosophy:
 *   1. State what Ray knows.
 *   2. State honestly what Ray *cannot* determine without the context.
 *   3. Offer the exact unlock/connect action, with a reason.
 */
import { motion } from 'framer-motion';
import { ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VaultUnlockDialog } from '@/components/ray/VaultUnlockDialog';
import { useRayContextAvailability, type RayContextKey } from '@/lib/ray/contextAvailability';

interface Props {
  /** Short headline. E.g. "I found something suspicious." */
  headline: string;
  /** What Ray knows so far. */
  knows: string;
  /** What Ray needs unlocked/connected to determine impact. */
  needs: RayContextKey[];
  /** Reason for the ask — appears in the unlock dialog. */
  reason: string;
  /** Optional bullets shown inside the unlock dialog capability list. */
  capabilities?: string[];
  /** Optional confidence (0-100) shown as a subtle chip. */
  confidence?: number;
}

const LABELS: Record<RayContextKey, string> = {
  vault: 'Vault',
  identity: 'Identity',
  microsoft365: 'Microsoft 365',
  browser: 'Browser',
  devices: 'Devices',
  azure: 'Azure',
  entra: 'Entra',
  defender: 'Defender',
  firewall: 'Firewall',
  agent: 'Agent',
};

export function RayContextBridge({
  headline,
  knows,
  needs,
  reason,
  capabilities,
  confidence,
}: Props) {
  const available = useRayContextAvailability();
  const missing = needs.filter((k) => !available[k]);
  if (missing.length === 0) return null;

  const primaryAction = missing.includes('vault') ? (
    <VaultUnlockDialog
      reason={reason}
      capabilities={capabilities}
      trigger={
        <Button className="bg-violet-500 text-white hover:bg-violet-500/90 shrink-0">
          Unlock Vault
        </Button>
      }
    />
  ) : null;

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
              Ray needs context
              {typeof confidence === 'number' && (
                <span className="ml-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[10px] tracking-[0.14em] text-violet-200 normal-case">
                  Personalization available
                </span>
              )}
            </div>
            <h3 className="mt-1 text-base font-medium text-foreground">{headline}</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {knows}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span className="uppercase tracking-[0.18em]">Needs:</span>
              {missing.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5"
                >
                  {LABELS[k]}
                </span>
              ))}
            </div>
          </div>
        </div>
        {primaryAction}
      </div>
    </motion.section>
  );
}
