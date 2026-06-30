/**
 * Ray Search — unified search across Ray's domains.
 *
 * Queries passwords, identities, threats, recommendations, and timeline
 * events in parallel, then merges into a single ranked result list.
 */
import { supabase } from '@/integrations/supabase/client';

export type RaySearchKind =
  | 'password'
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
  const tokens = n.split(/\s+/).filter(Boolean);
  let hits = 0;
  for (const t of tokens) if (h.includes(t)) hits++;
  return tokens.length ? (hits / tokens.length) * 0.5 : 0;
}

export async function raySearch(userId: string, query: string): Promise<RaySearchResult[]> {
  const q = query.trim();
  if (!userId || q.length < 2) return [];
  const like = `%${q}%`;

  const passwordsP = supabase
    .from('password_entries')
    .select('id,name,username,website')
    .eq('user_id', userId)
    .or(`name.ilike.${like},username.ilike.${like},website.ilike.${like}`)
    .limit(8);

  const identitiesP = supabase
    .from('safepass_identities')
    .select('id,name')
    .eq('user_id', userId)
    .ilike('name', like)
    .limit(8);

  const threatsP = supabase
    .from('safeweb_threats')
    .select('id,title,severity,created_at')
    .eq('user_id', userId)
    .or(`title.ilike.${like},description.ilike.${like}`)
    .limit(8);

  const recsP = supabase
    .from('ray_recommendations')
    .select('id,title,body,page_context,status')
    .eq('user_id', userId)
    .or(`title.ilike.${like},body.ilike.${like}`)
    .limit(8);

  const eventsP = supabase
    .from('ray_timeline')
    .select('id,event_type,summary,created_at')
    .eq('user_id', userId)
    .ilike('summary', like)
    .order('created_at', { ascending: false })
    .limit(8);

  const [passwords, identities, threats, recs, events] = await Promise.all([
    passwordsP,
    identitiesP,
    threatsP,
    recsP,
    eventsP,
  ]);

  const results: RaySearchResult[] = [];

  for (const p of (passwords.data ?? []) as Array<{ id: string; name: string | null; username: string | null; website: string | null }>) {
    const score = Math.max(
      relevance(p.name, q),
      relevance(p.username, q) * 0.9,
      relevance(p.website, q) * 0.8,
    );
    results.push({
      id: p.id,
      kind: 'password',
      title: p.name ?? p.username ?? 'Untitled login',
      subtitle: p.username ?? p.website ?? null,
      href: '/app/passwords',
      score,
    });
  }

  for (const i of (identities.data ?? []) as Array<{ id: string; name: string }>) {
    results.push({
      id: i.id,
      kind: 'identity',
      title: i.name,
      subtitle: null,
      href: '/app/identity',
      score: relevance(i.name, q),
    });
  }

  for (const t of (threats.data ?? []) as Array<{ id: string; title: string; severity: string | null; created_at: string | null }>) {
    results.push({
      id: t.id,
      kind: 'threat',
      title: t.title,
      subtitle: t.severity,
      href: '/app/threats',
      score: relevance(t.title, q),
      occurredAt: t.created_at,
    });
  }

  for (const r of (recs.data ?? []) as Array<{ id: string; title: string; body: string | null; page_context: string | null; status: string | null }>) {
    if (r.status === 'completed' || r.status === 'dismissed') continue;
    results.push({
      id: r.id,
      kind: 'recommendation',
      title: r.title,
      subtitle: r.body,
      href: r.page_context ? `/app/${r.page_context}` : '/app/missions',
      score: Math.max(relevance(r.title, q), relevance(r.body, q) * 0.85),
    });
  }

  for (const e of (events.data ?? []) as Array<{ id: string; event_type: string; summary: string | null; created_at: string | null }>) {
    results.push({
      id: e.id,
      kind: 'event',
      title: e.summary ?? e.event_type,
      subtitle: e.event_type,
      href: '/app/timeline',
      score: relevance(e.summary, q) * 0.6,
      occurredAt: e.created_at,
    });
  }

  return results
    .filter((r) => r.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 18);
}
