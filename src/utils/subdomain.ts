/**
 * Subdomain detection utilities for routing
 */

export function getSubdomain(): string | null {
  const hostname = window.location.hostname;
  
  // Handle localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  
  // Handle main domain explicitly (no subdomain)
  if (hostname === 'ultriumai.com' || hostname === 'www.ultriumai.com') {
    return null;
  }
  
  // Handle preview URLs (e.g., xxx.lovableproject.com)
  if (hostname.includes('lovableproject.com') || hostname.includes('lovable.app')) {
    const parts = hostname.split('.');
    // If there's a subdomain before the main domain
    if (parts.length > 2) {
      const subdomain = parts[0];
      // Check if it's a vanguard subdomain
      if (subdomain === 'vanguard') {
        return 'vanguard';
      }
    }
    return null;
  }
  
  // Handle custom domains with subdomains (e.g., vanguard.ultriumai.com)
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain === 'vanguard') {
      return 'vanguard';
    }
  }
  
  return null;
}

export function isVanguardDomain(): boolean {
  const subdomain = getSubdomain();
  if (subdomain === 'vanguard') {
    return true;
  }
  
  // Also check for /vanguard path prefix for development
  const pathname = window.location.pathname;
  return pathname.startsWith('/vanguard');
}

export function getVanguardBasePath(): string {
  const subdomain = getSubdomain();
  // If on vanguard subdomain, routes are at root
  if (subdomain === 'vanguard') {
    return '';
  }
  // Otherwise, use /vanguard prefix
  return '/vanguard';
}

