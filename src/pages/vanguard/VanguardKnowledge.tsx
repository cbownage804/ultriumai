import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, Search, Plus, FileText, Video, Link2, Star,
  Clock, Eye, ThumbsUp, Folder, ChevronRight, X, ArrowLeft,
  Edit, Trash2, Loader2, ExternalLink, Play, BookMarked, 
  AlertCircle, Server, Users, Plug, HardDrive, Shield
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Article {
  id: string;
  title: string;
  category: string;
  type: 'article' | 'video' | 'link';
  views: number;
  likes: number;
  time: string;
  featured: boolean;
  content?: string;
  description?: string;
}

const initialArticles: Article[] = [
  { 
    id: '1', 
    title: 'Setting Up Remote Agents', 
    category: 'Getting Started', 
    type: 'article', 
    views: 1250, 
    likes: 45, 
    time: '5 min read', 
    featured: true, 
    description: 'Complete guide to deploying and configuring Vanguard agents on remote endpoints.',
    content: `# Setting Up Remote Agents

## Overview
Vanguard agents are lightweight security monitoring tools that run on your endpoints to provide real-time visibility into system health, security status, and compliance.

## Prerequisites
- Windows 10/11 or Windows Server 2016+
- .NET Framework 4.8 or higher
- Administrator privileges
- Network connectivity to Vanguard cloud services

## Installation Steps

### 1. Download the Agent
Navigate to **Vanguard Dashboard > Devices > Install Agent** to download the installer package.

### 2. Run the Installer
Execute the installer with administrator privileges:
\`\`\`powershell
./VanguardAgent-Installer.exe /quiet /norestart
\`\`\`

### 3. Configure Agent Settings
The agent will automatically connect to your Vanguard instance using the embedded configuration.

### 4. Verify Connection
Check the Devices page to confirm the agent appears online.

## Troubleshooting
- Ensure firewall allows outbound HTTPS (443) traffic
- Verify DNS resolution to agent.vanguard.cloud
- Check Windows Event Viewer for installation errors`
  },
  { 
    id: '2', 
    title: 'Configuring Alert Rules', 
    category: 'Alerts', 
    type: 'article', 
    views: 891, 
    likes: 32, 
    time: '8 min read', 
    featured: false, 
    description: 'Learn to create custom alert rules for proactive threat detection.',
    content: `# Configuring Alert Rules

## Understanding Alert Rules
Alert rules define conditions that trigger notifications when specific security events occur in your environment.

## Creating a New Rule

### Step 1: Define Trigger Conditions
- Select the event type (Security, Performance, Compliance)
- Set threshold values
- Configure time windows

### Step 2: Set Notification Channels
- Email notifications
- SMS alerts
- Slack/Teams webhooks
- PagerDuty integration

### Step 3: Configure Escalation
- Primary responder
- Escalation timeout
- Secondary contacts

## Best Practices
- Start with high-severity alerts only
- Avoid alert fatigue by tuning thresholds
- Review and refine rules monthly`
  },
  { 
    id: '3', 
    title: 'Patch Management Best Practices', 
    category: 'Security', 
    type: 'video', 
    views: 2100, 
    likes: 78, 
    time: '12 min', 
    featured: true, 
    description: 'Video walkthrough of enterprise patch management strategies and automation.',
    content: `# Patch Management Best Practices

## Video Transcript Summary

This video covers comprehensive patch management strategies for enterprise environments.

### Topics Covered:
1. **Assessment Phase** - Identifying vulnerable systems
2. **Testing Phase** - Lab validation before production
3. **Deployment Phase** - Staged rollout strategies
4. **Verification Phase** - Confirming successful patching

### Key Takeaways:
- Always test patches in staging first
- Use maintenance windows for critical updates
- Maintain rollback procedures
- Document all changes for compliance`
  },
  { 
    id: '4', 
    title: 'Customer Onboarding Guide', 
    category: 'Customers', 
    type: 'article', 
    views: 560, 
    likes: 21, 
    time: '10 min read', 
    featured: false, 
    description: 'Step-by-step process for onboarding new MSP customers.',
    content: `# Customer Onboarding Guide

## Pre-Onboarding Checklist
- [ ] Customer agreement signed
- [ ] Contact information collected
- [ ] Network documentation received
- [ ] Access credentials provisioned

## Onboarding Process

### Day 1: Initial Setup
1. Create customer tenant
2. Configure user accounts
3. Set up billing profile

### Week 1: Agent Deployment
1. Deploy agents to endpoints
2. Configure monitoring policies
3. Set up alert rules

### Week 2: Optimization
1. Review initial data
2. Tune alert thresholds
3. Customer training session`
  },
  { 
    id: '5', 
    title: 'API Integration Tutorial', 
    category: 'Integrations', 
    type: 'article', 
    views: 430, 
    likes: 15, 
    time: '15 min read', 
    featured: false, 
    description: 'Developer guide for integrating with the Vanguard REST API.',
    content: `# API Integration Tutorial

## Authentication
All API requests require a valid API key in the Authorization header:

\`\`\`
Authorization: Bearer your-api-key-here
\`\`\`

## Base URL
\`\`\`
https://api.vanguard.cloud/v1
\`\`\`

## Common Endpoints

### List Devices
\`\`\`
GET /devices
\`\`\`

### Get Device Details
\`\`\`
GET /devices/{deviceId}
\`\`\`

### Create Alert Rule
\`\`\`
POST /alerts/rules
\`\`\`

## Rate Limits
- 100 requests per minute
- 10,000 requests per day`
  },
  { 
    id: '6', 
    title: 'Backup Configuration', 
    category: 'Backup', 
    type: 'video', 
    views: 780, 
    likes: 29, 
    time: '8 min', 
    featured: false, 
    description: 'Configure and monitor backup jobs across your managed infrastructure.',
    content: `# Backup Configuration Guide

## Supported Backup Solutions
- Veeam Backup & Replication
- Datto SIRIS
- Acronis Cyber Protect
- Azure Backup

## Configuration Steps
1. Navigate to Backup Monitoring
2. Add integration credentials
3. Configure monitoring policies
4. Set up failure alerts

## Best Practices
- Verify backups weekly
- Test restores quarterly
- Monitor backup success rates`
  },
  {
    id: '7',
    title: 'SOC Alert Investigation Workflow',
    category: 'Security',
    type: 'article',
    views: 1450,
    likes: 67,
    time: '10 min read',
    featured: false,
    description: 'Standard operating procedure for SOC analysts investigating security alerts.',
    content: `# SOC Alert Investigation Workflow

## Initial Triage
1. Review alert severity and type
2. Check for related alerts
3. Gather context from affected assets

## Investigation Steps
1. Analyze event timeline
2. Review network traffic logs
3. Check user activity patterns
4. Correlate with threat intelligence

## Response Actions
- Isolate affected endpoints
- Block malicious IPs
- Reset compromised credentials
- Document findings`
  },
  {
    id: '8',
    title: 'Multi-Tenant Management Guide',
    category: 'Customers',
    type: 'article',
    views: 890,
    likes: 41,
    time: '12 min read',
    featured: false,
    description: 'Managing multiple customer environments from a single Vanguard instance.',
    content: `# Multi-Tenant Management Guide

## Tenant Hierarchy
- MSP Level (Global policies)
- Customer Level (Tenant-specific)
- Site Level (Location-based)

## Best Practices
- Use consistent naming conventions
- Apply baseline policies globally
- Customize per customer needs
- Regular tenant audits`
  },
  {
    id: '9',
    title: 'Compliance Reporting Setup',
    category: 'Security',
    type: 'article',
    views: 670,
    likes: 28,
    time: '7 min read',
    featured: false,
    description: 'Generate compliance reports for CIS, NIST, and SOC 2 frameworks.',
    content: `# Compliance Reporting Setup

## Supported Frameworks
- CIS Controls v8
- NIST CSF
- SOC 2 Type II
- ISO 27001

## Report Generation
1. Select framework
2. Choose scope (all or specific customers)
3. Generate report
4. Export to PDF/Excel`
  },
  {
    id: '10',
    title: 'Webhook Configuration',
    category: 'Integrations',
    type: 'link',
    views: 320,
    likes: 12,
    time: '5 min read',
    featured: false,
    description: 'Set up webhooks to integrate Vanguard with external systems.',
    content: `# Webhook Configuration

## Creating Webhooks
Navigate to Settings > Integrations > Webhooks

## Payload Format
\`\`\`json
{
  "event_type": "alert.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { ... }
}
\`\`\`

## Security
- HMAC signature verification
- IP whitelist support
- Retry on failure`
  }
];

