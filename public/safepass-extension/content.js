// SafePass Content Script v2.0
// Enhanced with keyboard shortcuts, card autofill, and improved detection

let dropdownVisible = false;
let currentDropdown = null;
let currentField = null;
let matchingPasswords = [];

// ===== MESSAGE LISTENERS =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'fill':
      fillCredentials(message.username, message.password);
      sendResponse({ success: true });
      break;
    case 'fillPassword':
      fillPasswordField(message.password);
      sendResponse({ success: true });
      break;
    case 'fillCard':
      fillCreditCard(message.card);
      sendResponse({ success: true });
      break;
    case 'showDropdown':
      showInlineDropdown(message.entries, message.field);
      sendResponse({ success: true });
      break;
    case 'showAllPasswords':
      checkForMatchingPasswords(true);
      sendResponse({ success: true });
      break;
  }
  return true;
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  // Escape to close dropdown
  if (e.key === 'Escape' && dropdownVisible) {
    hideDropdown();
    return;
  }
  
  // Arrow keys to navigate dropdown
  if (dropdownVisible && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    navigateDropdown(e.key === 'ArrowDown' ? 1 : -1);
    return;
  }
  
  // Enter to select
  if (dropdownVisible && e.key === 'Enter') {
    const selected = currentDropdown?.querySelector('.safepass-dropdown-item.selected');
    if (selected) {
      e.preventDefault();
      selected.click();
    }
  }
});

function navigateDropdown(direction) {
  if (!currentDropdown) return;
  
  const items = currentDropdown.querySelectorAll('.safepass-dropdown-item');
  let currentIndex = -1;
  
  items.forEach((item, index) => {
    if (item.classList.contains('selected')) {
      currentIndex = index;
      item.classList.remove('selected');
    }
  });
  
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = items.length - 1;
  if (newIndex >= items.length) newIndex = 0;
  
  items[newIndex]?.classList.add('selected');
}

// ===== FILL FUNCTIONS =====
function fillCredentials(username, password) {
  const usernameFields = findUsernameFields();
  const passwordFields = findPasswordFields();

  if (usernameFields.length > 0 && username) {
    fillField(usernameFields[0], username);
  }

  if (passwordFields.length > 0 && password) {
    fillField(passwordFields[0], password);
  }
  
  hideDropdown();
  showNotification('✅ Credentials filled!');
}

function fillPasswordField(password) {
  const passwordFields = findPasswordFields();
  const newPasswordFields = document.querySelectorAll('input[autocomplete="new-password"]');
  
  const allFields = [...passwordFields, ...newPasswordFields];
  
  if (allFields.length > 0) {
    fillField(allFields[0], password);
    showNotification('🔐 Password filled!');
  }
}

function fillCreditCard(card) {
  // Find card fields
  const numberField = document.querySelector('input[autocomplete="cc-number"], input[name*="card"], input[name*="number"], input[id*="card"]');
  const nameField = document.querySelector('input[autocomplete="cc-name"], input[name*="holder"], input[name*="name"]');
  const expiryField = document.querySelector('input[autocomplete="cc-exp"], input[name*="expir"], input[name*="exp"]');
  const cvvField = document.querySelector('input[autocomplete="cc-csc"], input[name*="cvv"], input[name*="cvc"], input[name*="security"]');
  const zipField = document.querySelector('input[autocomplete="billing postal-code"], input[name*="zip"], input[name*="postal"]');
  
  if (numberField && card.number) fillField(numberField, card.number);
  if (nameField && card.holderName) fillField(nameField, card.holderName);
  if (expiryField && card.expiry) fillField(expiryField, card.expiry);
  if (cvvField && card.cvv) fillField(cvvField, card.cvv);
  if (zipField && card.zip) fillField(zipField, card.zip);
  
  showNotification('💳 Card details filled!');
}

// ===== FIELD DETECTION =====
function findUsernameFields() {
  const selectors = [
    'input[type="email"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][name*="login"]',
    'input[type="text"][id*="user"]',
    'input[type="text"][id*="email"]',
    'input[type="text"][id*="login"]',
  ];

  for (const selector of selectors) {
    const fields = document.querySelectorAll(selector);
    if (fields.length > 0) {
      return Array.from(fields).filter(isVisible);
    }
  }

  return [];
}

function findPasswordFields() {
  const fields = document.querySelectorAll('input[type="password"]');
  return Array.from(fields).filter(isVisible);
}

function isVisible(element) {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.offsetParent !== null
  );
}

