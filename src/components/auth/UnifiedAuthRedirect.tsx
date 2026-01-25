import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isSafeSuiteDomain, isVanguardDomain } from '@/utils/subdomain';
import { Loader2 } from 'lucide-react';

/**
 * Redirects subdomain auth requests to the main domain auth page
 * with appropriate return parameters
 */
export default function UnifiedAuthRedirect() {
  const location = useLocation();
  
  useEffect(() => {
    const mainDomain = 'https://ultriumai.com';
    const returnPath = location.state?.from?.pathname || '/dashboard';
    
    let returnProduct = '';
    if (isSafeSuiteDomain()) {
      returnProduct = 'safesuite';
    } else if (isVanguardDomain()) {
      returnProduct = 'vanguard';
    }
    
    const authUrl = `${mainDomain}/auth?return=${returnProduct}&path=${encodeURIComponent(returnPath)}`;
    window.location.href = authUrl;
  }, [location]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
