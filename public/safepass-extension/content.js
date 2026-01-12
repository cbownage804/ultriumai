// SafePass Content Script - Autofill functionality

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fill') {
    fillCredentials(message.username, message.password);
    sendResponse({ success: true });
  } else if (message.action === 'fillPassword') {
    fillPasswordField(message.password);
    sendResponse({ success: true });
  }
  return true;
});

// Fill username and password fields
function fillCredentials(username, password) {
  const usernameFields = findUsernameFields();
  const passwordFields = findPasswordFields();

  if (usernameFields.length > 0) {
    fillField(usernameFields[0], username);
  }

  if (passwordFields.length > 0) {
    fillField(passwordFields[0], password);
  }
}

// Fill just password field (for generated passwords)
function fillPasswordField(password) {
  const passwordFields = findPasswordFields();
  
  // Also check for new password fields
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
  
  // Clear existing value
  field.value = '';
  
  // Set new value
  field.value = value;

  // Trigger input events for React/Vue/Angular apps
  const inputEvent = new Event('input', { bubbles: true });
  field.dispatchEvent(inputEvent);

  const changeEvent = new Event('change', { bubbles: true });
  field.dispatchEvent(changeEvent);

  // Some frameworks need these
  const keydownEvent = new KeyboardEvent('keydown', { bubbles: true });
  field.dispatchEvent(keydownEvent);

  const keyupEvent = new KeyboardEvent('keyup', { bubbles: true });
  field.dispatchEvent(keyupEvent);

  field.blur();
}

// Add SafePass icon to login fields
function addSafePassIcons() {
  const usernameFields = findUsernameFields();
  const passwordFields = findPasswordFields();
  
  [...usernameFields, ...passwordFields].forEach(field => {
    if (field.dataset.safepassIcon) return; // Already has icon
    
    field.dataset.safepassIcon = 'true';
    
    // Create icon container
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'safepass-icon-wrapper';
    iconWrapper.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="safepass-icon">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    `;
    
    iconWrapper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Open popup
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });

    // Position the icon
    const fieldRect = field.getBoundingClientRect();
    const parent = field.parentElement;
    
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    
    if (parent) {
      parent.appendChild(iconWrapper);
    }
  });
}

// Initialize
function init() {
  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSafePassIcons);
  } else {
    addSafePassIcons();
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
      setTimeout(addSafePassIcons, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

init();
