# Wrayth 2.1 — Make Ray Real

This is a multi-phase sprint. I'll deliver it in **3 shippable waves** so we don't blow your context budget on one mega-commit, and each wave leaves the app working.

## Wave 1 — Ray Brain (foundation) ← this PR

The "memory + context" plumbing every other wave depends on.

**Database (new tables, additive only):**
- `ray_memory` — long-term facts ("uses Google Workspace", "prefers email", "dismissed Passkeys rec"). Keyed by user, with `key`, `value`, `source`, `confidence`, `last_seen_at`.
- `ray_timeline` — append-only event log: scans, breaches, MFA enables, dismissals, recs completed. Powers the Security Timeline.
- `ray_briefings` — cached morning briefing per user (regenerated when stale).
- Extend `ray_recommendations` with `priority`, `dismissed_at`, `completed_at`, `estimated_fix_seconds`, `page_context`.
- All with RLS scoped to `auth.uid()` + GRANTs.

**Client SDK (`src/lib/ray/brain.ts`):**
- `useRayBrain()` — single hook: profile, memory, recent timeline, active recs, last briefing.
- `rayBrain.remember(key, value, source)` — write memory.
- `rayBrain.recordEvent(type, payload)` — append timeline entry.
- `rayBrain.completeRecommendation(id)` / `dismiss(id)`.
- `rayBrain.getBriefing()` — cached, regenerates if >6h old.

**Edge function (`ray-briefing`):**
- Pulls profile + memory + recent findings/scans/breaches.
- Calls Lovable AI Gateway (`google/gemini-2.5-flash`) with Ray's JARVIS system prompt + structured output.
- Returns: `{ greeting, summary_bullets[], recommendations[] }`.
- Persists to `ray_briefings`.

**Context plumbing:**
- `<RayContextProvider currentPage="passwords">` wraps `/app/*` layout.
- Already-existing `safeassist-ai` function gets the page context + memory snapshot injected so every Ray response is context-aware.

## Wave 2 — Ray Everywhere (UI surface)

- New `<RayInsightPanel page="passwords" />` — floating panel each major page mounts. Shows 1–3 contextual insights pulled from `ray_recommendations` filtered by `page_context`.
- Dashboard rewrite: hero becomes the **morning briefing** (greeting + bullets + top 3 recs with "Fix now" buttons). Stats drop below the fold.
- Security Timeline component on dashboard + standalone `/app/timeline`.
- Wire panels into Passwords, Threats, Exposure, Identity, Devices, Reports pages.

## Wave 3 — Natural Language + Voice

- Upgrade Ask Ray (⌘K) palette into an **action router**: intents like "show weak passwords", "run a scan", "summarize this month" route to real handlers, not just chat.
- Voice button in palette using `openai/gpt-4o-mini-transcribe` for STT.
- Ray responses can return action chips ("Fix now", "Show me", "Dismiss") that mutate the brain.

## Non-goals for this sprint
- No visual redesign of existing pages beyond adding the insight panel + new dashboard hero.
- No new pricing/billing changes.
- I will NOT rewrite SafePass/Scan/Watch internals — Ray reads from the existing `password_entries`, `ray_findings`, `safeweb_threats`, etc.

## What ships in this turn (Wave 1)
1. Migration: `ray_memory`, `ray_timeline`, `ray_briefings`, ALTER `ray_recommendations`.
2. `src/lib/ray/brain.ts` + `useRayBrain` hook.
3. `<RayContextProvider>` mounted in the `/app` layout.
4. `supabase/functions/ray-briefing/index.ts`.
5. Light dashboard wiring so you see the briefing render end-to-end. Insight panels + timeline UI land in Wave 2.

Approve and I'll ship Wave 1. Then say "wave 2" / "wave 3" when you want the next.
