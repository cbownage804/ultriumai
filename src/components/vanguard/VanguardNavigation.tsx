import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Shield,
  LayoutDashboard, 
  Ticket,
  Building2,
  Monitor, 
  Bell, 
  Package,
  Network,
  BookOpen,
  BarChart3, 
  CreditCard,
  Settings, 
  Menu, 
  X,
  Gift,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVanguardBasePath } from '@/utils/subdomain';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  children?: NavItem[];
}

export function VanguardNavigation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(['Reports']);
  const location = useLocation();
  const basePath = getVanguardBasePath();

  // Atera-style flat navigation
  const navItems: NavItem[] = [
    { title: 'Dashboard', path: `${basePath}/dashboard`, icon: LayoutDashboard },
    { title: 'Tickets', path: `${basePath}/tickets`, icon: Ticket },
    { title: 'Customers', path: `${basePath}/customers`, icon: Building2 },
    { title: 'Devices', path: `${basePath}/devices`, icon: Monitor },
    { title: 'Alerts', path: `${basePath}/alerts`, icon: Bell },
    { title: 'App Center', path: `${basePath}/apps`, icon: Package },
    { title: 'Network Discovery', path: `${basePath}/network`, icon: Network, badge: '+1' },
    { title: 'Knowledge Base', path: `${basePath}/knowledge`, icon: BookOpen },
    { 
      title: 'Reports', 
      path: `${basePath}/reports`, 
      icon: BarChart3,
      children: [
        { title: 'Overview', path: `${basePath}/reports`, icon: BarChart3 },
        { title: 'Scheduled Reports', path: `${basePath}/scheduled-reports`, icon: BarChart3 },
        { title: 'Report Builder', path: `${basePath}/report-builder`, icon: BarChart3 },
      ]
    },
    { title: 'Billing', path: `${basePath}/billing`, icon: CreditCard },
    { title: 'Admin', path: `${basePath}/admin`, icon: Settings },
    { title: 'Refer a Friend', path: `${basePath}/referrals`, icon: Gift },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) ? prev.filter(m => m !== title) : [...prev, title]
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden text-white hover:bg-white/10 h-11 w-11 rounded-xl bg-[#1a3a3a]/90 backdrop-blur-xl border border-white/10 shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Atera style */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-[#1a3a3a] border-r border-white/10 z-40 transition-all duration-300 w-56",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section - Atera style */}
          <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-cyan-500/20">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">ULTRIUM</span>
          </div>

          {/* Navigation Items - Flat list like Atera */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {navItems.map((item) => (
              <div key={item.title}>
                {item.children ? (
                  <Collapsible
                    open={openMenus.includes(item.title)}
                    onOpenChange={() => toggleMenu(item.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors",
                          "hover:bg-white/5 text-white/80 hover:text-white",
                          isActive(item.path) && "bg-white/10 text-white border-l-2 border-cyan-400"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">{item.title}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          openMenus.includes(item.title) && "rotate-180"
                        )} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 pl-11 pr-4 py-2 text-sm transition-colors",
                            "hover:bg-white/5 text-white/60 hover:text-white",
                            isActive(child.path) && "bg-white/10 text-white"
                          )}
                        >
                          <span>{child.title}</span>
                        </NavLink>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      "hover:bg-white/5 text-white/80 hover:text-white",
                      isActive(item.path) && "bg-white/10 text-white border-l-2 border-cyan-400"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="text-xs bg-cyan-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
