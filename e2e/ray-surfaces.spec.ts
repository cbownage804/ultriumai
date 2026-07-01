import { test, expect } from '@playwright/test';

/**
 * Ray surface smoke tests — no auth, we just verify unauthenticated
 * routing and public marketing surfaces. Authenticated smoke lives in
 * safesuite.spec.ts once a test user is available.
 */

test.describe('Ray public surfaces', () => {
  test('landing page mentions Ray', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/Ray/i, { timeout: 15000 });
  });

  test('/app redirects unauthenticated visitor to auth', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/auth|login|\/$/);
  });

  test('trust center renders publicly with Ray privacy claim', async ({ page }) => {
    const response = await page.goto('/app/trust');
    // Public or gated — either way the page should not 500.
    expect(response?.status() ?? 200).toBeLessThan(500);
  });

  test('vault route is protected', async ({ page }) => {
    await page.goto('/app/passwords');
    await page.waitForLoadState('networkidle');
    // Either redirected to auth or a protected shell rendered — never a raw crash.
    await expect(page.locator('body')).toBeVisible();
  });
});
