# Ray-Led 2FA Experience

Reframe two-factor authentication from a settings toggle into a conversation Ray has with the user about protecting every account in the vault. This plan covers the data model, crypto, UI, and Ray's proactive coaching.

## 1. Data model (Supabase)

New tables:

- `vault_totp_secrets` — one row per protected vault account
  - `id`, `user_id`, `password_entry_id` (nullable, links to `safepass_entries`), `service_name`, `service_domain`, `account_label`
  - `secret_ciphertext`, `secret_iv`, `secret_salt` (AES-GCM, derived from user master password — never plaintext at rest)
  - `algorithm` (`SHA1` default), `digits` (6), `period` (30)
  - `backup_codes_ciphertext`, `backup_codes_iv` (encrypted JSON array)
  - `recovery_method` (text: "backup_codes" | "email" | "phone" | "security_keys" | "none")
  - `last_used_at`, `verified_at`, `created_at`, `updated_at`
- `vault_mfa_recommendations` — Ray's queue of accounts that should enable MFA
  - `id`, `user_id`, `password_entry_id`, `service_name`, `service_domain`
  - `priority` (`critical` | `high` | `medium` | `low`), `reason`, `mfa_methods` (jsonb: supported methods Ray found)
  - `status` (`pending` | `dismissed` | `setup_started` | `completed`), `dismissed_until`
  - `created_at`, `updated_at`
- `vault_mfa_health_snapshots` — history of the 2FA Health Score for trend lines
  - `id`, `user_id`, `score` (0-100), `protected_count`, `unprotected_count`, `critical_unprotected`, `captured_at`

All tables: RLS scoped to `auth.uid()`, grants to `authenticated` + `service_role`, updated_at triggers.

## 2. Service catalog

Add `src/lib/ray/mfaCatalog.ts` — a hand-curated list of high-value services that support TOTP, mapped by domain (google.com, github.com, microsoft.com, apple.com, amazon.com, dropbox.com, paypal.com, coinbase.com, stripe.com, slack.com, notion.so, etc.). Each entry carries: display name, supported methods, setup URL deep link, priority weight, recovery options.

## 3. Crypto (client-side)

`src/lib/ray/totpCrypto.ts`:
- Reuse the existing master-password-derived key (PBKDF2 600k) from SafePass.
- `encryptSecret(plaintext, key)` → `{ ciphertext, iv }` using AES-GCM.
- `decryptSecret(ciphertext, iv, key)`.
- `generateTOTP(secret, { algorithm, digits, period })` — HMAC-based, no third-party deps beyond what's already vendored.
- `parseOtpAuthUri(uri)` — for QR scans and manual `otpauth://` paste.

## 4. QR scanning & manual entry

`src/components/ray/mfa/QRScanner.tsx`:
- Use `@zxing/browser` (already in tree or add) to scan via `navigator.mediaDevices`.
- Fallback "Paste setup key" textbox that accepts raw base32 secrets or full `otpauth://` URIs.
- Image upload fallback for screenshots of QR codes (decoded in-browser).

## 5. Ray's 2FA conversation surface

`src/pages/safesuite/RayMFAHub.tsx` at `/app/mfa`:
- **Empty state**: Ray says *"You haven't told me about any 2FA codes yet. Want me to walk you through securing the accounts that matter most?"* with one CTA — **Start with Ray**.
- **Guided setup wizard** (`RayMFASetupFlow.tsx`) — multi-step conversational flow:
  1. Ray picks the top unprotected account from the recommendation queue (or user chooses from a "high-value first" list pulled from vault + catalog).
  2. Ray explains *why* (e.g., "Your Google account holds your password resets — if someone takes it, they take everything.").
  3. Ray opens setup link in a new tab, then offers QR scan / manual entry.
  4. User scans, Ray verifies the first generated code against the secret before saving.
  5. Ray prompts for backup codes ("Paste them here and I'll keep them encrypted — you'll never be locked out.").
  6. Ray confirms recovery: *"I've got it. You're protected. I'll watch this account from now on."*
- **Protected accounts grid**: shows live TOTP codes with countdown ring, copy-to-clipboard, last-used, recovery status.
- **Recommendation rail**: prioritized unprotected accounts with **Set up with Ray** buttons.

## 6. 2FA Health Score

`src/lib/ray/mfaHealth.ts`:
- Score = weighted ratio of protected critical accounts (banking, email, work, crypto) vs. all eligible accounts in the vault.
- Surface on dashboard via a new `RayMFAHealthCard.tsx` and inside the existing Ray Briefing Hero as a finding when score < 80.
- Snapshot daily so the timeline can render trend ("Up 12 points since last week").

## 7. Proactive detection

Extend `src/lib/ray/recommendations.ts` and the existing `ray-briefing` edge function:
- On each vault load, cross-reference `safepass_entries.url` / `service_name` against `mfaCatalog`.
- For any match without a `vault_totp_secrets` row, insert a `vault_mfa_recommendations` row (deduped) and emit a `ray_timeline` entry: *"Ray noticed your Coinbase account isn't protected by 2FA."*
- Briefing copy when score drops: *"Three of your most important accounts still don't have 2FA. Want me to start with Google?"*

## 8. Recovery & verification

- Backup codes stored encrypted; revealed only after master-password re-prompt.
- "Test this code" action runs `generateTOTP` and lets the user paste their authenticator's code to confirm clocks match.
- "Export recovery kit" produces an encrypted PDF (reuse existing `pdfExport` util) with masked codes + Ray's recovery instructions.

## 9. Routing & navigation

- Add `/app/mfa` route in `src/App.tsx` (lazy).
- Add **2FA** entry to the Protection group in `src/layouts/SafeSuiteLayout.tsx` with a shield-check icon.
- Update `RayInsightPanel` on the Passwords page to show Ray's top 2FA recommendation inline.

## 10. Out of scope (this pass)

- WebAuthn/passkey enrollment (separate workstream).
- Phone-based SMS MFA storage (Ray will recommend against it).
- Pushing TOTP codes to the browser extension (follow-up).

## Technical notes

- All TOTP secrets encrypted in the browser with the master-password-derived key before any network call. The edge function and DB never see plaintext.
- `vault_mfa_recommendations` insert path lives in an edge function `ray-mfa-scan` so the briefing function can call it server-side too.
- New edge functions: `ray-mfa-scan` (recommendation generator), `ray-mfa-health` (score snapshot). Both `verify_jwt = true`.
- No changes to the existing `security_settings` / `setup-two-factor` flow, which protects login to Wrayth itself — this is a separate surface for vault-stored third-party 2FA.
