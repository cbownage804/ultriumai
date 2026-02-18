import { useState, useCallback } from 'react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { BarChart3, Cloud, Code, Palette, Shield, Gauge, Pin, PinOff, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export interface ToolbarPanel {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

const ALL_PANELS: Omit<ToolbarPanel, 'action'>[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'cloud', label: 'Cloud', icon: Cloud },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'speed', label: 'Speed', icon: Gauge },
];

interface ToolbarPanelsDropdownProps {
  onOpenPanel: (panelId: string) => void;
}

export function ToolbarPanelsDropdown({ onOpenPanel }: ToolbarPanelsDropdownProps) {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const togglePin = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pinned = ALL_PANELS.filter(p => pinnedIds.has(p.id));
  const unpinned = ALL_PANELS.filter(p => !pinnedIds.has(p.id));

  return (
    <div className="flex items-center gap-0.5">
      {/* Pinned panel buttons shown inline */}
      {pinned.map(panel => (
        <Tooltip key={panel.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onOpenPanel(panel.id)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <panel.icon className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{panel.label}</TooltipContent>
        </Tooltip>
      ))}

      {/* Dropdown for all panels */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          sideOffset={6}
          className="min-w-[200px] bg-[#0f0f14] border-white/10 rounded-xl shadow-2xl shadow-black/60 p-1.5"
        >
          {ALL_PANELS.map(panel => (
            <DropdownMenuItem
              key={panel.id}
              onClick={() => onOpenPanel(panel.id)}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white focus:text-white focus:bg-white/[0.06] cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <panel.icon className="h-4 w-4 text-white/40" />
                <span>{panel.label}</span>
              </div>
              <button
                onClick={(e) => togglePin(panel.id, e)}
                className={cn(
                  "h-5 w-5 flex items-center justify-center rounded transition-colors",
                  pinnedIds.has(panel.id)
                    ? "text-white/50 hover:text-white/80"
                    : "text-white/20 hover:text-white/50"
                )}
              >
                {pinnedIds.has(panel.id) ? (
                  <PinOff className="h-3.5 w-3.5" />
                ) : (
                  <Pin className="h-3.5 w-3.5" />
                )}
              </button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
