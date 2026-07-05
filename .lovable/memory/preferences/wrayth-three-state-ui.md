---
name: Wrayth Three-State UI Standard
description: Every page/section must render exactly one of three states — Empty, Loading, Active — and never fabricate a fourth "placeholder" state
type: preference
---

**Every screen and every data-driven section in Wrayth renders exactly ONE of three states. No fourth state exists.**

| State | When | Render |
|---|---|---|
| **Loading** | Query in flight, or Ray is actively working (scan running, investigation processing, agent pushing command) | Skeleton or progress indicator + Ray-voice status ("I\u2019m analyzing that file now\u2026"). Never fake numbers, never a chart with sample data. |
| **Empty** | Query resolved with zero rows AND nothing is in progress | `RayZeroState` — Ray-voice explanation of what will appear + next-action CTA |
| **Active** | Query resolved with \u22651 real row | Real data. Charts, tables, metrics — all bound to live queries. |

**Rules:**
1. There is NEVER a fourth state that shows fake, seeded, sample, or placeholder content. Ever.
2. Loading is not a synonym for Empty. If a query hasn\u2019t started, render Loading. If it finished and returned nothing, render Empty. Distinguish them.
3. "Processing" (Ray running a scan/investigation/skill) is Loading with Ray-voice copy explaining what he\u2019s doing.
4. Every new page/section MUST use the shared `<PageState>` primitive (or the `usePageState` hook) — do not roll your own.
5. Skeleton components (`<Skeleton/>`) are Loading-only. Never leave a Skeleton visible after data resolves to zero rows — swap to Empty.
6. Charts with hardcoded arrays for the Empty state are forbidden. Empty renders `RayZeroState`, not a zero-valued chart.

**How to apply:** Wrap page/section content in `<PageState state={...} loading={...} empty={...}>{active}</PageState>`, or use `usePageState({ isLoading, hasData })` to get the discriminant.

**Why:** Wrayth\u2019s credibility depends on customers never seeing fake security data. A "placeholder" state — even labeled as such — degrades trust the moment they notice it. Three states is a small enough contract that every contributor can hold it in their head.
