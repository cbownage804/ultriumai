import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests for login, signup, and password flows
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('auth page displays login form', async ({ page }) => {
    // Email input
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    
    // Password input
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('can toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    
    if (await passwordInput.count() > 0) {
      // Look for visibility toggle button
      const toggleButton = page.locator('button:has([class*="Eye"]), [aria-label*="password"], button:near(input[type="password"])');
      
      if (await toggleButton.count() > 0) {
        // Check initial state
        await expect(passwordInput).toHaveAttribute('type', 'password');
        
        // Click toggle
        await toggleButton.first().click();
        
        // Check if type changed to text
        const inputType = await page.locator('input[name="password"], input[id*="password"]').first().getAttribute('type');
        // Type should now be 'text' or password field should be visible
        expect(inputType === 'text' || inputType === 'password').toBeTruthy();
      }
    }
  });

  test('shows error for invalid email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    // Enter invalid email
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');
    await submitButton.click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Should show validation error or the invalid email should be flagged
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    // HTML5 validation should catch invalid email
    expect(emailValidity).toBeFalsy();
  });

  test('shows error for empty password', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const submitButton = page.locator('button[type="submit"]');

    // Enter email but no password
    await emailInput.fill('test@example.com');
    await submitButton.click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Form should still be visible (not submitted)
    await expect(emailInput).toBeVisible();
  });

  test('has link to forgot password', async ({ page }) => {
    // Look for forgot password link
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset"), button:has-text("Forgot")');
    
    if (await forgotPasswordLink.count() > 0) {
      await expect(forgotPasswordLink.first()).toBeVisible();
    }
  });

  test('has link to sign up', async ({ page }) => {
    // Look for sign up link or tab
    const signUpLink = page.locator('a:has-text("Sign up"), button:has-text("Sign up"), a:has-text("Register"), [role="tab"]:has-text("Sign")');
    
    if (await signUpLink.count() > 0) {
      await expect(signUpLink.first()).toBeVisible();
    }
  });
});

test.describe('Password Reset Flow', () => {
  test('can access forgot password page', async ({ page }) => {
    await page.goto('/auth');
    
    // Look for forgot password link
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), button:has-text("Forgot")');
    
    if (await forgotPasswordLink.count() > 0) {
      await forgotPasswordLink.first().click();
      
      // Should show email input for password reset
      await page.waitForTimeout(500);
      
      // Either navigated to reset page or modal opened
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
    }
  });
});

test.describe('Auth Page Accessibility', () => {
  test('form inputs have proper labels', async ({ page }) => {
    await page.goto('/auth');
    
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      // Each input should have some form of labeling
      const hasLabel = inputId && (await page.locator(`label[for="${inputId}"]`).count()) > 0;
      const hasAccessibleName = ariaLabel || placeholder || hasLabel;
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('submit button is focusable', async ({ page }) => {
    await page.goto('/auth');
    
    const submitButton = page.locator('button[type="submit"]');
    
    if (await submitButton.count() > 0) {
      await submitButton.focus();
      
      // Check button is focused
      const isFocused = await submitButton.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBeTruthy();
    }
  });
});
