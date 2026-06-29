import { ContextualTipConfig } from '@/components/onboarding/ContextualTip';

// Wrayth Tips
export const SAFESUITE_TIPS: Record<string, ContextualTipConfig> = {
  passwordStrength: {
    id: 'safesuite-password-strength',
    title: 'Password Strength Meter',
    content: 'We analyze your passwords for length, complexity, and known breaches. Aim for 80%+ strength for maximum security.',
    position: 'right',
  },
  darkWebMonitor: {
    id: 'safesuite-dark-web-monitor',
    title: 'Dark Web Monitoring',
    content: 'We continuously scan the dark web for your email and credentials. Get instant alerts if your data appears in a breach.',
    position: 'bottom',
  },
  securityScore: {
    id: 'safesuite-security-score',
    title: 'Your Security Score',
    content: 'This score reflects your overall security posture. Enable 2FA, use strong passwords, and scan regularly to improve it.',
    position: 'left',
  },
  quickScan: {
    id: 'safesuite-quick-scan',
    title: 'Quick Scan',
    content: 'Paste any URL, email, or file to instantly check for malware, phishing, and other threats.',
    position: 'bottom',
  },
  passwordGenerator: {
    id: 'safesuite-password-generator',
    title: 'Password Generator',
    content: 'Click the dice icon to generate a secure, random password. Customize length and character types.',
    position: 'top',
  },
};

// AI Studio Tips
export const AI_STUDIO_TIPS: Record<string, ContextualTipConfig> = {
  creditsBalance: {
    id: 'ai-studio-credits',
    title: 'AI Credits',
    content: 'Credits are consumed when your GPTs respond. Longer responses use more credits. Monitor usage in the Analytics tab.',
    position: 'bottom',
  },
  systemPrompt: {
    id: 'ai-studio-system-prompt',
    title: 'System Prompt',
    content: 'This is the secret instruction that shapes your GPT\'s personality and behavior. Be specific about tone, format, and boundaries.',
    position: 'right',
  },
  knowledgeBase: {
    id: 'ai-studio-knowledge-base',
    title: 'Knowledge Base',
    content: 'Upload documents, paste URLs, or add text. Your GPT will use this as its source of truth for accurate responses.',
    position: 'bottom',
  },
  embedCode: {
    id: 'ai-studio-embed-code',
    title: 'Embed Your GPT',
    content: 'Copy this code to add your GPT to any website. Customize the widget appearance in the settings.',
    position: 'left',
  },
  conversationHistory: {
    id: 'ai-studio-conversation-history',
    title: 'Conversation History',
    content: 'All conversations are saved here. Review, export, or use them to improve your GPT\'s responses.',
    position: 'right',
  },
  templateLibrary: {
    id: 'ai-studio-templates',
    title: 'Template Library',
    content: 'Start from proven templates for customer support, sales, content writing, and more. Customize to fit your needs.',
    position: 'bottom',
  },
};

// Vanguard Tips
export const VANGUARD_TIPS: Record<string, ContextualTipConfig> = {
  threatLevel: {
    id: 'vanguard-threat-level',
    title: 'Threat Level Indicator',
    content: 'Real-time assessment based on active threats, vulnerability count, and compliance status across your network.',
    position: 'left',
  },
  socDashboard: {
    id: 'vanguard-soc-dashboard',
    title: 'SOC Dashboard',
    content: 'Your security operations command center. Monitor events, investigate threats, and coordinate response in real-time.',
    position: 'bottom',
  },
  mitreMapping: {
    id: 'vanguard-mitre-mapping',
    title: 'MITRE ATT&CK Mapping',
    content: 'We map detected threats to the MITRE ATT&CK framework, helping you understand attacker tactics and techniques.',
    position: 'right',
  },
  agentHealth: {
    id: 'vanguard-agent-health',
    title: 'Agent Health',
    content: 'Monitor the status of all deployed Vanguard agents. Green = healthy, Yellow = needs attention, Red = offline.',
    position: 'top',
  },
  automatedResponse: {
    id: 'vanguard-automated-response',
    title: 'Automated Response',
    content: 'Configure playbooks to automatically respond to common threats. Reduce response time from hours to seconds.',
    position: 'bottom',
  },
};

// Dashboard Tips
export const DASHBOARD_TIPS: Record<string, ContextualTipConfig> = {
  quickActions: {
    id: 'dashboard-quick-actions',
    title: 'Quick Actions',
    content: 'Access your most-used features in one click. Customize this section in Settings.',
    position: 'bottom',
  },
  notifications: {
    id: 'dashboard-notifications',
    title: 'Notification Center',
    content: 'Security alerts, system updates, and team messages all in one place. Click to see details.',
    position: 'bottom',
  },
  recentActivity: {
    id: 'dashboard-recent-activity',
    title: 'Recent Activity',
    content: 'Track your latest actions across all products. Click any item to jump back to where you left off.',
    position: 'left',
  },
  helpCenter: {
    id: 'dashboard-help-center',
    title: 'Need Help?',
    content: 'Access guided tours, tutorials, and documentation anytime. Replay tours to refresh your memory.',
    position: 'bottom',
  },
  sidebarCollapse: {
    id: 'dashboard-sidebar-collapse',
    title: 'Collapse Sidebar',
    content: 'Click the arrow to collapse the sidebar and get more screen space. Hover to peek.',
    position: 'right',
  },
};

// All tips combined for easy access
export const ALL_CONTEXTUAL_TIPS = {
  ...SAFESUITE_TIPS,
  ...AI_STUDIO_TIPS,
  ...VANGUARD_TIPS,
  ...DASHBOARD_TIPS,
};
