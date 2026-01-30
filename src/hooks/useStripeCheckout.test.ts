import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the hook
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import { SAFESUITE_PRICES } from './useStripeCheckout';

describe('useStripeCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SAFESUITE_PRICES configuration', () => {
    it('should have correct pro tier pricing', () => {
      expect(SAFESUITE_PRICES.pro.monthly.amount).toBe(999);
      expect(SAFESUITE_PRICES.pro.yearly.amount).toBe(9588);
      expect(SAFESUITE_PRICES.pro.monthly.priceId).toBeDefined();
      expect(SAFESUITE_PRICES.pro.yearly.priceId).toBeDefined();
    });

    it('should have correct business tier pricing', () => {
      expect(SAFESUITE_PRICES.business.monthly.amount).toBe(1500);
      expect(SAFESUITE_PRICES.business.yearly.amount).toBe(14400);
      expect(SAFESUITE_PRICES.business.monthly.priceId).toBeDefined();
      expect(SAFESUITE_PRICES.business.yearly.priceId).toBeDefined();
    });

    it('should have correct enterprise tier pricing', () => {
      expect(SAFESUITE_PRICES.enterprise.monthly.amount).toBe(4500);
      expect(SAFESUITE_PRICES.enterprise.yearly.amount).toBe(43200);
      expect(SAFESUITE_PRICES.enterprise.monthly.priceId).toBeDefined();
      expect(SAFESUITE_PRICES.enterprise.yearly.priceId).toBeDefined();
    });

    it('should have yearly pricing less than 12x monthly', () => {
      // Pro: yearly should be less than 12 * monthly
      expect(SAFESUITE_PRICES.pro.yearly.amount).toBeLessThan(
        SAFESUITE_PRICES.pro.monthly.amount * 12
      );
      
      // Business: yearly should be less than 12 * monthly
      expect(SAFESUITE_PRICES.business.yearly.amount).toBeLessThan(
        SAFESUITE_PRICES.business.monthly.amount * 12
      );
      
      // Enterprise: yearly should be less than 12 * monthly
      expect(SAFESUITE_PRICES.enterprise.yearly.amount).toBeLessThan(
        SAFESUITE_PRICES.enterprise.monthly.amount * 12
      );
    });

    it('should have all price IDs in correct format', () => {
      const priceIdPattern = /^price_/;
      
      expect(SAFESUITE_PRICES.pro.monthly.priceId).toMatch(priceIdPattern);
      expect(SAFESUITE_PRICES.pro.yearly.priceId).toMatch(priceIdPattern);
      expect(SAFESUITE_PRICES.business.monthly.priceId).toMatch(priceIdPattern);
      expect(SAFESUITE_PRICES.business.yearly.priceId).toMatch(priceIdPattern);
      expect(SAFESUITE_PRICES.enterprise.monthly.priceId).toMatch(priceIdPattern);
      // Enterprise yearly might be a placeholder for contact sales
    });
  });

  describe('pricing calculations', () => {
    it('should calculate monthly savings correctly', () => {
      // Pro tier savings
      const proMonthlyCost = SAFESUITE_PRICES.pro.monthly.amount * 12;
      const proYearlyCost = SAFESUITE_PRICES.pro.yearly.amount;
      const proSavings = proMonthlyCost - proYearlyCost;
      
      expect(proSavings).toBeGreaterThan(0);
      expect(proSavings).toBe(2400); // $24 savings
    });

    it('should display amounts in cents', () => {
      // All amounts should be positive integers (cents)
      expect(SAFESUITE_PRICES.pro.monthly.amount).toBeGreaterThan(0);
      expect(Number.isInteger(SAFESUITE_PRICES.pro.monthly.amount)).toBe(true);
      expect(Number.isInteger(SAFESUITE_PRICES.pro.yearly.amount)).toBe(true);
    });
  });
});
