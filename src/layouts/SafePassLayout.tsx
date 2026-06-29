import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  Settings, 
  LogOut, 
  Upload,
  Users,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { safeSuiteProducts } from '@/components/safesuite/WraythProductIcons';
import { AccountSwitcher } from '@/components/safepass/AccountSwitcher';

const navItems = [
  { path: '/safepass/dashboard', label: 'Vault', icon: Lock },
  { path: '/safepass/security', label: 'Security', icon: Shield },
  { path: '/safepass/import', label: 'Import', icon: Upload },
  { path: '/safepass/breach-monitor', label: 'Breach Monitor', icon: AlertTriangle },
  { path: '/safepass/team', label: 'Team', icon: Users },
  { path: '/safepass/settings', label: 'Settings', icon: Settings },
];

export function SafePassLayout() {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    // signOut now handles navigation with full page reload
  };

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'SP';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-amber-500/10 bg-[#0f0f0f]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f0f0f]/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/safepass" className="flex items-center space-x-2">
            <img 
              src={safeSuiteProducts.safepass.logo} 
              alt="SafePass" 
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="text-xl font-bold text-amber-500">SafePass</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-amber-500/20 text-amber-500"
                      : "text-gray-400 hover:text-amber-400 hover:bg-amber-500/10"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Account Switcher */}
            <AccountSwitcher />
            
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-amber-400 hover:bg-amber-500/10">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-medium text-black flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'User'} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {profile?.full_name && (
                      <p className="font-medium">{profile.full_name}</p>
                    )}
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/safepass/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-amber-500/10 bg-[#0f0f0f]">
            <nav className="container py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-amber-500/20 text-amber-500"
                        : "text-gray-400 hover:text-amber-400 hover:bg-amber-500/10"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6 bg-[#0a0a0a]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-500/10 py-6 mt-auto bg-[#0a0a0a]">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} SafePass by Ultrium. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-amber-400">Privacy</Link>
            <Link to="/terms" className="hover:text-amber-400">Terms</Link>
            <Link to="/security" className="hover:text-amber-400">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SafePassLayout;
