/**
 * Portal Layout Wrapper
 * Wraps portal pages with branding and theme providers
 */

import { ReactNode } from 'react';
import { PortalBrandingProvider } from '@/contexts/PortalBrandingContext';
import { PortalThemeProvider } from '@/contexts/PortalThemeContext';

interface PortalLayoutProps {
  children: ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <PortalThemeProvider>
      <PortalBrandingProvider>
        {children}
      </PortalBrandingProvider>
    </PortalThemeProvider>
  );
}
