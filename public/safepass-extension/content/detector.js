// Wrayth — Ray Page Detector (content script)
// Classifies the current page and reports context to the service worker.
(() => {
  if (window.__wraythDetector) return;
  window.__wraythDetector = true;

  const OAUTH_HINTS = ['oauth', 'authorize', 'sso', 'openid'];
  const RESET_HINTS = ['reset', 'forgot', 'recover'];
  const SIGNUP_HINTS = ['signup', 'sign-up', 'register', 'create-account', 'join'];
  const PAYMENT_HINTS = ['checkout', 'billing', 'payment', 'pay', 'cart'];
  const SECURITY_HINTS = ['security', 'mfa', 'two-factor', '2fa', 'passkey', 'account/security'];

  function hostHints(host) {
    return host.toLowerCase();
  }

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
    // Cannot detect WebAuthn meta from content script reliably; check for visible passkey buttons
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
        hasPassword,
        hasEmail,
        hasUsername,
        hasOTP: otp,
        passkeySupported: passkey,
        oauthProvider,
        isPayment,
        isSecurity,
        isHTTPS: location.protocol === 'https:',
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

  // Initial + observe DOM mutations (debounced)
  let timer = null;
  const debouncedPublish = () => {
    clearTimeout(timer);
    timer = setTimeout(publish, 400);
  };

  publish();
  const mo = new MutationObserver(debouncedPublish);
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: false });
  window.addEventListener('beforeunload', () => mo.disconnect());

  // Answer requests from sidepanel/popup via background relay
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'wrayth:get-context') {
      sendResponse(last || classify());
    }
    return true;
  });

  window.__wraythGetContext = () => last || classify();
})();
