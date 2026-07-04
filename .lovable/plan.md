# Wrayth — Phase 2: Make It Feel Inevitable

Phase 1 (platform build) is done: Ray, Vault, Identity, Device, Threat Center, Deep Investigations, Malware/Script/Log Analysis, Attack Paths, Knowledge Graph, Policy Generator, Compliance Gap Analysis, Executive Reports, Browser Extension, Pricing, Ray Compute, Ray personality.

Phase 2 is not about adding twenty more pages. It is about making every interaction reinforce one promise:

> **Ray continuously watches your environment, explains what matters, and helps you fix it.**

Every new capability is measured against that sentence. If it doesn't reinforce it, it waits.

---

## Guiding principles

1. **Explain → Fix, not Explain → Shrug.** Every finding Ray surfaces must have an action Ray can take or guide.
2. **Ray works when you're logged out.** Notifications, reports, and Autopilot run on schedules the user never has to babysit.
3. **One product, many scales.** The same surfaces work for a solo user, a business, and an MSP managing hundreds of endpoints.
4. **Coherent beats feature-rich.** Prefer deepening an existing surface over adding a new page.

---

## Roadmap (in build order)

### 1. Executive Dashboard — the Command Center ⭐
The default landing surface for every logged-in user. One screen that answers "what should I care about today?"
- Top: Ray's morning brief (already exists) — elevate to hero.
- Risk score + trend (7/30/90).
- Priority queue: top 5 findings across every module with inline **Fix it** buttons.
- Fleet pulse (Business/MSP): devices online, updates pending, breaches this week, MFA coverage.
- "Ray closed X items this week" — proof Ray is working.
- Route: `/app` becomes the Command Center; current dashboards move to `/app/overview` if needed.

### 2. One-click Remediation Engine ⭐⭐⭐⭐⭐
The single biggest gap between Wrayth and every traditional dashboard. Ray stops saying "BitLocker is disabled" and starts saying "I can enable BitLocker now."

**Remediation catalog (v1):**
- Enable BitLocker
- Enable / repair Defender
- Turn on Tamper Protection
- Enable Firewall (all profiles)
- Install pending Windows updates
- Rotate a compromised password (via Vault)
- Enable MFA on a provider
- Disable SMBv1
- Disable RDP
- Apply Microsoft security baseline
- Quarantine suspicious browser extension
- Run a saved remediation script

**Architecture:**
- New table `ray_remediations` (id, org_id, target_device_id, action_key, params, status, requested_by, approved_by, executed_at, result_json, ray_confidence).
- Edge function `ray-remediation-dispatch` — validates action, checks policy, either queues for the Vanguard agent or executes cloud-side (password rotation, MFA enable via provider APIs).
- Vanguard agent gets a `remediation_worker` that polls its queue, executes signed actions, reports back.
- Every Ray recommendation card gets a **Fix it** / **Fix it for me** button when a matching `action_key` exists.
- Every remediation is auditable, reversible where possible, and shows up in the executive report.

### 3. Notification Center
Ray works even when the user isn't looking.
- **Channels:** Email (v1), Teams, Slack, Discord, Mobile push (future — wait until the app exists).
- **Events:** new breached identity, remediation succeeded/failed, priority auto-closed, weekly digest ready, high-severity investigation, device fell offline, license/subscription events.
- **Per-user preferences:** channel × event matrix, quiet hours, digest vs. real-time.
- **Tables:** `ray_notification_prefs`, `ray_notification_events`, `ray_notification_deliveries`.
- **Delivery:** edge function `ray-notify` fans out; Teams/Slack/Discord via connectors (existing standard_connectors flow); email via Resend/existing transactional path.
- Every notification links back to the exact Command Center card that triggered it.

### 4. Scheduled Executive Reporting
Reports arrive without anyone asking.
- **Cadences:** Monday morning executive summary, weekly risk report, monthly compliance report, quarterly board packet.
- Reuse existing `render_board_report` PDF pipeline — just add the scheduler and template variants.
- **Per-org config:** which reports, which day/time, which recipients, which channel (email attachment / Teams post / dashboard-only).
- **Cron:** `pg_cron` + `pg_net` → edge function `ray-scheduled-reports`.
- MSP-tier: per-client reports, co-branded, delivered to the client's contact list.

### 5. Fleet / Organization Management
Business and MSP tiers stop feeling like "one user with more seats."
- **Inventories:** Devices, Users, Sites, Clients (MSP only).
- **Global search:** one bar, searches devices + users + sites + clients + findings + investigations + policies.
- **Cross-client intelligence (MSP):** "This CVE affects 12 devices across 4 clients." "This phishing sender hit 3 of your clients this week."
- **Global recommendations:** apply a policy or remediation to a filter (all Windows 11 devices at Client A) not one device at a time.
- **Tables:** most already exist (`org_devices`, `msp_clients`, etc.) — this phase is UI + bulk-action edge functions.

### 6. Ray Autopilot — the signature feature
Guided, policy-controlled automation. **Never automatic by default.** The user or admin decides.

**Approval modes (per action, per org, per client):**
- Always ask
- Ask only for high-risk actions
- Automatically perform safe actions
- Never automate

**v1 autopilot actions:**
- Install Windows security updates
- Rotate compromised passwords (Vault-managed only)
- Quarantine suspicious browser extensions
- Enable Defender / Tamper Protection / Firewall settings that drifted
- Close resolved recommendations
- Apply a saved remediation script on a schedule

**Tables:** `ray_autopilot_policies` (org_id, client_id nullable, action_key, mode, constraints), `ray_autopilot_runs` (policy_id, target, decision, executed, result).

**MSP mode:** apply one autopilot policy across many clients at once, with per-client overrides.

Autopilot reuses the Remediation Engine — it is a scheduler + policy layer on top, not a new execution path.

### 7. Browser Store Launch
Chrome Web Store + Edge Add-ons + Firefox AMO. Blocked on the readiness checklist in `docs/wrayth-extension-launch.md`. Ship in that order.

### 8. Public Beta
Once 1–7 are shipped: open signup, publish the marketing site's beta pricing, and let real users in.

---

## What we are explicitly not doing in Phase 2

- No new intelligence module types (Phase 1 already covers the surface).
- No new AI providers or model routing changes.
- No new pricing tiers — the existing tiers already contemplate Business and MSP.
- No native mobile app yet — Command Center must be mobile-web-excellent first.
- No third-party marketplace / plugin API. That's Phase 3.

---

## Definition of done for Phase 2

- A new user lands on the Command Center, sees 3–5 things Ray wants them to fix, clicks **Fix it** on one, and it's actually fixed inside 60 seconds — with the result showing up in their next scheduled report and (if they opted in) as a Teams/Slack notification. No other product on the market does that end-to-end for SMB and MSP.
