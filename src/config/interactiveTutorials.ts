import { TutorialStep } from '@/components/onboarding/InteractiveTutorial';

// Vault - Add Your First Password Tutorial
export const SAFEPASS_ADD_PASSWORD_TUTORIAL: TutorialStep[] = [
  {
    id: 'open-add-dialog',
    title: 'Open Add Password Dialog',
    instruction: 'Click the "Add Password" button to open the password form.',
    hint: 'Look for the button with a plus icon in the top-right area.',
    target: '[data-tutorial="add-password-btn"]',
    action: 'click',
  },
  {
    id: 'enter-website',
    title: 'Enter Website Name',
    instruction: 'Type the name of the website or service (e.g., "Gmail").',
    hint: 'This helps you identify which password is for which site.',
    target: '[data-tutorial="website-input"]',
    action: 'type',
    expectedValue: '',
  },
  {
    id: 'enter-username',
    title: 'Enter Username',
    instruction: 'Type your username or email for this account.',
    target: '[data-tutorial="username-input"]',
    action: 'type',
  },
  {
    id: 'enter-password',
    title: 'Enter Password',
    instruction: 'Type your password. We\'ll encrypt it automatically!',
    hint: 'Use a strong, unique password for better security.',
    target: '[data-tutorial="password-input"]',
    action: 'type',
  },
  {
    id: 'save-password',
    title: 'Save Your Password',
    instruction: 'Click Save to securely store your password.',
    target: '[data-tutorial="save-password-btn"]',
    action: 'click',
  },
];

// AI Studio - Create Your First GPT Tutorial
export const AI_STUDIO_CREATE_GPT_TUTORIAL: TutorialStep[] = [
  {
    id: 'click-create',
    title: 'Start Creating',
    instruction: 'Click "Build a GPT" to begin creating your custom AI assistant.',
    hint: 'This opens the GPT Builder wizard.',
    target: '[data-tutorial="build-gpt-btn"]',
    action: 'click',
  },
  {
    id: 'enter-name',
    title: 'Name Your GPT',
    instruction: 'Give your GPT a memorable name that describes its purpose.',
    hint: 'Example: "Customer Support Bot" or "Sales Assistant"',
    target: '[data-tutorial="gpt-name-input"]',
    action: 'type',
  },
  {
    id: 'enter-description',
    title: 'Add Description',
    instruction: 'Describe what your GPT does in a few sentences.',
    target: '[data-tutorial="gpt-description-input"]',
    action: 'type',
  },
  {
    id: 'select-category',
    title: 'Choose Category',
    instruction: 'Select a category that best fits your GPT.',
    target: '[data-tutorial="gpt-category-select"]',
    action: 'click',
  },
  {
    id: 'next-step',
    title: 'Continue to Knowledge',
    instruction: 'Click Next to add knowledge to your GPT.',
    target: '[data-tutorial="next-step-btn"]',
    action: 'click',
  },
];

// Vanguard - Deploy Your First Agent Tutorial
export const VANGUARD_DEPLOY_AGENT_TUTORIAL: TutorialStep[] = [
  {
    id: 'open-devices',
    title: 'Open Device Management',
    instruction: 'Navigate to the Devices section.',
    target: '[data-tutorial="devices-nav"]',
    action: 'click',
  },
  {
    id: 'click-add-device',
    title: 'Add New Device',
    instruction: 'Click "Add Device" to register a new endpoint.',
    hint: 'You can deploy agents to Windows, macOS, or Linux devices.',
    target: '[data-tutorial="add-device-btn"]',
    action: 'click',
  },
  {
    id: 'select-os',
    title: 'Select Operating System',
    instruction: 'Choose the operating system of your target device.',
    target: '[data-tutorial="os-select"]',
    action: 'click',
  },
  {
    id: 'download-agent',
    title: 'Download Agent',
    instruction: 'Click to download the Vanguard agent installer.',
    target: '[data-tutorial="download-agent-btn"]',
    action: 'click',
  },
];

// Scan - Run Your First Scan Tutorial
export const SAFESCAN_FIRST_SCAN_TUTORIAL: TutorialStep[] = [
  {
    id: 'open-scanner',
    title: 'Open Scan',
    instruction: 'Navigate to Scan in the sidebar.',
    target: '[data-tutorial="safescan-nav"]',
    action: 'click',
  },
  {
    id: 'select-scan-type',
    title: 'Choose Scan Type',
    instruction: 'Select what you want to scan: URL, Email, or File.',
    hint: 'URL scan is great for checking suspicious links.',
    target: '[data-tutorial="scan-type-tabs"]',
    action: 'click',
  },
  {
    id: 'enter-target',
    title: 'Enter Scan Target',
    instruction: 'Paste a URL or upload a file to scan.',
    target: '[data-tutorial="scan-input"]',
    action: 'type',
  },
  {
    id: 'start-scan',
    title: 'Start Scanning',
    instruction: 'Click "Scan" to analyze for threats.',
    target: '[data-tutorial="start-scan-btn"]',
    action: 'click',
  },
];

// Dashboard Quick Tour
export const DASHBOARD_QUICK_TUTORIAL: TutorialStep[] = [
  {
    id: 'view-stats',
    title: 'Check Your Stats',
    instruction: 'Hover over any stat card to see more details.',
    hint: 'Stats update in real-time as you use the platform.',
    target: '[data-tutorial="stats-grid"]',
    action: 'click',
  },
  {
    id: 'explore-quick-actions',
    title: 'Quick Actions',
    instruction: 'Click any quick action to get started fast.',
    target: '[data-tutorial="quick-actions"]',
    action: 'click',
  },
  {
    id: 'check-sidebar',
    title: 'Explore Navigation',
    instruction: 'Use the sidebar to access all features.',
    hint: 'You can collapse the sidebar for more space.',
    target: '[data-tutorial="sidebar"]',
    action: 'click',
  },
];

// All available tutorials for the Help Center
export const AVAILABLE_TUTORIALS = [
  {
    id: 'safepass-add-password',
    name: 'Add Your First Password',
    description: 'Learn how to securely store passwords in Vault',
    product: 'safesuite',
    duration: '2 min',
    steps: SAFEPASS_ADD_PASSWORD_TUTORIAL,
  },
  {
    id: 'safescan-first-scan',
    name: 'Run Your First Scan',
    description: 'Scan URLs, emails, or files for threats',
    product: 'safesuite',
    duration: '2 min',
    steps: SAFESCAN_FIRST_SCAN_TUTORIAL,
  },
  {
    id: 'ai-studio-create-gpt',
    name: 'Create Your First GPT',
    description: 'Build a custom AI assistant from scratch',
    product: 'ai-studio',
    duration: '5 min',
    steps: AI_STUDIO_CREATE_GPT_TUTORIAL,
  },
  {
    id: 'vanguard-deploy-agent',
    name: 'Deploy Your First Agent',
    description: 'Install Vanguard on your first endpoint',
    product: 'vanguard',
    duration: '3 min',
    steps: VANGUARD_DEPLOY_AGENT_TUTORIAL,
  },
  {
    id: 'dashboard-quick',
    name: 'Dashboard Quick Tour',
    description: 'Get familiar with the main dashboard',
    product: 'general',
    duration: '1 min',
    steps: DASHBOARD_QUICK_TUTORIAL,
  },
];
