/**
 * Vanguard PSA/RMM Pricing Configuration
 * Per-technician pricing for unlimited endpoints (Atera-style)
 */

export interface VanguardPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number; // per technician, billed annually
  monthlyPriceBilledMonthly: number; // per technician, billed monthly
  features: string[];
  highlights: string[];
  popular?: boolean;
  enterprise?: boolean;
  stripePriceId?: string;
  stripeProductId?: string;
}

// IT Department Plans (Internal IT Teams)
export const IT_DEPARTMENT_PLANS: VanguardPlan[] = [
  {
    id: 'it-professional',
    name: 'Professional',
    description: 'For teams that need to manage their corporate devices and networks.',
    monthlyPrice: 129, // Atera: $149
    monthlyPriceBilledMonthly: 149, // Atera: $169
    features: [
      'Remote monitoring and alerts',
      'Remote management',
      'RustDesk remote access (up to 2 concurrent sessions)',
      'Patch management',
      'Software management (Chocolatey, Homebrew, WinGet)',
      'Azure AD integration',
      'Audit log (1 month retention)',
      'Custom support address (1)',
      'Service portal',
      'File view and transfer (up to 15GB/mo)',
      'Mobile app (iOS & Android)',
    ],
    highlights: [
      'Remote monitoring and alerts',
      'Patch management',
      'RustDesk remote access',
    ],
    stripePriceId: 'price_1SxuTIH1u6E0bsJTmXs4WsZF',
    stripeProductId: 'prod_Tvm1tGkEFFA8xx',
  },
  {
    id: 'it-expert',
    name: 'Expert',
    description: 'For expanding teams that need flexibility, dual remote monitoring, and automations.',
    monthlyPrice: 169, // Atera: $189
    monthlyPriceBilledMonthly: 209, // Atera: $229
    popular: true,
    features: [
      'Everything in Professional, plus:',
      'RustDesk concurrent sessions (unlimited)',
      '11 preset reports',
      'AI ticket auto-tagging',
      'Custom asset types (up to 5)',
      'File view and transfer (up to 50GB/mo)',
      'Audit log (6 months retention)',
      'Custom support addresses (2)',
    ],
    highlights: [
      'Unlimited RustDesk sessions',
      'AI ticket auto-tagging',
      'Advanced remote access',
    ],
    stripePriceId: 'price_1SxuTKH1u6E0bsJTokP26ceC',
    stripeProductId: 'prod_Tvm1v7saOMFPLn',
  },
  {
    id: 'it-master',
    name: 'Master',
    description: 'For established teams needing greater compliance and more insights.',
    monthlyPrice: 199, // Atera: $219
    monthlyPriceBilledMonthly: 249, // Atera: $269
    features: [
      'Everything in Expert, plus:',
      'Custom analytics reports (up to 10)',
      'Custom asset types (up to 20)',
      'Audit log (12 months retention)',
      'Custom support addresses (unlimited)',
      'File view and transfer (up to 80GB/mo)',
      'Data recovery',
    ],
    highlights: [
      'Custom analytics reports',
      '12 months audit log',
      'Data recovery',
    ],
    stripePriceId: 'price_1SxuTMH1u6E0bsJTBvbwyyMK',
    stripeProductId: 'prod_Tvm1N7n2bkJpMd',
  },
  {
    id: 'it-enterprise',
    name: 'Enterprise',
    description: 'For departments requiring high-touch and enterprise-level services.',
    monthlyPrice: 0, // Custom pricing
    monthlyPriceBilledMonthly: 0,
    enterprise: true,
    features: [
      'Everything in Master, plus:',
      'Single sign-on (SSO)',
      'Azure AD continuous sync',
      'Private software repository',
      'Custom domain SSL for service portal',
      'Network Discovery',
      'Custom reports (unlimited)',
      'Audit log (7 year retention)',
      'Script-based custom fields',
      'HIPAA BAA available',
      'Custom asset types (unlimited)',
    ],
    highlights: [
      'SSO & Enterprise security',
      'Dedicated support',
      'Custom integrations',
    ],
  },
];

