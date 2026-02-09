/**
 * Cross-domain routing utilities for ultriumai.com (marketing) vs ultriumai.app (platform apps)
 * Updated: 2026-02-09 — fixed root redirect loop
 */

const MARKETING_DOMAIN = 'ultriumai.com';
const APP_DOMAIN = 'ultriumai.app';

/** Routes that belong on the marketing domain */
const MARKETING_ROUTE_PREFIXES = [
  '/products',
  '/pricing',
  '/terms',
  '/privacy',
  '/security',
  '/docs',
  '/changelog',
  '/feedback',
  '/install',
  '/guide',
  '/api-docs',
  '/survey',
];

/** Routes that belong on the app domain */
const APP_ROUTE_PREFIXES = [
  '/auth',
  '/hub',
  '/safesuite',
  '/vanguard',
  '/ai-studio',
  '/dashboard',
  '/settings',
  '/admin',
  '/profile',
  '/customer-portal',
  '/organization',
  '/onboarding',
  '/client',
  '/portal',
  '/reports',
  '/analytics',
  '/credits',
  '/referrals',
  '/notifications',
  '/chat',
  '/payment',
  '/gpt',
];

/**
 * Check if we're in a production environment (on ultriumai.com or ultriumai.app)
 */
export function isProductionEnvironment(): boolean {
  const hostname = window.location.hostname;
  return hostname === MARKETING_DOMAIN ||
    hostname === `www.${MARKETING_DOMAIN}` ||
    hostname === APP_DOMAIN ||
    hostname === `www.${APP_DOMAIN}` ||
    hostname.endsWith(`.${MARKETING_DOMAIN}`) ||
    hostname.endsWith(`.${APP_DOMAIN}`);
}

/**
 * Check if we're on the marketing domain (ultriumai.com)
 */
export function isMarketingDomain(): boolean {
  const hostname = window.location.hostname;
  return hostname === MARKETING_DOMAIN || hostname === `www.${MARKETING_DOMAIN}`;
}

/**
 * Check if we're on the app domain (ultriumai.app)
 */
export function isAppDomain(): boolean {
  const hostname = window.location.hostname;
  return hostname === APP_DOMAIN || hostname === `www.${APP_DOMAIN}`;
}

/**
 * Check if a given path is a marketing route
 */
export function isMarketingRoute(path: string): boolean {
  // Root "/" is marketing only on the marketing domain; on app domain it should go to /hub
  if (path === '/' || path === '') return isMarketingDomain();
  return MARKETING_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix));
}

/**
 * Check if a given path is an app route
 */
export function isAppRoute(path: string): boolean {
  return APP_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix));
}

/**
 * Get full URL for the app domain. In dev/preview, returns local path.
 */
export function getAppUrl(path: string): string {
  if (!isProductionEnvironment()) return path;
  return `https://${APP_DOMAIN}${path}`;
}

/**
 * Get full URL for the marketing domain. In dev/preview, returns local path.
 */
export function getMarketingUrl(path: string): string {
  if (!isProductionEnvironment()) return path;
  return `https://${MARKETING_DOMAIN}${path}`;
}

/**
 * If on wrong domain for the given route, returns the correct full URL to redirect to.
 * Returns null if no redirect is needed.
 */
export function getCrossDomainRedirect(pathname: string, search: string, hash: string): string | null {
  if (!isProductionEnvironment()) return null;

  const fullPath = `${pathname}${search}${hash}`;

  console.log('[DomainRouter]', {
    hostname: window.location.hostname,
    pathname,
    isMarketingDomain: isMarketingDomain(),
    isAppDomain: isAppDomain(),
    isMarketingRoute: isMarketingRoute(pathname),
    isAppRoute: isAppRoute(pathname),
  });

  // On marketing domain but navigating to an app route → redirect to app domain
  if (isMarketingDomain() && isAppRoute(pathname)) {
    console.log('[DomainRouter] Redirecting to app domain:', `https://${APP_DOMAIN}${fullPath}`);
    return `https://${APP_DOMAIN}${fullPath}`;
  }

  // On app domain but navigating to a marketing route → redirect to marketing domain
  if (isAppDomain() && isMarketingRoute(pathname)) {
    console.log('[DomainRouter] Redirecting to marketing domain:', `https://${MARKETING_DOMAIN}${fullPath}`);
    return `https://${MARKETING_DOMAIN}${fullPath}`;
  }

  return null;
}
