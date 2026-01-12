// SafePass Extension Popup Script

const SAFEPASS_API_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1';
const PORTAL_URL = 'https://your-app-url.com/safepass-app/portal';

// State
let isUnlocked = false;
let passwords = [];
let currentSite = '';

// DOM Elements
const loginView = document.getElementById('login-view');
const vaultView = document.getElementById('vault-view');
const generatorView = document.getElementById('generator-view');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check if already unlocked
  const session = await chrome.storage.session.get(['unlocked', 'masterKey']);
  if (session.unlocked && session.masterKey) {
    isUnlocked = true;
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
    alert('Please enter email and master password');
    return;
  }

  try {
    // Hash the master password for verification
    const encoder = new TextEncoder();
    const data = encoder.encode(masterPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const masterKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store session
    await chrome.storage.session.set({
      unlocked: true,
      masterKey: masterKey,
      email: email
    });

    isUnlocked = true;
    await loadPasswords();
    showView('vault');
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to unlock vault');
  }
}

async function handleLock() {
  await chrome.storage.session.clear();
  isUnlocked = false;
  passwords = [];
  showView('login');
}

async function loadPasswords() {
  // In production, this would fetch from the SafePass API
  // For demo, using localStorage simulation
  const stored = await chrome.storage.local.get(['passwords']);
  passwords = stored.passwords || getDemoPasswords();
}

function getDemoPasswords() {
  return [
    { id: '1', website: 'github.com', username: 'user@example.com', favicon: '🐙' },
    { id: '2', website: 'google.com', username: 'user@gmail.com', favicon: '🔍' },
    { id: '3', website: 'amazon.com', username: 'shopper@email.com', favicon: '📦' },
    { id: '4', website: 'twitter.com', username: '@username', favicon: '🐦' },
  ];
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
  allPasswordsContainer.innerHTML = passwords.map(renderPasswordItem).join('');

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
        <div class="site-name">${password.website}</div>
        <div class="username">${password.username}</div>
      </div>
      <div class="actions">
        <button class="action-btn copy-user-btn" data-id="${password.id}" title="Copy username">👤</button>
        <button class="action-btn copy-pass-btn" data-id="${password.id}" title="Copy password">🔑</button>
      </div>
    </div>
  `;
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
  if (!password) return;

  // Send message to content script to fill the form
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'fill',
      username: password.username,
      password: 'demo-password-123' // In production, decrypt the actual password
    });
    window.close();
  }
}

async function copyUsername(id) {
  const password = passwords.find(p => p.id === id);
  if (password) {
    await navigator.clipboard.writeText(password.username);
    showToast('Username copied!');
  }
}

async function copyPassword(id) {
  // In production, decrypt the password first
  await navigator.clipboard.writeText('demo-password-123');
  showToast('Password copied!');
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
  showToast('Password copied!');
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

function showToast(message) {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #22c55e;
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
