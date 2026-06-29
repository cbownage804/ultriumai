/**
 * Knowledge Base Content - Embeddable content component
 * Can be used inside any Sheet or panel
 */

import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Search, 
  BookOpen, 
  Lightbulb,
  ChevronRight,
  Target,
  CheckCircle2,
  Sparkles,
  Compass,
  Clock,
  ExternalLink
} from 'lucide-react';

interface KBArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  route: string;
  steps?: string[];
  tips?: string[];
  readTime?: string;
}

interface KBCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

const categories: KBCategory[] = [
  { id: 'vanguard', name: 'Vanguard', icon: Target, color: 'text-cyan-400' },
  { id: 'safesuite', name: 'Wrayth', icon: BookOpen, color: 'text-amber-400' },
  { id: 'ai-studio', name: 'AI Studio', icon: Sparkles, color: 'text-violet-400' },
  { id: 'general', name: 'General', icon: Compass, color: 'text-blue-400' },
];

const articles: KBArticle[] = [
  // ===== VANGUARD =====
  {
    id: 'vanguard-dashboard',
    title: 'Command Center Overview',
    description: 'Your central hub for all managed security operations',
    content: 'The Vanguard Command Center provides a unified, real-time view of all your security operations including open tickets, agent health, security alerts, and revenue metrics. Widgets are interactive—click any stat card to drill into details.',
    category: 'vanguard',
    tags: ['dashboard', 'overview', 'command', 'stats', 'widgets'],
    route: '/vanguard/app/dashboard',
    steps: ['View real-time ticket and alert counts', 'Click stat cards to navigate to details', 'Use the date range picker to adjust time windows', 'Review the activity feed for recent cross-module events'],
    tips: ['Widgets can be rearranged via drag-and-drop', 'Press Cmd+K to quickly search anything'],
    readTime: '3 min'
  },
  {
    id: 'vanguard-tickets',
    title: 'Response – Service Desk',
    description: 'Manage support tickets with AI categorization and SLA tracking',
    content: 'Response is the helpdesk module for managing support requests. Tickets are color-coded by SLA status: red = breaching, yellow = approaching, green = on track. AI auto-categorizes incoming tickets and suggests assignees.',
    category: 'vanguard',
    tags: ['tickets', 'helpdesk', 'response', 'sla', 'support'],
    route: '/vanguard/app/tickets',
    steps: ['View ticket queue sorted by priority', 'Click "+ New Ticket" to create a request', 'Use filters to narrow by org, status, or assignee', 'Click a ticket row for detail view with conversation thread', 'Bulk-select tickets with checkboxes for mass actions'],
    tips: ['Use @ mentions to notify team members', 'AI can generate response drafts', 'Attach files up to 10MB'],
    readTime: '5 min'
  },
  {
    id: 'vanguard-devices',
    title: 'Horizon – RMM',
    description: 'Remote monitoring and management for endpoints',
    content: 'Horizon provides comprehensive Remote Monitoring and Management. Devices show health status indicators: Green = healthy, Yellow = needs attention, Red = critical/offline. Select devices to run remote commands, deploy patches, or execute scripts.',
    category: 'vanguard',
    tags: ['devices', 'rmm', 'horizon', 'monitoring', 'endpoints', 'patches'],
    route: '/vanguard/app/devices',
    steps: ['Browse all connected devices with health indicators', 'Sort or search by name, IP, or OS', 'Select devices for bulk remote actions', 'Deploy patches or run scripts remotely', 'View device detail for full telemetry'],
    tips: ['Right-click a device for quick actions', 'Use the map view for geographic overview'],
    readTime: '4 min'
  },
  {
    id: 'vanguard-alerts',
    title: 'Pursuit – XDR & Threat Detection',
    description: 'Real-time security alerts and threat investigation',
    content: 'Pursuit provides extended detection and response (XDR) capabilities. Monitor real-time security alerts, investigate threats with AI-assisted analysis, and take remediation actions directly from the alert detail view.',
    category: 'vanguard',
    tags: ['alerts', 'security', 'pursuit', 'xdr', 'threats', 'detection'],
    route: '/vanguard/app/alerts',
    steps: ['View alerts sorted by severity', 'Click an alert for full investigation details', 'Use AI analysis for threat context', 'Take remediation actions from the detail panel', 'Set up alert rules for automated responses'],
    tips: ['Configure notification channels for critical alerts', 'Use pattern matching to auto-resolve known false positives'],
    readTime: '4 min'
  },
  {
    id: 'vanguard-atlas',
    title: 'Atlas – IT Documentation',
    description: 'Centralized documentation, passwords, and asset management',
    content: 'Atlas is a comprehensive IT documentation platform. Manage organizations, contacts, configurations, passwords, flexible assets, and SOPs. Supports AI-powered document generation and cross-asset relationship linking.',
    category: 'vanguard',
    tags: ['atlas', 'documentation', 'passwords', 'organizations', 'contacts', 'sop'],
    route: '/vanguard/app/atlas',
    steps: ['Select an organization to manage', 'Navigate between Contacts, Configs, Documents, and Passwords tabs', 'Create flexible asset types with custom fields', 'Use AI Doc Generator for SOPs and policies', 'Link related items across asset types'],
    tips: ['Use AI Search to query across all documentation', 'Set up expiration tracking for domains and SSL certs'],
    readTime: '6 min'
  },
  {
    id: 'vanguard-cortex',
    title: 'Cortex – AI Hub',
    description: 'AI-powered automation and intelligent analysis',
    content: 'Cortex is the AI backbone of Vanguard. It powers automated ticket categorization, threat analysis, document generation, and intelligent recommendations across all modules.',
    category: 'vanguard',
    tags: ['cortex', 'ai', 'automation', 'analysis', 'intelligence'],
    route: '/vanguard/app/cortex',
    steps: ['View AI-powered insights and recommendations', 'Configure automation rules', 'Review AI analysis history', 'Enable or disable AI features per module'],
    readTime: '4 min'
  },
  {
    id: 'vanguard-sentinel',
    title: 'Sentinel – SaaS Security',
    description: 'Monitor and secure SaaS application usage',
    content: 'Sentinel monitors SaaS applications across your managed clients. Detect shadow IT, track license usage, identify security risks from unauthorized apps, and enforce compliance policies.',
    category: 'vanguard',
    tags: ['sentinel', 'saas', 'security', 'shadow-it', 'compliance'],
    route: '/vanguard/app/sentinel',
    steps: ['View discovered SaaS applications', 'Review risk scores for each app', 'Flag unauthorized applications', 'Track license spend and utilization', 'Set policies for allowed/blocked apps'],
    readTime: '4 min'
  },
  {
    id: 'vanguard-recon',
    title: 'Recon – Security Assessments',
    description: 'Run vulnerability scans and compliance audits',
    content: 'Recon provides security assessment tools for vulnerability scanning, compliance benchmarking (CIS, NIST), and hardware provisioning. Generate client-ready reports with findings and remediation steps.',
    category: 'vanguard',
    tags: ['recon', 'vulnerability', 'scan', 'compliance', 'assessment', 'cis'],
    route: '/vanguard/app/recon',
    steps: ['Create a new scan job targeting hosts', 'Select scan type and compliance framework', 'Review results with severity breakdown', 'Generate client-facing PDF reports', 'Use Image Builder for hardware provisioning'],
    tips: ['Schedule recurring scans for continuous monitoring', 'Compare results across scan history'],
    readTime: '5 min'
  },
  {
    id: 'vanguard-comply',
    title: 'Comply – Compliance Management',
    description: 'Track regulatory compliance and audit readiness',
    content: 'Comply helps you track compliance with frameworks like SOC 2, HIPAA, GDPR, and more. Map controls to evidence, track remediation, and generate audit-ready reports.',
    category: 'vanguard',
    tags: ['comply', 'compliance', 'audit', 'soc2', 'hipaa', 'gdpr'],
    route: '/vanguard/app/comply',
    steps: ['Select a compliance framework', 'Review control requirements', 'Map evidence to each control', 'Track remediation tasks', 'Generate audit-ready reports'],
    readTime: '5 min'
  },
  {
    id: 'vanguard-ledger',
    title: 'Ledger – Reporting & Analytics',
    description: 'Financial and operational reporting',
    content: 'Ledger provides comprehensive reporting across all Vanguard modules. Track revenue, utilization, SLA performance, and security posture with customizable dashboards and exportable reports.',
    category: 'vanguard',
    tags: ['ledger', 'reports', 'analytics', 'billing', 'revenue'],
    route: '/vanguard/app/ledger',
    steps: ['View pre-built report templates', 'Customize date ranges and filters', 'Export reports as PDF or CSV', 'Schedule recurring report delivery', 'Build custom dashboards'],
    readTime: '4 min'
  },
  {
    id: 'vanguard-sites',
    title: 'Sites – Client Management',
    description: 'Manage MSP clients and organizations',
    content: 'Sites is your client management hub. View all managed organizations in a data-dense sortable table. Access client details, contracts, contacts, and linked devices from a single view.',
    category: 'vanguard',
    tags: ['sites', 'clients', 'organizations', 'msp', 'customers'],
    route: '/vanguard/app/sites',
    steps: ['View all clients in sortable table format', 'Click a client to view full details', 'Manage contracts and SLAs per client', 'Link devices and contacts to organizations'],
    readTime: '3 min'
  },

  // ===== SAFESUITE =====
  {
    id: 'safesuite-overview',
    title: 'Wrayth Dashboard',
    description: 'Personal security command center',
    content: 'Wrayth combines password management, threat scanning, and breach monitoring into a unified personal security platform. View your security score and take action on recommendations.',
    category: 'safesuite',
    tags: ['dashboard', 'overview', 'security', 'score'],
    route: '/safesuite',
    steps: ['View your overall security score', 'Review security recommendations', 'Access Vault, Scan, and Breach modules', 'Check recent security activity'],
    readTime: '3 min'
  },
  {
    id: 'safepass-vault',
    title: 'SafePass – Password Vault',
    description: 'Securely store and manage credentials',
    content: 'SafePass provides enterprise-grade password management. Store credentials with AES-256 encryption, organize with folders and tags, generate strong passwords, and check for compromised credentials.',
    category: 'safesuite',
    tags: ['passwords', 'vault', 'safepass', 'credentials', 'encryption'],
    route: '/safesuite/vault',
    steps: ['Add passwords manually or import from CSV', 'Organize entries with folders and tags', 'Use the password generator for strong credentials', 'Enable auto-fill for browser integration', 'Share passwords securely with team members'],
    tips: ['Check the health report for weak or reused passwords', 'Enable 2FA for vault access'],
    readTime: '5 min'
  },
  {
    id: 'safescan-scanner',
    title: 'SafeScan – Threat Scanner',
    description: 'Scan emails, URLs, and files for threats',
    content: 'SafeScan detects phishing attempts, malicious URLs, and malware in files. Paste any suspicious content to get an instant AI-powered risk analysis with detailed explanations.',
    category: 'safesuite',
    tags: ['scan', 'threats', 'safescan', 'phishing', 'malware', 'urls'],
    route: '/safesuite/scan',
    steps: ['Select scan type: Email, URL, or File', 'Paste or upload the content to scan', 'Review the threat analysis results', 'Take recommended actions on threats'],
    tips: ['Bookmark suspicious items for later review', 'Check scan history for patterns'],
    readTime: '3 min'
  },
  {
    id: 'safesuite-breach',
    title: 'Breach Monitor',
    description: 'Monitor for compromised credentials',
    content: 'Breach Monitor checks if your email addresses or credentials appear in known data breaches. Get alerts when new breaches are detected and take immediate action to secure affected accounts.',
    category: 'safesuite',
    tags: ['breach', 'monitor', 'dark-web', 'compromised', 'exposure'],
    route: '/safesuite/breach',
    steps: ['Add email addresses to monitor', 'View breach history for each email', 'Take action on compromised accounts', 'Enable notifications for new breaches'],
    readTime: '3 min'
  },

  // ===== AI STUDIO =====
  {
    id: 'aistudio-dashboard',
    title: 'AI Studio Dashboard',
    description: 'Overview of your AI assistants and usage',
    content: 'The AI Studio Dashboard shows all your custom GPT assistants, usage analytics, and credit consumption. Monitor conversation volumes and manage your AI portfolio from one place.',
    category: 'ai-studio',
    tags: ['dashboard', 'gpt', 'ai', 'overview', 'usage'],
    route: '/dashboard',
    steps: ['View all created GPT assistants', 'Track usage and credit consumption', 'Monitor conversation volumes', 'Access quick-create for new assistants'],
    readTime: '3 min'
  },
  {
    id: 'aistudio-builder',
    title: 'GPT Builder',
    description: 'Create and configure custom AI assistants',
    content: 'Build AI assistants by defining their identity, behavior, and knowledge base. Upload documents for RAG-powered responses, configure conversation starters, and set guardrails for safe interactions.',
    category: 'ai-studio',
    tags: ['builder', 'gpt', 'create', 'configure', 'knowledge'],
    route: '/gpt-builder',
    steps: ['Set assistant name, avatar, and description', 'Define system prompt and personality', 'Upload knowledge base documents', 'Configure conversation starters', 'Set behavior guardrails and limits', 'Test in the preview panel'],
    tips: ['Use specific system prompts for better responses', 'Upload domain-specific documents for accuracy'],
    readTime: '6 min'
  },
  {
    id: 'aistudio-agents',
    title: 'AI Agents',
    description: 'Automated AI workflows triggered by events',
    content: 'AI Agents run automatically based on triggers like new data or scheduled intervals. Configure conditions, select AI models, and map outputs to database fields for hands-free automation.',
    category: 'ai-studio',
    tags: ['agents', 'automation', 'workflows', 'triggers'],
    route: '/ai-studio/agents',
    steps: ['Create a new agent with trigger type', 'Configure conditions and model selection', 'Map AI output to target fields', 'Set credit budgets and limits', 'Monitor run history and success rates'],
    readTime: '5 min'
  },
  {
    id: 'aistudio-app-builder',
    title: 'App Builder',
    description: 'Build custom web apps with AI assistance',
    content: 'The App Builder lets you create custom web applications using an IDE-like workspace. Write HTML, CSS, and JavaScript with AI-assisted code generation, live preview, and one-click deployment.',
    category: 'ai-studio',
    tags: ['app-builder', 'code', 'deploy', 'ide', 'workspace'],
    route: '/ai-studio/app-builder',
    steps: ['Create a new project or open existing', 'Use the file explorer to manage files', 'Write code with AI assistance', 'Preview changes in real-time', 'Deploy with one click'],
    tips: ['Use Cmd+S to save quickly', 'AI can generate components from descriptions'],
    readTime: '5 min'
  },

  // ===== GENERAL =====
  {
    id: 'general-hub',
    title: 'Product Hub',
    description: 'Central command center for all products',
    content: 'The Product Hub is your central dashboard showing KPIs across all UltriumAI products. Interactive widgets navigate to relevant pages, and the activity feed tracks cross-product actions.',
    category: 'general',
    tags: ['hub', 'dashboard', 'home', 'overview', 'products'],
    route: '/hub',
    steps: ['View cross-product KPIs at a glance', 'Click widgets to navigate to detail pages', 'Review the activity feed for recent actions', 'Access any product from the navigation'],
    readTime: '2 min'
  },
  {
    id: 'general-settings',
    title: 'Settings',
    description: 'Configure platform preferences and account',
    content: 'Access global settings to customize branding, notification preferences, security settings, and subscription management. Configure white-label options for MSP mode.',
    category: 'general',
    tags: ['settings', 'configuration', 'preferences', 'account', 'branding'],
    route: '/settings',
    steps: ['Configure company branding and logos', 'Set notification preferences by channel', 'Manage subscription and billing', 'Configure security settings and 2FA', 'Set up white-label branding for client portals'],
    readTime: '5 min'
  },
  {
    id: 'general-profile',
    title: 'Profile Management',
    description: 'Manage your account and personal settings',
    content: 'Update your profile information, avatar, and personal preferences. Manage connected accounts, API keys, and security settings like two-factor authentication.',
    category: 'general',
    tags: ['profile', 'account', 'avatar', 'personal', '2fa'],
    route: '/profile',
    steps: ['Update display name and avatar', 'Change email or password', 'Enable two-factor authentication', 'Manage API keys', 'Review login history'],
    readTime: '3 min'
  },
  {
    id: 'general-keyboard',
    title: 'Keyboard Shortcuts',
    description: 'Navigate faster with keyboard shortcuts',
    content: 'UltriumAI supports extensive keyboard shortcuts for power users. Press Shift+? anywhere to see all available shortcuts for the current page.',
    category: 'general',
    tags: ['keyboard', 'shortcuts', 'navigation', 'hotkeys'],
    route: '/guide',
    steps: ['Cmd+K: Open spotlight search', '?: Open help sidebar', 'Shift+?: Show keyboard shortcuts overlay', 'Escape: Close modals and menus'],
    readTime: '2 min'
  },
];

