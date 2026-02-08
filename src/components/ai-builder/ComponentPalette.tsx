import { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Layout, Type, Square, Image, List, Table, FormInput,
  ToggleLeft, Sliders, Navigation, ChevronDown, ChevronRight,
  GripVertical, X, Search, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ComponentTemplate {
  id: string;
  name: string;
  category: string;
  icon: typeof Layout;
  preview: string;
  code: string;
}

interface ComponentPaletteProps {
  open: boolean;
  onClose: () => void;
  onInsertComponent: (code: string, fileName?: string) => void;
}

const COMPONENTS: ComponentTemplate[] = [
  // Layout
  { id: 'hero', name: 'Hero Section', category: 'Layout', icon: Layout, preview: 'Full-width hero with heading, subtitle, and CTA',
    code: `<section class="relative py-24 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">\n  <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(56,189,248,0.08),transparent_50%)]"></div>\n  <div class="max-w-4xl mx-auto text-center relative z-10">\n    <h1 class="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">Build Something Amazing</h1>\n    <p class="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">Create beautiful, responsive web applications with the power of AI-assisted development.</p>\n    <div class="flex items-center gap-4 justify-center">\n      <a href="#" class="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-cyan-500/20">Get Started</a>\n      <a href="#" class="px-8 py-3 border border-white/10 text-white/70 hover:text-white hover:border-white/20 rounded-xl transition-colors">Learn More</a>\n    </div>\n  </div>\n</section>` },
  { id: 'features-grid', name: 'Features Grid', category: 'Layout', icon: Layout, preview: '3-column feature cards',
    code: `<section class="py-20 px-6 bg-white">\n  <div class="max-w-6xl mx-auto">\n    <h2 class="text-3xl font-bold text-center text-slate-900 mb-12">Features</h2>\n    <div class="grid md:grid-cols-3 gap-8">\n      <div class="p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">\n        <div class="h-12 w-12 bg-cyan-50 rounded-xl flex items-center justify-center mb-4"><span class="text-2xl">⚡</span></div>\n        <h3 class="font-semibold text-slate-900 mb-2">Lightning Fast</h3>\n        <p class="text-sm text-slate-500">Optimized for speed and performance out of the box.</p>\n      </div>\n      <div class="p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">\n        <div class="h-12 w-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4"><span class="text-2xl">🎨</span></div>\n        <h3 class="font-semibold text-slate-900 mb-2">Beautiful Design</h3>\n        <p class="text-sm text-slate-500">Pixel-perfect components crafted with attention to detail.</p>\n      </div>\n      <div class="p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">\n        <div class="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4"><span class="text-2xl">🔒</span></div>\n        <h3 class="font-semibold text-slate-900 mb-2">Secure by Default</h3>\n        <p class="text-sm text-slate-500">Enterprise-grade security built into every layer.</p>\n      </div>\n    </div>\n  </div>\n</section>` },
  // Typography
  { id: 'pricing-table', name: 'Pricing Table', category: 'Content', icon: Table, preview: '3-tier pricing comparison',
    code: `<section class="py-20 px-6 bg-slate-50">\n  <div class="max-w-5xl mx-auto">\n    <h2 class="text-3xl font-bold text-center text-slate-900 mb-12">Simple Pricing</h2>\n    <div class="grid md:grid-cols-3 gap-6">\n      <div class="bg-white rounded-2xl border border-slate-200 p-8">\n        <h3 class="text-lg font-semibold text-slate-900">Starter</h3>\n        <div class="mt-4 mb-6"><span class="text-4xl font-bold text-slate-900">$9</span><span class="text-slate-500">/mo</span></div>\n        <ul class="space-y-3 text-sm text-slate-600 mb-8">\n          <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> 5 projects</li>\n          <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Basic analytics</li>\n          <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Email support</li>\n        </ul>\n        <button class="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Get Started</button>\n      </div>\n      <div class="bg-slate-900 rounded-2xl p-8 text-white shadow-xl shadow-slate-900/20 ring-2 ring-cyan-400/30">\n        <h3 class="text-lg font-semibold">Pro</h3>\n        <div class="mt-4 mb-6"><span class="text-4xl font-bold">$29</span><span class="text-slate-400">/mo</span></div>\n        <ul class="space-y-3 text-sm text-slate-300 mb-8">\n          <li class="flex items-center gap-2"><span class="text-cyan-400">✓</span> Unlimited projects</li>\n          <li class="flex items-center gap-2"><span class="text-cyan-400">✓</span> Advanced analytics</li>\n          <li class="flex items-center gap-2"><span class="text-cyan-400">✓</span> Priority support</li>\n        </ul>\n        <button class="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-sm font-semibold transition">Get Started</button>\n      </div>\n      <div class="bg-white rounded-2xl border border-slate-200 p-8">\n        <h3 class="text-lg font-semibold text-slate-900">Enterprise</h3>\n        <div class="mt-4 mb-6"><span class="text-4xl font-bold text-slate-900">$99</span><span class="text-slate-500">/mo</span></div>\n        <ul class="space-y-3 text-sm text-slate-600 mb-8">\n          <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Everything in Pro</li>\n          <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> SSO & SAML</li>\n          <li class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Dedicated support</li>\n        </ul>\n        <button class="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Contact Sales</button>\n      </div>\n    </div>\n  </div>\n</section>` },
  // Forms
  { id: 'contact-form', name: 'Contact Form', category: 'Forms', icon: FormInput, preview: 'Name, email, message form with validation',
    code: `<section class="py-20 px-6 bg-white">\n  <div class="max-w-lg mx-auto">\n    <h2 class="text-2xl font-bold text-slate-900 mb-2">Get in Touch</h2>\n    <p class="text-slate-500 mb-8">We'd love to hear from you. Fill out the form below.</p>\n    <form class="space-y-5" onsubmit="event.preventDefault(); alert('Form submitted!')">\n      <div class="grid grid-cols-2 gap-4">\n        <div><label class="text-sm font-medium text-slate-700 mb-1 block">First Name</label><input type="text" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" placeholder="John"></div>\n        <div><label class="text-sm font-medium text-slate-700 mb-1 block">Last Name</label><input type="text" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" placeholder="Doe"></div>\n      </div>\n      <div><label class="text-sm font-medium text-slate-700 mb-1 block">Email</label><input type="email" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" placeholder="john@example.com"></div>\n      <div><label class="text-sm font-medium text-slate-700 mb-1 block">Message</label><textarea rows="4" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none resize-none" placeholder="Your message..."></textarea></div>\n      <button type="submit" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors">Send Message</button>\n    </form>\n  </div>\n</section>` },
  // Navigation
  { id: 'navbar', name: 'Navigation Bar', category: 'Navigation', icon: Navigation, preview: 'Responsive navbar with logo and links',
    code: `<nav class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">\n  <a href="#" class="text-xl font-bold text-slate-900">Brand</a>\n  <div class="hidden md:flex items-center gap-8">\n    <a href="#" class="text-sm text-slate-600 hover:text-slate-900 transition">Features</a>\n    <a href="#" class="text-sm text-slate-600 hover:text-slate-900 transition">Pricing</a>\n    <a href="#" class="text-sm text-slate-600 hover:text-slate-900 transition">About</a>\n    <a href="#" class="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition">Sign Up</a>\n  </div>\n</nav>` },
  // Media
  { id: 'testimonials', name: 'Testimonials', category: 'Content', icon: Type, preview: 'Customer testimonials carousel-style',
    code: `<section class="py-20 px-6 bg-slate-50">\n  <div class="max-w-4xl mx-auto">\n    <h2 class="text-3xl font-bold text-center text-slate-900 mb-12">What People Say</h2>\n    <div class="grid md:grid-cols-2 gap-6">\n      <div class="bg-white rounded-2xl p-6 border border-slate-200">\n        <p class="text-slate-600 text-sm mb-4">"This is the best tool I've ever used. It completely transformed how we build products."</p>\n        <div class="flex items-center gap-3">\n          <div class="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">AK</div>\n          <div><div class="text-sm font-semibold text-slate-900">Alex Kim</div><div class="text-xs text-slate-500">CEO, TechCorp</div></div>\n        </div>\n      </div>\n      <div class="bg-white rounded-2xl p-6 border border-slate-200">\n        <p class="text-slate-600 text-sm mb-4">"Incredible speed and quality. We shipped our MVP in under a week."</p>\n        <div class="flex items-center gap-3">\n          <div class="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">SR</div>\n          <div><div class="text-sm font-semibold text-slate-900">Sarah Reyes</div><div class="text-xs text-slate-500">Founder, StartupXYZ</div></div>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>` },
  // Footer
  { id: 'footer', name: 'Footer', category: 'Navigation', icon: Layout, preview: 'Multi-column footer with links',
    code: `<footer class="bg-slate-900 text-white py-16 px-6">\n  <div class="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">\n    <div><h3 class="font-bold text-lg mb-4">Brand</h3><p class="text-sm text-slate-400">Building the future of web development.</p></div>\n    <div><h4 class="font-semibold text-sm mb-3 text-slate-300">Product</h4><ul class="space-y-2 text-sm text-slate-400"><li><a href="#" class="hover:text-white transition">Features</a></li><li><a href="#" class="hover:text-white transition">Pricing</a></li><li><a href="#" class="hover:text-white transition">Docs</a></li></ul></div>\n    <div><h4 class="font-semibold text-sm mb-3 text-slate-300">Company</h4><ul class="space-y-2 text-sm text-slate-400"><li><a href="#" class="hover:text-white transition">About</a></li><li><a href="#" class="hover:text-white transition">Blog</a></li><li><a href="#" class="hover:text-white transition">Careers</a></li></ul></div>\n    <div><h4 class="font-semibold text-sm mb-3 text-slate-300">Legal</h4><ul class="space-y-2 text-sm text-slate-400"><li><a href="#" class="hover:text-white transition">Privacy</a></li><li><a href="#" class="hover:text-white transition">Terms</a></li></ul></div>\n  </div>\n  <div class="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500">© 2026 Brand. All rights reserved.</div>\n</footer>` },
];

const CATEGORIES = [...new Set(COMPONENTS.map(c => c.category))];

export function ComponentPalette({ open, onClose, onInsertComponent }: ComponentPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const filtered = searchQuery.trim()
    ? COMPONENTS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : COMPONENTS;

  const handleDragStart = useCallback((e: React.DragEvent, component: ComponentTemplate) => {
    setDraggingId(component.id);
    e.dataTransfer.setData('text/plain', component.code);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="w-64 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-white/70">Components</span>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white/50 text-xs">✕</button>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-md px-2 h-6">
          <Search className="h-2.5 w-2.5 text-white/20 shrink-0" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="flex-1 bg-transparent text-[10px] text-white/60 placeholder:text-white/15 outline-none"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {CATEGORIES.map(cat => {
            const items = filtered.filter(c => c.category === cat);
            if (items.length === 0) return null;
            const isExpanded = expandedCategories.has(cat);

            return (
              <div key={cat}>
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-widest hover:text-white/50 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                  {cat}
                  <span className="text-white/15 ml-auto font-mono">{items.length}</span>
                </button>
                {isExpanded && items.map(comp => (
                  <div
                    key={comp.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, comp)}
                    onDragEnd={() => setDraggingId(null)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-grab transition-all group",
                      draggingId === comp.id
                        ? "bg-violet-500/10 border border-violet-500/20"
                        : "hover:bg-white/[0.03] border border-transparent"
                    )}
                  >
                    <GripVertical className="h-3 w-3 text-white/10 group-hover:text-white/25 shrink-0" />
                    <comp.icon className="h-3.5 w-3.5 text-white/25 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-white/60 font-medium truncate">{comp.name}</div>
                      <div className="text-[9px] text-white/20 truncate">{comp.preview}</div>
                    </div>
                    <button
                      onClick={() => { onInsertComponent(comp.code); toast.success(`Inserted ${comp.name}`); }}
                      className="opacity-0 group-hover:opacity-100 text-[9px] text-cyan-400/70 hover:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded transition-all shrink-0"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
