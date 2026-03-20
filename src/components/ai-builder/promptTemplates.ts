/**
 * Wave 5 Step 6 + Wave 14: Context-aware prompt templates library.
 */

import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
  category: 'ui' | 'backend' | 'testing' | 'styling' | 'features' | 'optimize' | 'polish' | 'scale';
  icon: string;
  keywords: string[];
  /** File patterns that indicate this feature is already implemented */
  detectPatterns?: RegExp[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // UI
  { id: 'landing', label: 'Landing Page', prompt: 'Create a modern landing page with hero section, features grid, testimonials, pricing cards, and footer', category: 'ui', icon: '🚀', keywords: ['landing', 'hero', 'homepage'], detectPatterns: [/hero/i, /landing/i] },
  { id: 'dashboard', label: 'Dashboard', prompt: 'Create an analytics dashboard with sidebar navigation, stat cards, charts, and recent activity feed', category: 'ui', icon: '📊', keywords: ['dashboard', 'analytics', 'admin'], detectPatterns: [/dashboard/i] },
  { id: 'form', label: 'Form Page', prompt: 'Create a multi-step form with validation, progress indicator, and confirmation step', category: 'ui', icon: '📝', keywords: ['form', 'input', 'wizard'] },
  { id: 'settings', label: 'Settings Page', prompt: 'Create a settings page with profile, notifications, billing, and security sections', category: 'ui', icon: '⚙️', keywords: ['settings', 'profile', 'preferences'], detectPatterns: [/settings/i] },
  { id: 'table', label: 'Data Table', prompt: 'Create a data table with sorting, filtering, pagination, and row actions', category: 'ui', icon: '📋', keywords: ['table', 'list', 'grid', 'data'] },

  // Backend
  { id: 'auth', label: 'Authentication', prompt: 'Add user authentication with login, signup, forgot password, and protected routes using Supabase Auth', category: 'backend', icon: '🔐', keywords: ['auth', 'login', 'signup', 'password'], detectPatterns: [/supabase.*auth|signIn|signUp|login/i] },
  { id: 'crud', label: 'CRUD Operations', prompt: 'Create full CRUD operations with Supabase: create, read, update, delete with proper error handling', category: 'backend', icon: '🗄️', keywords: ['crud', 'database', 'create', 'read', 'update', 'delete'] },
  { id: 'api', label: 'API Integration', prompt: 'Set up API integration with proper error handling, loading states, and data caching', category: 'backend', icon: '🔌', keywords: ['api', 'fetch', 'integration', 'endpoint'] },
  { id: 'storage', label: 'File Upload', prompt: 'Add file upload with drag-and-drop, progress indicator, and Supabase Storage integration', category: 'backend', icon: '📁', keywords: ['upload', 'file', 'storage', 'image'] },

  // Testing
  { id: 'unit-tests', label: 'Unit Tests', prompt: 'Write comprehensive unit tests for all components using Vitest and Testing Library', category: 'testing', icon: '🧪', keywords: ['test', 'unit', 'vitest'] },
  { id: 'e2e', label: 'E2E Tests', prompt: 'Create end-to-end test scenarios for the main user flows', category: 'testing', icon: '🔬', keywords: ['e2e', 'integration', 'flow'] },

  // Styling
  { id: 'dark-mode', label: 'Dark Mode', prompt: 'Add dark/light mode toggle with system preference detection and smooth transitions', category: 'styling', icon: '🌙', keywords: ['dark', 'light', 'theme', 'mode'], detectPatterns: [/dark:|dark-mode|useTheme|next-themes/i] },
  { id: 'responsive', label: 'Make Responsive', prompt: 'Make the entire application fully responsive for mobile, tablet, and desktop breakpoints', category: 'styling', icon: '📱', keywords: ['responsive', 'mobile', 'tablet'] },
  { id: 'animations', label: 'Add Animations', prompt: 'Add smooth animations and transitions using Framer Motion throughout the app', category: 'styling', icon: '✨', keywords: ['animation', 'motion', 'transition'], detectPatterns: [/framer-motion|motion\./i] },

  // Features
  { id: 'search', label: 'Global Search', prompt: 'Add a global search feature with keyboard shortcut, filtering, and results highlighting', category: 'features', icon: '🔍', keywords: ['search', 'find', 'filter'] },
  { id: 'payments', label: 'Stripe Payments', prompt: 'Integrate Stripe payments with checkout flow, subscription management, and billing portal', category: 'features', icon: '💳', keywords: ['stripe', 'payment', 'billing', 'checkout'], detectPatterns: [/stripe|@stripe/i] },
  { id: 'notifications', label: 'Notifications', prompt: 'Add a notification system with real-time updates, bell icon, and notification center', category: 'features', icon: '🔔', keywords: ['notification', 'alert', 'bell'] },
  { id: 'i18n', label: 'Internationalization', prompt: 'Add multi-language support with i18n, language switcher, and RTL support', category: 'features', icon: '🌍', keywords: ['i18n', 'language', 'translation', 'locale'] },

  // Optimize (new)
  { id: 'perf', label: 'Performance Audit', prompt: 'Optimize performance: add React.memo to expensive components, useMemo/useCallback where needed, lazy-load images, and code-split routes', category: 'optimize', icon: '⚡', keywords: ['performance', 'speed', 'optimize', 'memo'] },
  { id: 'seo', label: 'SEO Optimization', prompt: 'Add comprehensive SEO: meta tags, Open Graph, JSON-LD structured data, sitemap, semantic HTML, and proper heading hierarchy', category: 'optimize', icon: '🔎', keywords: ['seo', 'meta', 'google', 'search engine'] },
  { id: 'a11y', label: 'Accessibility Audit', prompt: 'Audit and fix accessibility: add ARIA labels, keyboard navigation, focus management, color contrast, screen reader support, and skip links', category: 'optimize', icon: '♿', keywords: ['accessibility', 'a11y', 'aria', 'screen reader'] },

  // Polish (new)
  { id: 'loading-states', label: 'Loading States', prompt: 'Add polished loading states throughout the app: skeleton loaders, spinner animations, progressive content reveals, and optimistic UI updates', category: 'polish', icon: '⏳', keywords: ['loading', 'skeleton', 'spinner', 'placeholder'] },
  { id: 'error-boundaries', label: 'Error Boundaries', prompt: 'Add React Error Boundaries with user-friendly error pages, retry buttons, and error reporting to all major sections', category: 'polish', icon: '🛡️', keywords: ['error', 'boundary', 'fallback', 'crash'] },
  { id: 'empty-states', label: 'Empty States', prompt: 'Design and implement empty state illustrations and CTAs for all data-driven sections (no data, no results, first-time user)', category: 'polish', icon: '📭', keywords: ['empty', 'no data', 'placeholder', 'onboarding'] },
  { id: 'micro-interactions', label: 'Micro-interactions', prompt: 'Add delightful micro-interactions: button hover effects, page transitions, toast animations, hover cards, and subtle scroll effects', category: 'polish', icon: '🎭', keywords: ['micro', 'hover', 'interaction', 'delight'] },

  // Scale (new)
  { id: 'pagination', label: 'Pagination', prompt: 'Add pagination to all list/table views with page size controls, URL sync, and smooth transitions', category: 'scale', icon: '📄', keywords: ['pagination', 'page', 'infinite scroll'] },
  { id: 'caching', label: 'Data Caching', prompt: 'Implement data caching with React Query: stale-while-revalidate, optimistic updates, prefetching, and cache invalidation', category: 'scale', icon: '💾', keywords: ['cache', 'react query', 'stale', 'prefetch'] },
  { id: 'lazy-loading', label: 'Lazy Loading', prompt: 'Add lazy loading for routes, images, and heavy components with React.lazy, Suspense, and intersection observers', category: 'scale', icon: '🦥', keywords: ['lazy', 'code split', 'suspense', 'dynamic import'] },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'ui', label: 'UI', icon: '🎨' },
  { id: 'backend', label: 'Backend', icon: '⚡' },
  { id: 'testing', label: 'Testing', icon: '🧪' },
  { id: 'styling', label: 'Styling', icon: '✨' },
  { id: 'features', label: 'Features', icon: '🚀' },
  { id: 'optimize', label: 'Optimize', icon: '⚡' },
  { id: 'polish', label: 'Polish', icon: '🎭' },
  { id: 'scale', label: 'Scale', icon: '📈' },
] as const;

/** Detect which templates are already implemented in the project. */
export function detectImplementedTemplates(files: ProjectFile[]): Set<string> {
  const implemented = new Set<string>();
  const allContent = files.map(f => f.content).join('\n');
  const allPaths = files.map(f => f.path.toLowerCase()).join('\n');

  for (const template of PROMPT_TEMPLATES) {
    if (!template.detectPatterns) continue;
    const isImplemented = template.detectPatterns.some(
      pattern => pattern.test(allContent) || pattern.test(allPaths)
    );
    if (isImplemented) implemented.add(template.id);
  }
  return implemented;
}

export function searchTemplates(query: string): PromptTemplate[] {
  const lower = query.toLowerCase().replace(/^\//, '');
  if (!lower) return PROMPT_TEMPLATES;
  return PROMPT_TEMPLATES.filter(t =>
    t.label.toLowerCase().includes(lower) ||
    t.category.includes(lower) ||
    t.keywords.some(k => k.includes(lower))
  );
}
