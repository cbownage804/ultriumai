import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ModuleLogo, ModuleName } from './ModuleLogo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
}

export interface NavSubGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface CollapsibleNavGroupProps {
  header: string;
  description: string;
  tooltip: string;
  module: ModuleName;
  dashboardPath: string;
  items: NavItem[];
  subGroups?: NavSubGroup[];
  isCollapsed: boolean;
  onMobileClose: () => void;
  children?: React.ReactNode;
}

const STORAGE_KEY = 'vanguard-nav-collapsed-groups';
const SUB_GROUP_STORAGE_KEY = 'vanguard-nav-collapsed-subgroups';

export function CollapsibleNavGroup({
  header,
  description,
  tooltip,
  module,
  dashboardPath,
  items,
  subGroups,
  isCollapsed,
  onMobileClose,
  children,
}: CollapsibleNavGroupProps) {
  const location = useLocation();
  
  // Check if any item in this group (including sub-groups) is active
  const allSubItems = subGroups?.flatMap(sg => sg.items) ?? [];
  const allItems = [...items, ...allSubItems];
  const isGroupActive = allItems.some(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  // Load initial state from localStorage, default to open if group has active item
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const collapsed = JSON.parse(saved) as string[];
        if (isGroupActive) return true;
        return !collapsed.includes(header);
      }
    } catch (e) {
      console.error('Failed to load nav state:', e);
    }
    return true;
  });

  // Auto-expand when a child becomes active
  useEffect(() => {
    if (isGroupActive && !isOpen) {
      setIsOpen(true);
    }
  }, [isGroupActive, location.pathname]);

  // Save collapsed state to localStorage
  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let collapsed: string[] = saved ? JSON.parse(saved) : [];
      
      if (open) {
        collapsed = collapsed.filter(h => h !== header);
      } else {
        if (!collapsed.includes(header)) {
          collapsed.push(header);
        }
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch (e) {
      console.error('Failed to save nav state:', e);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={onMobileClose}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm transition-all duration-200 ml-2",
        "hover:bg-gradient-to-r hover:from-cyan-500/15 hover:via-blue-500/10 hover:to-purple-500/15 text-slate-400 hover:text-cyan-300",
        isActive(item.path) && "bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/20 text-cyan-400 border-l-2 border-cyan-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
      )}
    >
      <item.icon className={cn(
        "h-4 w-4 shrink-0 transition-colors",
        isActive(item.path) && "text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]"
      )} />
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <span className="text-[10px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white px-2 py-0.5 rounded-full font-bold shadow-lg shadow-purple-500/40 tracking-wide">
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  // Collapsed sidebar view - just show module icon
  if (isCollapsed) {
    return (
      <div className="my-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to={dashboardPath}
              onClick={onMobileClose}
              className="flex justify-center cursor-pointer hover:bg-cyan-500/10 rounded-md py-1 mx-1 transition-all duration-200"
            >
              <ModuleLogo module={module} size="sm" glow />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black border-cyan-500/40 text-slate-200 shadow-xl shadow-cyan-500/10">
            <div className="flex items-center gap-2">
              <ModuleLogo module={module} size="md" glow />
              <div>
                <p className="text-xs font-semibold text-cyan-400">{header}</p>
                <p className="text-[10px] text-slate-400">{description}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Expanded sidebar view with collapsible group
  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle} className="mt-2">
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10 transition-all duration-200 rounded-md mx-1 group",
            isGroupActive && "bg-gradient-to-r from-cyan-500/5 to-purple-500/5"
          )}
        >
          <ModuleLogo module={module} size="md" glow className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-[10px] font-bold tracking-widest block drop-shadow-[0_0_4px_rgba(6,182,212,0.3)] transition-colors",
                isGroupActive ? "text-cyan-300" : "text-cyan-400"
              )}>
                {header}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5 truncate">
              {description}
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="animate-accordion-down">
        <div className="py-1">
          {/* Direct items */}
          {items.map(renderNavItem)}
          
          {/* Injected children (e.g. SitesNavSection) */}
          {children}
          
          {/* Nested sub-groups */}
          {subGroups?.map((sg) => (
            <NestedSubGroup
              key={sg.label}
              subGroup={sg}
              parentHeader={header}
              isActive={isActive}
              onMobileClose={onMobileClose}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NestedSubGroup({
  subGroup,
  parentHeader,
  isActive,
  onMobileClose,
}: {
  subGroup: NavSubGroup;
  parentHeader: string;
  isActive: (path: string) => boolean;
  onMobileClose: () => void;
}) {
  const location = useLocation();
  const hasActiveChild = subGroup.items.some(i => isActive(i.path));
  const storageKey = `${parentHeader}::${subGroup.label}`;

  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(SUB_GROUP_STORAGE_KEY);
      if (saved) {
        const collapsed = JSON.parse(saved) as string[];
        if (hasActiveChild) return true;
        return !collapsed.includes(storageKey);
      }
    } catch {
      // ignore
    }
    return false; // sub-groups default to closed
  });

  useEffect(() => {
    if (hasActiveChild && !isOpen) {
      setIsOpen(true);
    }
  }, [hasActiveChild, location.pathname]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    try {
      const saved = localStorage.getItem(SUB_GROUP_STORAGE_KEY);
      let collapsed: string[] = saved ? JSON.parse(saved) : [];
      if (next) {
        collapsed = collapsed.filter(k => k !== storageKey);
      } else {
        if (!collapsed.includes(storageKey)) collapsed.push(storageKey);
      }
      localStorage.setItem(SUB_GROUP_STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-1">
      <button
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-2.5 w-full px-5 py-2 text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 rounded-sm mx-1",
          "hover:bg-cyan-500/8 hover:text-slate-300",
          hasActiveChild ? "text-cyan-400/90" : "text-slate-500"
        )}
      >
        <subGroup.icon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">{subGroup.label}</span>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {isOpen && (
        <div className="ml-2 border-l border-cyan-500/10 ml-7">
          {subGroup.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-2.5 px-4 py-1.5 text-[13px] transition-all duration-200",
                "hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300",
                isActive(item.path) && "bg-cyan-500/15 text-cyan-400 border-l-2 border-cyan-400 -ml-[1px]"
              )}
            >
              <item.icon className={cn(
                "h-3.5 w-3.5 shrink-0",
                isActive(item.path) && "text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]"
              )} />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
