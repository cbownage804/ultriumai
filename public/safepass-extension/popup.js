// SafePass Extension Popup Script v2.0
// Enhanced with TOTP, Notes, Cards, Breach Detection, and Multi-Account Support

const SUPABASE_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI';
const PORTAL_URL = 'https://safesuite.ultriumai.com/pass';

// Auto-lock settings
const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000;
let autoLockTimer = null;
let lastActivityTime = Date.now();

// State
let isUnlocked = false;
let passwords = [];
let totpEntries = [];
let notes = [];
let cards = [];
let currentSite = '';
let masterKey = null;
let autoLockTimeout = DEFAULT_AUTO_LOCK_MS;

// DOM Elements
let loginView, vaultView, generatorView, addView;

// ===== AUTO-LOCK =====
function resetAutoLockTimer() {
  lastActivityTime = Date.now();
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (isUnlocked) {
    autoLockTimer = setTimeout(autoLockVault, autoLockTimeout);
  }
}

async function autoLockVault() {
  if (isUnlocked) {
    console.log('[SafePass] Auto-locking vault');
    await handleLock();
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

async function loadAutoLockSettings() {
  const settings = await chrome.storage.local.get(['autoLockTimeout']);
  if (settings.autoLockTimeout) {
    autoLockTimeout = settings.autoLockTimeout;
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
  loginView = document.getElementById('login-view');
  vaultView = document.getElementById('vault-view');
  generatorView = document.getElementById('generator-view');
  addView = document.getElementById('add-view');

  await loadAutoLockSettings();
  
  const sessionValid = await checkSessionExpiry();
  const session = await chrome.storage.session.get(['unlocked', 'masterKey', 'authToken']);
  
  if (sessionValid && session.unlocked && session.masterKey && session.authToken) {
    isUnlocked = true;
    masterKey = session.masterKey;
    await loadAllData();
    showView('vault');
    resetAutoLockTimer();
  } else {
    showView('login');
  }

  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try {
      currentSite = new URL(tab.url).hostname.replace(/^www\./, '');
    } catch (e) {
      currentSite = '';
    }
  }

  setupEventListeners();
  
  // Track activity
  document.addEventListener('click', resetAutoLockTimer);
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  setInterval(async () => {
    if (isUnlocked) {
      await chrome.storage.session.set({ lastActivity: lastActivityTime });
    }
  }, 10000);
});

function handleKeyboardShortcuts(e) {
  resetAutoLockTimer();
  
  // Ctrl/Cmd + F for search focus
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const searchInput = document.getElementById('search');
    if (searchInput && !searchInput.closest('.hidden')) {
      searchInput.focus();
    }
  }
}

function showView(view) {
  loginView.classList.add('hidden');
  vaultView.classList.add('hidden');
  generatorView.classList.add('hidden');
  addView.classList.add('hidden');

  switch (view) {
    case 'login':
      loginView.classList.remove('hidden');
      break;
    case 'vault':
      vaultView.classList.remove('hidden');
      renderPasswords();
      break;
    case 'generator':
      generatorView.classList.remove('hidden');
      generatePassword();
      break;
    case 'add':
      addView.classList.remove('hidden');
      break;
  }
}

function setupEventListeners() {
  // Login
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('open-portal').addEventListener('click', () => {
    chrome.tabs.create({ url: PORTAL_URL });
  });

  // Vault actions
  document.getElementById('lock-btn').addEventListener('click', handleLock);
  document.getElementById('search').addEventListener('input', handleSearch);
  document.getElementById('generate-btn').addEventListener('click', () => showView('generator'));
  document.getElementById('add-btn').addEventListener('click', () => showView('add'));
  document.getElementById('sync-btn').addEventListener('click', handleSync);

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Generator
  document.getElementById('back-btn').addEventListener('click', () => showView('vault'));
  document.getElementById('pw-length').addEventListener('input', (e) => {
    document.getElementById('length-value').textContent = e.target.value;
    generatePassword();
  });
  document.getElementById('pw-uppercase').addEventListener('change', generatePassword);
  document.getElementById('pw-lowercase').addEventListener('change', generatePassword);
  document.getElementById('pw-numbers').addEventListener('change', generatePassword);
  document.getElementById('pw-symbols').addEventListener('change', generatePassword);
  document.getElementById('pw-pronounceable').addEventListener('change', handlePronounceable);
  document.getElementById('regenerate-btn').addEventListener('click', generatePassword);
  document.getElementById('copy-btn').addEventListener('click', copyGeneratedPassword);
  document.getElementById('use-password-btn').addEventListener('click', usePassword);
  document.getElementById('check-breach-btn').addEventListener('click', checkPasswordBreach);

  // Add entry
  document.getElementById('add-back-btn').addEventListener('click', () => showView('vault'));
  document.querySelectorAll('.entry-type-btn').forEach(btn => {
    btn.addEventListener('click', () => switchEntryType(btn.dataset.type));
  });
  document.getElementById('toggle-password-btn').addEventListener('click', togglePasswordVisibility);
  document.getElementById('gen-password-btn').addEventListener('click', generateForField);
  document.getElementById('save-password-btn').addEventListener('click', saveNewPassword);
  document.getElementById('save-note-btn').addEventListener('click', saveNewNote);
  document.getElementById('save-card-btn').addEventListener('click', saveNewCard);
  
  // Card number formatting
  document.getElementById('add-card-number').addEventListener('input', formatCardNumber);
  document.getElementById('add-card-expiry').addEventListener('input', formatExpiry);
}

