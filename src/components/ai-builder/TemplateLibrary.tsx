import { useState } from 'react';
import { X, Search, LayoutGrid, Sparkles, Eye, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  prompt: string;
  thumbnail: string; // CSS gradient as visual thumbnail
  tags: string[];
}

const TEMPLATES: Template[] = [
  // Landing Pages
  { id: 'saas-landing', name: 'SaaS Landing', description: 'Hero, features, pricing, testimonials, CTA', icon: '🚀', category: 'Landing', tags: ['marketing', 'startup'], thumbnail: 'from-violet-600 via-indigo-600 to-cyan-600', prompt: 'Build a modern SaaS landing page with: a bold hero section with gradient background, animated headline, and CTA button. Features grid with icons. Pricing table with 3 tiers. Testimonial carousel. Footer with newsletter signup. Dark theme with accent colors.' },
  { id: 'portfolio', name: 'Portfolio', description: 'Personal portfolio with projects showcase', icon: '🎨', category: 'Landing', tags: ['personal', 'creative'], thumbnail: 'from-rose-500 via-pink-600 to-purple-700', prompt: 'Build a personal portfolio website with: a minimal hero with name and role. Project showcase grid with hover effects and project detail modals. Skills section with animated progress bars. Contact form. Smooth scroll navigation. Modern dark design.' },
  { id: 'startup-launch', name: 'Startup Launch', description: 'Coming soon page with email capture', icon: '⚡', category: 'Landing', tags: ['marketing', 'waitlist'], thumbnail: 'from-amber-500 via-orange-600 to-red-600', prompt: 'Build a startup launch/coming soon page with: dramatic full-screen animated background. Large countdown timer. Email waitlist capture form with validation. Social proof counter. Product teaser section. Minimalist, high-impact design.' },
  { id: 'agency', name: 'Agency Site', description: 'Services, case studies, team, contact', icon: '🏢', category: 'Landing', tags: ['business', 'agency'], thumbnail: 'from-slate-600 via-zinc-700 to-neutral-800', prompt: 'Build a digital agency landing page with: bold hero with animated text. Services grid with hover animations. Case studies section with image cards. Team member grid with social links. Testimonials slider. Contact form with validation. Dark premium design.' },
  { id: 'product-launch', name: 'Product Launch', description: 'Feature showcase with 3D feel', icon: '✨', category: 'Landing', tags: ['product', 'marketing'], thumbnail: 'from-emerald-500 via-teal-600 to-cyan-700', prompt: 'Build a product launch page with: immersive hero with product mockup. Feature spotlight sections with alternating layouts. Comparison table vs competitors. Social proof section. Early access signup form. Animated scroll reveals. Premium dark design.' },

  // Dashboards
  { id: 'analytics-dash', name: 'Analytics Dashboard', description: 'Charts, KPIs, data tables', icon: '📊', category: 'Dashboard', tags: ['data', 'analytics'], thumbnail: 'from-blue-600 via-indigo-700 to-violet-800', prompt: 'Build an analytics dashboard with: top KPI cards (revenue, users, conversion, growth) with sparkline trends. Main area chart showing revenue over time. Sidebar with navigation. Data table with sortable columns, search, and pagination. Activity feed. Dark theme with cyan accents.' },
  { id: 'project-mgmt', name: 'Project Board', description: 'Kanban board with drag indicators', icon: '📋', category: 'Dashboard', tags: ['productivity', 'kanban'], thumbnail: 'from-cyan-600 via-sky-700 to-blue-800', prompt: 'Build a project management kanban board with: columns for Backlog, In Progress, Review, Done. Cards with title, assignee avatar, priority badge, and due date. Add task modal with form. Column headers with count badges. Smooth card transitions. Professional dark UI.' },
  { id: 'crm-dash', name: 'CRM Dashboard', description: 'Contacts, deals pipeline, activity', icon: '👥', category: 'Dashboard', tags: ['sales', 'crm'], thumbnail: 'from-green-600 via-emerald-700 to-teal-800', prompt: 'Build a CRM dashboard with: deals pipeline view with stages (Lead, Qualified, Proposal, Closed). Contact list with avatar, company, and status. Revenue chart. Recent activity timeline. Quick-add contact modal. Filters and search. Corporate dark theme.' },
  { id: 'admin-panel', name: 'Admin Panel', description: 'Users, settings, content management', icon: '⚙️', category: 'Dashboard', tags: ['admin', 'cms'], thumbnail: 'from-gray-600 via-slate-700 to-zinc-800', prompt: 'Build an admin panel with: sidebar navigation with sections (Dashboard, Users, Content, Settings, Logs). Users table with role badges, search, and bulk actions. Content editor area. System health cards. Settings form with toggle switches. Dark admin theme.' },

  // E-Commerce
  { id: 'ecommerce', name: 'E-commerce Store', description: 'Product grid, cart, checkout flow', icon: '🛒', category: 'E-Commerce', tags: ['shop', 'retail'], thumbnail: 'from-pink-600 via-rose-700 to-red-800', prompt: 'Build an e-commerce storefront with: navigation with cart icon and count. Product grid with images, prices, and add-to-cart buttons. Product quick-view modal. Shopping cart sidebar drawer. Filter sidebar (category, price range). Search bar. Responsive grid. Dark premium retail theme.' },
  { id: 'product-page', name: 'Product Page', description: 'Gallery, variants, reviews, related', icon: '📦', category: 'E-Commerce', tags: ['product', 'detail'], thumbnail: 'from-amber-600 via-yellow-700 to-orange-800', prompt: 'Build a product detail page with: image gallery with thumbnail navigation. Product title, price, and description. Size/color variant selectors. Quantity picker. Add to cart button. Reviews section with star ratings. Related products carousel. Dark luxury theme.' },

  // Apps
  { id: 'chat-app', name: 'Chat Interface', description: 'Real-time chat with message bubbles', icon: '💬', category: 'App', tags: ['messaging', 'social'], thumbnail: 'from-violet-600 via-purple-700 to-fuchsia-800', prompt: 'Build a chat application interface with: sidebar showing conversations list with avatars and last message preview. Main chat area with message bubbles (sent/received styling). Message input with emoji picker trigger and send button. Typing indicator animation. Online status dots. Search conversations. Dark messenger-style theme.' },
  { id: 'social-feed', name: 'Social Feed', description: 'Posts, likes, comments, stories', icon: '📱', category: 'App', tags: ['social', 'feed'], thumbnail: 'from-fuchsia-600 via-pink-700 to-rose-800', prompt: 'Build a social media feed with: stories bar at top with circular avatars. Post cards with author info, image, like/comment/share buttons, and comment section. Create post modal with text and image upload. Trending sidebar. Notification bell with dropdown. Dark social media theme.' },
  { id: 'email-client', name: 'Email Client', description: 'Inbox, compose, folders, labels', icon: '📧', category: 'App', tags: ['email', 'productivity'], thumbnail: 'from-sky-600 via-blue-700 to-indigo-800', prompt: 'Build an email client interface with: sidebar with folders (Inbox, Sent, Drafts, Trash) and label filters. Email list with sender, subject, preview, and time. Email detail view with thread. Compose modal with rich text editor, CC/BCC, attachments. Search bar. Unread badge counts. Dark Gmail-inspired theme.' },
  { id: 'music-player', name: 'Music Player', description: 'Playlists, now playing, controls', icon: '🎵', category: 'App', tags: ['music', 'media'], thumbnail: 'from-green-600 via-emerald-700 to-teal-800', prompt: 'Build a music player interface with: sidebar with playlists and library. Now playing bar at bottom with album art, progress bar, and controls. Main content showing playlist tracks with duration. Album art background blur effect. Volume slider. Queue sidebar. Dark Spotify-inspired theme.' },

  // Tools
  { id: 'multi-step-form', name: 'Multi-Step Form', description: 'Wizard form with validation', icon: '📝', category: 'Tool', tags: ['form', 'wizard'], thumbnail: 'from-teal-600 via-cyan-700 to-sky-800', prompt: 'Build a multi-step form wizard with: progress stepper showing current step. Step 1: Personal info (name, email, phone). Step 2: Preferences (checkboxes, radio buttons, select). Step 3: Review and submit. Smooth step transitions. Field validation with error messages. Success state with confetti animation. Clean dark form design.' },
  { id: 'file-manager', name: 'File Manager', description: 'Grid/list view, breadcrumbs, upload', icon: '📁', category: 'Tool', tags: ['files', 'storage'], thumbnail: 'from-indigo-600 via-blue-700 to-cyan-800', prompt: 'Build a file manager interface with: breadcrumb navigation. Toggle between grid and list views. File/folder cards with icons, names, sizes, dates. Right-click context menu. Upload dropzone with drag-and-drop. Storage usage bar. New folder modal. Search and filter. Dark OS-style theme.' },
  { id: 'calendar-app', name: 'Calendar App', description: 'Month/week/day views, events', icon: '📅', category: 'Tool', tags: ['calendar', 'scheduling'], thumbnail: 'from-red-600 via-orange-700 to-amber-800', prompt: 'Build a calendar application with: month view grid with event dots. Week view with time slots. Day view with hourly schedule. Create event modal with date/time picker, title, color selection. Today button. Navigation arrows for months. Mini calendar in sidebar. Dark productivity theme.' },
  { id: 'note-taking', name: 'Note Taking', description: 'Rich editor, folders, tags', icon: '📓', category: 'Tool', tags: ['notes', 'writing'], thumbnail: 'from-yellow-600 via-amber-700 to-orange-800', prompt: 'Build a note-taking app with: sidebar with folders and recent notes. Rich text editor with formatting toolbar (bold, italic, headings, lists, code blocks). Tags with colored pills. Search across all notes. Markdown preview toggle. Dark Notion-inspired theme.' },

  // Mobile
  { id: 'mobile-banking', name: 'Banking App', description: 'Balance, transactions, transfers', icon: '🏦', category: 'Mobile', tags: ['finance', 'banking'], thumbnail: 'from-emerald-600 via-green-700 to-lime-800', prompt: 'Build a mobile banking app interface (mobile-first, max-width 390px centered) with: card balance display with gradient card mockup. Quick actions (Send, Request, Pay). Recent transactions list with categories and icons. Spending chart. Bottom navigation bar. Touch-friendly dark fintech design.' },
  { id: 'fitness-tracker', name: 'Fitness Tracker', description: 'Workouts, progress, goals', icon: '💪', category: 'Mobile', tags: ['health', 'fitness'], thumbnail: 'from-orange-600 via-red-700 to-pink-800', prompt: 'Build a fitness tracker app interface (mobile-first, max-width 390px centered) with: daily activity rings (steps, calories, active minutes). Workout history list. Heart rate chart. Goal progress bars. Start workout button with timer. Weekly summary. Bottom tab navigation. Dark athletic theme.' },
];

