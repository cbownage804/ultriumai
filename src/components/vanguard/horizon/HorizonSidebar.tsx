/**
 * Datto-style vertical sidebar for Horizon RMM
 * Expandable groups with module sub-items
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface HorizonSidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface HorizonSidebarGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  items: HorizonSidebarItem[];
  defaultOpen?: boolean;
}

interface HorizonSidebarProps {
  groups: HorizonSidebarGroup[];
  activeItem: string;
  onSelect: (itemId: string) => void;
}

export function HorizonSidebar({ groups, activeItem, onSelect }: HorizonSidebarProps) {
  return (
    <aside className="w-52 shrink-0 bg-[#0a1929]/80 border-r border-cyan-500/20 flex flex-col h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
      <nav className="py-2">
        {groups.map((group) => (
          <SidebarGroup
            key={group.id}
            group={group}
            activeItem={activeItem}
            onSelect={onSelect}
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarGroup({ group, activeItem, onSelect }: { group: HorizonSidebarGroup; activeItem: string; onSelect: (id: string) => void }) {
  const hasActiveChild = group.items.some(i => i.id === activeItem);
  const [open, setOpen] = useState(group.defaultOpen ?? hasActiveChild);

  // Single-item groups act as direct nav
  if (group.items.length === 1) {
    const item = group.items[0];
    const isActive = activeItem === item.id;
    return (
      <button
        onClick={() => onSelect(item.id)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-cyan-500/15 text-cyan-400 border-l-2 border-cyan-400'
            : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
        )}
      >
        <group.icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{group.label}</span>
        {group.badge && (
          <Badge variant="secondary" className={cn(
            'ml-auto h-5 px-1.5 text-[10px]',
            isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-white/50'
          )}>
            {group.badge}
          </Badge>
        )}
      </button>
    );
  }

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 text-sm font-medium transition-colors',
          hasActiveChild ? 'text-cyan-400' : 'text-white/50 hover:text-white/70'
        )}
      >
        <div className="flex items-center gap-2">
          <group.icon className="h-4 w-4 shrink-0" />
          <span>{group.label}</span>
          {group.badge && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-amber-500/20 text-amber-400 border-0">
              {group.badge}
            </Badge>
          )}
        </div>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && (
        <div className="space-y-0.5 pl-3">
          {group.items.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-r-md transition-colors',
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border-l-2 border-cyan-400'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
