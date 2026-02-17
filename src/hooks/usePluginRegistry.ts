import { useState, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────

export type PluginHook =
  | 'beforeBuild'
  | 'afterBuild'
  | 'beforeSave'
  | 'afterSave'
  | 'onFileChange'
  | 'onPreviewReady'
  | 'onError'
  | 'transformCode'
  | 'transformHTML'
  | 'onCommand';

export interface PluginConfig {
  key: string;
  label: string;
  type: 'string' | 'boolean' | 'number' | 'select';
  default: any;
  options?: string[]; // for select type
  description?: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  category: 'linter' | 'formatter' | 'deploy' | 'ai' | 'theme' | 'analytics' | 'security' | 'integration' | 'tool';
  hooks: PluginHook[];
  config?: PluginConfig[];
  dependencies?: string[]; // other plugin IDs
  tags?: string[];
  rating?: number;
  downloads?: number;
  homepage?: string;
  featured?: boolean;
  minVersion?: string;
}

export interface InstalledPlugin {
  manifest: PluginManifest;
  enabled: boolean;
  configValues: Record<string, any>;
  installedAt: number;
  lastUpdated: number;
}

export interface PluginEvent {
  hook: PluginHook;
  pluginId: string;
  data: any;
  timestamp: number;
}

type HookHandler = (data: any) => any;

// ─── Registry Catalogue ─────────────────────────────────────

export const PLUGIN_CATALOGUE: PluginManifest[] = [
  // ── Featured ──
  {
    id: 'ai-code-review',
    name: 'AI Code Review',
    version: '2.0.0',
    author: 'Ultrium Labs',
    description: 'Automated code review with inline suggestions, security checks, and best-practice enforcement powered by AI.',
    icon: '🔬',
    category: 'ai',
    hooks: ['afterBuild', 'transformCode'],
    config: [
      { key: 'strictness', label: 'Strictness', type: 'select', default: 'balanced', options: ['relaxed', 'balanced', 'strict'], description: 'How strict the review should be' },
      { key: 'autoFix', label: 'Auto-fix issues', type: 'boolean', default: false },
    ],
    tags: ['ai', 'review', 'quality'],
    rating: 4.9,
    downloads: 62000,
    featured: true,
  },
  {
    id: 'tailwind-intellisense',
    name: 'Tailwind IntelliSense',
    version: '3.1.0',
    author: 'Tailwind Labs',
    description: 'Autocomplete, linting, and class sorting for Tailwind CSS directly in the editor.',
    icon: '🎨',
    category: 'formatter',
    hooks: ['transformCode', 'onFileChange'],
    config: [
      { key: 'sortOnSave', label: 'Sort classes on save', type: 'boolean', default: true },
      { key: 'lint', label: 'Enable linting', type: 'boolean', default: true },
    ],
    tags: ['tailwind', 'css', 'autocomplete'],
    rating: 4.8,
    downloads: 55000,
    featured: true,
  },
  {
    id: 'performance-monitor',
    name: 'Performance Monitor',
    version: '1.5.0',
    author: 'Ultrium Labs',
    description: 'Real-time bundle analysis, render profiling, and Core Web Vitals tracking in the preview.',
    icon: '📊',
    category: 'analytics',
    hooks: ['afterBuild', 'onPreviewReady'],
    config: [
      { key: 'budgetKB', label: 'Bundle budget (KB)', type: 'number', default: 200 },
      { key: 'trackCWV', label: 'Track Core Web Vitals', type: 'boolean', default: true },
    ],
    tags: ['performance', 'bundle', 'web-vitals'],
    rating: 4.7,
    downloads: 38000,
    featured: true,
  },
  // ── Linters ──
  {
    id: 'eslint-plugin',
    name: 'ESLint',
    version: '9.5.0',
    author: 'ESLint Team',
    description: 'JavaScript & TypeScript linting with auto-fix and inline error decorations.',
    icon: '🔍',
    category: 'linter',
    hooks: ['onFileChange', 'beforeBuild', 'transformCode'],
    config: [
      { key: 'preset', label: 'Preset', type: 'select', default: 'recommended', options: ['recommended', 'strict', 'stylistic'] },
      { key: 'fixOnSave', label: 'Fix on save', type: 'boolean', default: true },
    ],
    tags: ['lint', 'javascript', 'typescript'],
    rating: 4.8,
    downloads: 52000,
  },
  {
    id: 'a11y-checker',
    name: 'Accessibility Checker',
    version: '2.3.0',
    author: 'A11y Foundation',
    description: 'Automatic WCAG 2.1 AA/AAA compliance checking with actionable fix suggestions.',
    icon: '♿',
    category: 'linter',
    hooks: ['afterBuild', 'transformHTML'],
    config: [
      { key: 'level', label: 'Conformance', type: 'select', default: 'AA', options: ['A', 'AA', 'AAA'] },
    ],
    tags: ['accessibility', 'wcag', 'a11y'],
    rating: 4.5,
    downloads: 14000,
  },
  // ── Formatters ──
  {
    id: 'prettier-plugin',
    name: 'Prettier',
    version: '3.4.0',
    author: 'Prettier Team',
    description: 'Opinionated code formatter for JS, TS, CSS, HTML, JSON, and Markdown.',
    icon: '✨',
    category: 'formatter',
    hooks: ['beforeSave', 'transformCode'],
    config: [
      { key: 'tabWidth', label: 'Tab width', type: 'number', default: 2 },
      { key: 'semi', label: 'Semicolons', type: 'boolean', default: true },
      { key: 'singleQuote', label: 'Single quotes', type: 'boolean', default: true },
    ],
    tags: ['format', 'style', 'code'],
    rating: 4.9,
    downloads: 48000,
  },
  // ── Deploy ──
  {
    id: 'vercel-deploy',
    name: 'Vercel Deploy',
    version: '2.3.0',
    author: 'Vercel',
    description: 'One-click deployment to Vercel with preview URLs and automatic rollbacks.',
    icon: '▲',
    category: 'deploy',
    hooks: ['afterBuild', 'onCommand'],
    config: [
      { key: 'autoDeploy', label: 'Deploy on build', type: 'boolean', default: false },
      { key: 'framework', label: 'Framework', type: 'select', default: 'vite', options: ['vite', 'next', 'static'] },
    ],
    tags: ['deploy', 'hosting', 'ci-cd'],
    rating: 4.7,
    downloads: 34000,
  },
  {
    id: 'docker-builder',
    name: 'Docker Builder',
    version: '1.6.0',
    author: 'Community',
    description: 'Generate Dockerfiles and docker-compose configs for your project.',
    icon: '🐳',
    category: 'deploy',
    hooks: ['onCommand'],
    tags: ['docker', 'container', 'devops'],
    rating: 4.4,
    downloads: 18000,
  },
  // ── Security ──
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    version: '1.2.0',
    author: 'Ultrium Security',
    description: 'Scans for XSS, SQL injection, exposed secrets, and insecure dependencies.',
    icon: '🛡️',
    category: 'security',
    hooks: ['afterBuild', 'onFileChange'],
    config: [
      { key: 'scanSecrets', label: 'Scan for secrets', type: 'boolean', default: true },
      { key: 'scanDeps', label: 'Scan dependencies', type: 'boolean', default: true },
    ],
    tags: ['security', 'vulnerability', 'scan'],
    rating: 4.6,
    downloads: 21000,
  },
  // ── Integrations ──
  {
    id: 'github-sync',
    name: 'GitHub Sync',
    version: '2.0.0',
    author: 'GitHub',
    description: 'Two-way sync with GitHub repos including branch management and PR creation.',
    icon: '🐙',
    category: 'integration',
    hooks: ['afterSave', 'onCommand'],
    dependencies: [],
    tags: ['git', 'github', 'sync'],
    rating: 4.6,
    downloads: 29000,
  },
  {
    id: 'figma-import',
    name: 'Figma Import',
    version: '1.0.0',
    author: 'Community',
    description: 'Import Figma designs as React components with automatic Tailwind styling.',
    icon: '🎯',
    category: 'integration',
    hooks: ['onCommand', 'transformCode'],
    tags: ['figma', 'design', 'import'],
    rating: 4.3,
    downloads: 11000,
  },
  // ── Themes ──
  {
    id: 'dracula-theme',
    name: 'Dracula Theme',
    version: '1.4.0',
    author: 'Dracula Theme',
    description: 'The iconic dark theme for the code editor.',
    icon: '🧛',
    category: 'theme',
    hooks: ['onCommand'],
    tags: ['theme', 'dark', 'editor'],
    rating: 4.7,
    downloads: 22000,
  },
  {
    id: 'nord-theme',
    name: 'Nord Theme',
    version: '1.2.0',
    author: 'Arctic',
    description: 'Arctic, north-bluish color palette for the editor.',
    icon: '❄️',
    category: 'theme',
    hooks: ['onCommand'],
    tags: ['theme', 'light', 'editor'],
    rating: 4.5,
    downloads: 16000,
  },
  // ── Tools ──
  {
    id: 'git-lens',
    name: 'Git Lens',
    version: '3.2.0',
    author: 'Community',
    description: 'Enhanced git blame, inline history, and diff visualizations.',
    icon: '📜',
    category: 'tool',
    hooks: ['onFileChange'],
    tags: ['git', 'blame', 'history'],
    rating: 4.6,
    downloads: 20000,
  },
  {
    id: 'import-cost',
    name: 'Import Cost',
    version: '1.3.0',
    author: 'Community',
    description: 'Display inline the size of imported packages in the editor.',
    icon: '📦',
    category: 'tool',
    hooks: ['onFileChange', 'transformCode'],
    tags: ['bundle', 'size', 'imports'],
    rating: 4.5,
    downloads: 24000,
  },
  {
    id: 'snippet-library',
    name: 'Snippet Library',
    version: '1.1.0',
    author: 'Ultrium Labs',
    description: 'Save, organize, and insert reusable code snippets across projects.',
    icon: '📋',
    category: 'tool',
    hooks: ['onCommand'],
    config: [
      { key: 'syncCloud', label: 'Sync to cloud', type: 'boolean', default: false },
    ],
    tags: ['snippets', 'reuse', 'productivity'],
    rating: 4.4,
    downloads: 13000,
  },
];

