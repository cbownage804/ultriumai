/**
 * Contextual Knowledge Base - Page-aware help system
 * Detects current page and shows relevant documentation
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  Play, 
  FileText, 
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Video,
  Target,
  CheckCircle2,
  ArrowRight,
  Compass
} from 'lucide-react';

interface KBArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  route: string; // Associated route pattern
  steps?: string[];
  videoUrl?: string;
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

// Comprehensive knowledge base articles
const articles: KBArticle[] = [
  // Vanguard Articles
  {
    id: 'vanguard-dashboard',
    title: 'Command Center Overview',
    description: 'Your central hub for security operations',
    content: 'The Vanguard Command Center provides a unified view of all your security operations. Monitor tickets, alerts, devices, and customer health at a glance.',
    category: 'vanguard',
    tags: ['dashboard', 'overview', 'command'],
    route: '/vanguard',
    steps: [
      'View ticket status and SLA compliance',
      'Monitor active security alerts',
      'Track device health across your fleet',
      'Access quick actions for common tasks'
    ],
    readTime: '3 min'
  },
  {
    id: 'vanguard-tickets',
    title: 'Response - Ticket Management',
    description: 'Handle support requests efficiently',
    content: 'Vanguard Response is your helpdesk module for managing support tickets. Create, assign, and resolve tickets with AI-powered routing.',
    category: 'vanguard',
    tags: ['tickets', 'helpdesk', 'response', 'support'],
    route: '/vanguard/tickets',
    steps: [
      'Create new tickets manually or via email',
      'Assign tickets to technicians',
      'Track SLA compliance and deadlines',
      'Use AI to auto-categorize and route tickets'
    ],
    readTime: '5 min'
  },
  {
    id: 'vanguard-devices',
    title: 'Horizon - Device Management',
    description: 'Monitor and manage all endpoints',
    content: 'Vanguard Horizon provides comprehensive RMM capabilities. Monitor device health, deploy patches, and run remote commands.',
    category: 'vanguard',
    tags: ['devices', 'rmm', 'horizon', 'endpoints'],
    route: '/vanguard/devices',
    steps: [
      'View all connected devices',
      'Check real-time health status',
      'Deploy software and patches',
      'Run remote scripts and commands'
    ],
    readTime: '4 min'
  },
  {
    id: 'vanguard-alerts',
    title: 'Pursuit - Security Alerts',
    description: 'Real-time threat detection and response',
    content: 'Vanguard Pursuit monitors your environment for security threats. Receive real-time alerts and respond to incidents quickly.',
    category: 'vanguard',
    tags: ['alerts', 'security', 'pursuit', 'threats'],
    route: '/vanguard/alerts',
    steps: [
      'View active security alerts',
      'Investigate threat details',
      'Take remediation actions',
      'Configure alert thresholds'
    ],
    readTime: '4 min'
  },
  {
    id: 'vanguard-customers',
    title: 'Customer Management',
    description: 'Manage your client organizations',
    content: 'Track and manage all your customer accounts. View their devices, tickets, and security posture in one place.',
    category: 'vanguard',
    tags: ['customers', 'clients', 'organizations'],
    route: '/vanguard/customers',
    steps: [
      'Add new customer organizations',
      'View customer health scores',
      'Access customer-specific documentation',
      'Manage user access per customer'
    ],
    readTime: '3 min'
  },
  {
    id: 'vanguard-atlas',
    title: 'Atlas - Documentation Hub',
    description: 'Centralized knowledge management',
    content: 'Vanguard Atlas stores all your documentation, passwords, configurations, and runbooks organized by customer.',
    category: 'vanguard',
    tags: ['atlas', 'documentation', 'knowledge', 'passwords'],
    route: '/vanguard/atlas',
    steps: [
      'Select an organization to view docs',
      'Create and edit documentation',
      'Store passwords securely',
      'Manage SSL certificates and configurations'
    ],
    readTime: '5 min'
  },
  {
    id: 'vanguard-cortex',
    title: 'Cortex - AI Assistant',
    description: 'AI-powered automation and insights',
    content: 'Vanguard Cortex uses AI to summarize tickets, detect patterns, generate documentation, and automate routine tasks.',
    category: 'vanguard',
    tags: ['cortex', 'ai', 'automation', 'insights'],
    route: '/vanguard/cortex',
    steps: [
      'Enable AI ticket summarization',
      'Configure auto-responses',
      'Generate documentation from screenshots',
      'Analyze ticket patterns'
    ],
    readTime: '6 min'
  },
  {
    id: 'vanguard-notifications',
    title: 'Notification Settings',
    description: 'Configure alerts and escalations',
    content: 'Set up email templates, webhooks, escalation rules, and notification preferences to stay informed.',
    category: 'vanguard',
    tags: ['notifications', 'alerts', 'webhooks', 'escalation'],
    route: '/vanguard/notifications',
    steps: [
      'Create email notification templates',
      'Configure Slack/Teams webhooks',
      'Set up escalation chains',
      'Define quiet hours and preferences'
    ],
    readTime: '4 min'
  },

  // Wrayth Articles
  {
    id: 'safesuite-overview',
    title: 'Wrayth Dashboard',
    description: 'Your security command center',
    content: 'Wrayth combines password management, threat scanning, and breach monitoring in one integrated platform.',
    category: 'safesuite',
    tags: ['dashboard', 'overview', 'security'],
    route: '/safesuite',
    steps: [
      'View your security score',
      'Access Vault password vault',
      'Run Scan threat scans',
      'Check breach monitoring status'
    ],
    readTime: '3 min'
  },
  {
    id: 'safepass-vault',
    title: 'Vault - Password Vault',
    description: 'Securely store all your credentials',
    content: 'Vault provides enterprise-grade password management with AES-256 encryption, auto-fill, and team sharing.',
    category: 'safesuite',
    tags: ['passwords', 'vault', 'safepass', 'credentials'],
    route: '/safesuite/vault',
    steps: [
      'Add passwords manually or import',
      'Organize with folders and tags',
      'Share securely with team members',
      'Enable two-factor authentication'
    ],
    readTime: '4 min'
  },
  {
    id: 'safescan-scanner',
    title: 'Scan - Threat Scanner',
    description: 'Scan emails, files, and URLs',
    content: 'Scan uses AI to detect phishing, malware, and suspicious content in emails, attachments, and links.',
    category: 'safesuite',
    tags: ['scan', 'threats', 'safescan', 'phishing'],
    route: '/safesuite/scan',
    steps: [
      'Scan suspicious emails',
      'Check URLs for threats',
      'Analyze file attachments',
      'View scan history and reports'
    ],
    readTime: '3 min'
  },
  {
    id: 'safesuite-breach',
    title: 'Breach Monitor',
    description: 'Dark web credential monitoring',
    content: 'Continuously monitor the dark web for your credentials and personal data. Get instant alerts if your information appears in a breach.',
    category: 'safesuite',
    tags: ['breach', 'darkweb', 'monitoring'],
    route: '/safesuite/breach',
    steps: [
      'Add email addresses to monitor',
      'View breach history',
      'Take action on exposed credentials',
      'Set up alert notifications'
    ],
    readTime: '4 min'
  },

  // AI Studio Articles
  {
    id: 'aistudio-dashboard',
    title: 'AI Studio Dashboard',
    description: 'Build and manage custom AI assistants',
    content: 'AI Studio lets you create custom GPT assistants trained on your knowledge base. No coding required.',
    category: 'ai-studio',
    tags: ['dashboard', 'gpt', 'ai', 'overview'],
    route: '/dashboard',
    steps: [
      'View your GPT assistants',
      'Track usage and credits',
      'Access quick actions',
      'Monitor conversation metrics'
    ],
    readTime: '3 min'
  },
  {
    id: 'aistudio-builder',
    title: 'GPT Builder',
    description: 'Create custom AI assistants',
    content: 'Build powerful AI assistants by defining identity, uploading knowledge, and configuring behavior.',
    category: 'ai-studio',
    tags: ['builder', 'gpt', 'create', 'custom'],
    route: '/gpt-builder',
    steps: [
      'Set GPT name and description',
      'Upload training documents',
      'Configure response behavior',
      'Deploy to website or API'
    ],
    readTime: '6 min'
  },
  {
    id: 'aistudio-templates',
    title: 'GPT Templates',
    description: 'Start from pre-built templates',
    content: 'Choose from 20+ templates for customer support, sales, content writing, and more. Customize to fit your needs.',
    category: 'ai-studio',
    tags: ['templates', 'prebuilt', 'quick-start'],
    route: '/templates',
    steps: [
      'Browse template categories',
      'Preview template capabilities',
      'Clone and customize',
      'Deploy your customized GPT'
    ],
    readTime: '4 min'
  },

  // General Articles
  {
    id: 'general-settings',
    title: 'Settings Overview',
    description: 'Configure platform preferences',
    content: 'Access global settings to customize branding, defaults, notifications, security, and integrations.',
    category: 'general',
    tags: ['settings', 'configuration', 'preferences'],
    route: '/settings',
    steps: [
      'Configure branding and colors',
      'Set default behaviors',
      'Manage notification preferences',
      'Connect third-party integrations'
    ],
    readTime: '5 min'
  },
  {
    id: 'general-profile',
    title: 'Profile & Account',
    description: 'Manage your personal settings',
    content: 'Update your profile information, change password, enable 2FA, and manage account preferences.',
    category: 'general',
    tags: ['profile', 'account', 'personal'],
    route: '/profile',
    steps: [
      'Update profile information',
      'Change password',
      'Enable two-factor auth',
      'Manage connected accounts'
    ],
    readTime: '3 min'
  },
];

interface ContextualKnowledgeBaseProps {
  trigger?: React.ReactNode;
}

export function ContextualKnowledgeBase({ trigger }: ContextualKnowledgeBaseProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('contextual');

  // Find articles relevant to current page
  const contextualArticles = useMemo(() => {
    const currentPath = location.pathname;
    return articles.filter(article => {
      // Exact match or parent match
      if (currentPath === article.route || currentPath.startsWith(article.route + '/')) {
        return true;
      }
      // Check for keyword matches in path
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
      article.tags.some(tag => tag.toLowerCase().includes(query)) ||
      article.content.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group articles by category for browsing
  const articlesByCategory = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      articles: articles.filter(a => a.category === cat.id)
    }));
  }, []);

  const handleArticleClick = (article: KBArticle) => {
    // Could navigate to full article page or show inline
    console.log('Open article:', article.id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="relative" data-tour="help-button">
            <HelpCircle className="h-5 w-5" />
            {contextualArticles.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Knowledge Base
          </SheetTitle>
          <SheetDescription>
            Help and documentation for your current page
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchQuery && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {searchResults.length} results for "{searchQuery}"
                </p>
                {searchResults.slice(0, 5).map(article => (
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
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {article.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        {!searchQuery && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="contextual" className="gap-1.5 text-xs">
                <Target className="h-3.5 w-3.5" />
                This Page
              </TabsTrigger>
              <TabsTrigger value="browse" className="gap-1.5 text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="tours" className="gap-1.5 text-xs">
                <Play className="h-3.5 w-3.5" />
                Tours
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              {/* Contextual Help */}
              <TabsContent value="contextual" className="mt-0 space-y-4">
                {contextualArticles.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lightbulb className="h-4 w-4" />
                      <span>Relevant to: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{location.pathname}</code></span>
                    </div>
                    {contextualArticles.map(article => (
                      <Card 
                        key={article.id}
                        className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                        onClick={() => handleArticleClick(article)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{article.title}</CardTitle>
                            {article.readTime && (
                              <Badge variant="outline" className="text-xs">
                                {article.readTime}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{article.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {article.steps && (
                            <ul className="space-y-1.5">
                              {article.steps.slice(0, 3).map((step, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                  <span className="text-muted-foreground">{step}</span>
                                </li>
                              ))}
                              {article.steps.length > 3 && (
                                <li className="text-xs text-primary flex items-center gap-1 ml-6">
                                  +{article.steps.length - 3} more steps
                                  <ArrowRight className="h-3 w-3" />
                                </li>
                              )}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      No specific help for this page yet.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setActiveTab('browse')}
                    >
                      Browse All Docs
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Browse All */}
              <TabsContent value="browse" className="mt-0">
                <Accordion type="single" collapsible className="space-y-2">
                  {articlesByCategory.map(category => {
                    const Icon = category.icon;
                    return (
                      <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${category.color}`} />
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {category.articles.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          <div className="space-y-2">
                            {category.articles.map(article => (
                              <div 
                                key={article.id}
                                className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                                onClick={() => handleArticleClick(article)}
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{article.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {article.description}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </TabsContent>

              {/* Guided Tours */}
              <TabsContent value="tours" className="mt-0 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Interactive walkthroughs to help you learn the platform.
                </p>
                
                {[
                  { id: 'vanguard-command', name: 'Vanguard Command Tour', desc: 'Complete dashboard walkthrough', duration: '5 min' },
                  { id: 'safesuite-intro', name: 'Wrayth Introduction', desc: 'Security platform overview', duration: '3 min' },
                  { id: 'ai-studio-intro', name: 'AI Studio Basics', desc: 'Build your first GPT', duration: '4 min' },
                  { id: 'safepass-vault', name: 'Vault Vault Tour', desc: 'Password management deep-dive', duration: '3 min' },
                ].map(tour => (
                  <Card 
                    key={tour.id}
                    className="cursor-pointer hover:border-primary/50 transition-all"
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Play className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{tour.name}</h4>
                        <p className="text-sm text-muted-foreground">{tour.desc}</p>
                      </div>
                      <Badge variant="outline">{tour.duration}</Badge>
                    </CardContent>
                  </Card>
                ))}

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => {
                    localStorage.removeItem('ultrium_completed_tours');
                    window.location.reload();
                  }}>
                    <Play className="h-4 w-4 mr-2" />
                    Reset All Tours
                  </Button>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ContextualKnowledgeBase;
