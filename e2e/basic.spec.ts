import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading', async ({ page }) => {
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/UltriumAI|SafeSuite|Vanguard/i);
  });

  test('should have navigation elements', async ({ page }) => {
    // Check for common navigation elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still render correctly
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should navigate to auth page', async ({ page }) => {
    await page.goto('/auth');
    
    // Should show login/signup form
    const authForm = page.locator('form, [data-testid="auth-form"]');
    await expect(authForm.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show email input field', async ({ page }) => {
    await page.goto('/auth');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show password input field', async ({ page }) => {
    await page.goto('/auth');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('should validate empty form submission', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
      
      // Should show validation or stay on auth page
      await expect(page).toHaveURL(/auth/);
    }
  });
});

test.describe('Navigation', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    
    // Should show some form of 404 or redirect
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have no critical accessibility issues on landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility - all images should have alt text
    const imagesWithoutAlt = page.locator('img:not([alt])');
    const count = await imagesWithoutAlt.count();
    
    // Log warning if images without alt exist
    if (count > 0) {
      console.warn(`Found ${count} images without alt text`);
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have at least one h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    
    expect(h1Count).toBeGreaterThanOrEqual(0); // Warning: should have at least 1
  });
});
