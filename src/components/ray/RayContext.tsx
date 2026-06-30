/**
 * RayContext — supplies the current page context to every Ray surface so
 * insights, the palette, and the assistant all know "where" the user is.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type RayPageContext =
  | 'home'
  | 'passwords'
  | 'threats'
  | 'exposure'
  | 'identity'
  | 'devices'
  | 'reports'
  | 'settings'
  | 'other';

function inferContextFromPath(pathname: string): RayPageContext {
  if (pathname.startsWith('/app/pass')) return 'passwords'; // covers /app/passwords and legacy /app/pass
  if (pathname.startsWith('/app/threats') || pathname.startsWith('/app/scan')) return 'threats';
  if (pathname.startsWith('/app/exposure') || pathname.startsWith('/app/web')) return 'exposure';
  if (pathname.startsWith('/app/identity')) return 'identity';
  if (pathname.startsWith('/app/devices')) return 'devices';
  if (pathname.startsWith('/app/reports')) return 'reports';
  if (pathname.startsWith('/app/settings') || pathname.startsWith('/app/billing'))
    return 'settings';
  if (pathname === '/app' || pathname === '/app/' || pathname.startsWith('/app/dashboard') || pathname.startsWith('/app/brief') || pathname.startsWith('/app/ray'))
    return 'home';
  return 'other';
}

type RayContextValue = {
  pageContext: RayPageContext;
  pathname: string;
  override: (ctx: RayPageContext | null) => void;
};

const RayCtx = createContext<RayContextValue | null>(null);

export function RayContextProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [overrideCtx, setOverride] = useState<RayPageContext | null>(null);

  const pageContext = overrideCtx ?? inferContextFromPath(pathname);

  useEffect(() => {
    setOverride(null);
  }, [pathname]);

  const value = useMemo<RayContextValue>(
    () => ({ pageContext, pathname, override: setOverride }),
    [pageContext, pathname],
  );

  return <RayCtx.Provider value={value}>{children}</RayCtx.Provider>;
}

export function useRayContext(): RayContextValue {
  const v = useContext(RayCtx);
  if (!v) {
    // Safe fallback so non-/app pages don't crash.
    return { pageContext: 'other', pathname: '/', override: () => {} };
  }
  return v;
}
