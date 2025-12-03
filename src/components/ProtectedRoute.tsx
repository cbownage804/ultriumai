import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { isVanguardDomain, getVanguardBasePath } from '@/utils/subdomain';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

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
    // Handle Vanguard subdomain - redirect to appropriate auth page
    const isVanguard = isVanguardDomain();
    if (isVanguard) {
      const basePath = getVanguardBasePath();
      return <Navigate to={`${basePath}/auth`} replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}