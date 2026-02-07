import { useState, useCallback } from 'react';
import { X, Palette, Layers, Copy, Check, Plus, Paintbrush, Component, ChevronRight, Eye, Grid3X3, Type, Square, ToggleLeft, CreditCard, Layout, Table, MessageSquare, BarChart3 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ComponentTemplate {
  id: string;
  name: string;
  category: string;
  icon: any;
  preview: string;
  code: string;
  tags: string[];
}

interface ThemeColor {
  name: string;
  value: string;
  variable: string;
}

interface ComponentLibraryProps {
  open: boolean;
  onClose: () => void;
  onInsertComponent: (code: string, fileName?: string) => void;
  onApplyTheme: (colors: ThemeColor[]) => void;
}

const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'hero', name: 'Hero Section', category: 'Layout', icon: Layout,
    preview: 'Full-width hero with CTA',
    tags: ['hero', 'landing', 'cta'],
    code: `<section class="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white px-4">
  <div class="max-w-4xl mx-auto text-center space-y-6">
    <h1 class="text-5xl font-bold tracking-tight">Build Something Amazing</h1>
    <p class="text-lg text-white/70 max-w-2xl mx-auto">Create beautiful, responsive web applications with modern tools and frameworks.</p>
    <div class="flex items-center justify-center gap-4">
      <button class="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition">Get Started</button>
      <button class="px-6 py-3 border border-white/30 rounded-lg font-medium hover:bg-white/10 transition">Learn More</button>
    </div>
  </div>
</section>`,
  },
  {
    id: 'card', name: 'Feature Card', category: 'Components', icon: CreditCard,
    preview: 'Card with icon and description',
    tags: ['card', 'feature'],
    code: `<div class="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
  <div class="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
    <svg class="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  </div>
  <h3 class="text-lg font-semibold text-gray-900">Feature Title</h3>
  <p class="text-sm text-gray-500 mt-2">A brief description of the feature and its benefits for the user.</p>
</div>`,
  },
  {
    id: 'navbar', name: 'Navigation Bar', category: 'Layout', icon: Layout,
    preview: 'Responsive navbar with links',
    tags: ['nav', 'header', 'navigation'],
    code: `<nav class="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
  <div class="text-xl font-bold text-gray-900">Logo</div>
  <div class="flex items-center gap-6">
    <a href="#" class="text-sm text-gray-600 hover:text-gray-900 transition">Features</a>
    <a href="#" class="text-sm text-gray-600 hover:text-gray-900 transition">Pricing</a>
    <a href="#" class="text-sm text-gray-600 hover:text-gray-900 transition">About</a>
    <button class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition">Sign Up</button>
  </div>
</nav>`,
  },
  {
    id: 'pricing', name: 'Pricing Card', category: 'Components', icon: CreditCard,
    preview: 'Pricing tier with features list',
    tags: ['pricing', 'plan'],
    code: `<div class="p-8 rounded-2xl border-2 border-indigo-500 bg-white relative">
  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">Popular</div>
  <h3 class="text-lg font-bold text-gray-900">Pro Plan</h3>
  <div class="mt-4"><span class="text-4xl font-bold text-gray-900">$29</span><span class="text-gray-500">/month</span></div>
  <ul class="mt-6 space-y-3">
    <li class="flex items-center gap-2 text-sm text-gray-600"><svg class="h-4 w-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Unlimited projects</li>
    <li class="flex items-center gap-2 text-sm text-gray-600"><svg class="h-4 w-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Priority support</li>
    <li class="flex items-center gap-2 text-sm text-gray-600"><svg class="h-4 w-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Custom domains</li>
  </ul>
  <button class="w-full mt-8 px-4 py-3 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition">Get Started</button>
</div>`,
  },
  {
    id: 'form', name: 'Contact Form', category: 'Forms', icon: MessageSquare,
    preview: 'Form with validation styling',
    tags: ['form', 'contact', 'input'],
    code: `<form class="max-w-md mx-auto space-y-4 p-6">
  <div><label class="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" placeholder="Your name"></div>
  <div><label class="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" placeholder="you@example.com"></div>
  <div><label class="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea rows="4" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none" placeholder="Your message..."></textarea></div>
  <button type="submit" class="w-full px-4 py-3 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition">Send Message</button>
</form>`,
  },
  {
    id: 'stats', name: 'Stats Grid', category: 'Components', icon: BarChart3,
    preview: 'Number stats with labels',
    tags: ['stats', 'metrics', 'numbers'],
    code: `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
  <div class="text-center p-4 rounded-xl bg-gray-50"><div class="text-3xl font-bold text-gray-900">12K+</div><div class="text-sm text-gray-500 mt-1">Users</div></div>
  <div class="text-center p-4 rounded-xl bg-gray-50"><div class="text-3xl font-bold text-gray-900">98%</div><div class="text-sm text-gray-500 mt-1">Uptime</div></div>
  <div class="text-center p-4 rounded-xl bg-gray-50"><div class="text-3xl font-bold text-gray-900">150+</div><div class="text-sm text-gray-500 mt-1">Countries</div></div>
  <div class="text-center p-4 rounded-xl bg-gray-50"><div class="text-3xl font-bold text-gray-900">24/7</div><div class="text-sm text-gray-500 mt-1">Support</div></div>
</div>`,
  },
  {
    id: 'table', name: 'Data Table', category: 'Components', icon: Table,
    preview: 'Styled data table with header',
    tags: ['table', 'data', 'grid'],
    code: `<div class="overflow-x-auto rounded-xl border border-gray-200">
  <table class="w-full">
    <thead><tr class="bg-gray-50 border-b border-gray-200">
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
    </tr></thead>
    <tbody>
      <tr class="border-b border-gray-100 hover:bg-gray-50"><td class="px-4 py-3 text-sm">Alice Johnson</td><td class="px-4 py-3"><span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span></td><td class="px-4 py-3 text-sm text-gray-500">Admin</td></tr>
      <tr class="border-b border-gray-100 hover:bg-gray-50"><td class="px-4 py-3 text-sm">Bob Smith</td><td class="px-4 py-3"><span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span></td><td class="px-4 py-3 text-sm text-gray-500">Editor</td></tr>
    </tbody>
  </table>
</div>`,
  },
];

