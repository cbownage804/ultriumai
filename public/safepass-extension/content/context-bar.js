// Wrayth — Ray Context Bar (calm chip + expandable explainer)
// 4.1: adds "Explain this page" review card + Teach-me-why toggle.
(() => {
  if (window.__wraythContextBar) return;
  window.__wraythContextBar = true;

  const HIDE_KEY = 'wrayth:cbar:hidden:' + location.hostname;
  const TEACH_KEY = 'wrayth:teach';
  const EXPLAIN_CACHE_KEY = 'wrayth:explain:' + location.href;

  let chip, dot, label, panel, panelOpen = false;
  let state = {
    level: 'neutral',
    message: 'Ask Ray',
    context: null,
    intel: null,
    pwIntel: null,
    explain: null,         // { title, summary, risk_level, confidence_label, why[], capabilities[], next_step, cached?: boolean }
    explainLoading: false,
    explainError: null,
    teach: false,
    view: 'home',          // 'home' | 'explain'
  };

  try { state.teach = localStorage.getItem(TEACH_KEY) === '1'; } catch (_) {}
  try {
    const cached = sessionStorage.getItem(EXPLAIN_CACHE_KEY);
    if (cached) { state.explain = { ...JSON.parse(cached), cached: true }; }
  } catch (_) {}

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
    state.view = 'home';
    document.removeEventListener('click', outsideClick, { capture: true });
  }
  function outsideClick(e) {
    if (!panel || !chip) return;
    const t = e.target;
    if (panel.contains(t) || chip.contains(t)) return;
    closePanel();
  }

  // ---------- Render ----------
  function renderPanel() {
    if (!panel) return;
    panel.innerHTML = state.view === 'explain' ? renderExplainView() : renderHomeView();
    panel.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', (ev) => onAction(b.getAttribute('data-act'), ev));
    });
    const teachToggle = panel.querySelector('[data-teach-toggle]');
    if (teachToggle) teachToggle.addEventListener('change', (e) => {
      state.teach = !!e.target.checked;
      try { localStorage.setItem(TEACH_KEY, state.teach ? '1' : '0'); } catch (_) {}
      renderPanel();
    });
  }

  function renderHomeView() {
    const ctx = state.context || {};
    const intel = state.intel || {};
    const pw = state.pwIntel || null;
    const lvl = state.level;
    const headline = intel.headline || state.message;
    const positives = (intel.positives || []).slice(0, 3);
    const reasons = (intel.reasons || []).slice(0, 4);
    const explainHint = state.explain ? "View Ray's review of this page →" : '✨ Explain this page';

    return `
      <div class="wrayth-panel-head" data-level="${lvl}">
        <div class="wrayth-panel-eye" aria-hidden="true"></div>
        <div>
          <div class="wrayth-panel-host">${escapeHtml(ctx.host || location.hostname)}</div>
          <div class="wrayth-panel-headline">${escapeHtml(headline)}</div>
        </div>
      </div>
      <div class="wrayth-panel-body">
        <button class="wrayth-explain-cta" data-act="explain">
          <span class="wrayth-explain-spark" aria-hidden="true">✨</span>
          <span>${escapeHtml(explainHint)}</span>
        </button>
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
  }

  function renderExplainView() {
    const ctx = state.context || {};
    const ex = state.explain;
    const host = ctx.host || location.hostname;

    if (state.explainLoading && !ex) {
      return `
        <div class="wrayth-panel-head" data-level="info">
          <div class="wrayth-panel-eye" aria-hidden="true"></div>
          <div>
            <div class="wrayth-panel-host">${escapeHtml(host)}</div>
            <div class="wrayth-panel-headline">Ray is reading this page…</div>
          </div>
        </div>
        <div class="wrayth-panel-body">
          <div class="wrayth-review-skeleton">
            <div></div><div></div><div></div>
          </div>
        </div>
        <div class="wrayth-panel-actions">
          <button class="wrayth-panel-btn" data-act="back">Back</button>
        </div>
      `;
    }
    if (state.explainError && !ex) {
      return `
        <div class="wrayth-panel-head" data-level="warn">
          <div class="wrayth-panel-eye" aria-hidden="true"></div>
          <div>
            <div class="wrayth-panel-host">${escapeHtml(host)}</div>
            <div class="wrayth-panel-headline">I couldn't fully read this page</div>
          </div>
        </div>
        <div class="wrayth-panel-body">
          <div class="wrayth-panel-section"><ul><li>${escapeHtml(state.explainError)}</li></ul></div>
        </div>
        <div class="wrayth-panel-actions">
          <button class="wrayth-panel-btn wrayth-panel-btn-primary" data-act="explain">Try again</button>
          <button class="wrayth-panel-btn" data-act="back">Back</button>
        </div>
      `;
    }

    const riskClass = ex.risk_level === 'red' ? 'danger' : ex.risk_level === 'yellow' ? 'warn' : 'ok';
    const teach = state.teach;
    const seenBefore = ex.cached ? `<div class="wrayth-review-memory">We've looked at this page before — here's Ray's last read.</div>` : '';

    return `
      <div class="wrayth-panel-head" data-level="${riskClass}">
        <div class="wrayth-panel-eye" aria-hidden="true"></div>
        <div>
          <div class="wrayth-panel-host">${escapeHtml(host)}</div>
          <div class="wrayth-panel-headline">${escapeHtml(ex.title || 'Ray\u2019s review')}</div>
        </div>
      </div>
      <div class="wrayth-panel-body">
        ${seenBefore}
        <div class="wrayth-review-confidence" data-level="${riskClass}">
          <span class="wrayth-review-pill">${escapeHtml(ex.confidence_label || 'Reviewed')}</span>
          <span class="wrayth-review-risk">Risk: <strong>${escapeHtml(ex.risk_level || 'green')}</strong></span>
        </div>
        ${ex.summary ? `<div class="wrayth-panel-section"><p class="wrayth-review-summary">${escapeHtml(ex.summary)}</p></div>` : ''}
        ${ex.capabilities?.length ? `<div class="wrayth-panel-section"><div class="wrayth-panel-label">What you can do here</div><ul>${ex.capabilities.map(c => `<li>${escapeHtml(stripBullet(c))}</li>`).join('')}</ul></div>` : ''}
        ${ex.why?.length ? `<div class="wrayth-panel-section"><div class="wrayth-panel-label">Why Ray says this</div><ul>${ex.why.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul></div>` : ''}
        ${ex.next_step ? `<div class="wrayth-panel-section wrayth-next-step"><div class="wrayth-panel-label">Suggested next step</div><p>${escapeHtml(ex.next_step)}</p>${teach && ex.next_step_why ? `<p class="wrayth-teach">${escapeHtml(ex.next_step_why)}</p>` : ''}</div>` : ''}
        <label class="wrayth-teach-toggle">
          <input type="checkbox" data-teach-toggle ${teach ? 'checked' : ''} />
          <span>Teach me why</span>
        </label>
      </div>
      <div class="wrayth-panel-actions">
        <button class="wrayth-panel-btn wrayth-panel-btn-primary" data-act="open">Open Ray</button>
        <button class="wrayth-panel-btn" data-act="refresh-explain">Re-scan</button>
        <button class="wrayth-panel-btn" data-act="back">Back</button>
      </div>
    `;
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

  function stripBullet(s) {
    return String(s || '').replace(/^[•\-\*]\s*/, '');
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // ---------- Actions ----------
  function onAction(act, ev) {
    const ctx = state.context || {};
    if (act === 'open') {
      try { chrome.runtime.sendMessage({ type: 'wrayth:open-sidepanel' }).catch?.(() => {}); } catch (_) {}
    } else if (act === 'secure') {
      const prov = ctx.signals && ctx.signals.secureProvider;
      try { chrome.runtime.sendMessage({ type: 'wrayth:open-url', url: `https://wrayth.app/app/ray/secure/${prov}` }).catch?.(() => {}); } catch (_) {}
    } else if (act === 'leave') {
      location.href = 'about:blank';
    } else if (act === 'explain') {
      state.view = 'explain';
      if (!state.explain || ev?.shiftKey) requestExplanation(false);
      renderPanel();
    } else if (act === 'refresh-explain') {
      requestExplanation(true);
    } else if (act === 'back') {
      state.view = 'home';
      renderPanel();
    } else {
      closePanel();
    }
  }

  function requestExplanation(force) {
    if (state.explainLoading) return;
    state.explainLoading = true;
    state.explainError = null;
    if (force) state.explain = null;
    renderPanel();

    const snap = (typeof window.__wraythGetSnapshot === 'function')
      ? window.__wraythGetSnapshot()
      : (state.context || null);
    // Attach domain intel for risk reconciliation
    const payload = { ...snap, intel: state.intel || null };

    try {
      chrome.runtime.sendMessage({ type: 'wrayth:explain-page', snapshot: payload, force: !!force }, (resp) => {
        state.explainLoading = false;
        if (chrome.runtime?.lastError) {
          state.explainError = chrome.runtime.lastError.message || 'Could not reach Ray.';
          renderPanel();
          return;
        }
        if (resp?.ok && resp.explanation) {
          state.explain = resp.explanation;
          try { sessionStorage.setItem(EXPLAIN_CACHE_KEY, JSON.stringify(resp.explanation)); } catch (_) {}
        } else {
          state.explainError = resp?.error || "I couldn't analyze this page right now.";
        }
        renderPanel();
      });
    } catch (e) {
      state.explainLoading = false;
      state.explainError = String(e?.message || e);
      renderPanel();
    }
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
    else if (ctx?.type === 'security-settings') { level = 'info'; message = 'Security settings — explain?'; }
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

    // Timeline: auto-log when a user spends >5s on a known provider's security page
    maybeLogSecurityReview(ctx);
  }

  let reviewLogged = false;
  function maybeLogSecurityReview(ctx) {
    if (reviewLogged) return;
    if (!ctx || ctx.type !== 'security-settings') return;
    const prov = ctx.signals?.secureProvider;
    if (!prov) return;
    setTimeout(() => {
      if (document.hidden) return;
      reviewLogged = true;
      try {
        chrome.runtime.sendMessage({
          type: 'wrayth:timeline-event',
          event: {
            event_type: 'browser.reviewed_security_settings',
            summary: `Reviewed ${prov.charAt(0).toUpperCase() + prov.slice(1)} security settings.`,
            severity: 'info',
            payload: { host: ctx.host, provider: prov, url: ctx.url },
          },
        }).catch?.(() => {});
      } catch (_) {}
    }, 5000);
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
