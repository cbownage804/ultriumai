/**
 * Comprehensive Module Tours Configuration
 * Page-specific guided tours for all platform modules
 */

import { TourStep } from '@/components/onboarding/ProductTour';

// ============================================
// VANGUARD MODULE TOURS
// ============================================

export const VANGUARD_RESPONSE_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vanguard Response - Ticketing 🎫',
    description: 'Manage support requests with AI-powered automation. Let\'s explore the helpdesk module.',
    position: 'center',
  },
  {
    id: 'filters',
    title: 'Filter Tickets',
    description: 'Use filters to quickly find tickets by organization, status, priority, or assignee. Filters persist across sessions.',
    target: '[data-tour="ticket-filters"]',
    position: 'bottom',
  },
  {
    id: 'ticket-list',
    title: 'Ticket Queue',
    description: 'View all tickets in your queue. Color-coded by priority and SLA status. Click any ticket to open details.',
    target: '[data-tour="ticket-list"]',
    position: 'right',
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Create new tickets, run bulk actions, or export your ticket data with these shortcuts.',
    target: '[data-tour="ticket-actions"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'Ready to Respond! 🚀',
    description: 'Start by reviewing your open tickets. AI will help categorize and suggest responses automatically.',
    position: 'center',
  },
];

export const VANGUARD_HORIZON_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vanguard Horizon - RMM 🖥️',
    description: 'Remote monitoring and management for all your devices. See the health of your entire fleet.',
    position: 'center',
  },
  {
    id: 'device-grid',
    title: 'Device Overview',
    description: 'All connected devices at a glance. Green = healthy, yellow = warning, red = critical. Click for details.',
    target: '[data-tour="device-grid"]',
    position: 'bottom',
  },
  {
    id: 'health-stats',
    title: 'Fleet Health',
    description: 'Summary of device health, patch compliance, and security posture across your network.',
    target: '[data-tour="health-stats"]',
    position: 'bottom',
  },
  {
    id: 'actions',
    title: 'Remote Actions',
    description: 'Run scripts, deploy patches, restart services, or open remote access - all from here.',
    target: '[data-tour="device-actions"]',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'Horizon Ready! 🌅',
    description: 'Click any device to view detailed metrics, run diagnostics, or access remote control.',
    position: 'center',
  },
];

export const VANGUARD_PURSUIT_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vanguard Pursuit - Threats 🎯',
    description: 'Real-time security monitoring and threat detection. Stay ahead of attackers.',
    position: 'center',
  },
  {
    id: 'alert-feed',
    title: 'Alert Feed',
    description: 'Live stream of security events across your network. Filtered by severity and type.',
    target: '[data-tour="alert-feed"]',
    position: 'right',
  },
  {
    id: 'threat-stats',
    title: 'Threat Summary',
    description: 'Current threat levels and trends. Watch for spikes that need investigation.',
    target: '[data-tour="threat-stats"]',
    position: 'bottom',
  },
  {
    id: 'mitre-mapping',
    title: 'MITRE ATT&CK',
    description: 'Alerts are automatically mapped to MITRE ATT&CK techniques for context.',
    target: '[data-tour="mitre-matrix"]',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'Hunt Mode Engaged! 🔍',
    description: 'Review critical alerts first. Each alert shows affected systems and recommended actions.',
    position: 'center',
  },
];

export const VANGUARD_ATLAS_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vanguard Atlas - Docs 📚',
    description: 'Your centralized documentation hub. Passwords, configs, runbooks - all in one place.',
    position: 'center',
  },
  {
    id: 'org-selector',
    title: 'Organization Selector',
    description: 'Start by selecting a customer organization. All docs are scoped per-client.',
    target: '[data-tour="org-selector"]',
    position: 'right',
  },
  {
    id: 'doc-categories',
    title: 'Documentation Tabs',
    description: 'Navigate between documents, passwords, SSL certificates, configurations, and runbooks.',
    target: '[data-tour="doc-tabs"]',
    position: 'bottom',
  },
  {
    id: 'password-vault',
    title: 'Password Access',
    description: 'Securely stored credentials. Click to reveal, copy to clipboard, or auto-fill forms.',
    target: '[data-tour="password-vault"]',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'Atlas Ready! 🗺️',
    description: 'Select an organization and explore their documentation. Add new entries with the + button.',
    position: 'center',
  },
];

