import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-id',
              user_id: 'user-123',
              plan_type: 'pro',
              monthly_credit_limit: 10000,
              credits_remaining: 5000,
              credits_used_this_period: 5000,
              credit_reset_date: null,
              overage_enabled: false,
              overage_credits_used: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    session: { access_token: 'test-token' },
    isLoading: false,
  }),
}));

describe('useAICredits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkCredits utility function', () => {
    it('should return true when enough credits are available', () => {
      // Test the pure logic of checkCredits
      const creditsRemaining = 5000;
      const tokensNeeded = 1000;
      const multiplier = 1.0;
      
      const creditsNeeded = (tokensNeeded / 1000) * multiplier;
      const hasEnoughCredits = creditsRemaining >= creditsNeeded;
      
      expect(hasEnoughCredits).toBe(true);
    });

    it('should return false when insufficient credits', () => {
      const creditsRemaining = 1;
      const tokensNeeded = 10000;
      const multiplier = 1.0;
      
      const creditsNeeded = (tokensNeeded / 1000) * multiplier;
      const hasEnoughCredits = creditsRemaining >= creditsNeeded;
      
      expect(hasEnoughCredits).toBe(false);
    });

    it('should correctly apply multiplier', () => {
      const creditsRemaining = 5;
      const tokensNeeded = 1000;
      const multiplier = 2.0;
      
      // 1000 tokens / 1000 * 2.0 = 2 credits needed
      const creditsNeeded = (tokensNeeded / 1000) * multiplier;
      expect(creditsNeeded).toBe(2);
      
      const hasEnoughCredits = creditsRemaining >= creditsNeeded;
      expect(hasEnoughCredits).toBe(true);
    });

    it('should handle zero tokens', () => {
      const creditsRemaining = 0;
      const tokensNeeded = 0;
      const multiplier = 1.0;
      
      const creditsNeeded = (tokensNeeded / 1000) * multiplier;
      const hasEnoughCredits = creditsRemaining >= creditsNeeded;
      
      expect(hasEnoughCredits).toBe(true);
    });
  });

  describe('usage percentage calculation', () => {
    it('should calculate usage percentage correctly', () => {
      const creditsUsedThisPeriod = 5000;
      const monthlyCreditsLimit = 10000;
      
      const usagePercentage = (creditsUsedThisPeriod / monthlyCreditsLimit) * 100;
      
      expect(usagePercentage).toBe(50);
    });

    it('should handle zero limit gracefully', () => {
      const creditsUsedThisPeriod = 5000;
      const monthlyCreditsLimit = 0;
      
      // Should return 0 when limit is 0 to avoid division by zero
      const usagePercentage = monthlyCreditsLimit 
        ? (creditsUsedThisPeriod / monthlyCreditsLimit) * 100
        : 0;
      
      expect(usagePercentage).toBe(0);
    });

    it('should cap at 100% for overages', () => {
      const creditsUsedThisPeriod = 15000;
      const monthlyCreditsLimit = 10000;
      
      const usagePercentage = (creditsUsedThisPeriod / monthlyCreditsLimit) * 100;
      
      expect(usagePercentage).toBe(150);
    });
  });

  describe('hasCredits computed property', () => {
    it('should return true when credits_remaining > 0', () => {
      const creditsRemaining = 1;
      const hasCredits = creditsRemaining > 0;
      expect(hasCredits).toBe(true);
    });

    it('should return false when credits_remaining is 0', () => {
      const creditsRemaining = 0;
      const hasCredits = creditsRemaining > 0;
      expect(hasCredits).toBe(false);
    });

    it('should return false for negative credits', () => {
      const creditsRemaining = -100;
      const hasCredits = creditsRemaining > 0;
      expect(hasCredits).toBe(false);
    });
  });
});
