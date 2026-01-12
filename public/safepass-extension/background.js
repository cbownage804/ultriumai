// SafePass Background Service Worker

const SAFEPASS_API_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1';

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SafePass] Extension installed');
    // Open welcome page or setup
    chrome.tabs.create({
      url: 'https://your-app-url.com/safepass-app?extension=installed'
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    // Chrome doesn't allow programmatically opening popup
    // This is handled by the browser action click
    return;
  }

  if (message.action === 'checkBreach') {
    handleBreachCheck(message.passwordHash)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (message.action === 'savePassword') {
    handleSavePassword(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// Check password against breach database
async function handleBreachCheck(passwordHash) {
  try {
    const session = await chrome.storage.session.get(['masterKey']);
    if (!session.masterKey) {
      return { error: 'Not authenticated' };
    }

    const response = await fetch(`${SAFEPASS_API_URL}/safepass-breach-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'check_passwords',
        password_hashes: [passwordHash],
        entry_ids: ['temp']
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[SafePass] Breach check error:', error);
    return { error: error.message };
  }
}

// Save new password to vault
async function handleSavePassword(data) {
  try {
    const session = await chrome.storage.session.get(['masterKey', 'email']);
    if (!session.masterKey) {
      return { error: 'Not authenticated' };
    }

    // In production, encrypt the password with master key
    // and send to SafePass API
    const encrypted = await encryptPassword(data.password, session.masterKey);
    
    // For now, store locally
    const stored = await chrome.storage.local.get(['passwords']);
    const passwords = stored.passwords || [];
    
    passwords.push({
      id: crypto.randomUUID(),
      website: data.website,
      username: data.username,
      encryptedPassword: encrypted,
      createdAt: new Date().toISOString()
    });

    await chrome.storage.local.set({ passwords });
    
    return { success: true };
  } catch (error) {
    console.error('[SafePass] Save password error:', error);
    return { error: error.message };
  }
}

// Simple encryption (in production, use proper encryption library)
async function encryptPassword(password, masterKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Derive key from master key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('SafePassSalt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Alarm for daily breach check
chrome.alarms.create('dailyBreachCheck', {
  periodInMinutes: 24 * 60 // Once per day
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyBreachCheck') {
    console.log('[SafePass] Running daily breach check');
    
    // Get stored passwords
    const stored = await chrome.storage.local.get(['passwords']);
    const passwords = stored.passwords || [];
    
    if (passwords.length === 0) return;

    // Check each password
    for (const password of passwords) {
      try {
        const result = await handleBreachCheck(password.encryptedPassword);
        if (result.breached_count > 0) {
          // Show notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Security Alert',
            message: `Your password for ${password.website} may have been compromised in a data breach.`,
            priority: 2
          });
        }
      } catch (e) {
        console.error('[SafePass] Breach check failed for:', password.website);
      }
    }
  }
});

console.log('[SafePass] Background service worker initialized');
