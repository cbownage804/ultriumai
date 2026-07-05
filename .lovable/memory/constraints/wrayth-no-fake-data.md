---
name: Wrayth Zero-Fake-Data Policy
description: Wrayth must never ship demo/seeded/sample/placeholder security data — every screen renders true zero-state driven by real customer telemetry
type: constraint
---

Wrayth will NEVER contain demo, placeholder, seeded, fake, mock, or sample security data in production code paths.

**Never fabricate:** devices, threats, users, passwords, identities, reports, compliance findings, policies, malware, attack paths, timeline events, AI conversations, organizations, metrics, scores, alerts, IOCs, investigations, graph edges.

**Every metric shown to the user must come from actual customer data.** No hardcoded numbers, no `Math.random()` telemetry, no fixture arrays rendered as if real.

**Zero-state pattern (required on every Wrayth screen):**
When a section has no data yet, DO NOT render charts/tables/skeletons pretending data exists. Instead render:
1. Educational copy explaining what this screen shows
2. Ray guidance in Ray's voice ("I'm waiting for your first device to check in…")
3. Setup/installation progress if relevant
4. Concrete next-action CTA (install agent, connect M365, install extension, run first scan, add identity, start investigation)
5. Expected outcomes once configured

**Onboarding teaches; it does not simulate.** Never simulate activity to make the app look populated.

**Enforcement:** Any PR that adds hardcoded arrays of "threats/devices/alerts/etc." to a Wrayth surface must be rejected. Storybook/dev-only fixtures are allowed ONLY under `src/dev/` or explicit `*.stories.tsx` and must never be imported by production routes.

**Why:** Wrayth's credibility depends on every alert, recommendation, report, score, and investigation being based on real customer telemetry. Fake data destroys trust the first time a customer notices it.
