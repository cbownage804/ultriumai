/**
 * Wrayth Layout - Unified layout for all Wrayth products
 */

import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWraythSubscription } from '@/hooks/useSafeSuite';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS } from '@/config/safeSuiteTiers';
import { getWraythBasePath, isWraythDomain } from '@/utils/subdomain';
import { safeSuiteProducts, safesuiteLogo, type WraythProductKey } from '@/components/safesuite/SafeSuiteProductIcons';
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
  Sparkles,
  Coins,
  HelpCircle,
  ArrowLeftFromLine
} from 'lucide-react';
import { AppSwitcher } from '@/components/AppSwitcher';
import { HelpCenter } from '@/components/onboarding/HelpCenter';
import { cn } from '@/lib/utils';
import { FloatingSafeAssist } from '@/components/safeassist/FloatingSafeAssist';
import { FloatingSafeAssistProvider, useFloatingSafeAssist } from '@/contexts/FloatingSafeAssistContext';
import { MFAOnboardingGate } from '@/components/safesuite/MFAOnboardingGate';

/**
 * Get the correct path for Wrayth routes based on subdomain
 * On safesuite.ultriumai.com: /dashboard
 * On main domain: /safesuite/dashboard
 */
function getWraythPath(path: string): string {
  const isSubdomain = isWraythDomain();
  if (isSubdomain) {
    return path; // Clean path like /dashboard
  }
  return `/safesuite${path}`; // Prefixed path like /safesuite/dashboard
}

