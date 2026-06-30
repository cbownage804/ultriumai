/**
 * Ray org skills — natural-language answers about the whole organization.
 *
 * Triggered from src/lib/ray/intent.ts when the question references the
 * company (employee/department/MFA-rollup/comparison) and the user has an
 * active organization.
 */
import { supabase } from '@/integrations/supabase/client';
import type { AnswerBullet, RayAnswer } from '@/lib/ray/intent';
import {
  fetchLatestHealth, fetchProfiles, fetchDepartmentScores, fetchTimeline,
} from '@/lib/ray/org';

const ORG_KEYWORDS = [
  'company', 'organization', 'org', 'employees', 'team', 'staff',
  'who worries', 'who still', 'department', 'departments',
  'safer than', 'overnight', 'cyber insurance', 'whole company',
  'every device', 'every employee', 'everyone',
];

export function isOrgQuestion(q: string): boolean {
  const l = q.toLowerCase();
  return ORG_KEYWORDS.some((k) => l.includes(k));
}

async function getActiveOrgId(userId: string): Promise<string | null> {
  // 1) localStorage choice (only available client-side)
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('ray.activeOrgId') : null;
    if (stored) return stored;
  } catch { /* noop */ }
  // 2) First owned org
  const { data: owned } = await supabase.from('org_teams').select('id').eq('owner_id', userId).limit(1);
  if (owned?.[0]?.id) return owned[0].id as string;
  // 3) First active membership
  const { data: m } = await supabase
    .from('org_team_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);
  return (m?.[0]?.organization_id as string) ?? null;
}

export async function answerOrgQuestion(userId: string, raw: string): Promise<RayAnswer | null> {
  const orgId = await getActiveOrgId(userId);
  if (!orgId) return null;
  const q = raw.toLowerCase();

  const [health, profiles, departments, timeline] = await Promise.all([
    fetchLatestHealth(orgId),
    fetchProfiles(orgId),
    fetchDepartmentScores(orgId),
    fetchTimeline(orgId, 15),
  ]);

  const bullets: AnswerBullet[] = [];

  if (q.includes('worries') || q.includes('priority') || q.includes('highest risk')) {
    const top = [...profiles].sort((a, b) => a.score - b.score).slice(0, 3);
    if (top.length) {
      bullets.push({ tone: 'bad', text: `${top[0].display_name} concerns me most — score ${top[0].score}.` });
      for (const p of top.slice(1)) bullets.push({ tone: 'warn', text: `${p.display_name} is close behind at ${p.score}.` });
    } else {
      bullets.push({ tone: 'ok', text: 'Nobody on the team is in a risky place right now.' });
    }
  }

  if (q.includes('mfa') || q.includes('two-factor') || q.includes('2fa')) {
    const missing = profiles.filter((p) => !p.mfa_enabled);
    if (missing.length === 0) {
      bullets.push({ tone: 'ok', text: 'Every employee has MFA enabled.' });
    } else {
      bullets.push({
        tone: 'bad',
        text: `${missing.length} employee${missing.length === 1 ? '' : 's'} still need${missing.length === 1 ? 's' : ''} MFA: ${missing.slice(0, 5).map((p) => p.display_name).join(', ')}${missing.length > 5 ? '…' : ''}.`,
      });
    }
  }

  if (q.includes('department') || q.includes('improving') || q.includes('worst dept')) {
    if (departments.length) {
      const sorted = [...departments].sort((a, b) => b.score - a.score);
      bullets.push({ tone: 'ok', text: `${sorted[0].department} is your strongest department at ${sorted[0].score}.` });
      const worst = sorted[sorted.length - 1];
      if (worst && worst !== sorted[0]) {
        bullets.push({ tone: 'warn', text: `${worst.department} is the weakest at ${worst.score} — ${worst.ray_reason ?? 'a few accounts need work'}.` });
      }
    } else {
      bullets.push({ tone: 'info', text: 'I do not have department data yet. Add departments to employees to unlock the heat map.' });
    }
  }

  if (q.includes('overnight') || q.includes('happen') || q.includes('changed')) {
    const events = timeline.slice(0, 5);
    if (events.length === 0) {
      bullets.push({ tone: 'ok', text: 'Nothing notable happened overnight.' });
    } else {
      for (const ev of events) {
        bullets.push({ tone: ev.severity === 'critical' || ev.severity === 'high' ? 'bad' : 'info', text: ev.summary });
      }
    }
  }

  if (q.includes('safer than') || q.includes('last week') || q.includes('trend')) {
    if (health) {
      const trend = health.score_delta;
      if (trend > 0) bullets.push({ tone: 'ok', text: `Your company score is up ${trend} since the previous snapshot.` });
      else if (trend < 0) bullets.push({ tone: 'bad', text: `Your company score is down ${Math.abs(trend)} since the previous snapshot.` });
      else bullets.push({ tone: 'info', text: `Your company score is steady at ${health.overall_score}.` });
    }
  }

  if (q.includes('cyber insurance') || q.includes('insurance')) {
    if (health) {
      const ready = health.identity_score >= 80 && health.exposure_score >= 75 && health.compliance_score >= 75;
      bullets.push({
        tone: ready ? 'ok' : 'warn',
        text: ready
          ? `You look ready: identity ${health.identity_score}, exposure ${health.exposure_score}, compliance ${health.compliance_score}.`
          : `Not quite — identity ${health.identity_score}, exposure ${health.exposure_score}, compliance ${health.compliance_score}. Most insurers want each above 80.`,
      });
    }
  }

  if (q.includes('every device') || (q.includes('device') && q.includes("haven't"))) {
    const idle = profiles.filter((p) => {
      if (!p.last_active_at) return true;
      return Date.now() - new Date(p.last_active_at).getTime() > 14 * 86400000;
    });
    if (idle.length === 0) bullets.push({ tone: 'ok', text: 'Every employee device has checked in recently.' });
    else bullets.push({ tone: 'warn', text: `${idle.length} employee device${idle.length === 1 ? '' : 's'} haven't checked in lately: ${idle.slice(0, 5).map((p) => p.display_name).join(', ')}${idle.length > 5 ? '…' : ''}.` });
  }

  // Fallback summary if no specific intent matched
  if (bullets.length === 0 && health) {
    bullets.push({ tone: 'info', text: `Company score ${health.overall_score} across ${profiles.length} employees.` });
  }

  return {
    headline: 'Ray, on your organization',
    bullets: bullets.slice(0, 8),
    actions: [{ label: 'Open organization brief', href: '/app/org' }],
    skillsUsed: ['org'],
  };
}