function fillField(field, value) {
  field.focus();
  field.value = '';
  field.value = value;

  // Trigger events for frameworks
  const inputEvent = new Event('input', { bubbles: true });
  field.dispatchEvent(inputEvent);

  const changeEvent = new Event('change', { bubbles: true });
  field.dispatchEvent(changeEvent);

  field.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
  field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

  field.blur();
}

// ===== DROPDOWN UI =====
function showInlineDropdown(entries, targetField) {
  hideDropdown();
  
  if (!entries || entries.length === 0) return;
  
  const field = targetField || currentField;
  if (!field) return;
  
  matchingPasswords = entries;
  
  const dropdown = document.createElement('div');
  dropdown.className = 'safepass-dropdown';
  dropdown.id = 'safepass-autofill-dropdown';
  
  // Header with count
  const header = document.createElement('div');
  header.className = 'safepass-dropdown-header';
  header.innerHTML = `
    <span>🔐 SafePass</span>
    <span style="float:right;font-size:10px;opacity:0.7">${entries.length} saved</span>
  `;
  dropdown.appendChild(header);
  
  // Password items
  entries.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'safepass-dropdown-item' + (index === 0 ? ' selected' : '');
    item.dataset.index = index;
    item.dataset.id = entry.id;
    
    // Get favicon
    const hostname = extractHostname(entry.website);
    const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : null;
    
    let badges = '';
    if (entry.isBreached) badges += '<span class="safepass-badge breach">⚠️</span>';
    if (entry.isWeak) badges += '<span class="safepass-badge weak">⚠️</span>';
    
    item.innerHTML = `
      <div class="safepass-dropdown-favicon">
        ${faviconUrl ? `<img src="${faviconUrl}" onerror="this.style.display='none';this.parentElement.textContent='🔐'" />` : '🔐'}
      </div>
      <div class="safepass-dropdown-details">
        <div class="safepass-dropdown-site">${escapeHtml(entry.title)}${badges}</div>
        <div class="safepass-dropdown-username">${escapeHtml(entry.username || 'No username')}</div>
      </div>
      <div class="safepass-dropdown-actions">
        <button class="safepass-action-btn" data-action="copy" title="Copy password">📋</button>
      </div>
    `;
    
    item.addEventListener('click', async (e) => {
      if (e.target.closest('.safepass-action-btn')) {
        e.preventDefault();
        e.stopPropagation();
        await copyPasswordFromEntry(entry);
      } else {
        e.preventDefault();
        e.stopPropagation();
        await fillFromEntry(entry);
      }
    });
    
    dropdown.appendChild(item);
  });
  
  // Footer with generate button
  const footer = document.createElement('div');
  footer.className = 'safepass-dropdown-footer';
  footer.innerHTML = `
    <button class="safepass-generate-btn">⚡ Generate New</button>
  `;
  footer.querySelector('.safepass-generate-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await generateAndFillNew();
  });
  dropdown.appendChild(footer);
  
  // Position dropdown
  const rect = field.getBoundingClientRect();
  dropdown.style.position = 'fixed';
  dropdown.style.top = `${rect.bottom + 4}px`;
  dropdown.style.left = `${rect.left}px`;
  dropdown.style.width = `${Math.max(rect.width, 300)}px`;
  dropdown.style.zIndex = '2147483647';
  
  document.body.appendChild(dropdown);
  currentDropdown = dropdown;
  dropdownVisible = true;
  
  // Event listeners
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
  }, 100);
}

async function generateAndFillNew() {
  const password = generateSecurePassword(16);
  fillPasswordField(password);
  hideDropdown();
  
  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(password);
    showNotification('🔐 New password generated and copied!');
  } catch {
    showNotification('🔐 New password generated!');
  }
}

function generateSecurePassword(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, x => chars[x % chars.length]).join('');
}

async function copyPasswordFromEntry(entry) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getDecryptedPassword',
      entryId: entry.id
    });
    
    if (response.password) {
      await navigator.clipboard.writeText(response.password);
      showNotification('🔑 Password copied!');
      hideDropdown();
    }
  } catch (error) {
    showNotification('Failed to copy', 'error');
  }
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

function handleClickOutside(e) {
  if (currentDropdown && !currentDropdown.contains(e.target) && e.target !== currentField) {
    hideDropdown();
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    hideDropdown();
  }
}

function hideDropdown() {
  if (currentDropdown) {
    currentDropdown.remove();
    currentDropdown = null;
  }
  dropdownVisible = false;
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
}

