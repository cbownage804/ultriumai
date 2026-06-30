// SafePass Background Service Worker v2.2
// Enhanced with auto-sync, keyboard shortcuts, context menus, TOTP, Notes, Cards, Identity support

const API_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI';
const FUNCTIONS_URL = `${API_URL}/functions/v1`;
const PORTAL_URL = 'https://safesuite.ultriumai.com/pass';

// Security settings
const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000;

// Cached data
let cachedEntries = [];
let cachedSharedEntries = []; // Business team shared entries
let cachedTOTP = [];
let cachedNotes = [];
let cachedCards = [];
let cachedIdentities = [];
let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 2 * 60 * 1000; // Reduced to 2 minutes for faster sync
const AUTO_SYNC_INTERVAL_MS = 30 * 1000; // Check for changes every 30 seconds
let syncInProgress = false;
let userTeamId = null; // Track if user is part of a business team

// ===== AUTO-LOCK =====
async function checkAutoLock() {
  const settings = await chrome.storage.local.get(['autoLockTimeout']);
  const timeout = settings.autoLockTimeout || DEFAULT_AUTO_LOCK_MS;
  
  const session = await chrome.storage.session.get(['unlocked', 'lastActivity']);
  if (session.unlocked && session.lastActivity) {
    const elapsed = Date.now() - session.lastActivity;
    if (elapsed > timeout) {
      console.log('[SafePass] Auto-locking vault due to inactivity');
      await chrome.storage.session.clear();
      cachedEntries = [];
      cachedSharedEntries = [];
      cachedTOTP = [];
      cachedNotes = [];
      cachedCards = [];
      cachedIdentities = [];
      userTeamId = null;
    }
  }
}

// ===== AUTO-SYNC =====
async function autoSync() {
  const session = await chrome.storage.session.get(['unlocked', 'authToken']);
  if (!session.unlocked || !session.authToken || syncInProgress) return;
  
  // Check if enough time has passed since last sync
  if (Date.now() - lastSyncTime >= SYNC_INTERVAL_MS) {
    console.log('[SafePass] Auto-sync triggered');
    await syncVaultFromSupabase();
    // Notify popup if open
    try {
      await chrome.runtime.sendMessage({ action: 'syncComplete', timestamp: Date.now() });
    } catch {
      // Popup not open, ignore
    }
  }
}

setInterval(checkAutoLock, 60000);
setInterval(autoSync, AUTO_SYNC_INTERVAL_MS);
checkAutoLock();

// ===== CONTEXT MENU =====
chrome.runtime.onInstalled.addListener((details) => {
  // Create context menus
  chrome.contextMenus.create({
    id: 'safepass-autofill',
    title: 'Autofill with SafePass',
    contexts: ['editable']
  });
  
  chrome.contextMenus.create({
    id: 'safepass-generate',
    title: 'Generate Password',
    contexts: ['editable']
  });
  
  chrome.contextMenus.create({
    id: 'safepass-separator',
    type: 'separator',
    contexts: ['editable']
  });
  
  chrome.contextMenus.create({
    id: 'safepass-save',
    title: 'Save to SafePass',
    contexts: ['selection']
  });
  
  if (details.reason === 'install') {
    console.log('[SafePass] Extension installed');
    chrome.tabs.create({ url: `${PORTAL_URL}?extension=installed` });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'safepass-autofill':
      await triggerAutofill(tab);
      break;
    case 'safepass-generate':
      await generateAndFill(tab);
      break;
    case 'safepass-save':
      if (info.selectionText) {
        // Could open save dialog with selected text
        chrome.action.openPopup();
      }
      break;
  }
});

// ===== KEYBOARD SHORTCUTS =====
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  switch (command) {
    case 'autofill':
      await triggerAutofill(tab);
      break;
    case 'generate-password':
      await generateAndFill(tab);
      break;
    case 'lock-vault':
      await chrome.storage.session.clear();
      cachedEntries = [];
      cachedSharedEntries = [];
      userTeamId = null;
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'SafePass',
        message: 'Vault has been locked'
      });
      break;
  }
});

async function triggerAutofill(tab) {
  const session = await chrome.storage.session.get(['unlocked', 'masterKey']);
  if (!session.unlocked) {
    chrome.action.openPopup();
    return;
  }
  
  try {
    const hostname = new URL(tab.url).hostname.replace(/^www\./, '');
    const result = await getPasswordsForSite(hostname);
    
    if (result.entries && result.entries.length > 0) {
      // Auto-fill first matching entry
      const entry = result.entries[0];
      const password = await getDecryptedPassword(entry.id);
      
      await chrome.tabs.sendMessage(tab.id, {
        action: 'fill',
        username: entry.username,
        password: password
      });
    } else {
      // Show dropdown with all passwords
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showAllPasswords'
      });
    }
  } catch (error) {
    console.error('[SafePass] Autofill error:', error);
  }
}