// MSP Plans (Managed Service Providers)
export const MSP_PLANS: VanguardPlan[] = [
  {
    id: 'msp-pro',
    name: 'Pro',
    description: 'For IT professionals looking to oversee their clients\' IT infrastructure.',
    monthlyPrice: 109, // Atera: $129
    monthlyPriceBilledMonthly: 119, // Atera: $139
    features: [
      'Remote monitoring and alerts',
      'Remote management',
      'RustDesk remote access (up to 2 concurrent sessions)',
      'Patch management',
      'Software management',
      'Knowledge base',
      'Audit log (1 month retention)',
      'Custom support addresses (up to 5)',
      'Help Desk',
      'File view',
      'API Access',
      'SLA and automated time tracking',
      'Contracts & invoicing',
      'Azure AD integration',
      'Mobile app (iOS & Android)',
    ],
    highlights: [
      'Contracts & invoicing',
      'SLA tracking',
      'API Access',
    ],
    stripePriceId: 'price_1SxuTOH1u6E0bsJTaXDSWla4',
    stripeProductId: 'prod_Tvm1aJEZ4WXQJN',
  },
  {
    id: 'msp-growth',
    name: 'Growth',
    description: 'For MSPs seeking flexibility, dual remote monitoring tools and asset management.',
    monthlyPrice: 159, // Atera: $179
    monthlyPriceBilledMonthly: 199, // Atera: $189
    popular: true,
    features: [
      'Everything in Pro, plus:',
      'Mac and Linux support',
      'RustDesk concurrent sessions (unlimited)',
      '11 Preset Reports',
      'Custom support addresses (up to 10)',
      'Custom asset types (up to 5)',
      'File view and transfer (up to 15GB/mo)',
      'Audit log (6 months retention)',
      'QuickBooks Online & Xero integrations',
      'CSV QuickBooks Desktop export',
    ],
    highlights: [
      'Mac & Linux support',
      'QuickBooks & Xero',
      'Unlimited remote sessions',
    ],
    stripePriceId: 'price_1SxuTPH1u6E0bsJT5E9UzVhs',
    stripeProductId: 'prod_Tvm1Wp6LRat7DV',
  },
  {
    id: 'msp-power',
    name: 'Power',
    description: 'For mid-size MSPs that need compliance, insights, and custom reports.',
    monthlyPrice: 189, // Atera: $209
    monthlyPriceBilledMonthly: 229, // Atera: $249
    features: [
      'Everything in Growth, plus:',
      'Custom reports (up to 10)',
      'Custom support addresses (unlimited)',
      'Custom asset types (up to 20)',
      'File transfer (up to 50GB/mo)',
      'Audit log (12 months retention)',
      'Data recovery',
    ],
    highlights: [
      'Custom reports',
      '12 months audit log',
      'Data recovery',
    ],
    stripePriceId: 'price_1SxuTQH1u6E0bsJTsfAgrdLQ',
    stripeProductId: 'prod_Tvm1sVN7zuCb2R',
  },
  {
    id: 'msp-superpower',
    name: 'Superpower',
    description: 'For large MSPs that need Enterprise-grade services.',
    monthlyPrice: 0, // Custom pricing
    monthlyPriceBilledMonthly: 0,
    enterprise: true,
    features: [
      'Everything in Power, plus:',
      'Single sign-on (SSO)',
      'Azure AD continuous sync',
      'Private software repository',
      'Custom domain SSL for Service Portal',
      'Network Discovery',
      'Custom reports (unlimited)',
      'Audit log (7 year retention)',
      'HIPAA BAA available',
      'Dedicated account manager',
      'Priority support',
    ],
    highlights: [
      'Enterprise-grade security',
      'Dedicated support',
      'Custom SLAs',
    ],
  },
];

// All plans include (shown at top of pricing page)
export const ALL_PLANS_INCLUDE = {
  it: [
    'Ticketing & service portal',
    'Windows, Mac, and Linux support',
    'Classic reports',
    'IT automations',
    '24/7 chat support',
  ],
  msp: [
    'Ticketing & helpdesk',
    'Windows support',
    'Classic reports',
    'IT automations',
    '24/7 chat support',
  ],
};

