// Wrayth — Ray Side Panel
const $ = (id) => document.getElementById(id);

const PAGE_LABELS = {
  login: 'Sign-in page',
  signup: 'Create-account page',
  reset: 'Password reset',
  mfa: 'Two-factor prompt',
  oauth: 'OAuth sign-in',
  passkey: 'Passkey sign-in',
  payment: 'Payment page',
  'security-settings': 'Security settings',
  none: 'Browsing',
};

const PAGE_HINTS = {
  login: "I'll watch for password risks and offer credentials from your vault.",
  signup: "I can generate a strong password and save the new account.",
  reset: "I'll help you create a stronger password than the one you had.",
  mfa: "Need your one-time code? Ask me to read it from your vault.",
  oauth: "Make sure the address bar matches the real provider.",
  passkey: "Passkeys are stronger than passwords. I can guide you through enrolling.",
  payment: "I won't autofill cards unless you ask. Verify the URL before paying.",
  'security-settings': 'Good moment to enable MFA, add passkeys, and review sessions.',
  none: 'Quiet for now. Ask me anything about this site.',
};

let currentTab = 'overview';
let currentContext = null;
let currentTabId = null;

function setTab(name) {
  currentTab = name;
  document.querySelectorAll('.sp-tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === name));
  document.querySelectorAll('.sp-panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === name));
}

async function renderContext(ctx) {
  if (!ctx) return;
  currentContext = ctx;
  $('sp-host').textContent = ctx.host || '—';
  $('sp-pagetype').textContent = PAGE_LABELS[ctx.type] || 'Browsing';
  $('sp-pagehint').textContent = PAGE_HINTS[ctx.type] || PAGE_HINTS.none;
  $('sp-https').textContent = ctx.signals?.isHTTPS ? 'Yes' : 'No';
  $('sp-passkey').textContent = ctx.signals?.passkeySupported ? 'Supported' : '—';

  // Domain intel (cached server-side; ~50ms typical)
  let intel = null;
  try {
    const reply = await chrome.runtime.sendMessage({ type: 'wrayth:get-domain-intel', host: ctx.host });
    intel = reply?.intel || null;
  } catch (_) {}

  // Reputation indicator — driven by intel when available, else heuristics
  let level = 'ok';
  if (intel?.level) level = intel.level === 'danger' ? 'warn' : intel.level; // map danger -> warn dot
  else if (!ctx.signals?.isHTTPS && ctx.type === 'login') level = 'warn';
  else if (ctx.type === 'mfa' || ctx.signals?.passkeySupported) level = 'info';
  $('sp-rep').dataset.level = level;
  if (intel?.headline) $('sp-pagehint').textContent = intel.headline;

  // Recommendation
  const rec = recommendFor(ctx, intel);
  $('sp-rec-body').textContent = rec.body;
  $('sp-rec-go').textContent = rec.cta;
  $('sp-rec-go').onclick = rec.action;
}


function recommendFor(ctx, intel) {
  if (intel && intel.level === 'danger') {
    return {
      body: intel.headline || 'This site shows phishing-style signals. I recommend leaving.',
      cta: 'Leave site',
      action: () => chrome.tabs.update({ url: 'about:blank' }),
    };
  }
  if (intel && intel.level === 'warn') {
    return {
      body: intel.headline || 'I have concerns about this site. Verify before entering credentials.',
      cta: 'Check this domain',
      action: () => openWrayth(`/app/watch?domain=${encodeURIComponent(ctx.host)}`),
    };
  }
  switch (ctx.type) {
    case 'login':
      return {
        body: ctx.signals?.passkeySupported
          ? `${ctx.host} supports passkeys. They're stronger than passwords.`
          : "I can fill credentials from your vault, or generate a stronger one if you're updating.",
        cta: ctx.signals?.passkeySupported ? 'Add a passkey' : 'Fill from vault',
        action: () => openWrayth(`/app/playbooks/${ctx.signals?.passkeySupported ? 'passkey-upgrade' : 'password-cleanup'}?site=${encodeURIComponent(ctx.host)}`),
      };
    case 'signup':
      return { body: 'Let me generate a strong password and save it to your vault.', cta: 'Generate password', action: () => sendToContent({ action: 'showAllPasswords' }) };
    case 'mfa':
      return { body: 'Need a TOTP code? I can read it from your vault.', cta: 'Open vault', action: () => chrome.action.openPopup?.() };
    case 'reset':
      return { body: 'This is a good time to set a unique, breach-free password.', cta: 'Run cleanup playbook', action: () => openWrayth('/app/playbooks/password-cleanup') };
    case 'payment':
      return { body: 'Double-check the URL. I won\'t autofill cards unless you ask.', cta: 'Check this domain', action: () => openWrayth(`/app/watch?domain=${encodeURIComponent(ctx.host)}`) };
    case 'security-settings':
      return { body: 'Perfect place to enable MFA and add passkeys. Want me to guide you?', cta: 'Open security playbook', action: () => openWrayth('/app/playbooks') };
    default:
      return { body: 'Quiet for now. Ask me anything about this site.', cta: 'Open Wrayth', action: () => openWrayth('/app/dashboard') };
  }
}


function openWrayth(path) {
  chrome.tabs.create({ url: `https://ultriumai.app${path}` });
}

function sendToContent(msg) {
  if (currentTabId == null) return;
  chrome.tabs.sendMessage(currentTabId, msg).catch(() => {});
}

async function refreshFromActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    currentTabId = tab.id;
    const ctx = await chrome.tabs.sendMessage(tab.id, { type: 'wrayth:get-context' }).catch(() => null);
    if (ctx) renderContext(ctx);
    else renderContext({ host: new URL(tab.url || 'about:blank').hostname, type: 'none', signals: { isHTTPS: (tab.url || '').startsWith('https:') } });
  } catch (e) {
    console.warn('Wrayth sidepanel refresh', e);
  }
}

