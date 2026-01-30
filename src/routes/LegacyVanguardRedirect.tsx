import { Navigate, useLocation } from "react-router-dom";

/**
 * Legacy redirect:
 * Before Vanguard protected routes were moved under `/vanguard/app/*`, some links/bookmarks
 * pointed to `/vanguard/<route>`. This keeps those links working by forwarding to
 * `/vanguard/app/<route>`.
 */
export default function LegacyVanguardRedirect() {
  const location = useLocation();
  const { pathname, search, hash } = location;

  // Convert `/vanguard/atlas` -> `/vanguard/app/atlas`
  const rest = pathname.startsWith("/vanguard") ? pathname.slice("/vanguard".length) : pathname;

  // If someone hits `/vanguard` (or `/vanguard/`), send them to the app dashboard.
  if (!rest || rest === "/") {
    return <Navigate to={`/vanguard/app/dashboard${search}${hash}`} replace />;
  }

  return <Navigate to={`/vanguard/app${rest}${search}${hash}`} replace />;
}
