// SafePass Background Service Worker

const SAFEPASS_API_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1';
const PORTAL_URL = 'https://ultriumai.lovable.app/safepass-app';

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SafePass] Extension installed');
    // Open welcome page or setup
    chrome.tabs.create({
      url: `${PORTAL_URL}?extension=installed`
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
    const session = await chrome.storage.session.get(['masterKey', 'authToken']);
    if (!session.masterKey || !session.authToken) {
      return { error: 'Not authenticated' };
    }

    const response = await fetch(`${SAFEPASS_API_URL}/safepass-breach-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.authToken}`,
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
    const session = await chrome.storage.session.get(['masterKey', 'email', 'authToken']);
    if (!session.masterKey || !session.authToken) {
      return { error: 'Not authenticated' };
    }

    // Encrypt the password with user-specific salt
    const encrypted = await encryptPassword(data.password, session.masterKey);
    
    // For now, store locally
    const stored = await chrome.storage.local.get(['passwords']);
    const passwords = stored.passwords || [];
    
    passwords.push({
      id: crypto.randomUUID(),
      website: data.website,
      username: data.username,
      encryptedPassword: encrypted.ciphertext,
      salt: encrypted.salt,
      iv: encrypted.iv,
      createdAt: new Date().toISOString()
    });

    await chrome.storage.local.set({ passwords });
    
    return { success: true };
  } catch (error) {
    console.error('[SafePass] Save password error:', error);
    return { error: error.message };
  }
}

// Secure encryption with random salt
async function encryptPassword(password, masterKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate cryptographically random salt for each encryption
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from master key with unique salt
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
      salt: salt,
      iterations: 600000, // OWASP 2023 recommendation
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return {
    ciphertext: arrayToBase64(new Uint8Array(encrypted)),
    salt: arrayToBase64(salt),
    iv: arrayToBase64(iv)
  };
}

// Decrypt password
async function decryptPassword(encryptedData, masterKey) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const ciphertext = base64ToArray(encryptedData.ciphertext);
  const salt = base64ToArray(encryptedData.salt);
  const iv = base64ToArray(encryptedData.iv);
  
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

// Helper functions
function arrayToBase64(array) {
  return btoa(String.fromCharCode(...array));
}

function base64ToArray(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Store decryption function for popup access
self.decryptPassword = decryptPassword;

// Alarm for daily breach check
chrome.alarms.create('dailyBreachCheck', {
  periodInMinutes: 24 * 60 // Once per day
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyBreachCheck') {
    console.log('[SafePass] Running daily breach check');
    
    const session = await chrome.storage.session.get(['authToken']);
    if (!session.authToken) {
      console.log('[SafePass] No auth token, skipping breach check');
      return;
    }
    
    // Trigger daily scan via API
    try {
      const response = await fetch(`${SAFEPASS_API_URL}/safepass-breach-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.authToken}`,
        },
        body: JSON.stringify({
          action: 'daily_scan'
        })
      });

      const result = await response.json();
      
      if (result.breached_entries > 0) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Security Alert',
          message: `${result.breached_entries} of your passwords may have been compromised in data breaches.`,
          priority: 2
        });
      }
    } catch (e) {
      console.error('[SafePass] Daily breach check failed:', e);
    }
  }
});

console.log('[SafePass] Background service worker initialized');