async function generateAndFill(tab) {
  const password = generateSecurePassword(16);
  
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'fillPassword',
      password: password
    });
    
    // Copy to clipboard as backup
    await chrome.offscreen?.createDocument?.({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Copy generated password'
    }).catch(() => {});
    
  } catch (error) {
    console.error('[SafePass] Generate and fill error:', error);
  }
}

function generateSecurePassword(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, x => chars[x % chars.length]).join('');
}

// ===== MESSAGE HANDLER =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => sendResponse({ error: error.message }));
  return true;
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
    
    case 'ignoreCredential':
      return await handleIgnoreCredential(message.data);
    
    case 'getDecryptedPassword':
      const password = await getDecryptedPassword(message.entryId);
      return { password };
    
    case 'getTOTPEntries':
      return { entries: cachedTOTP };
    
    case 'getSecureNotes':
      return { notes: cachedNotes };
    
    case 'getCreditCards':
      return { cards: cachedCards };
    
    case 'getDecryptedNote':
      return await getDecryptedNote(message.noteId);
    
    case 'getDecryptedCard':
      return await getDecryptedCard(message.cardId);
    
    case 'saveSecureNote':
      return await handleSaveNote(message.data);
    
    case 'saveCreditCard':
      return await handleSaveCard(message.data);
    
    case 'getIdentities':
      return { identities: cachedIdentities };
    
    case 'getDecryptedIdentity':
      return await getDecryptedIdentity(message.identityId);
    
    case 'saveIdentity':
      return await handleSaveIdentity(message.data);
    
    case 'fillIdentity':
      const [identityTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (identityTab?.id) {
        const identityData = await getDecryptedIdentity(message.identityId);
        if (identityData.identity) {
          await chrome.tabs.sendMessage(identityTab.id, {
            action: 'fillIdentity',
            identity: identityData.identity
          });
        }
      }
      return { success: true };
    
    case 'fillCredentials':
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
    
    case 'getGeneratorSettings':
      return await getGeneratorSettings();
    
    case 'saveGeneratorSettings':
      return await saveGeneratorSettings(message.settings);
    
    case 'forceSync':
      return await forceFullSync();
    
    case 'getLastSyncTime':
      return { lastSyncTime, syncInProgress };
    
    default:
      return { error: 'Unknown action' };
  }
}

// ===== SYNC VAULT =====
async function syncVaultFromSupabase() {
  try {
    syncInProgress = true;
    const session = await chrome.storage.session.get(['authToken', 'masterKey']);
    if (!session.authToken) {
      syncInProgress = false;
      return { error: 'Not authenticated' };
    }

    // Fetch personal vaults
    const vaultsResponse = await fetch(`${API_URL}/rest/v1/safepass_vaults?select=id,name`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${session.authToken}`,
      }
    });

    if (!vaultsResponse.ok) {
      throw new Error('Failed to fetch vaults');
    }

    const vaults = await vaultsResponse.json();
    
    // Fetch personal entries if vaults exist
    if (vaults.length > 0) {
      const vaultIds = vaults.map(v => v.id);
      
      const entriesResponse = await fetch(
        `${API_URL}/rest/v1/safepass_entries?vault_id=in.(${vaultIds.join(',')})&select=id,title,encrypted_username,encrypted_password,encrypted_url,category,is_favorite,url,is_breached,password_strength`, 
        {
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${session.authToken}`,
          }
        }
      );

      if (!entriesResponse.ok) {
        throw new Error('Failed to fetch entries');
      }

      const entries = await entriesResponse.json();
      
      cachedEntries = entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        encrypted_username: entry.encrypted_username,
        encrypted_password: entry.encrypted_password,
        encrypted_url: entry.encrypted_url,
        url: entry.url,
        category: entry.category,
        is_favorite: entry.is_favorite,
        is_breached: entry.is_breached,
        password_strength: entry.password_strength,
        isShared: false
      }));
    } else {
      cachedEntries = [];
    }

    // Fetch shared team entries (Business tier)
    await fetchSharedTeamEntries(session.authToken);

    lastSyncTime = Date.now();
    
    await chrome.storage.local.set({ 
      cachedEntries,
      cachedSharedEntries,
      lastSyncTime,
      userTeamId
    });

    // Also fetch TOTP, Notes, Cards, Identities
    await Promise.all([
      fetchTOTPEntries(session.authToken),
      fetchSecureNotes(session.authToken),
      fetchCreditCards(session.authToken),
      fetchIdentities(session.authToken)
    ]);

    const totalEntries = cachedEntries.length + cachedSharedEntries.length;
    console.log(`[SafePass] Synced ${cachedEntries.length} personal + ${cachedSharedEntries.length} shared entries`);
    syncInProgress = false;
    return { success: true, entries: cachedEntries, sharedEntries: cachedSharedEntries, total: totalEntries };
  } catch (error) {
    console.error('[SafePass] Sync error:', error);
    syncInProgress = false;
    return { error: error.message };
  }
}