export const VANGUARD_CORTEX_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vanguard Cortex - AI 🧠',
    description: 'AI-powered automation for your MSP. Summarize tickets, detect patterns, generate docs.',
    position: 'center',
  },
  {
    id: 'ai-tools',
    title: 'AI Tools',
    description: 'Access ticket summarizer, pattern detector, KB generator, auto-router, and more.',
    target: '[data-tour="ai-tools"]',
    position: 'bottom',
  },
  {
    id: 'analytics',
    title: 'AI Analytics',
    description: 'Track AI usage, accuracy, and cost savings. See which tools provide most value.',
    target: '[data-tour="ai-analytics"]',
    position: 'left',
  },
  {
    id: 'settings',
    title: 'AI Settings',
    description: 'Configure prompts, thresholds, and limits for each AI tool.',
    target: '[data-tour="ai-settings"]',
    position: 'right',
  },
  {
    id: 'complete',
    title: 'Cortex Online! 🤖',
    description: 'Start with the Ticket Summarizer - it\'ll save hours every week.',
    position: 'center',
  },
];

// ============================================
// SAFESUITE MODULE TOURS
// ============================================

export const SAFESUITE_VAULT_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'SafePass Vault 🔐',
    description: 'Your secure password vault. AES-256 encrypted, zero-knowledge architecture.',
    position: 'center',
  },
  {
    id: 'password-list',
    title: 'Your Passwords',
    description: 'All stored credentials organized by category. Search or filter to find quickly.',
    target: '[data-tour="password-list"]',
    position: 'right',
  },
  {
    id: 'add-password',
    title: 'Add New',
    description: 'Click to add a new password. Enter URL, username, and password - we\'ll encrypt it.',
    target: '[data-tour="add-password"]',
    position: 'bottom',
  },
  {
    id: 'password-health',
    title: 'Password Health',
    description: 'See which passwords are weak, reused, or old. Improve your security score.',
    target: '[data-tour="password-health"]',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'Vault Secured! 🛡️',
    description: 'Start by importing your existing passwords or adding your most important accounts.',
    position: 'center',
  },
];

export const SAFESUITE_SCAN_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'SafeScan Threat Scanner 🔍',
    description: 'AI-powered scanning for emails, URLs, and files. Catch threats before they catch you.',
    position: 'center',
  },
  {
    id: 'scan-input',
    title: 'Scan Input',
    description: 'Paste suspicious content here - emails, links, or upload files for analysis.',
    target: '[data-tour="scan-input"]',
    position: 'bottom',
  },
  {
    id: 'scan-results',
    title: 'Analysis Results',
    description: 'Detailed breakdown of detected threats, risk scores, and recommended actions.',
    target: '[data-tour="scan-results"]',
    position: 'right',
  },
  {
    id: 'scan-history',
    title: 'Scan History',
    description: 'Review past scans and their results. Track patterns over time.',
    target: '[data-tour="scan-history"]',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'Ready to Scan! 🔬',
    description: 'Got a suspicious email? Paste it in and let SafeScan analyze it.',
    position: 'center',
  },
];

export const SAFESUITE_BREACH_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Breach Monitor 🌐',
    description: 'Continuous dark web monitoring for your credentials. Get alerted before criminals act.',
    position: 'center',
  },
  {
    id: 'monitored-items',
    title: 'Monitored Items',
    description: 'Email addresses and domains being scanned on the dark web continuously.',
    target: '[data-tour="monitored-items"]',
    position: 'right',
  },
  {
    id: 'breach-alerts',
    title: 'Breach Alerts',
    description: 'Active breaches requiring your attention. Click to see details and take action.',
    target: '[data-tour="breach-alerts"]',
    position: 'bottom',
  },
  {
    id: 'add-email',
    title: 'Add Monitoring',
    description: 'Add more email addresses or domains to monitor for exposures.',
    target: '[data-tour="add-email"]',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'Monitoring Active! 👁️',
    description: 'Your credentials are being monitored 24/7. We\'ll alert you instantly if found.',
    position: 'center',
  },
];

