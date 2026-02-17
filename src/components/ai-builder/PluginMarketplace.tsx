import { useState, useCallback, useMemo } from 'react';
import {
  Puzzle, X, Search, Star, Download, Settings, ChevronRight,
  ToggleLeft, ToggleRight, Trash2, Sparkles, Shield, Zap, ExternalLink,
  CheckCircle2, AlertTriangle, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { PluginManifest, InstalledPlugin, PluginConfig } from '@/hooks/usePluginRegistry';

// ─── Types ───────────────────────────────────────────────────

interface PluginMarketplaceProps {
  open: boolean;
  onClose: () => void;
  catalogue: PluginManifest[];
  installed: Map<string, InstalledPlugin>;
  onInstall: (pluginId: string) => any;
  onUninstall: (pluginId: string) => void;
  onToggle: (pluginId: string) => void;
  onUpdateConfig: (pluginId: string, key: string, value: any) => void;
}

type ViewMode = 'browse' | 'installed' | 'detail';

const CATEGORY_META: Record<string, { label: string; color: string; icon: typeof Sparkles }> = {
  all: { label: 'All', color: 'text-white/40', icon: Filter },
  ai: { label: 'AI', color: 'text-violet-400', icon: Sparkles },
  linter: { label: 'Linters', color: 'text-amber-400', icon: Shield },
  formatter: { label: 'Formatters', color: 'text-emerald-400', icon: Zap },
  deploy: { label: 'Deploy', color: 'text-sky-400', icon: Zap },
  security: { label: 'Security', color: 'text-red-400', icon: Shield },
  analytics: { label: 'Analytics', color: 'text-cyan-400', icon: Zap },
  integration: { label: 'Integrations', color: 'text-orange-400', icon: Zap },
  theme: { label: 'Themes', color: 'text-pink-400', icon: Sparkles },
  tool: { label: 'Tools', color: 'text-teal-400', icon: Zap },
};

// ─── Component ───────────────────────────────────────────────

export function PluginMarketplace({
  open, onClose, catalogue, installed, onInstall, onUninstall, onToggle, onUpdateConfig,
}: PluginMarketplaceProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState<string | null>(null);

  const featured = useMemo(() => catalogue.filter(p => p.featured), [catalogue]);

  const filtered = useMemo(() => {
    let items = viewMode === 'installed'
      ? catalogue.filter(p => installed.has(p.id))
      : catalogue;

    if (category !== 'all') items = items.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags?.some(t => t.includes(q))
      );
    }
    return items;
  }, [catalogue, installed, viewMode, category, search]);

  const handleInstall = useCallback((id: string) => {
    const result = onInstall(id);
    if (result === true) {
      toast.success(`Installed successfully`);
    } else if (result?.error) {
      toast.error(result.error);
    }
  }, [onInstall]);

  const handleUninstall = useCallback((id: string) => {
    onUninstall(id);
    toast.success('Plugin uninstalled');
    if (configOpen === id) setConfigOpen(null);
  }, [onUninstall, configOpen]);

  const installedCount = installed.size;
  const detail = selectedPlugin ? catalogue.find(p => p.id === selectedPlugin) : null;
  const detailInstalled = selectedPlugin ? installed.get(selectedPlugin) : null;

  if (!open) return null;

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Puzzle className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-medium text-white/70">Plugin Marketplace</span>
          {installedCount > 0 && (
            <span className="text-[9px] bg-violet-500/20 text-violet-400 rounded-full px-1.5">{installedCount}</span>
          )}
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Detail view */}
      {detail ? (
        <div className="flex-1 overflow-y-auto">
          <button onClick={() => setSelectedPlugin(null)} className="flex items-center gap-1 px-3 py-2 text-[10px] text-white/30 hover:text-white/50">
            ← Back to marketplace
          </button>

          <div className="px-4 pb-4">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{detail.icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-white/80">{detail.name}</h3>
                <p className="text-[10px] text-white/30">{detail.author} · v{detail.version}</p>
              </div>
            </div>

            <p className="text-[11px] text-white/50 leading-relaxed mb-3">{detail.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-3 mb-3">
              {detail.rating && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-400/70">
                  <Star className="h-3 w-3 fill-current" /> {detail.rating}
                </span>
              )}
              {detail.downloads && (
                <span className="text-[10px] text-white/25">
                  <Download className="h-3 w-3 inline mr-0.5" />
                  {detail.downloads > 1000 ? `${(detail.downloads / 1000).toFixed(0)}k` : detail.downloads}
                </span>
              )}
            </div>

            {/* Hooks */}
            <div className="mb-3">
              <h4 className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wider">Lifecycle Hooks</h4>
              <div className="flex flex-wrap gap-1">
                {detail.hooks.map(h => (
                  <span key={h} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 font-mono">{h}</span>
                ))}
              </div>
            </div>

            {/* Tags */}
            {detail.tags && (
              <div className="mb-4">
                <h4 className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wider">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {detail.tags.map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400/60">#{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {detail.dependencies && detail.dependencies.length > 0 && (
              <div className="mb-4">
                <h4 className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Dependencies
                </h4>
                {detail.dependencies.map(d => (
                  <span key={d} className="text-[10px] text-amber-400/50 font-mono">{d}</span>
                ))}
              </div>
            )}

            {/* Install / Config */}
            {detailInstalled ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Installed</span>
                  </div>
                  <Switch checked={detailInstalled.enabled} onCheckedChange={() => onToggle(detail.id)} className="scale-75" />
                </div>

                {/* Config fields */}
                {detail.config && detail.config.length > 0 && (
                  <div className="space-y-2 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04]">
                    <h4 className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1">
                      <Settings className="h-3 w-3" /> Configuration
                    </h4>
                    {detail.config.map(cfg => (
                      <ConfigField
                        key={cfg.key}
                        config={cfg}
                        value={detailInstalled.configValues[cfg.key]}
                        onChange={(v) => onUpdateConfig(detail.id, cfg.key, v)}
                      />
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUninstall(detail.id)}
                  className="w-full text-[10px] h-7 text-red-400/70 border-red-400/20 hover:bg-red-400/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Uninstall
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => handleInstall(detail.id)}
                className="w-full text-[10px] h-7 bg-violet-600 hover:bg-violet-500"
              >
                <Download className="h-3 w-3 mr-1" /> Install Plugin
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="p-2 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search plugins..."
                className="h-7 text-xs bg-white/5 border-white/10 text-white pl-7"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-2 py-1 border-b border-white/[0.06]">
            <button
              onClick={() => setViewMode('browse')}
              className={cn("text-[10px] px-2 py-1 rounded", viewMode === 'browse' ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50")}
            >
              Browse
            </button>
            <button
              onClick={() => setViewMode('installed')}
              className={cn("text-[10px] px-2 py-1 rounded", viewMode === 'installed' ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50")}
            >
              Installed ({installedCount})
            </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto border-b border-white/[0.04] scrollbar-none">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  "text-[9px] px-2 py-0.5 rounded-full shrink-0 transition-colors",
                  category === key ? "bg-violet-500/20 text-violet-400" : "text-white/25 hover:text-white/40 bg-white/[0.03]"
                )}
              >
                {meta.label}
              </button>
            ))}
          </div>

          {/* Featured section */}
          {viewMode === 'browse' && !search && category === 'all' && (
            <div className="px-3 py-2 border-b border-white/[0.04]">
              <h4 className="text-[9px] text-white/20 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400/50" /> Featured
              </h4>
              <div className="space-y-1.5">
                {featured.map(plugin => (
                  <button
                    key={plugin.id}
                    onClick={() => setSelectedPlugin(plugin.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-gradient-to-r from-violet-500/[0.06] to-transparent hover:from-violet-500/[0.1] transition-colors text-left"
                  >
                    <span className="text-sm shrink-0">{plugin.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-white/60 font-medium">{plugin.name}</span>
                      <p className="text-[9px] text-white/25 truncate">{plugin.description}</p>
                    </div>
                    {installed.has(plugin.id) ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400/60 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-white/15 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plugin list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="py-8 text-center text-white/15 text-xs">No plugins found</div>
            )}
            {filtered.filter(p => !p.featured || search || category !== 'all' || viewMode === 'installed').map(plugin => {
              const inst = installed.get(plugin.id);
              return (
                <div key={plugin.id} className="px-3 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-start gap-2.5">
                    <button onClick={() => setSelectedPlugin(plugin.id)} className="text-lg shrink-0 hover:scale-110 transition-transform">
                      {plugin.icon}
                    </button>
                    <button onClick={() => setSelectedPlugin(plugin.id)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-white/70">{plugin.name}</span>
                        <span className="text-[9px] text-white/20 font-mono">v{plugin.version}</span>
                      </div>
                      <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed truncate">{plugin.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-white/20">{plugin.author}</span>
                        {plugin.rating && (
                          <span className="flex items-center gap-0.5 text-[9px] text-amber-400/60">
                            <Star className="h-2.5 w-2.5 fill-current" /> {plugin.rating}
                          </span>
                        )}
                      </div>
                    </button>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {inst ? (
                        <>
                          <Switch checked={inst.enabled} onCheckedChange={() => onToggle(plugin.id)} className="scale-75" />
                          <button
                            onClick={() => setSelectedPlugin(plugin.id)}
                            className="text-[9px] text-white/20 hover:text-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Settings className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleInstall(plugin.id); }}
                          className="h-6 text-[10px] gap-1"
                        >
                          <Download className="h-3 w-3" /> Install
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Config Field ────────────────────────────────────────────

function ConfigField({ config, value, onChange }: { config: PluginConfig; value: any; onChange: (v: any) => void }) {
  switch (config.type) {
    case 'boolean':
      return (
        <label className="flex items-center justify-between">
          <span className="text-[10px] text-white/40">{config.label}</span>
          <Switch checked={!!value} onCheckedChange={onChange} className="scale-75" />
        </label>
      );
    case 'number':
      return (
        <label className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-white/40">{config.label}</span>
          <input
            type="number"
            value={value ?? config.default}
            onChange={e => onChange(Number(e.target.value))}
            className="w-16 h-5 text-[10px] bg-white/[0.04] border border-white/[0.08] rounded px-1.5 text-white/60 outline-none"
          />
        </label>
      );
    case 'select':
      return (
        <label className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-white/40">{config.label}</span>
          <select
            value={value ?? config.default}
            onChange={e => onChange(e.target.value)}
            className="h-5 text-[10px] bg-white/[0.04] border border-white/[0.08] rounded px-1 text-white/60 outline-none"
          >
            {config.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
      );
    default:
      return (
        <label className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-white/40">{config.label}</span>
          <input
            type="text"
            value={value ?? config.default ?? ''}
            onChange={e => onChange(e.target.value)}
            className="flex-1 max-w-[120px] h-5 text-[10px] bg-white/[0.04] border border-white/[0.08] rounded px-1.5 text-white/60 outline-none"
          />
        </label>
      );
  }
}
