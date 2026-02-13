import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Shield, Users, BarChart3 } from 'lucide-react';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { WhatsNewSidebar } from '@/components/changelog/WhatsNewSidebar';
import { AppSwitcher } from '@/components/AppSwitcher';

export const Header = () => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">UltriumAI</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link to="/admin/helpdesk">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Helpdesk
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <AppSwitcher />
          <WhatsNewSidebar />
          <NotificationCenter />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
};
