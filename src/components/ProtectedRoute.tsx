import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isSafeSuiteDomain, isVanguardDomain } from '@/utils/subdomain';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate auth page based on subdomain
    if (isSafeSuiteDomain()) {
      // On SafeSuite subdomain, redirect to /auth and preserve intended destination
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    if (isVanguardDomain() || location.pathname.startsWith('/vanguard')) {
      return <Navigate to="/vanguard/auth" state={{ from: location }} replace />;
    }
    // SafeSuite routes on main domain
    if (location.pathname.startsWith('/safesuite')) {
      return <Navigate to="/safesuite/auth" state={{ from: location }} replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}