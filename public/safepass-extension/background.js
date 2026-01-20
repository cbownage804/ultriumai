// SafePass Background Service Worker
// Compatible with Chrome and Microsoft Edge (Manifest V3)

const SUPABASE_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI';
const SAFEPASS_API_URL = `${SUPABASE_URL}/functions/v1`;
const PORTAL_URL = 'https://safesuite.ultriumai.com/pass';

// Security: Auto-lock timeout (5 minutes)
const AUTO_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

// Cached vault entries (encrypted in memory)
let cachedEntries = [];
let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // Sync every 5 minutes

// Check and auto-lock expired sessions periodically
async function checkAutoLock() {
  const session = await chrome.storage.session.get(['unlocked', 'lastActivity']);
  if (session.unlocked && session.lastActivity) {
    const elapsed = Date.now() - session.lastActivity;
    if (elapsed > AUTO_LOCK_TIMEOUT_MS) {
      console.log('[SafePass] Auto-locking vault due to inactivity');
      await chrome.storage.session.clear();
      cachedEntries = [];
    }
  }
}

// Run auto-lock check every minute
setInterval(checkAutoLock, 60000);
checkAutoLock();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SafePass] Extension installed');
    chrome.tabs.create({
      url: `${PORTAL_URL}?extension=installed`
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => sendResponse({ error: error.message }));
  return true; // Keep message channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.action) {
    case 'getPasswordsForSite':
      return await getPasswordsForSite(message.hostname);
    
    case 'syncVault':
      return await syncVaultFromSupabase();
    
    case 'checkBreach':
      return await handleBreachCheck(message.passwordHash);
    
    case 'savePassword':
      return await handleSavePassword(message.data);
    
    case 'fillCredentials':
      // Forward to content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'fill',
          username: message.username,
          password: message.password
        });
      }
      return { success: true };
    
    case 'getCachedEntries':
      return { entries: cachedEntries };
    
    default:
      return { error: 'Unknown action' };
  }
}

