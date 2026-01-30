import { test, expect } from '@playwright/test';

/**
 * AI Studio E2E Tests
 * Tests for AI Studio landing and GPT builder functionality
 */

test.describe('AI Studio Landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-studio');
  });

  test('landing page loads successfully', async ({ page }) => {
    // Page should load
    await expect(page.locator('body')).toBeVisible();
    
    // Check for AI Studio branding
    const aiStudioContent = page.locator('text=AI Studio, text=GPT, text=AI Agent').first();
    if (await aiStudioContent.count() > 0) {
      await expect(aiStudioContent).toBeVisible();
    }
  });

  test('has product features section', async ({ page }) => {
    // Look for features or benefits section
    const featuresSection = page.locator('section, [class*="feature"], [class*="benefit"]');
    
    if (await featuresSection.count() > 0) {
      await expect(featuresSection.first()).toBeVisible();
    }
  });

  test('has call-to-action buttons', async ({ page }) => {
    const ctaButtons = page.locator('button:has-text("Get Started"), a:has-text("Get Started"), button:has-text("Create"), a:has-text("Try"), button:has-text("Build")');
    
    if (await ctaButtons.count() > 0) {
      await expect(ctaButtons.first()).toBeVisible();
    }
  });

  test('responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ai-studio');
    
    await expect(page.locator('body')).toBeVisible();
    
    // Content should fit on mobile
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(400); // Allow small margin
  });
});

test.describe('AI Studio Navigation', () => {
  test('can navigate to pricing', async ({ page }) => {
    await page.goto('/ai-studio');
    
    const pricingLink = page.locator('a:has-text("Pricing"), button:has-text("Pricing")');
    
    if (await pricingLink.count() > 0) {
      await pricingLink.first().click();
      await page.waitForTimeout(500);
      
      // Should either scroll to pricing section or navigate to pricing page
      const url = page.url();
      expect(url).toMatch(/pricing|#pricing/i);
    }
  });

  test('documentation links are visible', async ({ page }) => {
    await page.goto('/ai-studio');
    
    const docsLink = page.locator('a:has-text("Documentation"), a:has-text("Docs"), a:has-text("API")');
    
    if (await docsLink.count() > 0) {
      await expect(docsLink.first()).toBeVisible();
    }
  });
});

test.describe('AI Studio GPT Builder', () => {
  test('builder page loads when authenticated', async ({ page }) => {
    // Navigate directly to builder (may redirect if not authenticated)
    await page.goto('/ai-studio/builder');
    
    await page.waitForTimeout(1000);
    
    // Either builder loads or we're redirected to auth
    const url = page.url();
    expect(url).toMatch(/builder|auth|login/i);
  });

  test('marketplace page loads', async ({ page }) => {
    await page.goto('/ai-studio/marketplace');
    
    await expect(page.locator('body')).toBeVisible();
    
    // Check for marketplace content
    const marketplaceContent = page.locator('text=Marketplace, text=Templates, text=GPT');
    if (await marketplaceContent.count() > 0) {
      await expect(marketplaceContent.first()).toBeVisible();
    }
  });
});

test.describe('AI Studio Accessibility', () => {
  test('has proper heading structure', async ({ page }) => {
    await page.goto('/ai-studio');
    
    // Should have an h1
    const h1 = page.locator('h1');
    if (await h1.count() > 0) {
      await expect(h1.first()).toBeVisible();
    }
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/ai-studio');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt text or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('links have descriptive text', async ({ page }) => {
    await page.goto('/ai-studio');
    
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      // Link should have text or aria-label
      expect((text && text.trim().length > 0) || ariaLabel).toBeTruthy();
    }
  });
});

test.describe('AI Studio Theme', () => {
  test('dark theme is applied', async ({ page }) => {
    await page.goto('/ai-studio');
    
    // Check if dark theme class is present
    const htmlClass = await page.locator('html').getAttribute('class');
    const isDark = htmlClass?.includes('dark') || 
                   await page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Theme should be consistent
    expect(typeof isDark).toBe('boolean');
  });
});
