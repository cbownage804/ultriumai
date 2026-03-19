/**
 * Wave 5 Step 6: Slash command prompt templates library.
 * Categorized templates for common development tasks.
 */

export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
  category: 'ui' | 'backend' | 'testing' | 'styling' | 'features';
  icon: string;
  keywords: string[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // UI
  { id: 'landing', label: 'Landing Page', prompt: 'Create a modern landing page with hero section, features grid, testimonials, pricing cards, and footer', category: 'ui', icon: '🚀', keywords: ['landing', 'hero', 'homepage'] },
  { id: 'dashboard', label: 'Dashboard', prompt: 'Create an analytics dashboard with sidebar navigation, stat cards, charts, and recent activity feed', category: 'ui', icon: '📊', keywords: ['dashboard', 'analytics', 'admin'] },
  { id: 'form', label: 'Form Page', prompt: 'Create a multi-step form with validation, progress indicator, and confirmation step', category: 'ui', icon: '📝', keywords: ['form', 'input', 'wizard'] },
  { id: 'settings', label: 'Settings Page', prompt: 'Create a settings page with profile, notifications, billing, and security sections', category: 'ui', icon: '⚙️', keywords: ['settings', 'profile', 'preferences'] },
  { id: 'table', label: 'Data Table', prompt: 'Create a data table with sorting, filtering, pagination, and row actions', category: 'ui', icon: '📋', keywords: ['table', 'list', 'grid', 'data'] },

  // Backend
  { id: 'auth', label: 'Authentication', prompt: 'Add user authentication with login, signup, forgot password, and protected routes using Supabase Auth', category: 'backend', icon: '🔐', keywords: ['auth', 'login', 'signup', 'password'] },
  { id: 'crud', label: 'CRUD Operations', prompt: 'Create full CRUD operations with Supabase: create, read, update, delete with proper error handling', category: 'backend', icon: '🗄️', keywords: ['crud', 'database', 'create', 'read', 'update', 'delete'] },
  { id: 'api', label: 'API Integration', prompt: 'Set up API integration with proper error handling, loading states, and data caching', category: 'backend', icon: '🔌', keywords: ['api', 'fetch', 'integration', 'endpoint'] },
  { id: 'storage', label: 'File Upload', prompt: 'Add file upload with drag-and-drop, progress indicator, and Supabase Storage integration', category: 'backend', icon: '📁', keywords: ['upload', 'file', 'storage', 'image'] },

  // Testing
  { id: 'unit-tests', label: 'Unit Tests', prompt: 'Write comprehensive unit tests for all components using Vitest and Testing Library', category: 'testing', icon: '🧪', keywords: ['test', 'unit', 'vitest'] },
  { id: 'e2e', label: 'E2E Tests', prompt: 'Create end-to-end test scenarios for the main user flows', category: 'testing', icon: '🔬', keywords: ['e2e', 'integration', 'flow'] },

  // Styling
  { id: 'dark-mode', label: 'Dark Mode', prompt: 'Add dark/light mode toggle with system preference detection and smooth transitions', category: 'styling', icon: '🌙', keywords: ['dark', 'light', 'theme', 'mode'] },
  { id: 'responsive', label: 'Make Responsive', prompt: 'Make the entire application fully responsive for mobile, tablet, and desktop breakpoints', category: 'styling', icon: '📱', keywords: ['responsive', 'mobile', 'tablet'] },
  { id: 'animations', label: 'Add Animations', prompt: 'Add smooth animations and transitions using Framer Motion throughout the app', category: 'styling', icon: '✨', keywords: ['animation', 'motion', 'transition'] },

  // Features
  { id: 'search', label: 'Global Search', prompt: 'Add a global search feature with keyboard shortcut, filtering, and results highlighting', category: 'features', icon: '🔍', keywords: ['search', 'find', 'filter'] },
  { id: 'payments', label: 'Stripe Payments', prompt: 'Integrate Stripe payments with checkout flow, subscription management, and billing portal', category: 'features', icon: '💳', keywords: ['stripe', 'payment', 'billing', 'checkout'] },
  { id: 'notifications', label: 'Notifications', prompt: 'Add a notification system with real-time updates, bell icon, and notification center', category: 'features', icon: '🔔', keywords: ['notification', 'alert', 'bell'] },
  { id: 'i18n', label: 'Internationalization', prompt: 'Add multi-language support with i18n, language switcher, and RTL support', category: 'features', icon: '🌍', keywords: ['i18n', 'language', 'translation', 'locale'] },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'ui', label: 'UI', icon: '🎨' },
  { id: 'backend', label: 'Backend', icon: '⚡' },
  { id: 'testing', label: 'Testing', icon: '🧪' },
  { id: 'styling', label: 'Styling', icon: '✨' },
  { id: 'features', label: 'Features', icon: '🚀' },
] as const;

export function searchTemplates(query: string): PromptTemplate[] {
  const lower = query.toLowerCase().replace(/^\//, '');
  if (!lower) return PROMPT_TEMPLATES;
  return PROMPT_TEMPLATES.filter(t =>
    t.label.toLowerCase().includes(lower) ||
    t.category.includes(lower) ||
    t.keywords.some(k => k.includes(lower))
  );
}
