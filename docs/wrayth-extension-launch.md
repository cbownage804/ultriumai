# Wrayth Browser Extension — Launch Readiness

Owner: Vault / Ray team
Status: Sideload beta (Chromium production-ready, Firefox beta)
Target: Chrome Web Store, Edge Add-ons, Firefox AMO

---

## 1. Internal Testing Checklist

Run the full matrix on a clean profile per browser. Log results in `docs/v0.4-qa-report.md` under a new "Extension" section per release.

### Browsers
- [ ] Chrome (stable, latest)
- [ ] Chrome (Chrome 114 — minimum supported)
- [ ] Edge (stable, latest)
- [ ] Brave (stable)
- [ ] Arc (latest)
- [ ] Firefox (stable, latest)
- [ ] Firefox ESR

### Install / Load
- [ ] Chromium ZIP loads via `Load unpacked` with no manifest warnings
- [ ] Firefox ZIP loads via `about:debugging → Load Temporary Add-on`
- [ ] Icon renders at 16 / 32 / 48 / 128 px
- [ ] Toolbar action opens popup (Chromium) / opens popup (Firefox)
- [ ] Keyboard shortcuts registered (Ctrl+Shift+P, +J, +L, +G, +K)

### Auth & Session
- [ ] Sign in from popup persists across browser restart
- [ ] Sign out from popup clears session everywhere (popup, side panel, content script)
- [ ] Session survives service worker suspension (Chromium — wait 30s idle, re-open)
- [ ] Vault sync pulls latest entries after login
- [ ] Auth error surfaces a readable message (not a stack trace)

### Vault Locked / Unlocked
- [ ] Vault starts locked after browser restart
- [ ] Master password unlocks vault
- [ ] Wrong master password shows error, does not lock user out
- [ ] Lock Vault shortcut (Ctrl+Shift+K) locks immediately
- [ ] Auto-lock after configured idle timeout
- [ ] Locked vault hides all entries in popup, side panel, and autofill

### Autofill
- [ ] Login form auto-detected on common sites (Google, GitHub, Amazon, banking sample)
- [ ] Ctrl+Shift+L fills username + password
- [ ] Multi-account picker appears when >1 credential matches domain
- [ ] TOTP autofill works where field is detected
- [ ] Autofill blocked when vault is locked (prompts unlock)
- [ ] No fill on `http://` unless user overrides
- [ ] Subdomain matching behaves per settings (strict vs. loose)

### Save Password Prompt
- [ ] Prompt appears after successful login on new site
- [ ] Prompt appears after password change (updates existing entry)
- [ ] "Never for this site" is respected across sessions
- [ ] Prompt dismisses cleanly; does not re-appear on same submission
- [ ] Saved entry appears in web vault within ~5s

### Ray (Side Panel / Sidebar)
- [ ] Chromium: Ctrl+Shift+J opens side panel
- [ ] Firefox: sidebar opens via toolbar / View → Sidebar
- [ ] No `chrome.sidePanel` errors in Firefox console
- [ ] No `sidebarAction` errors in Chromium console
- [ ] Explain-this-page works on http, https, and PDF viewers gracefully
- [ ] Site trust badge shows in context bar

### Copy Audit — No Legacy Wording
- [ ] Grep extension for `SafePass` — 0 hits in user-facing strings
- [ ] Grep extension for `Vault vault` — 0 hits
- [ ] All UI reads: **Wrayth**, **Wrayth Vault**, or **Wrayth browser extension**
- [ ] Store listing copy uses same three terms only

### Regression
- [ ] Uninstall then reinstall — no orphaned storage errors
- [ ] Update from previous version preserves saved entries
- [ ] Works with Wrayth web app open in another tab (no session collision)

---

## 2. Store Readiness

### Chrome Web Store + Edge Add-ons (shared package)

- [ ] **Privacy policy URL** — public page describing what the extension reads, stores, transmits, and retains
- [ ] **Permission justifications** (one paragraph each, submitted in developer dashboard):
  - `storage` — persist session + user preferences locally
  - `alarms` — schedule vault sync + lock timers
  - `notifications` — breach alerts, save-password prompts
  - `clipboardWrite` / `clipboardRead` — copy credentials on user action
  - `contextMenus` — right-click autofill and Ask Ray
  - `activeTab` / `tabs` — detect current site for autofill + trust signals
  - `scripting` — inject autofill + Ray overlay
  - `sidePanel` — Ray side panel UI
  - `host_permissions: <all_urls>` — autofill + site trust must run on any site the user visits
- [ ] **Screenshots** (1280x800 or 640x400, PNG, 1–5 required):
  - Popup — unlocked vault with entries
  - Side panel — Ray explaining a page
  - Autofill in action on a login form
  - Save-password prompt
  - Site trust warning
- [ ] **Icons**: 128x128 store icon (already in `icons/icon128.png`)
- [ ] **Short description** (≤132 chars):
  > Ray in your browser — autofill, site trust, and identity awareness across every tab, synced to Wrayth.
- [ ] **Long description** (see template below)
- [ ] **Category**: Productivity
- [ ] **Support URL**: `https://wrayth.ai/contact`
- [ ] **Homepage URL**: `https://wrayth.ai`
- [ ] **Single purpose statement**: "Secure credential autofill and browsing intelligence for Wrayth users."
- [ ] **Data usage disclosure** — check every applicable box (auth info, website content, user activity) and confirm: no sale, no unrelated use, encrypted in transit.
- [ ] **Version + release notes** — see `CHANGELOG` section below

### Firefox AMO

- [ ] Submit signed `.xpi` (built from `manifest.firefox.json`)
- [ ] `browser_specific_settings.gecko.id` matches AMO listing
- [ ] Source code submission if minifier used (currently: no minification, direct submission OK)
- [ ] Same screenshots + descriptions as Chrome
- [ ] Reviewer notes: link to unminified source in `public/wrayth-vault-extension/`

### Long Description Template

```
Wrayth brings Ray — your security co-pilot — into every browser tab.

• Autofill passwords, usernames, and TOTP codes from your Wrayth Vault
• Save new logins with one click; update changed passwords automatically
• Real-time site trust: Ray flags phishing, brand impersonation, and untrusted domains before you type
• Explain this page: ask Ray to translate any terms of service, privacy policy, or form into plain English
• End-to-end encrypted vault sync — AES-256, keys derived on your device
• Works alongside the Wrayth web app at wrayth.ai

Requires a free Wrayth account. Get started at https://wrayth.ai
```

### Release Notes Template (per version)

```
v4.1.0
• Firefox beta release
• Runtime guards for sidePanel / sidebarAction — no more cross-browser errors
• Browser detection utility for cleaner platform-specific behavior
• Consistent Wrayth branding across all surfaces
```

---

## 3. Sign-off

Ship to stores only when every box in sections 1 and 2 is checked and the QA report is filed.
