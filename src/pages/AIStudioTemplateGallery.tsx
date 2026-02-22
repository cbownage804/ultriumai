import { useState } from 'react';
import { clearBuilderDraft } from '@/lib/clearBuilderDraft';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, LayoutGrid, ArrowRight, Sparkles, Code2, Bot, Globe, ShoppingCart,
  BarChart3, MessageSquare, FileText, Users, Briefcase, Palette, Zap, Shield,
  BookOpen, Headphones, Target, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Navigation from '@/components/Navigation';
import { AIStudioSubNav } from '@/components/ai-studio/AIStudioSubNav';
import { Badge } from '@/components/ui/badge';

interface SharedTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  type: 'app' | 'gpt';
  tags: string[];
  thumbnail: string;
  prompt?: string;
  templateId?: string;
  popular?: boolean;
}

const SHARED_TEMPLATES: SharedTemplate[] = [
  // Apps
  { id: 'saas-landing', name: 'SaaS Landing Page', description: 'Hero section, feature grid, pricing cards, testimonials, and footer with CTA', icon: '🚀', category: 'Landing', type: 'app', tags: ['marketing', 'startup'], thumbnail: 'from-violet-600 via-indigo-600 to-cyan-600', prompt: 'Build a modern SaaS landing page with a hero section, feature grid, pricing table with 3 tiers, testimonials carousel, and a call-to-action footer', popular: true },
  { id: 'analytics-dash', name: 'Analytics Dashboard', description: 'Real-time KPI cards, interactive charts, data tables with filters', icon: '📊', category: 'Dashboard', type: 'app', tags: ['data', 'business'], thumbnail: 'from-blue-600 via-indigo-700 to-violet-800', prompt: 'Build an analytics dashboard with KPI cards, line/bar/pie charts using Recharts, a filterable data table, and a sidebar navigation', popular: true },
  { id: 'ecommerce', name: 'E-commerce Store', description: 'Product grid with filters, cart sidebar, checkout flow', icon: '🛒', category: 'E-Commerce', type: 'app', tags: ['shop', 'retail'], thumbnail: 'from-pink-600 via-rose-700 to-red-800', prompt: 'Build an e-commerce storefront with a product grid, category filters, search bar, shopping cart sidebar, and a multi-step checkout form', popular: true },
  { id: 'chat-app', name: 'Chat Application', description: 'Real-time messaging UI with sidebar, threads, and reactions', icon: '💬', category: 'App', type: 'app', tags: ['messaging', 'social'], thumbnail: 'from-violet-600 via-purple-700 to-fuchsia-800', prompt: 'Build a chat application with a conversation sidebar, message thread view, emoji reactions, and user presence indicators' },
  { id: 'portfolio', name: 'Portfolio Website', description: 'Personal portfolio with project showcase and contact form', icon: '🎨', category: 'Landing', type: 'app', tags: ['personal', 'creative'], thumbnail: 'from-rose-500 via-pink-600 to-purple-700', prompt: 'Build a portfolio website with a hero section, project gallery with modal previews, skills section, and a contact form' },
  { id: 'admin-panel', name: 'Admin Panel', description: 'User management, settings, content CRUD, and role permissions', icon: '⚙️', category: 'Dashboard', type: 'app', tags: ['admin', 'management'], thumbnail: 'from-gray-600 via-slate-700 to-zinc-800', prompt: 'Build an admin panel with user management table, role-based permissions, content CRUD operations, and system settings' },
  { id: 'crm', name: 'CRM Dashboard', description: 'Contact management, deals pipeline, activity timeline', icon: '🤝', category: 'Dashboard', type: 'app', tags: ['sales', 'business'], thumbnail: 'from-emerald-600 via-teal-700 to-cyan-800', prompt: 'Build a CRM dashboard with contact cards, a kanban deals pipeline, activity timeline, and revenue charts' },
  { id: 'project-mgmt', name: 'Project Manager', description: 'Kanban board, task lists, team members, deadlines', icon: '📋', category: 'App', type: 'app', tags: ['productivity', 'team'], thumbnail: 'from-orange-500 via-amber-600 to-yellow-700', prompt: 'Build a project management app with kanban board, task lists with due dates, team member assignment, and project progress charts' },
  { id: 'blog-platform', name: 'Blog Platform', description: 'Post editor, article feed, categories, and comments', icon: '✍️', category: 'App', type: 'app', tags: ['content', 'writing'], thumbnail: 'from-lime-500 via-green-600 to-emerald-700', prompt: 'Build a blog platform with a rich text editor, article feed with pagination, category tags, and a comments section' },
  { id: 'restaurant', name: 'Restaurant Site', description: 'Menu display, reservation form, gallery, reviews', icon: '🍽️', category: 'Landing', type: 'app', tags: ['food', 'business'], thumbnail: 'from-amber-600 via-orange-700 to-red-800', prompt: 'Build a restaurant website with a menu section, online reservation form, photo gallery, and customer reviews' },
  { id: 'fitness-tracker', name: 'Fitness Tracker', description: 'Workout logging, progress charts, exercise library', icon: '💪', category: 'App', type: 'app', tags: ['health', 'personal'], thumbnail: 'from-green-500 via-emerald-600 to-teal-700', prompt: 'Build a fitness tracker app with workout logging, weekly progress charts, exercise library with categories, and a goals tracker' },
  { id: 'invoice-gen', name: 'Invoice Generator', description: 'Create, preview, and download professional invoices', icon: '📄', category: 'App', type: 'app', tags: ['business', 'finance'], thumbnail: 'from-blue-500 via-sky-600 to-cyan-700', prompt: 'Build an invoice generator with a form builder, live PDF preview, line item management, tax calculations, and download functionality' },

  // GPTs
  { id: 'gpt-support', name: 'Customer Support Bot', description: 'Handles FAQs, escalates complex issues, maintains brand tone', icon: '🎧', category: 'Support', type: 'gpt', tags: ['support', 'customer service'], thumbnail: 'from-emerald-600 via-green-700 to-teal-800', templateId: 'support', popular: true },
  { id: 'gpt-knowledge', name: 'Knowledge Base Q&A', description: 'Search and answer questions from internal documentation', icon: '📚', category: 'Knowledge', type: 'gpt', tags: ['docs', 'search'], thumbnail: 'from-sky-600 via-blue-700 to-indigo-800', templateId: 'knowledge', popular: true },
  { id: 'gpt-lead', name: 'Website Lead Bot', description: 'Qualify visitors, capture contact info, schedule demos', icon: '🎯', category: 'Sales', type: 'gpt', tags: ['sales', 'marketing'], thumbnail: 'from-amber-600 via-orange-700 to-red-800', templateId: 'lead' },
  { id: 'gpt-docs', name: 'Doc Analyzer', description: 'Analyze contracts, proposals, and legal documents with AI', icon: '📄', category: 'Productivity', type: 'gpt', tags: ['analysis', 'legal'], thumbnail: 'from-cyan-600 via-teal-700 to-emerald-800', templateId: 'docs' },
  { id: 'gpt-onboard', name: 'Employee Onboarding', description: 'Guide new hires through company policies and procedures', icon: '👋', category: 'HR', type: 'gpt', tags: ['hr', 'training'], thumbnail: 'from-violet-500 via-purple-600 to-fuchsia-700', templateId: 'general' },
  { id: 'gpt-writer', name: 'Content Writer', description: 'Generate blog posts, emails, social media copy', icon: '✏️', category: 'Creative', type: 'gpt', tags: ['writing', 'marketing'], thumbnail: 'from-rose-500 via-pink-600 to-red-700', templateId: 'general' },
  { id: 'gpt-code', name: 'Code Assistant', description: 'Debug, explain, and write code across languages', icon: '👨‍💻', category: 'Developer', type: 'gpt', tags: ['coding', 'technical'], thumbnail: 'from-gray-600 via-zinc-700 to-slate-800', templateId: 'general' },
  { id: 'gpt-tutor', name: 'AI Tutor', description: 'Personalized learning assistant with quiz generation', icon: '🎓', category: 'Education', type: 'gpt', tags: ['learning', 'education'], thumbnail: 'from-indigo-500 via-blue-600 to-sky-700', templateId: 'general' },
];

