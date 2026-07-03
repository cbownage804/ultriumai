/**
 * ThreatAllClearCard — "you're clear" panel for the Threat Center.
 *
 * Real-data only. Sources shown are the ones the signed-in user actually
 * has wired up right now, with real "last checked" timestamps:
 *   - Microsoft / Google / GitHub / … → connected ray_integrations rows,
 *     using each row's last_sync_at.
 *   - Browser / device posture → newest wrayth_device_posture.captured_at.
 *   - Breach feeds → newest safeweb_assets row Ray is watching.
 *
 * If any unresolved safeweb_threats exist for the user, the "clear" card
 * hides itself entirely — a threat panel shouldn't lie.
 * If nothing at all is being monitored, it also hides so we don't fake
 * a green light.
 */
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SourceRow {
  key: string;
  label: string;
  lastChecked: string | null; // ISO timestamp
}

const PROVIDER_LABELS: Record<string, string> = {
  microsoft_365: 'Microsoft 365',
  microsoft365: 'Microsoft 365',
  microsoft: 'Microsoft',
  google: 'Google',
  google_workspace: 'Google Workspace',
  github: 'GitHub',
  azure: 'Azure',
  entra: 'Entra ID',
  defender: 'Microsoft Defender',
  firewall: 'Firewall',
  browser_extension: 'Browser extension',
  meshcentral: 'MeshCentral',
  agent: 'Wrayth agent',
};

function labelFor(provider: string): string {
  return (
    PROVIDER_LABELS[provider] ??
    provider
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function ThreatAllClearCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [hasActiveThreats, setHasActiveThreats] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [threatsRes, integrationsRes, postureRes, assetsRes] = await Promise.all([
          // Any unresolved threats? If yes, we hide the "clear" card.
          supabase
            .from('safeweb_threats')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .is('resolved_at', null),
          // Connected data sources with their real last-sync time.
          supabase
            .from('ray_integrations')
            .select('provider, status, last_sync_at, updated_at')
            .eq('user_id', user.id),
          // Newest posture snapshot from any of the user's Wrayth devices.
          supabase
            .from('wrayth_device_posture')
            .select('captured_at')
            .eq('user_id', user.id)
            .order('captured_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          // Any watched identity → breach feeds are being polled.
          supabase
            .from('safeweb_assets')
            .select('updated_at, last_checked_at, created_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const activeThreatCount = threatsRes.count ?? 0;
        setHasActiveThreats(activeThreatCount > 0);

        const rows: SourceRow[] = [];

        const integrations = (integrationsRes.data ?? []).filter(
          (i) => i.status === 'connected' || i.status === 'active',
        );
        // Dedupe by human label so "microsoft" + "microsoft_365" collapse.
        const seen = new Set<string>();
        for (const i of integrations) {
          const label = labelFor(i.provider);
          if (seen.has(label)) continue;
          seen.add(label);
          rows.push({
            key: i.provider,
            label,
            lastChecked: i.last_sync_at ?? i.updated_at ?? null,
          });
        }

        const posture = postureRes.data as { captured_at?: string } | null;
        if (posture?.captured_at) {
          rows.push({
            key: 'device_posture',
            label: 'Device posture',
            lastChecked: posture.captured_at,
          });
        }

        const asset = assetsRes.data as
          | { updated_at?: string; last_checked_at?: string; created_at?: string }
          | null;
        if (asset) {
          rows.push({
            key: 'breach_feeds',
            label: 'Breach feeds',
            lastChecked: asset.last_checked_at ?? asset.updated_at ?? asset.created_at ?? null,
          });
        }

        setSources(rows);
      } catch (err) {
        console.error('[ThreatAllClearCard] load failed', err);
        setSources([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const newestChecked = useMemo(() => {
    const times = sources
      .map((s) => (s.lastChecked ? new Date(s.lastChecked).getTime() : 0))
      .filter((t) => t > 0);
    if (times.length === 0) return null;
    return new Date(Math.max(...times));
  }, [sources]);

  if (loading) {
    return (
      <section className="wrayth-chamfer border border-border/60 bg-card/40 p-5 sm:p-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking your monitored sources…
        </div>
      </section>
    );
  }

  // Never claim "clear" if there are unresolved threats, or if nothing is
  // being monitored at all — either would be a lie.
  if (hasActiveThreats || sources.length === 0) {
    return null;
  }

  return (
    <section className="wrayth-chamfer border border-emerald-500/25 bg-emerald-500/[0.04] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/80">
            You're clear
          </div>
          <h3 className="mt-1 text-base font-medium text-foreground">
            Ray hasn't detected any active threats affecting your monitored accounts.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Sources I'm actively checking
            {newestChecked && (
              <>
                {' '}· last update {formatDistanceToNow(newestChecked, { addSuffix: true })}
              </>
            )}
            :
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {sources.map((s) => (
              <li
                key={s.key}
                title={
                  s.lastChecked
                    ? `Last checked ${formatDistanceToNow(new Date(s.lastChecked), { addSuffix: true })}`
                    : 'No sync timestamp yet'
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-2.5 py-0.5 text-xs text-emerald-200/90"
              >
                <Check className="h-3 w-3" aria-hidden />
                {s.label}
                {s.lastChecked && (
                  <span className="text-[10px] text-emerald-200/60">
                    · {formatDistanceToNow(new Date(s.lastChecked), { addSuffix: true })}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground/80">
            Everything looks good. I'll surface anything new the moment it changes.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ThreatAllClearCard;