// Add-ons available for all plans
export const ADDONS = [
  {
    id: 'ai-copilot',
    name: 'AI Copilot',
    description: 'AI-powered assistance for faster ticket resolution and automation.',
    monthlyPrice: 50,
    stripePriceId: 'price_1SxuTgH1u6E0bsJTKV8J0qSR',
    stripeProductId: 'prod_Tvm1CcIDVjRGaW',
    features: [
      'AI ticket summarization',
      'Suggested responses',
      'Auto-categorization',
      'Knowledge base suggestions',
    ],
  },
  {
    id: 'network-discovery',
    name: 'Network Discovery',
    description: 'Scan and monitor networks for devices and security issues.',
    monthlyPrice: 25,
    stripePriceId: 'price_1SxuTiH1u6E0bsJTRwQiRkcm',
    stripeProductId: 'prod_Tvm19bNlVCzSw2',
    features: [
      'Automatic device discovery',
      'Network mapping',
      'Security scanning',
      'Upsell opportunity alerts',
    ],
  },
  {
    id: 'pursuit-xdr',
    name: 'Pursuit XDR',
    description: 'Advanced threat detection & automated response.',
    monthlyPrice: 8,
    perUser: true,
    stripePriceId: 'price_1SxuTUH1u6E0bsJTMPO2csv9',
    stripeProductId: 'prod_Tvm15XS4URJYDf',
    features: ['XDR correlation', 'Auto-remediation', 'MITRE ATT&CK mapping', 'SOC dashboards'],
  },
  {
    id: 'sentinel-saas',
    name: 'Sentinel SaaS',
    description: 'M365 & Google Workspace security monitoring.',
    monthlyPrice: 6,
    perUser: true,
    stripePriceId: 'price_1SxuTWH1u6E0bsJTK6myzbhu',
    stripeProductId: 'prod_Tvm14lHuxDHOyk',
    features: ['M365 alerts', 'GWS monitoring', 'AI triage', 'Tenant management'],
  },
  {
    id: 'recon-pentest',
    name: 'Recon Pentest',
    description: 'Vulnerability assessment & penetration testing.',
    monthlyPrice: 12,
    perUser: true,
    stripePriceId: 'price_1SxuTXH1u6E0bsJTm68uN9GV',
    stripeProductId: 'prod_Tvm1Bv6Y169hG6',
    features: ['Vuln scanning', 'Pentest workflows', 'Network discovery', 'Recon hardware'],
  },
  {
    id: 'cortex-ai',
    name: 'Cortex AI',
    description: 'AI-powered IT intelligence & automation.',
    monthlyPrice: 5,
    perUser: true,
    stripePriceId: 'price_1SxuTZH1u6E0bsJT2NEiuN4K',
    stripeProductId: 'prod_Tvm1lPWrLHU5BG',
    features: ['AI summarization', 'Pattern detection', 'KB generator', 'Smart routing'],
  },
  {
    id: 'comply',
    name: 'Comply',
    description: 'Compliance lifecycle management & audit readiness.',
    monthlyPrice: 7,
    perUser: true,
    stripePriceId: 'price_1SxuTaH1u6E0bsJT5NSVONG8',
    stripeProductId: 'prod_Tvm1BCKLECzk9L',
    features: ['SOC 2 / HIPAA / ISO', 'Evidence collection', 'Control monitoring', 'Audit reports'],
  },
  {
    id: 'cross-client-soc',
    name: 'Cross-Client SOC',
    description: 'Detect coordinated campaigns across your MSP fleet.',
    monthlyPrice: 10,
    perUser: true,
    stripePriceId: 'price_1SxuTcH1u6E0bsJTDDJsq086',
    stripeProductId: 'prod_Tvm1pOuwM3afS1',
    features: ['Cross-client correlation', 'Campaign detection', 'Shared IOC analysis', 'Fleet visibility'],
  },
  {
    id: 'atlas-docs',
    name: 'Atlas Documentation',
    description: 'IT documentation, runbooks & knowledge base.',
    monthlyPrice: 3,
    perUser: true,
    stripePriceId: 'price_1SxuTdH1u6E0bsJTScVKEytG',
    stripeProductId: 'prod_Tvm1IMy0GKTI7u',
    features: ['Knowledge base', 'Runbooks & SOPs', 'Password vault', 'Flexible assets'],
  },
  {
    id: 'phishing-sim',
    name: 'Phishing Simulation',
    description: 'Employee phishing awareness training & testing.',
    monthlyPrice: 4,
    perUser: true,
    stripePriceId: 'price_1SxuTfH1u6E0bsJTsRKTGLam',
    stripeProductId: 'prod_Tvm1psna1dlfHE',
    features: ['Simulated campaigns', 'Risk scoring', 'Awareness training', 'Reporting'],
  },
];

// Helper functions
export const formatPrice = (cents: number): string => {
  return `$${cents}`;
};

export const getAnnualSavings = (plan: VanguardPlan): number => {
  if (plan.enterprise) return 0;
  return (plan.monthlyPriceBilledMonthly - plan.monthlyPrice) * 12;
};

export const getAnnualSavingsPercent = (plan: VanguardPlan): number => {
  if (plan.enterprise || plan.monthlyPriceBilledMonthly === 0) return 0;
  return Math.round(((plan.monthlyPriceBilledMonthly - plan.monthlyPrice) / plan.monthlyPriceBilledMonthly) * 100);
};
