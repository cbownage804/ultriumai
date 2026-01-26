import { Navigate, useSearchParams } from 'react-router-dom';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';
import { useEffect, useState } from 'react';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { isSafeSuiteDomain, isVanguardDomain } from '@/utils/subdomain';

// Product subdomain URLs
const PRODUCT_URLS: Record<string, string> = {
  safesuite: 'https://safesuite.ultriumai.com',
  vanguard: 'https://vanguard.ultriumai.com',
};

export const RoleBasedRedirect = () => {
  const { getRedirectPath, shouldRedirectToRole, loading, profile } = useRoleBasedRedirect();
  const [searchParams] = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  
  // Check if redirecting to a specific product
  const returnProduct = searchParams.get('return');
  const returnPath = searchParams.get('path') || '/dashboard';

  // Priority 1: Handle cross-domain product redirects FIRST (before role-based logic)
  // Handle subdomain redirect with delay to ensure cookie is written
  useEffect(() => {
    if (returnProduct && PRODUCT_URLS[returnProduct] && !loading && !redirecting) {
      setRedirecting(true);
      
      // Wait 1 second to ensure session cookie is fully written before redirecting
      const timer = setTimeout(() => {
        const targetUrl = `${PRODUCT_URLS[returnProduct]}${returnPath}`;
        window.location.href = targetUrl;
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [returnProduct, returnPath, loading, redirecting]);

  if (loading || redirecting) {
    return <AuthLoadingScreen 
      message={redirecting ? 'Redirecting to your product' : 'Loading your dashboard'}
      showProgress={redirecting}
    />;
  }

  // Priority 2: Check for role-based redirects (MSP/Admin)
  // Only apply role-based redirects if NOT returning from a product auth flow
  if (shouldRedirectToRole() && !returnProduct) {
    const redirectPath = getRedirectPath();
    return <Navigate to={redirectPath} replace />;
  }

  // Priority 3: Already on subdomain - stay there
  // SafeSuite and Vanguard subdomains stay on their own dashboards
  if (isSafeSuiteDomain()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (isVanguardDomain()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Priority 4: Main domain fallback - redirect to Product Hub
  return <Navigate to="/hub" replace />;
};