// ============================================
// AI STUDIO MODULE TOURS
// ============================================

export const AI_STUDIO_BUILDER_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'GPT Builder ✨',
    description: 'Create a custom AI assistant in minutes. No coding required - just describe what you need.',
    position: 'center',
  },
  {
    id: 'identity',
    title: 'Step 1: Identity',
    description: 'Name your GPT and give it a personality. This is how users will interact with it.',
    target: '[data-tour="gpt-identity"]',
    position: 'right',
  },
  {
    id: 'knowledge',
    title: 'Step 2: Knowledge',
    description: 'Upload documents, add URLs, or paste text. Your GPT learns from this content.',
    target: '[data-tour="gpt-knowledge"]',
    position: 'right',
  },
  {
    id: 'behavior',
    title: 'Step 3: Behavior',
    description: 'Define response style, guardrails, and limitations. Control how your GPT behaves.',
    target: '[data-tour="gpt-behavior"]',
    position: 'right',
  },
  {
    id: 'deploy',
    title: 'Step 4: Deploy',
    description: 'Embed on websites, integrate with Slack/Teams, or use via API.',
    target: '[data-tour="gpt-deploy"]',
    position: 'right',
  },
  {
    id: 'complete',
    title: 'Let\'s Build! 🚀',
    description: 'Follow the steps to create your first AI assistant. Takes about 5 minutes.',
    position: 'center',
  },
];

// ============================================
// SETTINGS & ADMIN TOURS
// ============================================

export const SETTINGS_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Settings Hub ⚙️',
    description: 'Configure your platform preferences. Branding, defaults, notifications, and more.',
    position: 'center',
  },
  {
    id: 'branding',
    title: 'Branding',
    description: 'Customize logo, colors, and company name for white-labeling.',
    target: '[data-tour="settings-branding"]',
    position: 'right',
  },
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'Set default views, priorities, refresh intervals, and display options.',
    target: '[data-tour="settings-defaults"]',
    position: 'right',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure email, push, and SMS notification preferences.',
    target: '[data-tour="settings-notifications"]',
    position: 'right',
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Enable 2FA, set session timeouts, and configure access policies.',
    target: '[data-tour="settings-security"]',
    position: 'right',
  },
  {
    id: 'complete',
    title: 'Configured! ✅',
    description: 'Make changes and click Save. Settings apply immediately across the platform.',
    position: 'center',
  },
];

// ============================================
// ADDITIONAL VANGUARD TOURS
// ============================================

export const VANGUARD_SENTINEL_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vanguard Sentinel - Cloud Security 🛡️',
    description: 'Monitor Microsoft 365 and Google Workspace tenants for suspicious activity, risky sign-ins, and admin changes.',
    position: 'center',
  },
  {
    id: 'stats',
    title: 'Security Overview',
    description: 'Key metrics at a glance: active alerts, critical threats, AI auto-resolved events, and mean time to resolution.',
    target: '[data-tour="sentinel-stats"]',
    position: 'bottom',
  },
  {
    id: 'tenants',
    title: 'Tenant Management',
    description: 'Connect your M365 and Google Workspace tenants here. Each tenant is monitored independently for security events.',
    target: '[data-tour="sentinel-tenants"]',
    position: 'bottom',
  },
  {
    id: 'ai-triage',
    title: 'AI Triage',
    description: 'Cortex AI automatically classifies, prioritizes, and can auto-dismiss low-risk alerts to reduce noise.',
    target: '[data-tour="sentinel-ai-triage"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'Sentinel Ready! 🔒',
    description: 'Connect a tenant to begin receiving security events. AI triage will start processing alerts automatically.',
    position: 'center',
  },
];

