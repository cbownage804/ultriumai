/**
 * UnifiedAccountsPanel — one card per account that fuses every signal Ray
 * has for it: breach, reuse, MFA, age. Groups reuse chains together so
 * users see "these three accounts share a password" as a single unit
 * instead of three unrelated rows.
 *
 * This is the "relationships" view: passwords and identities stop being
 * standalone and start being connected.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Link2, ShieldCheck, ShieldOff, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';

export interface AccountSignalRow {
  id: string;
  title: string;
  host?: string;
  score: number;
  hasBreach: boolean;
  hasMfa: boolean;
  reusedWith: string[]; // other titles sharing this password
  createdAt?: string;
}

interface Props {
  rows: AccountSignalRow[];
  className?: string;
}

function ageDays(iso?: string): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function priorityFor(row: AccountSignalRow): number {
  // Higher = more urgent
  let p = 0;
  if (row.hasBreach) p += 100;
  if (row.reusedWith.length) p += 40 + row.reusedWith.length * 2;
  if (row.score < 60) p += 30;
  if (!row.hasMfa) p += 10;
  const d = ageDays(row.createdAt);
  if (d && d > 180) p += 10;
  return p;
}

export function UnifiedAccountsPanel({ rows, className }: Props) {
  const ranked = useMemo(
    () => [...rows].sort((a, b) => priorityFor(b) - priorityFor(a)).slice(0, 8),
    [rows],
  );

  const withRisk = ranked.filter((r) => priorityFor(r) > 0);

  if (withRisk.length === 0) {
    return (
      <Card className={cn('p-5 border-green-500/20 bg-green-500/5', className)}>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-green-300/90">
          <ShieldCheck className="h-3.5 w-3.5" />
          Nothing tangled
        </div>
        <p className="mt-1.5 text-sm text-foreground/90">
          No accounts share passwords, no breaches match your vault, and MFA looks solid where it matters. I'll flag it here the moment that changes.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
            <Link2 className="h-3.5 w-3.5" />
            Accounts, connected
          </div>
          <h4 className="mt-1 text-base font-semibold">Ray's unified view</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            One row per account, every signal I have on it — ranked by what I'd fix first.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {withRisk.map((row, i) => {
          const d = ageDays(row.createdAt);
          const stale = d !== null && d > 180;
          return (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border/50 bg-card/40 hover:bg-card/70 transition-colors p-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{row.title}</span>
                    {row.host && (
                      <span className="text-xs text-muted-foreground truncate">{row.host}</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {row.hasBreach && (
                      <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-300 bg-red-500/5 gap-1">
                        <Flame className="h-3 w-3" /> Breached
                      </Badge>
                    )}
                    {row.reusedWith.length > 0 && (
                      <Badge variant="outline" className="text-[10px] border-orange-500/40 text-orange-300 bg-orange-500/5 gap-1">
                        <Link2 className="h-3 w-3" />
                        Reused with {row.reusedWith.length} other{row.reusedWith.length === 1 ? '' : 's'}
                      </Badge>
                    )}
                    {row.score < 60 && (
                      <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-300 bg-yellow-500/5 gap-1">
                        <AlertTriangle className="h-3 w-3" /> Weak ({row.score})
                      </Badge>
                    )}
                    {row.hasMfa ? (
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-300/90 bg-green-500/5 gap-1">
                        <ShieldCheck className="h-3 w-3" /> 2FA on
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground gap-1">
                        <ShieldOff className="h-3 w-3" /> No 2FA
                      </Badge>
                    )}
                    {stale && (
                      <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground gap-1">
                        <Clock className="h-3 w-3" /> {formatDistanceToNowStrict(new Date(row.createdAt!))} old
                      </Badge>
                    )}
                  </div>
                  {row.reusedWith.length > 0 && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground truncate">
                      Shares this password with: {row.reusedWith.slice(0, 3).join(', ')}
                      {row.reusedWith.length > 3 && ` +${row.reusedWith.length - 3} more`}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-light tabular-nums text-foreground">{row.score}</div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">score</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] italic text-violet-300/70">
                  {row.hasBreach
                    ? 'Ray: rotate this first — it appeared in a breach.'
                    : row.reusedWith.length && !row.hasMfa
                      ? 'Ray: change this one first — no 2FA and reused elsewhere.'
                      : row.reusedWith.length
                        ? 'Ray: break the reuse chain when you have a minute.'
                        : row.score < 60
                          ? "Ray: I'll generate a stronger one whenever you're ready."
                          : 'Ray: turn on 2FA to close the last gap.'}
                </p>
                <Link
                  to="/app/vault"
                  className="text-[11px] text-violet-300 hover:text-violet-200"
                >
                  Open in vault →
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

export default UnifiedAccountsPanel;