// Fetch shared team entries for Business users
async function fetchSharedTeamEntries(authToken) {
  try {
    // First check if user is part of a team
    const membershipResponse = await fetch(
      `${API_URL}/rest/v1/safesuite_team_members?user_id=eq.self&status=eq.active&select=team_id,role`, 
      {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${authToken}`,
        }
      }
    );

    if (!membershipResponse.ok) {
      // Not a business user or no team membership
      cachedSharedEntries = [];
      userTeamId = null;
      return;
    }

    const memberships = await membershipResponse.json();
    if (!memberships || memberships.length === 0) {
      cachedSharedEntries = [];
      userTeamId = null;
      return;
    }

    const teamId = memberships[0].team_id;
    userTeamId = teamId;

    // Fetch shared vaults for this team
    const sharedVaultsResponse = await fetch(
      `${API_URL}/rest/v1/safesuite_shared_vaults?team_id=eq.${teamId}&select=id,name`, 
      {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${authToken}`,
        }
      }
    );

    if (!sharedVaultsResponse.ok) {
      cachedSharedEntries = [];
      return;
    }

    const sharedVaults = await sharedVaultsResponse.json();
    if (!sharedVaults || sharedVaults.length === 0) {
      cachedSharedEntries = [];
      return;
    }

    const sharedVaultIds = sharedVaults.map(v => v.id);

    // Fetch shared entries from all team vaults
    const sharedEntriesResponse = await fetch(
      `${API_URL}/rest/v1/safesuite_shared_entries?vault_id=in.(${sharedVaultIds.join(',')})&select=id,title,encrypted_data,website_url,entry_type,is_favorite,password_strength_score,folder,tags`, 
      {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${authToken}`,
        }
      }
    );

    if (!sharedEntriesResponse.ok) {
      cachedSharedEntries = [];
      return;
    }

    const sharedEntries = await sharedEntriesResponse.json();
    
    // Map shared entries to match personal entry format
    cachedSharedEntries = sharedEntries
      .filter(e => e.entry_type === 'password')
      .map(entry => ({
        id: entry.id,
        title: entry.title,
        encrypted_data: entry.encrypted_data, // Contains username + password as JSON
        url: entry.website_url,
        category: entry.folder || 'shared',
        is_favorite: entry.is_favorite,
        password_strength: entry.password_strength_score,
        tags: entry.tags,
        isShared: true,
        teamId: teamId
      }));

    console.log(`[SafePass] Fetched ${cachedSharedEntries.length} shared team entries`);
  } catch (error) {
    console.error('[SafePass] Failed to fetch shared entries:', error);
    cachedSharedEntries = [];
  }
}

async function fetchTOTPEntries(authToken) {
  try {
    const response = await fetch(`${API_URL}/rest/v1/safepass_totp?select=id,name,encrypted_secret`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    if (response.ok) {
      const entries = await response.json();
      cachedTOTP = entries.map(e => ({
        id: e.id,
        name: e.name,
        encrypted_secret: e.encrypted_secret
      }));
    }
  } catch (error) {
    console.error('[SafePass] TOTP fetch error:', error);
  }
}

async function fetchSecureNotes(authToken) {
  try {
    const response = await fetch(`${API_URL}/rest/v1/safepass_notes?select=id,title,encrypted_content`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    if (response.ok) {
      const notes = await response.json();
      cachedNotes = notes.map(n => ({
        id: n.id,
        title: n.title,
        encrypted_content: n.encrypted_content,
        preview: '••••••••'
      }));
    }
  } catch (error) {
    console.error('[SafePass] Notes fetch error:', error);
  }
}

async function fetchCreditCards(authToken) {
  try {
    const response = await fetch(`${API_URL}/rest/v1/safepass_cards?select=id,holder_name,last_four,encrypted_data`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    if (response.ok) {
      const cards = await response.json();
      cachedCards = cards.map(c => ({
        id: c.id,
        holderName: c.holder_name,
        lastFour: c.last_four,
        encrypted_data: c.encrypted_data
      }));
    }
  } catch (error) {
    console.error('[SafePass] Cards fetch error:', error);
  }
}

async function fetchIdentities(authToken) {
  try {
    const response = await fetch(`${API_URL}/rest/v1/safepass_identities?select=id,name,encrypted_data`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    if (response.ok) {
      const identities = await response.json();
      cachedIdentities = identities.map(i => ({
        id: i.id,
        name: i.name,
        encrypted_data: i.encrypted_data
      }));
    }
  } catch (error) {
    console.error('[SafePass] Identities fetch error:', error);
  }
}

async function getDecryptedIdentity(identityId) {
  const session = await chrome.storage.session.get(['masterKey']);
  if (!session.masterKey) {
    return { error: 'Vault is locked' };
  }

  const identity = cachedIdentities.find(i => i.id === identityId);
  if (!identity) {
    return { error: 'Identity not found' };
  }

  try {
    const identityData = JSON.parse(await decryptField(identity.encrypted_data, session.masterKey));
    return { identity: identityData };
  } catch {
    return { error: 'Decryption failed' };
  }
}

async function handleSaveIdentity(data) {
  try {
    const session = await chrome.storage.session.get(['masterKey', 'authToken']);
    if (!session.masterKey || !session.authToken) {
      return { error: 'Not authenticated' };
    }

    const identityData = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.zip || '',
      country: data.country || ''
    };

    const encryptedData = await encryptField(JSON.stringify(identityData), session.masterKey);

    const response = await fetch(`${API_URL}/rest/v1/safepass_identities`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${session.authToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: data.name || `${data.firstName} ${data.lastName}`.trim() || 'My Identity',
        encrypted_data: encryptedData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save identity');
    }

    await fetchIdentities(session.authToken);
    return { success: true };
  } catch (error) {
    console.error('[SafePass] Save identity error:', error);
    return { error: error.message };
  }
}

// ===== GET PASSWORDS =====
async function getPasswordsForSite(hostname) {
  try {
    const session = await chrome.storage.session.get(['masterKey', 'authToken']);
    if (!session.masterKey || !session.authToken) {
      return { entries: [], needsAuth: true };
    }

    // Check if sync needed
    if (Date.now() - lastSyncTime > SYNC_INTERVAL_MS || cachedEntries.length === 0) {
      const stored = await chrome.storage.local.get(['cachedEntries', 'cachedSharedEntries', 'lastSyncTime']);
      if (stored.cachedEntries) {
        cachedEntries = stored.cachedEntries;
        lastSyncTime = stored.lastSyncTime || 0;
      }
      if (stored.cachedSharedEntries) {
        cachedSharedEntries = stored.cachedSharedEntries;
      }
      
      if (Date.now() - lastSyncTime > SYNC_INTERVAL_MS) {
        syncVaultFromSupabase();
      }
    }

    const matchingEntries = [];
    
    // Process personal entries
    for (const entry of cachedEntries) {
      try {
        let entryUrl = entry.url || '';
        if (entry.encrypted_url) {
          try {
            entryUrl = await decryptField(entry.encrypted_url, session.masterKey);
          } catch {}
        }
        
        const matches = entryUrl && (
          hostname.includes(extractHostname(entryUrl)) || 
          extractHostname(entryUrl).includes(hostname)
        );
        
        if (matches || !hostname) {
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
            isBreached: entry.is_breached,
            isWeak: entry.password_strength === 'weak',
            hasPassword: !!entry.encrypted_password,
            isShared: false
          });
        }
      } catch (error) {
        console.error('[SafePass] Error processing entry:', error);
      }
    }

    // Process shared team entries
    for (const entry of cachedSharedEntries) {
      try {
        const entryUrl = entry.url || '';
        
        const matches = entryUrl && (
          hostname.includes(extractHostname(entryUrl)) || 
          extractHostname(entryUrl).includes(hostname)
        );
        
        if (matches || !hostname) {
          let username = '';
          try {
            if (entry.encrypted_data) {
              const decrypted = JSON.parse(await decryptField(entry.encrypted_data, session.masterKey));
              username = decrypted.username || '';
            }
          } catch {
            username = '[shared]';
          }
          
          matchingEntries.push({
            id: entry.id,
            title: `🔗 ${entry.title}`, // Prefix shared entries
            username,
            website: entryUrl,
            is_favorite: entry.is_favorite,
            isWeak: entry.password_strength && entry.password_strength < 60,
            hasPassword: !!entry.encrypted_data,
            isShared: true,
            teamId: entry.teamId
          });
        }
      } catch (error) {
        console.error('[SafePass] Error processing shared entry:', error);
      }
    }

    // Sort: favorites first, then personal, then shared
    matchingEntries.sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return b.is_favorite ? 1 : -1;
      if (a.isShared !== b.isShared) return a.isShared ? 1 : -1;
      return 0;
    });

    return { entries: matchingEntries, hasTeam: !!userTeamId };
  } catch (error) {
    console.error('[SafePass] getPasswordsForSite error:', error);
    return { entries: [], error: error.message };
  }
}

async function getDecryptedPassword(entryId) {
  const session = await chrome.storage.session.get(['masterKey']);
  if (!session.masterKey) {
    throw new Error('Vault is locked');
  }

  // Check personal entries first
  const entry = cachedEntries.find(e => e.id === entryId);
  if (entry && entry.encrypted_password) {
    return await decryptField(entry.encrypted_password, session.masterKey);
  }

  // Check shared entries
  const sharedEntry = cachedSharedEntries.find(e => e.id === entryId);
  if (sharedEntry && sharedEntry.encrypted_data) {
    try {
      const decrypted = JSON.parse(await decryptField(sharedEntry.encrypted_data, session.masterKey));
      return decrypted.password || '';
    } catch {
      throw new Error('Failed to decrypt shared entry');
    }
  }

  throw new Error('Entry not found');
}

async function getDecryptedNote(noteId) {
  const session = await chrome.storage.session.get(['masterKey']);
  if (!session.masterKey) {
    return { error: 'Vault is locked' };
  }

  const note = cachedNotes.find(n => n.id === noteId);
  if (!note) {
    return { error: 'Note not found' };
  }

  try {
    const content = await decryptField(note.encrypted_content, session.masterKey);
    return { content };
  } catch {
    return { error: 'Decryption failed' };
  }
}

async function getDecryptedCard(cardId) {
  const session = await chrome.storage.session.get(['masterKey']);
  if (!session.masterKey) {
    return { error: 'Vault is locked' };
  }

  const card = cachedCards.find(c => c.id === cardId);
  if (!card) {
    return { error: 'Card not found' };
  }

  try {
    const cardData = JSON.parse(await decryptField(card.encrypted_data, session.masterKey));
    return { card: cardData };
  } catch {
    return { error: 'Decryption failed' };
  }
}

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

// ===== ENCRYPTION/DECRYPTION =====
async function decryptField(encryptedData, masterKey) {
  if (!encryptedData) return '';
  
  let iv, salt, ciphertext;
  
  if (typeof encryptedData === 'string') {
    try {
      const parsed = JSON.parse(encryptedData);
      iv = base64ToArray(parsed.iv);
      salt = base64ToArray(parsed.salt);
      ciphertext = base64ToArray(parsed.ciphertext);
    } catch {
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

// ===== SAVE HANDLERS =====
async function handleSavePassword(data) {
  try {
    const session = await chrome.storage.session.get(['masterKey', 'authToken']);
    if (!session.masterKey || !session.authToken) {
      return { error: 'Not authenticated' };
    }

    // Check if this credential is in the ignored list
    const stored = await chrome.storage.local.get('ignoredCredentials');
    const ignored = stored.ignoredCredentials || [];
    const key = `${data.website}:${data.username}`;
    if (ignored.includes(key)) {
      return { error: 'Credential ignored by user' };
    }

    // Check for duplicates in cached entries
    const hostname = extractHostname(data.website);
    const existingEntry = cachedEntries.find(entry => {
      const entryHostname = extractHostname(entry.url || entry.website);
      return entryHostname === hostname && entry.username === data.username;
    });
    
    if (existingEntry) {
      // Could update existing entry instead - for now just skip
      console.log('[SafePass] Entry already exists for this site/username');
      return { error: 'Entry already exists', duplicate: true };
    }

    const encryptedUsername = await encryptField(data.username, session.masterKey);
    const encryptedPassword = await encryptField(data.password, session.masterKey);
    const encryptedUrl = await encryptField(data.website, session.masterKey);

    const vaultsResponse = await fetch(`${API_URL}/rest/v1/safepass_vaults?select=id&limit=1`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${session.authToken}`,
      }
    });

    const vaults = await vaultsResponse.json();
    if (!vaults.length) {
      return { error: 'No vault found' };
    }

    const saveResponse = await fetch(`${API_URL}/rest/v1/safepass_entries`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
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

    await syncVaultFromSupabase();
    return { success: true };
  } catch (error) {
    console.error('[SafePass] Save password error:', error);
    return { error: error.message };
  }
}

