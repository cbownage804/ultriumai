/**
 * BuilderHelpCenter — Searchable in-app documentation and help panel
 * Features tutorials, keyboard shortcuts, and feature explanations
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Keyboard, BookOpen, Lightbulb, Zap, ChevronRight,
  Code2, Eye, Wand2, MessageCircle, GitBranch, Database, Shield,
  Layers, Terminal, Globe, Package, Image, Variable, Bug, Brain,
  Rocket, Users, Settings, FolderOpen, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'features' | 'shortcuts' | 'tips';
  icon: typeof BookOpen;
  content: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'start-building',
    title: 'Start Building Your App',
    description: 'Describe what you want and watch it come to life',
    category: 'getting-started',
    icon: Wand2,
    content: '**How to build:** Type a description of the app you want in the chat input (e.g., "A landing page with a hero section, pricing cards, and a contact form"). The AI will generate all the code and show a live preview.\n\n**Tips:**\n- Be specific about layout and features\n- Mention colors, fonts, or style preferences\n- Start simple, then iterate with follow-up messages',
  },
  {
    id: 'chat-vs-build',
    title: 'Chat vs Build Mode',
    description: 'When to discuss and when to generate',
    category: 'getting-started',
    icon: MessageCircle,
    content: '**Chat mode** — Ask questions, discuss architecture, plan features. No code is generated.\n\n**Build mode** — The AI generates code using an agent workflow: it plans, executes, and verifies each step.\n\nUse Chat when you want advice. Use Build when you want code.',
  },
  {
    id: 'preview-panel',
    title: 'Live Preview',
    description: 'Interact with your app in real-time',
    category: 'features',
    icon: Eye,
    content: '**Live Preview** renders your app instantly as code is generated.\n\n- **Address bar** shows the current page route\n- **Responsive mode** toggles between desktop, tablet, and mobile viewports\n- **Visual Edit** lets you click elements to modify them directly\n- **Zoom controls** help you inspect details\n- **Auto-fix** banner appears when errors are detected — click to let AI fix them',
  },
  {
    id: 'code-editor',
    title: 'Code Editor',
    description: 'Edit code directly with Monaco editor',
    category: 'features',
    icon: Code2,
    content: '**Monaco Editor** provides a VS Code-like experience:\n\n- Syntax highlighting for HTML, CSS, JS, TS, JSON\n- AI autocomplete suggests code as you type (Tab to accept)\n- Inline AI actions: select code, then Explain / Refactor / Fix / Test\n- Multi-file tabs with drag to reorder\n- File breadcrumb navigation\n- Split view to see code and preview side by side',
  },
  {
    id: 'file-management',
    title: 'File Tree & Management',
    description: 'Create, rename, and organize your project files',
    category: 'features',
    icon: FolderOpen,
    content: '**File tree** on the left shows all project files.\n\n- Right-click for context menu (rename, delete)\n- Click the + icon to create new files\n- Files auto-detect language from extension\n- Dirty (unsaved) files show a dot indicator',
  },
  {
    id: 'version-control',
    title: 'Version History & Branching',
    description: 'Undo, branch, and restore previous versions',
    category: 'features',
    icon: GitBranch,
    content: '**Undo/Redo** (⌘Z / ⌘⇧Z) works across all changes.\n\n**Version history** saves snapshots before each AI generation. Click any version to restore.\n\n**Branches** let you experiment without affecting the main code. Create, switch, and merge branches from the top bar.\n\n**Version timeline** (bottom icon bar) provides a visual slider through your project history.',
  },
  {
    id: 'integrations',
    title: 'Database, Auth & Storage',
    description: 'Connect Supabase for backend features',
    category: 'features',
    icon: Database,
    content: '**Supabase integration** adds:\n\n- **Database** — Visual table explorer and SQL queries\n- **Authentication** — Generate login/signup pages with OAuth providers\n- **Storage** — Upload and manage files\n- **Edge Functions** — Serverless backend logic\n\nConnect via Settings → Integrations → Supabase.',
  },
  {
    id: 'export-deploy',
    title: 'Export & Deploy',
    description: 'Take your project to production',
    category: 'features',
    icon: Rocket,
    content: '**Export options:**\n\n- **Full-Stack Export** — Complete React+Vite project with .env, Supabase config, and setup guide\n- **Docker Export** — Includes Dockerfile and nginx config\n- **ZIP Download** — Raw project files\n\n**Deploy Pipeline** — One-click deploy with build stages, SSL, and custom domain support.\n\n**Quick actions** in chat: Ask for "🚀 Deployment guide" for step-by-step instructions.',
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    description: 'Share projects and work together',
    category: 'features',
    icon: Users,
    content: '**Share** your project with teammates:\n\n- Invite by email with role (Viewer/Editor/Admin)\n- See collaborator avatars in the top bar\n- **Live cursors** show other users\' positions in real-time\n- **Presence indicators** show who is online',
  },
  {
    id: 'tips-performance',
    title: 'Performance Tips',
    description: 'Get the best results from the AI',
    category: 'tips',
    icon: Lightbulb,
    content: '**Best practices:**\n\n1. **Start simple** — Build the basic structure first, then add complexity\n2. **Be specific** — "Add a pricing section with 3 tiers" > "Make it better"\n3. **Iterate** — Use follow-up messages to refine\n4. **Use references** — Upload screenshots or describe existing apps you like\n5. **Use quick actions** — The suggestion chips below AI responses save time\n6. **Switch models** — Use Flash for speed, Pro for quality, GPT-5 for complex tasks',
  },
  {
    id: 'tips-debugging',
    title: 'Debugging Issues',
    description: 'Fix errors and unexpected behavior',
    category: 'tips',
    icon: Bug,
    content: '**When something breaks:**\n\n1. **Auto-fix** — Click the red banner in the preview to let AI fix errors\n2. **Console** — Open the console panel to see logs and errors\n3. **Describe the issue** — Tell the AI what\'s wrong in chat\n4. **Security review** — Use the 🔒 quick action to check for vulnerabilities\n5. **Revert** — Use version history to go back to a working state',
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: '⌘K', description: 'Command Palette' },
  { keys: '⌘P', description: 'Quick File Switcher' },
  { keys: '⌘S', description: 'Save Project' },
  { keys: '⌘Z', description: 'Undo' },
  { keys: '⌘⇧Z', description: 'Redo' },
  { keys: '⌘⇧F', description: 'Search in Files' },
  { keys: '⌘/', description: 'Keyboard Shortcuts' },
  { keys: 'Tab', description: 'Accept AI Autocomplete' },
  { keys: 'Esc', description: 'Close Panel / Cancel' },
];

const CATEGORIES = [
  { id: 'all' as const, label: 'All', icon: BookOpen },
  { id: 'getting-started' as const, label: 'Get Started', icon: Zap },
  { id: 'features' as const, label: 'Features', icon: Layers },
  { id: 'shortcuts' as const, label: 'Shortcuts', icon: Keyboard },
  { id: 'tips' as const, label: 'Tips', icon: Lightbulb },
];

interface BuilderHelpCenterProps {
  open: boolean;
  onClose: () => void;
}

export function BuilderHelpCenter({ open, onClose }: BuilderHelpCenterProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | HelpArticle['category']>('all');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let articles = HELP_ARTICLES;
    if (category !== 'all') articles = articles.filter(a => a.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
      );
    }
    return articles;
  }, [search, category]);

  if (!open) return null;

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-white/70">Help Center</span>
        </div>
        <button onClick={onClose} className="h-6 w-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-2.5 h-7 border border-white/[0.06]">
          <Search className="h-3 w-3 text-white/20 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help..."
            className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/20 outline-none"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-white/[0.04] overflow-x-auto scrollbar-none shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "shrink-0 text-[10px] px-2 py-1 rounded-md transition-all font-medium",
              category === cat.id
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-white/30 hover:text-white/50 hover:bg-white/[0.03] border border-transparent"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {/* Keyboard shortcuts section */}
          {(category === 'all' || category === 'shortcuts') && !search && (
            <div className="mb-3">
              <div className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                <Keyboard className="h-3 w-3" />
                Keyboard Shortcuts
              </div>
              <div className="space-y-1 bg-white/[0.02] rounded-lg border border-white/[0.04] p-2">
                {KEYBOARD_SHORTCUTS.map(s => (
                  <div key={s.keys} className="flex items-center justify-between py-0.5">
                    <span className="text-[11px] text-white/50">{s.description}</span>
                    <kbd className="text-[10px] font-mono text-cyan-400/70 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articles */}
          {filtered.map(article => {
            const Icon = article.icon;
            const isExpanded = expandedArticle === article.id;
            return (
              <motion.div
                key={article.id}
                layout
                className="rounded-lg border border-white/[0.04] bg-white/[0.01] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-white/[0.02] transition-colors flex items-start gap-2.5"
                >
                  <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center shrink-0 border border-white/[0.04]">
                    <Icon className="h-3.5 w-3.5 text-cyan-400/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-white/80">{article.title}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{article.description}</div>
                  </div>
                  <ChevronRight className={cn("h-3 w-3 text-white/20 shrink-0 mt-1 transition-transform", isExpanded && "rotate-90")} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 text-[11px] text-white/50 leading-relaxed whitespace-pre-wrap border-t border-white/[0.04] pt-2">
                        {article.content.split('\n').map((line, i) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <div key={i} className="font-semibold text-white/70 mt-2 mb-1">{line.replace(/\*\*/g, '')}</div>;
                          }
                          if (line.startsWith('- ')) {
                            return <div key={i} className="pl-2 flex gap-1.5"><span className="text-cyan-400/50 shrink-0">•</span><span>{line.slice(2)}</span></div>;
                          }
                          if (line.match(/^\d+\./)) {
                            return <div key={i} className="pl-2">{line}</div>;
                          }
                          return <div key={i}>{line}</div>;
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/30">No articles match "{search}"</p>
              <button onClick={() => { setSearch(''); setCategory('all'); }} className="text-[10px] text-cyan-400/60 hover:text-cyan-400 mt-1">Clear filters</button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
