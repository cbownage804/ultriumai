/**
 * SafeSuite Layout - Unified layout for all SafeSuite products
 */

import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSafeSuiteSubscription } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS } from '@/config/safeSuiteTiers';
import { getSafeSuiteBasePath, isSafeSuiteDomain } from '@/utils/subdomain';
import { safeSuiteProducts, type SafeSuiteProductKey } from '@/components/safesuite/SafeSuiteProductIcons';
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  CreditCard,
  LogOut,
  Menu,
  Shield,
  Crown,
  Lock,
  ChevronRight,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Get the correct path for SafeSuite routes based on subdomain
 * On safesuite.ultriumai.com: /dashboard
 * On main domain: /safesuite/dashboard
 */
function getSafeSuitePath(path: string): string {
  const isSubdomain = isSafeSuiteDomain();
  if (isSubdomain) {
    return path; // Clean path like /dashboard
  }
  return `/safesuite${path}`; // Prefixed path like /safesuite/dashboard
}

const getNavItems = () => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: getSafeSuitePath('/dashboard'),
    icon: LayoutDashboard,
    productLogo: null as string | null,
    feature: null
  },
  {
    id: 'safepass',
    label: 'SafePass',
    path: getSafeSuitePath('/pass'),
    icon: null,
    productLogo: safeSuiteProducts.safepass.logo,
    feature: 'safepass' as const,
    subItems: [
      { label: 'Vault', path: getSafeSuitePath('/pass') },
      { label: 'Secure Notes', path: getSafeSuitePath('/pass/notes') },
      { label: 'Credit Cards', path: getSafeSuitePath('/pass/cards') },
      { label: 'Identity Profiles', path: getSafeSuitePath('/pass/identity') },
      { label: 'Password Health', path: getSafeSuitePath('/pass/health') },
      { label: 'User Management', path: getSafeSuitePath('/pass/users') },
      { label: 'Shared With Me', path: getSafeSuitePath('/pass/shared') },
      { label: 'Emergency Access', path: getSafeSuitePath('/pass/emergency') },
      { label: 'Breach Monitor', path: getSafeSuitePath('/pass/breach') },
      { label: 'Reminders', path: getSafeSuitePath('/pass/reminders') },
      { label: 'Browser Extension', path: getSafeSuitePath('/pass/extension') },
      { label: 'Import', path: getSafeSuitePath('/pass/import') },
      { label: 'Export', path: getSafeSuitePath('/pass/export') },
      { label: 'Team', path: getSafeSuitePath('/pass/team') },
      { label: 'Settings', path: getSafeSuitePath('/pass/settings') }
    ]
  },
  {
    id: 'safescan',
    label: 'SafeScan',
    path: getSafeSuitePath('/scan'),
    icon: null,
    productLogo: safeSuiteProducts.safescan.logo,
    feature: 'safescan' as const,
    subItems: [
      { label: 'Scanner', path: getSafeSuitePath('/scan') },
      { label: 'Settings', path: getSafeSuitePath('/scan/settings') }
    ]
  },
  {
    id: 'safeweb',
    label: 'SafeWeb',
    path: getSafeSuitePath('/web'),
    icon: null,
    productLogo: safeSuiteProducts.safeweb.logo,
    feature: 'safeweb' as const,
    subItems: [
      { label: 'Monitor', path: getSafeSuitePath('/web') },
      { label: 'Settings', path: getSafeSuitePath('/web/settings') }
    ]
  },
  {
    id: 'safetrack',
    label: 'SafeTrack',
    path: getSafeSuitePath('/track'),
    icon: null,
    productLogo: safeSuiteProducts.safetrack.logo,
    feature: 'safetrack' as const,
    subItems: [
      { label: 'Assets', path: getSafeSuitePath('/track') },
      { label: 'Settings', path: getSafeSuitePath('/track/settings') }
    ]
  }
];

