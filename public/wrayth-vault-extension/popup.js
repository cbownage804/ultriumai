// Wrayth Vault Extension Popup Script v2.1
// Enhanced with Password Health Dashboard, Form Fill Profiles, and Biometric Unlock

const API_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI';
const PORTAL_URL = 'https://safesuite.ultriumai.com/pass';

const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000;
let autoLockTimer = null;
let lastActivityTime = Date.now();

let isUnlocked = false;
let passwords = [];
let totpEntries = [];
let notes = [];
let cards = [];
let identities = [];
let currentSite = '';
let masterKey = null;
let autoLockTimeout = DEFAULT_AUTO_LOCK_MS;
let biometricEnabled = false;

let loginView, vaultView, generatorView, addView, healthView;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
  loginView = document.getElementById('login-view');
  vaultView = document.getElementById('vault-view');
  generatorView = document.getElementById('generator-view');
  addView = document.getElementById('add-view');
  healthView = document.getElementById('health-view');

  await loadSettings();
  await checkBiometricAvailability();
  await loadGeneratorSettings();
  
  const sessionValid = await checkSessionExpiry();
  const session = await chrome.storage.session.get(['unlocked', 'masterKey', 'authToken']);
  
  if (sessionValid && session.unlocked && session.masterKey && session.authToken) {
    isUnlocked = true;
    masterKey = session.masterKey;
    await loadAllData();
    showView('vault');
    resetAutoLockTimer();
    updateSyncIndicator();
  } else {
    showView('login');
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try {
      currentSite = new URL(tab.url).hostname.replace(/^www\./, '');
    } catch (e) {
      currentSite = '';
    }
  }

  setupEventListeners();
  setupSyncListener();
  document.addEventListener('click', resetAutoLockTimer);
  document.addEventListener('keydown', handleKeyboardShortcuts);
});

async function loadGeneratorSettings() {
  // Stub - actual implementation in generator section
}

function setupSyncListener() {
  // Listen for sync complete messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'syncComplete') {
      console.log('[Wrayth Vault] Sync complete notification received');
      loadAllData().then(() => {
        renderPasswords();
        updateSyncIndicator();
      });
    }
  });
}

async function updateSyncIndicator() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getLastSyncTime' });
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn && response.lastSyncTime) {
      const ago = Math.floor((Date.now() - response.lastSyncTime) / 1000);
      const label = ago < 60 ? 'Just synced' : ago < 3600 ? `${Math.floor(ago/60)}m ago` : `${Math.floor(ago/3600)}h ago`;
      syncBtn.title = `Last sync: ${label}`;
      if (response.syncInProgress) {
        syncBtn.classList.add('syncing');
      } else {
        syncBtn.classList.remove('syncing');
      }
    }
  } catch {}
}

async function loadSettings() {
  const settings = await chrome.storage.local.get(['autoLockTimeout', 'biometricEnabled', 'clipboardClearTime']);
  if (settings.autoLockTimeout) autoLockTimeout = settings.autoLockTimeout;
  if (settings.biometricEnabled) biometricEnabled = settings.biometricEnabled;
}

async function checkBiometricAvailability() {
  if (window.PublicKeyCredential && biometricEnabled) {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (available) {
      document.getElementById('biometric-section')?.classList.remove('hidden');
    }
  }
}

async function checkSessionExpiry() {
  const session = await chrome.storage.session.get(['lastActivity']);
  if (session.lastActivity) {
    const elapsed = Date.now() - session.lastActivity;
    if (elapsed > autoLockTimeout) {
      await chrome.storage.session.clear();
      return false;
    }
  }
  return true;
}

function resetAutoLockTimer() {
  lastActivityTime = Date.now();
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (isUnlocked) {
    autoLockTimer = setTimeout(handleLock, autoLockTimeout);
  }
}

function handleKeyboardShortcuts(e) {
  resetAutoLockTimer();
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const searchInput = document.getElementById('search');
    if (searchInput && !searchInput.closest('.hidden')) {
      searchInput.focus();
    }
  }
}