const CATEGORIES = ['All', 'Landing', 'Dashboard', 'E-Commerce', 'App', 'Tool', 'Mobile'] as const;

const CATEGORY_META: Record<string, { emoji: string; desc: string }> = {
  All: { emoji: '✨', desc: 'All templates' },
  Landing: { emoji: '🌐', desc: 'Marketing & landing pages' },
  Dashboard: { emoji: '📊', desc: 'Analytics & management' },
  'E-Commerce': { emoji: '🛒', desc: 'Online stores' },
  App: { emoji: '📱', desc: 'Full applications' },
  Tool: { emoji: '🛠️', desc: 'Utilities & tools' },
  Mobile: { emoji: '📲', desc: 'Mobile-first designs' },
};

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (prompt: string) => void;
}

export function TemplateLibrary({ isOpen, onClose, onSelectTemplate }: TemplateLibraryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = TEMPLATES.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.includes(search.toLowerCase()));
    const matchesCategory = category === 'All' || t.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0d0d18] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-white/[0.06]">
              <LayoutGrid className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Template Gallery</h2>
              <p className="text-[10px] text-white/30">{TEMPLATES.length} curated templates</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-5 py-3 border-b border-white/[0.06] space-y-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, description, or tag..."
              className="w-full h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg pl-8 pr-3 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-cyan-500/30"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full transition-colors font-medium whitespace-nowrap shrink-0",
                  category === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-white/30 hover:text-white/50 border border-transparent hover:border-white/[0.06]'
                )}
              >
                {CATEGORY_META[cat]?.emoji} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-auto p-4">
          {category !== 'All' && CATEGORY_META[category] && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-[11px] text-white/40">{CATEGORY_META[category].desc}</span>
              <span className="text-[10px] text-white/20 ml-auto">{filtered.length} templates</span>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map(template => (
              <button
                key={template.id}
                onClick={() => { onSelectTemplate(template.prompt); onClose(); }}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="text-left rounded-xl border border-white/[0.06] hover:border-cyan-500/20 transition-all group relative overflow-hidden"
              >
                {/* Thumbnail */}
                <div className={cn(
                  "h-24 w-full bg-gradient-to-br relative overflow-hidden transition-transform duration-500",
                  template.thumbnail,
                  hoveredId === template.id && "scale-105"
                )}>
                  {/* Simulated UI lines */}
                  <div className="absolute inset-3 opacity-20">
                    <div className="h-2 w-12 bg-white/40 rounded mb-1.5" />
                    <div className="h-1 w-20 bg-white/20 rounded mb-3" />
                    <div className="flex gap-1">
                      <div className="h-6 w-6 bg-white/10 rounded" />
                      <div className="h-6 w-6 bg-white/10 rounded" />
                      <div className="h-6 w-6 bg-white/10 rounded" />
                    </div>
                  </div>
                  {/* Icon overlay */}
                  <div className="absolute bottom-2 right-2 h-8 w-8 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center text-base">
                    {template.icon}
                  </div>
                  {/* Hover overlay */}
                  <div className={cn(
                    "absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200",
                    hoveredId === template.id ? "opacity-100" : "opacity-0"
                  )}>
                    <div className="flex items-center gap-1.5 text-xs text-white font-medium">
                      <ArrowRight className="h-3.5 w-3.5" />
                      Use Template
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white/80 group-hover:text-white/95 truncate">{template.name}</span>
                  </div>
                  <p className="text-[10px] text-white/30 group-hover:text-white/45 mt-0.5 line-clamp-1">{template.description}</p>
                  <div className="flex gap-1 mt-1.5">
                    {template.tags.map(tag => (
                      <span key={tag} className="text-[8px] text-white/15 px-1.5 py-0.5 rounded-full border border-white/[0.04] group-hover:border-white/[0.08] transition-colors">{tag}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xs text-white/30">No templates match your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
