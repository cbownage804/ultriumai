/**
 * Portal Header Component
 * Shared header for all customer portal pages
 */

import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut, User, LayoutDashboard, Ticket, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { usePortalSession } from '@/hooks/usePortalSession';

export function PortalHeader() {
  const navigate = useNavigate();
  const { session, logout } = usePortalSession();

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-white">Customer Portal</h1>
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
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-white/60">{session.user.fullName}</span>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                {session.user.role}
              </Badge>
            </div>
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
    </header>
  );
}