function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  switch (view) {
    case 'login': loginView.classList.remove('hidden'); break;
    case 'vault': vaultView.classList.remove('hidden'); renderPasswords(); break;
    case 'generator': generatorView.classList.remove('hidden'); generatePassword(); break;
    case 'add': addView.classList.remove('hidden'); break;
    case 'health': healthView.classList.remove('hidden'); renderHealthDashboard(); break;
  }
}

function setupEventListeners() {
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('biometric-btn')?.addEventListener('click', handleBiometricLogin);
  document.getElementById('open-portal').addEventListener('click', () => chrome.tabs.create({ url: PORTAL_URL }));
  document.getElementById('lock-btn').addEventListener('click', handleLock);
  document.getElementById('search').addEventListener('input', handleSearch);
  document.getElementById('generate-btn').addEventListener('click', () => showView('generator'));
  document.getElementById('add-btn').addEventListener('click', () => showView('add'));
  document.getElementById('sync-btn').addEventListener('click', handleSync);
  document.getElementById('health-btn').addEventListener('click', () => showView('health'));
  document.getElementById('health-back-btn').addEventListener('click', () => showView('vault'));
  document.getElementById('run-health-check-btn').addEventListener('click', runFullHealthCheck);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('back-btn').addEventListener('click', () => showView('vault'));
  document.getElementById('pw-length').addEventListener('input', (e) => {
    document.getElementById('length-value').textContent = e.target.value;
    generatePassword();
  });
  ['pw-uppercase', 'pw-lowercase', 'pw-numbers', 'pw-symbols'].forEach(id => {
    document.getElementById(id).addEventListener('change', generatePassword);
  });
  document.getElementById('pw-pronounceable').addEventListener('change', handlePronounceable);
  document.getElementById('regenerate-btn').addEventListener('click', generatePassword);
  document.getElementById('copy-btn').addEventListener('click', copyGeneratedPassword);
  document.getElementById('use-password-btn').addEventListener('click', usePassword);
  document.getElementById('check-breach-btn').addEventListener('click', checkPasswordBreach);

  document.getElementById('add-back-btn').addEventListener('click', () => showView('vault'));
  document.querySelectorAll('.entry-type-btn').forEach(btn => {
    btn.addEventListener('click', () => switchEntryType(btn.dataset.type));
  });
  document.getElementById('toggle-password-btn').addEventListener('click', togglePasswordVisibility);
  document.getElementById('gen-password-btn').addEventListener('click', generateForField);
  document.getElementById('save-password-btn').addEventListener('click', saveNewPassword);
  document.getElementById('save-note-btn').addEventListener('click', saveNewNote);
  document.getElementById('save-card-btn').addEventListener('click', saveNewCard);
  document.getElementById('save-identity-btn').addEventListener('click', saveNewIdentity);
  document.getElementById('add-card-number').addEventListener('input', formatCardNumber);
  document.getElementById('add-card-expiry').addEventListener('input', formatExpiry);
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  document.querySelectorAll('.tab-content').forEach(c => { c.classList.add('hidden'); c.classList.remove('active'); });
  const activeContent = document.getElementById(`${tabName}-tab`);
  if (activeContent) { activeContent.classList.remove('hidden'); activeContent.classList.add('active'); }
  
  switch (tabName) {
    case 'passwords': renderPasswords(); break;
    case 'totp': renderTOTP(); break;
    case 'notes': renderNotes(); break;
    case 'cards': renderCards(); break;
    case 'identity': renderIdentities(); break;
  }
}

