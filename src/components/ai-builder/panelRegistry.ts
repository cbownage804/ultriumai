/**
 * Panel Registry — Central manifest of all 150+ panels.
 * Maps panel IDs → labels, icons, categories, keywords, and setter names.
 * Consumed by: ToolbarPanelsDropdown, EnhancedCommandPalette, workspace.
 */

import {
  BarChart3, Cloud, Code, Palette, Shield, Gauge, History, Variable,
  Image, Package, Database, CreditCard, Key, Bot, Activity, Rocket,
  Brain, FolderOpen, Zap, Clock, Globe, Users, BookOpen, Layers,
  Bug, Terminal, GitBranch, Settings, Search, Replace, Play, Puzzle,
  Server, Hammer, FileCode, ImagePlus, Eye, Table2, MessageSquare,
  Columns, Keyboard, RefreshCw, BarChart2, Lock, Mail, Bell,
  Smartphone, Cpu, TestTube, Layout, PaintBucket, FormInput, LineChart,
  Grid3X3, Workflow, Upload, DollarSign, Sparkles, FileText, Wrench,
  Monitor, Wifi, Share2, Mic, ScreenShare as ScreenShareIcon, Smile, PenTool,
  Camera, Accessibility, FlaskConical, Loader, Building, Flag, Ship,
  Container, Receipt, Gauge as GaugeIcon, ScrollText, Waypoints,
  type LucideIcon,
} from 'lucide-react';

export type PanelCategory =
  | 'view' | 'edit' | 'devops' | 'auth' | 'search' | 'monitoring'
  | 'content' | 'mobile' | 'ai' | 'data' | 'collaboration' | 'testing'
  | 'security' | 'monetization' | 'dx' | 'communication' | 'navigation' | 'polish'
  | 'deploy' | 'design' | 'integration';

export interface PanelEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  category: PanelCategory;
  keywords: string[];
  stateKey: string; // maps to setShow* in workspace
}

export const PANEL_CATEGORIES: Record<PanelCategory, { label: string; icon: LucideIcon }> = {
  view: { label: 'View', icon: Eye },
  edit: { label: 'Edit', icon: Code },
  design: { label: 'Design', icon: Palette },
  data: { label: 'Data & State', icon: Database },
  integration: { label: 'Integration', icon: Workflow },
  auth: { label: 'Auth & Access', icon: Lock },
  devops: { label: 'DevOps', icon: Server },
  deploy: { label: 'Deploy & Hosting', icon: Rocket },
  testing: { label: 'Testing & QA', icon: TestTube },
  security: { label: 'Security', icon: Shield },
  monitoring: { label: 'Monitoring', icon: BarChart3 },
  content: { label: 'Content & Media', icon: FileText },
  search: { label: 'Search & Discovery', icon: Search },
  communication: { label: 'Communication', icon: Mail },
  navigation: { label: 'Navigation & UI', icon: Layout },
  collaboration: { label: 'Collaboration', icon: Users },
  mobile: { label: 'Mobile', icon: Smartphone },
  ai: { label: 'AI & Automation', icon: Sparkles },
  monetization: { label: 'Monetization', icon: DollarSign },
  dx: { label: 'Developer Tools', icon: Wrench },
  polish: { label: 'Polish & Docs', icon: BookOpen },
};

