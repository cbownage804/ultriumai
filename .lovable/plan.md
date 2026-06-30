# Wrayth 4.0 — Ray Can Do the Work

This is a multi-release roadmap. I'll ship in phases so credits go to the highest-leverage pieces first. Approve and I'll start with **Phase 1 (Wrayth 4.0 core)**.

## Strategic shift
Ray stops being a reporter. He becomes a **co-pilot** who recognizes where you are, walks you through fixes, and tracks completion across providers. Every new capability must reinforce: *Ray is the reason you choose Wrayth.*

---

## Phase 1 — Wrayth 4.0: Secure With Ray (ship now)

Provider-aware guided playbooks that recognize the page you're on and walk you through it step-by-step, with live progress and rewards.

**Build:**
1. **Provider catalog** — `src/lib/ray/providers/catalog.ts`: Google, Microsoft, GitHub, Apple, Amazon, Facebook, Dropbox. Each maps domain patterns → provider id, branding, and a playbook slug.
2. **Provider playbooks** — Add 7 new templates to `src/lib/ray/playbooks/templates.ts` (`secure-google`, `secure-microsoft`, `secure-github`, etc.). Each is step-by-step ("Open Security", "Click Two-Step Verification", "Scan QR", "Save backup codes", "Verify login") with a `targetUrl` per step.
3. **Guided runner UI** — New `GuidedPlaybookRunner.tsx` (extends existing `PlaybookRunner`): big checklist, % complete bar, "Mission Complete +N" celebration that writes timeline + score + memory (engine already supports this).
4. **Extension recognition** — `public/safepass-extension/content/detector.js` adds provider detection from hostname. When matched, the Context Bar shows a **"Secure this account with Ray"** chip that deep-links to `/app/ray/secure/{provider}` and opens the playbook.
5. **Account Health scores** — New table `ray_account_health` (provider, user_id, score, last_checked, signals). Surface on dashboard as horizontal bars (Google 91%, Microsoft 63%, …). Completing a provider playbook bumps that provider's score.
6. **Dashboard surface** — Add "Secure Your Accounts" panel to `MorningBriefHero.tsx` listing detected accounts (from vault + extension signals) with per-provider Secure buttons.

**DB:** one migration — `ray_account_health` table with GRANTs + RLS + `provider`/`user_id` unique.

**Deliverable:** A user on accounts.google.com sees Ray's chip → clicks Secure → runs a 5-step guided playbook → score jumps, timeline updates, account turns green.

---

## Phase 2 — Wrayth 4.1: AI Security Review

"Review this page" button (extension + web). Ray analyzes login forms, permissions, branding-vs-domain mismatch, suspicious wording, and **explains why**, not just red/green.

- New edge function `ray-page-review` (Gemini 3 Flash) — takes URL, page text, screenshot signals from detector.
- Extension side-panel "Review this page" action.
- **AI Explains** tooltip system: hover any security term → one-sentence plain-English explanation via cached Gemini calls (`ray-explain` function with KV cache).

---

## Phase 3 — Wrayth 4.2: Behavior Intelligence

Ray learns your routine sites and flags anomalies (BoA at 3 AM when you only visit dev tools weekday mornings).

- `ray_browsing_patterns` table — daily aggregated visit fingerprints (no URLs stored raw; hashed host + hour bucket).
- Anomaly scorer in extension background — flags new-host + off-hour + sensitive-category.
- Inline Ray notice: *"This is unusual for you. Want me to verify it's safe?"* → triggers Phase 2 page review.

---

## Phase 4 — Wrayth 4.3: MSP Console

Multi-tenant dashboard for Ultrium to deploy Wrayth to clients.

- Reuse existing `msp_clients`. New view `/msp/ray` listing clients with aggregate Ray score, critical issues count, "Launch Ray for this client" button.
- Per-client missions and delegated playbooks; MSP admins can assign and monitor.

---

## Phase 5 — Wrayth 5.0: Autonomous Security

User-approved automations: scheduled reviews, routine maintenance, continuous monitoring with human-in-the-loop for high-impact actions. Builds on existing `ray_playbook_schedules` + `needsApproval` tool pattern.

---

## Companion threads (woven into phases)

- **Password Evolution** (4.0): When Ray flags a weak vault password, the recommendation becomes a 3-step inline flow — Generate → Store in Vault → Update on site (deep-link). Extends existing `password-cleanup` playbook.
- **Weekly Wins** (4.1): Friday digest edge function `ray-weekly-wins` aggregates timeline events into a "This Week" card on dashboard + optional email.
- **Homepage shift** (after 4.0 ships): Update `/` hero to *"Ray doesn't just find security problems. He helps you solve them."* with a Secure-With-Ray demo loop.

---

## Technical notes
- All new playbooks plug into the existing engine (`src/lib/ray/playbooks/engine.ts`) — no runtime rewrite.
- Account health and provider catalog are additive; nothing existing changes shape.
- Phase 1 is ~1 migration + ~8 files + extension detector update. Phases 2–5 each get their own approval gate so we don't burn credits speculatively.

---

**Approve to start Phase 1 (Wrayth 4.0).** I'll ship it end-to-end, then check in before moving to 4.1.
