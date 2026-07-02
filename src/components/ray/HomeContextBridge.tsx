/**
 * HomeContextBridge — applies Ray's context-availability pattern to the
 * Home dashboard.
 *
 * Chooses ONE bridge to surface, in priority order:
 *   1. Vault locked but identity is present → unlock to connect breaches to accounts.
 *   2. Vault unlocked but no monitored identity → add one so Ray can watch.
 *   3. Vault unlocked, identity present, no browser extension yet → install it.
 * Returns null when Ray already has the context he needs, or when the
 * caller is already showing the higher-priority `VaultLockedCard`.
 */
import { useRayContextAvailability } from '@/lib/ray/contextAvailability';
import { RayContextBridge } from '@/components/ray/RayContextBridge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Props {
  /**
   * When true, the caller is already rendering VaultLockedCard for the
   * vault-locked case — this component should skip the vault ask so we
   * don't double up.
   */
  vaultLockedCardVisible?: boolean;
  vaultCount: number;
}

export function HomeContextBridge({ vaultLockedCardVisible, vaultCount }: Props) {
  const ctx = useRayContextAvailability();

  // Case 1: vault locked + identity present. VaultLockedCard already covers
  // pure vault-locked; only add the extra reasoning if it isn't visible.
  if (!ctx.vault && ctx.identity && !vaultLockedCardVisible) {
    return (
      <RayContextBridge
        headline="I'm watching your identity — unlock the vault so I can connect the dots."
        knows="You've told me which emails matter and I'm watching them. If any of them show up in a breach, I can only tell you which accounts to rotate once the vault is open."
        needs={['vault']}
        reason="Connect the identities I'm watching to the accounts they protect."
        capabilities={[
          'Match breached emails to real vault entries',
          'Rank rotations by which accounts share the same password',
          'Turn a future breach into a one-click fix',
        ]}
        confidence={60}
      />
    );
  }

  // Case 2: vault unlocked, no identity yet.
  if (ctx.vault && !ctx.identity && vaultCount > 0) {
    return (
      <section className="wrayth-chamfer border border-yellow-500/30 bg-yellow-500/[0.04] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
              Ray needs context
            </div>
            <h3 className="mt-1 text-base font-medium text-foreground">
              Tell me which identities to watch.
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Your vault is open and I can see every account inside it, but I
              have no email or domain to watch for exposure. Add the addresses
              you actually use and I'll flag a breach the moment it lands.
            </p>
            <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Needs: <span className="ml-1 rounded-full border border-border/60 bg-background/40 px-2 py-0.5 normal-case tracking-normal text-muted-foreground">Identity</span>
            </div>
          </div>
          <Button asChild className="bg-violet-500 text-white hover:bg-violet-500/90 shrink-0">
            <Link to="/app/exposure">Set up Watch</Link>
          </Button>
        </div>
      </section>
    );
  }

  // Case 3: everything on except the browser — the next high-leverage context.
  if (ctx.vault && ctx.identity && !ctx.browser && vaultCount > 0) {
    return (
      <section className="wrayth-chamfer border border-violet-400/25 bg-violet-500/[0.04] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
              Ray suggests
            </div>
            <h3 className="mt-1 text-base font-medium text-foreground">
              Give me eyes in the browser too.
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              I know your vault and your identities. With the browser
              extension I can stop reuse before you save a password, warn on
              lookalike domains, and autofill safely. It's the last piece I'm
              missing.
            </p>
            <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Needs: <span className="ml-1 rounded-full border border-border/60 bg-background/40 px-2 py-0.5 normal-case tracking-normal text-muted-foreground">Browser</span>
            </div>
          </div>
          <Button asChild variant="outline" className="border-violet-400/40 text-violet-100 hover:bg-violet-500/10 shrink-0">
            <Link to="/app/integrations">Get the extension</Link>
          </Button>
        </div>
      </section>
    );
  }

  return null;
}

export default HomeContextBridge;
