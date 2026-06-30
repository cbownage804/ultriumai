import { TourStep } from '@/components/onboarding/ProductTour';

// Wrayth Product Tour - Introduces key features to new users
export const SAFESUITE_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Hi, I’m Ray.',
    description: "I’m your security teammate. I watch what matters, surface what’s urgent, and stay quiet when there’s nothing to do. Quick tour?",
    position: 'center',
  },
  {
    id: 'security-score',
    title: 'This is your score.',
    description: "It’s how I summarize your protection right now. When it moves, I’ll tell you why — and exactly what to do about it.",
    target: '[data-tour="security-score"]',
    position: 'right',
  },
  {
    id: 'safepass',
    title: 'I’ll take care of your passwords.',
    description: "Everything stays encrypted with your master password. I’ll flag the weak ones, the reused ones, and the ones caught in breaches.",
    target: '[data-tour="safepass"]',
    position: 'bottom',
  },
  {
    id: 'safescan',
    title: 'Send me anything suspicious.',
    description: "Emails, files, links — I’ll read them carefully and tell you in plain language whether they’re safe.",
    target: '[data-tour="safescan"]',
    position: 'bottom',
  },
  {
    id: 'safeweb',
    title: 'I’m watching the dark web for you.',
    description: "If your email, password, or identity shows up where it shouldn’t, you’ll hear from me — usually before anyone else notices.",
    target: '[data-tour="safeweb"]',
    position: 'bottom',
  },
  {
    id: 'quick-actions',
    title: 'Ask me anything.',
    description: "Press ⌘K and just ask. “Is my Gmail secure?” “What changed today?” I’ll pull the answer together.",
    target: '[data-tour="quick-actions"]',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'I’ve got it from here.',
    description: "I’ll keep watch and bring you a short brief each morning. If anything urgent happens, I won’t wait.",
    position: 'center',
  },
];

// AI Studio Product Tour
export const AI_STUDIO_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Studio! 🤖',
    description: 'Build, train, and deploy custom AI assistants in minutes. No coding required - just describe what you need.',
    position: 'center',
  },
  {
    id: 'stats-overview',
    title: 'Your Dashboard',
    description: 'Track your GPTs, conversations, user satisfaction, and remaining credits all in one place. These metrics update in real-time.',
    target: '[data-tour="stats-overview"]',
    position: 'bottom',
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Build a new GPT from scratch, start from templates, or chat with Studio Assistant - your AI co-pilot for building better bots.',
    target: '[data-tour="quick-actions"]',
    position: 'bottom',
  },
  {
    id: 'gpt-builder',
    title: 'GPT Builder',
    description: 'Create AI assistants trained on your knowledge base. Perfect for customer support, sales, internal tools, and more.',
    target: '[data-tour="gpt-builder"]',
    position: 'right',
  },
  {
    id: 'templates',
    title: 'Start from Templates',
    description: 'Choose from 20+ pre-built templates to get started quickly. Customer support, content writing, code review, and more - customize them to fit your needs.',
    target: '[data-tour="templates"]',
    position: 'right',
  },
  {
    id: 'pro-tips',
    title: 'Pro Tips',
    description: 'Hover over any tip to learn advanced techniques. Train on domain knowledge, connect APIs, white-label your brand, and more.',
    target: '[data-tour="pro-tips"]',
    position: 'top',
  },
  {
    id: 'complete',
    title: 'Ready to Build! 🚀',
    description: 'Create your first Custom GPT now. Need help? The ? icon in the header gives you access to tours and guides anytime.',
    position: 'center',
  },
];

