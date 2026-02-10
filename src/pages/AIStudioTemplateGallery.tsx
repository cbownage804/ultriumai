import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Search, LayoutGrid, Bot, Zap, ArrowRight, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

const SHARED_TEMPLATES: SharedTemplate[] = [
  // App Builder templates
  { id: 'saas-landing', name: 'SaaS Landing', description: 'Hero, features, pricing, testimonials', icon: '🚀', category: 'Landing', type: 'app', tags: ['marketing'], thumbnail: 'from-violet-600 via-indigo-600 to-cyan-600', prompt: 'Build a modern SaaS landing page' },
  { id: 'analytics-dash', name: 'Analytics Dashboard', description: 'Charts, KPIs, data tables', icon: '📊', category: 'Dashboard', type: 'app', tags: ['data'], thumbnail: 'from-blue-600 via-indigo-700 to-violet-800', prompt: 'Build an analytics dashboard' },
  { id: 'ecommerce', name: 'E-commerce Store', description: 'Product grid, cart, checkout', icon: '🛒', category: 'E-Commerce', type: 'app', tags: ['shop'], thumbnail: 'from-pink-600 via-rose-700 to-red-800', prompt: 'Build an e-commerce storefront' },
  { id: 'chat-app', name: 'Chat Interface', description: 'Real-time messaging UI', icon: '💬', category: 'App', type: 'app', tags: ['messaging'], thumbnail: 'from-violet-600 via-purple-700 to-fuchsia-800', prompt: 'Build a chat application' },
  { id: 'portfolio', name: 'Portfolio', description: 'Personal portfolio site', icon: '🎨', category: 'Landing', type: 'app', tags: ['personal'], thumbnail: 'from-rose-500 via-pink-600 to-purple-700', prompt: 'Build a portfolio website' },
  { id: 'admin-panel', name: 'Admin Panel', description: 'Users, settings, content', icon: '⚙️', category: 'Dashboard', type: 'app', tags: ['admin'], thumbnail: 'from-gray-600 via-slate-700 to-zinc-800', prompt: 'Build an admin panel' },

  // GPT Builder templates
  { id: 'gpt-support', name: 'Customer Support Bot', description: 'AI assistant for customer inquiries', icon: '🎧', category: 'Support', type: 'gpt', tags: ['support'], thumbnail: 'from-emerald-600 via-green-700 to-teal-800', templateId: 'support' },
  { id: 'gpt-knowledge', name: 'Knowledge Base Q&A', description: 'Query docs in natural language', icon: '📚', category: 'Knowledge', type: 'gpt', tags: ['docs'], thumbnail: 'from-sky-600 via-blue-700 to-indigo-800', templateId: 'knowledge' },
  { id: 'gpt-lead', name: 'Website Lead Bot', description: 'Qualify visitors and capture leads', icon: '🎯', category: 'Sales', type: 'gpt', tags: ['sales'], thumbnail: 'from-amber-600 via-orange-700 to-red-800', templateId: 'lead' },
  { id: 'gpt-docs', name: 'Doc Analyzer', description: 'Analyze contracts and proposals', icon: '📄', category: 'Productivity', type: 'gpt', tags: ['analysis'], thumbnail: 'from-cyan-600 via-teal-700 to-emerald-800', templateId: 'docs' },
];

const FILTERS = ['All', 'App', 'GPT'] as const;

export default function AIStudioTemplateGallery() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = SHARED_TEMPLATES.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'App' && t.type === 'app') || (filter === 'GPT' && t.type === 'gpt');
    return matchesSearch && matchesFilter;
  });

  const handleSelect = (template: SharedTemplate) => {
    if (template.type === 'app') {
      navigate(`/ai-studio/app-builder?new=true&template=${template.id}`);
    } else {
      navigate(`/ai-studio/gpt-builder?template=${template.templateId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ai-studio')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-semibold">Template Gallery</h1>
          </div>
          <span className="text-xs text-muted-foreground">{SHARED_TEMPLATES.length} templates</span>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-56px)]">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full h-10 bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f === 'All' ? '✨ All' : f === 'App' ? '🖥️ App' : '🤖 GPT'}
                </button>
              ))}
            </div>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template, i) => (
              <motion.button
                key={template.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleSelect(template)}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="text-left rounded-xl border border-border/50 hover:border-primary/30 transition-all group overflow-hidden"
              >
                {/* Thumbnail */}
                <div className={cn(
                  'h-32 w-full bg-gradient-to-br relative overflow-hidden transition-transform duration-500',
                  template.thumbnail,
                  hoveredId === template.id && 'scale-105'
                )}>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <span className={cn(
                      'text-[9px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur-sm',
                      template.type === 'app' ? 'bg-blue-500/30 text-blue-200' : 'bg-violet-500/30 text-violet-200'
                    )}>
                      {template.type === 'app' ? 'App' : 'GPT'}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 text-2xl">{template.icon}</div>
                  <div className={cn(
                    'absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200',
                    hoveredId === template.id ? 'opacity-100' : 'opacity-0'
                  )}>
                    <div className="flex items-center gap-1.5 text-xs text-white font-medium">
                      <ArrowRight className="h-3.5 w-3.5" />
                      Use Template
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{template.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{template.description}</p>
                  <div className="flex gap-1 mt-2">
                    {template.tags.map(tag => (
                      <span key={tag} className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded-full border border-border/50">{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No templates match your search</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