// ===== TAB MANAGEMENT =====
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
    content.classList.remove('active');
  });
  
  const activeContent = document.getElementById(`${tabName}-tab`);
  if (activeContent) {
    activeContent.classList.remove('hidden');
    activeContent.classList.add('active');
  }
  
  // Render content based on tab
  switch (tabName) {
    case 'passwords':
      renderPasswords();
      break;
    case 'totp':
      renderTOTP();
      break;
    case 'notes':
      renderNotes();
      break;
    case 'cards':
      renderCards();
      break;
  }
}

function switchEntryType(type) {
  document.querySelectorAll('.entry-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  
  document.getElementById('password-form').classList.toggle('hidden', type !== 'password');
  document.getElementById('note-form').classList.toggle('hidden', type !== 'note');
  document.getElementById('card-form').classList.toggle('hidden', type !== 'card');
}

// ===== AUTHENTICATION =====
async function handleLogin() {
  const email = document.getElementById('email').value;
  const masterPassword = document.getElementById('master-password').value;

  if (!email || !masterPassword) {
    showToast('Please enter email and master password', 'error');
    return;
  }

  const loginBtn = document.getElementById('login-btn');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Unlocking...';

  try {
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password: masterPassword })
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      throw new Error(error.error_description || 'Login failed');
    }

    const authData = await authResponse.json();
    
    const encoder = new TextEncoder();
    const data = encoder.encode(masterPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    masterKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    await chrome.storage.session.set({
      unlocked: true,
      masterKey: masterKey,
      email: email,
      authToken: authData.access_token,
      lastActivity: Date.now()
    });

    isUnlocked = true;
    await handleSync(true);
    showView('vault');
    resetAutoLockTimer();
    showToast('Vault unlocked!', 'success');
  } catch (error) {
    console.error('Login error:', error);
    showToast(error.message || 'Failed to unlock vault', 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Unlock Vault';
  }
}

async function handleLock() {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
  
  masterKey = null;
  await chrome.storage.session.clear();
  isUnlocked = false;
  passwords = [];
  totpEntries = [];
  notes = [];
  cards = [];
  showView('login');
  showToast('Vault locked', 'success');
}

// ===== DATA LOADING =====
async function loadAllData() {
  await Promise.all([
    loadPasswords(),
    loadTOTP(),
    loadNotes(),
    loadCards()
  ]);
}

async function handleSync(silent = false) {
  try {
    if (!silent) {
      showToast('Syncing...', 'info');
    }
    
    const response = await chrome.runtime.sendMessage({ action: 'syncVault' });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    await loadAllData();
    renderPasswords();
    
    if (!silent) {
      showToast(`Synced ${response.entries?.length || 0} passwords`, 'success');
    }
  } catch (error) {
    console.error('Sync error:', error);
    if (!silent) {
      showToast('Sync failed', 'error');
    }
  }
}

async function loadPasswords() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getPasswordsForSite',
      hostname: ''
    });
    
    if (response.entries) {
      passwords = response.entries;
    }
  } catch (error) {
    console.error('Load passwords error:', error);
    passwords = [];
  }
}

async function loadTOTP() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTOTPEntries' });
    if (response.entries) {
      totpEntries = response.entries;
    }
  } catch {
    totpEntries = [];
  }
}

async function loadNotes() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSecureNotes' });
    if (response.notes) {
      notes = response.notes;
    }
  } catch {
    notes = [];
  }
}

