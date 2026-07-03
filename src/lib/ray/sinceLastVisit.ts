/**
 * "Since you were away" — the real, truthful edition.
 *
 * Pulls actual rows from `wrayth_device_actions`, `wrayth_devices`,
 * `ray_recommendations` and `ray_findings` created / resolved since the
 * given cutoff. The panel renders these directly instead of fabricating
 * numbers from posture heuristics.
 */
import { supabase } from '@/integrations/supabase/client';

export type SinceItem = {
  tone: 'good' | 'warn' | 'info';
  label: string;
};

export type SinceSummary = {
  since: string; // ISO
  items: SinceItem[];
  hadAnyActivity: boolean;
};

const humanCount = (n: number, singular: string, plural?: string) =>
  `${n} ${n === 1 ? singular : plural ?? singular + 's'}`;

export async function getSinceLastVisit(userId: string, sinceIso: string): Promise<SinceSummary> {
  const [devicesRes, actionsRes, newRecsRes, resolvedFindsRes] = await Promise.all([
    supabase
      .from('wrayth_devices')
      .select('id, hostname, last_seen_at, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null),
    supabase
      .from('wrayth_device_actions')
      .select('id, action_type, status, completed_at, created_at')
      .eq('user_id', userId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('ray_recommendations')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', sinceIso),
    supabase
      .from('ray_findings')
      .select('id, reviewed_at')
      .eq('user_id', userId)
      .gte('reviewed_at', sinceIso)
      .not('reviewed_at', 'is', null),
  ]);

  const devices = devicesRes.data ?? [];
  const actions = actionsRes.data ?? [];
  const newRecs = newRecsRes.data ?? [];
  const resolvedFindings = resolvedFindsRes.data ?? [];

  const devicesChecked = devices.filter((d) => d.last_seen_at && d.last_seen_at >= sinceIso).length;

  const completed = actions.filter((a) => a.status === 'succeeded');
  const failed = actions.filter((a) => a.status === 'failed' || a.status === 'cancelled');

  const items: SinceItem[] = [];

  items.push({
    tone: devices.length > 0 ? 'good' : 'info',
    label:
      devices.length === 0
        ? 'No devices enrolled yet'
        : devicesChecked > 0
        ? `${humanCount(devicesChecked, 'device')} checked in`
        : `Watching ${humanCount(devices.length, 'enrolled device')}`,
  });

  if (completed.length > 0) {
    items.push({
      tone: 'good',
      label: `Ran ${humanCount(completed.length, 'remediation')} successfully`,
    });
  }
  if (failed.length > 0) {
    items.push({
      tone: 'warn',
      label: `${humanCount(failed.length, 'remediation')} needs your attention`,
    });
  }

  if (resolvedFindings.length > 0) {
    items.push({
      tone: 'good',
      label: `Cleared ${humanCount(resolvedFindings.length, 'finding')}`,
    });
  }

  if (newRecs.length > 0) {
    items.push({
      tone: 'warn',
      label: `${humanCount(newRecs.length, 'new recommendation')} added`,
    });
  }

  // If truly nothing happened, say so — don't fabricate.
  const hadAnyActivity =
    devicesChecked > 0 ||
    completed.length > 0 ||
    failed.length > 0 ||
    resolvedFindings.length > 0 ||
    newRecs.length > 0;

  if (!hadAnyActivity && devices.length > 0) {
    items.push({ tone: 'info', label: 'Nothing new to report — all quiet' });
  }

  return { since: sinceIso, items, hadAnyActivity };
}