// ─── Hook ────────────────────────────────────────────────────

export function usePluginRegistry() {
  const [installed, setInstalled] = useState<Map<string, InstalledPlugin>>(new Map());
  const [eventLog, setEventLog] = useState<PluginEvent[]>([]);
  const hookHandlers = useRef<Map<PluginHook, Map<string, HookHandler>>>(new Map());

  /** Install a plugin from the catalogue */
  const installPlugin = useCallback((pluginId: string, configOverrides?: Record<string, any>) => {
    const manifest = PLUGIN_CATALOGUE.find(p => p.id === pluginId);
    if (!manifest) return false;

    // Check dependencies
    if (manifest.dependencies?.length) {
      for (const depId of manifest.dependencies) {
        if (!installed.has(depId)) {
          return { error: `Missing dependency: ${depId}` };
        }
      }
    }

    const defaults: Record<string, any> = {};
    manifest.config?.forEach(c => { defaults[c.key] = c.default; });

    const plugin: InstalledPlugin = {
      manifest,
      enabled: true,
      configValues: { ...defaults, ...configOverrides },
      installedAt: Date.now(),
      lastUpdated: Date.now(),
    };

    setInstalled(prev => {
      const next = new Map(prev);
      next.set(pluginId, plugin);
      return next;
    });

    // Register default hook handlers (stubs — real plugins would inject code)
    manifest.hooks.forEach(hook => {
      if (!hookHandlers.current.has(hook)) hookHandlers.current.set(hook, new Map());
      hookHandlers.current.get(hook)!.set(pluginId, (data) => data);
    });

    return true;
  }, [installed]);

  /** Uninstall a plugin */
  const uninstallPlugin = useCallback((pluginId: string) => {
    setInstalled(prev => {
      const next = new Map(prev);
      next.delete(pluginId);
      return next;
    });

    // Remove hook handlers
    hookHandlers.current.forEach(handlers => handlers.delete(pluginId));
  }, []);

  /** Toggle plugin enabled state */
  const togglePlugin = useCallback((pluginId: string) => {
    setInstalled(prev => {
      const next = new Map(prev);
      const plugin = next.get(pluginId);
      if (plugin) next.set(pluginId, { ...plugin, enabled: !plugin.enabled });
      return next;
    });
  }, []);

  /** Update plugin config */
  const updatePluginConfig = useCallback((pluginId: string, key: string, value: any) => {
    setInstalled(prev => {
      const next = new Map(prev);
      const plugin = next.get(pluginId);
      if (plugin) {
        next.set(pluginId, {
          ...plugin,
          configValues: { ...plugin.configValues, [key]: value },
          lastUpdated: Date.now(),
        });
      }
      return next;
    });
  }, []);

  /** Execute all handlers for a hook, chaining data through transformers */
  const executeHook = useCallback((hook: PluginHook, data: any) => {
    const handlers = hookHandlers.current.get(hook);
    if (!handlers) return data;

    let result = data;
    for (const [pluginId, handler] of handlers) {
      const plugin = installed.get(pluginId);
      if (!plugin?.enabled) continue;

      try {
        const output = handler(result);
        if (output !== undefined) result = output;

        setEventLog(prev => [...prev.slice(-99), {
          hook,
          pluginId,
          data: typeof result === 'string' ? result.slice(0, 100) : result,
          timestamp: Date.now(),
        }]);
      } catch (e) {
        console.warn(`Plugin ${pluginId} hook ${hook} error:`, e);
      }
    }

    return result;
  }, [installed]);

  /** Register a custom hook handler for a plugin */
  const registerHookHandler = useCallback((pluginId: string, hook: PluginHook, handler: HookHandler) => {
    if (!hookHandlers.current.has(hook)) hookHandlers.current.set(hook, new Map());
    hookHandlers.current.get(hook)!.set(pluginId, handler);
  }, []);

  /** Get list of installed plugins */
  const getInstalled = useCallback(() => Array.from(installed.values()), [installed]);

  /** Check if plugin is installed */
  const isInstalled = useCallback((pluginId: string) => installed.has(pluginId), [installed]);

  /** Get enabled plugins count */
  const enabledCount = Array.from(installed.values()).filter(p => p.enabled).length;

  return {
    catalogue: PLUGIN_CATALOGUE,
    installed,
    eventLog,
    enabledCount,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
    updatePluginConfig,
    executeHook,
    registerHookHandler,
    getInstalled,
    isInstalled,
  };
}
