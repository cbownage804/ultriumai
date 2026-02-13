import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  ArrowLeftFromLine,
  ChevronRight,
  Search,
  Users,
  ClipboardCheck,
  Crosshair,
  AlertTriangle,
  Calendar,
  Clock,
  ClipboardList,
  Key,
  Upload,
  Power,
  Bug,
  ShieldCheck,
  Link2,
  Brain,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVanguardBasePath } from '@/utils/subdomain';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import vanguardLogo from '@/assets/vanguard-logo.png';
import { ModuleLogo, ModuleName } from './ModuleLogo';
import { CollapsibleNavGroup, NavSubGroup } from './CollapsibleNavGroup';
import { SitesNavSection } from './SitesNavSection';
import { AppSwitcher } from '@/components/AppSwitcher';

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
  subGroups?: NavSubGroup[];
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
      ],
      // Sites section is rendered separately via SitesNavSection
      subGroups: [
        {
          label: 'Devices',
          icon: Monitor,
          items: [
            { title: 'All Devices', path: `${basePath}/devices`, icon: Monitor },
          ],
        },
        {
          label: 'Global Tools',
          icon: Settings,
          items: [
            { title: 'Patches', path: `${basePath}/patches`, icon: Package },
            { title: 'Assets', path: `${basePath}/assets`, icon: Package },
            { title: 'Scripts', path: `${basePath}/scripts`, icon: FileText },
            { title: 'Automation', path: `${basePath}/automation`, icon: Settings },
          ],
        },
        {
          label: 'Setup',
          icon: Settings,
          items: [
            { title: 'Alerting', path: `${basePath}/rmm/notifications`, icon: Bell },
            { title: 'Patch Policy', path: `${basePath}/rmm/patch-scheduling`, icon: Calendar },
            { title: 'Security', path: `${basePath}/rmm/security-baselines`, icon: ShieldCheck },
            { title: 'Integrations', path: `${basePath}/rmm/psa-sync`, icon: Link2 },
            { title: 'Access Control', path: `${basePath}/rmm/rbac`, icon: Key },
            { title: 'Reports', path: `${basePath}/rmm/executive-dashboard`, icon: BarChart3 },
          ],
        },
      ],
    },
    {
      header: 'VANGUARD SENTINEL',
      description: 'M365 security & SaaS monit...',
      tooltip: 'Microsoft 365 security monitoring, SaaS alerts, and cloud identity protection.',
      module: 'sentinel',
      dashboardPath: `${basePath}/sentinel`,
      items: [
        { title: 'Sentinel Dashboard', path: `${basePath}/sentinel`, icon: Shield },
      ],
      subGroups: [
        {
          label: 'Monitoring',
          icon: Activity,
          items: [
            { title: 'Security Alerts', path: `${basePath}/sentinel/alerts`, icon: AlertTriangle },
          ],
        },
        {
          label: 'Tenants',
          icon: Building2,
          items: [
            { title: 'M365 Tenants', path: `${basePath}/sentinel/tenants`, icon: Building2 },
            { title: 'Google Workspace', path: `${basePath}/sentinel/gws`, icon: Globe },
          ],
        },
        {
          label: 'Intelligence',
          icon: Brain,
          items: [
            { title: 'AI Triage', path: `${basePath}/sentinel/ai-triage`, icon: Brain },
            { title: 'Alert Rules', path: `${basePath}/sentinel/rules`, icon: Settings },
          ],
        },
      ],
    },
    {
      header: 'VANGUARD PURSUIT',
      description: 'Threat detection & intelligence',
      tooltip: 'Actively detects, analyzes, and prioritizes security threats in real time.',
      module: 'pursuit',
      dashboardPath: `${basePath}/alerts`,
      items: [
        { title: 'Alerts', path: `${basePath}/alerts`, icon: Bell },
        { title: 'Threats', path: `${basePath}/threats`, icon: Target },
        { title: 'SOC', path: `${basePath}/soc`, icon: Activity },
      ],
      subGroups: [
        {
          label: 'Detection',
          icon: Shield,
          items: [
            { title: 'Threat Hunting', path: `${basePath}/pursuit/threat-hunting`, icon: Crosshair },
            { title: 'Attack Chains', path: `${basePath}/pursuit/attack-chains`, icon: Network },
            { title: 'IOC Management', path: `${basePath}/pursuit/ioc`, icon: Target },
            { title: 'YARA Rules', path: `${basePath}/pursuit/yara`, icon: FileText },
          ],
        },
        {
          label: 'Intelligence',
          icon: Brain,
          items: [
            { title: 'Threat Intel', path: `${basePath}/pursuit/intel`, icon: Globe },
            { title: 'Cross-Client', path: `${basePath}/pursuit/cross-client`, icon: Network, badge: 'NEW' },
            { title: 'Forensics', path: `${basePath}/pursuit/forensics`, icon: Search },
            { title: 'Reports', path: `${basePath}/pursuit/reports`, icon: BarChart3 },
          ],
        },
        {
          label: 'Protection',
          icon: ShieldCheck,
          items: [
            { title: 'Ransomware Defense', path: `${basePath}/pursuit/ransomware`, icon: Shield },
            { title: 'Network Security', path: `${basePath}/pursuit/network`, icon: Network },
            { title: 'Quarantine', path: `${basePath}/pursuit/quarantine`, icon: Bug },
          ],
        },
        {
          label: 'Configuration',
          icon: Settings,
          items: [
            { title: 'Response Actions', path: `${basePath}/pursuit/response-actions`, icon: Power },
            { title: 'Automation Policies', path: `${basePath}/pursuit/automation`, icon: Settings },
            { title: 'Agent Testing', path: `${basePath}/pursuit/agent-testing`, icon: Bug },
          ],
        },
      ],
    },
    {
      header: 'VANGUARD RESPONSE',
      description: 'Incident handling & remediation',
      tooltip: 'Manages incidents, tickets, and remediation workflows from detection to resolution.',
      module: 'response',
      dashboardPath: `${basePath}/helpdesk`,
      items: [
        { title: 'Helpdesk', path: `${basePath}/helpdesk`, icon: Ticket },
      ],
      subGroups: [
        {
          label: 'Service Desk',
          icon: Ticket,
          items: [
            { title: 'Tickets', path: `${basePath}/tickets`, icon: Ticket },
            { title: 'Co-Managed IT', path: `${basePath}/comanaged`, icon: Users, badge: 'NEW' },
          ],
        },
        {
          label: 'Operations',
          icon: Settings,
          items: [
            { title: 'SLA Management', path: `${basePath}/sla`, icon: Activity },
            { title: 'Workflows', path: `${basePath}/workflows`, icon: Settings },
            { title: 'Email Integration', path: `${basePath}/email-integration`, icon: Bell },
            { title: 'Time & Billing', path: `${basePath}/time-billing`, icon: CreditCard },
            { title: 'CSAT Surveys', path: `${basePath}/csat`, icon: Gift },
          ],
        },
      ],
    },
    {
      header: 'VANGUARD RECON',
      description: 'Pentesting, vuln scanning & discovery',
      tooltip: 'Full pentesting workflows, vulnerability scanning, network discovery, and Recon Unit management.',
      module: 'recon',
      dashboardPath: `${basePath}/pentest`,
      items: [
        { title: 'Pentest Dashboard', path: `${basePath}/pentest`, icon: Crosshair },
        { title: 'Vuln Findings', path: `${basePath}/vuln-findings`, icon: AlertTriangle },
        { title: 'Scan Schedules', path: `${basePath}/scan-schedules`, icon: Calendar },
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
      ],
      subGroups: [
        {
          label: 'Reports',
          icon: FileText,
          items: [
            { title: 'Helpdesk Reports', path: `${basePath}/helpdesk-reports`, icon: Ticket },
            { title: 'Security Analytics', path: `${basePath}/security-reports`, icon: Shield },
            { title: 'Compliance', path: `${basePath}/compliance-reports`, icon: FileText },
            { title: 'Attack Paths', path: `${basePath}/attack-paths`, icon: Target },
            { title: 'Scheduled Scans', path: `${basePath}/scheduled-scans`, icon: Activity },
          ],
        },
      ],
    },
    {
      header: 'VANGUARD COMPLY',
      description: 'Compliance & audit readiness',
      tooltip: 'Automated compliance monitoring, evidence collection, and audit-ready reporting across SOC 2, HIPAA, ISO 27001, and more.',
      module: 'comply',
      dashboardPath: `${basePath}/comply`,
      items: [
        { title: 'Comply Dashboard', path: `${basePath}/comply`, icon: ClipboardCheck },
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
      ],
      subGroups: [
        {
          label: 'AI Tools',
          icon: Bot,
          items: [
            { title: 'AI Summarizer', path: `${basePath}/cortex-summarizer`, icon: FileText },
            { title: 'Pattern Detection', path: `${basePath}/cortex-patterns`, icon: Activity },
            { title: 'KB Generator', path: `${basePath}/cortex-kb`, icon: Wand2 },
            { title: 'Smart Router', path: `${basePath}/cortex-router`, icon: Network },
            { title: 'AI Analytics', path: `${basePath}/cortex-analytics`, icon: BarChart3 },
          ],
        },
      ],
    },
  ];

  // SafeSuite quick-launch items
  const safeSuiteItems: NavItem[] = [
    { title: 'Dark Web Monitor', path: '/safesuite/web', icon: Globe, badge: 'SafeWeb' },
    { title: 'Password Vault', path: '/safesuite/pass', icon: Key, badge: 'SafePass' },
  ];

  // Business & Partner items
  const businessItems: NavItem[] = [
    { title: 'Partner Program', path: `${basePath}/partner-program`, icon: Crown, badge: 'NEW' },
    { title: 'White-Label', path: `${basePath}/whitelabel`, icon: Wand2 },
    { title: 'Client Provisioning', path: `${basePath}/client-provisioning`, icon: Upload },
    { title: 'Reseller Billing', path: `${basePath}/reseller-billing`, icon: CreditCard },
    { title: 'MSP Billing', path: `${basePath}/msp-billing`, icon: CreditCard },
    { title: 'Marketing Kit', path: `${basePath}/marketing-kit`, icon: FileText },
  ];

  // Platform & Settings items
  const platformItems: NavItem[] = [
    { title: 'Integrations', path: `${basePath}/integrations`, icon: Network },
    { title: 'Customer Portal', path: `${basePath}/portal`, icon: Globe },
    { title: 'Portal App', path: `${basePath}/portal/download`, icon: Monitor },
    { title: 'Theme Editor', path: `${basePath}/theme-editor`, icon: Wand2 },
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
              <div className="flex items-center justify-between w-full">
                <img 
                  src={vanguardLogo} 
                  alt="Vanguard" 
                  className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                />
                <AppSwitcher />
              </div>
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

          {/* Back to Product Hub */}
          {!isCollapsed && (
            <NavLink
              to="/hub"
              className="flex items-center gap-2 mx-3 mb-2 px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all rounded-md"
            >
              <ArrowLeftFromLine className="h-3.5 w-3.5" />
              <span>Back to Product Hub</span>
            </NavLink>
          )}
          {isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/hub"
                  className="flex items-center justify-center mx-1 mb-2 py-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all rounded-md"
                >
                  <ArrowLeftFromLine className="h-4 w-4" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black border-cyan-500/40 text-slate-200">
                <p className="text-xs">Back to Product Hub</p>
              </TooltipContent>
            </Tooltip>
          )}

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
                  subGroups={group.subGroups}
                  isCollapsed={isCollapsed}
                  onMobileClose={() => setIsMobileOpen(false)}
                >
                  {/* Inject Sites section inside Horizon */}
                  {group.module === 'horizon' && !isCollapsed && (
                    <SitesNavSection onMobileClose={() => setIsMobileOpen(false)} />
                  )}
                </CollapsibleNavGroup>
              ))}

              {/* SafeSuite Quick Launch */}
              {!isCollapsed && (
                <div className="mt-3">
                  <div className="px-4 py-1.5 text-[10px] font-bold tracking-wider text-violet-400/70 uppercase">
                    SafeSuite Tools
                  </div>
                  {safeSuiteItems.map(renderNavItem)}
                </div>
              )}

              {/* Business & Partner */}
              {!isCollapsed && (
                <div className="mt-3">
                  <div className="px-4 py-1.5 text-[10px] font-bold tracking-wider text-slate-500/70 uppercase">
                    Business
                  </div>
                  {businessItems.map(renderNavItem)}
                </div>
              )}

              {/* Platform & Settings */}
              {!isCollapsed && (
                <div className="mt-3">
                  <div className="px-4 py-1.5 text-[10px] font-bold tracking-wider text-slate-500/70 uppercase">
                    Platform
                  </div>
                  {platformItems.map(renderNavItem)}
                </div>
              )}
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
                <span>Powered by <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-medium">Vanguard</span></span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
