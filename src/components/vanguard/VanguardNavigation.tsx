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
  Globe,
  Sparkles,
  Wand2,
  FileText,
  Bot,
  Target,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVanguardBasePath } from '@/utils/subdomain';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import vanguardLogo from '@/assets/vanguard-logo.png';
import { ModuleLogo, ModuleName } from './ModuleLogo';
import { CollapsibleNavGroup } from './CollapsibleNavGroup';

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavGroup {
  header: string;
  description: string;
  tooltip: string;
  module: ModuleName;
  dashboardPath: string;
  items: NavItem[];
}

export function VanguardNavigation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const basePath = getVanguardBasePath();

  // Vanguard Command (Dashboard) - standalone item
  const commandItem: NavItem = { 
    title: 'Vanguard Command', 
    path: `${basePath}/dashboard`, 
    icon: LayoutDashboard 
  };

  // Navigation groups with branded headers - ordered per specification
  const navGroups: NavGroup[] = [
    {
      header: 'VANGUARD HORIZON',
      description: 'Operational visibility & uptime',
      tooltip: 'Operational visibility and health monitoring across all devices and environments.',
      module: 'horizon',
      dashboardPath: `${basePath}/rmm`,
      items: [
        { title: 'RMM Dashboard', path: `${basePath}/rmm`, icon: Monitor },
        { title: 'Devices', path: `${basePath}/devices`, icon: Monitor },
        { title: 'Patches', path: `${basePath}/patches`, icon: Package },
        { title: 'Assets', path: `${basePath}/assets`, icon: Package },
        { title: 'Scripts', path: `${basePath}/scripts`, icon: FileText },
        { title: 'Backups', path: `${basePath}/backups`, icon: Package },
        { title: 'Automation', path: `${basePath}/automation`, icon: Settings },
      ]
    },
    {
      header: 'VANGUARD PURSUIT',
      description: 'Threat detection & intelligence',
      tooltip: 'Actively detects, analyzes, and prioritizes security threats in real time.',
      module: 'pursuit',
      dashboardPath: `${basePath}/alerts`,
      items: [
        { title: 'Alerts', path: `${basePath}/alerts`, icon: Bell },
        { title: 'Sentinel (M365)', path: `${basePath}/sentinel`, icon: Shield, badge: 'NEW' },
        { title: 'Threats', path: `${basePath}/threats`, icon: Target },
        { title: 'SOC', path: `${basePath}/soc`, icon: Activity },
      ]
    },
    {
      header: 'VANGUARD RESPONSE',
      description: 'Incident handling & remediation',
      tooltip: 'Manages incidents, tickets, and remediation workflows from detection to resolution.',
      module: 'response',
      dashboardPath: `${basePath}/helpdesk`,
      items: [
        { title: 'Helpdesk', path: `${basePath}/helpdesk`, icon: Ticket },
        { title: 'Tickets', path: `${basePath}/tickets`, icon: Ticket },
        { title: 'Sites', path: `${basePath}/customers`, icon: Building2 },
        { title: 'Co-Managed IT', path: `${basePath}/comanaged`, icon: Users, badge: 'NEW' },
        { title: 'SLA Management', path: `${basePath}/sla`, icon: Activity },
        { title: 'Workflows', path: `${basePath}/workflows`, icon: Settings },
        { title: 'Email Integration', path: `${basePath}/email-integration`, icon: Bell },
        { title: 'Time & Billing', path: `${basePath}/time-billing`, icon: CreditCard },
        { title: 'CSAT Surveys', path: `${basePath}/csat`, icon: Gift },
      ]
    },
    {
      header: 'VANGUARD RECON',
      description: 'Asset discovery & mapping',
      tooltip: 'Discovers and maps devices, networks, and infrastructure for full environment awareness.',
      module: 'recon',
      dashboardPath: `${basePath}/network`,
      items: [
        { title: 'Network Discovery', path: `${basePath}/network`, icon: Network },
        { title: 'Recon Hardware', path: `${basePath}/recon`, icon: Package },
      ]
    },
    {
      header: 'VANGUARD ATLAS',
      description: 'Knowledge & documentation',
      tooltip: 'Centralized knowledge, SOPs, and documentation to guide operations and response.',
      module: 'atlas',
      dashboardPath: `${basePath}/atlas`,
      items: [
        { title: 'Knowledge Base', path: `${basePath}/atlas`, icon: BookOpen },
      ]
    },
    {
      header: 'VANGUARD LEDGER',
      description: 'Compliance & reporting',
      tooltip: 'Compliance-ready reporting, audit trails, and historical operational records.',
      module: 'ledger',
      dashboardPath: `${basePath}/reports`,
      items: [
        { title: 'Reports Dashboard', path: `${basePath}/reports`, icon: BarChart3 },
        { title: 'Helpdesk Reports', path: `${basePath}/helpdesk-reports`, icon: Ticket },
        { title: 'Security Analytics', path: `${basePath}/security-reports`, icon: Shield },
        { title: 'Scheduled Scans', path: `${basePath}/scheduled-scans`, icon: Activity },
        { title: 'Compliance', path: `${basePath}/compliance-reports`, icon: FileText },
        { title: 'Attack Paths', path: `${basePath}/attack-paths`, icon: Target },
      ]
    },
    {
      header: 'VANGUARD CORTEX',
      description: 'AI-powered operations',
      tooltip: 'AI-assisted insights and decision support across the Vanguard platform.',
      module: 'cortex',
      dashboardPath: `${basePath}/cortex`,
      items: [
        { title: 'Cortex Hub', path: `${basePath}/cortex`, icon: Sparkles },
        { title: 'AI Summarizer', path: `${basePath}/cortex-summarizer`, icon: FileText },
        { title: 'Pattern Detection', path: `${basePath}/cortex-patterns`, icon: Activity },
        { title: 'KB Generator', path: `${basePath}/cortex-kb`, icon: Wand2 },
        { title: 'Smart Router', path: `${basePath}/cortex-router`, icon: Network },
        { title: 'AI Analytics', path: `${basePath}/cortex-analytics`, icon: BarChart3 },
      ]
    },
  ];

  // Additional standalone items
  const additionalItems: NavItem[] = [
    { title: 'MSP Billing', path: `${basePath}/msp-billing`, icon: CreditCard },
    { title: 'Cortex Hub', path: `${basePath}/cortex`, icon: Sparkles, badge: 'NEW' },
    { title: 'Integrations', path: `${basePath}/integrations`, icon: Network, badge: 'NEW' },
    { title: 'Theme Editor', path: `${basePath}/theme-editor`, icon: Wand2 },
    { title: 'Customer Portal', path: `${basePath}/portal`, icon: Globe },
    { title: 'Portal App', path: `${basePath}/portal/download`, icon: Monitor },
    { title: 'Admin', path: `${basePath}/admin`, icon: Settings },
    { title: 'Refer a Friend', path: `${basePath}/referrals`, icon: Gift },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderNavItem = (item: NavItem) => {
    const navContent = (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200",
          "hover:bg-gradient-to-r hover:from-cyan-500/15 hover:via-blue-500/10 hover:to-purple-500/15 text-slate-400 hover:text-cyan-300",
          isActive(item.path) && "bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/20 text-cyan-400 border-l-2 border-cyan-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive(item.path) && "text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]"
        )} />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="text-[10px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white px-2 py-0.5 rounded-full font-bold shadow-lg shadow-purple-500/40 tracking-wide">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>
            {navContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black border-cyan-500/40 text-slate-200">
            <p className="text-xs">{item.title}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return navContent;
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

      {/* Sidebar - Pure Black Vanguard Theme with Vivid Cyan & Purple Accents */}
      <aside
        data-tour="vanguard-sidebar"
        className={cn(
          "fixed left-0 top-0 h-full bg-black border-r border-cyan-500/30 z-40 transition-all duration-300 shadow-2xl shadow-purple-500/5",
          isCollapsed ? "w-14" : "w-56",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section - Vanguard Logo with Gradient Glow */}
          <div className={cn(
            "flex items-center justify-center px-4 py-4 border-b border-cyan-500/30 bg-gradient-to-b from-purple-500/5 via-cyan-500/5 to-transparent",
            isCollapsed && "px-2"
          )}>
            {isCollapsed ? (
              <Shield className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
            ) : (
              <img 
                src={vanguardLogo} 
                alt="Vanguard" 
                className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              />
            )}
          </div>

          {/* Collapse Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-16 h-6 w-6 rounded-full bg-black border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 z-50"
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>

          {/* Navigation Items */}
          <nav className="flex-1 py-3 overflow-y-auto">
            {/* Command Palette Trigger */}
            {!isCollapsed && (
              <button
                onClick={() => {
                  const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                  document.dispatchEvent(event);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 mb-2 text-sm text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all rounded-md mx-1"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">⌘K</kbd>
              </button>
            )}
            
            {/* Vanguard Command */}
            <TooltipProvider delayDuration={300}>
              {renderNavItem(commandItem)}

              {/* Grouped Navigation with Collapsible Groups */}
              {navGroups.map((group) => (
                <CollapsibleNavGroup
                  key={group.header}
                  header={group.header}
                  description={group.description}
                  tooltip={group.tooltip}
                  module={group.module}
                  dashboardPath={group.dashboardPath}
                  items={group.items}
                  isCollapsed={isCollapsed}
                  onMobileClose={() => setIsMobileOpen(false)}
                />
              ))}

              {/* Divider */}
              <div className="my-4 border-t border-cyan-500/10" />

              {/* Additional Items */}
              {additionalItems.map(renderNavItem)}
            </TooltipProvider>
          </nav>

          {/* Footer */}
          <div className={cn(
            "p-4 border-t border-cyan-500/30 bg-gradient-to-t from-purple-500/5 via-cyan-500/5 to-transparent",
            isCollapsed && "p-2 flex justify-center"
          )}>
            {isCollapsed ? (
              <Shield className="h-4 w-4 text-purple-400 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield className="h-3.5 w-3.5 text-purple-400 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
                <span>Powered by <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-medium">Ultrium</span></span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