export const PANEL_REGISTRY: PanelEntry[] = [
  // Core panels
  { id: 'supabase-ide', label: 'Supabase IDE', icon: Database, category: 'data', keywords: ['supabase', 'sql', 'database', 'ide'], stateKey: 'showSupabaseIDE' },
  { id: 'prompt-history', label: 'Prompt History', icon: Clock, category: 'view', keywords: ['prompt', 'history', 'previous', 'favorites'], stateKey: 'showPromptHistory' },
  { id: 'version-history', label: 'Version History', icon: History, category: 'view', keywords: ['version', 'history', 'restore', 'snapshot'], stateKey: 'showVersionHistory' },
  { id: 'rls-tester', label: 'RLS Policy Tester', icon: Shield, category: 'security', keywords: ['rls', 'policy', 'row', 'level', 'security'], stateKey: 'showRLSTester' },
  { id: 'file-search', label: 'File Search', icon: Search, category: 'edit', keywords: ['search', 'find', 'replace', 'grep'], stateKey: 'showFileSearch' },
  { id: 'file-tree', label: 'File Tree', icon: FolderOpen, category: 'view', keywords: ['files', 'tree', 'explorer', 'sidebar'], stateKey: 'showFileTree' },
  { id: 'console-panel', label: 'Console', icon: Terminal, category: 'dx', keywords: ['console', 'log', 'output', 'debug'], stateKey: 'showConsole' },
  { id: 'assets', label: 'Asset Manager', icon: Image, category: 'content', keywords: ['asset', 'image', 'upload', 'media'], stateKey: 'showAssets' },
  { id: 'packages', label: 'Package Manager', icon: Package, category: 'dx', keywords: ['package', 'cdn', 'library', 'dependency'], stateKey: 'showPackages' },
  { id: 'database', label: 'Database Panel', icon: Database, category: 'data', keywords: ['db', 'tables', 'schema'], stateKey: 'showDatabase' },
  { id: 'db-explorer', label: 'Database Explorer', icon: Table2, category: 'data', keywords: ['explore', 'tables', 'rows'], stateKey: 'showDbExplorer' },
  { id: 'schema-designer', label: 'Schema Designer', icon: Waypoints, category: 'data', keywords: ['erd', 'schema', 'tables', 'relations'], stateKey: 'showSchemaDesigner' },
  { id: 'migration', label: 'Database Migration', icon: Database, category: 'data', keywords: ['migration', 'sql', 'alter'], stateKey: 'showMigrationPanel' },
  { id: 'auth', label: 'Auth Config', icon: Lock, category: 'auth', keywords: ['authentication', 'login', 'signup'], stateKey: 'showAuth' },
  { id: 'edge-functions', label: 'Edge Functions', icon: Zap, category: 'devops', keywords: ['serverless', 'deno', 'functions'], stateKey: 'showEdgeFunctions' },
  { id: 'edge-fn-editor', label: 'Edge Function Editor', icon: FileCode, category: 'devops', keywords: ['edge', 'function', 'code'], stateKey: 'showEdgeFnEditor' },
  { id: 'storage', label: 'Storage Browser', icon: FolderOpen, category: 'data', keywords: ['files', 'storage', 'buckets'], stateKey: 'showStorage' },
  { id: 'knowledge', label: 'Knowledge Panel', icon: Brain, category: 'ai', keywords: ['context', 'instructions', 'custom'], stateKey: 'showKnowledge' },

  // Build & Analytics
  { id: 'build-analytics', label: 'Build Analytics', icon: BarChart3, category: 'monitoring', keywords: ['analytics', 'builds', 'stats'], stateKey: 'showBuildAnalytics' },
  { id: 'performance', label: 'Performance Profiler', icon: Gauge, category: 'monitoring', keywords: ['perf', 'lighthouse', 'speed'], stateKey: 'showPerformanceProfiler' },
  { id: 'design-system', label: 'Design System', icon: Palette, category: 'design', keywords: ['tokens', 'theme', 'colors'], stateKey: 'showDesignSystem' },
  { id: 'component-lib', label: 'Component Library', icon: Layers, category: 'design', keywords: ['components', 'ui', 'library'], stateKey: 'showComponentLib' },

  // Code intelligence
  { id: 'code-intel', label: 'Code Intelligence', icon: Brain, category: 'ai', keywords: ['suggestions', 'smells', 'quality'], stateKey: 'showCodeIntel' },
  { id: 'testing-suite', label: 'Testing & Debug', icon: Bug, category: 'testing', keywords: ['test', 'debug', 'suite'], stateKey: 'showTestingSuite' },
  { id: 'terminal', label: 'Terminal', icon: Terminal, category: 'dx', keywords: ['cli', 'shell', 'command'], stateKey: 'showTerminal' },

  // Project management
  { id: 'settings', label: 'Project Settings', icon: Settings, category: 'edit', keywords: ['config', 'settings', 'env'], stateKey: 'showSettingsPanel' },
  { id: 'billing', label: 'Billing', icon: CreditCard, category: 'edit', keywords: ['credits', 'billing', 'plan'], stateKey: 'showBilling' },
  { id: 'share', label: 'Share Project', icon: Users, category: 'collaboration', keywords: ['share', 'collaborate', 'invite'], stateKey: 'showShareDialog' },
  { id: 'activity', label: 'Activity Feed', icon: Activity, category: 'collaboration', keywords: ['log', 'history', 'feed'], stateKey: 'showActivity' },
  { id: 'seo-editor', label: 'SEO Editor', icon: Globe, category: 'content', keywords: ['seo', 'meta', 'og', 'sitemap'], stateKey: 'showSEOEditor' },
  { id: 'custom-domain', label: 'Custom Domain', icon: Globe, category: 'deploy', keywords: ['domain', 'dns', 'ssl'], stateKey: 'showDomainPanel' },
  { id: 'deploy-pipeline', label: 'Deploy Pipeline', icon: Rocket, category: 'deploy', keywords: ['deploy', 'ci', 'pipeline'], stateKey: 'showDeployPipeline' },
  { id: 'publish', label: 'Publish', icon: Rocket, category: 'deploy', keywords: ['publish', 'deploy', 'live'], stateKey: 'showPublishPanel' },
  { id: 'export-guide', label: 'Export Guide', icon: FileText, category: 'dx', keywords: ['export', 'download', 'zip'], stateKey: 'showExportGuide' },
  { id: 'help-center', label: 'Help Center', icon: BookOpen, category: 'dx', keywords: ['help', 'docs', 'faq'], stateKey: 'showHelpCenter' },
  { id: 'gpt-connector', label: 'GPT Connector', icon: Bot, category: 'ai', keywords: ['gpt', 'openai', 'chatgpt'], stateKey: 'showGPTConnector' },
  { id: 'setup-wizard', label: 'Setup Wizard', icon: Sparkles, category: 'edit', keywords: ['setup', 'wizard', 'onboard'], stateKey: 'showSetupWizard' },
  { id: 'one-click-deploy', label: 'One-Click Deploy', icon: Rocket, category: 'deploy', keywords: ['vercel', 'netlify', 'deploy'], stateKey: 'showOneClickDeploy' },
  { id: 'changelog', label: 'Changelog', icon: ScrollText, category: 'polish', keywords: ['changelog', 'version', 'release'], stateKey: 'showChangelog' },

  // Multi-file ops
  { id: 'multi-search', label: 'Multi-File Search', icon: Replace, category: 'edit', keywords: ['find', 'replace', 'search'], stateKey: 'showMultiSearch' },
  { id: 'test-runner', label: 'Test Runner', icon: Play, category: 'testing', keywords: ['test', 'vitest', 'jest'], stateKey: 'showTestRunner' },
  { id: 'extensions', label: 'Extensions', icon: Puzzle, category: 'dx', keywords: ['plugin', 'extension', 'marketplace'], stateKey: 'showExtensions' },
  { id: 'collaboration', label: 'Collaboration', icon: Users, category: 'collaboration', keywords: ['collab', 'team', 'realtime'], stateKey: 'showCollaboration' },
  { id: 'api-builder', label: 'API Builder', icon: Server, category: 'integration', keywords: ['api', 'rest', 'endpoint'], stateKey: 'showAPIBuilder' },
  { id: 'github-panel', label: 'GitHub', icon: GitBranch, category: 'devops', keywords: ['git', 'github', 'repo'], stateKey: 'showGitHubPanel' },
  { id: 'build-workflow', label: 'Build Workflow', icon: Workflow, category: 'devops', keywords: ['build', 'ci', 'workflow'], stateKey: 'showBuildWorkflow' },
  { id: 'dev-tools', label: 'DevTools', icon: Bug, category: 'dx', keywords: ['devtools', 'inspect', 'debug'], stateKey: 'showDevTools' },
  { id: 'npm-manager', label: 'NPM Manager', icon: Package, category: 'dx', keywords: ['npm', 'package', 'install'], stateKey: 'showNPMManager' },
  { id: 'image-gen', label: 'AI Image Gen', icon: ImagePlus, category: 'ai', keywords: ['image', 'generate', 'dalle'], stateKey: 'showImageGen' },
  { id: 'symbol-search', label: 'Symbol Search', icon: Search, category: 'edit', keywords: ['symbol', 'function', 'navigate'], stateKey: 'showSymbolSearch' },
  { id: 'secrets-manager', label: 'Secrets Manager', icon: Key, category: 'security', keywords: ['secrets', 'env', 'keys'], stateKey: 'showSecretsManager' },
  { id: 'model-switcher', label: 'Model Switcher', icon: Cpu, category: 'ai', keywords: ['model', 'gpt', 'claude', 'gemini'], stateKey: 'showModelSwitcher' },

  // Sprint E: Prompt Chains, Code Review, etc.
  { id: 'prompt-chains', label: 'Prompt Chains', icon: Workflow, category: 'ai', keywords: ['chain', 'prompt', 'sequence'], stateKey: 'showPromptChains' },
  { id: 'code-review', label: 'Code Review', icon: Eye, category: 'testing', keywords: ['review', 'pr', 'quality'], stateKey: 'showCodeReview' },
  { id: 'test-generator', label: 'Test Generator', icon: TestTube, category: 'testing', keywords: ['test', 'generate', 'unit'], stateKey: 'showTestGenerator' },
  { id: 'nl-query', label: 'NL Database Query', icon: MessageSquare, category: 'data', keywords: ['natural', 'language', 'query', 'sql'], stateKey: 'showNLQuery' },
  { id: 'snippet-library', label: 'Snippet Library', icon: Code, category: 'dx', keywords: ['snippet', 'template', 'reuse'], stateKey: 'showSnippetLibrary' },
  { id: 'split-diff', label: 'Split Diff Editor', icon: Columns, category: 'edit', keywords: ['diff', 'compare', 'split'], stateKey: 'showSplitDiff' },
  { id: 'comments', label: 'Comments', icon: MessageSquare, category: 'collaboration', keywords: ['comment', 'annotate', 'review'], stateKey: 'showComments' },
  { id: 'team-activity', label: 'Team Activity', icon: Users, category: 'collaboration', keywords: ['team', 'activity', 'feed'], stateKey: 'showTeamActivity' },
  { id: 'approvals', label: 'Approvals', icon: Shield, category: 'collaboration', keywords: ['approve', 'reject', 'workflow'], stateKey: 'showApprovals' },
  { id: 'forking', label: 'Fork Project', icon: GitBranch, category: 'collaboration', keywords: ['fork', 'clone', 'duplicate'], stateKey: 'showForking' },

  // Sprint G: Visual Design
  { id: 'figma-import', label: 'Figma Import', icon: PaintBucket, category: 'design', keywords: ['figma', 'import', 'design'], stateKey: 'showFigmaImport' },
  { id: 'color-extractor', label: 'Color Palette', icon: Palette, category: 'design', keywords: ['color', 'palette', 'extract'], stateKey: 'showColorExtractor' },
  { id: 'icon-picker', label: 'Icon Picker', icon: Smile, category: 'design', keywords: ['icon', 'lucide', 'pick'], stateKey: 'showIconPicker' },
  { id: 'breakpoint-editor', label: 'Breakpoint Editor', icon: Smartphone, category: 'design', keywords: ['responsive', 'breakpoint', 'media'], stateKey: 'showBreakpointEditor' },
  { id: 'animation-builder', label: 'Animation Builder', icon: Sparkles, category: 'design', keywords: ['animation', 'framer', 'motion'], stateKey: 'showAnimationBuilder' },

  // Sprint H: Schema & Data
  { id: 'visual-schema', label: 'Visual Schema', icon: Waypoints, category: 'data', keywords: ['schema', 'erd', 'visual'], stateKey: 'showVisualSchema' },
  { id: 'seed-data', label: 'Seed Data', icon: Database, category: 'data', keywords: ['seed', 'mock', 'sample'], stateKey: 'showSeedData' },
  { id: 'api-tester', label: 'API Tester', icon: Zap, category: 'integration', keywords: ['api', 'test', 'endpoint', 'postman'], stateKey: 'showAPITester' },
  { id: 'webhook-builder', label: 'Webhook Builder', icon: Workflow, category: 'integration', keywords: ['webhook', 'hook', 'event'], stateKey: 'showWebhookBuilder' },
  { id: 'cron-scheduler', label: 'Cron Scheduler', icon: Clock, category: 'devops', keywords: ['cron', 'schedule', 'timer'], stateKey: 'showCronScheduler' },

  // Sprint I: Env, Rollback, Uptime
  { id: 'env-manager', label: 'Environment Manager', icon: Variable, category: 'devops', keywords: ['env', 'environment', 'staging'], stateKey: 'showEnvManager' },
  { id: 'rollback', label: 'Rollback', icon: RefreshCw, category: 'devops', keywords: ['rollback', 'revert', 'undo'], stateKey: 'showRollback' },
  { id: 'uptime-monitor', label: 'Uptime Monitor', icon: Monitor, category: 'monitoring', keywords: ['uptime', 'health', 'ping'], stateKey: 'showUptimeMonitor' },
  { id: 'build-cache', label: 'Build Cache', icon: Hammer, category: 'devops', keywords: ['cache', 'build', 'invalidate'], stateKey: 'showBuildCache' },
  { id: 'build-scripts', label: 'Build Scripts', icon: FileCode, category: 'devops', keywords: ['script', 'build', 'command'], stateKey: 'showBuildScripts' },

  // Sprint I-cont: Content
  { id: 'cms-mode', label: 'CMS Mode', icon: FileText, category: 'content', keywords: ['cms', 'content', 'manage'], stateKey: 'showCMSMode' },
  { id: 'blog-engine', label: 'Markdown Blog', icon: BookOpen, category: 'content', keywords: ['blog', 'markdown', 'post'], stateKey: 'showBlogEngine' },
  { id: 'image-optimizer', label: 'Image Optimizer', icon: Image, category: 'content', keywords: ['image', 'optimize', 'compress'], stateKey: 'showImageOptimizer' },
  { id: 'video-embed', label: 'Video Embed', icon: Monitor, category: 'content', keywords: ['video', 'youtube', 'embed'], stateKey: 'showVideoEmbed' },
  { id: 'i18n', label: 'i18n Generator', icon: Globe, category: 'content', keywords: ['i18n', 'translate', 'locale'], stateKey: 'showI18n' },

  // Sprint I-cont: Analytics & Security
  { id: 'analytics-dashboard', label: 'Analytics Dashboard', icon: BarChart2, category: 'monitoring', keywords: ['analytics', 'tracking', 'events'], stateKey: 'showAnalyticsDashboard' },
  { id: 'error-tracking', label: 'Error Tracking', icon: Bug, category: 'monitoring', keywords: ['error', 'tracking', 'sentry'], stateKey: 'showErrorTracking' },
  { id: 'session-replay', label: 'Session Replay', icon: Monitor, category: 'monitoring', keywords: ['session', 'replay', 'recording'], stateKey: 'showSessionReplay' },
  { id: 'ab-testing', label: 'A/B Testing', icon: FlaskConical, category: 'testing', keywords: ['ab', 'split', 'experiment'], stateKey: 'showABTesting' },
  { id: 'ai-usage', label: 'AI Usage Analytics', icon: BarChart3, category: 'monitoring', keywords: ['ai', 'usage', 'cost', 'tokens'], stateKey: 'showAIUsage' },
  { id: 'dep-scanner', label: 'Dependency Scanner', icon: Shield, category: 'security', keywords: ['dependency', 'vulnerability', 'scan'], stateKey: 'showDepScanner' },
  { id: 'csp-generator', label: 'CSP Generator', icon: Shield, category: 'security', keywords: ['csp', 'policy', 'security'], stateKey: 'showCSPGenerator' },
  { id: 'gdpr', label: 'GDPR Compliance', icon: Shield, category: 'security', keywords: ['gdpr', 'privacy', 'compliance'], stateKey: 'showGDPR' },
  { id: 'rate-limiter', label: 'Rate Limiter', icon: Gauge, category: 'security', keywords: ['rate', 'limit', 'throttle'], stateKey: 'showRateLimiter' },
  { id: 'secret-rotation', label: 'Secret Rotation', icon: Key, category: 'security', keywords: ['secret', 'rotate', 'key'], stateKey: 'showSecretRotation' },

  // Sprint J: Integrations
  { id: 'cli-companion', label: 'CLI Companion', icon: Terminal, category: 'dx', keywords: ['cli', 'local', 'sync'], stateKey: 'showCLICompanion' },
  { id: 'gh-actions', label: 'GitHub Actions', icon: GitBranch, category: 'devops', keywords: ['github', 'actions', 'ci', 'workflow'], stateKey: 'showGHActions' },
  { id: 'slack-discord', label: 'Slack & Discord', icon: MessageSquare, category: 'communication', keywords: ['slack', 'discord', 'bot', 'webhook'], stateKey: 'showSlackDiscord' },
  { id: 'white-label', label: 'White Label', icon: PaintBucket, category: 'design', keywords: ['brand', 'white', 'label', 'rebrand'], stateKey: 'showWhiteLabel' },
  { id: 'plugin-sdk', label: 'Plugin SDK', icon: Puzzle, category: 'dx', keywords: ['plugin', 'sdk', 'extension'], stateKey: 'showPluginSDK' },

  // Sprint K: AI Intelligence
  { id: 'refactoring', label: 'AI Refactoring', icon: Sparkles, category: 'ai', keywords: ['refactor', 'clean', 'improve'], stateKey: 'showRefactoring' },
  { id: 'nl-regex', label: 'NL Regex', icon: Search, category: 'dx', keywords: ['regex', 'pattern', 'natural'], stateKey: 'showNLRegex' },
  { id: 'commit-msg', label: 'AI Commit Messages', icon: GitBranch, category: 'ai', keywords: ['commit', 'message', 'git'], stateKey: 'showCommitMsg' },
  { id: 'auto-import', label: 'Smart Auto Import', icon: Zap, category: 'dx', keywords: ['import', 'auto', 'module'], stateKey: 'showAutoImport' },
  { id: 'doc-writer', label: 'AI Doc Writer', icon: BookOpen, category: 'ai', keywords: ['doc', 'jsdoc', 'documentation'], stateKey: 'showDocWriter' },

  // Sprint L: Real-Time
  { id: 'co-editing', label: 'Co-Editing', icon: Users, category: 'collaboration', keywords: ['realtime', 'collaborate', 'edit'], stateKey: 'showCoEditing' },
  { id: 'voice-chat', label: 'Voice Chat', icon: Mic, category: 'collaboration', keywords: ['voice', 'call', 'audio'], stateKey: 'showVoiceChat' },
  { id: 'screen-share', label: 'Screen Share', icon: Monitor, category: 'collaboration', keywords: ['screen', 'share', 'stream'], stateKey: 'showScreenShare' },
  { id: 'code-reactions', label: 'Code Reactions', icon: Smile, category: 'collaboration', keywords: ['emoji', 'reaction', 'annotate'], stateKey: 'showCodeReactions' },
  { id: 'whiteboard', label: 'Whiteboard', icon: PenTool, category: 'collaboration', keywords: ['whiteboard', 'draw', 'diagram'], stateKey: 'showWhiteboard' },

  // Sprint M: Testing
  { id: 'visual-regression', label: 'Visual Regression', icon: Camera, category: 'testing', keywords: ['visual', 'regression', 'screenshot'], stateKey: 'showVisualRegression' },
  { id: 'a11y-score', label: 'Accessibility', icon: Accessibility, category: 'testing', keywords: ['a11y', 'accessibility', 'wcag'], stateKey: 'showA11yScore' },
  { id: 'coverage', label: 'Code Coverage', icon: BarChart2, category: 'testing', keywords: ['coverage', 'test', 'percent'], stateKey: 'showCoverage' },
  { id: 'mutation-test', label: 'Mutation Testing', icon: FlaskConical, category: 'testing', keywords: ['mutation', 'test', 'quality'], stateKey: 'showMutationTest' },
  { id: 'load-test', label: 'Load Testing', icon: Loader, category: 'testing', keywords: ['load', 'stress', 'performance'], stateKey: 'showLoadTest' },

  // Sprint N: Advanced UI
  { id: 'page-builder', label: 'Page Builder', icon: Layout, category: 'design', keywords: ['page', 'builder', 'drag', 'drop'], stateKey: 'showPageBuilder' },
  { id: 'theme-studio', label: 'Theme Studio', icon: Palette, category: 'design', keywords: ['theme', 'tokens', 'colors'], stateKey: 'showThemeStudio' },
  { id: 'form-builder', label: 'Form Builder', icon: FormInput, category: 'design', keywords: ['form', 'input', 'validation'], stateKey: 'showFormBuilder' },
  { id: 'chart-dashboard', label: 'Chart Dashboard', icon: LineChart, category: 'design', keywords: ['chart', 'recharts', 'graph'], stateKey: 'showChartDashboard' },
  { id: 'layout-grid', label: 'Layout Grid', icon: Grid3X3, category: 'design', keywords: ['grid', 'layout', 'css'], stateKey: 'showLayoutGrid' },

  // Sprint O: Data & Integration
  { id: 'graphql', label: 'GraphQL Builder', icon: Workflow, category: 'integration', keywords: ['graphql', 'schema', 'resolver'], stateKey: 'showGraphQL' },
  { id: 'ws-manager', label: 'WebSocket Manager', icon: Wifi, category: 'integration', keywords: ['websocket', 'realtime', 'socket'], stateKey: 'showWSManager' },
  { id: 'file-upload', label: 'File Upload', icon: Upload, category: 'integration', keywords: ['upload', 'file', 'storage'], stateKey: 'showFileUpload' },
  { id: 'payments', label: 'Payment Integration', icon: DollarSign, category: 'monetization', keywords: ['stripe', 'payment', 'checkout'], stateKey: 'showPayments' },
  { id: 'email-templates', label: 'Email Templates', icon: Mail, category: 'communication', keywords: ['email', 'template', 'smtp'], stateKey: 'showEmailTemplates' },

  // Sprint P: Developer Experience
  { id: 'tutorial-creator', label: 'Tutorial Creator', icon: BookOpen, category: 'dx', keywords: ['tutorial', 'guide', 'onboard'], stateKey: 'showTutorialCreator' },
  { id: 'code-playground', label: 'Code Playground', icon: Play, category: 'dx', keywords: ['playground', 'sandbox', 'repl'], stateKey: 'showCodePlayground' },
  { id: 'custom-linting', label: 'Custom Linting', icon: Shield, category: 'dx', keywords: ['lint', 'eslint', 'rules'], stateKey: 'showCustomLinting' },
  { id: 'dep-graph', label: 'Dependency Graph', icon: Waypoints, category: 'dx', keywords: ['dependency', 'graph', 'tree'], stateKey: 'showDepGraph' },
  { id: 'git-blame', label: 'Git Blame Timeline', icon: Clock, category: 'dx', keywords: ['git', 'blame', 'history'], stateKey: 'showGitBlame' },

  // Sprint Q: Deploy
  { id: 'multi-region', label: 'Multi-Region Deploy', icon: Globe, category: 'deploy', keywords: ['region', 'multi', 'cdn'], stateKey: 'showMultiRegion' },
  { id: 'feature-flags', label: 'Feature Flags', icon: Flag, category: 'deploy', keywords: ['feature', 'flag', 'toggle'], stateKey: 'showFeatureFlags' },
  { id: 'canary-deploy', label: 'Canary Deploy', icon: Ship, category: 'deploy', keywords: ['canary', 'rollout', 'gradual'], stateKey: 'showCanaryDeploy' },
  { id: 'ssg', label: 'Static Site Generator', icon: FileText, category: 'deploy', keywords: ['ssg', 'static', 'generate'], stateKey: 'showSSG' },
  { id: 'docker-export', label: 'Docker Export', icon: Container, category: 'deploy', keywords: ['docker', 'container', 'export'], stateKey: 'showDockerExport' },

  // Sprint R: Monetization
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, category: 'monetization', keywords: ['subscription', 'plan', 'recurring'], stateKey: 'showSubscriptions' },
  { id: 'invoices', label: 'Invoice Generator', icon: Receipt, category: 'monetization', keywords: ['invoice', 'billing', 'receipt'], stateKey: 'showInvoices' },
  { id: 'usage-metering', label: 'Usage Metering', icon: GaugeIcon, category: 'monetization', keywords: ['usage', 'meter', 'quota'], stateKey: 'showUsageMetering' },
  { id: 'affiliates', label: 'Affiliate Tracking', icon: Share2, category: 'monetization', keywords: ['affiliate', 'referral', 'commission'], stateKey: 'showAffiliates' },
  { id: 'revenue', label: 'Revenue Dashboard', icon: DollarSign, category: 'monetization', keywords: ['revenue', 'mrr', 'income'], stateKey: 'showRevenue' },

  // Sprint S: Mobile
  { id: 'capacitor', label: 'Capacitor Export', icon: Smartphone, category: 'mobile', keywords: ['capacitor', 'ios', 'android', 'native'], stateKey: 'showCapacitor' },
  { id: 'push-notifications', label: 'Push Notifications', icon: Bell, category: 'mobile', keywords: ['push', 'notification', 'fcm'], stateKey: 'showPushNotifications' },
  { id: 'offline-first', label: 'Offline First', icon: Wifi, category: 'mobile', keywords: ['offline', 'pwa', 'service-worker'], stateKey: 'showOfflineFirst' },
  { id: 'gesture-builder', label: 'Gesture Builder', icon: Smartphone, category: 'mobile', keywords: ['gesture', 'swipe', 'touch'], stateKey: 'showGestureBuilder' },
  { id: 'app-store-assets', label: 'App Store Assets', icon: Smartphone, category: 'mobile', keywords: ['app', 'store', 'screenshot', 'listing'], stateKey: 'showAppStoreAssets' },

  // Sprint T: AI
  { id: 'code-translator', label: 'Code Translator', icon: Sparkles, category: 'ai', keywords: ['translate', 'convert', 'language'], stateKey: 'showCodeTranslator' },
  { id: 'smart-scaffold', label: 'Smart Scaffolding', icon: Sparkles, category: 'ai', keywords: ['scaffold', 'generate', 'crud'], stateKey: 'showSmartScaffold' },
  { id: 'workflow-automation', label: 'Workflow Automation', icon: Workflow, category: 'ai', keywords: ['workflow', 'automate', 'nl'], stateKey: 'showWorkflowAutomation' },
  { id: 'perf-optimizer', label: 'Perf Optimizer', icon: Gauge, category: 'ai', keywords: ['performance', 'optimize', 'speed'], stateKey: 'showPerfOptimizer' },
  { id: 'security-auditor', label: 'Security Auditor', icon: Shield, category: 'ai', keywords: ['security', 'audit', 'vulnerability'], stateKey: 'showSecurityAuditor' },

  // Sprint U: Data & State
  { id: 'state-machine', label: 'State Machine', icon: Workflow, category: 'data', keywords: ['state', 'machine', 'xstate', 'fsm'], stateKey: 'showStateMachine' },
  { id: 'data-validation', label: 'Data Validation', icon: Shield, category: 'data', keywords: ['zod', 'validation', 'schema'], stateKey: 'showDataValidation' },
  { id: 'cache-strategy', label: 'Cache Strategy', icon: Hammer, category: 'data', keywords: ['cache', 'tanstack', 'query', 'stale'], stateKey: 'showCacheStrategy' },
  { id: 'reactive-store', label: 'Reactive Store', icon: Zap, category: 'data', keywords: ['zustand', 'store', 'state'], stateKey: 'showReactiveStore' },
  { id: 'data-migration', label: 'Data Migration', icon: Database, category: 'data', keywords: ['migrate', 'sql', 'transform'], stateKey: 'showDataMigration' },

  // Sprint V: DX
  { id: 'regex-playground', label: 'Regex Playground', icon: Search, category: 'dx', keywords: ['regex', 'pattern', 'test'], stateKey: 'showRegexPlayground' },
  { id: 'json-yaml', label: 'JSON/YAML Converter', icon: FileText, category: 'dx', keywords: ['json', 'yaml', 'convert'], stateKey: 'showJsonYamlConverter' },
  { id: 'color-contrast', label: 'Color Contrast', icon: Palette, category: 'dx', keywords: ['contrast', 'wcag', 'accessibility'], stateKey: 'showColorContrast' },
  { id: 'tailwind-sorter', label: 'Tailwind Sorter', icon: Code, category: 'dx', keywords: ['tailwind', 'sort', 'class'], stateKey: 'showTailwindSorter' },
  { id: 'markdown-preview', label: 'Markdown Preview', icon: FileText, category: 'dx', keywords: ['markdown', 'preview', 'md'], stateKey: 'showMarkdownPreview' },

  // Sprint W: Communication
  { id: 'toast-designer', label: 'Toast Designer', icon: Bell, category: 'communication', keywords: ['toast', 'notification', 'sonner'], stateKey: 'showToastDesigner' },
  { id: 'notif-center', label: 'Notification Center', icon: Bell, category: 'communication', keywords: ['notification', 'center', 'inbox'], stateKey: 'showNotifCenter' },
  { id: 'chat-widget', label: 'Chat Widget', icon: MessageSquare, category: 'communication', keywords: ['chat', 'widget', 'support'], stateKey: 'showChatWidget' },
  { id: 'email-sequence', label: 'Email Sequence', icon: Mail, category: 'communication', keywords: ['email', 'drip', 'sequence'], stateKey: 'showEmailSequence' },
  { id: 'sms-template', label: 'SMS Template', icon: Smartphone, category: 'communication', keywords: ['sms', 'text', 'twilio'], stateKey: 'showSMSTemplate' },

  // Sprint X: Advanced UI
  { id: 'stepper-wizard', label: 'Stepper/Wizard', icon: Layout, category: 'navigation', keywords: ['stepper', 'wizard', 'multi-step'], stateKey: 'showStepperWizard' },
  { id: 'command-menu', label: 'Command Menu', icon: Search, category: 'navigation', keywords: ['command', 'cmdk', 'palette'], stateKey: 'showCommandMenuBuilder' },
  { id: 'breadcrumb-gen', label: 'Breadcrumb Generator', icon: Layout, category: 'navigation', keywords: ['breadcrumb', 'nav', 'path'], stateKey: 'showBreadcrumbGen' },
  { id: 'mega-menu', label: 'Mega Menu', icon: Layout, category: 'navigation', keywords: ['mega', 'menu', 'navigation'], stateKey: 'showMegaMenu' },
  { id: 'context-menu', label: 'Context Menu', icon: Layout, category: 'navigation', keywords: ['context', 'right-click', 'menu'], stateKey: 'showContextMenu' },

  // Sprint Y: DevOps
  { id: 'docker-compose', label: 'Docker Compose', icon: Container, category: 'devops', keywords: ['docker', 'compose', 'container'], stateKey: 'showDockerCompose' },
  { id: 'kubernetes', label: 'Kubernetes', icon: Server, category: 'devops', keywords: ['k8s', 'kubernetes', 'pod', 'helm'], stateKey: 'showK8s' },
  { id: 'cicd-pipeline', label: 'CI/CD Pipeline', icon: Workflow, category: 'devops', keywords: ['ci', 'cd', 'pipeline', 'deploy'], stateKey: 'showCICDPipeline' },
  { id: 'structured-logger', label: 'Structured Logger', icon: FileText, category: 'devops', keywords: ['log', 'logger', 'structured'], stateKey: 'showStructuredLogger' },
  { id: 'health-check', label: 'Health Check', icon: Activity, category: 'devops', keywords: ['health', 'check', 'status'], stateKey: 'showHealthCheck' },

  // Sprint Z: Auth
  { id: 'oauth-setup', label: 'OAuth Setup', icon: Lock, category: 'auth', keywords: ['oauth', 'google', 'github', 'provider'], stateKey: 'showOAuthSetup' },
  { id: 'mfa-flow', label: 'MFA / 2FA', icon: Shield, category: 'auth', keywords: ['mfa', '2fa', 'totp', 'authenticator'], stateKey: 'showMFAFlow' },
  { id: 'session-mgr', label: 'Session Manager', icon: Clock, category: 'auth', keywords: ['session', 'token', 'refresh'], stateKey: 'showSessionMgr' },
  { id: 'api-key-mgmt', label: 'API Key Management', icon: Key, category: 'auth', keywords: ['api', 'key', 'token', 'manage'], stateKey: 'showAPIKeyMgmt' },
  { id: 'perm-matrix', label: 'Permission Matrix', icon: Shield, category: 'auth', keywords: ['permission', 'role', 'rbac', 'matrix'], stateKey: 'showPermMatrix' },

  // Sprint AA: Content
  { id: 'rich-text-config', label: 'Rich Text Config', icon: FileText, category: 'content', keywords: ['tiptap', 'rich', 'text', 'editor'], stateKey: 'showRichTextConfig' },
  { id: 'file-preview-gen', label: 'File Previews', icon: Eye, category: 'content', keywords: ['preview', 'file', 'thumbnail'], stateKey: 'showFilePreviewGen' },
  { id: 'avatar-gen', label: 'Avatar Generator', icon: Users, category: 'content', keywords: ['avatar', 'profile', 'image'], stateKey: 'showAvatarGen' },
  { id: 'carousel-builder', label: 'Carousel Builder', icon: Image, category: 'content', keywords: ['carousel', 'slider', 'embla'], stateKey: 'showCarouselBuilder' },
  { id: 'gallery-lightbox', label: 'Gallery & Lightbox', icon: Image, category: 'content', keywords: ['gallery', 'lightbox', 'photo'], stateKey: 'showGalleryLightbox' },

  // Sprint AB: Search
  { id: 'fts', label: 'Full-Text Search', icon: Search, category: 'search', keywords: ['full-text', 'search', 'index'], stateKey: 'showFTS' },
  { id: 'faceted-filter', label: 'Faceted Filters', icon: Search, category: 'search', keywords: ['facet', 'filter', 'sidebar'], stateKey: 'showFacetedFilter' },
  { id: 'autocomplete', label: 'Autocomplete', icon: Search, category: 'search', keywords: ['autocomplete', 'typeahead', 'suggest'], stateKey: 'showAutocomplete' },
  { id: 'tag-system', label: 'Tag/Category System', icon: Search, category: 'search', keywords: ['tag', 'category', 'taxonomy'], stateKey: 'showTagSystem' },
  { id: 'seo-meta', label: 'SEO Meta Generator', icon: Globe, category: 'search', keywords: ['seo', 'meta', 'og', 'sitemap'], stateKey: 'showSEOMeta' },

  // Sprint AC: Monitoring
  { id: 'kpi-dashboard', label: 'KPI Dashboard', icon: BarChart3, category: 'monitoring', keywords: ['kpi', 'dashboard', 'metric'], stateKey: 'showKPIDashboard' },
  { id: 'alerting-rules', label: 'Alerting Rules', icon: Bell, category: 'monitoring', keywords: ['alert', 'rule', 'threshold'], stateKey: 'showAlertingRules' },
  { id: 'audit-trail', label: 'Audit Trail', icon: ScrollText, category: 'monitoring', keywords: ['audit', 'trail', 'log'], stateKey: 'showAuditTrail' },
  { id: 'click-heatmap', label: 'Click Heatmap', icon: Monitor, category: 'monitoring', keywords: ['heatmap', 'click', 'tracking'], stateKey: 'showClickHeatmap' },
  { id: 'budget-monitor', label: 'Budget Monitor', icon: DollarSign, category: 'monitoring', keywords: ['budget', 'cost', 'spend'], stateKey: 'showBudgetMonitor' },

  // Sprint AD: Polish
  { id: 'changelog-auto', label: 'Changelog Generator', icon: ScrollText, category: 'polish', keywords: ['changelog', 'version', 'release'], stateKey: 'showChangelogAuto' },
  { id: 'readme-gen', label: 'README Generator', icon: BookOpen, category: 'polish', keywords: ['readme', 'docs', 'markdown'], stateKey: 'showREADMEGen' },
  { id: 'license-picker', label: 'License Picker', icon: FileText, category: 'polish', keywords: ['license', 'mit', 'apache'], stateKey: 'showLicensePicker' },
  { id: 'openapi-spec', label: 'OpenAPI Spec', icon: FileCode, category: 'polish', keywords: ['openapi', 'swagger', 'api', 'spec'], stateKey: 'showOpenAPISpec' },
  { id: 'project-health', label: 'Project Health', icon: Activity, category: 'polish', keywords: ['health', 'score', 'quality'], stateKey: 'showProjectHealth' },
];

/** Get panels grouped by category */
export function getPanelsByCategory(): Map<PanelCategory, PanelEntry[]> {
  const map = new Map<PanelCategory, PanelEntry[]>();
  for (const panel of PANEL_REGISTRY) {
    const list = map.get(panel.category) || [];
    list.push(panel);
    map.set(panel.category, list);
  }
  return map;
}