interface KnowledgeBaseContentProps {
  onArticleClick?: (article: KBArticle) => void;
}

export function KnowledgeBaseContent({ onArticleClick }: KnowledgeBaseContentProps) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('contextual');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

  // Find articles relevant to current page
  const contextualArticles = useMemo(() => {
    const currentPath = location.pathname;
    return articles.filter(article => {
      if (currentPath === article.route || currentPath.startsWith(article.route + '/')) {
        return true;
      }
      const pathSegments = currentPath.split('/').filter(Boolean);
      return article.tags.some(tag => 
        pathSegments.some(segment => segment.toLowerCase().includes(tag.toLowerCase()))
      );
    }).slice(0, 5);
  }, [location.pathname]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Group articles by category
  const articlesByCategory = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      articles: articles.filter(a => a.category === cat.id)
    }));
  }, []);

  const handleArticleClick = (article: KBArticle) => {
    setSelectedArticle(article);
    onArticleClick?.(article);
  };

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="flex flex-col h-full p-4">
        <button 
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to articles
        </button>
        
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-2">
            <div>
              <Badge variant="secondary" className="mb-2 capitalize">{selectedArticle.category.replace('-', ' ')}</Badge>
              <h2 className="text-xl font-semibold">{selectedArticle.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{selectedArticle.description}</p>
              {selectedArticle.readTime && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {selectedArticle.readTime} read
                </div>
              )}
            </div>
            
            <p className="text-sm leading-relaxed">{selectedArticle.content}</p>
            
            {selectedArticle.steps && selectedArticle.steps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">How To</h3>
                <ul className="space-y-2">
                  {selectedArticle.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedArticle.tips && selectedArticle.tips.length > 0 && (
              <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  Pro Tips
                </h3>
                <ul className="space-y-1.5">
                  {selectedArticle.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Link to full guide */}
            <div className="pt-3 border-t border-border/50">
              <a
                href="/guide"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View full platform guide
              </a>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Knowledge Base</h2>
        </div>
        <p className="text-sm text-muted-foreground">Search help articles or browse by product</p>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4"
          >
            {searchResults.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {searchResults.map(article => (
                    <Card 
                      key={article.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleArticleClick(article)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm">{article.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {article.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                            {article.category.replace('-', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No results for "{searchQuery}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      {!searchQuery && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden px-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="contextual" className="gap-1.5 text-xs">
              <Target className="h-3.5 w-3.5" />
              This Page
            </TabsTrigger>
            <TabsTrigger value="browse" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Browse All
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Contextual Help */}
            <TabsContent value="contextual" className="mt-0 space-y-3">
              {contextualArticles.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    Relevant to this page
                  </div>
                  {contextualArticles.map(article => (
                    <Card 
                      key={article.id}
                      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                      onClick={() => handleArticleClick(article)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{article.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {article.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        </div>
                        {article.readTime && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {article.readTime}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <Compass className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No specific help for this page yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try browsing all articles or searching.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Browse All */}
            <TabsContent value="browse" className="mt-0">
              <Accordion type="multiple" className="space-y-2">
                {articlesByCategory.map(category => {
                  const Icon = category.icon;
                  return (
                    <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-3">
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${category.color}`} />
                          <span className="font-medium text-sm">{category.name}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {category.articles.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <div className="space-y-2 pt-1">
                          {category.articles.map(article => (
                            <button
                              key={article.id}
                              onClick={() => handleArticleClick(article)}
                              className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{article.title}</span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{article.description}</p>
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      )}
    </div>
  );
}
