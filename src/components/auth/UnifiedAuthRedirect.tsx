import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isWraythDomain, isVanguardDomain } from '@/utils/subdomain';
import { Loader2 } from 'lucide-react';

/**
 * Handles auth redirection for subdomains.
 * - On production subdomains (safesuite.ultriumai.com): redirects to main domain auth
 * - On preview/localhost: navigates to local AuthPage with return params
 */
export default function UnifiedAuthRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const hostname = window.location.hostname;
    const returnPath = location.state?.from?.pathname || '/dashboard';
    
    let returnProduct = '';
    if (isWraythDomain()) {
      returnProduct = 'safesuite';
    } else if (isVanguardDomain()) {
      returnProduct = 'vanguard';
    }
    
    // Only redirect to production domain if we're actually on a production subdomain
    const isProductionSubdomain = (hostname.endsWith('.ultriumai.com') || hostname.endsWith('.ultriumai.app')) && 
      (hostname.startsWith('safesuite.') || hostname.startsWith('vanguard.'));
    
    if (isProductionSubdomain) {
      // Production: redirect to app domain auth
      const appDomain = 'https://ultriumai.app';
      const authUrl = `${appDomain}/auth?return=${returnProduct}&path=${encodeURIComponent(returnPath)}`;
      window.location.href = authUrl;
    } else {
      // Preview/localhost: use local auth page with return params in URL
      const searchParams = new URLSearchParams(location.search);
      if (returnProduct) {
        searchParams.set('return', returnProduct);
      }
      searchParams.set('path', returnPath);
      navigate(`/auth?${searchParams.toString()}`, { replace: true });
    }
  }, [location, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
