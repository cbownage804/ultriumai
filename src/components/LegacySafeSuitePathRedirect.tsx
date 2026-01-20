import { Navigate, useLocation } from 'react-router-dom';

/**
 * Redirects legacy SafeSuite main-domain paths (prefixed with `/safesuite`) to the
 * clean SafeSuite subdomain paths.
 *
 * Examples:
 * - /safesuite            -> /
 * - /safesuite/pass/notes -> /pass/notes
 */
export default function LegacySafeSuitePathRedirect() {
  const location = useLocation();

  const withoutPrefix = location.pathname
    .replace(/^\/safesuite(\/|$)/, '/')
    .replace(/\/{2,}/g, '/');

  const targetPath = withoutPrefix === '' ? '/' : withoutPrefix;

  return (
    <Navigate
      to={`${targetPath}${location.search ?? ''}${location.hash ?? ''}`}
      replace
    />
  );
}
