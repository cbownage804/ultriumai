/**
 * Wrayth Layout — tier-aware Ray-first navigation.
 *
 * Free/Pro users get a flat, minimal sidebar. Business/Enterprise users get
 * collapsible groups (Protection, Intelligence, +More) with localStorage-
 * persisted expansion state and a "Show all tools" toggle.
 */

import wraythBrandSidebar from '@/assets/wrayth-brand-full.png.asset.json';

import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWraythSubscription } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS, type WraythTier } from '@/config/safeSuiteTiers';
import { isWraythDomain } from '@/utils/subdomain';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Home,
  KeyRound,
  ShieldAlert,
  Globe,
  Monitor,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  Shield,
  ShieldCheck,
  Crown,
  Sparkles,
  Coins,
  Plug,
  Scale,
  ScanSearch,
  GitBranch,
  Network,
  Bug,
  Terminal,
  FileWarning,
  ClipboardCheck,
  Bot,
  ChevronDown,
  Eye,
  Building2,
  Cable,
  BarChart3,
} from 'lucide-react';
import { AppSwitcher } from '@/components/AppSwitcher';

import { cn } from '@/lib/utils';
import { AskRayPalette } from '@/components/ray/AskRayPalette';
import { FloatingRayChat } from '@/components/ray/FloatingRayChat';
import { RayPresence } from '@/components/ray/RayPresence';
import { RayContextProvider } from '@/components/ray/RayContext';
import { SidebarBriefing } from '@/components/ray/SidebarBriefing';

function getWraythPath(path: string): string {
  return isWraythDomain() ? path : `/app${path}`;
}

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  id: string;
  label?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: NavItem[];
};

function buildSections(tier: WraythTier): { top: NavGroup[]; bottom: NavItem[] } {
  const home: NavItem = { label: 'Home', path: getWraythPath('/dashboard'), icon: Home };
  const vault: NavItem = { label: 'Vault', path: getWraythPath('/passwords'), icon: KeyRound };
  const identity: NavItem = { label: 'Identity Monitoring', path: getWraythPath('/exposure'), icon: Globe };
  const threats = (label: string): NavItem => ({ label, path: getWraythPath('/threats'), icon: ShieldAlert });
  const devices: NavItem = { label: 'Devices', path: getWraythPath('/devices'), icon: Monitor };
  const ray: NavItem = { label: 'Ray', path: getWraythPath('/ray'), icon: Bot };
  const reports: NavItem = { label: 'Reports', path: getWraythPath('/reports'), icon: FileText };
  const billing: NavItem = { label: 'Billing', path: getWraythPath('/billing'), icon: CreditCard };
  const settings: NavItem = { label: 'Settings', path: getWraythPath('/settings'), icon: Settings };

  if (tier === 'free') {
    return {
      top: [{ id: 'main', items: [home, vault, identity, threats('Threat Check'), ray] }],
      bottom: [billing, settings],
    };
  }

  if (tier === 'pro') {
    return {
      top: [{ id: 'main', items: [home, vault, identity, threats('Threat Center'), devices, ray, reports] }],
      bottom: [billing, settings],
    };
  }

  // business / enterprise — grouped
  const protection: NavGroup = {
    id: 'protection',
    label: 'Protection',
    collapsible: true,
    defaultOpen: true,
    items: [vault, identity, threats('Threat Center'), devices],
  };
  const intelligence: NavGroup = {
    id: 'intelligence',
    label: 'Intelligence',
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: 'Overview', path: getWraythPath('/intelligence'), icon: Sparkles },
      { label: 'Investigations', path: getWraythPath('/intelligence/investigations'), icon: ScanSearch },
      { label: 'Script Analysis', path: getWraythPath('/intelligence/scripts'), icon: Terminal },
      { label: 'Malware Analysis', path: getWraythPath('/intelligence/malware'), icon: Bug },
      { label: 'Log Analysis', path: getWraythPath('/intelligence/logs'), icon: FileWarning },
      { label: 'Attack Paths', path: getWraythPath('/intelligence/attack-paths'), icon: GitBranch },
      { label: 'Graph', path: getWraythPath('/intelligence/graph'), icon: Network },
      { label: 'Policy Generator', path: getWraythPath('/intelligence/policies'), icon: ClipboardCheck },
      { label: 'Compliance', path: getWraythPath('/intelligence/compliance'), icon: ShieldCheck },
    ],
  };

  const topGroups: NavGroup[] = [
    { id: 'main', items: [home, ray] },
    protection,
    intelligence,
  ];

  const bottom: NavItem[] = [
    { label: 'Integrations', path: getWraythPath('/integrations'), icon: Plug },
  ];

  if (tier === 'enterprise') {
    topGroups.push({
      id: 'enterprise',
      label: 'Enterprise',
      collapsible: true,
      defaultOpen: false,
      items: [
        { label: 'Executive Dashboard', path: getWraythPath('/dashboard'), icon: BarChart3 },
        reports,
        { label: 'Organization Settings', path: getWraythPath('/org'), icon: Building2 },
        { label: 'Compliance Exports', path: getWraythPath('/intelligence/compliance'), icon: ClipboardCheck },
        { label: 'API / Automation', path: getWraythPath('/integrations'), icon: Cable },
      ],
    });
  } else {
    // business also gets Reports as a plain footer item
    bottom.push(reports);
  }

  bottom.push(billing);
  bottom.push({ label: 'Ray Credits', path: getWraythPath('/credits'), icon: Coins });
  bottom.push({ label: 'Trust Center', path: getWraythPath('/trust'), icon: Scale });
  bottom.push(settings);

  return { top: topGroups, bottom };
}

