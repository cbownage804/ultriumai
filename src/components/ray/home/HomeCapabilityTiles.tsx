/**
 * HomeCapabilityTiles — surfaces the capabilities Ray has built into Wrayth
 * on the Home page as a compact 2-column grid. Every tile pulls real data
 * (no fabrication). Empty states are honest — no zeros dressed up as wins.
 *
 * Tiles:
 *   1. Devices           (wrayth_devices)
 *   2. Today's Priorities (ray_recommendations, open)
 *   3. Ray's Activity    (useLiveActivity feed)
 *   4. Microsoft 365     (vanguard_m365_tenants + mfa_status)
 *   5. Organization Memory (ray_org_memory)
 *   6. Agent Releases    (wrayth_agent_release + wrayth_devices)
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Laptop,
  ListChecks,
  Activity,
  Building2,
  BrainCircuit,
  PackageCheck,
  ArrowRight,
  AlertTriangle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { useLiveActivity } from '@/lib/ray/liveActivity';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ------------------------------ shared shell ------------------------------ */

function Tile({
  icon: Icon,
  label,
  title,
  href,
  linkLabel,
  children,
  accent = 'violet',
}: {
  icon: typeof Laptop;
  label: string;
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  accent?: 'violet' | 'sky' | 'emerald' | 'amber';
}) {
  const accents: Record<string, string> = {
    violet: 'text-violet-300',
    sky: 'text-sky-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
  };
  return (
    <div className="wrayth-chamfer border border-border bg-card/40 p-5 flex flex-col min-h-[180px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', accents[accent])} />
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
        </div>
        {href && (
          <Link
            to={href}
            className="text-[11px] text-violet-300 hover:text-violet-200 inline-flex items-center gap-1"
          >
            {linkLabel ?? 'Open'} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <h3 className="text-base font-light text-foreground mb-3">{title}</h3>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic">{text}</p>;
}

/* ------------------------------ 1. Devices ------------------------------ */

function DevicesTile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    total: number;
    online: number;
    offline: number;
    needsAttention: number;
    latest: { hostname: string | null; last_seen_at: string | null } | null;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('wrayth_devices')
        .select('id, hostname, last_seen_at, agent_version')
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .order('last_seen_at', { ascending: false });
      if (!active) return;
      const rows = data ?? [];
      const now = Date.now();
      const online = rows.filter(
        (r) => r.last_seen_at && now - new Date(r.last_seen_at).getTime() < 10 * 60 * 1000,
      ).length;
      const needsAttention = rows.filter(
        (r) => !r.last_seen_at || now - new Date(r.last_seen_at).getTime() > 24 * 60 * 60 * 1000,
      ).length;
      setStats({
        total: rows.length,
        online,
        offline: rows.length - online,
        needsAttention,
        latest: rows[0] ? { hostname: rows[0].hostname, last_seen_at: rows[0].last_seen_at } : null,
      });
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <Tile
      icon={Laptop}
      label="Devices"
      title={
        stats == null
          ? 'Checking…'
          : stats.total === 0
          ? 'No enrolled devices yet'
          : `${stats.total} device${stats.total === 1 ? '' : 's'} protected`
      }
      accent="sky"
      href="/app/devices"
      linkLabel="View all"
    >
      {stats == null ? (
        <Empty text="Loading device inventory…" />
      ) : stats.total === 0 ? (
        <div className="space-y-2">
          <Empty text="Enroll a device to let Ray keep an eye on it." />
          <Button asChild size="sm" variant="secondary" className="min-h-[36px]">
            <Link to="/app/devices">Enroll a device</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Online now</span>
            <span className="text-emerald-300">{stats.online}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Offline</span>
            <span className="text-foreground">{stats.offline}</span>
          </li>
          {stats.needsAttention > 0 && (
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-300" /> Needs attention
              </span>
              <span className="text-amber-300">{stats.needsAttention}</span>
            </li>
          )}
          {stats.latest?.last_seen_at && (
            <li className="text-[11px] text-muted-foreground pt-1">
              Last check-in {formatDistanceToNow(new Date(stats.latest.last_seen_at), { addSuffix: true })}
            </li>
          )}
        </ul>
      )}
    </Tile>
  );
}

/* -------------------------- 2. Today's Priorities -------------------------- */

type Priority = {
  id: string;
  title: string;
  severity: string | null;
  suggested_actions: Array<{ label: string; intent: string; target: string }> | null;
  body: string | null;
};

function PrioritiesTile() {
  const [items, setItems] = useState<Priority[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, count } = await supabase
        .from('ray_recommendations')
        .select('id, title, severity, suggested_actions, body', { count: 'exact' })
        .in('status', ['new', 'reviewed'])
        .order('severity', { ascending: true })
        .order('last_seen_at', { ascending: false })
        .limit(3);
      if (!active) return;
      setItems((data as Priority[]) ?? []);
      setTotal(count ?? 0);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Tile
      icon={ListChecks}
      label="Today's priorities"
      title={
        items == null
          ? 'Reading Ray\u2019s queue…'
          : total === 0
          ? 'You\u2019re all caught up'
          : `${total} thing${total === 1 ? '' : 's'} I\u2019d tackle today`
      }
      accent="violet"
      href="/app/ray/recommendations"
      linkLabel={total > 3 ? `Review all ${total}` : 'Review'}
    >
      {items == null ? (
        <Empty text="Loading recommendations…" />
      ) : items.length === 0 ? (
        <Empty text="Nothing urgent. Ray will nudge you when that changes." />
      ) : (
        <ul className="space-y-2">
          {items.map((r) => {
            const action = r.suggested_actions?.[0];
            return (
              <li key={r.id} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 rounded-full shrink-0',
                    r.severity === 'danger'
                      ? 'bg-red-400'
                      : r.severity === 'warn'
                      ? 'bg-amber-400'
                      : 'bg-violet-400',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate">{r.title}</p>
                </div>
                {action?.intent === 'navigate' ? (
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                    <Link to={action.target}>{action.label}</Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-violet-300"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('ray:panel-open', {
                          detail: {
                            message: `What should I do about "${r.title}"?`,
                            context: { kind: 'recommendation', id: r.id, title: r.title, body: r.body ?? undefined },
                          },
                        }),
                      )
                    }
                  >
                    <MessageSquare className="h-3 w-3 mr-1" /> Ask
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Tile>
  );
}

/* -------------------------- 3. Ray's live activity -------------------------- */

function ActivityTile() {
  const { user } = useAuth();
  const events = useLiveActivity(user?.id);
  const rows = (events ?? []).slice(0, 5);

  return (
    <Tile
      icon={Activity}
      label="Ray's activity"
      title="What I\u2019ve been doing"
      accent="emerald"
      href="/app/timeline"
      linkLabel="Timeline"
    >
      {events == null ? (
        <Empty text="Listening for live activity…" />
      ) : rows.length === 0 ? (
        <Empty text="Quiet right now. New actions will show up here in real time." />
      ) : (
        <ul className="space-y-1.5">
          {rows.map((e) => (
            <li key={e.id} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400/70 shrink-0" />
              <span className="text-foreground/90 truncate flex-1">{e.text}</span>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {formatDistanceToNow(e.at, { addSuffix: true })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

/* ------------------------------ 4. Microsoft 365 ------------------------------ */

function M365Tile() {
  const { user } = useAuth();
  const [state, setState] = useState<
    | { connected: false }
    | { connected: true; tenantName: string | null; total: number; mfaOn: number; admins: number }
    | null
  >(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      const { data: tenants } = await supabase
        .from('vanguard_m365_tenants')
        .select('id, tenant_name')
        .eq('user_id', user.id)
        .limit(1);
      if (!active) return;
      const tenant = tenants?.[0];
      if (!tenant) {
        setState({ connected: false });
        return;
      }
      const { data: mfa } = await supabase
        .from('vanguard_m365_mfa_status')
        .select('mfa_enabled, is_admin')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.id);
      const rows = mfa ?? [];
      setState({
        connected: true,
        tenantName: tenant.tenant_name,
        total: rows.length,
        mfaOn: rows.filter((r) => r.mfa_enabled).length,
        admins: rows.filter((r) => r.is_admin).length,
      });
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <Tile
      icon={Building2}
      label="Microsoft 365"
      title={
        state == null
          ? 'Checking tenant…'
          : !state.connected
          ? 'Not connected yet'
          : state.tenantName ?? 'Your tenant'
      }
      accent="sky"
      href="/app/m365"
      linkLabel={state?.connected ? 'Open' : 'Connect'}
    >
      {state == null ? (
        <Empty text="Loading identity posture…" />
      ) : !state.connected ? (
        <Empty text="Connect Microsoft 365 to let Ray watch identity risk and MFA coverage." />
      ) : (
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Users</span>
            <span className="text-foreground">{state.total}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">MFA enabled</span>
            <span className={state.total > 0 && state.mfaOn === state.total ? 'text-emerald-300' : 'text-amber-300'}>
              {state.mfaOn}/{state.total}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Admins</span>
            <span className="text-foreground">{state.admins}</span>
          </li>
        </ul>
      )}
    </Tile>
  );
}

/* --------------------------- 5. Organization memory --------------------------- */

function OrgMemoryTile() {
  const { activeOrg, hasOrg } = useActiveOrg();
  const [items, setItems] = useState<{ id: string; key: string; value: string; category: string | null }[] | null>(
    null,
  );
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!hasOrg || !activeOrg?.id) {
      setItems([]);
      setTotal(0);
      return;
    }
    let active = true;
    (async () => {
      const { data, count } = await supabase
        .from('ray_org_memory')
        .select('id, key, value, category', { count: 'exact' })
        .eq('org_id', activeOrg.id)
        .order('updated_at', { ascending: false })
        .limit(3);
      if (!active) return;
      setItems((data as any) ?? []);
      setTotal(count ?? 0);
    })();
    return () => {
      active = false;
    };
  }, [activeOrg?.id, hasOrg]);

  return (
    <Tile
      icon={BrainCircuit}
      label="Organization memory"
      title={
        !hasOrg
          ? 'Solo mode'
          : items == null
          ? 'Recalling…'
          : total === 0
          ? 'Ray hasn\u2019t learned anything yet'
          : `${total} thing${total === 1 ? '' : 's'} Ray remembers`
      }
      accent="violet"
      href={hasOrg ? '/app/ray/memory' : undefined}
      linkLabel="View memory"
    >
      {!hasOrg ? (
        <Empty text="Join or create an organization so Ray can remember your team\u2019s decisions." />
      ) : items == null ? (
        <Empty text="Loading memory…" />
      ) : items.length === 0 ? (
        <Empty text="As you make decisions, Ray will remember them here." />
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map((m) => (
            <li key={m.id} className="text-foreground/90">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider mr-2">
                {m.category ?? 'note'}
              </span>
              <span className="truncate">
                <span className="text-violet-200">{m.key}</span>
                <span className="text-muted-foreground"> — </span>
                <span>{m.value}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

/* ------------------------------ 6. Agent releases ------------------------------ */

function AgentReleasesTile() {
  const { user } = useAuth();
  const [state, setState] = useState<{
    stable: string | null;
    beta: string | null;
    total: number;
    upToDate: number;
    outdated: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [releasesRes, devicesRes] = await Promise.all([
        supabase
          .from('wrayth_agent_release')
          .select('version, channel, is_latest')
          .eq('is_latest', true),
        user?.id
          ? supabase
              .from('wrayth_devices')
              .select('agent_version, release_channel')
              .eq('user_id', user.id)
              .is('revoked_at', null)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);
      if (!active) return;
      const releases = releasesRes.data ?? [];
      const stable = releases.find((r) => r.channel === 'stable')?.version ?? null;
      const beta = releases.find((r) => r.channel === 'beta')?.version ?? null;
      const devices = (devicesRes.data as any[]) ?? [];
      const upToDate = devices.filter((d) => d.agent_version && d.agent_version === stable).length;
      setState({
        stable,
        beta,
        total: devices.length,
        upToDate,
        outdated: devices.length - upToDate,
      });
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <Tile
      icon={PackageCheck}
      label="Agent releases"
      title={
        state == null
          ? 'Checking releases…'
          : state.stable
          ? `Current agent ${state.stable}`
          : 'No release published yet'
      }
      accent="amber"
      href="/app/devices"
      linkLabel="Manage"
    >
      {state == null ? (
        <Empty text="Loading release channels…" />
      ) : (
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Stable</span>
            <span className="text-foreground">{state.stable ?? '—'}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Beta</span>
            <span className="text-foreground">{state.beta ?? '—'}</span>
          </li>
          {state.total > 0 && (
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Your fleet</span>
              <span className={state.outdated === 0 ? 'text-emerald-300' : 'text-amber-300'}>
                {state.upToDate}/{state.total} up to date
              </span>
            </li>
          )}
        </ul>
      )}
    </Tile>
  );
}

/* --------------------------------- export --------------------------------- */

export function HomeCapabilityTiles() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-3.5 w-3.5 text-violet-300/80" />
        <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Everything Ray is running for you
        </span>
      </div>
      <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <PrioritiesTile />
        <DevicesTile />
        <ActivityTile />
        <M365Tile />
        <OrgMemoryTile />
        <AgentReleasesTile />
      </div>
    </section>
  );
}

export default HomeCapabilityTiles;
