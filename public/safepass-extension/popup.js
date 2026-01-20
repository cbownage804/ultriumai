// SafePass Extension Popup Script
// Compatible with Chrome and Microsoft Edge

const SUPABASE_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI';
const PORTAL_URL = 'https://safesuite.ultriumai.com/pass';

// Security: Auto-lock timeout (5 minutes)
const AUTO_LOCK_TIMEOUT_MS = 5 * 60 * 1000;
let autoLockTimer = null;
let lastActivityTime = Date.now();

// State
let isUnlocked = false;
let passwords = [];
let currentSite = '';
let masterKey = null;

// DOM Elements
let loginView, vaultView, generatorView;

// Reset auto-lock timer
function resetAutoLockTimer() {
  lastActivityTime = Date.now();
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (isUnlocked) {
    autoLockTimer = setTimeout(autoLockVault, AUTO_LOCK_TIMEOUT_MS);
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
    if (elapsed > AUTO_LOCK_TIMEOUT_MS) {
      await chrome.storage.session.clear();
      return false;
    }
  }
  return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  loginView = document.getElementById('login-view');
  vaultView = document.getElementById('vault-view');
  generatorView = document.getElementById('generator-view');

  const sessionValid = await checkSessionExpiry();
  const session = await chrome.storage.session.get(['unlocked', 'masterKey', 'authToken']);
  
  if (sessionValid && session.unlocked && session.masterKey && session.authToken) {
    isUnlocked = true;
    masterKey = session.masterKey;
    await loadPasswords();
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
  document.addEventListener('keydown', resetAutoLockTimer);
  
  setInterval(async () => {
    if (isUnlocked) {
      await chrome.storage.session.set({ lastActivity: lastActivityTime });
    }
  }, 10000);
});

function showView(view) {
  loginView.classList.add('hidden');
  vaultView.classList.add('hidden');
  generatorView.classList.add('hidden');

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
  }
}

function setupEventListeners() {
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('open-portal').addEventListener('click', () => {
    chrome.tabs.create({ url: PORTAL_URL });
  });

  document.getElementById('lock-btn').addEventListener('click', handleLock);
  document.getElementById('search').addEventListener('input', handleSearch);
  document.getElementById('generate-btn').addEventListener('click', () => showView('generator'));
  document.getElementById('add-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${PORTAL_URL}?add=true` });
  });
  document.getElementById('sync-btn').addEventListener('click', handleSync);

  document.getElementById('back-btn').addEventListener('click', () => showView('vault'));
  document.getElementById('pw-length').addEventListener('input', (e) => {
    document.getElementById('length-value').textContent = e.target.value;
    generatePassword();
  });
  document.getElementById('pw-uppercase').addEventListener('change', generatePassword);
  document.getElementById('pw-lowercase').addEventListener('change', generatePassword);
  document.getElementById('pw-numbers').addEventListener('change', generatePassword);
  document.getElementById('pw-symbols').addEventListener('change', generatePassword);
  document.getElementById('regenerate-btn').addEventListener('click', generatePassword);
  document.getElementById('copy-btn').addEventListener('click', copyGeneratedPassword);
  document.getElementById('use-password-btn').addEventListener('click', usePassword);
}

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
    // Authenticate with Supabase
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
    
    // Hash master password for encryption operations
    const encoder = new TextEncoder();
    const data = encoder.encode(masterPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    masterKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store session
    await chrome.storage.session.set({
      unlocked: true,
      masterKey: masterKey,
      email: email,
      authToken: authData.access_token,
      lastActivity: Date.now()
    });

    isUnlocked = true;
    
    // Sync vault from Supabase
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

async function handleSync(silent = false) {
  try {
    if (!silent) {
      showToast('Syncing...', 'info');
    }
    
    const response = await chrome.runtime.sendMessage({ action: 'syncVault' });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    await loadPasswords();
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

async function handleLock() {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
  
  masterKey = null;
  await chrome.storage.session.clear();
  isUnlocked = false;
  passwords = [];
  showView('login');
  showToast('Vault locked', 'success');
}

async function loadPasswords() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getPasswordsForSite',
      hostname: '' // Get all passwords
    });
    
    if (response.entries) {
      passwords = response.entries;
    }
  } catch (error) {
    console.error('Load passwords error:', error);
    passwords = [];
  }
}

function renderPasswords() {
  const currentSiteContainer = document.getElementById('current-site-passwords');
  const allPasswordsContainer = document.getElementById('all-passwords');

  // Filter for current site
  const sitePasswords = passwords.filter(p => {
    const entryHost = extractHostname(p.website);
    return currentSite && (currentSite.includes(entryHost) || entryHost.includes(currentSite));
  });

  // Render current site passwords
  if (sitePasswords.length > 0) {
    document.getElementById('current-site').classList.remove('hidden');
    currentSiteContainer.innerHTML = sitePasswords.map(renderPasswordItem).join('');
  } else {
    document.getElementById('current-site').classList.add('hidden');
  }

  // Render all passwords
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

  // Add click handlers
  document.querySelectorAll('.password-item').forEach(item => {
    item.addEventListener('click', () => handleFill(item.dataset.id));
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

function extractHostname(url) {
  if (!url) return '';
  try {
    if (!url.startsWith('http')) url = 'https://' + url;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^www\./, '');
  }
}

function renderPasswordItem(password) {
  return `
    <div class="password-item" data-id="${password.id}">
      <div class="favicon">${password.is_favorite ? '⭐' : '🔐'}</div>
      <div class="details">
        <div class="site-name">${escapeHtml(password.title)}</div>
        <div class="username">${escapeHtml(password.username || 'No username')}</div>
      </div>
      <div class="actions">
        <button class="action-btn copy-user-btn" data-id="${password.id}" title="Copy username">👤</button>
        <button class="action-btn copy-pass-btn" data-id="${password.id}" title="Copy password">🔑</button>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
  
  // Re-attach handlers
  container.querySelectorAll('.password-item').forEach(item => {
    item.addEventListener('click', () => handleFill(item.dataset.id));
  });
}

async function handleFill(id) {
  const password = passwords.find(p => p.id === id);
  if (!password) return;

  try {
    // Get decrypted password from background
    const response = await chrome.runtime.sendMessage({
      action: 'getDecryptedPassword',
      entryId: id
    });

    if (response.error) {
      showToast('Failed to decrypt', 'error');
      return;
    }

    // Send to content script
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
    
    // Clear clipboard after 30 seconds
    setTimeout(async () => {
      try {
        const current = await navigator.clipboard.readText();
        if (current === response.password) {
          await navigator.clipboard.writeText('');
        }
      } catch {}
    }, 30000);
  } catch (error) {
    showToast('Failed to copy', 'error');
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
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }

  document.getElementById('generated-pw').value = password;
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
