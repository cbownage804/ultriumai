// Wrayth — Ray Context Bar (calm chip)
(() => {
  if (window.__wraythContextBar) return;
  window.__wraythContextBar = true;

  const HIDE_KEY = 'wrayth:cbar:hidden:' + location.hostname;
  let chip, dot, label, host = location.hostname;
  let state = { level: 'neutral', message: 'Ask Ray', context: null, intel: null };

  function mount() {
    if (chip) return;
    chip = document.createElement('div');
    chip.className = 'wrayth-cbar';
    chip.setAttribute('role', 'button');
    chip.setAttribute('aria-label', 'Open Ray');
    chip.innerHTML = `
      <span class="wrayth-cbar-dot" aria-hidden="true"></span>
      <span class="wrayth-cbar-label">Ask Ray</span>
      <button class="wrayth-cbar-x" aria-label="Hide on this site">×</button>
    `;
    chip.addEventListener('click', (e) => {
      if ((e.target instanceof HTMLElement) && e.target.classList.contains('wrayth-cbar-x')) {
        try { sessionStorage.setItem(HIDE_KEY, '1'); } catch (_) {}
        chip.remove();
        chip = null;
        return;
      }
      try {
        chrome.runtime.sendMessage({ type: 'wrayth:open-sidepanel' }).catch?.(() => {});
      } catch (_) {}
    });
    dot = chip.querySelector('.wrayth-cbar-dot');
    label = chip.querySelector('.wrayth-cbar-label');
    document.documentElement.appendChild(chip);
  }

  function render() {
    if (!chip) return;
    dot.dataset.level = state.level;
    label.textContent = state.message;
    chip.dataset.level = state.level;
  }

  function deriveState(ctx, intel) {
    // Default
    let level = 'neutral';
    let message = 'Ask Ray';

    if (intel?.malicious) { level = 'danger'; message = 'Suspicious site'; }
    else if (intel?.typosquatOf) { level = 'warn'; message = `Looks like ${intel.typosquatOf}`; }
    else if (ctx?.signals && !ctx.signals.isHTTPS && ctx.type === 'login') { level = 'warn'; message = 'Insecure login (no HTTPS)'; }
    else if (ctx?.type === 'login' && intel?.breachCount > 0) { level = 'warn'; message = 'Password reuse risk'; }
    else if (ctx?.signals?.passkeySupported && ctx?.type === 'login') { level = 'info'; message = 'Passkey available'; }
    else if (ctx?.type === 'mfa') { level = 'info'; message = 'MFA — Ray can help'; }
    else if (ctx?.type === 'login') { level = 'ok'; message = 'Sign in with Ray'; }
    else if (ctx?.type === 'payment') { level = 'info'; message = 'Payment page'; }
    else if (ctx?.type === 'none') { level = 'neutral'; message = 'Ask Ray'; }

    return { level, message };
  }

  function refresh() {
    const ctx = window.__wraythGetContext?.() || null;
    state.context = ctx;
    const next = deriveState(ctx, state.intel);
    state.level = next.level;
    state.message = next.message;
    render();
  }

  // Hide if user dismissed for this session
  try {
    if (sessionStorage.getItem(HIDE_KEY)) return;
  } catch (_) {}

  // Wait for body
  const ready = () => {
    if (!document.body) return setTimeout(ready, 100);
    mount();
    refresh();
  };
  ready();

  window.addEventListener('wrayth:context', () => refresh());

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'wrayth:domain-intel') {
      state.intel = msg.intel;
      refresh();
    }
  });
})();