// ===== FILL FROM ENTRY =====
async function fillFromEntry(entry) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getDecryptedPassword',
      entryId: entry.id
    });
    
    if (response.error) {
      showNotification('Failed to decrypt password', 'error');
      return;
    }
    
    fillCredentials(entry.username, response.password);
  } catch (error) {
    console.error('[SafePass] Fill error:', error);
    const usernameFields = findUsernameFields();
    if (usernameFields.length > 0 && entry.username) {
      fillField(usernameFields[0], entry.username);
    }
    showNotification('Filled username only', 'warning');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'success') {
  document.querySelectorAll('.safepass-notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = 'safepass-notification';
  notification.style.background = type === 'error' 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : type === 'warning'
    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

// ===== FIELD INITIALIZATION =====
function initializeFields() {
  const usernameFields = findUsernameFields();
  const passwordFields = findPasswordFields();
  
  [...usernameFields, ...passwordFields].forEach(field => {
    if (field.dataset.safepassInitialized) return;
    
    field.dataset.safepassInitialized = 'true';
    
    addSafePassIcon(field);
    
    field.addEventListener('focus', async () => {
      currentField = field;
      await checkForMatchingPasswords();
    });
  });
}

function addSafePassIcon(field) {
  if (field.dataset.safepassIcon) return;
  
  field.dataset.safepassIcon = 'true';
  
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'safepass-icon-wrapper';
  iconWrapper.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="safepass-icon">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  `;
  
  iconWrapper.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    currentField = field;
    await checkForMatchingPasswords(true);
  });

  const parent = field.parentElement;
  if (parent) {
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.appendChild(iconWrapper);
  }
}

async function checkForMatchingPasswords(showAll = false) {
  try {
    const hostname = window.location.hostname.replace(/^www\./, '');
    
    const response = await chrome.runtime.sendMessage({
      action: 'getPasswordsForSite',
      hostname: showAll ? '' : hostname
    });
    
    if (response.needsAuth) {
      showNotification('Please unlock SafePass first', 'warning');
      return;
    }
    
    if (response.entries && response.entries.length > 0) {
      showInlineDropdown(response.entries, currentField);
    } else if (showAll) {
      showNotification('No passwords saved yet', 'info');
    }
  } catch (error) {
    console.error('[SafePass] Error checking passwords:', error);
  }
}

// ===== AUTO-SAVE =====
function detectNewPasswordForm() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    if (form.dataset.safepassWatched) return;
    form.dataset.safepassWatched = 'true';
    
    form.addEventListener('submit', async (e) => {
      const passwordField = form.querySelector('input[type="password"]');
      const usernameField = form.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[autocomplete="username"]');
      
      if (passwordField && usernameField && passwordField.value && usernameField.value) {
        try {
          const response = await chrome.runtime.sendMessage({
            action: 'savePassword',
            data: {
              website: window.location.hostname,
              username: usernameField.value,
              password: passwordField.value,
              title: document.title || window.location.hostname
            }
          });
          
          if (response.success) {
            showNotification('🔐 Password saved to SafePass!');
          } else if (response.error === 'Not authenticated') {
            showNotification('Unlock SafePass to save passwords', 'warning');
          }
        } catch (error) {
          console.error('[SafePass] Auto-save error:', error);
        }
      }
    });
  });
  
  // Watch password fields for SPA support
  const passwordFields = document.querySelectorAll('input[type="password"]');
  passwordFields.forEach(field => {
    if (field.dataset.safepassAutoSave) return;
    field.dataset.safepassAutoSave = 'true';
    
    let lastValue = '';
    
    field.addEventListener('blur', async () => {
      if (field.value && field.value !== lastValue && field.value.length >= 6) {
        lastValue = field.value;
        
        const form = field.closest('form');
        const container = form || field.parentElement?.parentElement?.parentElement;
        const usernameField = container?.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[autocomplete="username"]');
        
        if (usernameField && usernameField.value) {
          try {
            const response = await chrome.runtime.sendMessage({
              action: 'savePassword',
              data: {
                website: window.location.hostname,
                username: usernameField.value,
                password: field.value,
                title: document.title || window.location.hostname
              }
            });
            
            if (response.success) {
              showNotification('🔐 Password saved to SafePass!');
            }
          } catch (error) {
            console.error('[SafePass] Blur auto-save error:', error);
          }
        }
      }
    });
  });
}

// ===== INITIALIZATION =====
function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeFields();
      detectNewPasswordForm();
    });
  } else {
    initializeFields();
    detectNewPasswordForm();
  }

  // Watch for dynamic content
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }
    if (shouldCheck) {
      setTimeout(() => {
        initializeFields();
        detectNewPasswordForm();
      }, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

init();

console.log('[SafePass] Content script v2.0 loaded');