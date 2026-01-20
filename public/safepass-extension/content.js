// SafePass Content Script - Autofill with inline dropdown
// Compatible with Chrome and Microsoft Edge

let dropdownVisible = false;
let currentDropdown = null;
let currentField = null;
let matchingPasswords = [];

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fill') {
    fillCredentials(message.username, message.password);
    sendResponse({ success: true });
  } else if (message.action === 'fillPassword') {
    fillPasswordField(message.password);
    sendResponse({ success: true });
  } else if (message.action === 'showDropdown') {
    showInlineDropdown(message.entries, message.field);
    sendResponse({ success: true });
  }
  return true;
});

// Fill username and password fields
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
  showNotification('Credentials filled!');
}

// Fill just password field
function fillPasswordField(password) {
  const passwordFields = findPasswordFields();
  const newPasswordFields = document.querySelectorAll('input[autocomplete="new-password"]');
  
  const allFields = [...passwordFields, ...newPasswordFields];
  
  if (allFields.length > 0) {
    fillField(allFields[0], password);
  }
}

// Find username/email input fields
function findUsernameFields() {
  const selectors = [
    'input[type="email"]',
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][name*="login"]',
    'input[type="text"][id*="user"]',
    'input[type="text"][id*="email"]',
    'input[type="text"][id*="login"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
  ];

  for (const selector of selectors) {
    const fields = document.querySelectorAll(selector);
    if (fields.length > 0) {
      return Array.from(fields).filter(isVisible);
    }
  }

  return [];
}

// Find password input fields
function findPasswordFields() {
  const fields = document.querySelectorAll('input[type="password"]');
  return Array.from(fields).filter(isVisible);
}

// Check if element is visible
function isVisible(element) {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.offsetParent !== null
  );
}

// Fill a field with value and trigger events
function fillField(field, value) {
  field.focus();
  field.value = '';
  field.value = value;

  // Trigger events for React/Vue/Angular
  const inputEvent = new Event('input', { bubbles: true });
  field.dispatchEvent(inputEvent);

  const changeEvent = new Event('change', { bubbles: true });
  field.dispatchEvent(changeEvent);

  field.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
  field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

  field.blur();
}

// Show inline autofill dropdown
function showInlineDropdown(entries, targetField) {
  hideDropdown();
  
  if (!entries || entries.length === 0) return;
  
  const field = targetField || currentField;
  if (!field) return;
  
  matchingPasswords = entries;
  
  const dropdown = document.createElement('div');
  dropdown.className = 'safepass-dropdown';
  dropdown.id = 'safepass-autofill-dropdown';
  
  // Header
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
    item.className = 'safepass-dropdown-item';
    item.dataset.index = index;
    item.dataset.id = entry.id;
    
    item.innerHTML = `
      <div class="safepass-dropdown-favicon">${entry.is_favorite ? '⭐' : '🔐'}</div>
      <div class="safepass-dropdown-details">
        <div class="safepass-dropdown-site">${escapeHtml(entry.title)}</div>
        <div class="safepass-dropdown-username">${escapeHtml(entry.username || 'No username')}</div>
      </div>
    `;
    
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await fillFromEntry(entry);
    });
    
    dropdown.appendChild(item);
  });
  
  // Position dropdown below the field
  const rect = field.getBoundingClientRect();
  dropdown.style.position = 'fixed';
  dropdown.style.top = `${rect.bottom + 4}px`;
  dropdown.style.left = `${rect.left}px`;
  dropdown.style.width = `${Math.max(rect.width, 280)}px`;
  dropdown.style.zIndex = '2147483647';
  
  document.body.appendChild(dropdown);
  currentDropdown = dropdown;
  dropdownVisible = true;
  
  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
  }, 100);
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

// Fill credentials from a saved entry
async function fillFromEntry(entry) {
  try {
    // Request decrypted password from background script
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
    // Fallback: just fill username
    const usernameFields = findUsernameFields();
    if (usernameFields.length > 0 && entry.username) {
      fillField(usernameFields[0], entry.username);
    }
    showNotification('Filled username only', 'warning');
  }
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show notification toast
function showNotification(message, type = 'success') {
  // Remove existing notifications
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

// Add SafePass icons to login fields and handle focus
function initializeFields() {
  const usernameFields = findUsernameFields();
  const passwordFields = findPasswordFields();
  
  [...usernameFields, ...passwordFields].forEach(field => {
    if (field.dataset.safepassInitialized) return;
    
    field.dataset.safepassInitialized = 'true';
    
    // Add icon wrapper
    addSafePassIcon(field);
    
    // Show dropdown on focus if we have matching passwords
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
    await checkForMatchingPasswords();
  });

  // Position the icon inside the field
  const parent = field.parentElement;
  if (parent) {
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.appendChild(iconWrapper);
  }
}

// Check for matching passwords and show dropdown
async function checkForMatchingPasswords() {
  try {
    const hostname = window.location.hostname.replace(/^www\./, '');
    
    const response = await chrome.runtime.sendMessage({
      action: 'getPasswordsForSite',
      hostname: hostname
    });
    
    if (response.needsAuth) {
      showNotification('Please unlock SafePass first', 'warning');
      return;
    }
    
    if (response.entries && response.entries.length > 0) {
      showInlineDropdown(response.entries, currentField);
    }
  } catch (error) {
    console.error('[SafePass] Error checking passwords:', error);
  }
}

// Detect new password forms (for auto-save)
function detectNewPasswordForm() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    if (form.dataset.safepassWatched) return;
    form.dataset.safepassWatched = 'true';
    
    form.addEventListener('submit', async (e) => {
      const passwordField = form.querySelector('input[type="password"]');
      const usernameField = form.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[autocomplete="username"]');
      
      if (passwordField && usernameField && passwordField.value && usernameField.value) {
        // Automatically save password to vault
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
  
  // Also watch for password fields with change events (for single-page apps)
  const passwordFields = document.querySelectorAll('input[type="password"]');
  passwordFields.forEach(field => {
    if (field.dataset.safepassAutoSave) return;
    field.dataset.safepassAutoSave = 'true';
    
    // Track the current value to detect actual password entry
    let lastValue = '';
    
    field.addEventListener('blur', async () => {
      if (field.value && field.value !== lastValue && field.value.length >= 6) {
        lastValue = field.value;
        
        // Find associated username field
        const form = field.closest('form');
        const container = form || field.parentElement?.parentElement?.parentElement;
        const usernameField = container?.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[autocomplete="username"]');
        
        if (usernameField && usernameField.value) {
          // Attempt auto-save on blur
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

// Initialize
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

  // Watch for dynamically added forms
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

console.log('[SafePass] Content script loaded');