function TierBadge({ tier }: { tier: string }) {
  const tierConfig = SAFESUITE_TIERS[tier as keyof typeof SAFESUITE_TIERS];
  const variants: Record<string, string> = {
    free: 'bg-muted text-muted-foreground',
    pro: 'bg-primary/10 text-primary border-primary/20',
    business: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    enterprise: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  };
  const icons: Record<string, React.ReactNode> = {
    free: <Shield className="h-3 w-3" />,
    pro: <Sparkles className="h-3 w-3" />,
    business: <Crown className="h-3 w-3" />,
    enterprise: <Crown className="h-3 w-3" />,
  };
  return (
    <Badge variant="outline" className={cn('gap-1', variants[tier])}>
      {icons[tier]}
      {tierConfig?.name || 'Free'}
    </Badge>
  );
}

function SideLink({
  item,
  isActive,
  onClick,
  indent = false,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
  indent?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors',
        'text-muted-foreground hover:bg-accent hover:text-foreground',
        indent && 'pl-9',
        isActive && 'bg-[hsl(262_60%_64%/0.08)] text-foreground',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-[hsl(262_60%_70%)]')} />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );
}

const GROUP_STATE_KEY = 'wrayth.nav.groups.v1';

function loadGroupState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(GROUP_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function Sidebar({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  const { tier } = useWraythSubscription();
  const { user } = useAuth();
  const landingPath = isWraythDomain() ? '/' : '/app';
  const isAdmin = user?.email?.endsWith('@ultriumai.com') && user?.email_confirmed_at != null;

  const { top, bottom } = useMemo(() => buildSections(tier as WraythTier), [tier]);

  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(() => {
    const saved = loadGroupState();
    const initial: Record<string, boolean> = {};
    for (const g of top) {
      if (g.collapsible) initial[g.id] = saved[g.id] ?? g.defaultOpen ?? true;
    }
    return initial;
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(GROUP_STATE_KEY, JSON.stringify(groupOpen));
    } catch {
      /* ignore */
    }
  }, [groupOpen]);

  const isActive = (path: string) => {
    if (path.endsWith('/dashboard')) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleGroup = (id: string) => {
    setGroupOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isGrouped = tier === 'business' || tier === 'enterprise';

  return (
    <aside className="flex flex-col h-full bg-card border-r border-border">
      {/* Brand mark */}
      <div className="h-16 px-5 flex items-center justify-center border-b border-border">
        <Link to={landingPath} className="flex items-center" aria-label="Wrayth">
          <img
            src={wraythBrandSidebar.url}
            alt="Wrayth"
            className="h-7 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Ray briefing */}
      <SidebarBriefing />

      {/* Plan */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Current plan</span>
          <TierBadge tier={tier} />
        </div>
        {tier === 'free' && (
          <Link to={getWraythPath('/billing')}>
            <Button variant="outline" size="sm" className="w-full mt-2 gap-2 rounded-sm">
              <Sparkles className="h-3.5 w-3.5" /> Upgrade
            </Button>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {top.map((group) => {
          const open = !group.collapsible || showAll || groupOpen[group.id];
          return (
            <div key={group.id} className="space-y-1">
              {group.label && group.collapsible ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      open ? 'rotate-0' : '-rotate-90',
                    )}
                  />
                </button>
              ) : group.label ? (
                <div className="px-3 mb-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
                  {group.label}
                </div>
              ) : null}
              {open &&
                group.items.map((item) => (
                  <SideLink
                    key={item.path + item.label}
                    item={item}
                    isActive={isActive(item.path)}
                    onClick={onItemClick}
                    indent={!!group.label && group.collapsible}
                  />
                ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border space-y-1">
        {bottom.map((item) => (
          <SideLink
            key={item.path + item.label}
            item={item}
            isActive={isActive(item.path)}
            onClick={onItemClick}
          />
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            onClick={onItemClick}
            className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-yellow-500 hover:bg-accent hover:text-yellow-400 transition-colors"
          >
            <Crown className="h-4 w-4" />
            <span>Admin</span>
          </Link>
        )}
        {isGrouped && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-sm text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            {showAll ? 'Collapse groups' : 'Show all tools'}
          </button>
        )}
      </div>
    </aside>
  );
}

function WraythLayoutInner() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = user?.email?.split('@')[0].slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen flex bg-background relative">
      {/* Ambient violet — Ray's signature */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-[hsl(262_70%_55%/0.08)] blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-[hsl(252_70%_55%/0.06)] blur-[140px]" />
      </div>
      <div className="hidden lg:block w-64 flex-shrink-0 relative z-10">
        <div className="fixed top-0 left-0 h-full w-64 overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen w-full relative z-10">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border safe-area-inset-top">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] sm:w-64">
                <Sidebar onItemClick={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="hidden lg:block" />

            <div className="flex items-center gap-1 sm:gap-2">
              <RayPresence />
              <AppSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 min-h-[44px] px-2 sm:px-3">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm truncate max-w-[150px]">{user?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(getWraythPath('/settings'))} className="min-h-[44px]">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(getWraythPath('/billing'))} className="min-h-[44px]">
                    <CreditCard className="mr-2 h-4 w-4" /> Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive min-h-[44px]">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 safe-area-inset-bottom">
          <Outlet />
        </main>
      </div>

      <AskRayPalette />
      <FloatingRayChat />
    </div>
  );
}

export default function WraythLayout() {
  return (
    <RayContextProvider>
      <WraythLayoutInner />
    </RayContextProvider>
  );
}