const getNavItems = () => [
  {
    id: 'dashboard',
    label: 'Home',
    path: getWraythPath('/dashboard'),
    icon: LayoutDashboard,
    productLogo: null as string | null,
    feature: null
  },
  {
    id: 'safepass',
    label: 'Vault',
    path: getWraythPath('/pass'),
    icon: null,
    productLogo: safeSuiteProducts.safepass.logo,
    feature: 'safepass' as const,
    subItems: [
      { label: 'Vault', path: getWraythPath('/pass') },
      { label: 'Secure Notes', path: getWraythPath('/pass/notes') },
      { label: 'Credit Cards', path: getWraythPath('/pass/cards') },
      { label: 'Identity Profiles', path: getWraythPath('/pass/identity') },
      { label: 'Password Health', path: getWraythPath('/pass/health') },
      { label: 'User Management', path: getWraythPath('/pass/users') },
      { label: 'Shared With Me', path: getWraythPath('/pass/shared') },
      { label: 'Emergency Access', path: getWraythPath('/pass/emergency') },
      { label: 'Breach Monitor', path: getWraythPath('/pass/breach') },
      { label: 'Reminders', path: getWraythPath('/pass/reminders') },
      { label: 'Browser Extension', path: getWraythPath('/pass/extension'), badge: 'BETA' },
      { label: 'Import', path: getWraythPath('/pass/import') },
      { label: 'Export', path: getWraythPath('/pass/export') },
      { label: 'Team', path: getWraythPath('/pass/team') },
      { label: 'Settings', path: getWraythPath('/pass/settings') }
    ]
  },
  {
    id: 'safescan',
    label: 'Scan',
    path: getWraythPath('/scan'),
    icon: null,
    productLogo: safeSuiteProducts.safescan.logo,
    feature: 'safescan' as const,
    subItems: [
      { label: 'Scanner', path: getWraythPath('/scan') },
      { label: 'Settings', path: getWraythPath('/scan/settings') }
    ]
  },
  {
    id: 'safeweb',
    label: 'Watch',
    path: getWraythPath('/web'),
    icon: null,
    productLogo: safeSuiteProducts.safeweb.logo,
    feature: 'safeweb' as const,
    subItems: [
      { label: 'Monitor', path: getWraythPath('/web') },
      { label: 'Settings', path: getWraythPath('/web/settings') }
    ]
  },
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
  onClick,
  isExpanded,
  onToggle,
  onCustomClick
}: {
  item: NavItem;
  isActive: boolean;
  isLocked: boolean;
  currentPath: string;
  onClick?: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  onCustomClick?: () => void;
}) {
  const Icon = item.icon;
  const hasSubItems = Boolean(item.subItems?.length);

  const handleToggle = (e: React.MouseEvent) => {
    if (hasSubItems) {
      e.preventDefault();
      onToggle();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onCustomClick) {
      e.preventDefault();
      onCustomClick();
      onClick?.();
      return;
    }
    onClick?.();
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        {onCustomClick ? (
          <button
            onClick={handleClick}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 flex-1 text-left',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-primary/10',
              isLocked && 'opacity-60'
            )}
          >
            {item.productLogo ? (
              <img 
                src={item.productLogo} 
                alt={item.label} 
                className="h-20 w-auto object-contain" 
              />
            ) : Icon ? (
              <>
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
              </>
            ) : null}
            {isLocked && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
          </button>
        ) : (
          <Link
            to={item.path}
            onClick={handleClick}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 flex-1',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-primary/10',
              isLocked && 'opacity-60'
            )}
          >
            {item.productLogo ? (
              <img 
                src={item.productLogo} 
                alt={item.label} 
                className="h-20 w-auto object-contain" 
              />
            ) : Icon ? (
              <>
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
              </>
            ) : null}
          </Link>
        )}
        {hasSubItems && (
          <button
            onClick={handleToggle}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {hasSubItems && isExpanded && (
        <div className="ml-8 space-y-1">
          {item.subItems!.map((sub) => {
            const subActive = currentPath === sub.path;
            const subItem = sub as { label: string; path: string; badge?: string };
            return (
              <Link
                key={sub.path}
                to={sub.path}
                onClick={onClick}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                  'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  subActive && 'bg-primary/10 text-primary font-medium'
                )}
              >
                {sub.label}
                {subItem.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                    {subItem.badge}
                  </span>
                )}
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
  const { tier, tierConfig } = useWraythSubscription();
  const { user } = useAuth();
  const { openAssistant } = useFloatingSafeAssist();
  const navItems = getNavItems();
  const landingPath = isWraythDomain() ? '/' : '/safesuite';
  
  // Admin check: UltriumAI employee with confirmed email
  const isAdmin = user?.email?.endsWith('@ultriumai.com') && user?.email_confirmed_at != null;

  // Track which nav items are expanded
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // Auto-expand the currently active section
    const activeItem = navItems.find(item => 
      location.pathname === item.path || 
      (item.path !== getWraythPath('/dashboard') && location.pathname.startsWith(item.path))
    );
    return activeItem ? new Set([activeItem.id]) : new Set();
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const normalizedPath = isWraythDomain()
    ? location.pathname
    : location.pathname.replace(/^\/safesuite/, '');

  const appSettingsPath = normalizedPath.startsWith('/pass')
    ? getWraythPath('/pass/settings')
    : normalizedPath.startsWith('/scan')
      ? getWraythPath('/scan/settings')
      : normalizedPath.startsWith('/web')
        ? getWraythPath('/web/settings')
        : normalizedPath.startsWith('/track')
          ? getWraythPath('/track/settings')
          : null;

  return (
    <aside className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to={landingPath} className="flex items-center justify-center">
          <img 
            src={safesuiteLogo} 
            alt="Wrayth" 
            className="h-32 w-auto object-contain"
          />
        </Link>
        <Link
          to="/hub"
          className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftFromLine className="h-3.5 w-3.5" />
          Back to Product Hub
        </Link>
      </div>

      {/* Tier indicator */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Plan</span>
          <TierBadge tier={tier} />
        </div>
        {tier === 'free' && (
          <Link to={getWraythPath('/billing')}>
            <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Button>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== getWraythPath('/dashboard') && location.pathname.startsWith(item.path));
          const isLocked = item.feature && !tierConfig.features[item.feature].enabled;

          return (
            <NavLink
              key={item.id}
              item={item}
              isActive={isActive}
              isLocked={isLocked}
              currentPath={location.pathname}
              onClick={onItemClick}
              isExpanded={expandedItems.has(item.id)}
              onToggle={() => toggleExpanded(item.id)}
              onCustomClick={undefined} /* SafeAssist now uses full page navigation */
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
          to={getWraythPath('/settings')}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span>Account</span>
        </Link>
        <Link
          to={getWraythPath('/billing')}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <CreditCard className="h-5 w-5" />
          <span>Billing</span>
        </Link>
        <Link
          to="/credits"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Coins className="h-5 w-5" />
          <span>AI Credits</span>
        </Link>
        
        {/* Admin link - only visible to verified UltriumAI employees */}
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-orange-500 hover:text-orange-400 transition-colors"
            onClick={() => onItemClick?.()}
          >
            <Crown className="h-5 w-5" />
            <span>Admin Center</span>
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
    // signOut now handles navigation with full page reload
  };

  const userInitials = user?.email
    ?.split('@')[0]
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="fixed top-0 left-0 h-full w-64 overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        {/* Header - sticky with safe area support */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border safe-area-inset-top">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
            {/* Mobile menu button */}
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

            {/* Desktop spacer */}
            <div className="hidden lg:block" />

            {/* Help Center & User menu */}
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
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(getWraythPath('/billing'))} className="min-h-[44px]">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive min-h-[44px]">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content with responsive padding */}
        <main className="flex-1 p-4 lg:p-6 safe-area-inset-bottom">
          <Outlet />
        </main>
      </div>
      
      {/* Ask Ray — global command palette (⌘K / Ctrl+K) */}
      <AskRayPalette />

      {/* Floating SafeAssist Chat - available on all pages */}
      <FloatingSafeAssist />
    </div>
  );
}

export default function WraythLayout() {
  return (
    <MFAOnboardingGate>
      <FloatingSafeAssistProvider>
        <WraythLayoutInner />
      </FloatingSafeAssistProvider>
    </MFAOnboardingGate>
  );
}
