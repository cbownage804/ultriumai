import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, Plus, Search, Filter, Monitor, Shield, AlertTriangle,
  MoreVertical, Users, DollarSign, Eye, Ticket, Settings, Loader2,
  ArrowUpDown, ChevronUp, ChevronDown, X, Download, Clock, WifiOff,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';
import { supabase } from '@/integrations/supabase/client';
import { AddCustomerDialog } from '@/components/vanguard/AddCustomerDialog';
import { useMSP } from '@/hooks/useMSP';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CustomerDisplay {
  id: string;
  name: string;
  description: string;
  devices: number;
  alerts: number;
  type: 'Managed' | 'On Demand';
  psaCompanyName: string;
  status: 'healthy' | 'warning' | 'critical';
  mrr: number;
  securityScore: number;
  lastSeen: string | null;
  offlineAgents: number;
  slaBreaches: number;
}

type SortField = 'name' | 'devices' | 'type' | 'psaCompanyName';
type SortDirection = 'asc' | 'desc';

const getHealthStatus = (alerts: number): 'healthy' | 'warning' | 'critical' => {
  if (alerts >= 10) return 'critical';
  if (alerts >= 5) return 'warning';
  return 'healthy';
};

export default function VanguardCustomers() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { clients, isLoading: mspLoading, loadClients, loadMSP } = useMSP();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({});
  const [alertCounts, setAlertCounts] = useState<Record<string, number>>({});
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string | null>>({});
  const [offlineMap, setOfflineMap] = useState<Record<string, number>>({});
  const [slaBreachMap, setSlaBreachMap] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Sites | Vanguard';
  }, []);

  const fetchCounts = useCallback(async () => {
    if (clients.length === 0) { setCountsLoading(false); return; }
    const clientIds = clients.map(c => c.id);
    setCountsLoading(true);
    
    const [agentsRes, alertsRes, slaRes] = await Promise.all([
      supabase.from('vanguard_agents').select('client_id, status, last_heartbeat').in('client_id', clientIds),
      supabase.from('rmm_alerts').select('client_id').in('client_id', clientIds).in('status', ['active', 'triggered']),
      supabase.from('helpdesk_tickets').select('customer_id, sla_due_at, status').in('customer_id', clientIds).not('sla_due_at', 'is', null),
    ]);

    // Device counts & last seen & offline agents
    const devCounts: Record<string, number> = {};
    const lastSeen: Record<string, string | null> = {};
    const offline: Record<string, number> = {};
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;

    (agentsRes.data || []).forEach(row => {
      if (!row.client_id) return;
      devCounts[row.client_id] = (devCounts[row.client_id] || 0) + 1;
      
      // Track last seen (most recent heartbeat per client)
      if (row.last_heartbeat) {
        if (!lastSeen[row.client_id] || row.last_heartbeat > lastSeen[row.client_id]!) {
          lastSeen[row.client_id] = row.last_heartbeat;
        }
        // Track offline agents (no heartbeat in 5 min)
        if (new Date(row.last_heartbeat).getTime() < fiveMinAgo && row.status !== 'offline') {
          offline[row.client_id] = (offline[row.client_id] || 0) + 1;
        }
      }
    });
    setDeviceCounts(devCounts);
    setLastSeenMap(lastSeen);
    setOfflineMap(offline);

    // Alert counts
    const aCounts: Record<string, number> = {};
    (alertsRes.data || []).forEach(row => {
      if (row.client_id) aCounts[row.client_id] = (aCounts[row.client_id] || 0) + 1;
    });
    setAlertCounts(aCounts);

    // SLA breaches (overdue and not resolved/closed)
    const now = new Date();
    const slaCounts: Record<string, number> = {};
    (slaRes.data || []).forEach(row => {
      if (row.customer_id && row.sla_due_at && new Date(row.sla_due_at) < now 
          && row.status !== 'resolved' && row.status !== 'closed') {
        slaCounts[row.customer_id] = (slaCounts[row.customer_id] || 0) + 1;
      }
    });
    setSlaBreachMap(slaCounts);
    setCountsLoading(false);
  }, [clients]);

  // Initial fetch
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Realtime subscriptions for auto-updating
  useEffect(() => {
    if (clients.length === 0) return;

    const agentChannel = supabase
      .channel('sites-agents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vanguard_agents' }, () => {
        fetchCounts();
      })
      .subscribe();

    const alertChannel = supabase
      .channel('sites-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rmm_alerts' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(alertChannel);
    };
  }, [clients, fetchCounts]);

  const customers: CustomerDisplay[] = useMemo(() => {
    return clients.map(client => ({
      id: client.id,
      name: client.company_name,
      description: '',
      devices: deviceCounts[client.id] || 0,
      alerts: alertCounts[client.id] || 0,
      type: 'Managed' as const,
      psaCompanyName: client.company_name || '',
      status: getHealthStatus(alertCounts[client.id] || 0),
      mrr: client.monthly_rate || 0,
      securityScore: (alertCounts[client.id] || 0) < 3 ? 92 : (alertCounts[client.id] || 0) < 8 ? 75 : 50,
      lastSeen: lastSeenMap[client.id] || null,
      offlineAgents: offlineMap[client.id] || 0,
      slaBreaches: slaBreachMap[client.id] || 0,
    }));
  }, [clients, deviceCounts, alertCounts, lastSeenMap, offlineMap, slaBreachMap]);

  const totalDevices = customers.reduce((acc, c) => acc + c.devices, 0);

  const filteredAndSorted = useMemo(() => {
    let result = customers.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (typeFilter) {
      result = result.filter(c => c.type === typeFilter);
    }
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = typeof aVal === 'string' 
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [customers, searchQuery, sortField, sortDirection, typeFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.size} site(s)? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('msp_clients').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} site(s) deleted`);
      setSelectedIds(new Set());
      await loadClients();
    } catch (err: any) {
      toast.error('Failed to delete sites', { description: err.message });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Devices', 'Alerts', 'Type', 'Status', 'MRR', 'Last Seen', 'SLA Breaches'];
    const rows = filteredAndSorted.map(c => [
      c.name,
      c.devices,
      c.alerts,
      c.type,
      c.status,
      c.mrr,
      c.lastSeen ? new Date(c.lastSeen).toLocaleString() : 'Never',
      c.slaBreaches,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sites-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const handleCustomerCreated = async () => {
    await loadMSP();
    await loadClients();
    toast.success('Site created successfully');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3 w-3 ml-1 text-cyan-400" />
      : <ChevronDown className="h-3 w-3 ml-1 text-cyan-400" />;
  };

  if (mspLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-white/60">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Sites / All Sites</p>
            <h1 className="text-3xl font-bold text-white">Sites</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-cyan-500/20 text-slate-300 hover:bg-cyan-500/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Site
            </Button>
          </div>
          <AddCustomerDialog 
            open={isCreateDialogOpen} 
            onOpenChange={setIsCreateDialogOpen}
            onCustomerCreated={handleCustomerCreated}
          />
        </div>

        {/* Sites Table Card */}
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm overflow-hidden">
          {/* Table Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">All Sites</h2>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                {filteredAndSorted.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{totalDevices} total devices</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-cyan-500/10 bg-black/20">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input 
                placeholder="Search sites..." 
                className="pl-10 h-9 bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {typeFilter && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">Filtered by: Type</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs gap-1">
                  {typeFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setTypeFilter(null)} />
                </Badge>
              </div>
            )}
            {selectedIds.size > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-8"
                onClick={handleBulkDelete}
              >
                Delete ({selectedIds.size})
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/20 bg-black/30">
                  <th className="w-10 px-4 py-3">
                    <Checkbox 
                      checked={selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                  </th>
                  <th className="text-left px-4 py-3">
                    <button 
                      onClick={() => handleSort('name')} 
                      className="flex items-center text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                      Name <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3">
                    <button 
                      onClick={() => handleSort('devices')} 
                      className="flex items-center text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors mx-auto"
                    >
                      Devices <SortIcon field="devices" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3">
                    <span className="text-sm font-medium text-slate-300">Alerts</span>
                  </th>
                  <th className="text-center px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm font-medium text-slate-300">Last Seen</span>
                  </th>
                  <th className="text-center px-4 py-3 hidden md:table-cell">
                    <span className="text-sm font-medium text-slate-300">Status</span>
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((customer, i) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      "border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer group",
                      selectedIds.has(customer.id) && "bg-cyan-500/10"
                    )}
                    onClick={() => navigate(`${basePath}/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.has(customer.id)}
                        onCheckedChange={() => toggleSelect(customer.id)}
                        className="border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 hover:text-cyan-300 font-medium text-sm">
                          {customer.name}
                        </span>
                        {customer.slaBreaches > 0 && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                            </TooltipTrigger>
                            <TooltipContent>{customer.slaBreaches} SLA breach(es)</TooltipContent>
                          </Tooltip>
                        )}
                        {customer.offlineAgents > 0 && (
                          <Tooltip>
                            <TooltipTrigger>
                              <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                            </TooltipTrigger>
                            <TooltipContent>{customer.offlineAgents} agent(s) offline</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {countsLoading ? (
                        <Skeleton className="h-4 w-8 mx-auto bg-slate-700" />
                      ) : (
                        <span className="text-white text-sm font-medium">{customer.devices}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {countsLoading ? (
                        <Skeleton className="h-4 w-8 mx-auto bg-slate-700" />
                      ) : (
                        <span className={cn(
                          "text-sm font-medium",
                          customer.alerts >= 10 ? "text-red-400" : customer.alerts >= 5 ? "text-amber-400" : "text-slate-300"
                        )}>
                          {customer.alerts}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {countsLoading ? (
                        <Skeleton className="h-4 w-16 mx-auto bg-slate-700" />
                      ) : (
                        <span className="text-slate-400 text-xs">
                          {customer.lastSeen
                            ? formatDistanceToNow(new Date(customer.lastSeen), { addSuffix: true })
                            : 'Never'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <Badge className={cn(
                        "text-xs",
                        customer.status === 'healthy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        customer.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      )}>
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0f0f14] border-cyan-500/20 z-[100]">
                          <DropdownMenuItem 
                            className="text-white/80 hover:bg-cyan-500/10"
                            onClick={() => navigate(`${basePath}/customers/${customer.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-white/80 hover:bg-cyan-500/10"
                            onClick={() => navigate(`${basePath}/devices?customer=${customer.id}`)}
                          >
                            <Monitor className="h-4 w-4 mr-2" /> View Devices
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-white/80 hover:bg-cyan-500/10"
                            onClick={() => navigate(`${basePath}/tickets?customer=${customer.id}`)}
                          >
                            <Ticket className="h-4 w-4 mr-2" /> View Tickets
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-cyan-500/20" />
                          <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                            <Settings className="h-4 w-4 mr-2" /> Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
                {filteredAndSorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">
                        {searchQuery ? 'No sites match your search' : 'No sites yet. Create your first site to get started.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-cyan-500/10 bg-black/20">
            <span className="text-xs text-slate-400">
              Showing {filteredAndSorted.length} of {customers.length} sites
            </span>
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs px-3 py-1">1</Badge>
              <span className="text-xs text-slate-500">20 / page</span>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}