// Vanguard Command Center Product Tour - Comprehensive walkthrough
export const VANGUARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Vanguard Command! 🎯',
    description: 'Your unified security operations center. This dashboard gives you complete visibility across all your clients, devices, and security events.',
    position: 'center',
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions Bar',
    description: 'Create new tickets, customers, or devices instantly. The search bar helps you find anything across your entire organization.',
    target: '[data-tour="vanguard-header"]',
    position: 'bottom',
  },
  {
    id: 'ticket-status',
    title: 'Vanguard Response — Ticket Status',
    description: 'Track your helpdesk tickets at a glance. See open, pending, due today, and overdue tickets. Click any status to jump to filtered views.',
    target: '[data-tour="ticket-status"]',
    position: 'bottom',
  },
  {
    id: 'alert-status',
    title: 'Vanguard Pursuit — Active Threats',
    description: 'Real-time security alerts from all your endpoints. Warning and Critical alerts require immediate attention.',
    target: '[data-tour="alert-status"]',
    position: 'left',
  },
  {
    id: 'device-health',
    title: 'Vanguard Horizon — Device Health',
    description: 'Monitor the availability of all devices across your fleet. Servers, PCs, Macs, Linux machines, and SNMP devices are tracked in real-time.',
    target: '[data-tour="availability-monitoring"]',
    position: 'right',
  },
  {
    id: 'recent-alerts',
    title: 'Recent Alerts',
    description: 'See the latest security events from across your network. Click any alert to investigate and respond.',
    target: '[data-tour="recent-alerts"]',
    position: 'top',
  },
  {
    id: 'ticket-activity',
    title: 'Ticket Activity',
    description: 'Track ticket trends over time. Opened vs resolved tickets help you measure team performance and workload.',
    target: '[data-tour="ticket-activity"]',
    position: 'top',
  },
  {
    id: 'customer-tickets',
    title: 'Customer Tickets',
    description: 'See which clients have the most active tickets. Helps you identify accounts that need more attention.',
    target: '[data-tour="customer-tickets"]',
    position: 'right',
  },
  {
    id: 'critical-tickets',
    title: 'Critical & Overdue Tickets',
    description: 'Urgent tickets that need immediate action. Never miss an SLA deadline with this priority view.',
    target: '[data-tour="critical-tickets"]',
    position: 'left',
  },
  {
    id: 'navigation',
    title: 'Navigation Sidebar',
    description: 'Access all Vanguard modules from the sidebar: Horizon (RMM), Pursuit (Threats), Response (Helpdesk), Recon (Discovery), Atlas (Documentation), and Cortex (AI).',
    target: '[data-tour="vanguard-sidebar"]',
    position: 'right',
  },
  {
    id: 'help-center',
    title: 'Need Help?',
    description: 'Click the ? icon anytime to replay this tour, access documentation, or get support. You can restart the tour from the Help Center.',
    target: '[data-tour="help-button"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re Ready to Command! 🚀',
    description: 'Start by installing an agent on your first device or exploring the navigation. Welcome to the team!',
    position: 'center',
  },
];

// Legacy simplified tour for VanguardHome (kept for backwards compatibility)
export const VANGUARD_HOME_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Vanguard! 🎯',
    description: 'Enterprise-grade security operations for MSPs. Monitor, detect, and respond to threats across all your clients from one dashboard.',
    position: 'center',
  },
  {
    id: 'quick-stats',
    title: 'Security Overview',
    description: 'At a glance: active devices, detected threats, security score, and today\'s alerts. This is your command center for security operations.',
    target: '[data-tour="quick-stats"]',
    position: 'bottom',
  },
  {
    id: 'soc-dashboard',
    title: 'SOC Dashboard',
    description: 'Real-time threat detection with MITRE ATT&CK mapping. See all security events across your client base in one unified view.',
    target: '[data-tour="soc-dashboard"]',
    position: 'bottom',
  },
  {
    id: 'devices',
    title: 'Device Management',
    description: 'Monitor all Vanguard agents deployed across your network. Track device health, patch status, and compliance in real-time.',
    target: '[data-tour="devices"]',
    position: 'bottom',
  },
  {
    id: 'threat-detection',
    title: 'Threat Detection',
    description: 'AI-powered threat analysis identifies malware, ransomware, and suspicious behavior. Automated response playbooks handle common threats.',
    target: '[data-tour="threat-detection"]',
    position: 'bottom',
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features',
    description: 'Explore SIEM, penetration testing, compliance monitoring, and more. Each module is designed for enterprise-grade security operations.',
    target: '[data-tour="advanced-features"]',
    position: 'top',
  },
  {
    id: 'complete',
    title: 'Welcome to the Team! 🎯',
    description: 'Start by adding your first device or reviewing the dashboard. Access tours and guides anytime from the ? icon.',
    position: 'center',
  },
];

