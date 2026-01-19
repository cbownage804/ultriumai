// SafePass Extension Popup Script

const SAFEPASS_API_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1';
const PORTAL_URL = 'https://ultriumai.lovable.app/safepass-app/portal';
const SUPABASE_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI';

// State
let isUnlocked = false;
let passwords = [];
let currentSite = '';
let masterKey = null;

// DOM Elements
const loginView = document.getElementById('login-view');
const vaultView = document.getElementById('vault-view');
const generatorView = document.getElementById('generator-view');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check if already unlocked
  const session = await chrome.storage.session.get(['unlocked', 'masterKey', 'authToken']);
  if (session.unlocked && session.masterKey && session.authToken) {
    isUnlocked = true;
    masterKey = session.masterKey;
    await loadPasswords();
    showView('vault');
  } else {
    showView('login');
  }

  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try {
      const url = new URL(tab.url);
      currentSite = url.hostname;
    } catch (e) {
      currentSite = '';
    }
  }

  setupEventListeners();
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
  // Login
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('open-portal').addEventListener('click', () => {
    chrome.tabs.create({ url: PORTAL_URL });
  });

  // Vault
  document.getElementById('lock-btn').addEventListener('click', handleLock);
  document.getElementById('search').addEventListener('input', handleSearch);
  document.getElementById('generate-btn').addEventListener('click', () => showView('generator'));
  document.getElementById('add-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${PORTAL_URL}?add=true` });
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

  try {
    // Authenticate with Supabase
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password: masterPassword
      })
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      showToast(error.error_description || 'Login failed', 'error');
      return;
    }

    const authData = await authResponse.json();
    const authToken = authData.access_token;

    // Hash the master password for local vault operations
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
      authToken: authToken
    });

    isUnlocked = true;
    await loadPasswords();
    showView('vault');
    showToast('Vault unlocked!', 'success');
  } catch (error) {
    console.error('Login error:', error);
    showToast('Failed to unlock vault', 'error');
  }
}

async function handleLock() {
  // Clear sensitive data
  masterKey = null;
  await chrome.storage.session.clear();
  isUnlocked = false;
  passwords = [];
  showView('login');
  showToast('Vault locked', 'success');
}

async function loadPasswords() {
  // Load from local storage
  const stored = await chrome.storage.local.get(['passwords']);
  passwords = stored.passwords || [];
  
  // If no local passwords, show empty state
  if (passwords.length === 0) {
    passwords = [];
  }
}

function renderPasswords() {
  const currentSiteContainer = document.getElementById('current-site-passwords');
  const allPasswordsContainer = document.getElementById('all-passwords');

  // Filter for current site
  const sitePasswords = passwords.filter(p => 
    currentSite.includes(p.website) || p.website.includes(currentSite)
  );

  // Render current site passwords
  if (sitePasswords.length > 0) {
    document.getElementById('current-site').classList.remove('hidden');
    currentSiteContainer.innerHTML = sitePasswords.map(renderPasswordItem).join('');
  } else {
    document.getElementById('current-site').classList.add('hidden');
  }

  // Render all passwords
  if (passwords.length === 0) {
    allPasswordsContainer.innerHTML = '<div class="empty-state">No passwords saved yet</div>';
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

function renderPasswordItem(password) {
  return `
    <div class="password-item" data-id="${password.id}">
      <div class="favicon">${password.favicon || '🔐'}</div>
      <div class="details">
        <div class="site-name">${escapeHtml(password.website)}</div>
        <div class="username">${escapeHtml(password.username)}</div>
      </div>
      <div class="actions">
        <button class="action-btn copy-user-btn" data-id="${password.id}" title="Copy username">👤</button>
        <button class="action-btn copy-pass-btn" data-id="${password.id}" title="Copy password">🔑</button>
      </div>
    </div>
  `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = passwords.filter(p => 
    p.website.toLowerCase().includes(query) || 
    p.username.toLowerCase().includes(query)
  );

  const container = document.getElementById('all-passwords');
  container.innerHTML = filtered.map(renderPasswordItem).join('');
}

async function handleFill(id) {
  const password = passwords.find(p => p.id === id);
  if (!password || !masterKey) return;

  try {
    // Decrypt the password
    let decryptedPassword;
    if (password.salt && password.iv) {
      // New format with individual salt
      decryptedPassword = await decryptPassword(password, masterKey);
    } else {
      // Legacy format - should not happen with new entries
      decryptedPassword = '';
    }

    // Send message to content script to fill the form
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'fill',
        username: password.username,
        password: decryptedPassword
      });
      window.close();
    }
  } catch (error) {
    console.error('Error decrypting password:', error);
    showToast('Failed to decrypt password', 'error');
  }
}

async function decryptPassword(encryptedData, masterKeyHex) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const ciphertext = base64ToArray(encryptedData.encryptedPassword || encryptedData.ciphertext);
  const salt = base64ToArray(encryptedData.salt);
  const iv = base64ToArray(encryptedData.iv);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKeyHex),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 600000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return decoder.decode(decrypted);
}

function base64ToArray(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function copyUsername(id) {
  const password = passwords.find(p => p.id === id);
  if (password) {
    await navigator.clipboard.writeText(password.username);
    showToast('Username copied!', 'success');
  }
}

async function copyPassword(id) {
  const password = passwords.find(p => p.id === id);
  if (!password || !masterKey) {
    showToast('Unable to copy password', 'error');
    return;
  }

  try {
    let decryptedPassword;
    if (password.salt && password.iv) {
      decryptedPassword = await decryptPassword(password, masterKey);
    } else {
      showToast('Password format not supported', 'error');
      return;
    }
    
    await navigator.clipboard.writeText(decryptedPassword);
    showToast('Password copied!', 'success');
    
    // Clear clipboard after 30 seconds for security
    setTimeout(async () => {
      try {
        const currentClipboard = await navigator.clipboard.readText();
        if (currentClipboard === decryptedPassword) {
          await navigator.clipboard.writeText('');
        }
      } catch (e) {
        // Clipboard access denied, ignore
      }
    }, 30000);
  } catch (error) {
    console.error('Error copying password:', error);
    showToast('Failed to copy password', 'error');
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

  // Use cryptographically secure random generation
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
    chrome.tabs.sendMessage(tab.id, {
      action: 'fillPassword',
      password: password
    });
    window.close();
  }
}

function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#22c55e' : '#ef4444'};
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    z-index: 1000;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}
