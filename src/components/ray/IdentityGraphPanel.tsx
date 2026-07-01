/**
 * IdentityGraphPanel — Ray's cross-reasoning view for the Identity page.
 *
 * Combines watched assets with decrypted vault usernames to explain how each
 * identifier ties into real accounts and current breach exposure. Silent when
 * there's nothing to reason about.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AtSign, Globe, ArrowRight, ShieldAlert, ShieldCheck, Network } from 'lucide-react';
import { useVault } from '@/hooks/useSafePass';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { buildIdentityGraph, type GraphAsset, type IdentifierNode } from '@/lib/ray/identityGraph';
import { cn } from '@/lib/utils';

interface Props {
  assets: GraphAsset[];
  primaryEmail: string | null;
}

export function IdentityGraphPanel({ assets, primaryEmail }: Props) {
  const { loadAllEntries, getEntryUsername } = useVault();
  const { isUnlocked } = useMasterPassword();
  const [vault, setVault] = useState<{ id: string; title: string; username: string }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isUnlocked) {
        setVault([]);
        setReady(true);
        return;
      }
      const entries = await loadAllEntries();
      const decoded = await Promise.all(
        entries.map(async (e) => ({
          id: e.id,
          title: e.title,
          username: (await getEntryUsername(e)) ?? '',
        })),
      );
      if (!cancelled) {
        setVault(decoded);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isUnlocked, loadAllEntries, getEntryUsername]);

  const graph = useMemo(() => buildIdentityGraph(assets, vault, primaryEmail), [assets, vault, primaryEmail]);

  if (!ready) return null;
  if (graph.identifiers.length === 0) return null;

  const headline =
    graph.totals.accountsAtRisk > 0
      ? `${graph.totals.accountsAtRisk} vault account${graph.totals.accountsAtRisk === 1 ? '' : 's'} sit behind exposed identifiers`
      : graph.totals.exposedIdentifiers > 0
      ? 'Ray sees exposure on identifiers you\u2019re watching'
      : 'Here\u2019s how your identifiers connect to real accounts';

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Network className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-primary/80">Identity graph</div>
            <h3 className="mt-1 text-base font-medium text-foreground">{headline}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ray maps every email and domain to the accounts it protects so a single exposure never
              catches you by surprise.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <Metric label="Identifiers" value={graph.totals.identifiers} />
            <Metric label="Accounts linked" value={graph.totals.accountsLinked} />
            <Metric
              label="Exposed identifiers"
              value={graph.totals.exposedIdentifiers}
              tone={graph.totals.exposedIdentifiers > 0 ? 'warning' : 'stable'}
            />
            <Metric
              label="Accounts at risk"
              value={graph.totals.accountsAtRisk}
              tone={graph.totals.accountsAtRisk > 0 ? 'critical' : 'stable'}
            />
          </div>

          <ul className="space-y-2">
            {graph.identifiers.slice(0, 8).map((node) => (
              <IdentifierRow key={`${node.kind}:${node.value}`} node={node} />
            ))}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}

function IdentifierRow({ node }: { node: IdentifierNode }) {
  const Icon = node.kind === 'email' ? AtSign : Globe;
  const StatusIcon =
    node.severity === 'critical' || node.severity === 'warning' ? ShieldAlert : ShieldCheck;
  const statusClass =
    node.severity === 'critical'
      ? 'text-red-400'
      : node.severity === 'warning'
      ? 'text-yellow-300'
      : 'text-green-400/80';
  return (
    <li className="rounded-xl border border-border/60 bg-background/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background">
          <Icon className="h-3.5 w-3.5 text-foreground/80" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-foreground">{node.value}</div>
          <div className="text-xs italic text-muted-foreground">{node.reasoning}</div>
        </div>
        <StatusIcon className={cn('h-4 w-4 shrink-0', statusClass)} />
      </div>
      {node.accounts.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {node.accounts.slice(0, 6).map((a) => (
            <span
              key={a.id}
              className="rounded-md bg-muted/60 px-2 py-1 text-[11px] text-foreground/80"
            >
              {a.title}
            </span>
          ))}
          {node.accounts.length > 6 && (
            <span className="text-[11px] text-muted-foreground">+{node.accounts.length - 6} more</span>
          )}
          <Link
            to="/app/passwords/list"
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            Open in vault <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </li>
  );
}

function Metric({
  label,
  value,
  tone = 'stable',
}: {
  label: string;
  value: number;
  tone?: 'stable' | 'warning' | 'critical';
}) {
  const toneClass =
    tone === 'critical' ? 'text-red-400' : tone === 'warning' ? 'text-yellow-300' : 'text-foreground';
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <div className={cn('text-lg font-light tabular-nums leading-none', toneClass)}>{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );
}