// Tab clicks
document.querySelectorAll('.sp-tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));

// Listen for context broadcasts from any tab
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'wrayth:page-context' && sender?.tab?.id === currentTabId) {
    renderContext(msg.context);
  }
});

chrome.tabs.onActivated.addListener(() => refreshFromActiveTab());
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'complete' && tabId === currentTabId) refreshFromActiveTab();
});

// ---- Chat ----
const chatEl = $('sp-chat');
const inputEl = $('sp-input');
const composerEl = $('sp-composer');
const history = [];

function appendMsg(role, body, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = `sp-msg sp-msg-${role === 'user' ? 'user' : 'ray'}`;
  wrap.innerHTML = `<div class="sp-msg-name">${role === 'user' ? 'You' : 'Ray'}</div><div class="sp-msg-body${opts.thinking ? ' is-thinking' : ''}"></div>`;
  wrap.querySelector('.sp-msg-body').textContent = body;
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrap.querySelector('.sp-msg-body');
}

async function askRay(text) {
  if (!text.trim()) return;
  appendMsg('user', text);
  history.push({ role: 'user', content: text });
  const thinkingEl = appendMsg('ray', 'thinking…', { thinking: true });

  try {
    const reply = await chrome.runtime.sendMessage({
      type: 'wrayth:chat',
      messages: history,
      context: currentContext,
    });
    if (reply?.ok && reply.text) {
      thinkingEl.classList.remove('is-thinking');
      thinkingEl.textContent = reply.text;
      history.push({ role: 'assistant', content: reply.text });
    } else {
      thinkingEl.classList.remove('is-thinking');
      thinkingEl.textContent = reply?.error || "I couldn't reach the network. Open Wrayth to keep going.";
    }
  } catch (e) {
    thinkingEl.classList.remove('is-thinking');
    thinkingEl.textContent = "I'm offline right now. Try again in a moment.";
  }
}

composerEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = inputEl.value;
  inputEl.value = '';
  askRay(v);
});
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); composerEl.requestSubmit(); }
});

refreshFromActiveTab();
