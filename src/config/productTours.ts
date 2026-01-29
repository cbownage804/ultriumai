import { TourStep } from '@/components/onboarding/ProductTour';

// SafeSuite Product Tour - Introduces key features to new users
export const SAFESUITE_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SafeSuite! 🎉',
    description: 'Your all-in-one security platform. Let us show you around the key features that will keep you and your team safe.',
    position: 'center',
  },
  {
    id: 'safepass',
    title: 'SafePass - Password Vault',
    description: 'Store all your passwords securely in one place. We use military-grade encryption to keep your credentials safe.',
    target: '[data-tour="safepass"]',
    position: 'bottom',
    action: {
      label: 'Open SafePass',
      onClick: () => window.location.href = '/safesuite/pass',
    },
  },
  {
    id: 'safescan',
    title: 'SafeScan - Threat Detection',
    description: 'Scan your emails, files, and links for threats. Our AI-powered scanner catches phishing attempts and malware.',
    target: '[data-tour="safescan"]',
    position: 'bottom',
  },
  {
    id: 'safeweb',
    title: 'SafeWeb - Dark Web Monitoring',
    description: 'We continuously monitor the dark web for your credentials. Get instant alerts if your data is compromised.',
    target: '[data-tour="safeweb"]',
    position: 'bottom',
  },
  {
    id: 'security-score',
    title: 'Your Security Score',
    description: 'Track your overall security posture. Complete tasks like enabling 2FA to improve your score and stay protected.',
    target: '[data-tour="security-score"]',
    position: 'right',
  },
  {
    id: 'complete',
    title: "You're All Set! ✅",
    description: 'Start by saving your first password or running a security scan. Our AI assistant is available 24/7 if you need help.',
    position: 'center',
  },
];

// AI Studio Product Tour
export const AI_STUDIO_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Studio! 🤖',
    description: 'Build, train, and deploy custom AI assistants in minutes. No coding required.',
    position: 'center',
  },
  {
    id: 'gpt-builder',
    title: 'Custom GPT Builder',
    description: 'Create AI assistants trained on your knowledge base. Perfect for customer support, sales, and internal tools.',
    target: '[data-tour="gpt-builder"]',
    position: 'bottom',
  },
  {
    id: 'templates',
    title: 'Start from Templates',
    description: 'Choose from 20+ pre-built templates to get started quickly. Customize them to fit your exact needs.',
    target: '[data-tour="templates"]',
    position: 'bottom',
  },
  {
    id: 'deployment',
    title: 'Deploy Anywhere',
    description: 'Embed your GPT on websites, integrate with Slack, or use our API. Deploy in one click.',
    target: '[data-tour="deployment"]',
    position: 'left',
  },
  {
    id: 'complete',
    title: 'Ready to Build! 🚀',
    description: 'Create your first Custom GPT now. Our AI will guide you through the setup process.',
    position: 'center',
  },
];

// Vanguard Product Tour
export const VANGUARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Vanguard! 🛡️',
    description: 'Enterprise-grade security operations for MSPs. Monitor, detect, and respond to threats across all your clients.',
    position: 'center',
  },
  {
    id: 'soc-dashboard',
    title: 'SOC Dashboard',
    description: 'Real-time threat detection with MITRE ATT&CK mapping. See all alerts across your client base in one view.',
    target: '[data-tour="soc-dashboard"]',
    position: 'bottom',
  },
  {
    id: 'rmm',
    title: 'SafeOps RMM',
    description: 'Monitor device health, patch status, and compliance. Automate routine maintenance tasks.',
    target: '[data-tour="rmm"]',
    position: 'bottom',
  },
  {
    id: 'helpdesk',
    title: 'SafeDesk',
    description: 'AI-powered helpdesk that prioritizes tickets and suggests solutions. Reduce resolution time by 50%.',
    target: '[data-tour="helpdesk"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'Welcome to the Team! 🎯',
    description: 'Add your first client to get started. Our onboarding wizard will help you configure monitoring.',
    position: 'center',
  },
];
