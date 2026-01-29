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
  ChevronDown,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVanguardBasePath } from '@/utils/subdomain';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import vanguardLogo from '@/assets/vanguard-logo.png';

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

  // Navigation items
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
    { title: 'Customer Portal', path: `${basePath}/portal`, icon: Globe },
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
        className="fixed top-3 left-3 z-50 md:hidden text-cyan-400 hover:bg-cyan-500/20 h-11 w-11 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/20 shadow-lg"
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

      {/* Sidebar - Pure Black Vanguard Theme */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-black border-r border-cyan-500/20 z-40 transition-all duration-300 w-56",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section - Vanguard Logo */}
          <div className="flex items-center justify-center px-4 py-4 border-b border-cyan-500/20">
            <img 
              src={vanguardLogo} 
              alt="Vanguard" 
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-3 overflow-y-auto">
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
                          "hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400",
                          isActive(item.path) && "bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400"
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
                    <CollapsibleContent className="bg-slate-900/50">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 pl-11 pr-4 py-2 text-sm transition-colors",
                            "hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-400",
                            isActive(child.path) && "bg-cyan-500/10 text-cyan-400"
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
                      "hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400",
                      isActive(item.path) && "bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400"
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

          {/* Footer */}
          <div className="p-4 border-t border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5 text-cyan-500" />
              <span>Powered by Ultrium</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
