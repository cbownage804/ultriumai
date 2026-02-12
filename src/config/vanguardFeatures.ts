/**
 * Vanguard Features Configuration
 * Comprehensive feature set matching Atera + advanced security capabilities
 */

import { 
  Monitor, Shield, Zap, Users, FileText, Network, 
  BarChart3, Settings, Bell, Lock, Search, Globe,
  Cpu, Database, Cloud, Terminal, Eye, AlertTriangle,
  CheckCircle, RefreshCw, Mail, Calendar, Wrench,
  Activity, Brain, Target, Crosshair, Bug, Key,
  Server, HardDrive, Wifi, Link, Download, Upload,
  MessageSquare, Headphones, Clock, DollarSign, Package,
  Layers, Map, BookOpen, Fingerprint, ShieldCheck,
  Scan, Radio, Workflow, Boxes, Sparkles, type LucideIcon
} from 'lucide-react';

export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  route?: string;
  isNew?: boolean;
  isPremium?: boolean;
  comingSoon?: boolean;
}

export interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  features: Feature[];
  color: string; // Tailwind color class
}

export const VANGUARD_FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: 'rmm',
    name: 'Remote Monitoring & Management',
    description: 'Complete visibility and control over all endpoints with proactive IT management.',
    icon: Monitor,
    color: 'cyan',
    features: [
      {
        id: 'real-time-monitoring',
        name: 'Real-Time Monitoring & Alerts',
        description: 'Threshold-based alerting for CPU, RAM, disk, and custom metrics. Get notified before issues impact users.',
        icon: Activity,
        route: '/vanguard/alerts'
      },
      {
        id: 'device-management',
        name: 'Device Management',
        description: 'Full visibility into all managed devices across Windows, Mac, and Linux environments.',
        icon: Monitor,
        route: '/vanguard/devices'
      },
      {
        id: 'it-automation',
        name: 'IT Automation & Scripting',
        description: 'Automate manual tasks with PowerShell, Bash, and custom scripts. Schedule maintenance windows.',
        icon: Zap,
        route: '/vanguard/rmm'
      },
      {
        id: 'software-deployment',
        name: 'Software Deployment',
        description: 'Remote software installation via integrated package managers (Chocolatey, Homebrew).',
        icon: Download,
        route: '/vanguard/apps'
      },
      {
        id: 'snmp-monitoring',
        name: 'SNMP Monitoring',
        description: 'Monitor routers, switches, firewalls, printers, and other network devices via SNMP.',
        icon: Radio,
        route: '/vanguard/network'
      },
      {
        id: 'server-monitoring',
        name: 'Server Monitoring',
        description: 'Dedicated server health monitoring with advanced metrics and service tracking.',
        icon: Server,
        route: '/vanguard/devices'
      },
      {
        id: 'activity-log',
        name: 'Complete Activity Log',
        description: 'Every action and command is automatically logged for full audit trail compliance.',
        icon: FileText,
        route: '/vanguard/reports'
      },
      {
        id: 'it-documentation',
        name: 'IT Documentation',
        description: 'Centralized documentation for processes, passwords, and configurations.',
        icon: BookOpen,
        route: '/vanguard/knowledge'
      }
    ]
  },
  {
    id: 'psa',
    name: 'Professional Services Automation',
    description: 'Streamline helpdesk, billing, and client communications in one unified platform.',
    icon: Headphones,
    color: 'purple',
    features: [
      {
        id: 'helpdesk-ticketing',
        name: 'Helpdesk & Ticketing',
        description: 'Intuitive ticket management with SLA tracking, time logging, and customer communication.',
        icon: MessageSquare,
        route: '/vanguard/tickets'
      },
      {
        id: 'ai-ticket-tagging',
        name: 'AI Ticket Tagging',
        description: 'Automatic categorization of tickets using AI to streamline workflows and reporting.',
        icon: Brain,
        route: '/vanguard/ai-tagging',
        isNew: true
      },
      {
        id: 'ticket-automation',
        name: 'Ticket Automations',
        description: 'Automate ticket routing, escalation, and responses based on custom rules.',
        icon: Workflow,
        route: '/vanguard/helpdesk'
      },
      {
        id: 'customer-portal',
        name: 'Customer Portal',
        description: 'White-labeled self-service portal for ticket submission and knowledge base access.',
        icon: Globe,
        route: '/vanguard/portal'
      },
      {
        id: 'contracts-billing',
        name: 'Contracts & Billing',
        description: 'Flexible contract management with automated invoicing and usage tracking.',
        icon: DollarSign,
        route: '/vanguard/contracts'
      },
      {
        id: 'knowledge-base',
        name: 'Knowledge Base',
        description: 'Create and maintain articles, tips, and troubleshooting guides for technicians and clients.',
        icon: BookOpen,
        route: '/vanguard/knowledge'
      },
      {
        id: 'reports-analytics',
        name: 'Reports & Analytics',
        description: 'Generate on-demand or automated reports for clients, tickets, assets, and performance.',
        icon: BarChart3,
        route: '/vanguard/reports'
      },
      {
        id: 'custom-reports',
        name: 'Custom Report Builder',
        description: 'Build custom reports with drag-and-drop widgets and scheduled delivery.',
        icon: Layers,
        route: '/vanguard/report-builder'
      }
    ]
  },
  {
    id: 'autonomous-it',
    name: 'Autonomous IT & AI',
    description: 'AI-powered automation to accelerate resolution and reduce manual workload.',
    icon: Brain,
    color: 'violet',
    features: [
      {
        id: 'ai-copilot',
        name: 'AI Copilot',
        description: 'AI assistant that summarizes issues, generates scripts, suggests resolutions, and accelerates troubleshooting with real-time device diagnostics.',
        icon: Sparkles,
        route: '/vanguard/dashboard',
        isNew: true
      },
      {
        id: 'ticket-summaries',
        name: 'Instant Ticket Summaries',
        description: 'AI-generated summaries of ticket history so technicians can jump straight into resolution without reviewing long threads.',
        icon: FileText,
        route: '/vanguard/tickets',
        isNew: true
      },
      {
        id: 'script-generation',
        name: 'AI Script Generation',
        description: 'Turn plain-text instructions into PowerShell, Bash, or Python scripts instantly. No coding required.',
        icon: Terminal,
        route: '/vanguard/dashboard'
      },
      {
        id: 'command-generation',
        name: 'Command-Line Generation',
        description: 'Describe the problem in simple words and get the exact command to execute on the device.',
        icon: Terminal,
        route: '/vanguard/dashboard'
      },
      {
        id: 'kb-auto-generation',
        name: 'Knowledge Base Auto-Generation',
        description: 'Automatically generate KB articles from successful ticket resolutions to build an ever-growing solution library.',
        icon: BookOpen,
        route: '/vanguard/knowledge',
        isNew: true
      },
      {
        id: 'session-summaries',
        name: 'Remote Session Summaries',
        description: 'Generate itemized summaries of all actions performed during remote support sessions for documentation and billing.',
        icon: FileText,
        route: '/vanguard/devices'
      },
      {
        id: 'ai-autopilot',
        name: 'AI Autopilot',
        description: 'Autonomous IT agent that handles tier-1 tickets, common issues, and routine maintenance 24/7 without human intervention.',
        icon: Zap,
        route: '/vanguard/dashboard',
        isPremium: true
      },
      {
        id: 'predictive-analytics',
        name: 'Predictive Analytics',
        description: 'AI-driven predictions for hardware failures, capacity planning, and security risks before they impact users.',
        icon: Target,
        route: '/vanguard/executive'
      },
      {
        id: 'smart-alerting',
        name: 'Smart Alert Correlation',
        description: 'AI correlates related alerts to reduce noise and identify root causes faster.',
        icon: Bell,
        route: '/vanguard/advanced-alerting'
      },
      {
        id: 'ai-reporting',
        name: 'AI Performance Analytics',
        description: 'Track AI Copilot performance to identify where it excels and where to optimize.',
        icon: BarChart3,
        route: '/vanguard/reports',
        isNew: true
      }
    ]
  },
  {
    id: 'remote-access',
    name: 'Remote Access',
    description: 'Secure, fast remote sessions with built-in or bring-your-own-license options.',
    icon: Link,
    color: 'blue',
    features: [
      {
        id: 'meshcentral-integration',
        name: 'MeshCentral Integration',
        description: 'Zero-touch browser-based remote desktop with unattended access.',
        icon: Monitor,
        route: '/vanguard/devices'
      },
      {
        id: 'splashtop',
        name: 'Splashtop Integration',
        description: 'Premium remote access integration for enterprise-grade sessions.',
        icon: Monitor,
        isPremium: true
      },
      {
        id: 'attended-support',
        name: 'Attended & Unattended Support',
        description: 'Support users in real-time or perform maintenance on unattended devices.',
        icon: Users,
      },
      {
        id: 'file-transfer',
        name: 'Secure File Transfer',
        description: 'Transfer files during sessions with full encryption at rest and in transit.',
        icon: Upload,
      },
      {
        id: 'multi-monitor',
        name: 'Multi-Monitor Support',
        description: 'View and switch between multiple monitors without restarting sessions.',
        icon: Monitor,
      },
      {
        id: 'session-recording',
        name: 'Session Recording',
        description: 'Record remote sessions for compliance, training, and audit purposes.',
        icon: Eye,
        isPremium: true
      }
    ]
  },
  {
    id: 'patch-management',
    name: 'Patch Management',
    description: 'Automate patching across Windows, Mac, Linux, and third-party applications.',
    icon: RefreshCw,
    color: 'green',
    features: [
      {
        id: 'os-patching',
        name: 'OS Patch Automation',
        description: 'Schedule and deploy Windows, macOS, and Linux patches with approval workflows.',
        icon: RefreshCw,
        route: '/vanguard/patches'
      },
      {
        id: 'third-party-patching',
        name: 'Third-Party Patching',
        description: 'Automate updates for 200+ third-party applications including Adobe, Chrome, Java.',
        icon: Package,
        route: '/vanguard/patches'
      },
      {
        id: 'patch-reporting',
        name: 'Comprehensive Reporting',
        description: 'Track patch status, compliance rates, and failed installations across all endpoints.',
        icon: BarChart3,
        route: '/vanguard/reports'
      },
      {
        id: 'software-bundles',
        name: 'Software Bundles',
        description: 'Create reusable bundles for onboarding, department setups, and standardization.',
        icon: Boxes,
        route: '/vanguard/apps'
      },
      {
        id: 'maintenance-windows',
        name: 'Maintenance Windows',
        description: 'Schedule patching during off-hours to minimize user disruption.',
        icon: Clock,
        route: '/vanguard/patches'
      }
    ]
  },
  {
    id: 'network-discovery',
    name: 'Network Discovery',
    description: 'Real-time visibility of all devices, ports, and potential vulnerabilities on your networks.',
    icon: Network,
    color: 'orange',
    features: [
      {
        id: 'network-scanning',
        name: 'Network Scanning',
        description: 'Discover all devices on monitored networks including unknown and rogue endpoints.',
        icon: Search,
        route: '/vanguard/network'
      },
      {
        id: 'port-scanning',
        name: 'Port Scanning & CVE Detection',
        description: 'Identify open ports and map them to known vulnerabilities for attack surface reduction.',
        icon: Crosshair,
        route: '/vanguard/network'
      },
      {
        id: 'topology-map',
        name: 'Network Topology Map',
        description: 'Visual representation of network architecture with device relationships.',
        icon: Map,
        route: '/vanguard/network'
      },
      {
        id: 'ad-scanning',
        name: 'Active Directory Scanning',
        description: 'Integration with AD for user and device discovery across domains.',
        icon: Users,
        route: '/vanguard/network'
      },
      {
        id: 'asset-onboarding',
        name: 'Automated Onboarding',
        description: 'Automatically deploy agents to discovered devices for seamless onboarding.',
        icon: Download,
        route: '/vanguard/setup'
      }
    ]
  },
  {
    id: 'security-operations',
    name: 'Security Operations Center',
    description: 'Enterprise-grade security monitoring with threat detection and incident response.',
    icon: Shield,
    color: 'red',
    features: [
      {
        id: 'soc-dashboard',
        name: 'SOC Dashboard',
        description: '24/7 security monitoring with real-time threat visualization and MITRE ATT&CK mapping.',
        icon: Shield,
        route: '/vanguard/soc',
        isNew: true
      },
      {
        id: 'siem-integration',
        name: 'SIEM Dashboard',
        description: 'Centralized log aggregation and correlation for security event detection.',
        icon: Database,
        route: '/vanguard/siem'
      },
      {
        id: 'threat-intelligence',
        name: 'Threat Intelligence',
        description: 'Real-time threat feeds with IOC matching and reputation lookups.',
        icon: AlertTriangle,
        route: '/vanguard/threat-intel'
      },
      {
        id: 'incident-response',
        name: 'Incident Response Playbooks',
        description: 'Predefined and custom playbooks for automated incident handling.',
        icon: Workflow,
        route: '/vanguard/playbooks'
      },
      {
        id: 'user-behavior',
        name: 'User Behavior Analytics',
        description: 'Detect anomalous user activity and potential insider threats.',
        icon: Eye,
        route: '/vanguard/user-behavior'
      },
      {
        id: 'dark-web-monitoring',
        name: 'Dark Web Monitoring',
        description: 'Monitor for client credentials and data exposure on dark web marketplaces.',
        icon: Globe,
        route: '/vanguard/dark-web',
        isPremium: true
      }
    ]
  },
  {
    id: 'vulnerability-management',
    name: 'Vulnerability Management',
    description: 'Proactive vulnerability scanning with prioritized remediation workflows.',
    icon: Bug,
    color: 'amber',
    features: [
      {
        id: 'vulnerability-scanning',
        name: 'Vulnerability Scanning',
        description: 'Continuous scanning for CVEs across all managed endpoints and servers.',
        icon: Scan,
        route: '/vanguard/vulnscan'
      },
      {
        id: 'risk-prioritization',
        name: 'Risk-Based Prioritization',
        description: 'AI-powered risk scoring considering asset criticality and exploitability.',
        icon: Target,
        route: '/vanguard/vulnscan'
      },
      {
        id: 'remediation-automation',
        name: 'Remediation Automation',
        description: 'One-click patching and scripted remediation for discovered vulnerabilities.',
        icon: Wrench,
        route: '/vanguard/remediation'
      },
      {
        id: 'compliance-scanning',
        name: 'Compliance Scanning',
        description: 'Scan for CIS benchmarks, NIST, HIPAA, and other compliance frameworks.',
        icon: CheckCircle,
        route: '/vanguard/compliance'
      },
      {
        id: 'compliance-scorecard',
        name: 'Compliance Scorecard',
        description: 'Executive dashboards showing compliance posture across all clients.',
        icon: BarChart3,
        route: '/vanguard/scorecard'
      }
    ]
  },
  {
    id: 'penetration-testing',
    name: 'Penetration Testing',
    description: 'Offensive security capabilities to validate defenses and identify attack paths.',
    icon: Crosshair,
    color: 'rose',
    features: [
      {
        id: 'network-pentest',
        name: 'Network Penetration Testing',
        description: 'Automated network-layer testing with credential harvesting and lateral movement detection.',
        icon: Network,
        route: '/vanguard/pentest',
        isPremium: true
      },
      {
        id: 'web-app-scanning',
        name: 'Web Application Scanning',
        description: 'OWASP Top 10 testing for client web applications and APIs.',
        icon: Globe,
        route: '/vanguard/pentest',
        isPremium: true
      },
      {
        id: 'phishing-simulation',
        name: 'Phishing Simulation',
        description: 'Realistic phishing campaigns to test user awareness and training effectiveness.',
        icon: Mail,
        route: '/vanguard/pentest',
        isNew: true
      },
      {
        id: 'attack-path-analysis',
        name: 'Attack Path Analysis',
        description: 'Visualize potential attack paths from external to crown jewels.',
        icon: Map,
        route: '/vanguard/pentest'
      },
      {
        id: 'red-team-ops',
        name: 'Red Team Operations',
        description: 'Advanced adversary simulation with persistence and evasion techniques.',
        icon: Target,
        comingSoon: true,
        isPremium: true
      }
    ]
  },
  {
    id: 'endpoint-security',
    name: 'Endpoint Security',
    description: 'Multi-layered endpoint protection with EDR and antivirus capabilities.',
    icon: ShieldCheck,
    color: 'emerald',
    features: [
      {
        id: 'edr-protection',
        name: 'EDR Protection',
        description: 'Endpoint detection and response with process monitoring and threat containment.',
        icon: Shield,
        route: '/vanguard/soc'
      },
      {
        id: 'antivirus-management',
        name: 'Antivirus Management',
        description: 'Centralized AV deployment and management across all endpoints.',
        icon: ShieldCheck,
        route: '/vanguard/devices'
      },
      {
        id: 'device-isolation',
        name: 'Device Isolation',
        description: 'One-click network isolation for compromised endpoints during incident response.',
        icon: Lock,
        route: '/vanguard/soc'
      },
      {
        id: 'file-integrity',
        name: 'File Integrity Monitoring',
        description: 'Monitor critical system files for unauthorized changes.',
        icon: FileText,
        route: '/vanguard/soc'
      },
      {
        id: 'dns-filtering',
        name: 'DNS Filtering',
        description: 'Block malicious domains and enforce web policies at the DNS layer.',
        icon: Globe,
        isPremium: true
      }
    ]
  },
  {
    id: 'backup-bcdr',
    name: 'Backup & Disaster Recovery',
    description: 'Protect client data with automated backup monitoring and BCDR solutions.',
    icon: Cloud,
    color: 'sky',
    features: [
      {
        id: 'backup-monitoring',
        name: 'Backup Monitoring',
        description: 'Monitor backup job status across multiple vendors and alert on failures.',
        icon: HardDrive,
        route: '/vanguard/backups'
      },
      {
        id: 'backup-reporting',
        name: 'Backup Reporting',
        description: 'Generate compliance reports showing backup success rates and retention.',
        icon: BarChart3,
        route: '/vanguard/reports'
      },
      {
        id: 'cloud-backup',
        name: 'Cloud Backup Integration',
        description: 'Direct integration with Acronis, Axcient, and other BCDR solutions.',
        icon: Cloud,
        route: '/vanguard/apps'
      }
    ]
  },
  {
    id: 'identity-access',
    name: 'Identity & Access Management',
    description: 'Secure authentication and credential management for technicians and clients.',
    icon: Key,
    color: 'indigo',
    features: [
      {
        id: 'safepass',
        name: 'SafePass Password Manager',
        description: 'Zero-knowledge password vault with secure sharing for MSP teams.',
        icon: Key,
        route: '/vanguard/safepass'
      },
      {
        id: 'mfa-management',
        name: 'MFA Enforcement',
        description: 'Enforce multi-factor authentication across technician and client accounts.',
        icon: Fingerprint,
        route: '/vanguard/admin'
      },
      {
        id: 'sso-integration',
        name: 'SSO Integration',
        description: 'SAML and OIDC integration with Okta, Azure AD, and other identity providers.',
        icon: Lock,
        route: '/vanguard/admin',
        isPremium: true
      },
      {
        id: 'privileged-access',
        name: 'Privileged Access Management',
        description: 'Secure vault for admin credentials with just-in-time access.',
        icon: Key,
        route: '/vanguard/safepass',
        isPremium: true
      }
    ]
  },
  {
    id: 'integrations',
    name: 'Integrations & Marketplace',
    description: 'Connect your favorite tools and extend Vanguard with powerful integrations.',
    icon: Boxes,
    color: 'slate',
    features: [
      {
        id: 'integration-hub',
        name: 'Integration Hub',
        description: 'Browse and configure integrations with 50+ security and IT vendors.',
        icon: Package,
        route: '/vanguard/apps'
      },
      {
        id: 'api-access',
        name: 'REST API',
        description: 'Full API access for custom integrations and automation.',
        icon: Terminal,
        route: '/vanguard/marketplace'
      },
      {
        id: 'webhook-automation',
        name: 'Webhooks & Automation',
        description: 'Trigger external workflows via webhooks and Zapier integration.',
        icon: Workflow,
        route: '/vanguard/marketplace'
      },
      {
        id: 'psa-sync',
        name: 'PSA Synchronization',
        description: 'Two-way sync with ConnectWise, Autotask, and other PSA platforms.',
        icon: RefreshCw,
        route: '/vanguard/apps'
      },
      {
        id: 'accounting-sync',
        name: 'Accounting Integration',
        description: 'Sync invoices with QuickBooks, Xero, and other accounting platforms.',
        icon: DollarSign,
        route: '/vanguard/billing'
      }
    ]
  },
  {
    id: 'multi-tenant',
    name: 'Multi-Tenant Management',
    description: 'Manage multiple clients from a single console with complete data isolation.',
    icon: Layers,
    color: 'teal',
    features: [
      {
        id: 'tenant-management',
        name: 'Client/Tenant Management',
        description: 'Organize and manage unlimited clients with dedicated dashboards.',
        icon: Users,
        route: '/vanguard/customers'
      },
      {
        id: 'role-based-access',
        name: 'Role-Based Access Control',
        description: 'Granular permissions for technicians, admins, and clients.',
        icon: Lock,
        route: '/vanguard/admin'
      },
      {
        id: 'white-labeling',
        name: 'White-Label Branding',
        description: 'Customize portal with your logo, colors, and domain.',
        icon: Sparkles,
        route: '/vanguard/portal',
        isPremium: true
      },
      {
        id: 'executive-dashboards',
        name: 'Executive Dashboards',
        description: 'High-level dashboards for client QBRs and management reporting.',
        icon: BarChart3,
        route: '/vanguard/executive'
      }
    ]
  }
];

// Flatten all features for easy lookup
export const ALL_FEATURES: Feature[] = VANGUARD_FEATURE_CATEGORIES.flatMap(cat => cat.features);

// Get feature by ID
export const getFeatureById = (id: string): Feature | undefined => 
  ALL_FEATURES.find(f => f.id === id);

// Get category by ID
export const getCategoryById = (id: string): FeatureCategory | undefined =>
  VANGUARD_FEATURE_CATEGORIES.find(c => c.id === id);

// Feature highlights for marketing
export const FEATURE_HIGHLIGHTS = [
  'rmm',
  'psa', 
  'autonomous-it',
  'security-operations',
  'vulnerability-management',
  'penetration-testing'
];

// Count stats
export const FEATURE_STATS = {
  totalFeatures: ALL_FEATURES.length,
  totalCategories: VANGUARD_FEATURE_CATEGORIES.length,
  newFeatures: ALL_FEATURES.filter(f => f.isNew).length,
  premiumFeatures: ALL_FEATURES.filter(f => f.isPremium).length,
  comingSoonFeatures: ALL_FEATURES.filter(f => f.comingSoon).length
};
