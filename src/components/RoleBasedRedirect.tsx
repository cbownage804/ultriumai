import { Navigate, useSearchParams } from 'react-router-dom';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';

// Product subdomain URLs
const PRODUCT_URLS: Record<string, string> = {
  safesuite: 'https://safesuite.ultriumai.com',
  vanguard: 'https://vanguard.ultriumai.com',
};

export const RoleBasedRedirect = () => {
  const { getRedirectPath, shouldRedirectToRole, loading, profile } = useRoleBasedRedirect();
  const [searchParams] = useSearchParams();
  
  // Check if redirecting to a specific product
  const returnProduct = searchParams.get('return');
  const returnPath = searchParams.get('path') || '/dashboard';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If returning to a specific product subdomain, redirect there
  if (returnProduct && PRODUCT_URLS[returnProduct]) {
    const targetUrl = `${PRODUCT_URLS[returnProduct]}${returnPath}`;
    window.location.href = targetUrl;
    return null;
  }

  if (shouldRedirectToRole()) {
    const redirectPath = getRedirectPath();
    return <Navigate to={redirectPath} replace />;
  }

  // Default redirect to Product Hub - user is authenticated at this point
  // (This component is only rendered when user exists - see App.tsx)
  return <Navigate to="/hub" replace />;
};