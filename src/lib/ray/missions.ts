/**
 * Ray Missions — the signature surface. Ray picks one mission at a time,
 * walks the user through bite-sized steps, and rewards completion with
 * security-score points.
 *
 * Mission templates are seeded into ray_missions on first read so the user
 * always has a clear next move even before integrations populate findings.
 */
import { supabase } from '@/integrations/supabase/client';
import { recordTimelineEvent } from '@/lib/ray/brain';

import { devLog } from '@/lib/logger';
export type MissionStatus = 'new' | 'in_progress' | 'completed' | 'dismissed';

export type MissionStep = {
  id: string;
  label: string;
  done: boolean;
};

export type RayMission = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  reward_points: number;
  status: MissionStatus;
  steps: MissionStep[];
  progress: number;
  priority: number;
  started_at: string | null;
  completed_at: string | null;
};

const TEMPLATES: Array<Omit<RayMission, 'id' | 'status' | 'progress' | 'started_at' | 'completed_at'>> = [
  {
    slug: 'secure-google',
    title: 'Secure your Google account',
    description: "Ray will help you lock down the account most attackers try first.",
    estimated_minutes: 4,
    reward_points: 7,
    priority: 1,
    steps: [
      { id: 'pw',       label: 'Check Google password strength',     done: false },
      { id: 'mfa',      label: 'Enable 2-factor authentication',     done: false },
      { id: 'recovery', label: 'Save recovery codes to your Vault',  done: false },
      { id: 'passkey',  label: 'Add a passkey for faster sign-in',   done: false },
    ],
  },
  {
    slug: 'secure-microsoft',
    title: 'Secure your Microsoft account',
    description: 'Tighten the account that backs your email, files, and devices.',
    estimated_minutes: 5,
    reward_points: 7,
    priority: 2,
    steps: [
      { id: 'pw',         label: 'Rotate Microsoft password',         done: false },
      { id: 'mfa',        label: 'Enable Microsoft Authenticator',    done: false },
      { id: 'recovery',   label: 'Verify recovery email',             done: false },
      { id: 'app-pass',   label: 'Remove old app passwords',          done: false },
    ],
  },
  {
    slug: 'protect-identity',
    title: 'Protect your identity',
    description: 'Tell Ray which emails and details to watch on the dark web.',
    estimated_minutes: 3,
    reward_points: 5,
    priority: 3,
    steps: [
      { id: 'emails',   label: 'Add the emails you care about',  done: false },
      { id: 'phone',    label: 'Add your phone for SIM alerts',  done: false },
      { id: 'scan',     label: 'Run your first exposure scan',   done: false },
    ],
  },
  {
    slug: 'verify-devices',
    title: 'Verify your devices',
    description: 'Confirm the laptops and phones that should have access to your accounts.',
    estimated_minutes: 3,
    reward_points: 4,
    priority: 4,
    steps: [
      { id: 'list',     label: 'Review devices Ray detected',     done: false },
      { id: 'trust',    label: 'Mark devices you trust',          done: false },
      { id: 'revoke',   label: 'Sign out unknown sessions',       done: false },
    ],
  },
];

async function ensureSeeded(userId: string) {
  const { data: existing } = await supabase
    .from('ray_missions')
    .select('slug')
    .eq('user_id', userId);
  const have = new Set((existing ?? []).map((r) => r.slug));
  const toInsert = TEMPLATES.filter((t) => !have.has(t.slug)).map((t) => ({
    user_id: userId,
    slug: t.slug,
    title: t.title,
    description: t.description,
    estimated_minutes: t.estimated_minutes,
    reward_points: t.reward_points,
    steps: t.steps as never,
    priority: t.priority,
  }));
  if (toInsert.length === 0) return;
  const { error } = await supabase.from('ray_missions').insert(toInsert);
  if (error) devLog.warn('[ray.missions] seed failed', error);
}

export async function listMissions(userId: string): Promise<RayMission[]> {
  await ensureSeeded(userId);
  const { data, error } = await supabase
    .from('ray_missions')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: true });
  if (error) {
    devLog.warn('[ray.missions] list failed', error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    estimated_minutes: row.estimated_minutes,
    reward_points: row.reward_points,
    status: (row.status as MissionStatus) ?? 'new',
    steps: (Array.isArray(row.steps) ? (row.steps as unknown as MissionStep[]) : []),
    progress: Number(row.progress ?? 0),
    priority: row.priority,
    started_at: row.started_at,
    completed_at: row.completed_at,
  }));
}

function computeProgress(steps: MissionStep[]): number {
  if (!steps.length) return 0;
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}

export async function toggleStep(mission: RayMission, stepId: string): Promise<RayMission> {
  const steps = mission.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s));
  const progress = computeProgress(steps);
  const allDone = progress === 100;
  const status: MissionStatus = allDone
    ? 'completed'
    : steps.some((s) => s.done)
      ? 'in_progress'
      : 'new';

  const updates: Record<string, unknown> = {
    steps: steps as never,
    progress,
    status,
    started_at: mission.started_at ?? (status === 'in_progress' || allDone ? new Date().toISOString() : null),
    completed_at: allDone ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from('ray_missions')
    .update(updates)
    .eq('id', mission.id);
  if (error) devLog.warn('[ray.missions] toggle failed', error);

  if (allDone) {
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      void recordTimelineEvent(u.user.id, {
        event_type: 'mission_completed',
        summary: `Completed mission: ${mission.title}`,
        severity: 'info',
        payload: { mission_slug: mission.slug, reward: mission.reward_points },
      });
    }
  }

  return { ...mission, steps, progress, status,
    started_at: updates.started_at as string | null,
    completed_at: updates.completed_at as string | null };
}

export async function dismissMission(id: string) {
  await supabase
    .from('ray_missions')
    .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
    .eq('id', id);
}