// Sync vault entries from Supabase
async function syncVaultFromSupabase() {
  try {
    const session = await chrome.storage.session.get(['authToken', 'masterKey']);
    if (!session.authToken) {
      return { error: 'Not authenticated' };
    }

    // Fetch user's vaults first
    const vaultsResponse = await fetch(`${SUPABASE_URL}/rest/v1/safepass_vaults?select=id,name`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.authToken}`,
      }
    });

    if (!vaultsResponse.ok) {
      throw new Error('Failed to fetch vaults');
    }

    const vaults = await vaultsResponse.json();
    if (vaults.length === 0) {
      cachedEntries = [];
      return { success: true, entries: [] };
    }

    // Fetch entries from all vaults
    const vaultIds = vaults.map(v => v.id);
    const entriesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/safepass_entries?vault_id=in.(${vaultIds.join(',')})&select=id,title,encrypted_username,encrypted_password,encrypted_url,category,is_favorite,url`, 
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.authToken}`,
        }
      }
    );

    if (!entriesResponse.ok) {
      throw new Error('Failed to fetch entries');
    }

    const entries = await entriesResponse.json();
    
    // Store encrypted entries in memory (will decrypt on-demand)
    cachedEntries = entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      encrypted_username: entry.encrypted_username,
      encrypted_password: entry.encrypted_password,
      encrypted_url: entry.encrypted_url,
      url: entry.url,
      category: entry.category,
      is_favorite: entry.is_favorite
    }));

    lastSyncTime = Date.now();
    
    // Also store in local storage for offline access
    await chrome.storage.local.set({ 
      cachedEntries,
      lastSyncTime 
    });

    console.log(`[SafePass] Synced ${cachedEntries.length} entries from Supabase`);
    return { success: true, entries: cachedEntries };
  } catch (error) {
    console.error('[SafePass] Sync error:', error);
    return { error: error.message };
  }
}

// Get passwords matching a hostname
async function getPasswordsForSite(hostname) {
  try {
    const session = await chrome.storage.session.get(['masterKey', 'authToken']);
    if (!session.masterKey || !session.authToken) {
      return { entries: [], needsAuth: true };
    }

    // Check if we need to sync
    if (Date.now() - lastSyncTime > SYNC_INTERVAL_MS || cachedEntries.length === 0) {
      // Load from local storage first
      const stored = await chrome.storage.local.get(['cachedEntries', 'lastSyncTime']);
      if (stored.cachedEntries) {
        cachedEntries = stored.cachedEntries;
        lastSyncTime = stored.lastSyncTime || 0;
      }
      
      // Sync in background if stale
      if (Date.now() - lastSyncTime > SYNC_INTERVAL_MS) {
        syncVaultFromSupabase(); // Don't await, let it run in background
      }
    }

    // Filter and decrypt entries matching the hostname
    const matchingEntries = [];
    
    for (const entry of cachedEntries) {
      try {
        // Decrypt URL to check for match
        let entryUrl = entry.url || '';
        if (entry.encrypted_url) {
          try {
            entryUrl = await decryptField(entry.encrypted_url, session.masterKey);
          } catch {
            // Use plaintext URL if decryption fails
          }
        }
        
        // Check if URL matches
        const matches = entryUrl && (
          hostname.includes(extractHostname(entryUrl)) || 
          extractHostname(entryUrl).includes(hostname)
        );
        
        if (matches || !hostname) {
          // Decrypt username for display
          let username = '';
          if (entry.encrypted_username) {
            try {
              username = await decryptField(entry.encrypted_username, session.masterKey);
            } catch {
              username = '[encrypted]';
            }
          }
          
          matchingEntries.push({
            id: entry.id,
            title: entry.title,
            username,
            website: entryUrl,
            is_favorite: entry.is_favorite,
            // Password will be decrypted on-demand when filling
            hasPassword: !!entry.encrypted_password
          });
        }
      } catch (error) {
        console.error('[SafePass] Error processing entry:', error);
      }
    }

    return { entries: matchingEntries };
  } catch (error) {
    console.error('[SafePass] getPasswordsForSite error:', error);
    return { entries: [], error: error.message };
  }
}

// Get decrypted password for an entry
async function getDecryptedPassword(entryId) {
  const session = await chrome.storage.session.get(['masterKey']);
  if (!session.masterKey) {
    throw new Error('Vault is locked');
  }

  const entry = cachedEntries.find(e => e.id === entryId);
  if (!entry || !entry.encrypted_password) {
    throw new Error('Entry not found');
  }

  return await decryptField(entry.encrypted_password, session.masterKey);
}

// Export for popup access
self.getDecryptedPassword = getDecryptedPassword;

function extractHostname(url) {
  try {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^www\./, '');
  }
}

// Decrypt a single encrypted field
async function decryptField(encryptedData, masterKey) {
  if (!encryptedData) return '';
  
  // Parse the encrypted data (format: iv:salt:ciphertext in base64)
  let iv, salt, ciphertext;
  
  if (typeof encryptedData === 'string') {
    // Try JSON format first
    try {
      const parsed = JSON.parse(encryptedData);
      iv = base64ToArray(parsed.iv);
      salt = base64ToArray(parsed.salt);
      ciphertext = base64ToArray(parsed.ciphertext);
    } catch {
      // Try colon-separated format
      const parts = encryptedData.split(':');
      if (parts.length === 3) {
        iv = base64ToArray(parts[0]);
        salt = base64ToArray(parts[1]);
        ciphertext = base64ToArray(parts[2]);
      } else {
        throw new Error('Invalid encrypted data format');
      }
    }
  } else if (encryptedData.iv && encryptedData.salt && encryptedData.ciphertext) {
    iv = base64ToArray(encryptedData.iv);
    salt = base64ToArray(encryptedData.salt);
    ciphertext = base64ToArray(encryptedData.ciphertext);
  } else {
    throw new Error('Invalid encrypted data format');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
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

// Check password against breach database
async function handleBreachCheck(passwordHash) {
  try {
    const session = await chrome.storage.session.get(['authToken']);
    if (!session.authToken) {
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

    return await response.json();
  } catch (error) {
    console.error('[SafePass] Breach check error:', error);
    return { error: error.message };
  }
}

// Save new password to vault
async function handleSavePassword(data) {
  try {
    const session = await chrome.storage.session.get(['masterKey', 'authToken']);
    if (!session.masterKey || !session.authToken) {
      return { error: 'Not authenticated' };
    }

    // Encrypt credentials
    const encryptedUsername = await encryptField(data.username, session.masterKey);
    const encryptedPassword = await encryptField(data.password, session.masterKey);
    const encryptedUrl = await encryptField(data.website, session.masterKey);

    // Get user's default vault
    const vaultsResponse = await fetch(`${SUPABASE_URL}/rest/v1/safepass_vaults?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.authToken}`,
      }
    });

    const vaults = await vaultsResponse.json();
    if (!vaults.length) {
      return { error: 'No vault found' };
    }

    // Save to Supabase
    const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/safepass_entries`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.authToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        vault_id: vaults[0].id,
        title: data.title || extractHostname(data.website),
        encrypted_username: encryptedUsername,
        encrypted_password: encryptedPassword,
        encrypted_url: encryptedUrl,
        url: data.website,
        category: 'login'
      })
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save entry');
    }

    // Refresh cache
    await syncVaultFromSupabase();
    
    return { success: true };
  } catch (error) {
    console.error('[SafePass] Save password error:', error);
    return { error: error.message };
  }
}

// Encrypt a field
async function encryptField(value, masterKey) {
  if (!value) return null;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
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
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return JSON.stringify({
    iv: arrayToBase64(iv),
    salt: arrayToBase64(salt),
    ciphertext: arrayToBase64(new Uint8Array(encrypted))
  });
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

// Alarm for daily breach check
chrome.alarms.create('dailyBreachCheck', {
  periodInMinutes: 24 * 60
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyBreachCheck') {
    console.log('[SafePass] Running daily breach check');
    
    const session = await chrome.storage.session.get(['authToken']);
    if (!session.authToken) {
      return;
    }
    
    try {
      const response = await fetch(`${SAFEPASS_API_URL}/safepass-breach-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.authToken}`,
        },
        body: JSON.stringify({ action: 'daily_scan' })
      });

      const result = await response.json();
      
      if (result.breached_entries > 0) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Security Alert',
          message: `${result.breached_entries} of your passwords may have been compromised.`,
          priority: 2
        });
      }
    } catch (e) {
      console.error('[SafePass] Daily breach check failed:', e);
    }
  }
});

console.log('[SafePass] Background service worker initialized (Chrome/Edge compatible)');
