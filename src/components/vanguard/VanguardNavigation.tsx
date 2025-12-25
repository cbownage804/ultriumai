import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  Monitor, 
  Target, 
  Eye, 
  FileCheck, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  ExternalLink,
  ChevronLeft,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVanguardBasePath } from '@/utils/subdomain';

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

export function VanguardNavigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const basePath = getVanguardBasePath();

  const navItems: NavItem[] = [
    { title: 'Dashboard', path: `${basePath}/dashboard`, icon: LayoutDashboard },
    { title: 'Devices', path: `${basePath}/devices`, icon: Monitor },
    { title: 'Threat Detection', path: `${basePath}/threats`, icon: Target },
    { title: 'SOC Operations', path: `${basePath}/soc`, icon: Eye },
    { title: 'Penetration Testing', path: `${basePath}/pentest`, icon: Shield },
    { title: 'Compliance', path: `${basePath}/compliance`, icon: FileCheck },
    { title: 'Reports', path: `${basePath}/reports`, icon: BarChart3 },
    { title: 'Alerting', path: `${basePath}/alerting`, icon: Bell },
    { title: 'Setup', path: `${basePath}/setup`, icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar-background border-r border-sidebar-border z-40 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={cn(
            "flex items-center gap-3 p-4 border-b border-sidebar-border",
            isCollapsed && "justify-center"
          )}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">Vanguard</h1>
                <p className="text-xs text-muted-foreground">Security Platform</p>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive(item.path) 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed && "h-6 w-6")} />
                {!isCollapsed && (
                  <>
                    <span className="font-medium">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-3 border-t border-sidebar-border space-y-2">
            {/* Back to UltriumAI */}
            <a
              href="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <ExternalLink className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="text-sm">Back to UltriumAI</span>}
            </a>

            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "w-full justify-start gap-3",
                isCollapsed && "justify-center px-2"
              )}
            >
              <ChevronLeft className={cn(
                "h-5 w-5 transition-transform duration-200",
                isCollapsed && "rotate-180"
              )} />
              {!isCollapsed && <span>Collapse</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