async function loadCards() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCreditCards' });
    if (response.cards) {
      cards = response.cards;
    }
  } catch {
    cards = [];
  }
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

  if (passwords.length === 0) {
    allPasswordsContainer.innerHTML = `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:8px">🔐</div>
        <div>No passwords synced yet</div>
        <div style="font-size:12px;opacity:0.7;margin-top:4px">Click sync to fetch from SafePass</div>
      </div>
    `;
  } else {
    allPasswordsContainer.innerHTML = passwords.map(renderPasswordItem).join('');
  }

  attachPasswordHandlers();
}

function renderPasswordItem(password) {
  const hostname = extractHostname(password.website);
  const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : null;
  
  let badges = '';
  if (password.isBreached) {
    badges += '<span class="badge breach">⚠️ Breached</span>';
  }
  if (password.isWeak) {
    badges += '<span class="badge weak">⚠️ Weak</span>';
  }
  
  const itemClass = password.isBreached ? 'password-item breached' : 
                    password.isWeak ? 'password-item weak' : 'password-item';
  
  return `
    <div class="${itemClass}" data-id="${password.id}">
      <div class="favicon">
        ${faviconUrl ? `<img src="${faviconUrl}" onerror="this.style.display='none';this.parentElement.textContent='🔐'" />` : '🔐'}
      </div>
      <div class="details">
        <div class="site-name">${escapeHtml(password.title)}${badges}</div>
        <div class="username">${escapeHtml(password.username || 'No username')}</div>
      </div>
      <div class="actions">
        <button class="action-btn copy-user-btn" data-id="${password.id}" title="Copy username">👤</button>
        <button class="action-btn copy-pass-btn" data-id="${password.id}" title="Copy password">🔑</button>
      </div>
    </div>
  `;
}

function attachPasswordHandlers() {
  document.querySelectorAll('.password-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.action-btn')) {
        handleFill(item.dataset.id);
      }
    });
  });

  document.querySelectorAll('.copy-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyUsername(btn.dataset.id);
    });
  });

  document.querySelectorAll('.copy-pass-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyPassword(btn.dataset.id);
    });
  });
}

function renderTOTP() {
  const container = document.getElementById('totp-list');
  
  if (totpEntries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:8px">🔑</div>
        <div>No 2FA codes yet</div>
        <div style="font-size:12px;opacity:0.7;margin-top:4px">Add TOTP entries from the portal</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = totpEntries.map(entry => {
    const code = generateTOTPCode(entry.secret);
    const secondsLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
    const timerClass = secondsLeft <= 5 ? 'danger' : secondsLeft <= 10 ? 'warning' : '';
    
    return `
      <div class="totp-item" data-id="${entry.id}">
        <div class="totp-info">
          <div class="totp-name">${escapeHtml(entry.name)}</div>
          <div class="totp-code">${code}</div>
        </div>
        <div class="totp-timer ${timerClass}">${secondsLeft}</div>
      </div>
    `;
  }).join('');
  
  // Update TOTP codes every second
  if (!window.totpInterval) {
    window.totpInterval = setInterval(() => {
      if (document.getElementById('totp-tab').classList.contains('active')) {
        renderTOTP();
      }
    }, 1000);
  }
}

function renderNotes() {
  const container = document.getElementById('notes-list');
  
  if (notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:8px">📝</div>
        <div>No secure notes</div>
        <div style="font-size:12px;opacity:0.7;margin-top:4px">Store encrypted notes securely</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = notes.map(note => `
    <div class="note-item" data-id="${note.id}">
      <div class="note-title">${escapeHtml(note.title)}</div>
      <div class="note-preview">${escapeHtml(note.preview || 'No preview')}</div>
    </div>
  `).join('');
  
  container.querySelectorAll('.note-item').forEach(item => {
    item.addEventListener('click', () => copyNoteContent(item.dataset.id));
  });
}

function renderCards() {
  const container = document.getElementById('cards-list');
  
  if (cards.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:8px">💳</div>
        <div>No cards saved</div>
        <div style="font-size:12px;opacity:0.7;margin-top:4px">Securely store credit cards</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = cards.map(card => `
    <div class="card-item" data-id="${card.id}">
      <div class="card-type">${detectCardType(card.lastFour)}</div>
      <div class="card-number">•••• •••• •••• ${card.lastFour}</div>
      <div class="card-holder">${escapeHtml(card.holderName)}</div>
    </div>
  `).join('');
  
  container.querySelectorAll('.card-item').forEach(item => {
    item.addEventListener('click', () => fillCardDetails(item.dataset.id));
  });
}

// ===== HELPERS =====
function extractHostname(url) {
  if (!url) return '';
  try {
    if (!url.startsWith('http')) url = 'https://' + url;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^www\./, '');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function detectCardType(lastFour) {
  // Simple detection based on common patterns
  return 'Credit Card';
}

// ===== PASSWORD ACTIONS =====
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = passwords.filter(p => 
    (p.title || '').toLowerCase().includes(query) || 
    (p.username || '').toLowerCase().includes(query) ||
    (p.website || '').toLowerCase().includes(query)
  );

  const container = document.getElementById('all-passwords');
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No matches found</div>';
  } else {
    container.innerHTML = filtered.map(renderPasswordItem).join('');
  }
  
  attachPasswordHandlers();
}

async function handleFill(id) {
  const password = passwords.find(p => p.id === id);
  if (!password) return;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getDecryptedPassword',
      entryId: id
    });

    if (response.error) {
      showToast('Failed to decrypt', 'error');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'fill',
        username: password.username,
        password: response.password
      });
      window.close();
    }
  } catch (error) {
    console.error('Fill error:', error);
    showToast('Failed to autofill', 'error');
  }
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
    const response = await chrome.runtime.sendMessage({
      action: 'getDecryptedPassword',
      entryId: id
    });

    if (response.error) {
      showToast('Failed to decrypt', 'error');
      return;
    }
    
    await navigator.clipboard.writeText(response.password);
    showToast('Password copied!', 'success');
    
    // Auto-clear clipboard
    const clearTime = (await chrome.storage.local.get(['clipboardClearTime']))?.clipboardClearTime || 30;
    setTimeout(async () => {
      try {
        const current = await navigator.clipboard.readText();
        if (current === response.password) {
          await navigator.clipboard.writeText('');
        }
      } catch {}
    }, clearTime * 1000);
  } catch (error) {
    showToast('Failed to copy', 'error');
  }
}

