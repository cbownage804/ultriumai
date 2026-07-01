import { devLog } from '@/lib/logger';
/**
 * Morning Brief client SDK.
 *
 * Fetches today's brief from public.ray_briefs (keyed by the user's local
 * calendar date). If none exists or it's stale (>24h or not today), invokes
 * the ray-brief edge function to generate one lazily. Also exposes recent
 * brief history so the page can render a "previous briefings" rail.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RayBriefFeedback = "helpful" | "not_helpful" | "wrong";

export type RayBriefRow = {
  id: string;
  user_id: string;
  brief_date: string; // YYYY-MM-DD
  timezone: string;
  source: "cron" | "lazy" | "manual" | string;
  stats: {
    passwords?: { total: number; weak: number; reused: number; breached: number };
    threats?: { open: number; critical: number; high: number };
    exposure?: { monitored: number; new_breaches: number };
    devices?: { total: number; unhealthy: number };
    timeline?: { since_last_brief: number };
  } | null;
  score: number | null;
  score_delta: number | null;
  recommendations: Array<{ id?: string; title: string; body?: string | null; priority: number; page_context?: string | null }>;
  greeting: string | null;
  summary: string | null;
  bullets: string[];
  guidance: string | null;
  ai_status: "ai" | "fallback" | string;
  generation_ms: number | null;
  generated_at: string;
  created_at: string;
  feedback: RayBriefFeedback | string | null;
  feedback_note: string | null;
  feedback_at: string | null;
};

export async function submitBriefFeedback(briefId: string, feedback: RayBriefFeedback, note?: string) {
  const { error } = await supabase
    .from("ray_briefs" as never)
    .update({ feedback, feedback_note: note ?? null, feedback_at: new Date().toISOString() } as never)
    .eq("id", briefId);
  if (error) devLog.log("[morningBrief] feedback failed", error);
}

function localDate(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function fetchTodaysBrief(userId: string, tz: string): Promise<RayBriefRow | null> {
  const today = localDate(tz);
  const { data } = await supabase
    .from("ray_briefs" as never)
    .select("*")
    .eq("user_id", userId)
    .eq("brief_date", today)
    .maybeSingle();
  return (data as RayBriefRow | null) ?? null;
}

export async function fetchBriefHistory(userId: string, limit = 14): Promise<RayBriefRow[]> {
  const { data } = await supabase
    .from("ray_briefs" as never)
    .select("*")
    .eq("user_id", userId)
    .order("brief_date", { ascending: false })
    .limit(limit);
  return (data as RayBriefRow[] | null) ?? [];
}

export async function generateBrief(opts?: { force?: boolean }): Promise<RayBriefRow | null> {
  const { data, error } = await supabase.functions.invoke("ray-brief", {
    body: { source: "lazy", force: !!opts?.force },
  });
  if (error) {
    devLog.log("[morningBrief] generation failed", error);
    return null;
  }
  return ((data as { brief?: RayBriefRow })?.brief as RayBriefRow) ?? null;
}

function isStale(b: RayBriefRow | null, tz: string): boolean {
  if (!b) return true;
  if (b.brief_date !== localDate(tz)) return true;
  if (Date.now() - new Date(b.generated_at).getTime() > 24 * 3600_000) return true;
  return false;
}

export function useMorningBrief() {
  const { user } = useAuth();
  const [today, setToday] = useState<RayBriefRow | null>(null);
  const [history, setHistory] = useState<RayBriefRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timezone, setTimezone] = useState<string>(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
  });

  const load = useCallback(async (opts?: { force?: boolean }) => {
    if (!user) return;
    setIsLoading(true);

    // Ensure timezone on profile + remember locally
    const { data: prof } = await supabase
      .from("ray_profiles")
      .select("timezone")
      .eq("user_id", user.id)
      .maybeSingle();
    let tz = (prof?.timezone as string | null) ?? "";
    if (!tz) {
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { tz = "UTC"; }
      await supabase.from("ray_profiles").update({ timezone: tz }).eq("user_id", user.id);
    }
    setTimezone(tz);

    const [t, h] = await Promise.all([
      fetchTodaysBrief(user.id, tz),
      fetchBriefHistory(user.id, 14),
    ]);
    setToday(t);
    setHistory(h);
    setIsLoading(false);

    if (opts?.force || isStale(t, tz)) {
      setIsGenerating(true);
      const fresh = await generateBrief({ force: !!opts?.force });
      if (fresh) {
        setToday(fresh);
        setHistory((prev) => {
          const without = prev.filter((p) => p.id !== fresh.id);
          return [fresh, ...without].slice(0, 14);
        });
      }
      setIsGenerating(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const lastBrief = useMemo(() => history.find((h) => h.id !== today?.id) ?? null, [history, today]);

  const sendFeedback = useCallback(async (feedback: RayBriefFeedback, note?: string) => {
    if (!today?.id) return;
    await submitBriefFeedback(today.id, feedback, note);
    setToday((prev) => (prev ? { ...prev, feedback, feedback_note: note ?? null, feedback_at: new Date().toISOString() } : prev));
  }, [today?.id]);

  return { today, history, lastBrief, timezone, isLoading, isGenerating, refresh: load, sendFeedback };
}
