/**
 * Ray Brain — single SDK for Ray's long-term memory, timeline, and briefings.
 *
 * Every Ray surface (dashboard hero, insight panels, Ask Ray palette) reads from
 * this module so Ray's knowledge is consistent across the app.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type RayMemoryRecord = {
  id: string;
  user_id: string;
  key: string;
  value: Record<string, unknown> | unknown;
  source: string;
  confidence: number;
  last_seen_at: string;
};

export type RayTimelineEvent = {
  id: string;
  user_id: string;
  event_type: string;
  summary: string;
  payload: Record<string, unknown>;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  occurred_at: string;
};

export type RayRecommendationStatus =
  | 'new'
  | 'snoozed'
  | 'in_progress'
  | 'completed'
  | 'dismissed';

export type RayRecommendation = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  priority: number;
  status: RayRecommendationStatus | string;
  dismissed_at: string | null;
  completed_at: string | null;
  snoozed_until: string | null;
  estimated_fix_seconds: number | null;
  page_context: string | null;
  created_at: string;
};

export type RayBriefing = {
  id: string;
  user_id: string;
  greeting: string;
  bullets: string[];
  recommendation_ids: string[];
  generated_at: string;
  expires_at: string;
};

/* ------------------------------ writers ------------------------------ */

export async function rememberFact(
  userId: string,
  key: string,
  value: unknown,
  source: 'user_stated' | 'inferred' | 'system' = 'inferred',
  confidence = 0.8,
) {
  const { error } = await supabase
    .from('ray_memory')
    .upsert(
      {
        user_id: userId,
        key,
        value: value as never,
        source,
        confidence,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,key' },
    );
  if (error) console.warn('[ray.brain] rememberFact failed', error);
}

export async function recordTimelineEvent(
  userId: string,
  event: {
    event_type: string;
    summary: string;
    payload?: Record<string, unknown>;
    severity?: RayTimelineEvent['severity'];
  },
) {
  const { error } = await supabase.from('ray_timeline').insert([
    {
      user_id: userId,
      event_type: event.event_type,
      summary: event.summary,
      payload: (event.payload ?? {}) as never,
      severity: event.severity ?? 'info',
    },
  ]);
  if (error) console.warn('[ray.brain] recordTimelineEvent failed', error);
}

export async function completeRecommendation(id: string) {
  const { data } = await supabase
    .from('ray_recommendations')
    .update({ completed_at: new Date().toISOString(), status: 'completed', snoozed_until: null })
    .eq('id', id)
    .select('user_id,title')
    .maybeSingle();
  if (data?.user_id) {
    await recordTimelineEvent(data.user_id, {
      event_type: 'recommendation_completed',
      summary: `Marked handled: ${data.title}`,
      payload: { id, title: data.title },
      severity: 'low',
    });
  }
}

export async function dismissRecommendation(id: string) {
  await supabase
    .from('ray_recommendations')
    .update({ dismissed_at: new Date().toISOString(), status: 'dismissed', snoozed_until: null })
    .eq('id', id);
}

export async function startRecommendation(id: string) {
  const { data } = await supabase
    .from('ray_recommendations')
    .update({ status: 'in_progress', snoozed_until: null })
    .eq('id', id)
    .select('user_id,title')
    .maybeSingle();
  if (data?.user_id) {
    await recordTimelineEvent(data.user_id, {
      event_type: 'recommendation_started',
      summary: `Started: ${data.title}`,
      payload: { id, title: data.title },
      severity: 'info',
    });
  }
}

/** Snooze a recommendation for N hours (default 24). */
export async function snoozeRecommendation(id: string, hours = 24) {
  const until = new Date(Date.now() + Math.max(1, hours) * 3600_000).toISOString();
  await supabase
    .from('ray_recommendations')
    .update({ status: 'snoozed', snoozed_until: until })
    .eq('id', id);
}

/* ------------------------------ readers ------------------------------ */

async function fetchLatestBriefing(userId: string): Promise<RayBriefing | null> {
  const { data } = await supabase
    .from('ray_briefings')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as RayBriefing | null) ?? null;
}

async function generateBriefing(): Promise<RayBriefing | null> {
  const { data, error } = await supabase.functions.invoke('ray-briefing', {
    body: {},
  });
  if (error) {
    console.warn('[ray.brain] briefing generation failed', error);
    return null;
  }
  return (data?.briefing as RayBriefing) ?? null;
}

function isBriefingFresh(b: RayBriefing | null): boolean {
  if (!b) return false;
  return new Date(b.expires_at).getTime() > Date.now();
}

/* ------------------------------ hook ------------------------------ */

export function useRayBrain(options?: { pageContext?: string }) {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<RayBriefing | null>(null);
  const [recommendations, setRecommendations] = useState<RayRecommendation[]>([]);
  const [memory, setMemory] = useState<RayMemoryRecord[]>([]);
  const [timeline, setTimeline] = useState<RayTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const [b, recs, mem, tl] = await Promise.all([
      fetchLatestBriefing(user.id),
      supabase
        .from('ray_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .is('completed_at', null)
        .or(`snoozed_until.is.null,snoozed_until.lt.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .limit(20),
      supabase.from('ray_memory').select('*').eq('user_id', user.id),
      supabase
        .from('ray_timeline')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(25),
    ]);
    setBriefing(b);
    setRecommendations((recs.data as RayRecommendation[]) ?? []);
    setMemory((mem.data as RayMemoryRecord[]) ?? []);
    setTimeline((tl.data as RayTimelineEvent[]) ?? []);
    setIsLoading(false);

    if (!isBriefingFresh(b)) {
      setIsGenerating(true);
      const fresh = await generateBriefing();
      if (fresh) setBriefing(fresh);
      setIsGenerating(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pageRecommendations = useMemo(() => {
    if (!options?.pageContext) return recommendations;
    return recommendations.filter(
      (r) => !r.page_context || r.page_context === options.pageContext,
    );
  }, [recommendations, options?.pageContext]);

  return {
    briefing,
    recommendations,
    pageRecommendations,
    memory,
    timeline,
    isLoading,
    isGenerating,
    refresh,
    remember: (key: string, value: unknown, source?: 'user_stated' | 'inferred' | 'system') =>
      user ? rememberFact(user.id, key, value, source) : Promise.resolve(),
    recordEvent: (event: Parameters<typeof recordTimelineEvent>[1]) =>
      user ? recordTimelineEvent(user.id, event) : Promise.resolve(),
    completeRecommendation: async (id: string) => {
      await completeRecommendation(id);
      await refresh();
    },
    dismissRecommendation: async (id: string) => {
      await dismissRecommendation(id);
      await refresh();
    },
    startRecommendation: async (id: string) => {
      await startRecommendation(id);
      await refresh();
    },
    snoozeRecommendation: async (id: string, hours = 24) => {
      await snoozeRecommendation(id, hours);
      await refresh();
    },
  };
}