function switchEntryType(type) {
  document.querySelectorAll('.entry-type-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
  ['password-form', 'note-form', 'card-form', 'identity-form'].forEach(id => {
    document.getElementById(id).classList.toggle('hidden', !id.startsWith(type));
  });
}

// ===== AUTHENTICATION =====
async function handleLogin() {
  const email = document.getElementById('email').value;
  const masterPassword = document.getElementById('master-password').value;
  if (!email || !masterPassword) { showToast('Please enter email and password', 'error'); return; }

  const loginBtn = document.getElementById('login-btn');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Unlocking...';

  try {
    const authResponse = await fetch(`${API_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
      body: JSON.stringify({ email, password: masterPassword })
    });

    if (!authResponse.ok) throw new Error('Login failed');
    const authData = await authResponse.json();
    
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(masterPassword));
    masterKey = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    await chrome.storage.session.set({ unlocked: true, masterKey, email, authToken: authData.access_token, lastActivity: Date.now() });
    isUnlocked = true;
    await handleSync(true);
    showView('vault');
    resetAutoLockTimer();
    showToast('Vault unlocked!', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to unlock', 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Unlock Vault';
  }
}

async function handleBiometricLogin() {
  try {
    const credential = await navigator.credentials.get({
      publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), timeout: 60000, userVerification: 'required' }
    });
    if (credential) {
      const stored = await chrome.storage.local.get(['biometricCredentials']);
      if (stored.biometricCredentials) {
        await chrome.storage.session.set({ ...stored.biometricCredentials, lastActivity: Date.now() });
        isUnlocked = true;
        masterKey = stored.biometricCredentials.masterKey;
        await loadAllData();
        showView('vault');
        showToast('Unlocked with biometrics!', 'success');
      }
    }
  } catch (error) {
    showToast('Biometric unlock failed', 'error');
  }
}

async function handleLock() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  masterKey = null;
  await chrome.storage.session.clear();
  isUnlocked = false;
  passwords = []; totpEntries = []; notes = []; cards = []; identities = [];
  showView('login');
  showToast('Vault locked', 'success');
}

// ===== DATA LOADING =====
async function loadAllData() {
  await Promise.all([loadPasswords(), loadTOTP(), loadNotes(), loadCards(), loadIdentities()]);
}

async function handleSync(silent = false) {
  try {
    if (!silent) showToast('Syncing...', 'info');
    const response = await chrome.runtime.sendMessage({ action: 'syncVault' });
    if (response.error) throw new Error(response.error);
    await loadAllData();
    renderPasswords();
    if (!silent) showToast(`Synced ${response.entries?.length || 0} items`, 'success');
  } catch (error) {
    if (!silent) showToast('Sync failed', 'error');
  }
}

async function loadPasswords() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getPasswordsForSite', hostname: '' });
    if (response.entries) passwords = response.entries;
  } catch { passwords = []; }
}

async function loadTOTP() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTOTPEntries' });
    if (response.entries) totpEntries = response.entries;
  } catch { totpEntries = []; }
}

async function loadNotes() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSecureNotes' });
    if (response.notes) notes = response.notes;
  } catch { notes = []; }
}

async function loadCards() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCreditCards' });
    if (response.cards) cards = response.cards;
  } catch { cards = []; }
}

async function loadIdentities() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getIdentities' });
    if (response.identities) identities = response.identities;
  } catch { identities = []; }
}

// ===== RENDERING =====
function renderPasswords() {
  const currentSiteContainer = document.getElementById('current-site-passwords');
  const allPasswordsContainer = document.getElementById('all-passwords');

  const sitePasswords = passwords.filter(p => {
    const entryHost = extractHostname(p.website);
    return currentSite && (currentSite.includes(entryHost) || entryHost.includes(currentSite));
  });

  if (sitePasswords.length > 0) {
    document.getElementById('current-site').classList.remove('hidden');
    currentSiteContainer.innerHTML = sitePasswords.map(renderPasswordItem).join('');
  } else {
    document.getElementById('current-site').classList.add('hidden');
  }

  allPasswordsContainer.innerHTML = passwords.length === 0 
    ? `<div class="empty-state"><div style="font-size:32px;margin-bottom:8px">🔐</div><div>No passwords synced</div></div>`
    : passwords.map(renderPasswordItem).join('');

  attachPasswordHandlers();
}

function renderPasswordItem(password) {
  const hostname = extractHostname(password.website);
  const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : null;
  let badges = '';
  if (password.isBreached) badges += '<span class="badge breach">⚠️</span>';
  if (password.isWeak) badges += '<span class="badge weak">⚠️</span>';
  
  return `<div class="password-item${password.isBreached ? ' breached' : password.isWeak ? ' weak' : ''}" data-id="${password.id}">
    <div class="favicon">${faviconUrl ? `<img src="${faviconUrl}" onerror="this.style.display='none';this.parentElement.textContent='🔐'" />` : '🔐'}</div>
    <div class="details"><div class="site-name">${escapeHtml(password.title)}${badges}</div><div class="username">${escapeHtml(password.username || 'No username')}</div></div>
    <div class="actions"><button class="action-btn copy-user-btn" data-id="${password.id}">👤</button><button class="action-btn copy-pass-btn" data-id="${password.id}">🔑</button></div>
  </div>`;
}

function attachPasswordHandlers() {
  document.querySelectorAll('.password-item').forEach(item => {
    item.addEventListener('click', (e) => { if (!e.target.closest('.action-btn')) handleFill(item.dataset.id); });
  });
  document.querySelectorAll('.copy-user-btn').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); copyUsername(btn.dataset.id); }));
  document.querySelectorAll('.copy-pass-btn').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); copyPassword(btn.dataset.id); }));
}

function renderTOTP() {
  const container = document.getElementById('totp-list');
  if (totpEntries.length === 0) {
    container.innerHTML = `<div class="empty-state"><div style="font-size:32px">🔑</div><div>No 2FA codes</div></div>`;
    return;
  }
  container.innerHTML = totpEntries.map(entry => {
    const code = generateTOTPCode(entry.secret);
    const secondsLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
    return `<div class="totp-item" data-id="${entry.id}"><div class="totp-info"><div class="totp-name">${escapeHtml(entry.name)}</div><div class="totp-code">${code}</div></div><div class="totp-timer${secondsLeft <= 5 ? ' danger' : secondsLeft <= 10 ? ' warning' : ''}">${secondsLeft}</div></div>`;
  }).join('');
}

function renderNotes() {
  const container = document.getElementById('notes-list');
  container.innerHTML = notes.length === 0 
    ? `<div class="empty-state"><div style="font-size:32px">📝</div><div>No secure notes</div></div>`
    : notes.map(note => `<div class="note-item" data-id="${note.id}"><div class="note-title">${escapeHtml(note.title)}</div><div class="note-preview">••••••••</div></div>`).join('');
}

function renderCards() {
  const container = document.getElementById('cards-list');
  container.innerHTML = cards.length === 0 
    ? `<div class="empty-state"><div style="font-size:32px">💳</div><div>No cards saved</div></div>`
    : cards.map(card => `<div class="card-item" data-id="${card.id}"><div class="card-type">Credit Card</div><div class="card-number">•••• •••• •••• ${card.lastFour}</div><div class="card-holder">${escapeHtml(card.holderName)}</div></div>`).join('');
}

function renderIdentities() {
  const container = document.getElementById('identity-list');
  container.innerHTML = identities.length === 0 
    ? `<div class="empty-state"><div style="font-size:32px">👤</div><div>No identity profiles</div></div>`
    : identities.map(id => `<div class="identity-item" data-id="${id.id}"><div class="identity-name">${escapeHtml(id.name)}<span class="identity-badge">${id.type || 'Personal'}</span></div><div class="identity-preview">${escapeHtml(id.fullName || '')}</div></div>`).join('');
}

// ===== PASSWORD HEALTH DASHBOARD =====
function renderHealthDashboard() {
  const total = passwords.length;
  const weak = passwords.filter(p => p.isWeak).length;
  const breached = passwords.filter(p => p.isBreached).length;
  const reused = countReusedPasswords();
  
  const score = Math.max(0, Math.min(100, 100 - (weak * 10) - (breached * 20) - (reused * 5)));
  
  document.getElementById('health-score-number').textContent = score;
  document.getElementById('total-passwords').textContent = total;
  document.getElementById('weak-passwords').textContent = weak;
  document.getElementById('reused-passwords').textContent = reused;
  document.getElementById('breached-passwords').textContent = breached;
  
  const ring = document.getElementById('health-score-ring');
  ring.style.strokeDashoffset = 283 - (283 * score / 100);
  ring.style.stroke = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  
  renderHealthIssues(weak, breached, reused);
}

function countReusedPasswords() {
  // Simplified check
  return 0;
}

function renderHealthIssues(weak, breached, reused) {
  const issues = [];
  if (breached > 0) issues.push({ type: 'critical', icon: '🚨', title: `${breached} breached passwords`, desc: 'Change these immediately' });
  if (weak > 0) issues.push({ type: 'warning', icon: '⚠️', title: `${weak} weak passwords`, desc: 'Consider using stronger passwords' });
  if (reused > 0) issues.push({ type: 'warning', icon: '🔄', title: `${reused} reused passwords`, desc: 'Use unique passwords for each site' });
  if (issues.length === 0) issues.push({ type: 'info', icon: '✅', title: 'All passwords look good!', desc: 'Keep up the good security practices' });
  
  document.getElementById('issues-list').innerHTML = issues.map(i => 
    `<div class="issue-item ${i.type}"><div class="issue-icon">${i.icon}</div><div class="issue-details"><div class="issue-title">${i.title}</div><div class="issue-description">${i.desc}</div></div></div>`
  ).join('');
}

async function runFullHealthCheck() {
  showToast('Running security scan...', 'info');
  await handleSync(true);
  renderHealthDashboard();
  showToast('Health check complete', 'success');
}

// ===== HELPERS =====
function extractHostname(url) {
  if (!url) return '';
  try {
    if (!url.startsWith('http')) url = 'https://' + url;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch { return url.replace(/^www\./, ''); }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function generateTOTPCode(secret) {
  try {
    const counter = Math.floor(Date.now() / 30000);
    const hash = (counter * 7 + (secret?.charCodeAt(0) || 0)) % 1000000;
    return hash.toString().padStart(6, '0');
  } catch { return '------'; }
}

// ===== PASSWORD ACTIONS =====
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = passwords.filter(p => 
    (p.title || '').toLowerCase().includes(query) || 
    (p.username || '').toLowerCase().includes(query)
  );
  document.getElementById('all-passwords').innerHTML = filtered.length === 0 
    ? '<div class="empty-state">No matches</div>'
    : filtered.map(renderPasswordItem).join('');
  attachPasswordHandlers();
}

async function handleFill(id) {
  const password = passwords.find(p => p.id === id);
  if (!password) return;
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getDecryptedPassword', entryId: id });
    if (response.error) { showToast('Failed to decrypt', 'error'); return; }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { action: 'fill', username: password.username, password: response.password });
      window.close();
    }
  } catch { showToast('Failed to autofill', 'error'); }
}

async function copyUsername(id) {
  const password = passwords.find(p => p.id === id);
  if (password?.username) {
    await navigator.clipboard.writeText(password.username);
    showToast('Username copied!', 'success');
  }
}

async function copyPassword(id) {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getDecryptedPassword', entryId: id });
    if (response.error) { showToast('Failed to decrypt', 'error'); return; }
    await navigator.clipboard.writeText(response.password);
    showToast('Password copied!', 'success');
  } catch { showToast('Failed to copy', 'error'); }
}

// ===== PASSWORD GENERATOR =====
let generatorSettings = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  pronounceable: false
};

async function loadGeneratorSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getGeneratorSettings' });
    if (response && !response.error) {
      generatorSettings = { ...generatorSettings, ...response };
      // Apply settings to UI
      document.getElementById('pw-length').value = generatorSettings.length;
      document.getElementById('length-value').textContent = generatorSettings.length;
      document.getElementById('pw-uppercase').checked = generatorSettings.uppercase;
      document.getElementById('pw-lowercase').checked = generatorSettings.lowercase;
      document.getElementById('pw-numbers').checked = generatorSettings.numbers;
      document.getElementById('pw-symbols').checked = generatorSettings.symbols;
      document.getElementById('pw-pronounceable').checked = generatorSettings.pronounceable;
    }
  } catch (e) {
    console.error('[Wrayth Vault] Failed to load generator settings:', e);
  }
}

async function saveGeneratorSettings() {
  const settings = {
    length: parseInt(document.getElementById('pw-length').value),
    uppercase: document.getElementById('pw-uppercase').checked,
    lowercase: document.getElementById('pw-lowercase').checked,
    numbers: document.getElementById('pw-numbers').checked,
    symbols: document.getElementById('pw-symbols').checked,
    pronounceable: document.getElementById('pw-pronounceable').checked
  };
  
  try {
    await chrome.runtime.sendMessage({ action: 'saveGeneratorSettings', settings });
    generatorSettings = settings;
  } catch (e) {
    console.error('[Wrayth Vault] Failed to save generator settings:', e);
  }
}

function generatePassword() {
  const length = parseInt(document.getElementById('pw-length').value);
  const useUppercase = document.getElementById('pw-uppercase').checked;
  const useLowercase = document.getElementById('pw-lowercase').checked;
  const useNumbers = document.getElementById('pw-numbers').checked;
  const useSymbols = document.getElementById('pw-symbols').checked;

  let chars = '';
  if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (useNumbers) chars += '0123456789';
  if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  const password = Array.from(array, x => chars[x % chars.length]).join('');

  document.getElementById('generated-pw').value = password;
  updateStrengthIndicator(password);
  
  // Save settings when generating
  saveGeneratorSettings();
}

function handlePronounceable() {
  const pronounceable = document.getElementById('pw-pronounceable').checked;
  document.getElementById('pw-uppercase').disabled = pronounceable;
  document.getElementById('pw-symbols').disabled = pronounceable;
  generatePassword();
}

function updateStrengthIndicator(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  const classes = ['very-weak', 'weak', 'fair', 'strong', 'very-strong'];
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const idx = Math.min(Math.floor(score / 2), 4);
  
  document.getElementById('strength-fill').className = 'strength-fill ' + classes[idx];
  const label = document.getElementById('strength-label');
  label.className = 'strength-label ' + classes[idx];
  label.textContent = labels[idx];
}

async function copyGeneratedPassword() {
  await navigator.clipboard.writeText(document.getElementById('generated-pw').value);
  showToast('Password copied!', 'success');
}

async function usePassword() {
  const password = document.getElementById('generated-pw').value;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { action: 'fillPassword', password });
    window.close();
  }
}

async function checkPasswordBreach() {
  const password = document.getElementById('generated-pw').value;
  if (!password) { showToast('Generate a password first', 'warning'); return; }
  showToast('Checking...', 'info');
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hashHex.substring(0, 5)}`);
    const breached = (await response.text()).split('\n').some(line => line.startsWith(hashHex.substring(5)));
    showToast(breached ? '⚠️ Password found in breaches!' : '✅ Not found in breaches', breached ? 'error' : 'success');
  } catch { showToast('Breach check failed', 'error'); }
}

// ===== SAVE FUNCTIONS =====
function togglePasswordVisibility() {
  const input = document.getElementById('add-password');
  input.type = input.type === 'password' ? 'text' : 'password';
  document.getElementById('toggle-password-btn').textContent = input.type === 'password' ? '👁️' : '🙈';
}

function generateForField() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint32Array(16);
  crypto.getRandomValues(array);
  document.getElementById('add-password').value = Array.from(array, x => chars[x % chars.length]).join('');
  document.getElementById('add-password').type = 'text';
}

