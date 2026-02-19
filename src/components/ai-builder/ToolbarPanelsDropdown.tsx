import { useState, useCallback, useMemo } from 'react';
import { Pin, PinOff, MoreHorizontal, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { PANEL_REGISTRY, PANEL_CATEGORIES, getPanelsByCategory, type PanelEntry, type PanelCategory } from './panelRegistry';

interface ToolbarPanelsDropdownProps {
  onOpenPanel: (panelId: string) => void;
}

export function ToolbarPanelsDropdown({ onOpenPanel }: ToolbarPanelsDropdownProps) {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('toolbar-pinned-panels');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const togglePin = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('toolbar-pinned-panels', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const pinned = useMemo(() => PANEL_REGISTRY.filter(p => pinnedIds.has(p.id)), [pinnedIds]);

  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? PANEL_REGISTRY.filter(p =>
          p.label.toLowerCase().includes(q) ||
          p.keywords.some(k => k.includes(q))
        )
      : PANEL_REGISTRY;
    const map = new Map<PanelCategory, PanelEntry[]>();
    for (const p of filtered) {
      const list = map.get(p.category) || [];
      list.push(p);
      map.set(p.category, list);
    }
    return map;
  }, [search]);

  const handleSelect = (panel: PanelEntry) => {
    onOpenPanel(panel.stateKey);
    setOpen(false);
    setSearch('');
  };

  // Order categories by those with results
  const categoryOrder: PanelCategory[] = [
    'design', 'data', 'integration', 'auth', 'devops', 'deploy',
    'testing', 'security', 'monitoring', 'content', 'search',
    'communication', 'navigation', 'collaboration', 'mobile',
    'ai', 'monetization', 'dx', 'polish', 'view', 'edit',
  ];

  return (
    <div className="flex items-center gap-0.5">
      {/* Pinned panel buttons */}
      {pinned.map(panel => (
        <Tooltip key={panel.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onOpenPanel(panel.stateKey)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <panel.icon className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{panel.label}</TooltipContent>
        </Tooltip>
      ))}

      {/* Mega-menu popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          sideOffset={6}
          className="w-[420px] max-h-[70vh] overflow-hidden bg-[#0f0f14] border-white/10 rounded-xl shadow-2xl shadow-black/60 p-0"
        >
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
            <Search className="h-3.5 w-3.5 text-white/30 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search 150+ tools..."
              className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/20 hover:text-white/50 text-xs">✕</button>
            )}
          </div>

          {/* Scrollable category list */}
          <div className="overflow-y-auto max-h-[calc(70vh-44px)] p-1.5">
            {categoryOrder.map(cat => {
              const panels = grouped.get(cat);
              if (!panels || panels.length === 0) return null;
              const catInfo = PANEL_CATEGORIES[cat];
              return (
                <div key={cat} className="mb-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                    <catInfo.icon className="h-3 w-3" />
                    {catInfo.label}
                    <span className="ml-auto text-white/15">{panels.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-0.5">
                    {panels.map(panel => (
                      <button
                        key={panel.id}
                        onClick={() => handleSelect(panel)}
                        className="flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors group text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <panel.icon className="h-3.5 w-3.5 text-white/30 shrink-0" />
                          <span className="truncate">{panel.label}</span>
                        </div>
                        <button
                          onClick={(e) => togglePin(panel.id, e)}
                          className={cn(
                            "h-4 w-4 flex items-center justify-center rounded shrink-0 transition-colors",
                            pinnedIds.has(panel.id)
                              ? "text-violet-400/70 hover:text-violet-300"
                              : "text-white/10 opacity-0 group-hover:opacity-100 hover:text-white/40"
                          )}
                        >
                          {pinnedIds.has(panel.id) ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {grouped.size === 0 && (
              <div className="text-center py-8 text-white/20 text-sm">No tools match "{search}"</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
