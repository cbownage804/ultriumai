import { useState, useCallback } from 'react';
import { Puzzle, Plus, Trash2, ToggleLeft, ToggleRight, X, Download, Star, Check, ExternalLink, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'linter' | 'formatter' | 'deploy' | 'ai' | 'theme' | 'tool';
  icon: string;
  enabled: boolean;
  installed: boolean;
  config?: Record<string, any>;
  rating?: number;
  downloads?: number;
}

const MARKETPLACE_EXTENSIONS: Extension[] = [
  { id: 'eslint', name: 'ESLint', description: 'JavaScript & TypeScript linter with auto-fix support', version: '9.0.0', author: 'ESLint Team', category: 'linter', icon: '🔍', enabled: false, installed: false, rating: 4.8, downloads: 50000 },
  { id: 'prettier', name: 'Prettier', description: 'Opinionated code formatter for JS, TS, CSS, HTML, JSON', version: '3.2.0', author: 'Prettier Team', category: 'formatter', icon: '✨', enabled: false, installed: false, rating: 4.9, downloads: 45000 },
  { id: 'tailwind-sort', name: 'Tailwind Class Sorter', description: 'Automatically sort Tailwind CSS classes in your components', version: '1.5.0', author: 'Community', category: 'formatter', icon: '🎨', enabled: false, installed: false, rating: 4.6, downloads: 12000 },
  { id: 'vercel-deploy', name: 'Vercel Deployer', description: 'One-click deployment to Vercel with preview URLs', version: '2.1.0', author: 'Vercel', category: 'deploy', icon: '▲', enabled: false, installed: false, rating: 4.7, downloads: 30000 },
  { id: 'netlify-deploy', name: 'Netlify Deploy', description: 'Deploy to Netlify with build hooks and preview deploys', version: '1.8.0', author: 'Netlify', category: 'deploy', icon: '🌐', enabled: false, installed: false, rating: 4.5, downloads: 25000 },
  { id: 'gpt4-provider', name: 'GPT-4 Provider', description: 'Use OpenAI GPT-4 as an alternative AI model provider', version: '1.0.0', author: 'OpenAI', category: 'ai', icon: '🤖', enabled: false, installed: false, rating: 4.9, downloads: 40000 },
  { id: 'claude-provider', name: 'Claude Provider', description: 'Anthropic Claude as an AI model provider for code generation', version: '1.0.0', author: 'Anthropic', category: 'ai', icon: '🧠', enabled: false, installed: false, rating: 4.8, downloads: 35000 },
  { id: 'a11y-checker', name: 'Accessibility Checker', description: 'Automatic WCAG compliance checking and suggestions', version: '2.0.0', author: 'A11y Team', category: 'linter', icon: '♿', enabled: false, installed: false, rating: 4.4, downloads: 8000 },
  { id: 'dark-theme', name: 'Dracula Theme', description: 'Popular dark theme for the code editor', version: '1.3.0', author: 'Dracula Theme', category: 'theme', icon: '🧛', enabled: false, installed: false, rating: 4.7, downloads: 20000 },
  { id: 'docker-deploy', name: 'Docker Builder', description: 'Build and push Docker images directly from the IDE', version: '1.2.0', author: 'Community', category: 'deploy', icon: '🐳', enabled: false, installed: false, rating: 4.3, downloads: 15000 },
  { id: 'git-lens', name: 'Git Lens', description: 'Enhanced git blame, history, and diff visualizations', version: '3.0.0', author: 'Community', category: 'tool', icon: '📜', enabled: false, installed: false, rating: 4.6, downloads: 18000 },
  { id: 'import-cost', name: 'Import Cost', description: 'Display inline the size of imported packages', version: '1.1.0', author: 'Community', category: 'tool', icon: '📦', enabled: false, installed: false, rating: 4.5, downloads: 22000 },
];

interface ExtensionSystemProps {
  open: boolean;
  onClose: () => void;
}

export function ExtensionSystem({ open, onClose }: ExtensionSystemProps) {
  const [extensions, setExtensions] = useState<Extension[]>(MARKETPLACE_EXTENSIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showInstalled, setShowInstalled] = useState(false);

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'linter', label: 'Linters' },
    { key: 'formatter', label: 'Formatters' },
    { key: 'deploy', label: 'Deploy' },
    { key: 'ai', label: 'AI Providers' },
    { key: 'theme', label: 'Themes' },
    { key: 'tool', label: 'Tools' },
  ];

  const filtered = extensions.filter(ext => {
    if (showInstalled && !ext.installed) return false;
    if (activeCategory !== 'all' && ext.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ext.name.toLowerCase().includes(q) || ext.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleInstall = useCallback((id: string) => {
    setExtensions(prev => prev.map(e => e.id === id ? { ...e, installed: true, enabled: true } : e));
    toast.success('Extension installed');
  }, []);

  const handleUninstall = useCallback((id: string) => {
    setExtensions(prev => prev.map(e => e.id === id ? { ...e, installed: false, enabled: false } : e));
    toast.success('Extension uninstalled');
  }, []);

  const handleToggle = useCallback((id: string) => {
    setExtensions(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  }, []);

  const installedCount = extensions.filter(e => e.installed).length;

  if (!open) return null;

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Puzzle className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-medium text-white/70">Extensions</span>
          {installedCount > 0 && (
            <span className="text-[9px] bg-violet-500/20 text-violet-400 rounded-full px-1.5">{installedCount}</span>
          )}
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extensions..."
            className="h-7 text-xs bg-white/5 border-white/10 text-white pl-7"
          />
        </div>
      </div>

      {/* Tab: Marketplace / Installed */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/[0.06]">
        <button
          onClick={() => setShowInstalled(false)}
          className={cn("text-[10px] px-2 py-1 rounded", !showInstalled ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50")}
        >
          Marketplace
        </button>
        <button
          onClick={() => setShowInstalled(true)}
          className={cn("text-[10px] px-2 py-1 rounded", showInstalled ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50")}
        >
          Installed ({installedCount})
        </button>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto border-b border-white/[0.04]">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              "text-[9px] px-2 py-0.5 rounded-full shrink-0 transition-colors",
              activeCategory === cat.key ? "bg-violet-500/20 text-violet-400" : "text-white/25 hover:text-white/40 bg-white/[0.03]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Extensions list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-white/15 text-xs">No extensions found</div>
        )}
        {filtered.map(ext => (
          <div key={ext.id} className="px-3 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
            <div className="flex items-start gap-2.5">
              <span className="text-lg shrink-0">{ext.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-white/70">{ext.name}</span>
                  <span className="text-[9px] text-white/20 font-mono">v{ext.version}</span>
                </div>
                <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">{ext.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-white/20">{ext.author}</span>
                  {ext.rating && (
                    <span className="flex items-center gap-0.5 text-[9px] text-amber-400/60">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      {ext.rating}
                    </span>
                  )}
                  {ext.downloads && (
                    <span className="text-[9px] text-white/15">
                      <Download className="h-2.5 w-2.5 inline mr-0.5" />
                      {ext.downloads > 1000 ? `${(ext.downloads / 1000).toFixed(0)}k` : ext.downloads}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {ext.installed ? (
                  <>
                    <Switch
                      checked={ext.enabled}
                      onCheckedChange={() => handleToggle(ext.id)}
                      className="scale-75"
                    />
                    <button
                      onClick={() => handleUninstall(ext.id)}
                      className="text-[9px] text-red-400/50 hover:text-red-400 transition-colors"
                    >
                      Uninstall
                    </button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInstall(ext.id)}
                    className="h-6 text-[10px] gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Install
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