// Handle ignoring credentials for a site
async function handleIgnoreCredential(data) {
  try {
    const stored = await chrome.storage.local.get('ignoredCredentials');
    const ignored = stored.ignoredCredentials || [];
    
    // Add to ignored list
    const key = `${data.website}:${data.username}`;
    if (!ignored.includes(key)) {
      ignored.push(key);
      await chrome.storage.local.set({ ignoredCredentials: ignored });
    }
    
    return { success: true };
  } catch (error) {
    console.error('[SafePass] Ignore credential error:', error);
    return { error: error.message };
  }
}

async function handleSaveNote(data) {
  try {
    const session = await chrome.storage.session.get(['masterKey', 'authToken']);
    if (!session.masterKey || !session.authToken) {
      return { error: 'Not authenticated' };
    }

    const encryptedContent = await encryptField(data.content, session.masterKey);

    const response = await fetch(`${API_URL}/rest/v1/safepass_notes`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${session.authToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        title: data.title,
        encrypted_content: encryptedContent
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save note');
    }

    await fetchSecureNotes(session.authToken);
    return { success: true };
  } catch (error) {
    console.error('[SafePass] Save note error:', error);
    return { error: error.message };
  }
}

async function handleSaveCard(data) {
  try {
    const session = await chrome.storage.session.get(['masterKey', 'authToken']);
    if (!session.masterKey || !session.authToken) {
      return { error: 'Not authenticated' };
    }

    const cardData = {
      number: data.cardNumber,
      expiry: data.expiry,
      cvv: data.cvv,
      zip: data.zip
    };

    const encryptedData = await encryptField(JSON.stringify(cardData), session.masterKey);

    const response = await fetch(`${API_URL}/rest/v1/safepass_cards`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${session.authToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        holder_name: data.holderName,
        last_four: data.cardNumber.slice(-4),
        encrypted_data: encryptedData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save card');
    }

    await fetchCreditCards(session.authToken);
    return { success: true };
  } catch (error) {
    console.error('[SafePass] Save card error:', error);
    return { error: error.message };
  }
}

// ===== BREACH CHECK =====
async function handleBreachCheck(passwordHash) {
  try {
    const session = await chrome.storage.session.get(['authToken']);
    if (!session.authToken) {
      return { error: 'Not authenticated' };
    }

    const response = await fetch(`${FUNCTIONS_URL}/safepass-breach-check`, {
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

// ===== ALARMS =====
chrome.alarms.create('dailyBreachCheck', { periodInMinutes: 24 * 60 });
chrome.alarms.create('periodicSync', { periodInMinutes: 5 }); // Sync every 5 minutes via alarm

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicSync') {
    const session = await chrome.storage.session.get(['unlocked', 'authToken']);
    if (session.unlocked && session.authToken) {
      console.log('[SafePass] Periodic sync alarm triggered');
      await syncVaultFromSupabase();
    }
  }
  
  if (alarm.name === 'dailyBreachCheck') {
    console.log('[SafePass] Running daily breach check');
    
    const session = await chrome.storage.session.get(['authToken']);
    if (!session.authToken) return;
    
    try {
      const response = await fetch(`${FUNCTIONS_URL}/safepass-breach-check`, {
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
          title: '⚠️ Security Alert',
          message: `${result.breached_entries} of your passwords may have been compromised.`,
          priority: 2
        });
      }
    } catch (e) {
      console.error('[SafePass] Daily breach check failed:', e);
    }
  }
});

// ===== PASSWORD GENERATOR SETTINGS =====
async function getGeneratorSettings() {
  const settings = await chrome.storage.local.get(['generatorSettings']);
  return settings.generatorSettings || {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    pronounceable: false,
    excludeAmbiguous: false
  };
}

async function saveGeneratorSettings(settings) {
  await chrome.storage.local.set({ generatorSettings: settings });
  return { success: true };
}

// ===== FORCE SYNC =====
async function forceFullSync() {
  syncInProgress = true;
  try {
    await syncVaultFromSupabase();
    return { success: true, timestamp: Date.now() };
  } finally {
    syncInProgress = false;
  }
}

// ===== Wrayth Ray side panel + chat relay =====
try {
  chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false }).catch(() => {});
} catch (_) {}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-ray') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.windowId != null) await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (e) { console.warn('[Wrayth] open-ray failed', e); }
  }
});

