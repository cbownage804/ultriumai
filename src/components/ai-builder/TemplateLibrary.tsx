import { useState } from 'react';
import { X, Search, LayoutGrid, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  prompt: string;
}

const TEMPLATES: Template[] = [
  // Landing Pages
  { id: 'saas-landing', name: 'SaaS Landing', description: 'Hero, features, pricing, testimonials, CTA', icon: '🚀', category: 'Landing', prompt: 'Build a modern SaaS landing page with: a bold hero section with gradient background, animated headline, and CTA button. Features grid with icons. Pricing table with 3 tiers. Testimonial carousel. Footer with newsletter signup. Dark theme with accent colors.' },
  { id: 'portfolio', name: 'Portfolio', description: 'Personal portfolio with projects showcase', icon: '🎨', category: 'Landing', prompt: 'Build a personal portfolio website with: a minimal hero with name and role. Project showcase grid with hover effects and project detail modals. Skills section with animated progress bars. Contact form. Smooth scroll navigation. Modern dark design.' },
  { id: 'startup-launch', name: 'Startup Launch', description: 'Coming soon page with email capture', icon: '⚡', category: 'Landing', prompt: 'Build a startup launch/coming soon page with: dramatic full-screen animated background. Large countdown timer. Email waitlist capture form with validation. Social proof counter. Product teaser section. Minimalist, high-impact design.' },

  // Dashboards
  { id: 'analytics-dash', name: 'Analytics Dashboard', description: 'Charts, KPIs, data tables', icon: '📊', category: 'Dashboard', prompt: 'Build an analytics dashboard with: top KPI cards (revenue, users, conversion, growth) with sparkline trends. Main area chart showing revenue over time. Sidebar with navigation. Data table with sortable columns, search, and pagination. Activity feed. Dark theme with cyan accents.' },
  { id: 'project-mgmt', name: 'Project Board', description: 'Kanban board with drag indicators', icon: '📋', category: 'Dashboard', prompt: 'Build a project management kanban board with: columns for Backlog, In Progress, Review, Done. Cards with title, assignee avatar, priority badge, and due date. Add task modal with form. Column headers with count badges. Smooth card transitions. Professional dark UI.' },
  { id: 'crm-dash', name: 'CRM Dashboard', description: 'Contacts, deals pipeline, activity', icon: '👥', category: 'Dashboard', prompt: 'Build a CRM dashboard with: deals pipeline view with stages (Lead, Qualified, Proposal, Closed). Contact list with avatar, company, and status. Revenue chart. Recent activity timeline. Quick-add contact modal. Filters and search. Corporate dark theme.' },

  // Apps
  { id: 'chat-app', name: 'Chat Interface', description: 'Real-time chat with message bubbles', icon: '💬', category: 'App', prompt: 'Build a chat application interface with: sidebar showing conversations list with avatars and last message preview. Main chat area with message bubbles (sent/received styling). Message input with emoji picker trigger and send button. Typing indicator animation. Online status dots. Search conversations. Dark messenger-style theme.' },
  { id: 'ecommerce', name: 'E-commerce Store', description: 'Product grid, cart, checkout flow', icon: '🛒', category: 'App', prompt: 'Build an e-commerce storefront with: navigation with cart icon and count. Product grid with images, prices, and add-to-cart buttons. Product quick-view modal. Shopping cart sidebar drawer. Filter sidebar (category, price range). Search bar. Responsive grid. Dark premium retail theme.' },
  { id: 'social-feed', name: 'Social Feed', description: 'Posts, likes, comments, stories', icon: '📱', category: 'App', prompt: 'Build a social media feed with: stories bar at top with circular avatars. Post cards with author info, image, like/comment/share buttons, and comment section. Create post modal with text and image upload. Trending sidebar. Notification bell with dropdown. Dark social media theme.' },

  // Forms & Tools
  { id: 'multi-step-form', name: 'Multi-Step Form', description: 'Wizard form with validation', icon: '📝', category: 'Tool', prompt: 'Build a multi-step form wizard with: progress stepper showing current step. Step 1: Personal info (name, email, phone). Step 2: Preferences (checkboxes, radio buttons, select). Step 3: Review and submit. Smooth step transitions. Field validation with error messages. Success state with confetti animation. Clean dark form design.' },
  { id: 'file-manager', name: 'File Manager', description: 'Grid/list view, breadcrumbs, upload', icon: '📁', category: 'Tool', prompt: 'Build a file manager interface with: breadcrumb navigation. Toggle between grid and list views. File/folder cards with icons, names, sizes, dates. Right-click context menu. Upload dropzone with drag-and-drop. Storage usage bar. New folder modal. Search and filter. Dark OS-style theme.' },
  { id: 'calendar-app', name: 'Calendar App', description: 'Month/week/day views, events', icon: '📅', category: 'Tool', prompt: 'Build a calendar application with: month view grid with event dots. Week view with time slots. Day view with hourly schedule. Create event modal with date/time picker, title, color selection. Today button. Navigation arrows for months. Mini calendar in sidebar. Dark productivity theme.' },
];

const CATEGORIES = ['All', 'Landing', 'Dashboard', 'App', 'Tool'] as const;

const CATEGORY_META: Record<string, { emoji: string; desc: string }> = {
  All: { emoji: '✨', desc: 'All templates' },
  Landing: { emoji: '🌐', desc: 'Marketing & landing pages' },
  Dashboard: { emoji: '📊', desc: 'Analytics & management' },
  App: { emoji: '📱', desc: 'Full applications' },
  Tool: { emoji: '🛠️', desc: 'Utilities & tools' },
};

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (prompt: string) => void;
}

export function TemplateLibrary({ isOpen, onClose, onSelectTemplate }: TemplateLibraryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  if (!isOpen) return null;

  const filtered = TEMPLATES.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || t.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0d0d18] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-white/[0.06]">
              <LayoutGrid className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Template Library</h2>
              <p className="text-[10px] text-white/30">Pick a starter to build on</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-5 py-3 border-b border-white/[0.06] space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg pl-8 pr-3 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-cyan-500/30"
            />
          </div>
          <div className="flex gap-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full transition-colors font-medium",
                  category === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-white/30 hover:text-white/50 border border-transparent hover:border-white/[0.06]'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-auto p-4">
          {category !== 'All' && CATEGORY_META[category] && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-base">{CATEGORY_META[category].emoji}</span>
              <span className="text-[11px] text-white/40">{CATEGORY_META[category].desc}</span>
              <span className="text-[10px] text-white/20 ml-auto">{filtered.length} templates</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map(template => (
              <button
                key={template.id}
                onClick={() => { onSelectTemplate(template.prompt); onClose(); }}
                className="text-left p-3.5 rounded-xl border border-white/[0.06] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all group relative overflow-hidden"
              >
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-violet-500/0 group-hover:from-cyan-500/[0.02] group-hover:to-violet-500/[0.02] transition-all duration-300" />
                <div className="relative flex items-start gap-2.5">
                  <div className="h-10 w-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-white/80 group-hover:text-white/95">{template.name}</span>
                      <Sparkles className="h-2.5 w-2.5 text-cyan-400/0 group-hover:text-cyan-400/60 transition-colors" />
                    </div>
                    <p className="text-[10px] text-white/30 group-hover:text-white/45 mt-0.5 line-clamp-2">{template.description}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[8px] text-white/15 px-1.5 py-0.5 rounded-full border border-white/[0.04] group-hover:border-white/[0.08] transition-colors">{template.category}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
