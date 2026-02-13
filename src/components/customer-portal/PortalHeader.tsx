/**
 * Portal Header Component
 * Shared header for all customer portal pages with branding support
 */

import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut, LayoutDashboard, Ticket } from 'lucide-react';
import { AppSwitcher } from '@/components/AppSwitcher';
import { toast } from 'sonner';
import { usePortalSession } from '@/hooks/usePortalSession';
import { usePortalBranding } from '@/contexts/PortalBrandingContext';
import { ThemeToggle } from './ThemeToggle';

export function PortalHeader() {
  const navigate = useNavigate();
  const { session, logout } = usePortalSession();
  const branding = usePortalBranding();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/customer-portal/login');
  };

  if (!session) return null;

  return (
    <header className="bg-black/40 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/customer-portal/dashboard" className="flex items-center gap-3">
              {branding.companyLogo ? (
                <img 
                  src={branding.companyLogo} 
                  alt={branding.companyName}
                  className="h-10 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` 
                  }}
                >
                  <Shield className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-white">{branding.companyName}</h1>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/customer-portal/dashboard">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/customer-portal/tickets">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                  <Ticket className="h-4 w-4 mr-2" />
                  Tickets
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <AppSwitcher />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-white/60">{session.user.fullName}</span>
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: `${branding.primaryColor}50`,
                  color: branding.primaryColor
                }}
              >
                {session.user.role}
              </Badge>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer branding */}
      {!branding.hidePoweredBy && branding.footerText && (
        <div className="hidden">{/* Footer shown in layout, not header */}</div>
      )}
    </header>
  );
}
