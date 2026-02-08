import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarItem {
  value: string;
  icon: LucideIcon;
  label: string;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

interface AdminSidebarProps {
  groups: SidebarGroup[];
  activeItem: string;
  onSelect: (value: string) => void;
}

export function AdminSidebar({ groups, activeItem, onSelect }: AdminSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    // Auto-open the group containing the active item
    const initial = new Set<string>();
    for (const group of groups) {
      if (group.items.some(i => i.value === activeItem)) {
        initial.add(group.label);
      }
    }
    if (initial.size === 0 && groups.length > 0) initial.add(groups[0].label);
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <aside className="w-56 shrink-0 border-r bg-card/50 backdrop-blur-sm">
      <ScrollArea className="h-[calc(100vh-73px)]">
        <nav className="py-2 px-2 space-y-0.5">
          {groups.map((group) => {
            const isOpen = openGroups.has(group.label);
            const hasActive = group.items.some(i => i.value === activeItem);

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors',
                    hasActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{group.label}</span>
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>

                {isOpen && (
                  <div className="ml-1 space-y-0.5 pb-2">
                    {group.items.map((item) => {
                      const active = activeItem === item.value;
                      return (
                        <button
                          key={item.value}
                          onClick={() => onSelect(item.value)}
                          className={cn(
                            'flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-md transition-colors',
                            active
                              ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent'
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
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
