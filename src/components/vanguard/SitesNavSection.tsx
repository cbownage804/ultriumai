/**
 * Datto-style Sites navigation section for the Vanguard sidebar.
 * Fetches real customer/site data and renders expandable per-site sub-items.
 */

import { useState, useEffect } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { 
  ChevronDown, ChevronRight, Building2, Monitor, Bell, 
  Ticket, Globe, FileText, LayoutDashboard, Home, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getVanguardBasePath } from '@/utils/subdomain';

interface SiteInfo {
  id: string;
  company_name: string;
  endpoints: number | null;
  is_active: boolean | null;
}

const SITE_NAV_KEY = 'vanguard-nav-expanded-site';

export function SitesNavSection({ onMobileClose }: { onMobileClose: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const basePath = getVanguardBasePath();
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [isOpen, setIsOpen] = useState(() => {
    return location.pathname.includes('/customers');
  });
  const [expandedSite, setExpandedSite] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SITE_NAV_KEY);
    } catch { return null; }
  });

  useEffect(() => {
    if (!user) return;
    const fetchSites = async () => {
      const { data } = await supabase
        .from('msp_clients')
        .select('id, company_name, endpoints, is_active')
        .order('company_name')
        .limit(50);
      if (data) setSites(data as SiteInfo[]);
    };
    fetchSites();
  }, [user]);

  // Auto-expand if we're on a customer page
  useEffect(() => {
    if (location.pathname.includes('/customers')) {
      setIsOpen(true);
      // Extract customerId from path
      const match = location.pathname.match(/\/customers\/([^/]+)/);
      if (match) {
        setExpandedSite(match[1]);
      }
    }
  }, [location.pathname]);

  const toggleSite = (siteId: string) => {
    const next = expandedSite === siteId ? null : siteId;
    setExpandedSite(next);
    try { localStorage.setItem(SITE_NAV_KEY, next || ''); } catch {}
  };

  const isActive = (path: string) => 
    location.pathname === path || location.pathname.startsWith(path + '/');

  const siteSubItems = (siteId: string) => [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: `${basePath}/customers/${siteId}` },
    { id: 'devices', label: 'Devices', icon: Monitor, path: `${basePath}/customers/${siteId}?tab=devices` },
    { id: 'alerts', label: 'Alerts', icon: Bell, path: `${basePath}/customers/${siteId}?tab=alerts` },
    { id: 'tickets', label: 'Tickets', icon: Ticket, path: `${basePath}/customers/${siteId}?tab=tickets` },
    { id: 'portal', label: 'Portal Access', icon: Globe, path: `${basePath}/customers/${siteId}?tab=portal` },
    { id: 'docs', label: 'Documentation', icon: FileText, path: `${basePath}/customers/${siteId}?tab=atlas` },
    { id: 'settings', label: 'Settings', icon: Settings, path: `${basePath}/customers/${siteId}?tab=settings` },
  ];

  return (
    <div className="mt-0.5">
      {/* Sites group header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 w-full px-5 py-2 text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 rounded-sm mx-1',
          'hover:bg-cyan-500/8 hover:text-slate-300',
          isOpen || location.pathname.includes('/customers') ? 'text-cyan-400/90' : 'text-slate-500'
        )}
      >
        <Home className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Sites</span>
        {sites.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 mr-1">
            {sites.length}
          </span>
        )}
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      {isOpen && (
        <div className="ml-7 border-l border-cyan-500/10">
          {/* All Sites link */}
          <NavLink
            to={`${basePath}/customers`}
            end
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-2.5 px-4 py-1.5 text-[13px] transition-all duration-200',
              'hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300',
              isActive(`${basePath}/customers`) && !location.pathname.match(/\/customers\/[^/]+/) && 'bg-cyan-500/15 text-cyan-400 border-l-2 border-cyan-400 -ml-[1px]'
            )}
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>All Sites</span>
          </NavLink>

          {/* Individual sites */}
          {sites.map((site) => {
            const isSiteExpanded = expandedSite === site.id;
            const isSiteActive = location.pathname.includes(`/customers/${site.id}`);

            return (
              <div key={site.id}>
                <button
                  onClick={() => toggleSite(site.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-4 py-1.5 text-[13px] transition-all duration-200',
                    'hover:bg-cyan-500/10 hover:text-cyan-300',
                    isSiteActive ? 'text-cyan-400' : 'text-slate-400'
                  )}
                >
                  {isSiteExpanded ? (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  )}
                  <span className="truncate flex-1 text-left">{site.company_name}</span>
                </button>

                {isSiteExpanded && (
                  <div className="ml-4 border-l border-cyan-500/10">
                    {siteSubItems(site.id).map((sub) => (
                      <NavLink
                        key={sub.id}
                        to={sub.path}
                        onClick={onMobileClose}
                        className={cn(
                          'flex items-center gap-2 px-4 py-1 text-[12px] transition-all duration-200',
                          'hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-300',
                          isSiteActive && location.search.includes(`tab=${sub.id}`) && 'text-cyan-400',
                          sub.id === 'overview' && isSiteActive && !location.search.includes('tab=') && 'text-cyan-400'
                        )}
                      >
                        <sub.icon className="h-3 w-3 shrink-0" />
                        <span>{sub.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
