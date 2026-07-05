import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { usePlatformRole } from '@/hooks/usePlatformRole';
import { Shield, Users, Building2, Briefcase, DollarSign, Settings2, Radar, Server, Sparkles, ScrollText, AlertTriangle, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

const NAV = [
  { section: 'Platform', items: [
    { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  ]},
  { section: 'MSPs', items: [
    { to: '/admin/msps', label: 'MSPs & Clients', icon: Briefcase },
  ]},
  { section: 'Billing', items: [
    { to: '/admin/billing', label: 'Revenue & Stripe', icon: DollarSign },
  ]},
  { section: 'Operations', items: [
    { to: '/admin/ops/announcements', label: 'Announcements', icon: ScrollText },
    { to: '/admin/ops/flags', label: 'Feature Flags', icon: Settings2 },
    { to: '/admin/ops/audit', label: 'Audit Log', icon: ScrollText },
    { to: '/admin/ops/support', label: 'Support Tickets', icon: ScrollText },
  ]},
  { section: 'Threat Intel', items: [
    { to: '/admin/threat', label: 'Global Threats', icon: Radar },
    { to: '/admin/fleet', label: 'Agent Fleet', icon: Server },
  ]},
  { section: 'AI', items: [
    { to: '/admin/ai', label: 'AI Analytics', icon: Sparkles },
  ]},
  { section: 'Danger', items: [
    { to: '/admin/danger', label: 'Danger Zone', icon: AlertTriangle },
  ]},
];

export default function AdminLayout() {
  const { isAdmin, loading, roles } = usePlatformRole();
  const location = useLocation();
  if (loading) return <PageSkeleton variant="dashboard" />;
  if (!isAdmin) return <Navigate to="/app/dashboard" replace state={{ from: location }} />;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r border-border/60 bg-card/40 flex flex-col">
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <div className="font-semibold text-sm">Wrayth Admin</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{roles.join(' · ')}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-4">
          {NAV.map((sec) => (
            <div key={sec.section}>
              <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">{sec.section}</div>
              <div className="space-y-0.5">
                {sec.items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                    )}
                  >
                    <it.icon className="h-4 w-4" />
                    {it.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60">
          <NavLink to="/app/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to app
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
