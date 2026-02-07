/**
 * Portal Branding Context
 * Provides company branding (logo, colors, name) to all portal components
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

interface PortalBranding {
  companyName: string;
  companyLogo: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  hidePoweredBy: boolean;
  isLoading: boolean;
}

const defaultBranding: PortalBranding = {
  companyName: 'Customer Portal',
  companyLogo: null,
  primaryColor: '#06b6d4', // cyan-500
  secondaryColor: '#a855f7', // purple-500
  footerText: 'Powered by Vanguard',
  hidePoweredBy: false,
  isLoading: true
};

const PortalBrandingContext = createContext<PortalBranding>(defaultBranding);

export function usePortalBranding() {
  return useContext(PortalBrandingContext);
}

interface PortalBrandingProviderProps {
  children: ReactNode;
}

export function PortalBrandingProvider({ children }: PortalBrandingProviderProps) {
  const { session } = usePortalSession();
  const [branding, setBranding] = useState<PortalBranding>(defaultBranding);

  useEffect(() => {
    if (session?.user?.clientId) {
      fetchBranding(session.user.clientId);
    } else {
      setBranding({ ...defaultBranding, isLoading: false });
    }
  }, [session?.user?.clientId]);

  const fetchBranding = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('msp_client_whitelabel_configs')
        .select('company_name, company_logo, primary_color, secondary_color, footer_text, hide_powered_by')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBranding({
          companyName: data.company_name || defaultBranding.companyName,
          companyLogo: data.company_logo,
          primaryColor: data.primary_color || defaultBranding.primaryColor,
          secondaryColor: data.secondary_color || defaultBranding.secondaryColor,
          footerText: data.footer_text || defaultBranding.footerText,
          hidePoweredBy: data.hide_powered_by || false,
          isLoading: false
        });
      } else {
        setBranding({ ...defaultBranding, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch portal branding:', error);
      setBranding({ ...defaultBranding, isLoading: false });
    }
  };

  // Apply CSS custom properties for branding colors
  useEffect(() => {
    if (!branding.isLoading) {
      document.documentElement.style.setProperty('--portal-primary', branding.primaryColor);
      document.documentElement.style.setProperty('--portal-secondary', branding.secondaryColor);
    }
  }, [branding]);

  return (
    <PortalBrandingContext.Provider value={branding}>
      {children}
    </PortalBrandingContext.Provider>
  );
}