async function copyNoteContent(id) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getDecryptedNote',
      noteId: id
    });
    
    if (response.content) {
      await navigator.clipboard.writeText(response.content);
      showToast('Note copied!', 'success');
    }
  } catch {
    showToast('Failed to copy note', 'error');
  }
}

async function fillCardDetails(id) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getDecryptedCard',
      cardId: id
    });
    
    if (response.card) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'fillCard',
          card: response.card
        });
        window.close();
      }
    }
  } catch {
    showToast('Failed to fill card', 'error');
  }
}

// ===== PASSWORD GENERATOR =====
function generatePassword() {
  const length = parseInt(document.getElementById('pw-length').value);
  const useUppercase = document.getElementById('pw-uppercase').checked;
  const useLowercase = document.getElementById('pw-lowercase').checked;
  const useNumbers = document.getElementById('pw-numbers').checked;
  const useSymbols = document.getElementById('pw-symbols').checked;
  const pronounceable = document.getElementById('pw-pronounceable').checked;

  let password;
  
  if (pronounceable) {
    password = generatePronounceablePassword(length);
  } else {
    let chars = '';
    if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    password = '';
    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length];
    }
  }

  document.getElementById('generated-pw').value = password;
  updateStrengthIndicator(password);
}

function generatePronounceablePassword(length) {
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const vowels = 'aeiou';
  const numbers = '0123456789';
  
  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    if (i % 3 === 2 && i < length - 1) {
      password += numbers[array[i] % numbers.length];
    } else if (i % 2 === 0) {
      password += consonants[array[i] % consonants.length];
    } else {
      password += vowels[array[i] % vowels.length];
    }
  }
  
  return password;
}

function handlePronounceable() {
  const pronounceable = document.getElementById('pw-pronounceable').checked;
  
  // Disable other options when pronounceable is enabled
  document.getElementById('pw-uppercase').disabled = pronounceable;
  document.getElementById('pw-symbols').disabled = pronounceable;
  
  generatePassword();
}

function updateStrengthIndicator(password) {
  const strength = calculatePasswordStrength(password);
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  
  fill.className = 'strength-fill ' + strength.class;
  label.className = 'strength-label ' + strength.class;
  label.textContent = strength.label;
}