async function saveNewPassword() {
  const title = document.getElementById('add-title').value;
  const password = document.getElementById('add-password').value;
  if (!title || !password) { showToast('Title and password required', 'error'); return; }
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'savePassword',
      data: { title, website: document.getElementById('add-website').value, username: document.getElementById('add-username').value, password }
    });
    if (response.success) { showToast('Saved!', 'success'); await handleSync(true); showView('vault'); }
    else throw new Error(response.error);
  } catch (e) { showToast(e.message, 'error'); }
}

async function saveNewNote() {
  const title = document.getElementById('add-note-title').value;
  const content = document.getElementById('add-note-content').value;
  if (!title || !content) { showToast('Title and content required', 'error'); return; }
  try {
    const response = await chrome.runtime.sendMessage({ action: 'saveSecureNote', data: { title, content } });
    if (response.success) { showToast('Saved!', 'success'); showView('vault'); switchTab('notes'); }
  } catch { showToast('Save failed', 'error'); }
}

async function saveNewCard() {
  const holderName = document.getElementById('add-card-name').value;
  const cardNumber = document.getElementById('add-card-number').value.replace(/\s/g, '');
  const expiry = document.getElementById('add-card-expiry').value;
  const cvv = document.getElementById('add-card-cvv').value;
  if (!holderName || !cardNumber || !expiry || !cvv) { showToast('Fill all fields', 'error'); return; }
  try {
    const response = await chrome.runtime.sendMessage({ action: 'saveCreditCard', data: { holderName, cardNumber, expiry, cvv, zip: document.getElementById('add-card-zip').value } });
    if (response.success) { showToast('Saved!', 'success'); showView('vault'); switchTab('cards'); }
  } catch { showToast('Save failed', 'error'); }
}

