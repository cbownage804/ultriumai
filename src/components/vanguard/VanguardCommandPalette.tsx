import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Monitor,
  Bell,
  Package,
  Network,
  BookOpen,
  BarChart3,
  CreditCard,
  Settings,
  Shield,
  Sparkles,
  Search,
  FileText,
  Target,
  Activity,
  Wand2,
  Globe,
  Gift,
  Bot,
  Play,
} from 'lucide-react';
import { getVanguardBasePath } from '@/utils/subdomain';
import { supabase } from '@/integrations/supabase/client';
import { useMSP } from '@/hooks/useMSP';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'ticket' | 'customer' | 'device' | 'page' | 'alert';
  path: string;
  icon: React.ElementType;
}

export function VanguardCommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { clients } = useMSP();

  // Navigation items for quick access
  const navigationItems: SearchResult[] = [
    { id: 'nav-dashboard', title: 'Vanguard Command', subtitle: 'Dashboard', type: 'page', path: `${basePath}/dashboard`, icon: LayoutDashboard },
    { id: 'nav-tickets', title: 'Tickets', subtitle: 'View all tickets', type: 'page', path: `${basePath}/tickets`, icon: Ticket },
    { id: 'nav-customers', title: 'Customers', subtitle: 'Manage customers', type: 'page', path: `${basePath}/customers`, icon: Building2 },
    { id: 'nav-devices', title: 'Devices', subtitle: 'RMM devices', type: 'page', path: `${basePath}/devices`, icon: Monitor },
    { id: 'nav-alerts', title: 'Alerts', subtitle: 'Security alerts', type: 'page', path: `${basePath}/alerts`, icon: Bell },
    { id: 'nav-rmm', title: 'Horizon RMM', subtitle: 'Operational visibility', type: 'page', path: `${basePath}/rmm`, icon: Activity },
    { id: 'nav-network', title: 'Network Discovery', subtitle: 'Recon module', type: 'page', path: `${basePath}/network`, icon: Network },
    { id: 'nav-atlas', title: 'Knowledge Base', subtitle: 'Atlas documentation', type: 'page', path: `${basePath}/atlas`, icon: BookOpen },
    { id: 'nav-reports', title: 'Reports', subtitle: 'Ledger analytics', type: 'page', path: `${basePath}/reports`, icon: BarChart3 },
    { id: 'nav-cortex', title: 'Cortex AI', subtitle: 'AI-powered operations', type: 'page', path: `${basePath}/cortex`, icon: Sparkles },
    { id: 'nav-billing', title: 'MSP Billing', subtitle: 'Billing management', type: 'page', path: `${basePath}/msp-billing`, icon: CreditCard },
    { id: 'nav-sentinel', title: 'Sentinel M365', subtitle: 'M365 security', type: 'page', path: `${basePath}/sentinel`, icon: Shield },
    { id: 'nav-patches', title: 'Patch Management', subtitle: 'System updates', type: 'page', path: `${basePath}/patches`, icon: Package },
    { id: 'nav-assets', title: 'Asset Inventory', subtitle: 'Asset tracking', type: 'page', path: `${basePath}/assets`, icon: Package },
    { id: 'nav-sla', title: 'SLA Management', subtitle: 'Response module', type: 'page', path: `${basePath}/sla`, icon: Target },
    { id: 'nav-workflows', title: 'Workflows', subtitle: 'Automation rules', type: 'page', path: `${basePath}/workflows`, icon: Settings },
    { id: 'nav-admin', title: 'Admin Settings', subtitle: 'Platform configuration', type: 'page', path: `${basePath}/admin`, icon: Settings },
    { id: 'nav-portal', title: 'Customer Portal', subtitle: 'Portal settings', type: 'page', path: `${basePath}/portal`, icon: Globe },
    { id: 'nav-referrals', title: 'Referrals', subtitle: 'Refer a friend', type: 'page', path: `${basePath}/referrals`, icon: Gift },
  ];

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Search tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, title, status')
        .eq('user_id', user.id)
        .ilike('title', `%${query}%`)
        .limit(5);

      if (tickets) {
        tickets.forEach(ticket => {
          searchResults.push({
            id: `ticket-${ticket.id}`,
            title: ticket.title || 'Untitled Ticket',
            subtitle: `Status: ${ticket.status}`,
            type: 'ticket',
            path: `${basePath}/tickets/${ticket.id}`,
            icon: Ticket,
          });
        });
      }

      // Search customers from MSP clients
      const matchingClients = clients.filter(client =>
        client.company_name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

      matchingClients.forEach(client => {
        searchResults.push({
          id: `customer-${client.id}`,
          title: client.company_name,
          subtitle: 'Customer',
          type: 'customer',
          path: `${basePath}/customers/${client.id}`,
          icon: Building2,
        });
      });

      // Search agents/devices
      const { data: agents } = await supabase
        .from('vanguard_agents')
        .select('id, name, location')
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`)
        .limit(5);

      if (agents) {
        agents.forEach(agent => {
          searchResults.push({
            id: `device-${agent.id}`,
            title: agent.name || 'Unknown Device',
            subtitle: agent.location || 'Device',
            type: 'device',
            path: `${basePath}/devices/${agent.id}`,
            icon: Monitor,
          });
        });
      }

      // Search alerts
      try {
        const { data: alertData } = await (supabase as any)
          .from('rmm_alerts')
          .select('id, alert_type, severity, status')
          .eq('user_id', user.id)
          .ilike('alert_type', `%${query}%`)
          .limit(5);

        if (alertData) {
          (alertData as any[]).forEach((alert: any) => {
            searchResults.push({
              id: `alert-${alert.id}`,
              title: alert.alert_type || 'Alert',
              subtitle: `${alert.severity} · ${alert.status}`,
              type: 'alert',
              path: `${basePath}/alerts`,
              icon: Bell,
            });
          });
        }
      } catch {}

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setResults(searchResults);
      setIsSearching(false);
    }
  }, [basePath, clients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, performSearch]);

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearch('');
    navigate(path);
  };

  // Filter navigation items based on search
  const filteredNavItems = search.length >= 2
    ? navigationItems.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(search.toLowerCase())
      )
    : navigationItems.slice(0, 8);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search tickets, customers, devices, alerts, or jump to page..."
        value={search}
        onValueChange={setSearch}
        className="border-0"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          {isSearching ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {/* Dynamic search results */}
        {results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((result) => (
              <CommandItem
                key={result.id}
                value={result.id}
                onSelect={() => handleSelect(result.path)}
                className="cursor-pointer"
              >
                <result.icon className="mr-2 h-4 w-4 text-cyan-400" />
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.subtitle && (
                    <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.length > 0 && filteredNavItems.length > 0 && <CommandSeparator />}

        {/* Navigation items */}
        <CommandGroup heading="Quick Navigation">
          {filteredNavItems.map((item) => (
            <CommandItem
              key={item.id}
              value={item.id}
              onSelect={() => handleSelect(item.path)}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4 text-slate-400" />
              <div className="flex flex-col">
                <span>{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect(`${basePath}/tickets/new`)} className="cursor-pointer">
            <Ticket className="mr-2 h-4 w-4 text-green-400" />
            <span>Create New Ticket</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(`${basePath}/customers/new`)} className="cursor-pointer">
            <Building2 className="mr-2 h-4 w-4 text-blue-400" />
            <span>Add New Customer</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(`${basePath}/setup`)} className="cursor-pointer">
            <Monitor className="mr-2 h-4 w-4 text-purple-400" />
            <span>Install Agent</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Footer hint */}
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>Type to search across tickets, customers, and devices</span>
        <kbd className="px-2 py-0.5 bg-muted rounded text-[10px]">ESC to close</kbd>
      </div>
    </CommandDialog>
  );
}

// Hook to open the command palette programmatically
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}