// Track latest page context per tab so the sidepanel can read instantly
const wraythContextByTab = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Cache page-context from content scripts
  if (message?.type === 'wrayth:page-context' && sender?.tab?.id != null) {
    wraythContextByTab.set(sender.tab.id, message.context);
    // No response needed; sidepanel listens via its own onMessage.
    return false;
  }

  // Open sidepanel on user gesture inside the page (via Context Bar click)
  if (message?.type === 'wrayth:open-sidepanel') {
    (async () => {
      try {
        const windowId = sender?.tab?.windowId;
        if (windowId != null) {
          await chrome.sidePanel.open({ windowId });
          sendResponse({ ok: true });
        } else {
          sendResponse({ ok: false, error: 'no-window' });
        }
      } catch (e) {
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();
    return true;
  }

  // Ray chat relay -> Lovable AI via the existing safeassist edge function
  if (message?.type === 'wrayth:chat') {
    (async () => {
      try {
        const session = await chrome.storage.session.get(['authToken']);
        const headers = {
          'Content-Type': 'application/json',
          apikey: API_KEY,
          Authorization: `Bearer ${session.authToken || API_KEY}`,
        };
        const sys = buildRaySystemPrompt(message.context);
        const body = JSON.stringify({
          messages: [{ role: 'system', content: sys }, ...(message.messages || [])],
          source: 'extension',
        });
        const resp = await fetch(`${FUNCTIONS_URL}/safeassist-ai`, { method: 'POST', headers, body }).catch(() => null);
        if (resp && resp.ok) {
          const data = await resp.json().catch(() => ({}));
          const text = data?.text || data?.message || data?.choices?.[0]?.message?.content;
          sendResponse({ ok: true, text: text || "I'm here, but I didn't catch a reply." });
          return;
        }
        // Fallback: local heuristic reply so the panel stays useful even offline
        sendResponse({ ok: true, text: localRayReply(message.context, message.messages) });
      } catch (e) {
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();
    return true;
  }

  return undefined;
});

function buildRaySystemPrompt(ctx) {
  const lines = [
    "You are Ray, the calm, JARVIS-like security teammate inside the Wrayth browser extension.",
    "Speak in short, plain sentences. Never alarm the user. Always offer a concrete next step.",
    "You can recommend actions inside Wrayth (Vault, Scan, Watch, Playbooks) and link with https://ultriumai.app/app/... paths.",
  ];
  if (ctx) {
    lines.push(`Current site: ${ctx.host} (${ctx.type}). HTTPS: ${ctx.signals?.isHTTPS ? 'yes' : 'no'}. Passkey support: ${ctx.signals?.passkeySupported ? 'yes' : 'no'}.`);
  }
  return lines.join('\n');
}

function localRayReply(ctx, msgs) {
  const last = msgs?.[msgs.length - 1]?.content || '';
  if (!ctx) return "I'm here. Open a website and I'll have more to say.";
  if (/passkey/i.test(last)) return `${ctx.host} ${ctx.signals?.passkeySupported ? 'supports passkeys — I recommend enrolling one.' : 'does not appear to support passkeys yet.'}`;
  if (/safe|trust|legit/i.test(last)) return `${ctx.host} ${ctx.signals?.isHTTPS ? 'is served over HTTPS.' : 'is NOT using HTTPS — I would not enter a password here.'}`;
  if (ctx.type === 'login') return `Looks like a sign-in page on ${ctx.host}. Want me to fill from your vault?`;
  return "I'm running in offline mode right now. I'll have more context once Wrayth reconnects.";
}

console.log('[SafePass] Background service worker v2.2 initialized');
// =====================================================================
// Wrayth 3.1 — Page-aware engine
// Domain trust, password intelligence, identity awareness, timeline sync
// =====================================================================

const WRAYTH_INTEL_TTL_MS = 60 * 60 * 1000; // 1 hour cache per host
const wraythIntelCache = new Map(); // host -> { intel, expires }
const wraythLastIntelByTab = new Map(); // tabId -> host (for de-dupe)
const wraythBrowsingMemory = []; // session memory (rolling 50 events)

function wraythRememberEvent(evt) {
  wraythBrowsingMemory.push({ t: Date.now(), ...evt });
  if (wraythBrowsingMemory.length > 50) wraythBrowsingMemory.shift();
  try { chrome.storage.session.set({ wraythMemory: wraythBrowsingMemory.slice(-50) }); } catch (_) {}
}

async function wraythFetchDomainIntel(host, isHTTPS) {
  const key = host.toLowerCase().replace(/^www\./, '');
  const hit = wraythIntelCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.intel;
  try {
    const resp = await fetch(`${FUNCTIONS_URL}/wrayth-domain-intel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ host: key, https: !!isHTTPS }),
    });
    if (!resp.ok) return null;
    const intel = await resp.json();
    wraythIntelCache.set(key, { intel, expires: Date.now() + WRAYTH_INTEL_TTL_MS });
    return intel;
  } catch (_) { return null; }
}

async function wraythAnalyzeTab(tabId, url) {
  try {
    if (!url || !/^https?:/i.test(url)) return;
    const u = new URL(url);
    const host = u.hostname;
    if (wraythLastIntelByTab.get(tabId) === host) return; // already analyzed
    wraythLastIntelByTab.set(tabId, host);
    const intel = await wraythFetchDomainIntel(host, u.protocol === 'https:');
    if (!intel) return;
    try { await chrome.tabs.sendMessage(tabId, { type: 'wrayth:domain-intel', intel }); } catch (_) {}
    // Timeline: visited suspicious site
    if (intel.level === 'danger') {
      wraythRememberEvent({ kind: 'visited_suspicious', host, headline: intel.headline });
      wraythSyncTimeline({
        event_type: 'browser.visited_suspicious',
        summary: `Visited a high-risk site (${host}).`,
        severity: 'warning',
        payload: { host, intel: { level: intel.level, typosquatOf: intel.typosquatOf, score: intel.score } },
      });
    } else {
      wraythRememberEvent({ kind: 'visited', host, level: intel.level });
    }
  } catch (e) { console.warn('[Wrayth] analyze tab failed', e); }
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== 'complete') return;
  wraythAnalyzeTab(tabId, tab?.url);
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    wraythLastIntelByTab.delete(tabId);
    if (tab?.url) wraythAnalyzeTab(tabId, tab.url);
  } catch (_) {}
});

// ---- Password intelligence ----
async function wraythPasswordIntel({ host, username, pageType, passkeySupported, tabId }) {
  const intel = {
    host,
    username: username || null,
    savedCount: 0,
    reused: false,
    weak: false,
    passkeySupported: !!passkeySupported,
    identityMonitored: false,
    identityBreached: false,
    breachCount: 0,
  };
  try {
    // 1) Saved credentials for this site
    const match = await getPasswordsForSite(host).catch(() => ({ entries: [] }));
    if (match?.entries?.length) {
      intel.savedCount = match.entries.length;
      intel.weak = match.entries.some((e) => e.isWeak);
    }

    // 2) Identity monitoring (best-effort against ray_profiles via REST)
    const session = await chrome.storage.session.get(['authToken']);
    if (session.authToken && username && /@/.test(username)) {
      try {
        const r = await fetch(`${API_URL}/rest/v1/safepass_breach_database?email=eq.${encodeURIComponent(username.toLowerCase())}&select=email,breach_name,breach_date&limit=5`, {
          headers: { apikey: API_KEY, Authorization: `Bearer ${session.authToken}` },
        });
        if (r.ok) {
          const rows = await r.json();
          if (Array.isArray(rows) && rows.length) {
            intel.identityMonitored = true;
            intel.identityBreached = true;
            intel.breachCount = rows.length;
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  try { await chrome.tabs.sendMessage(tabId, { type: 'wrayth:password-intel', intel }); } catch (_) {}
  // Timeline note (non-noisy)
  if (pageType === 'login' && intel.savedCount === 0) {
    wraythRememberEvent({ kind: 'password_focus_new_site', host });
  }
  if (intel.identityBreached) {
    wraythRememberEvent({ kind: 'breach_seen', host, count: intel.breachCount });
  }
  return intel;
}

// ---- Timeline sync (best-effort) ----
async function wraythSyncTimeline({ event_type, summary, severity = 'info', payload = {} }) {
  try {
    const session = await chrome.storage.session.get(['authToken']);
    if (!session.authToken) return;
    await fetch(`${API_URL}/rest/v1/ray_timeline`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${session.authToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ event_type, summary, severity, payload, source: 'extension' }),
    });
  } catch (_) {}
}

// ---- Extra message handlers ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'wrayth:password-field-focus') {
    const tabId = sender?.tab?.id;
    if (tabId != null) {
      wraythPasswordIntel({ ...message, tabId }).catch(() => {});
    }
    return false;
  }
  if (message?.type === 'wrayth:get-domain-intel') {
    (async () => {
      const host = message.host || (sender?.tab?.url ? new URL(sender.tab.url).hostname : null);
      const intel = host ? await wraythFetchDomainIntel(host, true) : null;
      sendResponse({ ok: !!intel, intel });
    })();
    return true;
  }
  if (message?.type === 'wrayth:get-memory') {
    sendResponse({ ok: true, memory: wraythBrowsingMemory.slice(-15) });
    return false;
  }
  if (message?.type === 'wrayth:timeline-event') {
    wraythSyncTimeline(message.event || {}).catch(() => {});
    wraythRememberEvent({ kind: 'logged', ...(message.event || {}) });
    return false;
  }
  return undefined;
});