const categories = [
  { name: 'All', count: 0, icon: Folder },
  { name: 'Getting Started', count: 12, icon: BookMarked },
  { name: 'Alerts', count: 8, icon: AlertCircle },
  { name: 'Security', count: 15, icon: Shield },
  { name: 'Customers', count: 6, icon: Users },
  { name: 'Integrations', count: 9, icon: Plug },
  { name: 'Backup', count: 5, icon: HardDrive },
];

const typeIcons = {
  article: FileText,
  video: Video,
  link: Link2,
};

export default function VanguardKnowledge() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Getting Started');
  const [newType, setNewType] = useState<'article' | 'video' | 'link'>('article');
  const [newContent, setNewContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Vanguard Atlas | Ultrium Vanguard';
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = articles.filter(a => a.featured);

  const handleCreateArticle = () => {
    if (!newTitle || !newContent) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const newArticle: Article = {
        id: Date.now().toString(),
        title: newTitle,
        category: newCategory,
        type: newType,
        views: 0,
        likes: 0,
        time: newType === 'video' ? '5 min' : '3 min read',
        featured: false,
        content: newContent,
      };
      setArticles([newArticle, ...articles]);
      toast.success('Article created successfully');
      setShowCreateDialog(false);
      setNewTitle('');
      setNewCategory('Getting Started');
      setNewType('article');
      setNewContent('');
      setIsLoading(false);
    }, 1000);
  };

  const handleEditArticle = () => {
    if (!selectedArticle || !newTitle || !newContent) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setArticles(articles.map(a => 
        a.id === selectedArticle.id 
          ? { ...a, title: newTitle, category: newCategory, type: newType, content: newContent }
          : a
      ));
      toast.success('Article updated successfully');
      setShowEditDialog(false);
      setSelectedArticle(null);
      setIsLoading(false);
    }, 1000);
  };

  const handleDeleteArticle = (article: Article) => {
    setArticles(articles.filter(a => a.id !== article.id));
    if (selectedArticle?.id === article.id) {
      setSelectedArticle(null);
    }
    toast.success('Article deleted');
  };

  const handleLikeArticle = (article: Article) => {
    setArticles(articles.map(a => 
      a.id === article.id ? { ...a, likes: a.likes + 1 } : a
    ));
    toast.success('Thanks for the feedback!');
  };

  const handleToggleFeatured = (article: Article) => {
    setArticles(articles.map(a => 
      a.id === article.id ? { ...a, featured: !a.featured } : a
    ));
    toast.success(article.featured ? 'Removed from featured' : 'Added to featured');
  };

  const openEditDialog = (article: Article) => {
    setSelectedArticle(article);
    setNewTitle(article.title);
    setNewCategory(article.category);
    setNewType(article.type);
    setNewContent(article.content || '');
    setShowEditDialog(true);
  };

  const viewArticle = (article: Article) => {
    // Update view count
    setArticles(articles.map(a => 
      a.id === article.id ? { ...a, views: a.views + 1 } : a
    ));
    setSelectedArticle(article);
  };

  // Article viewer
  if (selectedArticle && !showEditDialog) {
    return (
      <div className="p-6 space-y-6">
        <Button 
          variant="ghost" 
          className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
          onClick={() => setSelectedArticle(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Base
        </Button>
        
        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardHeader className="border-b border-purple-500/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
                    {selectedArticle.category}
                  </Badge>
                  {selectedArticle.featured && (
                    <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline" className={`
                    ${selectedArticle.type === 'video' ? 'border-purple-500/40 text-purple-400' : ''}
                    ${selectedArticle.type === 'link' ? 'border-blue-500/40 text-blue-400' : ''}
                    ${selectedArticle.type === 'article' ? 'border-cyan-500/40 text-cyan-400' : ''}
                  `}>
                    {selectedArticle.type === 'video' && <Play className="h-3 w-3 mr-1" />}
                    {selectedArticle.type === 'link' && <ExternalLink className="h-3 w-3 mr-1" />}
                    {selectedArticle.type === 'article' && <FileText className="h-3 w-3 mr-1" />}
                    {selectedArticle.type}
                  </Badge>
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
                  {selectedArticle.title}
                </CardTitle>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-cyan-400" />
                    {selectedArticle.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4 text-purple-400" />
                    {selectedArticle.likes} likes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-400" />
                    {selectedArticle.time}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 bg-black/60"
                  onClick={() => openEditDialog(selectedArticle)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 bg-black/60"
                  onClick={() => handleToggleFeatured(selectedArticle)}
                >
                  <Star className={`h-4 w-4 mr-1 ${selectedArticle.featured ? 'fill-current' : ''}`} />
                  {selectedArticle.featured ? 'Unfeature' : 'Feature'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-invert max-w-none">
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedArticle.content}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-purple-500/20 flex items-center justify-between">
              <p className="text-slate-400 text-sm">Was this article helpful?</p>
              <Button 
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                onClick={() => handleLikeArticle(selectedArticle)}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Yes, this helped
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-purple-500/30 border border-cyan-500/40 shadow-lg shadow-purple-500/20">
            <BookOpen className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Vanguard Atlas</h1>
            <p className="text-slate-400 text-sm">Knowledge base, documentation, and SOPs</p>
          </div>
        </div>
        <Button 
          className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <Input 
          placeholder="Search documentation..." 
          className="pl-12 py-6 text-lg bg-black/80 border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20 shadow-lg shadow-purple-500/10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Featured Articles */}
      {!searchQuery && selectedCategory === 'All' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            Featured Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {featuredArticles.map((article, i) => {
              const TypeIcon = typeIcons[article.type];
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card 
                    className="bg-black/80 border-cyan-500/30 hover:border-purple-500/50 transition-all cursor-pointer h-full shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20 group"
                    onClick={() => viewArticle(article)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 group-hover:border-purple-500/50 transition-colors">
                          <TypeIcon className="h-5 w-5 text-cyan-400" />
                        </div>
                      </div>
                      <CardTitle className="text-white mt-2 group-hover:text-cyan-300 transition-colors">{article.title}</CardTitle>
                      <CardDescription className="text-slate-400">{article.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {article.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {article.time}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Categories</h2>
          <div className="space-y-2">
            {categories.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <Card 
                  key={category.name}
                  className={`bg-black/80 border-cyan-500/30 hover:border-purple-500/50 transition-all cursor-pointer ${
                    selectedCategory === category.name 
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10 shadow-lg shadow-purple-500/10' 
                      : ''
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon className={`h-4 w-4 ${selectedCategory === category.name ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className={`${selectedCategory === category.name ? 'text-cyan-400 font-medium' : 'text-slate-300'}`}>
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {category.name !== 'All' && (
                          <Badge 
                            variant="secondary" 
                            className={`${
                              selectedCategory === category.name 
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {category.count}
                          </Badge>
                        )}
                        <ChevronRight className={`h-4 w-4 ${selectedCategory === category.name ? 'text-cyan-400' : 'text-slate-600'}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {searchQuery ? 'Search Results' : selectedCategory === 'All' ? 'All Articles' : selectedCategory}
            </h2>
            <span className="text-slate-500 text-sm">{filteredArticles.length} articles</span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {filteredArticles.map((article, i) => {
                const TypeIcon = typeIcons[article.type];
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="bg-black/80 border-cyan-500/30 hover:border-purple-500/50 transition-all shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10 group">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 group-hover:border-purple-500/50 transition-colors">
                            <TypeIcon className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => viewArticle(article)}
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-medium group-hover:text-cyan-300 transition-colors">{article.title}</h3>
                              {article.featured && (
                                <Star className="h-4 w-4 text-amber-400 fill-current" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              <Badge className="bg-slate-800/80 text-slate-400 border border-slate-700">
                                {article.category}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.views.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {article.time}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(article);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteArticle(article);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">No articles found</p>
                <p className="text-slate-500 text-sm">Try a different search or category</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Article Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-black/95 border-cyan-500/30 max-w-2xl shadow-2xl shadow-purple-500/20">
          <DialogHeader>
            <DialogTitle className="text-white bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Create New Article</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new article to the knowledge base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                placeholder="Article title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-black/60 border-cyan-500/30 text-white focus:border-cyan-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-black/60 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-cyan-500/30">
                    {categories.filter(c => c.name !== 'All').map(c => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
                  <SelectTrigger className="bg-black/60 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-cyan-500/30">
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Content</Label>
              <Textarea
                placeholder="Write your article content..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="bg-black/60 border-cyan-500/30 text-white min-h-[200px] focus:border-cyan-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateArticle} 
              disabled={isLoading} 
              className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-black/95 border-cyan-500/30 max-w-2xl shadow-2xl shadow-purple-500/20">
          <DialogHeader>
            <DialogTitle className="text-white bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Edit Article</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update the article content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                placeholder="Article title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-black/60 border-cyan-500/30 text-white focus:border-cyan-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-black/60 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-cyan-500/30">
                    {categories.filter(c => c.name !== 'All').map(c => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
                  <SelectTrigger className="bg-black/60 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-cyan-500/30">
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Content</Label>
              <Textarea
                placeholder="Write your article content..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="bg-black/60 border-cyan-500/30 text-white min-h-[200px] focus:border-cyan-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleEditArticle} 
              disabled={isLoading} 
              className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
