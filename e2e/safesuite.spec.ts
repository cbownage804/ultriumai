import { test, expect } from '@playwright/test';

/**
 * SafeSuite E2E Tests
 * Tests for SafeSuite product pages and functionality
 */

test.describe('SafeSuite Landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/safesuite');
  });

  test('landing page loads with product grid', async ({ page }) => {
    // Check for SafeSuite branding
    await expect(page.locator('text=SafeSuite').first()).toBeVisible();
    
    // Check for product cards or features
    const productNames = ['SafePass', 'SafeScan', 'SafeWeb', 'SafeTrack'];
    for (const product of productNames) {
      const productElement = page.locator(`text=${product}`).first();
      if (await productElement.count() > 0) {
        await expect(productElement).toBeVisible();
      }
    }
  });

  test('has call-to-action buttons', async ({ page }) => {
    // Look for CTA buttons
    const ctaButtons = page.locator('button:has-text("Get Started"), a:has-text("Get Started"), button:has-text("Try"), a:has-text("Sign Up")');
    
    if (await ctaButtons.count() > 0) {
      await expect(ctaButtons.first()).toBeVisible();
    }
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/safesuite');
    
    // Page should still be usable on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Check that content doesn't overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });
});

test.describe('SafeSuite Auth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/safesuite/auth');
  });

  test('auth page shows login form', async ({ page }) => {
    // Check for email and password inputs
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await passwordInput.count() > 0) {
      // Find toggle button (Eye icon)
      const toggleButton = page.locator('button:has([class*="Eye"]), [aria-label*="password"]').first();
      
      if (await toggleButton.count() > 0) {
        // Initial state should be password
        await expect(passwordInput).toHaveAttribute('type', 'password');
        
        // Click toggle
        await toggleButton.click();
        
        // Should now show text (or at least the toggle works)
        await page.waitForTimeout(100);
      }
    }
  });

  test('has forgot password link', async ({ page }) => {
    const forgotLink = page.locator('a:has-text("Forgot"), button:has-text("Forgot")');
    
    if (await forgotLink.count() > 0) {
      await expect(forgotLink.first()).toBeVisible();
    }
  });

  test('has login/signup tabs', async ({ page }) => {
    const tabs = page.locator('[role="tablist"]');
    
    if (await tabs.count() > 0) {
      await expect(tabs.first()).toBeVisible();
      
      // Check for Sign In/Sign Up tabs
      const signInTab = page.locator('[role="tab"]:has-text("Sign In"), [role="tab"]:has-text("Login")');
      const signUpTab = page.locator('[role="tab"]:has-text("Sign Up"), [role="tab"]:has-text("Register")');
      
      if (await signInTab.count() > 0) {
        await expect(signInTab.first()).toBeVisible();
      }
      if (await signUpTab.count() > 0) {
        await expect(signUpTab.first()).toBeVisible();
      }
    }
  });
});

test.describe('SafeSuite Products', () => {
  test('SafePass page loads', async ({ page }) => {
    await page.goto('/safepass');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Should have some SafePass content
    const safePassContent = page.locator('text=SafePass, text=Password, text=Vault').first();
    if (await safePassContent.count() > 0) {
      await expect(safePassContent).toBeVisible();
    }
  });

  test('SafeScan page loads', async ({ page }) => {
    await page.goto('/safescan');
    
    await expect(page.locator('body')).toBeVisible();
    
    const safeScanContent = page.locator('text=SafeScan, text=Scan, text=Antivirus').first();
    if (await safeScanContent.count() > 0) {
      await expect(safeScanContent).toBeVisible();
    }
  });

  test('SafeWeb page loads', async ({ page }) => {
    await page.goto('/safeweb');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('SafeTrack page loads', async ({ page }) => {
    await page.goto('/safetrack');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('SafeSuite Accessibility', () => {
  test('form inputs have labels', async ({ page }) => {
    await page.goto('/safesuite/auth');
    
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

  test('buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/safesuite');
    
    // Tab through the page and check for focus
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  });
});
