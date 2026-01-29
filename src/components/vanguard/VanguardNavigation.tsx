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
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVanguardBasePath } from '@/utils/subdomain';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import vanguardLogo from '@/assets/vanguard-logo.png';

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
  items: NavItem[];
}

export function VanguardNavigation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
      tooltip: 'RMM, endpoint management, and availability monitoring',
      items: [
        { title: 'Devices', path: `${basePath}/devices`, icon: Monitor },
        { title: 'Patches', path: `${basePath}/patches`, icon: Package },
      ]
    },
    {
      header: 'VANGUARD PURSUIT',
      description: 'Threat detection & intelligence',
      tooltip: 'Security alerts, threat hunting, and SOC operations',
      items: [
        { title: 'Alerts', path: `${basePath}/alerts`, icon: Bell },
        { title: 'Threats', path: `${basePath}/threats`, icon: Target },
        { title: 'SOC', path: `${basePath}/soc`, icon: Activity },
      ]
    },
    {
      header: 'VANGUARD RESPONSE',
      description: 'Incident handling & remediation',
      tooltip: 'Service desk, ticketing, and customer management',
      items: [
        { title: 'Tickets', path: `${basePath}/tickets`, icon: Ticket },
        { title: 'Customers', path: `${basePath}/customers`, icon: Building2 },
      ]
    },
    {
      header: 'VANGUARD RECON',
      description: 'Asset discovery & mapping',
      tooltip: 'Network discovery and infrastructure visualization',
      items: [
        { title: 'Network Discovery', path: `${basePath}/network`, icon: Network },
      ]
    },
    {
      header: 'VANGUARD ATLAS',
      description: 'Knowledge & documentation',
      tooltip: 'Knowledge base, SOPs, and runbooks',
      items: [
        { title: 'Knowledge Base', path: `${basePath}/knowledge`, icon: BookOpen },
      ]
    },
    {
      header: 'VANGUARD LEDGER',
      description: 'Compliance & reporting',
      tooltip: 'Security reports, compliance frameworks, and analytics',
      items: [
        { title: 'Reports', path: `${basePath}/reports`, icon: BarChart3 },
      ]
    },
    {
      header: 'VANGUARD CORTEX',
      description: 'AI-powered operations',
      tooltip: 'AI Copilot for intelligent automation and insights',
      items: [
        { title: 'AI Dashboard', path: `${basePath}/ai-dashboard`, icon: Bot, badge: 'AI' },
        { title: 'KB Generator', path: `${basePath}/ai-knowledge`, icon: Wand2 },
        { title: 'Session Summaries', path: `${basePath}/ai-sessions`, icon: FileText },
        { title: 'AI Analytics', path: `${basePath}/ai-analytics`, icon: Sparkles },
      ]
    },
  ];

  // Additional standalone items
  const additionalItems: NavItem[] = [
    { title: 'Billing', path: `${basePath}/billing`, icon: CreditCard },
    { title: 'Customer Portal', path: `${basePath}/portal`, icon: Globe },
    { title: 'Portal App', path: `${basePath}/portal/download`, icon: Monitor },
    { title: 'Admin', path: `${basePath}/admin`, icon: Settings },
    { title: 'Refer a Friend', path: `${basePath}/referrals`, icon: Gift },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={() => setIsMobileOpen(false)}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
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
  );

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
            {/* Vanguard Command */}
            {renderNavItem(commandItem)}

            {/* Grouped Navigation */}
            {navGroups.map((group) => (
              <div key={group.header} className="mt-4">
                {/* Section Header with Tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="px-4 py-1.5 cursor-help">
                      <span className="text-[10px] font-semibold tracking-wider text-cyan-500/80 block">
                        {group.header}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">
                        {group.description}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 border-cyan-500/30 text-slate-200">
                    <p className="text-xs max-w-[200px]">{group.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
                {/* Section Items */}
                {group.items.map(renderNavItem)}
              </div>
            ))}

            {/* Divider */}
            <div className="my-4 border-t border-cyan-500/10" />

            {/* Additional Items */}
            {additionalItems.map(renderNavItem)}
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
