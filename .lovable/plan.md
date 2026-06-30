## Wrayth 3.5 — Ray Everywhere (Browser Extension)

Rewrite `public/safepass-extension/` so the extension feels like Ray accompanying the user across the web, not another password toolbar. Ship in waves so each milestone is usable on its own.

### Wave 1 — Foundation & manifest (this session)

- Bump `manifest.json` to v3.0.0, rename to "Wrayth — Ray for your browser", add `sidePanel`, `webRequest`, `cookies`, `scripting`, `tabs` permissions.
- Register Chrome **Side Panel** (`side_panel.default_path = sidepanel.html`).
- New file layout:
  ```
  public/safepass-extension/
    manifest.json
    background.js              (service worker — page analysis bus)
    sidepanel.html / .js / .css   (Ray side panel UI)
    popup.html / .js / .css       (mini-dashboard)
    content/
      detector.js              (login/MFA/passkey/payment detection)
      context-bar.js           (calm chip UI)
      field-menu.js            (inline field menu)
    lib/
      domain-intel.js          (typosquat, cert, age heuristics)
      page-context.js          (classify page type)
      ray-client.js            (talks to Wrayth edge fns)
      timeline.js              (writes to ray_timeline)
      vault-store.js           (encrypted local cache)
    styles/ray-tokens.css      (matte black / violet accents)
  ```

### Wave 2 — Intelligent detection & Context Bar

- `detector.js`: classify page as one of `login | signup | reset | mfa | oauth | passkey | payment | security-settings | none`. Detect MFA fields (`autocomplete="one-time-code"`, OTP input groups), passkey availability (`navigator.credentials` + WebAuthn meta), OAuth providers from button text/URLs.
- `context-bar.js`: small bottom-right chip with 4 states 🟢🟡🔴⚪ + "Ask Ray" — click opens side panel. Never auto-popup; respects per-site dismiss.
- `field-menu.js`: inline menu on focused username/password fields (Fill from Vault / Generate / Save / Ask Ray).

### Wave 3 — Ray Side Panel

- `sidepanel.html`: header (current site + reputation dot), tabs (Overview · Vault · Activity · Chat).
- Overview shows: domain age, cert issuer/validity, HTTPS, breach count, saved credential count, page-type label, "Recommended next step".
- Chat tab streams to the existing Ray edge function with page-context system prompt ("User is on github.com, login form detected, has 1 saved credential, supports passkeys").
- Reuses Wrayth tokens (matte black, electric violet accent only when Ray is thinking).

### Wave 4 — Domain & password intelligence

- `domain-intel.js`: lightweight heuristics in the SW + new edge function `ray-domain-intel` (Supabase) that returns `{ reputation, ageDays, certIssuer, typosquatOf, breachCount, malicious }`. Uses HIBP for breach, certificate transparency (`crt.sh`) + WHOIS via existing safeweb infra when available; falls back to local heuristic.
- On password fields: strength meter, reuse check against local vault cache, breach lookup, crack-time estimate. All in `field-menu.js`.
- Passkey coach: if WebAuthn supported and the site is in a curated allowlist (`lib/passkey-sites.json`), show "This site supports passkeys" with one-click playbook deep link `wrayth.app/app/playbooks/passkey-upgrade?site=...`.

### Wave 5 — Popup as mini-dashboard

- Replace current 758-line popup with: greeting, current site card, quick actions (Save · Scan page · Check domain · Generate · Ask Ray), latest notice, latest recommendation, security score, recent activity (last 5 timeline rows). Reuse side-panel components.

### Wave 6 — Cloud sync & timeline feed

- New edge function `ray-extension-sync` (verified JWT) for: pull vault entries, pull notices/score, push timeline events (`signed_in`, `password_saved`, `mfa_enabled`, `warning_shown`, `warning_dismissed`, `warning_accepted`). Writes to `ray_timeline` so Morning Brief can summarize.
- Auth: sign-in flow opens `wrayth.app/auth?source=extension`, returns a refresh token via `chrome.identity.launchWebAuthFlow`. Tokens stored in `chrome.storage.session`.

### Technical Details

- **Manifest V3** with module service worker. Sidepanel requires Chrome 114+ — bump `minimum_chrome_version`.
- **CSP** unchanged (`script-src 'self'`), all UI uses vanilla JS modules to avoid bundler.
- **Edge functions added**: `ray-domain-intel`, `ray-extension-sync`. Both `verify_jwt = true`.
- **DB**: reuse `ray_timeline`, `ray_notices`, `ray_security_scores`, `safepass_entries`. No new tables this wave.
- **Packaging**: existing `re-zip on download` flow at `/app/safepass/extension` keeps working — bump version string to 3.0.0 so Chrome auto-updates installed unpacked dev builds when reloaded.
- **No intrusive notifications**: remove `notifications` permission usage; warnings surface via Context Bar + side panel only.

### What ships this session

Waves 1–3 end-to-end (manifest, detection, context bar, side panel skeleton with live page context + Ray chat). Waves 4–6 follow in subsequent sessions because they need new edge functions and auth flow polish.

### Out of scope (this pass)

- Firefox / Safari builds.
- Background WebAuthn ceremony (only coaching link for now).
- M365 / Google Workspace deep links (already separate playbooks).
