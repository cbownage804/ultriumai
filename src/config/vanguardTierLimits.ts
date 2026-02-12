/**
 * Vanguard Tier-Based Quantitative Limits
 * 
 * Maps each plan tier to its numeric limits as advertised on the pricing page.
 * Use Infinity for "unlimited". These limits are enforced client-side via
 * useVanguardLimits() and should also be validated server-side.
 */

export interface TierLimits {
  /** Max concurrent remote sessions */
  remoteSessions: number;
  /** Monthly file transfer allowance in GB */
  fileTransferGB: number;
  /** Audit log retention in months */
  auditLogRetentionMonths: number;
  /** Max custom support email addresses */
  customSupportAddresses: number;
  /** Max custom asset types */
  customAssetTypes: number;
  /** Max custom analytics/reports */
  customReports: number;
  /** Whether Mac/Linux endpoints are supported */
  macLinuxSupport: boolean;
  /** Whether data recovery is available */
  dataRecovery: boolean;
  /** Whether SSO is available */
  sso: boolean;
  /** Whether network discovery is available */
  networkDiscovery: boolean;
}

const UNLIMITED = Infinity;

// ── MSP Plan Limits ──────────────────────────────────────────
const MSP_LIMITS: Record<string, TierLimits> = {
  'msp-pro': {
    remoteSessions: 2,
    fileTransferGB: 0,
    auditLogRetentionMonths: 1,
    customSupportAddresses: 5,
    customAssetTypes: 0,
    customReports: 0,
    macLinuxSupport: false,
    dataRecovery: false,
    sso: false,
    networkDiscovery: false,
  },
  'msp-growth': {
    remoteSessions: UNLIMITED,
    fileTransferGB: 15,
    auditLogRetentionMonths: 6,
    customSupportAddresses: 10,
    customAssetTypes: 5,
    customReports: 0,
    macLinuxSupport: true,
    dataRecovery: false,
    sso: false,
    networkDiscovery: false,
  },
  'msp-power': {
    remoteSessions: UNLIMITED,
    fileTransferGB: 50,
    auditLogRetentionMonths: 12,
    customSupportAddresses: UNLIMITED,
    customAssetTypes: 20,
    customReports: 10,
    macLinuxSupport: true,
    dataRecovery: false,
    sso: false,
    networkDiscovery: false,
  },
  'msp-superpower': {
    remoteSessions: UNLIMITED,
    fileTransferGB: UNLIMITED,
    auditLogRetentionMonths: 84,
    customSupportAddresses: UNLIMITED,
    customAssetTypes: UNLIMITED,
    customReports: UNLIMITED,
    macLinuxSupport: true,
    dataRecovery: false,
    sso: true,
    networkDiscovery: true,
  },
};

// ── IT Department Plan Limits ────────────────────────────────
const IT_LIMITS: Record<string, TierLimits> = {
  'it-professional': {
    remoteSessions: 2,
    fileTransferGB: 15,
    auditLogRetentionMonths: 1,
    customSupportAddresses: 1,
    customAssetTypes: 0,
    customReports: 0,
    macLinuxSupport: false,
    dataRecovery: false,
    sso: false,
    networkDiscovery: false,
  },
  'it-expert': {
    remoteSessions: UNLIMITED,
    fileTransferGB: 50,
    auditLogRetentionMonths: 6,
    customSupportAddresses: 2,
    customAssetTypes: 5,
    customReports: 0,
    macLinuxSupport: true,
    dataRecovery: false,
    sso: false,
    networkDiscovery: false,
  },
  'it-master': {
    remoteSessions: UNLIMITED,
    fileTransferGB: 80,
    auditLogRetentionMonths: 12,
    customSupportAddresses: UNLIMITED,
    customAssetTypes: 20,
    customReports: 10,
    macLinuxSupport: true,
    dataRecovery: false,
    sso: false,
    networkDiscovery: false,
  },
  'it-enterprise': {
    remoteSessions: UNLIMITED,
    fileTransferGB: UNLIMITED,
    auditLogRetentionMonths: 84,
    customSupportAddresses: UNLIMITED,
    customAssetTypes: UNLIMITED,
    customReports: UNLIMITED,
    macLinuxSupport: true,
    dataRecovery: false,
    sso: true,
    networkDiscovery: true,
  },
};

// ── Free / unsubscribed defaults ─────────────────────────────
const FREE_LIMITS: TierLimits = {
  remoteSessions: 0,
  fileTransferGB: 0,
  auditLogRetentionMonths: 0,
  customSupportAddresses: 0,
  customAssetTypes: 0,
  customReports: 0,
  macLinuxSupport: false,
  dataRecovery: false,
  sso: false,
  networkDiscovery: false,
};

const ALL_LIMITS: Record<string, TierLimits> = {
  ...MSP_LIMITS,
  ...IT_LIMITS,
  free: FREE_LIMITS,
};

export function getTierLimits(tier: string): TierLimits {
  return ALL_LIMITS[tier] ?? FREE_LIMITS;
}

export type LimitKey = keyof TierLimits;
