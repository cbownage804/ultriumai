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
  
  // Handle main domain explicitly (no subdomain)
  if (hostname === 'ultriumai.com' || hostname === 'www.ultriumai.com') {
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
  
  return null;
}

export function isVanguardDomain(): boolean {
  return getSubdomain() === 'vanguard';
}

export function isSafeSuiteDomain(): boolean {
  return getSubdomain() === 'safesuite';
}

export function getVanguardBasePath(): string {
  const subdomain = getSubdomain();
  if (subdomain === 'vanguard') {
    return '/app';
  }
  return '/vanguard';
}

export function getSafeSuiteBasePath(): string {
  const subdomain = getSubdomain();
  if (subdomain === 'safesuite') {
    return '/';
  }
  return '/safesuite';
}