export const VANGUARD_RECON_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vanguard Recon - Pentesting 🎯',
    description: 'Run vulnerability scans, manage penetration testing engagements, and track remediation across your clients.',
    position: 'center',
  },
  {
    id: 'severity-cards',
    title: 'Vulnerability Summary',
    description: 'At-a-glance severity breakdown. Critical and high findings should be prioritized for remediation.',
    target: '[data-tour="recon-severity"]',
    position: 'bottom',
  },
  {
    id: 'scanner',
    title: 'Scanner',
    description: 'Launch network, web app, or configuration scans against target hosts. Results appear in the Findings tab.',
    target: '[data-tour="recon-scanner"]',
    position: 'bottom',
  },
  {
    id: 'engagements',
    title: 'Engagements',
    description: 'Create formal pentest engagements with defined scope, timelines, and deliverables for each client.',
    target: '[data-tour="recon-engagements"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'Recon Deployed! 🔍',
    description: 'Start by running a quick scan or creating a pentest engagement for a client.',
    position: 'center',
  },
];

export const VANGUARD_COMPLY_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vanguard Comply - Compliance Center 📋',
    description: 'Track compliance across SOC 2, HIPAA, PCI-DSS, ISO 27001, and more for every client.',
    position: 'center',
  },
  {
    id: 'overview',
    title: 'Compliance Overview',
    description: 'Aggregate scores, framework adoption, and at-risk clients all in one dashboard.',
    target: '[data-tour="comply-overview"]',
    position: 'bottom',
  },
  {
    id: 'clients',
    title: 'Client Compliance',
    description: 'Drill into each client to enable frameworks, manage policies, and track their compliance journey.',
    target: '[data-tour="comply-clients"]',
    position: 'bottom',
  },
  {
    id: 'scanner',
    title: 'Compliance Scanner',
    description: 'Run automated compliance checks against CIS benchmarks, NIST, and other frameworks.',
    target: '[data-tour="comply-scanner"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'Comply Active! ✅',
    description: 'Start by viewing the Client Compliance tab and enabling frameworks for your first client.',
    position: 'center',
  },
];

export const VANGUARD_LEDGER_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vanguard Ledger - Billing & Finance 💰',
    description: 'Manage invoicing, time tracking, billing schedules, and compliance reporting in one place.',
    position: 'center',
  },
  {
    id: 'reports',
    title: 'Compliance Reports',
    description: 'Generate audit-ready PDF and CSV reports from completed compliance scans with evidence and remediation steps.',
    target: '[data-tour="ledger-reports"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'Ledger Ready! 📊',
    description: 'Select a completed scan from the dropdown and generate your first compliance report.',
    position: 'center',
  },
];

// Export all module tours
export const MODULE_TOURS = {
  // Vanguard
  'vanguard-response': VANGUARD_RESPONSE_TOUR,
  'vanguard-horizon': VANGUARD_HORIZON_TOUR,
  'vanguard-pursuit': VANGUARD_PURSUIT_TOUR,
  'vanguard-atlas': VANGUARD_ATLAS_TOUR,
  'vanguard-cortex': VANGUARD_CORTEX_TOUR,
  'vanguard-sentinel': VANGUARD_SENTINEL_TOUR,
  'vanguard-recon': VANGUARD_RECON_TOUR,
  'vanguard-comply': VANGUARD_COMPLY_TOUR,
  'vanguard-ledger': VANGUARD_LEDGER_TOUR,
  
  // Wrayth
  'safesuite-vault': SAFESUITE_VAULT_TOUR,
  'safesuite-scan': SAFESUITE_SCAN_TOUR,
  'safesuite-breach': SAFESUITE_BREACH_TOUR,
  
  // AI Studio
  'ai-studio-builder': AI_STUDIO_BUILDER_TOUR,
  
  // Settings
  'settings': SETTINGS_TOUR,
} as const;

export type ModuleTourId = keyof typeof MODULE_TOURS;