const CATEGORIES = ['All', 'Layout', 'Components', 'Forms'];

const THEME_PRESETS = [
  {
    name: 'Ocean', colors: [
      { name: 'Primary', value: '#0ea5e9', variable: '--primary' },
      { name: 'Secondary', value: '#6366f1', variable: '--secondary' },
      { name: 'Accent', value: '#06b6d4', variable: '--accent' },
    ],
  },
  {
    name: 'Forest', colors: [
      { name: 'Primary', value: '#22c55e', variable: '--primary' },
      { name: 'Secondary', value: '#059669', variable: '--secondary' },
      { name: 'Accent', value: '#84cc16', variable: '--accent' },
    ],
  },
  {
    name: 'Sunset', colors: [
      { name: 'Primary', value: '#f97316', variable: '--primary' },
      { name: 'Secondary', value: '#ef4444', variable: '--secondary' },
      { name: 'Accent', value: '#eab308', variable: '--accent' },
    ],
  },
  {
    name: 'Midnight', colors: [
      { name: 'Primary', value: '#8b5cf6', variable: '--primary' },
      { name: 'Secondary', value: '#6366f1', variable: '--secondary' },
      { name: 'Accent', value: '#a855f7', variable: '--accent' },
    ],
  },
];

type ActiveTab = 'components' | 'themes';

export function ComponentLibrary({ open, onClose, onInsertComponent, onApplyTheme }: ComponentLibraryProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('components');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = COMPONENT_TEMPLATES.filter(t => {
    if (category !== 'All' && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.tags.some(tag => tag.includes(search.toLowerCase()))) return false;
    return true;
  });

  const handleCopy = useCallback((template: ComponentTemplate) => {
    navigator.clipboard.writeText(template.code);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success(`Copied ${template.name}`);
  }, []);

  if (!open) return null;

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Component className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-medium text-white/80">Component Library</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.04] shrink-0">
        <button
          onClick={() => setActiveTab('components')}
          className={cn(
            "flex items-center gap-1 h-6 px-2.5 rounded text-[10px] font-medium transition-colors",
            activeTab === 'components' ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/55"
          )}
        >
          <Layers className="h-3 w-3" /> Components
        </button>
        <button
          onClick={() => setActiveTab('themes')}
          className={cn(
            "flex items-center gap-1 h-6 px-2.5 rounded text-[10px] font-medium transition-colors",
            activeTab === 'themes' ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/55"
          )}
        >
          <Paintbrush className="h-3 w-3" /> Themes
        </button>
      </div>

      {activeTab === 'components' ? (
        <>
          {/* Search + Filter */}
          <div className="px-2 py-1.5 space-y-1.5 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search components..."
                className="flex-1 bg-transparent text-[11px] text-white/70 placeholder:text-white/20 outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "h-5 px-2 rounded text-[9px] transition-colors",
                    category === cat ? "bg-violet-500/15 text-violet-400" : "text-white/25 hover:text-white/50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Component list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {filtered.map(template => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    className="rounded-lg border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                  >
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <div className="h-7 w-7 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white/70">{template.name}</p>
                        <p className="text-[9px] text-white/25">{template.preview}</p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
                          className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/10"
                          title="Preview"
                        >
                          <Eye className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(template)}
                          className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/10"
                          title="Copy"
                        >
                          {copiedId === template.id ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
                        </button>
                        <button
                          onClick={() => { onInsertComponent(template.code); toast.success(`Inserted ${template.name}`); }}
                          className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-cyan-400 hover:bg-cyan-500/10"
                          title="Insert into file"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* Code preview */}
                    {previewId === template.id && (
                      <div className="px-2 pb-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <pre className="px-2.5 py-2 bg-black/30 border border-white/[0.06] rounded-md overflow-x-auto max-h-32">
                          <code className="text-[9px] font-mono text-white/40 leading-3.5">{template.code.slice(0, 300)}{template.code.length > 300 ? '...' : ''}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </>
      ) : (
        /* Themes tab */
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Theme Presets</p>
            {THEME_PRESETS.map(preset => (
              <div key={preset.name} className="rounded-lg border border-white/[0.06] p-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-medium text-white/70">{preset.name}</span>
                  <button
                    onClick={() => { onApplyTheme(preset.colors); toast.success(`Applied ${preset.name} theme`); }}
                    className="px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-medium hover:bg-violet-500/20 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {preset.colors.map(color => (
                    <div key={color.variable} className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-md border border-white/10" style={{ backgroundColor: color.value }} />
                      <div>
                        <p className="text-[9px] text-white/40">{color.name}</p>
                        <p className="text-[8px] text-white/20 font-mono">{color.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-white/[0.04]">
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-2">Custom Colors</p>
              <p className="text-[9px] text-white/20">Use the AI chat to generate a custom theme: "Create a dark theme with blue accents"</p>
            </div>
          </div>
        </ScrollArea>
      )}

      {/* Footer stats */}
      <div className="px-3 py-1.5 border-t border-white/[0.06] text-[9px] text-white/20 shrink-0">
        {COMPONENT_TEMPLATES.length} components · {THEME_PRESETS.length} themes
      </div>
    </div>
  );
}
