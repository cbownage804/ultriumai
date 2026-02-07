/**
 * Vanguard Module Add-On Pricing, Bundles & Reseller Tiers
 */

import type { ModuleName } from '@/components/vanguard/ModuleLogo';

export interface ModuleAddon {
  id: string;
  module: ModuleName;
  name: string;
  description: string;
  category: 'security' | 'ai' | 'compliance' | 'intelligence' | 'operations';
  monthlyPricePerUser: number;
  includedIn: string[]; // plan tier ids where this is included
  features: string[];
}

export interface AddonBundle {
  id: string;
  name: string;
  description: string;
  addonIds: string[];
  discountPercent: number;
  monthlyPricePerUser: number; // after discount
  alaCartePricePerUser: number; // sum without discount
}

export interface ResellerTier {
  id: string;
  name: string;
  minSeats: number;
  discountPercent: number;
  whiteLabel: 'none' | 'partial' | 'full';
  coBranding: string;
  color: string;
}

// ── Module Add-Ons ──────────────────────────────────────────────
export const MODULE_ADDONS: ModuleAddon[] = [
  {
    id: 'pursuit-xdr',
    module: 'pursuit',
    name: 'Pursuit XDR',
    description: 'Advanced threat detection & automated response across endpoints.',
    category: 'security',
    monthlyPricePerUser: 8,
    includedIn: ['msp-power', 'it-master', 'msp-superpower', 'it-enterprise'],
    features: ['XDR threat correlation', 'Automated remediation', 'MITRE ATT&CK mapping', 'SOC dashboards'],
  },
  {
    id: 'sentinel-saas',
    module: 'sentinel',
    name: 'Sentinel SaaS',
    description: 'M365 & Google Workspace security monitoring.',
    category: 'security',
    monthlyPricePerUser: 6,
    includedIn: ['msp-power', 'it-master', 'msp-superpower', 'it-enterprise'],
    features: ['M365 security alerts', 'Google Workspace monitoring', 'AI triage', 'Tenant management'],
  },
  {
    id: 'recon-pentest',
    module: 'recon',
    name: 'Recon Pentest',
    description: 'Vulnerability assessment & penetration testing.',
    category: 'security',
    monthlyPricePerUser: 12,
    includedIn: ['msp-superpower', 'it-enterprise'],
    features: ['Vuln scanning', 'Pentest workflows', 'Network discovery', 'Recon hardware mgmt'],
  },
  {
    id: 'cortex-ai',
    module: 'cortex',
    name: 'Cortex AI',
    description: 'AI-powered IT intelligence & automation.',
    category: 'ai',
    monthlyPricePerUser: 5,
    includedIn: ['msp-growth', 'it-expert', 'msp-power', 'it-master', 'msp-superpower', 'it-enterprise'],
    features: ['AI ticket summarization', 'Pattern detection', 'KB generator', 'Smart ticket routing'],
  },
  {
    id: 'comply',
    module: 'comply',
    name: 'Comply',
    description: 'Compliance lifecycle management & audit readiness.',
    category: 'compliance',
    monthlyPricePerUser: 7,
    includedIn: ['msp-power', 'it-master', 'msp-superpower', 'it-enterprise'],
    features: ['SOC 2 / HIPAA / ISO 27001', 'Evidence collection', 'Control monitoring', 'Audit-ready reports'],
  },
  {
    id: 'cross-client-soc',
    module: 'pursuit',
    name: 'Cross-Client SOC',
    description: 'Detect coordinated campaigns across your entire MSP fleet.',
    category: 'intelligence',
    monthlyPricePerUser: 10,
    includedIn: ['msp-superpower', 'it-enterprise'],
    features: ['Cross-client correlation', 'Campaign detection', 'Shared IOC analysis', 'Fleet-wide visibility'],
  },
  {
    id: 'atlas-docs',
    module: 'atlas',
    name: 'Atlas Documentation',
    description: 'IT documentation, runbooks & knowledge base.',
    category: 'operations',
    monthlyPricePerUser: 3,
    includedIn: ['msp-growth', 'it-expert', 'msp-power', 'it-master', 'msp-superpower', 'it-enterprise'],
    features: ['Knowledge base', 'Runbooks & SOPs', 'Password vault', 'Flexible assets'],
  },
];

// ── Strategic Bundles ───────────────────────────────────────────
export const ADDON_BUNDLES: AddonBundle[] = [
  {
    id: 'security-bundle',
    name: 'Security Bundle',
    description: 'Pursuit XDR + Sentinel SaaS + Comply',
    addonIds: ['pursuit-xdr', 'sentinel-saas', 'comply'],
    discountPercent: 15,
    monthlyPricePerUser: 18, // vs $21 a la carte
    alaCartePricePerUser: 21,
  },
  {
    id: 'complete-soc',
    name: 'Complete SOC',
    description: 'All security modules + Cross-Client SOC',
    addonIds: ['pursuit-xdr', 'sentinel-saas', 'comply', 'cross-client-soc', 'recon-pentest'],
    discountPercent: 20,
    monthlyPricePerUser: 34, // vs $43 a la carte
    alaCartePricePerUser: 43,
  },
];

// ── Reseller Tiers ──────────────────────────────────────────────
export const RESELLER_TIERS: ResellerTier[] = [
  {
    id: 'silver',
    name: 'Silver Partner',
    minSeats: 10,
    discountPercent: 15,
    whiteLabel: 'none',
    coBranding: 'UltriumAI badge',
    color: 'slate',
  },
  {
    id: 'gold',
    name: 'Gold Partner',
    minSeats: 25,
    discountPercent: 25,
    whiteLabel: 'partial',
    coBranding: 'Your logo + "Powered by UltriumAI"',
    color: 'amber',
  },
  {
    id: 'platinum',
    name: 'Platinum Partner',
    minSeats: 50,
    discountPercent: 35,
    whiteLabel: 'full',
    coBranding: 'Complete white-label',
    color: 'violet',
  },
];

// ── Helpers ─────────────────────────────────────────────────────
export function getAddonById(id: string): ModuleAddon | undefined {
  return MODULE_ADDONS.find(a => a.id === id);
}

export function getBundleSavings(bundle: AddonBundle): number {
  return bundle.alaCartePricePerUser - bundle.monthlyPricePerUser;
}

export function calculateResellerMargin(
  wholesalePrice: number,
  resalePrice: number,
  seats: number,
): { monthlyMargin: number; annualMargin: number; marginPercent: number } {
  const monthlyMargin = (resalePrice - wholesalePrice) * seats;
  return {
    monthlyMargin,
    annualMargin: monthlyMargin * 12,
    marginPercent: wholesalePrice > 0 ? Math.round(((resalePrice - wholesalePrice) / resalePrice) * 100) : 0,
  };
}
