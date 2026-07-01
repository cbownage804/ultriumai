/**
 * ExposureVaultImpact — Ray's bridge from Exposure → Vault.
 *
 * For each monitored asset (email) that has active threats, Ray checks the
 * user's password vault and calls out the specific accounts that use that
 * email as the login. This turns "you were in a breach" into "here are the
 * three passwords to rotate right now."
 *
 * Only renders when there is real overlap. Silent otherwise — Ray doesn't
 * narrate victories that aren't happening yet.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowRight, KeyRound } from 'lucide-react';
import { useVault } from '@/hooks/useSafePass';
import { useMasterPassword } from '@/hooks/useMasterPassword';

interface Asset {
  id: string;
  asset_type: string;
  asset_value: string;
  threats_found?: number;
}

interface VaultMatch {
  email: string;
  breachCount: number;
  entries: { id: string; title: string }[];
}

interface Props {
  assets: Asset[];
}

export function ExposureVaultImpact({ assets }: Props) {
  const { loadAllEntries, getEntryUsername } = useVault();
  const { isUnlocked } = useMasterPassword();
  const [matches, setMatches] = useState<VaultMatch[]>([]);
  const [ready, setReady] = useState(false);

  // Emails Ray watches that currently have breach hits — nothing else matters here.
  const breachedEmails = useMemo(
    () =>
      assets
        .filter((a) => a.asset_type === 'email' && (a.threats_found ?? 0) > 0)
        .map((a) => ({ email: a.asset_value.toLowerCase().trim(), count: a.threats_found ?? 0 })),
    [assets],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!isUnlocked || breachedEmails.length === 0) {
        setMatches([]);
        setReady(true);
        return;
      }
      const entries = await loadAllEntries();
      const byEmail = new Map<string, { id: string; title: string }[]>();
      for (const entry of entries) {
        const username = (await getEntryUsername(entry)).toLowerCase().trim();
        if (!username || !username.includes('@')) continue;
        const arr = byEmail.get(username) ?? [];
        arr.push({ id: entry.id, title: entry.title });
        byEmail.set(username, arr);
      }
      const built: VaultMatch[] = breachedEmails
        .map(({ email, count }) => ({
          email,
          breachCount: count,
          entries: byEmail.get(email) ?? [],
        }))
        .filter((m) => m.entries.length > 0);
      if (!cancelled) {
        setMatches(built);
        setReady(true);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [breachedEmails, isUnlocked, loadAllEntries, getEntryUsername]);

  if (!ready || matches.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-primary/80">
                Ray connected the dots
              </div>
              <h3 className="mt-1 text-base font-medium text-foreground">
                Passwords in your vault use these exposed emails
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A breach on the email is only half the story. If the account also stores a
                password here, rotating it is the fastest way to shut the door.
              </p>
            </div>

            <ul className="space-y-3">
              {matches.map((m) => (
                <li
                  key={m.email}
                  className="rounded-xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">{m.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.breachCount} {m.breachCount === 1 ? 'exposure' : 'exposures'} · used by{' '}
                        {m.entries.length} vault{' '}
                        {m.entries.length === 1 ? 'entry' : 'entries'}
                      </div>
                    </div>
                    <Link
                      to="/app/passwords/list"
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      Rotate now <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.entries.slice(0, 6).map((e) => (
                      <span
                        key={e.id}
                        className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[11px] text-foreground/80"
                      >
                        <KeyRound className="h-3 w-3 text-primary" />
                        {e.title}
                      </span>
                    ))}
                    {m.entries.length > 6 && (
                      <span className="text-[11px] text-muted-foreground">
                        +{m.entries.length - 6} more
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
