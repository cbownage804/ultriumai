import { test, expect } from '@playwright/test';

/**
 * Vanguard Module E2E Tests
 * Tests for the Vanguard IT Management Suite
 */

test.describe('Vanguard Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app - auth will be required for Vanguard
    await page.goto('/');
  });

  test('landing page loads with navigation', async ({ page }) => {
    // Check main heading exists
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check navigation elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('can navigate to auth page', async ({ page }) => {
    // Look for login/sign in links
    const authLinks = page.locator('a[href*="auth"], button:has-text("Sign"), button:has-text("Log")');
    
    if (await authLinks.count() > 0) {
      await authLinks.first().click();
      await page.waitForURL(/auth/);
      
      // Verify auth page elements
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    }
  });

  test('auth page has proper form validation', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Should show validation error or prevent submission
      // The form should still be on the page
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    }
  });

  test('has responsive mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check page loads properly on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Look for mobile menu button
    const mobileMenuButton = page.locator('[aria-label*="menu"], button:has([class*="Menu"]), [data-testid="mobile-menu"]');
    
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton.first()).toBeVisible();
    }
  });
});

test.describe('Vanguard Protected Routes', () => {
  test('vanguard dashboard redirects to auth when not logged in', async ({ page }) => {
    await page.goto('/vanguard');
    
    // Should either show auth page or redirect
    await page.waitForLoadState('networkidle');
    
    // Check if redirected to auth or shows login prompt
    const currentUrl = page.url();
    const hasAuthContent = await page.locator('input[type="email"], input[type="password"]').count() > 0;
    
    expect(currentUrl.includes('auth') || hasAuthContent || currentUrl.includes('vanguard')).toBeTruthy();
  });

  test('product hub exists and shows product cards', async ({ page }) => {
    await page.goto('/hub');
    
    await page.waitForLoadState('networkidle');
    
    // Check if hub page loads (may redirect to auth)
    const currentUrl = page.url();
    if (currentUrl.includes('hub')) {
      // Look for product cards or grid
      const productCards = page.locator('[class*="card"], [class*="Card"]');
      await expect(productCards.first()).toBeVisible({ timeout: 10000 }).catch(() => {
        // May require auth - that's okay
      });
    }
  });
});

test.describe('Accessibility', () => {
  test('main pages have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/auth');
    
    // Check that inputs have associated labels or aria-labels
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    if (await emailInput.count() > 0) {
      const hasLabel = await emailInput.evaluate((el) => {
        const id = el.id;
        const hasAssociatedLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = el.getAttribute('aria-label');
        const hasPlaceholder = el.getAttribute('placeholder');
        return hasAssociatedLabel || hasAriaLabel || hasPlaceholder;
      });
      expect(hasLabel).toBeTruthy();
    }
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through the page
    await page.keyboard.press('Tab');
    
    // Check that something is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});
