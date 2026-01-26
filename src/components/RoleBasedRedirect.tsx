import { Navigate, useSearchParams } from 'react-router-dom';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';
import { useEffect, useState } from 'react';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';

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

  if (shouldRedirectToRole()) {
    const redirectPath = getRedirectPath();
    return <Navigate to={redirectPath} replace />;
  }

  // Default redirect to Product Hub - user is authenticated at this point
  // (This component is only rendered when user exists - see App.tsx)
  return <Navigate to="/hub" replace />;
};