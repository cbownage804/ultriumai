// Wrayth 4.1 — Concept Glossary (content script)
// Hover-to-explain any security term in plain English.
// Mirrors src/lib/ray/concepts.ts so the extension is self-contained.
(() => {
  if (window.__wraythConcepts) return;
  window.__wraythConcepts = true;

  const ENABLED_KEY = 'wrayth:concepts:enabled';
  let enabled = true;
  try { const v = localStorage.getItem(ENABLED_KEY); if (v === '0') enabled = false; } catch (_) {}

  const CONCEPTS = [
    { term: 'Passkeys', aliases: ['passkey', 'pass key'], short: "A passkey lets you sign in with your face, fingerprint, or device PIN instead of a password. It can't be phished or stolen.", why: 'Passkeys remove the #1 cause of account takeover — reused or stolen passwords.' },
    { term: 'Backup Codes', aliases: ['recovery codes', 'one-time codes'], short: 'One-time emergency codes that let you sign in if you lose your phone. Store them safely offline.', why: 'Without backup codes, losing your phone can lock you out permanently.' },
    { term: 'Security Keys', aliases: ['hardware key', 'yubikey', 'fido2'], short: "A small USB or NFC device that proves it's really you. Phishing-resistant even if your password leaks.", why: 'Security keys block every phishing kit currently used by attackers.' },
    { term: 'Authenticator App', aliases: ['totp', 'authenticator', 'google authenticator', 'authy'], short: 'An app on your phone that generates a 6-digit code every 30 seconds to confirm sign-ins.', why: 'Codes on your device are far safer than codes over SMS.' },
    { term: 'Two-Factor Authentication', aliases: ['2fa', 'two factor', 'two-step verification', 'mfa', 'multi-factor'], short: "A second check after your password — usually a code or tap — so a stolen password isn't enough.", why: 'MFA blocks more than 99% of automated account-takeover attacks.' },
    { term: 'Recovery Email', short: 'A backup email address used to regain access if you get locked out. Use an account you fully control.', why: 'A stale recovery email is a common back door for attackers.' },
    { term: 'Recovery Phone', short: "A backup phone number used if you can't sign in. Keep it current.", why: 'Recovery numbers are a common target for SIM-swap fraud — an authenticator app is safer.' },
    { term: 'OAuth', aliases: ['sign in with google', 'sign in with apple', 'sso'], short: "Sign into one site using another account you already have — the other site never sees your password.", why: 'Fewer passwords means fewer things attackers can steal.' },
    { term: 'Conditional Access', short: 'Rules that decide who can sign in, from where, and on which devices.', why: 'How organizations stop logins from countries or devices you would never use.' },
    { term: 'Device Encryption', aliases: ['bitlocker', 'filevault', 'disk encryption'], short: "Scrambles everything on your device so it can't be read if it's stolen.", why: 'Without encryption, anyone with your laptop can read your files.' },
    { term: 'Least Privilege', short: 'Giving each person or app only the access they actually need.', why: 'Limits the damage if any account ever gets compromised.' },
    { term: 'Administrator Role', aliases: ['admin role', 'global admin'], short: 'An account with the power to change settings for everyone. Use it sparingly.', why: 'Admin accounts are the #1 attacker target — one compromise affects everyone.' },
    { term: 'Legacy Authentication', short: "Older sign-in methods that don't support MFA. Best to turn off if you can.", why: 'Legacy protocols are how attackers bypass MFA.' },
    { term: 'SSH Keys', aliases: ['ssh key'], short: 'Cryptographic files that let you sign into servers without a password.', why: "Can't be phished or guessed like passwords can." },
    { term: 'Trusted Devices', short: "Devices an account remembers so it doesn't fully verify each time. Review the list.", why: 'An old trusted device is a quiet way for an attacker to keep access.' },
    { term: 'App Passwords', short: "Special one-off passwords for older apps that don't support modern sign-in.", why: 'App passwords skip MFA — old ones are a common security gap.' },
    { term: 'Connected Apps', aliases: ['third-party apps', 'app permissions'], short: 'Apps allowed to read or change parts of your account. Review and remove unused ones.', why: 'Forgotten connected apps are a frequent source of silent data leaks.' },
  ];

  // Build a single regex of all terms/aliases (longest first for greedy match)
  const termsList = [];
  for (const c of CONCEPTS) {
    termsList.push(c.term);
    if (c.aliases) for (const a of c.aliases) termsList.push(a);
  }
  termsList.sort((a, b) => b.length - a.length);
  const lookup = new Map();
  for (const c of CONCEPTS) {
    lookup.set(c.term.toLowerCase(), c);
    if (c.aliases) for (const a of c.aliases) lookup.set(a.toLowerCase(), c);
  }
  const escaped = termsList.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const termRegex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

  // Tooltip element (single, reused)
  let tip;
  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.className = 'wrayth-concept-tip';
    tip.setAttribute('role', 'tooltip');
    document.documentElement.appendChild(tip);
    return tip;
  }
  function teachOn() {
    try { return localStorage.getItem('wrayth:teach') === '1'; } catch (_) { return false; }
  }
  function showTip(target, concept) {
    const el = ensureTip();
    el.innerHTML = `
      <div class="wrayth-concept-tip-title">${concept.term}</div>
      <div class="wrayth-concept-tip-body">${concept.short}</div>
      ${teachOn() && concept.why ? `<div class="wrayth-concept-tip-why">Why it matters: ${concept.why}</div>` : ''}
      <div class="wrayth-concept-tip-foot">Ray · Wrayth</div>
    `;
    const r = target.getBoundingClientRect();
    const top = Math.min(window.innerHeight - 160, r.bottom + 6);
    const left = Math.max(8, Math.min(window.innerWidth - 320, r.left));
    el.style.top = `${top + window.scrollY}px`;
    el.style.left = `${left + window.scrollX}px`;
    el.dataset.open = '1';
  }
  function hideTip() {
    if (tip) tip.dataset.open = '0';
  }

  // Walk visible text nodes and wrap matches once
  const WALK_SKIP = new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','SELECT','NOSCRIPT','CODE','PRE']);
  const wrappedNodes = new WeakSet();
  function isProbablyVisible(el) {
    if (!el) return false;
    if (el.closest('.wrayth-cbar, .wrayth-panel, .wrayth-concept-tip')) return false;
    return true;
  }
  function scanRoot(root) {
    if (!enabled) return;
    if (!root || !root.ownerDocument) return;
    try {
      const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || node.nodeValue.length < 4) return NodeFilter.FILTER_REJECT;
          const p = node.parentNode;
          if (!p || WALK_SKIP.has(p.nodeName)) return NodeFilter.FILTER_REJECT;
          if (wrappedNodes.has(node)) return NodeFilter.FILTER_REJECT;
          if (!isProbablyVisible(p)) return NodeFilter.FILTER_REJECT;
          if (!termRegex.test(node.nodeValue)) { termRegex.lastIndex = 0; return NodeFilter.FILTER_REJECT; }
          termRegex.lastIndex = 0;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const toProcess = [];
      let n;
      let count = 0;
      while ((n = walker.nextNode()) && count < 80) { toProcess.push(n); count++; }
      toProcess.forEach(wrapMatches);
    } catch (_) {}
  }
  function wrapMatches(textNode) {
    if (wrappedNodes.has(textNode)) return;
    wrappedNodes.add(textNode);
    const text = textNode.nodeValue;
    termRegex.lastIndex = 0;
    let lastIdx = 0;
    let match;
    const frag = document.createDocumentFragment();
    let made = false;
    while ((match = termRegex.exec(text)) !== null) {
      const idx = match.index;
      if (idx > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, idx)));
      const span = document.createElement('span');
      span.className = 'wrayth-concept';
      span.dataset.concept = match[1].toLowerCase();
      span.textContent = match[1];
      frag.appendChild(span);
      lastIdx = idx + match[1].length;
      made = true;
    }
    if (!made) return;
    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    try { textNode.parentNode.replaceChild(frag, textNode); } catch (_) {}
  }

  // Hover delegation
  document.addEventListener('mouseover', (e) => {
    if (!enabled) return;
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (!t.classList.contains('wrayth-concept')) return;
    const concept = lookup.get(t.dataset.concept);
    if (concept) showTip(t, concept);
  }, true);
  document.addEventListener('mouseout', (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.classList.contains('wrayth-concept')) hideTip();
  }, true);
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement) || !t.classList.contains('wrayth-concept')) return;
    const concept = lookup.get(t.dataset.concept);
    if (concept) { e.preventDefault(); showTip(t, concept); }
  }, true);

  // Initial scan (idle) + mutation observer (debounced)
  function schedule() {
    (window.requestIdleCallback || setTimeout)(() => scanRoot(document.body), 0);
  }
  let mo;
  function start() {
    if (!document.body) return setTimeout(start, 200);
    schedule();
    let timer;
    mo = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(schedule, 800);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  start();

  // Allow toggling from popup/sidepanel via message
  chrome.runtime?.onMessage?.addListener?.((msg) => {
    if (msg?.type === 'wrayth:set-concepts') {
      enabled = !!msg.enabled;
      try { localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0'); } catch (_) {}
      if (!enabled) hideTip();
      else schedule();
    }
  });
})();
