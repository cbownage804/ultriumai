import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Shield,
  Bug,
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
  ChevronDown,
  Bell,
  Brain,
  Globe,
  Activity,
  Database,
  Wrench,
  HardDrive,
  Network,
  Package,
  PieChart,
  CheckSquare,
  FileText,
  Building2,
  Store,
  BookOpen,
  Crosshair,
  Wifi,
  Key,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVanguardBasePath } from '@/utils/subdomain';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  isNew?: boolean;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
}

export function VanguardNavigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['core', 'security']);
  const location = useLocation();
  const basePath = getVanguardBasePath();

  const navSections: NavSection[] = [
    {
      title: 'Core',
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
        { title: 'Dashboard', path: `${basePath}/dashboard`, icon: LayoutDashboard },
        { title: 'Executive View', path: `${basePath}/executive`, icon: PieChart },
        { title: 'Devices', path: `${basePath}/devices`, icon: Monitor },
        { title: 'Assets (CMDB)', path: `${basePath}/assets`, icon: Package },
      ]
    },
    {
      title: 'Security',
      icon: Shield,
      defaultOpen: true,
      items: [
        { title: 'Threat Detection', path: `${basePath}/threats`, icon: Target },
        { title: 'Threat Intel', path: `${basePath}/threat-intel`, icon: Brain },
        { title: 'Dark Web Monitor', path: `${basePath}/dark-web`, icon: Globe },
        { title: 'User Behavior', path: `${basePath}/user-behavior`, icon: Activity },
        { title: 'SIEM Dashboard', path: `${basePath}/siem`, icon: Database },
        { title: 'SOC Operations', path: `${basePath}/soc`, icon: Eye },
        { title: 'Pen Testing', path: `${basePath}/pentest`, icon: Shield },
        { title: 'Vulnerability Scanner', path: `${basePath}/vulnscan`, icon: Bug },
        { title: 'Playbooks', path: `${basePath}/playbooks`, icon: BookOpen },
        { title: 'SafePass', path: `${basePath}/safepass`, icon: Key, isNew: true },
      ]
    },
    {
      title: 'v4.0 Features',
      icon: Crosshair,
      items: [
        { title: 'Honeypots', path: `${basePath}/honeypots`, icon: Crosshair, isNew: true },
        { title: 'Continuous Monitor', path: `${basePath}/continuous-monitoring`, icon: Activity, isNew: true },
        { title: 'Traffic Analysis', path: `${basePath}/traffic-analysis`, icon: Wifi, isNew: true },
      ]
    },
    {
      title: 'Operations',
      icon: Wrench,
      items: [
        { title: 'Patch Management', path: `${basePath}/patches`, icon: Wrench },
        { title: 'Backup Monitoring', path: `${basePath}/backups`, icon: HardDrive },
        { title: 'Network Topology', path: `${basePath}/network`, icon: Network },
        { title: 'Alerting', path: `${basePath}/alerting`, icon: Bell },
        { title: 'Advanced Alerting', path: `${basePath}/advanced-alerting`, icon: Bell },
        { title: 'Agent Analytics', path: `${basePath}/agent-analytics`, icon: Activity },
        { title: 'Scheduled Reports', path: `${basePath}/scheduled-reports`, icon: FileText },
      ]
    },
    {
      title: 'Compliance',
      icon: FileCheck,
      items: [
        { title: 'Compliance Auditor', path: `${basePath}/compliance`, icon: FileCheck },
        { title: 'Scorecard', path: `${basePath}/scorecard`, icon: CheckSquare },
      ]
    },
    {
      title: 'Reporting',
      icon: BarChart3,
      items: [
        { title: 'Reports', path: `${basePath}/reports`, icon: BarChart3 },
        { title: 'Report Builder', path: `${basePath}/report-builder`, icon: FileText },
      ]
    },
    {
      title: 'Admin',
      icon: Settings,
      items: [
        { title: 'Multi-Tenant', path: `${basePath}/tenants`, icon: Building2 },
        { title: 'SafePass Admin', path: `${basePath}/safepass-admin`, icon: Users },
        { title: 'API Marketplace', path: `${basePath}/marketplace`, icon: Store },
        { title: 'Setup', path: `${basePath}/setup`, icon: Settings },
      ]
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isSectionActive = (section: NavSection) => {
    return section.items.some(item => isActive(item.path));
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) 
        ? prev.filter(s => s !== title)
        : [...prev, title]
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-white hover:bg-white/10"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-[#0d0d12] border-r border-white/10 z-40 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={cn(
            "flex items-center gap-3 p-4 border-b border-white/10",
            isCollapsed && "justify-center"
          )}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20">
              <Shield className="h-6 w-6 text-cyan-400" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Vanguard</h1>
                <p className="text-xs text-white/40">Security Platform</p>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navSections.map((section) => (
              <Collapsible
                key={section.title}
                open={!isCollapsed && (openSections.includes(section.title.toLowerCase()) || isSectionActive(section))}
                onOpenChange={() => toggleSection(section.title.toLowerCase())}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200",
                      "hover:bg-white/5",
                      isSectionActive(section) ? "text-cyan-400" : "text-white/70",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <section.icon className={cn("h-5 w-5 shrink-0", isCollapsed && "h-6 w-6")} />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium text-sm flex-1 text-left">{section.title}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform text-white/40",
                          openSections.includes(section.title.toLowerCase()) && "rotate-180"
                        )} />
                      </>
                    )}
                  </button>
                </CollapsibleTrigger>
                
                {!isCollapsed && (
                  <CollapsibleContent className="pl-4 space-y-0.5 mt-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          "hover:bg-white/5",
                          isActive(item.path) 
                            ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-400 border border-cyan-500/30" 
                            : "text-white/60"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                        {item.isNew && (
                          <span className="ml-auto text-[10px] bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full font-medium">
                            NEW
                          </span>
                        )}
                        {item.badge && (
                          <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </CollapsibleContent>
                )}
              </Collapsible>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-3 border-t border-white/10 space-y-2">
            {/* Back to UltriumAI */}
            <a
              href="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-white/40 hover:bg-white/5 hover:text-white/70",
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
                "w-full justify-start gap-3 text-white/40 hover:text-white/70 hover:bg-white/5",
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