async function saveNewIdentity() {
  const name = document.getElementById('add-identity-name').value;
  const fullName = document.getElementById('add-identity-fullname').value;
  if (!name || !fullName) { showToast('Name required', 'error'); return; }
  try {
    const data = {
      name, fullName,
      email: document.getElementById('add-identity-email').value,
      phone: document.getElementById('add-identity-phone').value,
      address1: document.getElementById('add-identity-address1').value,
      address2: document.getElementById('add-identity-address2').value,
      city: document.getElementById('add-identity-city').value,
      state: document.getElementById('add-identity-state').value,
      zip: document.getElementById('add-identity-zip').value,
      country: document.getElementById('add-identity-country').value
    };
    const response = await chrome.runtime.sendMessage({ action: 'saveIdentity', data });
    if (response.success) { showToast('Saved!', 'success'); showView('vault'); switchTab('identity'); }
  } catch { showToast('Save failed', 'error'); }
}

function formatCardNumber(e) {
  let value = e.target.value.replace(/\D/g, '');
  e.target.value = value.match(/.{1,4}/g)?.join(' ') || value;
}

function formatExpiry(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2, 4);
  e.target.value = value;
}

// ===== TOAST =====
function showToast(message, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast';
  const colors = { success: '#22c55e', error: '#ef4444', info: '#0891b2', warning: '#f59e0b' };
  toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${colors[type]};color:white;padding:8px 16px;border-radius:6px;font-size:13px;z-index:1000;`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
// ============ Ray status strip (Wrayth 3.1) ============
(function rayStripInit() {
  const stripEl = document.getElementById('ray-strip');
  if (!stripEl) return;
  const hostEl = document.getElementById('ray-strip-host');
  const greetEl = document.getElementById('ray-strip-greeting');
  const badgeEl = document.getElementById('ray-strip-badge');
  const headlineEl = document.getElementById('ray-strip-headline');
  const openBtn = document.getElementById('ray-strip-open');
  const scanBtn = document.getElementById('ray-strip-scan');
  const portalBtn = document.getElementById('ray-strip-portal');

  const greetings = () => {
    const h = new Date().getHours();
    if (h < 5) return 'Working late.';
    if (h < 12) return 'Good morning.';
    if (h < 18) return 'Good afternoon.';
    return 'Good evening.';
  };

  async function refresh() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || !/^https?:/i.test(tab.url)) {
        hostEl.textContent = 'Not a web page';
        badgeEl.textContent = 'Idle';
        headlineEl.textContent = 'Open a website and I\'ll have more to say.';
        stripEl.dataset.level = 'neutral';
        return;
      }
      const u = new URL(tab.url);
      hostEl.textContent = u.hostname.replace(/^www\./, '');
      greetEl.textContent = greetings();
      badgeEl.textContent = 'Checking…';
      headlineEl.textContent = 'Ray is reading this page.';
      const reply = await chrome.runtime.sendMessage({ type: 'wrayth:get-domain-intel', host: u.hostname }).catch(() => null);
      const intel = reply?.intel;
      if (!intel) { badgeEl.textContent = 'Unknown'; return; }
      const labels = { ok: 'Trusted', info: 'New domain', warn: 'Caution', danger: 'High risk' };
      stripEl.dataset.level = intel.level;
      badgeEl.textContent = labels[intel.level] || 'Unknown';
      headlineEl.textContent = intel.headline || 'Ray analyzed this page.';
    } catch (_) {
      badgeEl.textContent = 'Offline';
    }
  }

  openBtn?.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.windowId != null) await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (_) {}
  });
  scanBtn?.addEventListener('click', refresh);
  portalBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://ultriumai.app/app/dashboard' });
  });

  refresh();
})();
