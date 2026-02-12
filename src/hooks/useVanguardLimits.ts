import { useCallback, useMemo } from 'react';
import { useVanguardSub } from '@/contexts/VanguardSubscriptionContext';
import { getTierLimits, type TierLimits, type LimitKey } from '@/config/vanguardTierLimits';
import { useToast } from '@/hooks/use-toast';

interface LimitCheckResult {
  allowed: boolean;
  limit: number;
  isUnlimited: boolean;
  tierName: string;
}

/**
 * Hook to check and enforce Vanguard tier-based quantitative limits.
 * 
 * Usage:
 *   const { limits, checkLimit, enforceLimit } = useVanguardLimits();
 *   
 *   // Check if user can create another custom asset type
 *   const canCreate = checkLimit('customAssetTypes', currentCount);
 *   
 *   // Enforce with toast notification
 *   if (!enforceLimit('customReports', currentReportCount)) return;
 */
export function useVanguardLimits() {
  const { tier, adminOverride } = useVanguardSub();
  const { toast } = useToast();

  const limits: TierLimits = useMemo(() => getTierLimits(tier), [tier]);

  const checkLimit = useCallback(
    (key: LimitKey, currentCount: number): LimitCheckResult => {
      const limit = limits[key];

      // Admin override bypasses all limits
      if (adminOverride) {
        return { allowed: true, limit: Infinity, isUnlimited: true, tierName: tier };
      }

      // Boolean limits
      if (typeof limit === 'boolean') {
        return {
          allowed: limit,
          limit: limit ? 1 : 0,
          isUnlimited: false,
          tierName: tier,
        };
      }

      const isUnlimited = limit === Infinity;
      return {
        allowed: isUnlimited || currentCount < limit,
        limit: limit as number,
        isUnlimited,
        tierName: tier,
      };
    },
    [limits, tier, adminOverride]
  );

  /** Human-readable limit labels */
  const LIMIT_LABELS: Record<string, string> = {
    remoteSessions: 'concurrent remote sessions',
    fileTransferGB: 'GB of file transfer per month',
    auditLogRetentionMonths: 'months of audit log retention',
    customSupportAddresses: 'custom support addresses',
    customAssetTypes: 'custom asset types',
    customReports: 'custom reports',
  };

  /**
   * Check a limit and show a toast if exceeded. Returns true if allowed.
   */
  const enforceLimit = useCallback(
    (key: LimitKey, currentCount: number): boolean => {
      const result = checkLimit(key, currentCount);

      if (!result.allowed) {
        const label = LIMIT_LABELS[key] || key;
        toast({
          title: 'Plan limit reached',
          description: `Your ${tier} plan allows up to ${result.limit} ${label}. Upgrade your plan to increase this limit.`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    },
    [checkLimit, tier, toast]
  );

  /**
   * Get the remaining quota for a numeric limit.
   */
  const getRemaining = useCallback(
    (key: LimitKey, currentCount: number): number => {
      if (adminOverride) return Infinity;
      const limit = limits[key];
      if (typeof limit === 'boolean') return limit ? 1 : 0;
      if (limit === Infinity) return Infinity;
      return Math.max(0, (limit as number) - currentCount);
    },
    [limits, adminOverride]
  );

  /**
   * Check a boolean feature flag (e.g., macLinuxSupport, sso).
   */
  const hasFeature = useCallback(
    (key: LimitKey): boolean => {
      if (adminOverride) return true;
      const val = limits[key];
      return typeof val === 'boolean' ? val : (val as number) > 0;
    },
    [limits, adminOverride]
  );

  return {
    limits,
    tier,
    checkLimit,
    enforceLimit,
    getRemaining,
    hasFeature,
  };
}
