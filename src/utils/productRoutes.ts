import { Product } from '@/hooks/useProductAccess';
import { isWraythDomain, isVanguardDomain } from '@/utils/subdomain';

/**
 * Determines which product the user is accessing based on:
 * 1. Subdomain (safesuite.ultriumai.com, vanguard.ultriumai.com)
 * 2. URL path prefix (/safesuite/*, /vanguard/*)
 * 3. Default to ai_studio for main domain
 */
export function getCurrentProduct(pathname: string): Product {
  // Check subdomain first
  if (isWraythDomain()) {
    return 'safesuite';
  }
  
  if (isVanguardDomain()) {
    return 'vanguard';
  }
  
  // Check path prefix
  if (pathname.startsWith('/app')) {
    return 'safesuite';
  }
  
  if (pathname.startsWith('/vanguard')) {
    return 'vanguard';
  }
  
  // Default to AI Studio
  return 'ai_studio';
}

/**
 * Returns the dashboard path for a given product
 */
export function getProductDashboardPath(product: Product): string {
  switch (product) {
    case 'safesuite':
      return isWraythDomain() ? '/dashboard' : '/app/dashboard';
    case 'vanguard':
      return isVanguardDomain() ? '/dashboard' : '/vanguard/dashboard';
    case 'ai_studio':
    default:
      return '/dashboard';
  }
}

/**
 * Returns the auth path for a given product
 */
export function getProductAuthPath(product: Product): string {
  switch (product) {
    case 'safesuite':
      return isWraythDomain() ? '/auth' : '/app/auth';
    case 'vanguard':
      return isVanguardDomain() ? '/auth' : '/vanguard/auth';
    case 'ai_studio':
    default:
      return '/auth';
  }
}
