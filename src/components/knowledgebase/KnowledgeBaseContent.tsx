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
  Play, 
  Lightbulb,
  ChevronRight,
  Target,
  CheckCircle2,
  Sparkles,
  Compass,
  Clock
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
  { id: 'safesuite', name: 'SafeSuite', icon: BookOpen, color: 'text-amber-400' },
  { id: 'ai-studio', name: 'AI Studio', icon: Sparkles, color: 'text-violet-400' },
  { id: 'general', name: 'General', icon: Compass, color: 'text-blue-400' },
];

// Knowledge base articles
const articles: KBArticle[] = [
  // Vanguard Articles
  {
    id: 'vanguard-dashboard',
    title: 'Command Center Overview',
    description: 'Your central hub for security operations',
    content: 'The Vanguard Command Center provides a unified view of all your security operations.',
    category: 'vanguard',
    tags: ['dashboard', 'overview', 'command'],
    route: '/vanguard',
    steps: ['View ticket status', 'Monitor alerts', 'Track device health'],
    readTime: '3 min'
  },
  {
    id: 'vanguard-tickets',
    title: 'Response - Ticket Management',
    description: 'Handle support requests efficiently',
    content: 'Vanguard Response is your helpdesk module for managing support tickets.',
    category: 'vanguard',
    tags: ['tickets', 'helpdesk', 'response'],
    route: '/vanguard/tickets',
    steps: ['Create tickets', 'Assign to technicians', 'Track SLA'],
    readTime: '5 min'
  },
  {
    id: 'vanguard-devices',
    title: 'Horizon - Device Management',
    description: 'Monitor and manage all endpoints',
    content: 'Vanguard Horizon provides comprehensive RMM capabilities.',
    category: 'vanguard',
    tags: ['devices', 'rmm', 'horizon'],
    route: '/vanguard/devices',
    steps: ['View devices', 'Check health', 'Deploy patches'],
    readTime: '4 min'
  },
  {
    id: 'vanguard-alerts',
    title: 'Pursuit - Security Alerts',
    description: 'Real-time threat detection',
    content: 'Vanguard Pursuit monitors for security threats.',
    category: 'vanguard',
    tags: ['alerts', 'security', 'pursuit'],
    route: '/vanguard/alerts',
    steps: ['View alerts', 'Investigate', 'Remediate'],
    readTime: '4 min'
  },
  {
    id: 'vanguard-atlas',
    title: 'Atlas - Documentation Hub',
    description: 'Centralized knowledge management',
    content: 'Vanguard Atlas stores documentation and passwords.',
    category: 'vanguard',
    tags: ['atlas', 'documentation', 'passwords'],
    route: '/vanguard/atlas',
    steps: ['Select organization', 'Manage docs', 'Store passwords'],
    readTime: '5 min'
  },
  // SafeSuite Articles
  {
    id: 'safesuite-overview',
    title: 'SafeSuite Dashboard',
    description: 'Your security command center',
    content: 'SafeSuite combines password management and threat scanning.',
    category: 'safesuite',
    tags: ['dashboard', 'overview'],
    route: '/safesuite',
    steps: ['View security score', 'Access vault', 'Run scans'],
    readTime: '3 min'
  },
  {
    id: 'safepass-vault',
    title: 'SafePass - Password Vault',
    description: 'Securely store credentials',
    content: 'SafePass provides enterprise-grade password management.',
    category: 'safesuite',
    tags: ['passwords', 'vault', 'safepass'],
    route: '/safesuite/vault',
    steps: ['Add passwords', 'Organize with folders', 'Share securely'],
    readTime: '4 min'
  },
  {
    id: 'safescan-scanner',
    title: 'SafeScan - Threat Scanner',
    description: 'Scan for threats',
    content: 'SafeScan detects phishing and malware.',
    category: 'safesuite',
    tags: ['scan', 'threats', 'safescan'],
    route: '/safesuite/scan',
    steps: ['Scan emails', 'Check URLs', 'Analyze files'],
    readTime: '3 min'
  },
  // AI Studio Articles
  {
    id: 'aistudio-dashboard',
    title: 'AI Studio Dashboard',
    description: 'Build custom AI assistants',
    content: 'AI Studio lets you create custom GPT assistants.',
    category: 'ai-studio',
    tags: ['dashboard', 'gpt', 'ai'],
    route: '/dashboard',
    steps: ['View GPTs', 'Track usage', 'Monitor conversations'],
    readTime: '3 min'
  },
  {
    id: 'aistudio-builder',
    title: 'GPT Builder',
    description: 'Create custom AI assistants',
    content: 'Build AI assistants by defining identity and behavior.',
    category: 'ai-studio',
    tags: ['builder', 'gpt', 'create'],
    route: '/gpt-builder',
    steps: ['Set identity', 'Upload knowledge', 'Configure behavior'],
    readTime: '6 min'
  },
  // General Articles
  {
    id: 'general-settings',
    title: 'Settings Overview',
    description: 'Configure platform preferences',
    content: 'Access global settings to customize your platform.',
    category: 'general',
    tags: ['settings', 'configuration'],
    route: '/settings',
    steps: ['Configure branding', 'Set defaults', 'Manage notifications'],
    readTime: '5 min'
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
        
        <div className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2">{selectedArticle.category}</Badge>
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
              <h3 className="text-sm font-medium">Quick Steps</h3>
              <ul className="space-y-2">
                {selectedArticle.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
        <p className="text-sm text-muted-foreground">Help for your current page</p>
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
        {searchQuery && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4"
          >
            <p className="text-xs text-muted-foreground mb-2">
              {searchResults.length} results for "{searchQuery}"
            </p>
            <div className="space-y-2">
              {searchResults.slice(0, 5).map(article => (
                <Card 
                  key={article.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleArticleClick(article)}
                >
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm">{article.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {article.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    Try browsing all articles.
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
