/**
 * Ray Search — unified search across Ray's domains.
 *
 * Queries passwords, devices, identities, threats, recommendations, and
 * timeline events in parallel, then merges into a single ranked result list.
 * Used by the Ray command center to give users one box that answers
 * "Is my Gmail account secure?" or "Show me devices I haven't seen."
 */
import { supabase } from '@/integrations/supabase/client';

export type RaySearchKind =
  | 'password'
  | 'device'
  | 'identity'
  | 'threat'
  | 'recommendation'
  | 'event';

export interface RaySearchResult {
  id: string;
  kind: RaySearchKind;
  title: string;
  subtitle?: string | null;
  href: string;
  score: number;
  occurredAt?: string | null;
}

const KIND_LABEL: Record<RaySearchKind, string> = {
  password: 'Password',
  device: 'Device',
  identity: 'Identity',
  threat: 'Threat',
  recommendation: 'Recommendation',
  event: 'Timeline',
};

export function labelForKind(k: RaySearchKind): string {
  return KIND_LABEL[k];
}

function relevance(haystack: string | null | undefined, needle: string): number {
  if (!haystack) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return 0;
  if (h === n) return 1;
  if (h.startsWith(n)) return 0.9;
  if (h.includes(n)) return 0.7;
  // token overlap
  const tokens = n.split(/\s+/).filter(Boolean);
  let hits = 0;
  for (const t of tokens) if (h.includes(t)) hits++;
  return tokens.length ? (hits / tokens.length) * 0.5 : 0;
}

export async function raySearch(userId: string, query: string): Promise<RaySearchResult[]> {
  const q = query.trim();
  if (!userId || q.length < 2) return [];

  const like = `%${q}%`;
  const results: RaySearchResult[] = [];

  const [passwords, devices, identities, threats, recs, events] = await Promise.all([
    supabase
      .from('password_entries')
      .select('id,title,username,url')
      .eq('user_id', userId)
      .or(`title.ilike.${like},username.ilike.${like},url.ilike.${like}`)
      .limit(8),
    supabase
      .from('devices')
      .select('id,name,os,last_seen_at')
      .eq('user_id', userId)
      .ilike('name', like)
      .limit(8),
    supabase
      .from('safepass_identities')
      .select('id,first_name,last_name,email')
      .eq('user_id', userId)
      .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`)
      .limit(8),
    supabase
      .from('safeweb_threats')
      .select('id,title,severity,created_at')
      .eq('user_id', userId)
      .ilike('title', like)
      .limit(8),
    supabase
      .from('ray_recommendations')
      .select('id,title,body,page_context,status')
      .eq('user_id', userId)
      .or(`title.ilike.${like},body.ilike.${like}`)
      .limit(8),
    supabase
      .from('ray_timeline')
      .select('id,event_type,summary,created_at')
      .eq('user_id', userId)
      .ilike('summary', like)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  for (const p of passwords.data ?? []) {
    const score = Math.max(
      relevance(p.title, q),
      relevance(p.username, q) * 0.9,
      relevance(p.url, q) * 0.8,
    );
    results.push({
      id: p.id,
      kind: 'password',
      title: p.title ?? p.username ?? 'Untitled login',
      subtitle: p.username ?? p.url ?? null,
      href: '/app/passwords',
      score,
    });
  }

  for (const d of devices.data ?? []) {
    results.push({
      id: d.id,
      kind: 'device',
      title: d.name ?? 'Unnamed device',
      subtitle: d.os ?? null,
      href: '/app/devices',
      score: relevance(d.name, q),
      occurredAt: d.last_seen_at ?? null,
    });
  }

  for (const i of identities.data ?? []) {
    const full = [i.first_name, i.last_name].filter(Boolean).join(' ') || i.email || 'Identity';
    results.push({
      id: i.id,
      kind: 'identity',
      title: full,
      subtitle: i.email ?? null,
      href: '/app/identity',
      score: Math.max(relevance(full, q), relevance(i.email, q)),
    });
  }

  for (const t of threats.data ?? []) {
    results.push({
      id: t.id,
      kind: 'threat',
      title: t.title ?? 'Threat',
      subtitle: t.severity ?? null,
      href: '/app/threats',
      score: relevance(t.title, q),
      occurredAt: t.created_at ?? null,
    });
  }

  for (const r of recs.data ?? []) {
    if (r.status === 'completed' || r.status === 'dismissed') continue;
    results.push({
      id: r.id,
      kind: 'recommendation',
      title: r.title ?? 'Recommendation',
      subtitle: r.body ?? null,
      href: r.page_context ? `/app/${r.page_context}` : '/app/missions',
      score: Math.max(relevance(r.title, q), relevance(r.body, q) * 0.85),
    });
  }

  for (const e of events.data ?? []) {
    results.push({
      id: e.id,
      kind: 'event',
      title: e.summary ?? e.event_type,
      subtitle: e.event_type,
      href: '/app/timeline',
      score: relevance(e.summary, q) * 0.6,
      occurredAt: e.created_at ?? null,
    });
  }

  return results
    .filter((r) => r.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 18);
}
