// Wrayth Vault Content Script v2.1
// Enhanced with keyboard shortcuts, card autofill, identity autofill, and improved detection

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
    case 'fillIdentity':
      fillIdentity(message.identity);
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
    const selected = currentDropdown?.querySelector('.wrayth-vault-dropdown-item.selected');
    if (selected) {
      e.preventDefault();
      selected.click();
    }
  }
});

function navigateDropdown(direction) {
  if (!currentDropdown) return;
  
  const items = currentDropdown.querySelectorAll('.wrayth-vault-dropdown-item');
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

function fillIdentity(identity) {
  // First name
  const firstNameField = document.querySelector(
    'input[autocomplete="given-name"], input[name*="first"][name*="name"], input[id*="first"][id*="name"], input[name="firstName"], input[name="fname"]'
  );
  
  // Last name
  const lastNameField = document.querySelector(
    'input[autocomplete="family-name"], input[name*="last"][name*="name"], input[id*="last"][id*="name"], input[name="lastName"], input[name="lname"]'
  );
  
  // Full name
  const fullNameField = document.querySelector(
    'input[autocomplete="name"], input[name="name"], input[name*="fullname"], input[id*="fullname"]'
  );
  
  // Email
  const emailField = document.querySelector(
    'input[type="email"], input[autocomplete="email"], input[name*="email"], input[id*="email"]'
  );
  
  // Phone
  const phoneField = document.querySelector(
    'input[type="tel"], input[autocomplete="tel"], input[name*="phone"], input[id*="phone"], input[name*="mobile"]'
  );
  
  // Address
  const addressField = document.querySelector(
    'input[autocomplete="street-address"], input[autocomplete="address-line1"], input[name*="address"], input[id*="address"], input[name*="street"]'
  );
  
  // City
  const cityField = document.querySelector(
    'input[autocomplete="address-level2"], input[name*="city"], input[id*="city"]'
  );
  
  // State/Province
  const stateField = document.querySelector(
    'input[autocomplete="address-level1"], input[name*="state"], input[id*="state"], input[name*="province"], select[name*="state"], select[name*="province"]'
  );
  
  // Zip/Postal code
  const zipField = document.querySelector(
    'input[autocomplete="postal-code"], input[name*="zip"], input[id*="zip"], input[name*="postal"]'
  );
  
  // Country
  const countryField = document.querySelector(
    'input[autocomplete="country"], input[name*="country"], input[id*="country"], select[name*="country"]'
  );
  
  let filledCount = 0;
  
  // Fill individual name fields
  if (firstNameField && identity.firstName) {
    fillField(firstNameField, identity.firstName);
    filledCount++;
  }
  if (lastNameField && identity.lastName) {
    fillField(lastNameField, identity.lastName);
    filledCount++;
  }
  
  // Fill full name if no individual fields
  if (fullNameField && (identity.firstName || identity.lastName) && !firstNameField && !lastNameField) {
    fillField(fullNameField, `${identity.firstName || ''} ${identity.lastName || ''}`.trim());
    filledCount++;
  }
  
  if (emailField && identity.email) {
    fillField(emailField, identity.email);
    filledCount++;
  }
  if (phoneField && identity.phone) {
    fillField(phoneField, identity.phone);
    filledCount++;
  }
  if (addressField && identity.address) {
    fillField(addressField, identity.address);
    filledCount++;
  }
  if (cityField && identity.city) {
    fillField(cityField, identity.city);
    filledCount++;
  }
  if (stateField && identity.state) {
    fillFieldOrSelect(stateField, identity.state);
    filledCount++;
  }
  if (zipField && identity.zip) {
    fillField(zipField, identity.zip);
    filledCount++;
  }
  if (countryField && identity.country) {
    fillFieldOrSelect(countryField, identity.country);
    filledCount++;
  }
  
  if (filledCount > 0) {
    showNotification(`📋 Identity filled! (${filledCount} fields)`);
  } else {
    showNotification('No matching form fields found', 'warning');
  }
}

function fillFieldOrSelect(element, value) {
  if (element.tagName === 'SELECT') {
    // Try to find matching option
    const options = element.querySelectorAll('option');
    for (const option of options) {
      if (option.value.toLowerCase() === value.toLowerCase() ||
          option.textContent.toLowerCase().includes(value.toLowerCase())) {
        element.value = option.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
  } else {
    fillField(element, value);
  }
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
  dropdown.className = 'wrayth-vault-dropdown';
  dropdown.id = 'wrayth-vault-autofill-dropdown';
  
  // Header with count
  const header = document.createElement('div');
  header.className = 'wrayth-vault-dropdown-header';
  header.innerHTML = `
    <span>🔐 Wrayth Vault</span>
    <span style="float:right;font-size:10px;opacity:0.7">${entries.length} saved</span>
  `;
  dropdown.appendChild(header);
  
  // Password items
  entries.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'wrayth-vault-dropdown-item' + (index === 0 ? ' selected' : '');
    item.dataset.index = index;
    item.dataset.id = entry.id;
    
    // Get favicon
    const hostname = extractHostname(entry.website);
    const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : null;
    
    let badges = '';
    if (entry.isBreached) badges += '<span class="wrayth-vault-badge breach">⚠️</span>';
    if (entry.isWeak) badges += '<span class="wrayth-vault-badge weak">⚠️</span>';
    
    item.innerHTML = `
      <div class="wrayth-vault-dropdown-favicon">
        ${faviconUrl ? `<img src="${faviconUrl}" onerror="this.style.display='none';this.parentElement.textContent='🔐'" />` : '🔐'}
      </div>
      <div class="wrayth-vault-dropdown-details">
        <div class="wrayth-vault-dropdown-site">${escapeHtml(entry.title)}${badges}</div>
        <div class="wrayth-vault-dropdown-username">${escapeHtml(entry.username || 'No username')}</div>
      </div>
      <div class="wrayth-vault-dropdown-actions">
        <button class="wrayth-vault-action-btn" data-action="copy" title="Copy password">📋</button>
      </div>
    `;
    
    item.addEventListener('click', async (e) => {
      if (e.target.closest('.wrayth-vault-action-btn')) {
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
  footer.className = 'wrayth-vault-dropdown-footer';
  footer.innerHTML = `
    <button class="wrayth-vault-generate-btn">⚡ Generate New</button>
  `;
  footer.querySelector('.wrayth-vault-generate-btn').addEventListener('click', async (e) => {
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
    console.error('[Wrayth Vault] Fill error:', error);
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
  document.querySelectorAll('.wrayth-vault-notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = 'wrayth-vault-notification';
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
    if (field.dataset.wrayth-vaultInitialized) return;
    
    field.dataset.wrayth-vaultInitialized = 'true';
    
    addWrayth VaultIcon(field);
    
    field.addEventListener('focus', async () => {
      currentField = field;
      await checkForMatchingPasswords();
    });
  });
}

function addWrayth VaultIcon(field) {
  if (field.dataset.wrayth-vaultIcon) return;
  
  field.dataset.wrayth-vaultIcon = 'true';
  
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'wrayth-vault-icon-wrapper';
  iconWrapper.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="wrayth-vault-icon">
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
      showNotification('Please unlock Wrayth Vault first', 'warning');
      return;
    }
    
    if (response.entries && response.entries.length > 0) {
      showInlineDropdown(response.entries, currentField);
    } else if (showAll) {
      showNotification('No passwords saved yet', 'info');
    }
  } catch (error) {
    console.error('[Wrayth Vault] Error checking passwords:', error);
  }
}

// ===== AUTO-SAVE =====
let pendingSave = null;
let savePromptVisible = false;

function showSavePrompt(data) {
  // Don't show if already visible or same credentials
  if (savePromptVisible) return;
  if (pendingSave && pendingSave.username === data.username && pendingSave.website === data.website) return;
  
  pendingSave = data;
  savePromptVisible = true;
  
  // Remove any existing prompts
  document.querySelectorAll('.wrayth-vault-save-prompt').forEach(p => p.remove());
  
  const prompt = document.createElement('div');
  prompt.className = 'wrayth-vault-save-prompt';
  prompt.innerHTML = `
    <div class="wrayth-vault-save-prompt-content">
      <div class="wrayth-vault-save-prompt-header">
        <span class="wrayth-vault-save-prompt-icon">🔐</span>
        <span class="wrayth-vault-save-prompt-title">Save to Wrayth Vault?</span>
        <button class="wrayth-vault-save-prompt-close" id="wrayth-vault-prompt-close">×</button>
      </div>
      <div class="wrayth-vault-save-prompt-body">
        <div class="wrayth-vault-save-prompt-site">${escapeHtml(data.title || data.website)}</div>
        <div class="wrayth-vault-save-prompt-username">${escapeHtml(data.username)}</div>
      </div>
      <div class="wrayth-vault-save-prompt-actions">
        <button class="wrayth-vault-save-prompt-btn wrayth-vault-save-prompt-btn-secondary" id="wrayth-vault-prompt-never">Never</button>
        <button class="wrayth-vault-save-prompt-btn wrayth-vault-save-prompt-btn-primary" id="wrayth-vault-prompt-save">Save Password</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(prompt);
  
  // Add event listeners
  document.getElementById('wrayth-vault-prompt-save')?.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'savePassword',
        data: pendingSave
      });
      
      if (response.success) {
        showNotification('🔐 Password saved to Wrayth Vault!');
      } else if (response.error === 'Not authenticated') {
        showNotification('Unlock Wrayth Vault to save passwords', 'warning');
      } else {
        showNotification('Failed to save password', 'error');
      }
    } catch (error) {
      console.error('[Wrayth Vault] Save error:', error);
      showNotification('Failed to save password', 'error');
    }
    hideSavePrompt();
  });
  
  document.getElementById('wrayth-vault-prompt-never')?.addEventListener('click', () => {
    // Store in ignored list
    chrome.runtime.sendMessage({
      action: 'ignoreCredential',
      data: { website: data.website, username: data.username }
    });
    hideSavePrompt();
  });
  
  document.getElementById('wrayth-vault-prompt-close')?.addEventListener('click', hideSavePrompt);
  
  // Auto-hide after 30 seconds
  setTimeout(() => {
    if (savePromptVisible) hideSavePrompt();
  }, 30000);
}

function hideSavePrompt() {
  document.querySelectorAll('.wrayth-vault-save-prompt').forEach(p => p.remove());
  savePromptVisible = false;
  pendingSave = null;
}

function captureCredentials(form) {
  const passwordField = form.querySelector('input[type="password"]');
  const usernameSelectors = [
    'input[type="email"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][name*="login"]',
    'input[type="text"][id*="user"]',
    'input[type="text"][id*="email"]',
    'input[type="text"][id*="login"]',
    'input[type="text"]' // Fallback to any text input
  ];
  
  let usernameField = null;
  for (const selector of usernameSelectors) {
    usernameField = form.querySelector(selector);
    if (usernameField && usernameField.value) break;
  }
  
  if (passwordField?.value && usernameField?.value && passwordField.value.length >= 4) {
    return {
      website: window.location.hostname,
      username: usernameField.value,
      password: passwordField.value,
      title: document.title || window.location.hostname
    };
  }
  return null;
}

function detectNewPasswordForm() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    if (form.dataset.wrayth-vaultWatched) return;
    form.dataset.wrayth-vaultWatched = 'true';
    
    // Listen for form submit
    form.addEventListener('submit', (e) => {
      const credentials = captureCredentials(form);
      if (credentials) {
        showSavePrompt(credentials);
      }
    });
    
    // Also watch for button clicks inside the form (for JS-based submissions)
    const buttons = form.querySelectorAll('button[type="submit"], button:not([type]), input[type="submit"]');
    buttons.forEach(button => {
      if (button.dataset.wrayth-vaultWatched) return;
      button.dataset.wrayth-vaultWatched = 'true';
      
      button.addEventListener('click', () => {
        // Delay to allow form validation
        setTimeout(() => {
          const credentials = captureCredentials(form);
          if (credentials) {
            showSavePrompt(credentials);
          }
        }, 100);
      });
    });
  });
  
  // Watch password fields for SPA support (blur + enter key)
  const passwordFields = document.querySelectorAll('input[type="password"]');
  passwordFields.forEach(field => {
    if (field.dataset.wrayth-vaultAutoSave) return;
    field.dataset.wrayth-vaultAutoSave = 'true';
    
    // Detect Enter key press in password field
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && field.value && field.value.length >= 4) {
        const form = field.closest('form');
        const container = form || field.parentElement?.parentElement?.parentElement?.parentElement;
        
        if (container) {
          const credentials = captureCredentials(container) || captureCredentialsFromContainer(container, field);
          if (credentials) {
            // Delay to allow form submission to complete
            setTimeout(() => showSavePrompt(credentials), 500);
          }
        }
      }
    });
  });
  
  // Watch for login buttons outside of forms (common in SPAs)
  const loginButtons = document.querySelectorAll('button');
  loginButtons.forEach(button => {
    const text = (button.textContent || '').toLowerCase();
    if ((text.includes('log in') || text.includes('login') || text.includes('sign in') || text.includes('signin')) &&
        !button.dataset.wrayth-vaultLoginWatch) {
      button.dataset.wrayth-vaultLoginWatch = 'true';
      
      button.addEventListener('click', () => {
        setTimeout(() => {
          // Find nearby password field
          const passwordFields = document.querySelectorAll('input[type="password"]');
          passwordFields.forEach(pwField => {
            if (pwField.value && pwField.value.length >= 4) {
              const container = pwField.closest('form') || pwField.closest('div[class*="form"]') || 
                               pwField.parentElement?.parentElement?.parentElement?.parentElement;
              if (container) {
                const credentials = captureCredentialsFromContainer(container, pwField);
                if (credentials) {
                  showSavePrompt(credentials);
                }
              }
            }
          });
        }, 200);
      });
    }
  });
}

function captureCredentialsFromContainer(container, passwordField) {
  const usernameSelectors = [
    'input[type="email"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][name*="login"]',
    'input[type="text"]'
  ];
  
  let usernameField = null;
  for (const selector of usernameSelectors) {
    usernameField = container.querySelector(selector);
    if (usernameField && usernameField.value && usernameField !== passwordField) break;
  }
  
  if (passwordField?.value && usernameField?.value) {
    return {
      website: window.location.hostname,
      username: usernameField.value,
      password: passwordField.value,
      title: document.title || window.location.hostname
    };
  }
  return null;
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

console.log('[Wrayth Vault] Content script v2.1 loaded');