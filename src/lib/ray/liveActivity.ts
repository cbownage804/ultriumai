/**
 * Ray's live activity feed — truthful, real-time.
 *
 * Pulls the most recent events across the tables Ray actually observes:
 *   - wrayth_device_actions (remediations Ray ran)
 *   - ray_findings (things Ray noticed)
 *   - ray_recommendations (things Ray suggested)
 *   - wrayth_devices (agents that checked in)
 *
 * Subscribes to postgres_changes so new rows appear as they happen.
 * The panel renders these directly — nothing is fabricated.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ActivityKind =
  | 'action_succeeded'
  | 'action_failed'
  | 'action_started'
  | 'finding_new'
  | 'finding_cleared'
  | 'recommendation_new'
  | 'device_checkin'
  | 'score_change';

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  text: string;
  at: Date;
};

const MAX_ROWS = 12;

function fmtActionType(t: string | null | undefined): string {
  if (!t) return 'a remediation';
  return t.replace(/_/g, ' ').toLowerCase();
}

async function fetchInitial(userId: string): Promise<ActivityEvent[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [actionsRes, findingsRes, recsRes, devicesRes] = await Promise.all([
    supabase
      .from('wrayth_device_actions')
      .select('id, action_type, status, created_at, completed_at')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('ray_findings')
      .select('id, kind, created_at, resolved_at')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('ray_recommendations')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('wrayth_devices')
      .select('id, hostname, last_seen_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('last_seen_at', { ascending: false })
      .limit(5),
  ]);

  const events: ActivityEvent[] = [];

  for (const a of actionsRes.data ?? []) {
    const status = (a.status ?? '').toLowerCase();
    const at = new Date(a.completed_at ?? a.created_at);
    const label = fmtActionType(a.action_type);
    if (status === 'succeeded') {
      events.push({ id: `act-${a.id}`, kind: 'action_succeeded', text: `Ran ${label} successfully`, at });
    } else if (status === 'failed' || status === 'cancelled') {
      events.push({ id: `act-${a.id}`, kind: 'action_failed', text: `${label} needs attention`, at });
    } else {
      events.push({ id: `act-${a.id}`, kind: 'action_started', text: `Started ${label}`, at });
    }
  }
  for (const f of findingsRes.data ?? []) {
    const label = String(f.kind ?? 'finding').replace(/_/g, ' ');
    if (f.resolved_at) {
      events.push({ id: `fin-r-${f.id}`, kind: 'finding_cleared', text: `Cleared: ${label}`, at: new Date(f.resolved_at) });
    } else {
      events.push({ id: `fin-${f.id}`, kind: 'finding_new', text: `Noticed: ${label}`, at: new Date(f.created_at) });
    }
  }
  for (const r of recsRes.data ?? []) {
    events.push({ id: `rec-${r.id}`, kind: 'recommendation_new', text: `New recommendation: ${r.title}`, at: new Date(r.created_at) });
  }
  for (const d of devicesRes.data ?? []) {
    if (d.last_seen_at) {
      events.push({
        id: `dev-${d.id}`,
        kind: 'device_checkin',
        text: `${d.hostname ?? 'A device'} checked in`,
        at: new Date(d.last_seen_at),
      });
    }
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, MAX_ROWS);
}

export function useLiveActivity(userId: string | undefined) {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void fetchInitial(userId).then((rows) => {
      if (active) setEvents(rows);
    });

    const push = (e: ActivityEvent) => {
      setEvents((prev) => {
        const base = prev ?? [];
        if (base.some((x) => x.id === e.id)) return base;
        return [e, ...base].slice(0, MAX_ROWS);
      });
    };

    const channel = supabase
      .channel(`ray-live-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wrayth_device_actions', filter: `user_id=eq.${userId}` },
        (payload) => {
          const a: any = payload.new;
          push({
            id: `act-${a.id}`,
            kind: 'action_started',
            text: `Started ${fmtActionType(a.action_type)}`,
            at: new Date(a.created_at ?? Date.now()),
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wrayth_device_actions', filter: `user_id=eq.${userId}` },
        (payload) => {
          const a: any = payload.new;
          const status = (a.status ?? '').toLowerCase();
          if (status !== 'succeeded' && status !== 'failed' && status !== 'cancelled') return;
          push({
            id: `act-${a.id}-${status}`,
            kind: status === 'succeeded' ? 'action_succeeded' : 'action_failed',
            text:
              status === 'succeeded'
                ? `Ran ${fmtActionType(a.action_type)} successfully`
                : `${fmtActionType(a.action_type)} needs attention`,
            at: new Date(a.completed_at ?? Date.now()),
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ray_findings', filter: `user_id=eq.${userId}` },
        (payload) => {
          const f: any = payload.new;
          const label = String(f.kind ?? 'a new finding').replace(/_/g, ' ');
          push({
            id: `fin-${f.id}`,
            kind: 'finding_new',
            text: `Noticed: ${label}`,
            at: new Date(f.created_at ?? Date.now()),
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ray_recommendations', filter: `user_id=eq.${userId}` },
        (payload) => {
          const r: any = payload.new;
          push({
            id: `rec-${r.id}`,
            kind: 'recommendation_new',
            text: `New recommendation: ${r.title ?? 'a new item'}`,
            at: new Date(r.created_at ?? Date.now()),
          });
        },
      )
      .subscribe();

    // Refresh device checkins on a light interval — realtime on device rows is noisy.
    const iv = setInterval(() => {
      void fetchInitial(userId).then((rows) => {
        if (active) setEvents(rows);
      });
    }, 60_000);

    return () => {
      active = false;
      supabase.removeChannel(channel);
      clearInterval(iv);
    };
  }, [userId]);

  return events;
}
