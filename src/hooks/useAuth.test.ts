/**
 * useAuth Hook Tests
 * 
 * Run with: npx vitest run src/hooks/useAuth.test.ts
 */

import { describe, it, expect, vi } from 'vitest';

describe('useAuth', () => {
  it('should export auth functions', async () => {
    // Simple smoke test to verify the hook can be imported
    const authModule = await import('./useAuth');
    expect(authModule.useAuth).toBeDefined();
    expect(typeof authModule.useAuth).toBe('function');
  });

  it('should export AuthProvider', async () => {
    const authModule = await import('./useAuth');
    expect(authModule.AuthProvider).toBeDefined();
  });
});