const CATEGORIES = [
  { key: 'all', label: 'All Templates', icon: Sparkles },
  { key: 'popular', label: 'Popular', icon: Zap },
  { key: 'Landing', label: 'Landing Pages', icon: Globe },
  { key: 'Dashboard', label: 'Dashboards', icon: BarChart3 },
  { key: 'App', label: 'Applications', icon: Code2 },
  { key: 'E-Commerce', label: 'E-Commerce', icon: ShoppingCart },
  { key: 'Support', label: 'Support Bots', icon: Headphones },
  { key: 'Knowledge', label: 'Knowledge', icon: BookOpen },
  { key: 'Sales', label: 'Sales', icon: Target },
  { key: 'Productivity', label: 'Productivity', icon: Briefcase },
];

const TYPE_FILTERS = ['All', 'App', 'GPT'] as const;

export default function AIStudioTemplateGallery() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<typeof TYPE_FILTERS[number]>('All');
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = SHARED_TEMPLATES.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'All' || (typeFilter === 'App' && t.type === 'app') || (typeFilter === 'GPT' && t.type === 'gpt');
    const matchesCategory = activeCategory === 'all' || (activeCategory === 'popular' ? t.popular : t.category === activeCategory);
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleSelect = (template: SharedTemplate) => {
    if (template.type === 'app') {
      clearBuilderDraft(); navigate(`/ai-studio/app-builder?new=true&template=${template.id}`);
    } else {
      navigate(`/ai-studio/gpt-builder?template=${template.templateId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AIStudioSubNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Template Gallery</h1>
              <p className="text-xs text-muted-foreground">{SHARED_TEMPLATES.length} templates to jumpstart your project</p>
            </div>
          </div>
        </div>

        {/* Search & Type Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, description, or tag..."
              className="w-full h-10 bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
            {TYPE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px] flex items-center gap-1.5',
                  typeFilter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f === 'All' && <><Sparkles className="h-3 w-3" /> All</>}
                {f === 'App' && <><Code2 className="h-3 w-3" /> Apps</>}
                {f === 'GPT' && <><Bot className="h-3 w-3" /> GPTs</>}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                activeCategory === cat.key
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <cat.icon className="h-3 w-3" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} template{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template, i) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              onClick={() => handleSelect(template)}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="text-left rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group overflow-hidden"
            >
              <div className={cn(
                'h-36 w-full bg-gradient-to-br relative overflow-hidden transition-transform duration-500',
                template.thumbnail,
                hoveredId === template.id && 'scale-105'
              )}>
                {/* Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <Badge className={cn(
                    'text-[9px] border-0 backdrop-blur-sm',
                    template.type === 'app' ? 'bg-blue-500/40 text-blue-100' : 'bg-violet-500/40 text-violet-100'
                  )}>
                    {template.type === 'app' ? 'App' : 'GPT'}
                  </Badge>
                  {template.popular && (
                    <Badge className="text-[9px] border-0 bg-amber-500/40 text-amber-100 backdrop-blur-sm">
                      <Zap className="h-2 w-2 mr-0.5" /> Popular
                    </Badge>
                  )}
                </div>

                <div className="absolute bottom-2 left-2 text-3xl drop-shadow-lg">{template.icon}</div>

                {/* Hover overlay */}
                <div className={cn(
                  'absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200',
                  hoveredId === template.id ? 'opacity-100' : 'opacity-0'
                )}>
                  <div className="flex items-center gap-1.5 text-xs text-white font-medium bg-white/10 px-4 py-2 rounded-full">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Use Template
                  </div>
                </div>
              </div>

              <div className="p-3">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{template.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{template.description}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  <span className="text-[9px] text-muted-foreground/70 px-1.5 py-0.5 rounded-full border border-border/40">{template.category}</span>
                  {template.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[9px] text-muted-foreground/50 px-1.5 py-0.5 rounded-full border border-border/30">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No templates match your search</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('all'); setTypeFilter('All'); }}
              className="text-xs text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
