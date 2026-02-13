import { Navigate, useSearchParams } from 'react-router-dom';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';
import { useEffect, useState } from 'react';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { isSafeSuiteDomain, isVanguardDomain } from '@/utils/subdomain';

/**
 * Get product URLs dynamically based on current environment
 */
const getProductUrls = (): Record<string, string> => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Production environment
  if (hostname === 'ultriumai.com' || hostname === 'www.ultriumai.com' ||
      hostname === 'ultriumai.app' || hostname === 'www.ultriumai.app') {
    return {
      safesuite: 'https://ultriumai.app',
      vanguard: 'https://ultriumai.app',
    };
  }
  
  // Already on a subdomain in production
  if (hostname.endsWith('.ultriumai.com') || hostname.endsWith('.ultriumai.app')) {
    return {
      safesuite: 'https://ultriumai.app',
      vanguard: 'https://ultriumai.app',
    };
  }
  
  // Preview/localhost - stay on same domain, just navigate
  return {
    safesuite: '', // Empty means use local navigation
    vanguard: '',
  };
};

export const RoleBasedRedirect = () => {
  const { getRedirectPath, shouldRedirectToRole, loading, profile } = useRoleBasedRedirect();
  const [searchParams] = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  
  // Check if redirecting to a specific product
  const returnProduct = searchParams.get('return');
  const returnPath = searchParams.get('path') || '/dashboard';

  // Priority 1: Handle cross-domain product redirects (PRODUCTION ONLY)
  useEffect(() => {
    const PRODUCT_URLS = getProductUrls();
    const productUrl = PRODUCT_URLS[returnProduct || ''];
    
    // Only do cross-domain redirect if we have a valid external URL
    if (returnProduct && productUrl && !loading && !redirecting) {
      setRedirecting(true);
      
      // Wait for session cookie to be written before redirecting
      const timer = setTimeout(() => {
        const targetUrl = `${productUrl}${returnPath}`;
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

  // Priority 2: Preview/localhost with return product - use local navigation
  const PRODUCT_URLS = getProductUrls();
  if (returnProduct && PRODUCT_URLS[returnProduct] === '') {
    // Map return product to the correct local path
    const productPaths: Record<string, string> = {
      safesuite: '/safesuite/dashboard',
      vanguard: '/vanguard/app/dashboard',
      ai_studio: '/ai-studio',
    };
    const targetPath = productPaths[returnProduct] || returnPath;
    return <Navigate to={targetPath} replace />;
  }

  // Priority 3: Check for role-based redirects (includes smart product routing)
  if (shouldRedirectToRole() && !returnProduct) {
    const redirectPath = getRedirectPath();
    return <Navigate to={redirectPath} replace />;
  }

  // Priority 4: Already on subdomain - stay there
  if (isSafeSuiteDomain()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (isVanguardDomain()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Priority 5: Main domain fallback - redirect to Product Hub
  return <Navigate to="/hub" replace />;
};