function TierBadge({ tier }: { tier: string }) {
  const tierConfig = SAFESUITE_TIERS[tier as keyof typeof SAFESUITE_TIERS];
  
  const variants: Record<string, string> = {
    free: 'bg-muted text-muted-foreground',
    pro: 'bg-primary/10 text-primary border-primary/20',
    business: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  };

  const icons: Record<string, React.ReactNode> = {
    free: <Shield className="h-3 w-3" />,
    pro: <Sparkles className="h-3 w-3" />,
    business: <Crown className="h-3 w-3" />
  };

  return (
    <Badge variant="outline" className={cn('gap-1', variants[tier])}>
      {icons[tier]}
      {tierConfig?.name || 'Free'}
    </Badge>
  );
}

type NavSubItem = {
  label: string;
  path: string;
};

type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }> | null;
  productLogo: string | null;
  feature: 'safepass' | 'safescan' | 'safeweb' | 'safetrack' | null;
  subItems?: NavSubItem[];
};

function NavLink({
  item,
  isActive,
  isLocked,
  currentPath,
  onClick
}: {
  item: NavItem;
  isActive: boolean;
  isLocked: boolean;
  currentPath: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const hasSubItems = Boolean(item.subItems?.length);

  return (
    <div className="space-y-1">
      <Link
        to={item.path}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-primary/10 text-primary font-medium',
          isLocked && 'opacity-60'
        )}
      >
        {item.productLogo ? (
          <img src={item.productLogo} alt={item.label} className="h-6 w-6 rounded object-contain" />
        ) : Icon ? (
          <Icon className="h-5 w-5" />
        ) : null}
        <span className="flex-1">{item.label}</span>
        {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
        {isActive && (hasSubItems ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        ))}
      </Link>

      {hasSubItems && isActive && (
        <div className="ml-8 space-y-1">
          {item.subItems!.map((sub) => {
            const subActive = currentPath === sub.path;
            return (
              <Link
                key={sub.path}
                to={sub.path}
                onClick={onClick}
                className={cn(
                  'block px-3 py-1.5 rounded-md text-sm transition-colors',
                  'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  subActive && 'bg-primary/10 text-primary font-medium'
                )}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Sidebar({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  const { tier, tierConfig } = useSafeSuiteSubscription();
  const navItems = getNavItems();
  const landingPath = isSafeSuiteDomain() ? '/' : '/safesuite';

  const normalizedPath = isSafeSuiteDomain()
    ? location.pathname
    : location.pathname.replace(/^\/safesuite/, '');

  const appSettingsPath = normalizedPath.startsWith('/pass')
    ? getSafeSuitePath('/pass/settings')
    : normalizedPath.startsWith('/scan')
      ? getSafeSuitePath('/scan/settings')
      : normalizedPath.startsWith('/web')
        ? getSafeSuitePath('/web/settings')
        : normalizedPath.startsWith('/track')
          ? getSafeSuitePath('/track/settings')
          : null;

  return (
    <aside className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to={landingPath} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">SafeSuite</span>
        </Link>
      </div>

      {/* Tier indicator */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Plan</span>
          <TierBadge tier={tier} />
        </div>
        {tier === 'free' && (
          <Link to={getSafeSuitePath('/billing')}>
            <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Button>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== getSafeSuitePath('/dashboard') && location.pathname.startsWith(item.path));
          const isLocked = item.feature && !tierConfig.features[item.feature].enabled;

          return (
            <NavLink
              key={item.id}
              item={item}
              isActive={isActive}
              isLocked={isLocked}
              currentPath={location.pathname}
              onClick={onItemClick}
            />
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="p-4 border-t border-border space-y-1">
        {appSettingsPath && (
          <Link
            to={appSettingsPath}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span>App Settings</span>
          </Link>
        )}
        <Link
          to={getSafeSuitePath('/settings')}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span>Account</span>
        </Link>
        <Link
          to={getSafeSuitePath('/billing')}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <CreditCard className="h-5 w-5" />
          <span>Billing</span>
        </Link>
      </div>
    </aside>
  );
}

export default function SafeSuiteLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const landingPath = isSafeSuiteDomain() ? '/' : '/safesuite';

  const handleSignOut = async () => {
    await signOut();
    navigate(landingPath);
  };

  const userInitials = user?.email
    ?.split('@')[0]
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="fixed top-0 left-0 h-full w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar onItemClick={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Desktop spacer */}
            <div className="hidden lg:block" />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(getSafeSuitePath('/settings'))}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(getSafeSuitePath('/billing'))}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
