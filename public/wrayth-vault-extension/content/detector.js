// Wrayth — Ray Page Detector (content script)
// Classifies the current page, watches password fields, and reports context.
(() => {
  if (window.__wraythDetector) return;
  window.__wraythDetector = true;

  const OAUTH_HINTS = ['oauth', 'authorize', 'sso', 'openid'];
  const RESET_HINTS = ['reset', 'forgot', 'recover'];
  const SIGNUP_HINTS = ['signup', 'sign-up', 'register', 'create-account', 'join'];
  const PAYMENT_HINTS = ['checkout', 'billing', 'payment', 'pay', 'cart'];
  const SECURITY_HINTS = ['security', 'mfa', 'two-factor', '2fa', 'passkey', 'account/security', 'account-settings'];

  function pathHints() {
    return (location.pathname + location.search).toLowerCase();
  }
  function hasFieldType(types) {
    const inputs = Array.from(document.querySelectorAll('input'));
    return inputs.some((el) => types.includes((el.type || '').toLowerCase()));
  }
  function hasOTP() {
    const otp = document.querySelector('input[autocomplete="one-time-code"], input[name*="otp" i], input[name*="code" i][maxlength="6"], input[inputmode="numeric"][maxlength="6"]');
    return !!otp;
  }
  function hasPasskey() {
    const text = document.body?.innerText?.toLowerCase() || '';
    return text.includes('passkey') || text.includes('use security key') || text.includes('webauthn');
  }
  function detectOAuthProvider() {
    const t = document.body?.innerText?.toLowerCase() || '';
    if (t.includes('continue with google') || t.includes('sign in with google')) return 'google';
    if (t.includes('continue with microsoft') || t.includes('sign in with microsoft')) return 'microsoft';
    if (t.includes('continue with apple')) return 'apple';
    if (t.includes('continue with github')) return 'github';
    return null;
  }

  // Brand-impersonation heuristic from page content (logo/title vs hostname)
  function brandImpersonationSignal() {
    const title = (document.title || '').toLowerCase();
    const host = location.hostname.toLowerCase();
    const brands = ['microsoft', 'google', 'apple', 'amazon', 'github', 'paypal', 'facebook', 'chase', 'wellsfargo', 'netflix', 'instagram', 'linkedin'];
    for (const b of brands) {
      if (title.includes(b) && !host.includes(b)) return b;
    }
    return null;
  }

  // Wrayth 4.0 — provider recognition for "Secure this account with Ray"
  const SECURE_PROVIDERS = [
    { id: 'google',    domains: ['google.com', 'gmail.com'] },
    { id: 'microsoft', domains: ['microsoft.com', 'live.com', 'outlook.com', 'office.com', 'microsoftonline.com'] },
    { id: 'github',    domains: ['github.com'] },
    { id: 'apple',     domains: ['apple.com', 'icloud.com'] },
    { id: 'amazon',    domains: ['amazon.com'] },
    { id: 'facebook',  domains: ['facebook.com', 'fb.com', 'instagram.com'] },
    { id: 'dropbox',   domains: ['dropbox.com'] },
  ];
  function detectSecureProvider() {
    const h = location.hostname.toLowerCase();
    for (const p of SECURE_PROVIDERS) {
      if (p.domains.some((d) => h === d || h.endsWith('.' + d))) return p.id;
    }
    return null;
  }


  function classify() {
    const path = pathHints();
    const hasPassword = hasFieldType(['password']);
    const hasEmail = !!document.querySelector('input[type="email"], input[autocomplete*="email"], input[name*="email" i]');
    const hasUsername = !!document.querySelector('input[autocomplete*="username"], input[name*="user" i], input[name*="login" i]');
    const otp = hasOTP();
    const passkey = hasPasskey();
    const oauthProvider = detectOAuthProvider();
    const isPayment = PAYMENT_HINTS.some((h) => path.includes(h)) ||
      !!document.querySelector('input[autocomplete*="cc-"], input[name*="card" i]');
    const isSecurity = SECURITY_HINTS.some((h) => path.includes(h));
    const brandMimic = brandImpersonationSignal();

    let type = 'none';
    if (otp) type = 'mfa';
    else if (OAUTH_HINTS.some((h) => path.includes(h))) type = 'oauth';
    else if (RESET_HINTS.some((h) => path.includes(h)) && hasPassword) type = 'reset';
    else if (SIGNUP_HINTS.some((h) => path.includes(h)) && hasPassword) type = 'signup';
    else if (isPayment) type = 'payment';
    else if (isSecurity) type = 'security-settings';
    else if (hasPassword && (hasEmail || hasUsername)) type = 'login';
    else if (passkey && !hasPassword) type = 'passkey';

    return {
      url: location.href,
      host: location.hostname,
      title: document.title,
      type,
      signals: {
        hasPassword, hasEmail, hasUsername,
        hasOTP: otp, passkeySupported: passkey, oauthProvider,
        isPayment, isSecurity,
        isHTTPS: location.protocol === 'https:',
        brandMimic,
        secureProvider: detectSecureProvider(),
      },
      detectedAt: Date.now(),
    };
  }

  let last = null;
  function publish() {
    const ctx = classify();
    last = ctx;
    try {
      chrome.runtime.sendMessage({ type: 'wrayth:page-context', context: ctx }).catch?.(() => {});
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('wrayth:context', { detail: ctx }));
  }

  // Initial + observe DOM mutations (debounced, idle)
  let timer = null;
  const debouncedPublish = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      (window.requestIdleCallback || setTimeout)(publish, 0);
    }, 500);
  };
  publish();
  const mo = new MutationObserver(debouncedPublish);
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: false });
  window.addEventListener('beforeunload', () => mo.disconnect());

  // ---- Password field intelligence ----
  function readUsername() {
    const sel = 'input[type="email"], input[autocomplete*="email"], input[autocomplete*="username"], input[name*="email" i], input[name*="user" i], input[name*="login" i]';
    const el = document.querySelector(sel);
    const v = (el && 'value' in el) ? String(el.value || '').trim() : '';
    return v || null;
  }
  function reportPasswordFocus(pwInput) {
    try {
      const ctx = last || classify();
      const isNew = /new-password/i.test(pwInput.autocomplete || '') ||
        ctx.type === 'signup' || ctx.type === 'reset';
      chrome.runtime.sendMessage({
        type: 'wrayth:password-field-focus',
        host: location.hostname,
        url: location.href,
        username: readUsername(),
        pageType: ctx.type,
        isNewPassword: isNew,
        passkeySupported: ctx.signals?.passkeySupported || false,
      }).catch?.(() => {});
    } catch (_) {}
  }

  const seen = new WeakSet();
  function watchPasswordFields() {
    document.querySelectorAll('input[type="password"]').forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      el.addEventListener('focus', () => reportPasswordFocus(el), { passive: true });
    });
  }
  watchPasswordFields();
  // re-scan when DOM mutates (rate-limited by MutationObserver above)
  const pwObserver = new MutationObserver(() => watchPasswordFields());
  pwObserver.observe(document.documentElement, { childList: true, subtree: true });

  // ---- Wrayth 4.1: rich page snapshot for "Explain this page" ----
  function visibleText(el) {
    try {
      const s = (el?.innerText || el?.textContent || '').trim().replace(/\s+/g, ' ');
      return s.slice(0, 140);
    } catch (_) { return ''; }
  }
  function describeForm(form) {
    const fields = Array.from(form.querySelectorAll('input, select, textarea'))
      .slice(0, 8)
      .map((el) => {
        const type = (el.getAttribute('type') || el.tagName || '').toLowerCase();
        const name = el.getAttribute('name') || el.getAttribute('autocomplete') || el.getAttribute('id') || '';
        const label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || name || type;
        return `${type}:${String(label).slice(0, 40)}`;
      });
    const submit = form.querySelector('button[type="submit"], input[type="submit"], button');
    return { fields, submitText: submit ? visibleText(submit).slice(0, 40) : null };
  }
  function snapshot() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .slice(0, 10).map(visibleText).filter(Boolean);
    const buttons = Array.from(document.querySelectorAll('button, a[role="button"], input[type="submit"]'))
      .slice(0, 20).map(visibleText).filter(Boolean).slice(0, 12);
    const forms = Array.from(document.querySelectorAll('form')).slice(0, 5).map(describeForm);
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || null;
    const ctx = last || classify();
    return {
      url: location.href,
      host: location.hostname,
      title: document.title,
      metaDescription: metaDesc ? String(metaDesc).slice(0, 280) : null,
      headings,
      buttons,
      forms,
      type: ctx.type,
      signals: ctx.signals,
      provider: ctx.signals?.secureProvider || null,
      capturedAt: Date.now(),
    };
  }

  // Answer requests from sidepanel/popup via background relay
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'wrayth:get-context') {
      sendResponse(last || classify());
      return true;
    }
    if (msg?.type === 'wrayth:get-snapshot') {
      sendResponse(snapshot());
      return true;
    }
    return false;
  });

  window.__wraythGetContext = () => last || classify();
  window.__wraythGetSnapshot = snapshot;
})();

