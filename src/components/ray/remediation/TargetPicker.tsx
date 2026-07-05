/**
 * TargetPicker — picks a device (agent) or Microsoft 365 user (ms365) for
 * a remediation. Loads the right list on demand.
 */
import { useEffect, useState } from 'react';
import { Loader2, MonitorSmartphone, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Remediation } from '@/lib/ray/remediations/types';

export interface ResolvedTarget {
  id: string;
  label: string;
  params?: Record<string, unknown>;
}

interface Props {
  remediation: Remediation;
  value: ResolvedTarget | null;
  onChange: (t: ResolvedTarget | null) => void;
}

interface DeviceRow { id: string; hostname: string | null; os: string | null; last_seen_at: string | null }
interface Ms365User { id: string; userPrincipalName: string | null; displayName: string | null }

export function TargetPicker({ remediation, value, onChange }: Props) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceRow[] | null>(null);
  const [users, setUsers] = useState<Ms365User[] | null>(null);
  const [notConnected, setNotConnected] = useState(false);

  const needsDevice = remediation.target === 'device';
  const needsUser = remediation.target === 'user';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      if (needsDevice) {
        const { data } = await supabase
          .from('wrayth_devices')
          .select('id, hostname, os, last_seen_at, revoked_at')
          .eq('user_id', user.id)
          .is('revoked_at', null)
          .order('last_seen_at', { ascending: false });
        if (!cancelled) {
          const rows = (data as DeviceRow[]) ?? [];
          setDevices(rows);
          if (rows.length === 1 && !value) {
            onChange({ id: rows[0].id, label: rows[0].hostname ?? 'Unnamed device' });
          }
        }
      } else if (needsUser) {
        // Users are cached in vanguard_m365_tenants / synced tables; fall back to Graph via ms-graph-sync results.
        // Cheap read: vanguard_m365_mfa_status has user rows we already sync.
        const { data, error } = await supabase
          .from('vanguard_m365_mfa_status')
          .select('m365_user_id, user_principal_name, display_name')
          .eq('user_id', user.id)
          .order('display_name', { ascending: true })
          .limit(500);
        if (!cancelled) {
          if (error || !data || data.length === 0) {
            setNotConnected(true);
            setUsers([]);
          } else {
            setUsers(data.map((r) => ({
              id: (r as { m365_user_id: string }).m365_user_id,
              userPrincipalName: (r as { user_principal_name: string | null }).user_principal_name,
              displayName: (r as { display_name: string | null }).display_name,
            })));
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, needsDevice, needsUser]); // eslint-disable-line react-hooks/exhaustive-deps

  if (needsDevice) {
    return (
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
          <MonitorSmartphone className="h-3 w-3" /> Choose a device
        </div>
        {devices === null ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your devices…
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
            No enrolled devices yet. Install the Wrayth agent first.
          </div>
        ) : (
          <ul className="space-y-1 max-h-56 overflow-y-auto">
            {devices.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onChange({ id: d.id, label: d.hostname ?? 'Unnamed device' })}
                  className={cn(
                    'w-full text-left rounded border px-3 py-2 text-sm transition-colors',
                    value?.id === d.id
                      ? 'border-violet-400/60 bg-violet-500/10'
                      : 'border-border bg-background/40 hover:border-violet-400/40',
                  )}
                >
                  <div className="font-medium truncate">{d.hostname ?? 'Unnamed device'}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d.os ?? 'Windows'} · {d.last_seen_at
                      ? `seen ${formatDistanceToNow(new Date(d.last_seen_at), { addSuffix: true })}`
                      : 'never seen'}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (needsUser) {
    return (
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
          <User className="h-3 w-3" /> Choose a Microsoft 365 user
        </div>
        {users === null ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading users…
          </div>
        ) : notConnected || users.length === 0 ? (
          <div className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
            No Microsoft 365 users synced yet. Connect Microsoft 365 in Integrations and run a sync first.
          </div>
        ) : (
          <ul className="space-y-1 max-h-56 overflow-y-auto">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onChange({
                    id: u.id,
                    label: u.userPrincipalName ?? u.displayName ?? u.id,
                  })}
                  className={cn(
                    'w-full text-left rounded border px-3 py-2 text-sm transition-colors',
                    value?.id === u.id
                      ? 'border-violet-400/60 bg-violet-500/10'
                      : 'border-border bg-background/40 hover:border-violet-400/40',
                  )}
                >
                  <div className="font-medium truncate">
                    {u.displayName ?? u.userPrincipalName ?? 'Unknown user'}
                  </div>
                  {u.userPrincipalName && u.displayName && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {u.userPrincipalName}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Tenant / message not implemented in Phase 1 UI.
  return (
    <div className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
      Target picker for <span className="text-foreground">{remediation.target}</span> coming soon.
    </div>
  );
}
