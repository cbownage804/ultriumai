import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';

export const RoleBasedRedirect = () => {
  const { getRedirectPath, shouldRedirectToRole, loading } = useRoleBasedRedirect();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (shouldRedirectToRole()) {
    const redirectPath = getRedirectPath();
    return <Navigate to={redirectPath} replace />;
  }

  // Default redirect to home
  return <Navigate to="/" replace />;
};