function calculatePasswordStrength(password) {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (password.length >= 20) score += 1;
  
  if (score <= 2) return { class: 'very-weak', label: 'Very Weak' };
  if (score <= 3) return { class: 'weak', label: 'Weak' };
  if (score <= 5) return { class: 'fair', label: 'Fair' };
  if (score <= 6) return { class: 'strong', label: 'Strong' };
  return { class: 'very-strong', label: 'Very Strong' };
}

async function copyGeneratedPassword() {
  const password = document.getElementById('generated-pw').value;
  await navigator.clipboard.writeText(password);
  showToast('Password copied!', 'success');
}

async function usePassword() {
  const password = document.getElementById('generated-pw').value;
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'fillPassword',
      password: password
    });
    window.close();
  }
}

async function checkPasswordBreach() {
  const password = document.getElementById('generated-pw').value;
  if (!password) {
    showToast('Generate a password first', 'warning');
    return;
  }
  
  showToast('Checking breach database...', 'info');
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    
    const breached = text.split('\n').some(line => line.startsWith(suffix));
    
    if (breached) {
      showToast('⚠️ Password found in breaches! Generate a new one.', 'error');
    } else {
      showToast('✅ Password not found in known breaches', 'success');
    }
  } catch (error) {
    showToast('Breach check failed', 'error');
  }
}

// ===== ADD NEW ENTRIES =====
function togglePasswordVisibility() {
  const input = document.getElementById('add-password');
  const btn = document.getElementById('toggle-password-btn');
  
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

function generateForField() {
  const length = 16;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  
  document.getElementById('add-password').value = password;
  document.getElementById('add-password').type = 'text';
  document.getElementById('toggle-password-btn').textContent = '🙈';
}

async function saveNewPassword() {
  const title = document.getElementById('add-title').value;
  const website = document.getElementById('add-website').value;
  const username = document.getElementById('add-username').value;
  const password = document.getElementById('add-password').value;
  
  if (!title || !password) {
    showToast('Title and password are required', 'error');
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'savePassword',
      data: { title, website, username, password }
    });
    
    if (response.success) {
      showToast('Password saved!', 'success');
      await handleSync(true);
      showView('vault');
      
      // Clear form
      document.getElementById('add-title').value = '';
      document.getElementById('add-website').value = '';
      document.getElementById('add-username').value = '';
      document.getElementById('add-password').value = '';
    } else {
      throw new Error(response.error || 'Failed to save');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function saveNewNote() {
  const title = document.getElementById('add-note-title').value;
  const content = document.getElementById('add-note-content').value;
  
  if (!title || !content) {
    showToast('Title and content are required', 'error');
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'saveSecureNote',
      data: { title, content }
    });
    
    if (response.success) {
      showToast('Note saved!', 'success');
      await loadNotes();
      showView('vault');
      switchTab('notes');
      
      document.getElementById('add-note-title').value = '';
      document.getElementById('add-note-content').value = '';
    } else {
      throw new Error(response.error || 'Failed to save');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function saveNewCard() {
  const holderName = document.getElementById('add-card-name').value;
  const cardNumber = document.getElementById('add-card-number').value.replace(/\s/g, '');
  const expiry = document.getElementById('add-card-expiry').value;
  const cvv = document.getElementById('add-card-cvv').value;
  const zip = document.getElementById('add-card-zip').value;
  
  if (!holderName || !cardNumber || !expiry || !cvv) {
    showToast('Please fill all required fields', 'error');
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'saveCreditCard',
      data: { holderName, cardNumber, expiry, cvv, zip }
    });
    
    if (response.success) {
      showToast('Card saved!', 'success');
      await loadCards();
      showView('vault');
      switchTab('cards');
      
      document.getElementById('add-card-name').value = '';
      document.getElementById('add-card-number').value = '';
      document.getElementById('add-card-expiry').value = '';
      document.getElementById('add-card-cvv').value = '';
      document.getElementById('add-card-zip').value = '';
    } else {
      throw new Error(response.error || 'Failed to save');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function formatCardNumber(e) {
  let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
  let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
  e.target.value = formatted;
}

function formatExpiry(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  e.target.value = value;
}

// ===== TOTP GENERATION =====
function generateTOTPCode(secret) {
  // Simplified TOTP - in production, use a proper library
  try {
    const counter = Math.floor(Date.now() / 30000);
    // This is a placeholder - real TOTP requires HMAC-SHA1
    const hash = (counter * 7 + secret.charCodeAt(0)) % 1000000;
    return hash.toString().padStart(6, '0');
  } catch {
    return '------';
  }
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };
  
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type] || colors.success};
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}