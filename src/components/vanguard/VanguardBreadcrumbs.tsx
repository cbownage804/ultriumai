import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getVanguardBasePath } from '@/utils/subdomain';
import { cn } from '@/lib/utils';

interface BreadcrumbConfig {
  path: string;
  label: string;
  parent?: string;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
  'dashboard': 'Command',
  'tickets': 'Tickets',
  'customers': 'Customers',
  'devices': 'Devices',
  'alerts': 'Alerts',
  'rmm': 'Horizon RMM',
  'patches': 'Patches',
  'assets': 'Assets',
  'scripts': 'Scripts',
  'backups': 'Backups',
  'automation': 'Automation',
  'sentinel': 'Sentinel M365',
  'threats': 'Threats',
  'soc': 'SOC',
  'helpdesk': 'Helpdesk',
  'sla': 'SLA Management',
  'workflows': 'Workflows',
  'email-integration': 'Email Integration',
  'time-billing': 'Time & Billing',
  'csat': 'CSAT Surveys',
  'network': 'Network Discovery',
  'recon': 'Recon Hardware',
  'atlas': 'Knowledge Base',
  'reports': 'Reports',
  'helpdesk-reports': 'Helpdesk Reports',
  'security-reports': 'Security Analytics',
  'scheduled-scans': 'Scheduled Scans',
  'compliance-reports': 'Compliance',
  'attack-paths': 'Attack Paths',
  'cortex': 'Cortex Hub',
  'cortex-summarizer': 'AI Summarizer',
  'cortex-patterns': 'Pattern Detection',
  'cortex-kb': 'KB Generator',
  'cortex-router': 'Smart Router',
  'cortex-analytics': 'AI Analytics',
  'msp-billing': 'MSP Billing',
  'portal': 'Customer Portal',
  'admin': 'Admin',
  'referrals': 'Referrals',
  'setup': 'Install Agent',
  'safepass': 'SafePass',
  'safescan': 'SafeScan',
  'new': 'New',
};

// Module grouping for context
const moduleGroups: Record<string, string> = {
  'rmm': 'Horizon',
  'devices': 'Horizon',
  'patches': 'Horizon',
  'assets': 'Horizon',
  'scripts': 'Horizon',
  'backups': 'Horizon',
  'automation': 'Horizon',
  'alerts': 'Pursuit',
  'sentinel': 'Pursuit',
  'threats': 'Pursuit',
  'soc': 'Pursuit',
  'helpdesk': 'Response',
  'tickets': 'Response',
  'customers': 'Response',
  'sla': 'Response',
  'workflows': 'Response',
  'email-integration': 'Response',
  'time-billing': 'Response',
  'csat': 'Response',
  'network': 'Recon',
  'recon': 'Recon',
  'atlas': 'Atlas',
  'reports': 'Ledger',
  'helpdesk-reports': 'Ledger',
  'security-reports': 'Ledger',
  'scheduled-scans': 'Ledger',
  'compliance-reports': 'Ledger',
  'attack-paths': 'Ledger',
  'cortex': 'Cortex',
  'cortex-summarizer': 'Cortex',
  'cortex-patterns': 'Cortex',
  'cortex-kb': 'Cortex',
  'cortex-router': 'Cortex',
  'cortex-analytics': 'Cortex',
};

export function VanguardBreadcrumbs() {
  const location = useLocation();
  const basePath = getVanguardBasePath();
  
  // Parse the current path
  const pathSegments = location.pathname
    .replace(basePath, '')
    .split('/')
    .filter(Boolean);

  // Don't show breadcrumbs on dashboard
  if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbs: { label: string; path: string; isLast: boolean }[] = [
    { label: 'Command', path: `${basePath}/dashboard`, isLast: false },
  ];

  let currentPath = basePath;
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Check if it's a UUID (detail page)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    const isShortId = /^[0-9a-f]{8}$/i.test(segment);
    
    if (isUuid || isShortId) {
      breadcrumbs.push({
        label: `#${segment.slice(0, 8)}`,
        path: currentPath,
        isLast,
      });
    } else {
      // Get module context for first segment
      const module = moduleGroups[segment];
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      breadcrumbs.push({
        label: module && index === 0 ? `${module} › ${label}` : label,
        path: currentPath,
        isLast,
      });
    }
  });

  return (
    <nav className="flex items-center gap-1 text-sm mb-4 px-1">
      <Link 
        to={`${basePath}/dashboard`}
        className="p-1 rounded hover:bg-cyan-500/10 transition-colors"
      >
        <Home className="h-4 w-4 text-slate-500 hover:text-cyan-400" />
      </Link>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          {crumb.isLast ? (
            <span className="text-cyan-400 font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className={cn(
                "text-slate-400 hover:text-cyan-300 transition-colors px-1.5 py-0.5 rounded hover:bg-cyan-500/10",
                index === 0 && "hidden sm:inline"
              )}
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
