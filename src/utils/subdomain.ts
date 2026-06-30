/**
 * Subdomain detection utilities for routing
 */

export type AppSubdomain = 'vanguard' | 'safesuite' | null;

export function getSubdomain(): AppSubdomain {
  const hostname = window.location.hostname;
  
  // Handle localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  
  // Handle main domains explicitly (no subdomain)
  if (hostname === 'ultriumai.com' || hostname === 'www.ultriumai.com') {
    return null;
  }
  if (hostname === 'ultriumai.app' || hostname === 'www.ultriumai.app') {
    return null;
  }
  
  // Handle preview URLs (e.g., xxx.lovableproject.com)
  if (hostname.includes('lovableproject.com') || hostname.includes('lovable.app')) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const subdomain = parts[0];
      if (subdomain === 'vanguard') return 'vanguard';
      if (subdomain === 'safesuite') return 'safesuite';
    }
    return null;
  }
  
  // Handle custom domains with subdomains
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain === 'vanguard') return 'vanguard';
    if (subdomain === 'safesuite') return 'safesuite';
  }
  
  // Check if hostname starts with subdomain (e.g., safesuite.ultriumai.com)
  if (hostname.startsWith('safesuite.')) return 'safesuite';
  if (hostname.startsWith('vanguard.')) return 'vanguard';
  
  return null;
}

export function isVanguardDomain(): boolean {
  return getSubdomain() === 'vanguard';
}

export function isWraythDomain(): boolean {
  return getSubdomain() === 'safesuite';
}

export function getVanguardBasePath(): string {
  const subdomain = getSubdomain();
  if (subdomain === 'vanguard') {
    return '/app';
  }
  return '/vanguard/app';
}

export function getWraythBasePath(): string {
  const subdomain = getSubdomain();
  if (subdomain === 'safesuite') {
    return '/';
  }
  return '/app';
}

/**
 * Get the correct path for Wrayth routes based on subdomain
 * On safesuite.ultriumai.com: /dashboard
 * On main domain: /safesuite/dashboard
 */
export function getWraythRoutePath(path: string): string {
  const basePath = getWraythBasePath();
  if (basePath === '/') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}

