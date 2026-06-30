/**
 * Wrayth Layout — Ray-first navigation.
 *
 * Sidebar grammar: Home / Ray, then Protection (Passwords, Threats,
 * Exposure, Identity, Devices, Reports), then Workspace, then bottom
 * (Settings, Billing, Account, Admin). Old product names live only in DB and
 * route paths.
 */

import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWraythSubscription } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS } from '@/config/safeSuiteTiers';
import { isWraythDomain } from '@/utils/subdomain';
import { safesuiteLogo } from '@/components/safesuite/SafeSuiteProductIcons';
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
  Eye,
  KeyRound,
  ShieldAlert,
  Globe,
  UserCircle2,
  Monitor,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  Shield,
  ShieldCheck,
  Crown,
  Lock,
  Sparkles,
  Coins,
  Users,
  Building2,
  Share2,
  Plug,
  Code2,
  Activity,
} from 'lucide-react';
import { AppSwitcher } from '@/components/AppSwitcher';
import { HelpCenter } from '@/components/onboarding/HelpCenter';
import { cn } from '@/lib/utils';
import { FloatingSafeAssist } from '@/components/safeassist/FloatingSafeAssist';
import { AskRayPalette } from '@/components/safeassist/AskRayPalette';
import { FloatingSafeAssistProvider } from '@/contexts/FloatingSafeAssistContext';
import { MFAOnboardingGate } from '@/components/safesuite/MFAOnboardingGate';
import { RayContextProvider } from '@/components/ray/RayContext';
import { SidebarBriefing } from '@/components/ray/SidebarBriefing';

function getWraythPath(path: string): string {
  return isWraythDomain() ? path : `/app${path}`;
}

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: 'safepass' | 'safescan' | 'safeweb' | null;
  badge?: string;
  external?: boolean;
};

type NavSection = {
  id: string;
  label?: string;
  items: NavItem[];
};

function getSections(): NavSection[] {
  return [
    {
      id: 'main',
      items: [
        { label: 'Home', path: getWraythPath('/dashboard'), icon: Home },
        { label: 'Ray', path: getWraythPath('/ray'), icon: Eye },
        { label: 'Timeline', path: getWraythPath('/timeline'), icon: Activity },
      ],
    },
    {
      id: 'protection',
      label: 'Protection',
      items: [
        { label: 'Passwords', path: getWraythPath('/pass'), icon: KeyRound, feature: 'safepass' },
        { label: '2FA',       path: getWraythPath('/mfa'),  icon: ShieldCheck, feature: 'safepass' },
        { label: 'Threats',   path: getWraythPath('/scan'), icon: ShieldAlert, feature: 'safescan' },
        { label: 'Exposure',  path: getWraythPath('/web'),  icon: Globe, feature: 'safeweb' },
        { label: 'Identity',  path: getWraythPath('/identity'), icon: UserCircle2, badge: 'SOON' },
        { label: 'Devices',   path: getWraythPath('/devices'),  icon: Monitor, badge: 'SOON' },
        { label: 'Reports',   path: getWraythPath('/reports'),  icon: FileText, badge: 'SOON' },
      ],
    },
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        { label: 'Organizations', path: getWraythPath('/pass/users'), icon: Building2 },
        { label: 'Team',          path: getWraythPath('/pass/team'),  icon: Users },
        { label: 'Shared',        path: getWraythPath('/pass/shared'), icon: Share2 },
        { label: 'API',           path: getWraythPath('/settings'),    icon: Code2, badge: 'SOON' },
        { label: 'Extensions',    path: getWraythPath('/pass/extension'), icon: Plug },
      ],
    },
  ];
}

function TierBadge({ tier }: { tier: string }) {
  const tierConfig = SAFESUITE_TIERS[tier as keyof typeof SAFESUITE_TIERS];
  const variants: Record<string, string> = {
    free: 'bg-muted text-muted-foreground',
    pro: 'bg-primary/10 text-primary border-primary/20',
    business: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };
  const icons: Record<string, React.ReactNode> = {
    free: <Shield className="h-3 w-3" />,
    pro: <Sparkles className="h-3 w-3" />,
    business: <Crown className="h-3 w-3" />,
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
  isLocked,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  isLocked: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors',
        'text-muted-foreground hover:bg-accent hover:text-foreground',
        isActive && 'bg-[hsl(262_60%_64%/0.08)] text-foreground',
        isLocked && 'opacity-60',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-[hsl(262_60%_70%)]')} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="text-[9px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-border/60 text-muted-foreground">
          {item.badge}
        </span>
      )}
      {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
    </Link>
  );
}

function Sidebar({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  const { tier, tierConfig } = useWraythSubscription();
  const { user } = useAuth();
  const sections = getSections();
  const landingPath = isWraythDomain() ? '/' : '/app';
  const isAdmin = user?.email?.endsWith('@ultriumai.com') && user?.email_confirmed_at != null;

  const isActive = (path: string) => {
    if (path.endsWith('/dashboard')) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="flex flex-col h-full bg-card border-r border-border">
      {/* Wordmark — single mark, white, vertically centered */}
      <div className="h-16 px-5 flex items-center border-b border-border">
        <Link to={landingPath} className="flex items-center" aria-label="Wrayth">
          <span className="text-[15px] font-light tracking-[0.42em] text-foreground select-none">
            WRAYTH
          </span>
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
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            {section.label && (
              <div className="px-3 mb-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const locked = item.feature ? !tierConfig.features[item.feature].enabled : false;
              return (
                <SideLink
                  key={item.path}
                  item={item}
                  isActive={isActive(item.path)}
                  isLocked={locked}
                  onClick={onItemClick}
                />
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border space-y-1">
        <SideLink item={{ label: 'Settings', path: getWraythPath('/settings'), icon: Settings }} isActive={isActive(getWraythPath('/settings'))} isLocked={false} onClick={onItemClick} />
        <SideLink item={{ label: 'Billing',  path: getWraythPath('/billing'),  icon: CreditCard }} isActive={isActive(getWraythPath('/billing'))} isLocked={false} onClick={onItemClick} />
        <SideLink item={{ label: 'AI Credits', path: '/credits', icon: Coins }} isActive={isActive('/credits')} isLocked={false} onClick={onItemClick} />
        {isAdmin && (
          <Link
            to="/admin"
            onClick={onItemClick}
            className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-orange-500 hover:bg-accent hover:text-orange-400 transition-colors"
          >
            <Crown className="h-4 w-4" />
            <span>Admin</span>
          </Link>
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
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="fixed top-0 left-0 h-full w-64 overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen w-full">
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
              <AppSwitcher />
              <HelpCenter />
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
      <FloatingSafeAssist />
    </div>
  );
}

export default function WraythLayout() {
  return (
    <MFAOnboardingGate>
      <FloatingSafeAssistProvider>
        <RayContextProvider>
          <WraythLayoutInner />
        </RayContextProvider>
      </FloatingSafeAssistProvider>
    </MFAOnboardingGate>
  );
}
