// Wrayth — Ray Context Bar (calm chip + expandable explainer)
(() => {
  if (window.__wraythContextBar) return;
  window.__wraythContextBar = true;

  const HIDE_KEY = 'wrayth:cbar:hidden:' + location.hostname;
  let chip, dot, label, panel, panelOpen = false;
  let state = { level: 'neutral', message: 'Ask Ray', context: null, intel: null, pwIntel: null };

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
      const t = e.target;
      if (t instanceof HTMLElement && t.classList.contains('wrayth-cbar-x')) {
        try { sessionStorage.setItem(HIDE_KEY, '1'); } catch (_) {}
        chip.remove(); chip = null;
        if (panel) { panel.remove(); panel = null; }
        return;
      }
      togglePanel();
    });
    dot = chip.querySelector('.wrayth-cbar-dot');
    label = chip.querySelector('.wrayth-cbar-label');
    document.documentElement.appendChild(chip);
  }

  function togglePanel() {
    if (panelOpen) { closePanel(); return; }
    openPanel();
  }

  function openPanel() {
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'wrayth-panel';
      document.documentElement.appendChild(panel);
    }
    renderPanel();
    panel.dataset.open = '1';
    panelOpen = true;
    setTimeout(() => document.addEventListener('click', outsideClick, { capture: true }), 0);
  }
  function closePanel() {
    if (panel) panel.dataset.open = '0';
    panelOpen = false;
    document.removeEventListener('click', outsideClick, { capture: true });
  }
  function outsideClick(e) {
    if (!panel || !chip) return;
    const t = e.target;
    if (panel.contains(t) || chip.contains(t)) return;
    closePanel();
  }

  function renderPanel() {
    if (!panel) return;
    const ctx = state.context || {};
    const intel = state.intel || {};
    const pw = state.pwIntel || null;
    const lvl = state.level;
    const headline = intel.headline || state.message;
    const positives = (intel.positives || []).slice(0, 3);
    const reasons = (intel.reasons || []).slice(0, 4);

    panel.innerHTML = `
      <div class="wrayth-panel-head" data-level="${lvl}">
        <div class="wrayth-panel-eye" aria-hidden="true"></div>
        <div>
          <div class="wrayth-panel-host">${escapeHtml(ctx.host || location.hostname)}</div>
          <div class="wrayth-panel-headline">${escapeHtml(headline)}</div>
        </div>
      </div>
      <div class="wrayth-panel-body">
        ${reasons.length ? `<div class="wrayth-panel-section"><div class="wrayth-panel-label">Why Ray says this</div><ul>${reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div>` : ''}
        ${positives.length ? `<div class="wrayth-panel-section"><div class="wrayth-panel-label">What looks normal</div><ul>${positives.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div>` : ''}
        ${pw ? renderPasswordIntel(pw) : ''}
        ${ctx.signals && ctx.signals.secureProvider ? `<div class="wrayth-panel-section"><div class="wrayth-panel-label">Ray can secure this account</div><ul><li>I have a guided playbook for ${escapeHtml(ctx.signals.secureProvider)}. I'll walk you through MFA, passkeys, and recovery — one step at a time.</li></ul></div>` : ''}
      </div>
      <div class="wrayth-panel-actions">
        ${ctx.signals && ctx.signals.secureProvider ? `<button class="wrayth-panel-btn wrayth-panel-btn-primary" data-act="secure">Secure with Ray</button>` : `<button class="wrayth-panel-btn wrayth-panel-btn-primary" data-act="open">Open Ray</button>`}
        <button class="wrayth-panel-btn" data-act="leave" ${lvl === 'danger' ? '' : 'hidden'}>Leave site</button>
        <button class="wrayth-panel-btn" data-act="close">Dismiss</button>
      </div>
    `;
    panel.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        const act = b.getAttribute('data-act');
        if (act === 'open') {
          try { chrome.runtime.sendMessage({ type: 'wrayth:open-sidepanel' }).catch?.(() => {}); } catch (_) {}
        } else if (act === 'secure') {
          const prov = ctx.signals && ctx.signals.secureProvider;
          try { chrome.runtime.sendMessage({ type: 'wrayth:open-url', url: `https://wrayth.app/app/ray/secure/${prov}` }).catch?.(() => {}); } catch (_) {}
        } else if (act === 'leave') {
          location.href = 'about:blank';
        } else {
          closePanel();
        }
      });
    });
  }


  function renderPasswordIntel(pw) {
    const items = [];
    if (pw.savedCount > 0) items.push(`I have ${pw.savedCount} saved credential${pw.savedCount === 1 ? '' : 's'} for this site.`);
    else items.push("I don't have a saved credential for this site yet.");
    if (pw.identityMonitored) items.push(`This email is monitored in Wrayth. ${pw.identityBreached ? 'It appeared in a breach — change the password after signing in.' : 'No new breaches.'}`);
    if (pw.passkeySupported) items.push('This site supports passkeys — stronger than a password.');
    if (pw.reused) items.push('This password is reused on other sites.');
    if (pw.weak) items.push('Your saved password here is weak. I can generate a stronger one.');
    return `<div class="wrayth-panel-section"><div class="wrayth-panel-label">Password</div><ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function render() {
    if (!chip) return;
    dot.dataset.level = state.level;
    label.textContent = state.message;
    chip.dataset.level = state.level;
    if (panelOpen) renderPanel();
  }

  function deriveState(ctx, intel, pw) {
    let level = 'neutral';
    let message = 'Ask Ray';

    if (intel?.level === 'danger') { level = 'danger'; message = intel.brandImpersonation ? `Looks like ${intel.typosquatOf}` : 'High risk site'; }
    else if (intel?.level === 'warn') { level = 'warn'; message = intel.typosquatOf ? `Verify — resembles ${intel.typosquatOf}` : 'Caution'; }
    else if (intel?.level === 'info') { level = 'info'; message = 'New domain — verify'; }
    else if (ctx?.signals && !ctx.signals.isHTTPS && ctx.type === 'login') { level = 'warn'; message = 'Insecure login (no HTTPS)'; }
    else if (pw?.identityBreached) { level = 'warn'; message = 'Identity breach — change password'; }
    else if (ctx?.type === 'login' && pw?.savedCount > 0) { level = 'ok'; message = 'Sign in with Ray'; }
    else if (ctx?.signals?.passkeySupported && ctx?.type === 'login') { level = 'info'; message = 'Passkey available'; }
    else if (ctx?.type === 'mfa') { level = 'info'; message = 'MFA — Ray can help'; }
    else if (ctx?.type === 'security-settings') { level = 'info'; message = 'Security settings — guide me?'; }
    else if (ctx?.type === 'login') { level = 'ok'; message = 'Sign in with Ray'; }
    else if (ctx?.type === 'payment') { level = 'info'; message = 'Payment page'; }
    else if (intel?.level === 'ok') { level = 'ok'; message = intel.trusted ? 'Trusted site' : 'Looks legitimate'; }

    return { level, message };
  }

  function refresh() {
    const ctx = window.__wraythGetContext?.() || null;
    state.context = ctx;
    const next = deriveState(ctx, state.intel, state.pwIntel);
    state.level = next.level;
    state.message = next.message;
    render();
  }

  // Hide if user dismissed for this session
  try {
    if (sessionStorage.getItem(HIDE_KEY)) return;
  } catch (_) {}

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
    } else if (msg?.type === 'wrayth:password-intel') {
      state.pwIntel = msg.intel;
      refresh();
      if (panelOpen) renderPanel();
    }
  });
})();
