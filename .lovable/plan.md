
# Wrayth 2.2 — Ray's Workspace

Every page becomes a conversation with Ray. No module logos, no marketing artwork, no "SafePass/SafeScan/SafeWeb" residue. One unified shell, one voice, one rhythm.

This is large. I'll ship it in three waves so the preview stays usable between each.

---

## Wave 1 — Strip legacy + unify page openings (items 1, 4)

**Goal:** Every authenticated page opens identically. No legacy art anywhere.

- Audit and delete legacy imagery: `safepass-logo`, `safescan-logo`, `safeweb-logo`, hero banners, gradient artwork in `src/assets/` and any remaining `<img>` references in `src/pages/safesuite/*` and `src/components/safepass|safescan|safeweb/*`.
- Standardize `RayPageHeader` to render exactly:
  ```
  MANAGED BY RAY          ← uppercase eyebrow, muted, tracking-widest
  {Title}                 ← display weight, no icon
  {One-line description}  ← muted
  ```
  No badges, no action buttons in the header itself — actions live in the body.
- Apply across: Passwords, 2FA, Threats, Exposure, Identity, Devices, Reports, Timeline, Team, Shared, Orgs, Settings.
- Remove the "Vault • Pro Plan" strip from Passwords. Replace with nothing (clutter) — capacity moves into the score card in Wave 2.

## Wave 2 — Passwords page redesign (items 2, 3, 5, 6, 7)

**Goal:** Passwords feels like Apple Passwords narrated by Ray.

1. **Ray card first.** A single conversational card replaces the stacked "HIGH / Establish password monitoring" alerts. Merges every recommendation into one paragraph with one primary CTA. Component: `RayConversationCard` (new, in `src/components/ray/`).
2. **Score block** replaces the three stat cards:
   ```
   98   Overall Password Score
   ─────────────────────────────
   Strong: 1   Weak: 0   Breaches: 0   MFA: 1
   ```
   Single component: `PasswordScoreBlock`.
3. **Password rows** redesigned to Apple-style:
   - Left: favicon + service name + domain
   - Middle: account/username + status line ("Strong password · No breach detected" or "Supports 2FA" / "Protected with 2FA")
   - Right: "Last changed Xmo ago" + reveal control
   - Removed table headers (USERNAME/PASSWORD).
4. **Remove inline 2FA management** from Passwords. Password row only shows the *status* string. Managing authenticators lives on `/app/mfa`.
5. **Ray annotations** per password: derived client-side from existing strength/breach data, rendered as a muted italic line under the row when relevant ("Ray: hasn't changed in 3 years — I'd rotate this next").

## Wave 3 — Surface-by-surface Ray voice (items 8, 9, 10, 11, 12)

- **Timeline (`/app/timeline`)**: promote to top-level nav slot already exists; restyle entries to Ray's voice ("Ray scanned Gmail. No new breaches."). Group by Today / Yesterday / N days ago.
- **Identity (`/app/identity`)**: expand schema surface. New sections: Government IDs, Medical, Insurance, Recovery Codes, Emergency Contacts, Aliases, Emails, Phones, Addresses. Computed "Identity Score". (Storage: extend existing `ray_identity` table via migration with JSONB `details` — no breaking changes.)
- **Devices (`/app/devices`)**: becomes the asset list (Desktop / Laptop / Phone with health + last seen). Agent download CTA moves here from Threats.
- **Threats (`/app/threats`)**: becomes pure intelligence feed — recent detections, file/email/URL scan inbox. No agent download.
- **Exposure (`/app/exposure`)**: rename "Monitored Assets" → "Digital Identities". Each card uses the human format shown in the brief.

## Out of scope for this sprint

- "Ray Memory" overnight briefing as a separate scheduled job. The existing `ray-briefing` function already drafts the morning greeting; expanding to overnight scan cron is a follow-up sprint after this cleanup lands.
- Real device telemetry ingestion. Devices page will read from existing `ray_devices` table; populating it from real agents is a separate backend sprint.

---

## Technical notes

- All new components in `src/components/ray/` to keep the design language centralized.
- Reuse `RayPageHeader` — extend it to enforce the "MANAGED BY RAY" eyebrow as non-optional.
- No new edge functions in this sprint; client-side intelligence (`src/lib/ray/`) already produces the strings Ray needs.
- Migration: one additive migration for `ray_identity.details JSONB` + GRANTs preserved.
- No changes to routing, auth, or billing.

---

## Order of operations

1. Wave 1 (legacy strip + headers) — ships first, unblocks visual consistency.
2. Wave 2 (Passwords redesign) — the page the user is staring at right now.
3. Wave 3 (other surfaces) — Identity, Devices, Threats, Exposure, Timeline polish.

Reply **go** to start Wave 1, or tell me to reorder/skip waves.
