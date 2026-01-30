import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Utilities
 * Common helper functions for Playwright tests
 */

/**
 * Wait for network to be idle (no pending requests)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Login helper - uses test credentials
 * Note: Requires test user to be set up in the database
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth');
  
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"]', password);
  
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL(/dashboard|\/$/);
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Look for logout button or user menu
  const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Sign Out"), button:has-text("Logout")');
  
  if (await userMenu.count() > 0) {
    await userMenu.first().click();
    
    const signOutButton = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out")');
    if (await signOutButton.count() > 0) {
      await signOutButton.first().click();
    }
  }
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  const box = await element.boundingBox();
  
  if (!box) return false;
  
  const viewport = page.viewportSize();
  if (!viewport) return false;
  
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height
  );
}

/**
 * Screenshot helper with timestamped filename
 */
export async function takeNamedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `e2e/screenshots/${name}-${timestamp}.png` });
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, text?: string) {
  const toastSelector = '[data-sonner-toast], [role="alert"], .toast';
  
  if (text) {
    await page.locator(toastSelector).filter({ hasText: text }).waitFor({ timeout: 5000 });
  } else {
    await page.locator(toastSelector).first().waitFor({ timeout: 5000 });
  }
}

/**
 * Fill form field with label
 */
export async function fillFieldByLabel(page: Page, label: string, value: string) {
  const labelElement = page.locator(`label:has-text("${label}")`);
  const input = labelElement.locator('~ input, ~ textarea, + input, + textarea');
  
  if (await input.count() > 0) {
    await input.first().fill(value);
  } else {
    // Try finding by associated id
    const forAttr = await labelElement.getAttribute('for');
    if (forAttr) {
      await page.locator(`#${forAttr}`).fill(value);
    }
  }
}

// Test fixtures
test.describe('Test Utilities', () => {
  test('utilities module exports correctly', () => {
    expect(typeof waitForNetworkIdle).toBe('function');
    expect(typeof login).toBe('function');
    expect(typeof logout).toBe('function');
    expect(typeof isInViewport).toBe('function');
    expect(typeof takeNamedScreenshot).toBe('function');
    expect(typeof waitForToast).toBe('function');
    expect(typeof fillFieldByLabel).toBe('function');
  });
});
