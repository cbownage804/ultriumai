/**
 * Per-page instructions and how-to content
 * Used by PageHelpButton and the full Guide page
 */

export interface PageInstruction {
  id: string;
  title: string;
  description: string;
  sections: {
    heading: string;
    content: string;
    tips?: string[];
  }[];
  tourId?: string; // Links to MODULE_TOURS for replay
  product: 'vanguard' | 'safesuite' | 'ai-studio' | 'general';
}

export const PAGE_INSTRUCTIONS: Record<string, PageInstruction> = {
  // ===== VANGUARD =====
  '/vanguard/app/dashboard': {
    id: 'vanguard-dashboard',
    title: 'Command Center',
    description: 'Your central operations dashboard for monitoring all managed services.',
    product: 'vanguard',
    sections: [
      {
        heading: 'Overview',
        content: 'The Command Center shows real-time stats for your entire fleet: active agents, open tickets, security alerts, and revenue metrics.',
        tips: ['Click any stat card to drill into details', 'Use the date range picker to adjust the time window', 'Widgets can be rearranged and customized'],
      },
      {
        heading: 'Quick Actions',
        content: 'Use the action bar to create tickets, add devices, run scans, or access reports without navigating away.',
      },
      {
        heading: 'Recent Activity',
        content: 'The activity feed shows the latest events across all modules. Click any entry to jump to the relevant page.',
      },
    ],
  },
  '/vanguard/app/tickets': {
    id: 'vanguard-tickets',
    title: 'Response – Service Desk',
    description: 'Manage support requests with AI-powered categorization and SLA tracking.',
    product: 'vanguard',
    tourId: 'vanguard-response',
    sections: [
      {
        heading: 'Ticket Queue',
        content: 'View all tickets sorted by priority and SLA status. Color coding indicates urgency: red = breaching SLA, yellow = approaching, green = on track.',
        tips: ['Use filters to narrow by org, status, priority, or assignee', 'Click a ticket row to open the detail panel', 'Bulk select tickets with checkboxes for mass actions'],
      },
      {
        heading: 'Creating Tickets',
        content: 'Click "+ New Ticket" to open the creation form. Fill in client, subject, description, and priority. AI will auto-categorize and suggest assignees.',
      },
      {
        heading: 'Ticket Detail',
        content: 'The detail view shows the full conversation thread, time entries, related assets, and AI suggestions. Use the toolbar to change status, reassign, or escalate.',
        tips: ['Use @ mentions to notify team members', 'Attach files up to 10MB', 'AI can generate response drafts'],
      },
    ],
  },
  '/vanguard/app/devices': {
    id: 'vanguard-devices',
    title: 'Horizon – RMM',
    description: 'Remote monitoring and management for all your connected endpoints.',
    product: 'vanguard',
    tourId: 'vanguard-horizon',
    sections: [
      {
        heading: 'Device Grid',
        content: 'All connected devices displayed with health status indicators. Green = healthy, Yellow = needs attention, Red = critical/offline.',
        tips: ['Sort by any column header', 'Use search to find devices by name, IP, or OS', 'Right-click a device for quick actions'],
      },
      {
        heading: 'Remote Actions',
        content: 'Select one or more devices to run remote commands: restart, deploy patches, execute scripts, or open a remote session.',
      },
      {
        heading: 'Device Detail',
        content: 'Click any device to see detailed hardware specs, installed software, patch status, performance metrics, and event logs.',
        tips: ['The sidebar navigation scrolls to specific sections', 'Performance charts show the last 24 hours by default'],
      },
    ],
  },
  '/vanguard/app/alerts': {
    id: 'vanguard-alerts',
    title: 'Pursuit – XDR/Threat Detection',
    description: 'Real-time security monitoring, threat detection, and incident response.',
    product: 'vanguard',
    tourId: 'vanguard-pursuit',
    sections: [
      {
        heading: 'Alert Feed',
        content: 'Live stream of security events filtered by severity. Critical alerts appear at the top with MITRE ATT&CK mapping.',
        tips: ['Filter by severity, type, or affected client', 'Click any alert for investigation details', 'AI auto-triages low-confidence alerts'],
      },
      {
        heading: 'Investigation',
        content: 'The investigation panel shows affected hosts, related events, a timeline, and recommended response actions.',
      },
      {
        heading: 'Automated Response',
        content: 'Configure playbooks to automatically isolate compromised devices, block IPs, or disable accounts when certain threat patterns are detected.',
      },
    ],
  },
  '/vanguard/app/atlas': {
    id: 'vanguard-atlas',
    title: 'Atlas – IT Documentation',
    description: 'Centralized documentation hub for passwords, configurations, SOPs, and runbooks.',
    product: 'vanguard',
    tourId: 'vanguard-atlas',
    sections: [
      {
        heading: 'Organizations',
        content: 'Select a client organization to view their documentation. All data is scoped per-client for security.',
        tips: ['Use the org dropdown to switch between clients', 'Star frequently accessed orgs for quick access'],
      },
      {
        heading: 'Documentation Tabs',
        content: 'Navigate between Documents/SOPs, Passwords, Configurations, SSL Certificates, Contacts, and Flexible Assets.',
      },
      {
        heading: 'Password Vault',
        content: 'Securely stored credentials with AES-256 encryption. Click the eye icon to reveal, copy icon to clipboard.',
        tips: ['Passwords can be auto-rotated on schedule', 'Use categories and tags for organization', 'Audit trail tracks all access'],
      },
      {
        heading: 'AI Features',
        content: 'Use the AI Doc Generator to auto-create SOPs and policies. AI Search lets you query across all documentation using natural language.',
      },
    ],
  },
  '/vanguard/app/cortex': {
    id: 'vanguard-cortex',
    title: 'Cortex – AI Hub',
    description: 'AI-powered automation tools for ticket triage, pattern detection, and documentation.',
    product: 'vanguard',
    tourId: 'vanguard-cortex',
    sections: [
      {
        heading: 'AI Tools',
        content: 'Access the full suite: Ticket Summarizer, Pattern Detector, KB Generator, Auto-Router, Sentiment Analyzer, and more.',
        tips: ['Start with the Ticket Summarizer for immediate time savings', 'Configure each tool\'s sensitivity in settings'],
      },
      {
        heading: 'Analytics',
        content: 'Track AI usage, accuracy rates, and estimated time savings. See which tools provide the most value.',
      },
    ],
  },
  '/vanguard/app/customers': {
    id: 'vanguard-customers',
    title: 'Sites – Client Management',
    description: 'Manage your MSP clients, their devices, contacts, and service agreements.',
    product: 'vanguard',
    sections: [
      {
        heading: 'Client List',
        content: 'View all managed clients with device counts, health scores, and contract status at a glance.',
        tips: ['Click any client to see their full profile', 'Sort by health score to identify at-risk clients', 'Use bulk actions for multi-client operations'],
      },
      {
        heading: 'Client Detail',
        content: 'The client profile includes devices, contacts, tickets, documentation, billing, and compliance status.',
      },
    ],
  },
  '/vanguard/app/sentinel': {
    id: 'vanguard-sentinel',
    title: 'Sentinel – SaaS Security',
    description: 'Monitor Microsoft 365 and Google Workspace tenants for security events.',
    product: 'vanguard',
    sections: [
      {
        heading: 'Tenant Management',
        content: 'Connect M365 and Google Workspace tenants. Each tenant is monitored independently for suspicious sign-ins, admin changes, and policy violations.',
        tips: ['Connect tenants via OAuth for real-time monitoring', 'AI triage auto-classifies and can auto-dismiss low-risk alerts'],
      },
      {
        heading: 'Security Events',
        content: 'View sign-in anomalies, impossible travel detections, risky user activity, and admin configuration changes.',
      },
    ],
  },
  '/vanguard/app/recon': {
    id: 'vanguard-recon',
    title: 'Recon – Security Assessment',
    description: 'Vulnerability scanning, penetration testing, and Recon hardware management.',
    product: 'vanguard',
    tourId: 'vanguard-recon',
    sections: [
      {
        heading: 'Hardware Management',
        content: 'View and manage Recon hardware units assigned to your organizations. Each unit runs continuous security assessments.',
        tips: ['Use the Image Builder to provision new units', 'Units auto-report back to your dashboard'],
      },
      {
        heading: 'Vulnerability Scanner',
        content: 'Launch network, web app, or configuration scans. Results are categorized by severity with remediation guidance.',
      },
      {
        heading: 'Engagements',
        content: 'Create formal pentest engagements with defined scope, timelines, and deliverables for each client.',
      },
    ],
  },
  '/vanguard/app/comply': {
    id: 'vanguard-comply',
    title: 'Comply – Compliance Center',
    description: 'Track compliance across SOC 2, HIPAA, PCI-DSS, ISO 27001, and more.',
    product: 'vanguard',
    tourId: 'vanguard-comply',
    sections: [
      {
        heading: 'Overview',
        content: 'Aggregate compliance scores across all clients and frameworks. Identify at-risk organizations at a glance.',
      },
      {
        heading: 'Client Compliance',
        content: 'Drill into each client to enable frameworks, manage policies, and track their compliance journey.',
      },
      {
        heading: 'Compliance Scanner',
        content: 'Run automated checks against CIS benchmarks, NIST, and other frameworks. Reports are generated automatically.',
      },
    ],
  },

  // ===== SAFESUITE =====
  '/safesuite/dashboard': {
    id: 'safesuite-dashboard',
    title: 'Wrayth Dashboard',
    description: 'Your personal security command center with security score, breach alerts, and quick actions.',
    product: 'safesuite',
    sections: [
      {
        heading: 'Security Score',
        content: 'Your overall score reflects password strength, 2FA adoption, breach exposure, and scan frequency. Aim for 80%+.',
        tips: ['Enable 2FA for an instant score boost', 'Run regular scans to keep your score current'],
      },
      {
        heading: 'Quick Actions',
        content: 'Access password vault, threat scanner, breach monitor, and web protection from one place.',
      },
    ],
  },
  '/safesuite/pass': {
    id: 'safesuite-pass',
    title: 'Vault – Password Manager',
    description: 'Securely store, generate, and manage all your passwords with zero-knowledge encryption.',
    product: 'safesuite',
    tourId: 'safesuite-vault',
    sections: [
      {
        heading: 'Your Vault',
        content: 'All stored credentials organized by category. Use search or filters to find entries quickly.',
        tips: ['Click the dice icon to generate a strong password', 'Use categories to organize by type (work, personal, etc.)', 'The health tab shows weak or reused passwords'],
      },
      {
        heading: 'Adding Passwords',
        content: 'Click "+ Add Password" to store a new credential. Enter the site name, username, and password – we encrypt everything automatically.',
      },
      {
        heading: 'Password Health',
        content: 'The health dashboard analyzes all stored passwords for strength, reuse, and breach exposure. Fix flagged entries to improve your security score.',
      },
    ],
  },
  '/safesuite/scan': {
    id: 'safesuite-scan',
    title: 'Scan – Threat Scanner',
    description: 'Scan URLs, emails, and files for malware, phishing, and other threats.',
    product: 'safesuite',
    tourId: 'safesuite-scan',
    sections: [
      {
        heading: 'Scanning',
        content: 'Paste a URL, email content, or upload a file. Scan uses AI to detect threats, phishing attempts, and malicious content.',
        tips: ['Scan suspicious links before clicking them', 'Upload email attachments to check for malware', 'Results show a risk score and detailed breakdown'],
      },
      {
        heading: 'Scan History',
        content: 'All past scans are saved with results. Track patterns and see if previously safe sites become compromised.',
      },
    ],
  },
  '/safesuite/web': {
    id: 'safesuite-web',
    title: 'Watch – Dark Web Monitor',
    description: 'Continuous monitoring of the dark web for your exposed credentials and personal data.',
    product: 'safesuite',
    tourId: 'safesuite-breach',
    sections: [
      {
        heading: 'Monitored Items',
        content: 'Add email addresses and domains to monitor. We scan dark web marketplaces, paste sites, and breach databases 24/7.',
      },
      {
        heading: 'Breach Alerts',
        content: 'When your data appears in a breach, you\'ll get an immediate alert with details about what was exposed and recommended actions.',
        tips: ['Change compromised passwords immediately', 'Enable 2FA on breached accounts', 'Check the timeline to see when the breach occurred'],
      },
    ],
  },

  // ===== AI STUDIO =====
  '/dashboard': {
    id: 'ai-studio-dashboard',
    title: 'AI Studio Dashboard',
    description: 'Build, deploy, and manage custom AI assistants powered by GPT.',
    product: 'ai-studio',
    tourId: 'ai-studio-builder',
    sections: [
      {
        heading: 'Your GPTs',
        content: 'View all created AI assistants with their status, usage stats, and quick actions.',
        tips: ['Click any GPT card to edit or test it', 'Use templates for common use cases', 'Monitor credit usage in the analytics tab'],
      },
      {
        heading: 'Building a GPT',
        content: 'Click "Build a GPT" to start the wizard. Define identity, upload knowledge, configure behavior, and deploy – all in about 5 minutes.',
      },
      {
        heading: 'Deployment',
        content: 'Embed your GPT on websites, integrate with Slack/Teams, or use the API. Each GPT gets a unique embed code and API key.',
      },
    ],
  },

  // ===== GENERAL =====
  '/hub': {
    id: 'product-hub',
    title: 'Product Hub',
    description: 'Your central access point for all UltriumAI products and services.',
    product: 'general',
    sections: [
      {
        heading: 'Navigation',
        content: 'Click any product card to access Vanguard (MSP management), Wrayth (personal security), or AI Studio (custom GPTs).',
        tips: ['Use Cmd+K (or Ctrl+K) to open Spotlight Search for quick navigation', 'Press Shift+? to see all keyboard shortcuts'],
      },
    ],
  },
  '/settings': {
    id: 'settings',
    title: 'Settings',
    description: 'Configure your platform preferences, branding, notifications, and security.',
    product: 'general',
    tourId: 'settings',
    sections: [
      {
        heading: 'Profile & Branding',
        content: 'Update your display name, avatar, company details, and white-label branding (logo, colors).',
      },
      {
        heading: 'Notifications',
        content: 'Configure which events trigger email, push, or SMS notifications. Set quiet hours and notification grouping.',
      },
      {
        heading: 'Security',
        content: 'Enable two-factor authentication, manage API keys, set session timeout, and review login history.',
        tips: ['Enable 2FA for account security', 'Review active sessions regularly', 'Rotate API keys periodically'],
      },
    ],
  },
};

// Get instructions for a given route (supports partial matching)
export function getPageInstructions(pathname: string): PageInstruction | null {
  // Exact match first
  if (PAGE_INSTRUCTIONS[pathname]) {
    return PAGE_INSTRUCTIONS[pathname];
  }
  // Partial match (find longest matching prefix)
  let bestMatch: PageInstruction | null = null;
  let bestLength = 0;
  for (const [route, instruction] of Object.entries(PAGE_INSTRUCTIONS)) {
    if (pathname.startsWith(route) && route.length > bestLength) {
      bestMatch = instruction;
      bestLength = route.length;
    }
  }
  return bestMatch;
}

// Get all instructions grouped by product
export function getInstructionsByProduct() {
  const grouped: Record<string, PageInstruction[]> = {
    vanguard: [],
    safesuite: [],
    'ai-studio': [],
    general: [],
  };
  for (const instruction of Object.values(PAGE_INSTRUCTIONS)) {
    grouped[instruction.product].push(instruction);
  }
  return grouped;
}