// Dashboard Overview Tour for AI Studio
export const DASHBOARD_OVERVIEW_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Dashboard! 👋',
    description: 'This is your home base for AI Studio. Let\'s take a quick tour of what\'s available.',
    position: 'center',
  },
  {
    id: 'metrics',
    title: 'Your Metrics',
    description: 'Track your GPTs, conversations, satisfaction scores, and credits. Click any card to dive deeper into the details.',
    target: '[data-tour="metrics"]',
    position: 'bottom',
  },
  {
    id: 'sidebar',
    title: 'Navigation',
    description: 'Use the sidebar to access all features: GPT management, templates, team settings, and more. You can collapse it for more space.',
    target: '[data-tour="sidebar"]',
    position: 'right',
  },
  {
    id: 'help-center',
    title: 'Need Help?',
    description: 'Click the ? icon anytime to access guided tours, documentation, and tutorials. You can replay any tour from here.',
    target: '[data-tour="help-center"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re Ready! ✨',
    description: 'Start building by clicking "Build a GPT" in Quick Actions. Happy creating!',
    position: 'center',
  },
];

// Quick tour for returning users showing new features
export const WHATS_NEW_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'What\'s New! ✨',
    description: 'We\'ve added some exciting features. Let\'s show you what\'s changed.',
    position: 'center',
  },
  {
    id: 'help-center',
    title: 'Help Center',
    description: 'New! Access guided tours, documentation, and tutorials anytime. Replay any tour or reset your onboarding progress.',
    target: '[data-tour="help-center"]',
    position: 'bottom',
  },
  {
    id: 'credits',
    title: 'Credit Indicator',
    description: 'See your remaining credits at a glance. Click to view detailed usage and top up if needed.',
    target: '[data-tour="credits"]',
    position: 'bottom',
  },
  {
    id: 'notifications',
    title: 'Notification Center',
    description: 'Stay updated with security alerts, system updates, and important messages all in one place.',
    target: '[data-tour="notifications"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'All Caught Up! 🎉',
    description: 'That\'s everything new. Keep building amazing things!',
    position: 'center',
  },
];

// Feature-specific micro tours
export const SAFEPASS_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Vault Password Vault 🔐',
    description: 'Store, organize, and autofill your passwords securely. Let\'s show you the key features.',
    position: 'center',
  },
  {
    id: 'add-password',
    title: 'Add Passwords',
    description: 'Click here to add a new password. Enter the website, username, and password - we\'ll encrypt it automatically.',
    target: '[data-tour="add-password"]',
    position: 'bottom',
  },
  {
    id: 'password-list',
    title: 'Your Vault',
    description: 'All your passwords are listed here. Click any entry to view, edit, or copy credentials. Use the search to find entries quickly.',
    target: '[data-tour="password-list"]',
    position: 'right',
  },
  {
    id: 'password-health',
    title: 'Password Health',
    description: 'We analyze your passwords for strength and duplicates. Fix weak passwords to improve your security score.',
    target: '[data-tour="password-health"]',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'Ready to Secure! 🛡️',
    description: 'Start adding your passwords. We recommend starting with your most important accounts.',
    position: 'center',
  },
];

export const CUSTOM_GPT_BUILDER_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'GPT Builder ✨',
    description: 'Create a custom AI assistant in just a few steps. Let\'s walk through the process.',
    position: 'center',
  },
  {
    id: 'identity',
    title: 'Step 1: Identity',
    description: 'Give your GPT a name, avatar, and description. This is how users will recognize your assistant.',
    target: '[data-tour="gpt-identity"]',
    position: 'right',
  },
  {
    id: 'knowledge',
    title: 'Step 2: Knowledge',
    description: 'Upload documents, add URLs, or paste text. Your GPT will learn from this content to answer questions accurately.',
    target: '[data-tour="gpt-knowledge"]',
    position: 'right',
  },
  {
    id: 'behavior',
    title: 'Step 3: Behavior',
    description: 'Define how your GPT responds. Set the tone, add guardrails, and configure response limits.',
    target: '[data-tour="gpt-behavior"]',
    position: 'right',
  },
  {
    id: 'deploy',
    title: 'Step 4: Deploy',
    description: 'Choose how to share your GPT: embed on websites, integrate with Slack, or use our API.',
    target: '[data-tour="gpt-deploy"]',
    position: 'right',
  },
  {
    id: 'complete',
    title: 'Let\'s Build! 🚀',
    description: 'Follow the steps to create your first GPT. It only takes a few minutes!',
    position: 'center',
  },
];
