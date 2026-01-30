import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Ticket, 
  Users, 
  Building2, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  CalendarDays,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMSP } from '@/hooks/useMSP';
import { format, subDays, startOfDay, endOfDay, differenceInHours, differenceInDays } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { cn } from '@/lib/utils';

interface TicketData {
  id: string;
  client_id: string | null;
  assigned_to: string | null;
  title: string;
  priority: string;
  status: string;
  category: string | null;
  source: string | null;
  created_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  first_response_at: string | null;
  sla_due_at: string | null;
  actual_hours: number | null;
  billable_hours: number | null;
  customer_satisfaction: number | null;
}

interface ReportFilters {
  clientId: string;
  assignedTo: string;
  dateRange: { from: Date; to: Date };
  priority: string;
  status: string;
  category: string;
}

const COLORS = ['#22d3ee', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function HelpdeskReports() {
  const { user } = useAuth();
  const { clients } = useMSP();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('overview');
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  
  const [filters, setFilters] = useState<ReportFilters>({
    clientId: 'all',
    assignedTo: 'all',
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    priority: 'all',
    status: 'all',
    category: 'all'
  });

  // Fetch tickets
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('id, client_id, assigned_to, title, priority, status, category, source, created_at, resolved_at, closed_at, first_response_at, sla_due_at, actual_hours, billable_hours, customer_satisfaction')
          .eq('user_id', user.id)
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);

        // Extract unique technicians from assigned_to
        const uniqueTechs = new Map<string, string>();
        (data || []).forEach(t => {
          if (t.assigned_to) {
            uniqueTechs.set(t.assigned_to, t.assigned_to);
          }
        });
        setTechnicians(Array.from(uniqueTechs.entries()).map(([id, name]) => ({ id, name: name.split('@')[0] || name })));

      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, filters.dateRange]);

  // Apply filters
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (filters.clientId !== 'all' && ticket.client_id !== filters.clientId) return false;
      if (filters.assignedTo !== 'all' && ticket.assigned_to !== filters.assignedTo) return false;
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
      if (filters.status !== 'all' && ticket.status !== filters.status) return false;
      if (filters.category !== 'all' && ticket.category !== filters.category) return false;
      return true;
    });
  }, [tickets, filters]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredTickets.length;
    const open = filteredTickets.filter(t => t.status === 'open').length;
    const resolved = filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const pending = filteredTickets.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    
    // SLA compliance
    const withSLA = filteredTickets.filter(t => t.sla_due_at);
    const slaMet = withSLA.filter(t => {
      if (!t.resolved_at || !t.sla_due_at) return false;
      return new Date(t.resolved_at) <= new Date(t.sla_due_at);
    }).length;
    const slaCompliance = withSLA.length > 0 ? Math.round((slaMet / withSLA.length) * 100) : 100;

    // Average resolution time (in hours)
    const resolvedTickets = filteredTickets.filter(t => t.resolved_at);
    const avgResolutionHours = resolvedTickets.length > 0 
      ? Math.round(resolvedTickets.reduce((acc, t) => 
          acc + differenceInHours(new Date(t.resolved_at!), new Date(t.created_at)), 0
        ) / resolvedTickets.length)
      : 0;

    // Average first response time (in hours)
    const withFirstResponse = filteredTickets.filter(t => t.first_response_at);
    const avgFirstResponseHours = withFirstResponse.length > 0
      ? Math.round(withFirstResponse.reduce((acc, t) =>
          acc + differenceInHours(new Date(t.first_response_at!), new Date(t.created_at)), 0
        ) / withFirstResponse.length)
      : 0;

    // CSAT score
    const withCSAT = filteredTickets.filter(t => t.customer_satisfaction !== null);
    const avgCSAT = withCSAT.length > 0
      ? (withCSAT.reduce((acc, t) => acc + (t.customer_satisfaction || 0), 0) / withCSAT.length).toFixed(1)
      : 'N/A';

    // Billable hours
    const totalBillableHours = filteredTickets.reduce((acc, t) => acc + (t.billable_hours || 0), 0);

    return { total, open, resolved, pending, slaCompliance, avgResolutionHours, avgFirstResponseHours, avgCSAT, totalBillableHours };
  }, [filteredTickets]);

  // Tickets by client
  const ticketsByClient = useMemo(() => {
    const byClient = new Map<string, { name: string; count: number; resolved: number; open: number }>();
    
    filteredTickets.forEach(ticket => {
      const clientId = ticket.client_id || 'unassigned';
      const client = clients.find(c => c.id === clientId);
      const clientName = client?.company_name || 'Unassigned';
      
      if (!byClient.has(clientId)) {
        byClient.set(clientId, { name: clientName, count: 0, resolved: 0, open: 0 });
      }
      const entry = byClient.get(clientId)!;
      entry.count++;
      if (ticket.status === 'resolved' || ticket.status === 'closed') entry.resolved++;
      if (ticket.status === 'open') entry.open++;
    });

    return Array.from(byClient.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredTickets, clients]);

  // Tickets by technician
  const ticketsByTechnician = useMemo(() => {
    const byTech = new Map<string, { name: string; count: number; resolved: number; avgResolutionHours: number }>();
    
    filteredTickets.forEach(ticket => {
      const techId = ticket.assigned_to || 'unassigned';
      const techName = techId === 'unassigned' ? 'Unassigned' : techId.split('@')[0] || techId;
      
      if (!byTech.has(techId)) {
        byTech.set(techId, { name: techName, count: 0, resolved: 0, avgResolutionHours: 0 });
      }
      const entry = byTech.get(techId)!;
      entry.count++;
      if ((ticket.status === 'resolved' || ticket.status === 'closed') && ticket.resolved_at) {
        entry.resolved++;
        entry.avgResolutionHours += differenceInHours(new Date(ticket.resolved_at), new Date(ticket.created_at));
      }
    });

    return Array.from(byTech.values())
      .map(entry => ({
        ...entry,
        avgResolutionHours: entry.resolved > 0 ? Math.round(entry.avgResolutionHours / entry.resolved) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTickets]);

  // Tickets by priority
  const ticketsByPriority = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    filteredTickets.forEach(t => {
      const priority = t.priority as keyof typeof counts;
      if (counts[priority] !== undefined) counts[priority]++;
    });
    return [
      { name: 'Critical', value: counts.critical, color: '#ef4444' },
      { name: 'High', value: counts.high, color: '#f97316' },
      { name: 'Medium', value: counts.medium, color: '#eab308' },
      { name: 'Low', value: counts.low, color: '#3b82f6' },
    ].filter(p => p.value > 0);
  }, [filteredTickets]);

  // Tickets by status
  const ticketsByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value,
      color: COLORS[i % COLORS.length]
    }));
  }, [filteredTickets]);

  // Tickets over time (daily)
  const ticketsOverTime = useMemo(() => {
    const days = differenceInDays(filters.dateRange.to, filters.dateRange.from);
    const byDate = new Map<string, { date: string; opened: number; resolved: number }>();

    for (let i = 0; i <= days; i++) {
      const date = format(subDays(filters.dateRange.to, days - i), 'MMM dd');
      byDate.set(date, { date, opened: 0, resolved: 0 });
    }

    filteredTickets.forEach(ticket => {
      const openedDate = format(new Date(ticket.created_at), 'MMM dd');
      if (byDate.has(openedDate)) {
        byDate.get(openedDate)!.opened++;
      }
      if (ticket.resolved_at) {
        const resolvedDate = format(new Date(ticket.resolved_at), 'MMM dd');
        if (byDate.has(resolvedDate)) {
          byDate.get(resolvedDate)!.resolved++;
        }
      }
    });

    return Array.from(byDate.values());
  }, [filteredTickets, filters.dateRange]);

  // Categories breakdown
  const ticketsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => {
      const cat = t.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTickets]);

  // Source breakdown
  const ticketsBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => {
      const source = t.source || 'Manual';
      counts[source] = (counts[source] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTickets]);

  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Title', 'Client', 'Assigned To', 'Priority', 'Status', 'Created', 'Resolved', 'Hours'];
    const rows = filteredTickets.map(t => {
      const client = clients.find(c => c.id === t.client_id);
      return [
        t.id,
        t.title,
        client?.company_name || 'Unassigned',
        t.assigned_to || 'Unassigned',
        t.priority,
        t.status,
        format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
        t.resolved_at ? format(new Date(t.resolved_at), 'yyyy-MM-dd HH:mm') : '',
        t.actual_hours || ''
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helpdesk-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    tickets.forEach(t => t.category && cats.add(t.category));
    return Array.from(cats);
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-black/60 border-cyan-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-cyan-400 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="border-cyan-500/30 text-cyan-400"
                onClick={() => setFilters({
                  clientId: 'all',
                  assignedTo: 'all',
                  dateRange: { from: subDays(new Date(), 30), to: new Date() },
                  priority: 'all',
                  status: 'all',
                  category: 'all'
                })}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-purple-500/30 text-purple-400"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Date Range */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start border-cyan-500/20 text-slate-300">
                    <CalendarDays className="h-4 w-4 mr-2 text-cyan-400" />
                    {format(filters.dateRange.from, 'MMM d')} - {format(filters.dateRange.to, 'MMM d')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-black border-cyan-500/30" align="start">
                  <div className="flex gap-2 p-2 border-b border-cyan-500/20">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-xs"
                      onClick={() => setFilters(f => ({ ...f, dateRange: { from: subDays(new Date(), 7), to: new Date() } }))}
                    >
                      7 Days
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-xs"
                      onClick={() => setFilters(f => ({ ...f, dateRange: { from: subDays(new Date(), 30), to: new Date() } }))}
                    >
                      30 Days
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-xs"
                      onClick={() => setFilters(f => ({ ...f, dateRange: { from: subDays(new Date(), 90), to: new Date() } }))}
                    >
                      90 Days
                    </Button>
                  </div>
                  <Calendar
                    mode="range"
                    selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setFilters(f => ({ ...f, dateRange: { from: range.from!, to: range.to! } }));
                      }
                    }}
                    className="rounded-md"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Client */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Client</label>
              <Select value={filters.clientId} onValueChange={(v) => setFilters(f => ({ ...f, clientId: v }))}>
                <SelectTrigger className="border-cyan-500/20 text-slate-300">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Technician */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Technician</label>
              <Select value={filters.assignedTo} onValueChange={(v) => setFilters(f => ({ ...f, assignedTo: v }))}>
                <SelectTrigger className="border-cyan-500/20 text-slate-300">
                  <SelectValue placeholder="All Technicians" />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicians.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Priority</label>
              <Select value={filters.priority} onValueChange={(v) => setFilters(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="border-cyan-500/20 text-slate-300">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Status</label>
              <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                <SelectTrigger className="border-cyan-500/20 text-slate-300">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Category</label>
              <Select value={filters.category} onValueChange={(v) => setFilters(f => ({ ...f, category: v }))}>
                <SelectTrigger className="border-cyan-500/20 text-slate-300">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <MetricCard icon={Ticket} label="Total Tickets" value={metrics.total} color="cyan" />
        <MetricCard icon={AlertTriangle} label="Open" value={metrics.open} color="orange" />
        <MetricCard icon={CheckCircle2} label="Resolved" value={metrics.resolved} color="green" />
        <MetricCard icon={Clock} label="Pending" value={metrics.pending} color="yellow" />
        <MetricCard icon={Target} label="SLA Compliance" value={`${metrics.slaCompliance}%`} color="purple" />
        <MetricCard icon={Timer} label="Avg Resolution" value={`${metrics.avgResolutionHours}h`} color="blue" />
        <MetricCard icon={TrendingUp} label="First Response" value={`${metrics.avgFirstResponseHours}h`} color="teal" />
        <MetricCard icon={Users} label="CSAT" value={metrics.avgCSAT} color="pink" />
      </div>

      {/* Report Tabs */}
      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="bg-black/60 border border-cyan-500/30 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Building2 className="h-4 w-4 mr-2" />
            By Client
          </TabsTrigger>
          <TabsTrigger value="technicians" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Users className="h-4 w-4 mr-2" />
            By Technician
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Breakdown
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets Over Time */}
            <Card className="bg-black/60 border-cyan-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-400">Tickets Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ticketsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.3)' }} />
                      <Legend />
                      <Area type="monotone" dataKey="opened" stackId="1" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} name="Opened" />
                      <Area type="monotone" dataKey="resolved" stackId="2" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} name="Resolved" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="bg-black/60 border-cyan-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-400">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketsByPriority}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {ticketsByPriority.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.3)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Client */}
        <TabsContent value="clients" className="space-y-6">
          <Card className="bg-black/60 border-cyan-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-400">Tickets by Client</CardTitle>
              <CardDescription className="text-slate-500">Top 10 clients by ticket volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketsByClient} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.3)' }} />
                    <Legend />
                    <Bar dataKey="count" name="Total" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="open" name="Open" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Client Table */}
          <Card className="bg-black/60 border-cyan-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-400">Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-black">
                    <tr className="border-b border-cyan-500/20">
                      <th className="text-left text-xs font-semibold text-slate-300 uppercase py-2 px-4">Client</th>
                      <th className="text-center text-xs font-semibold text-slate-300 uppercase py-2 px-4">Total</th>
                      <th className="text-center text-xs font-semibold text-slate-300 uppercase py-2 px-4">Open</th>
                      <th className="text-center text-xs font-semibold text-slate-300 uppercase py-2 px-4">Resolved</th>
                      <th className="text-center text-xs font-semibold text-slate-300 uppercase py-2 px-4">Resolution %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsByClient.map((client, i) => (
                      <tr key={i} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                        <td className="py-2 px-4 text-sm text-slate-200">{client.name}</td>
                        <td className="py-2 px-4 text-center text-sm text-cyan-400 font-semibold">{client.count}</td>
                        <td className="py-2 px-4 text-center text-sm text-orange-400">{client.open}</td>
                        <td className="py-2 px-4 text-center text-sm text-green-400">{client.resolved}</td>
                        <td className="py-2 px-4 text-center">
                          <Badge className={cn(
                            "text-xs",
                            client.count > 0 && (client.resolved / client.count) >= 0.8 
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          )}>
                            {client.count > 0 ? Math.round((client.resolved / client.count) * 100) : 0}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Technician */}
        <TabsContent value="technicians" className="space-y-6">
          <Card className="bg-black/60 border-cyan-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-400">Tickets by Technician</CardTitle>
              <CardDescription className="text-slate-500">Performance breakdown by team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketsByTechnician} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.3)' }} />
                    <Legend />
                    <Bar dataKey="count" name="Assigned" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#a855f7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Technician Table */}
          <Card className="bg-black/60 border-cyan-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-400">Technician Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-black">
                    <tr className="border-b border-cyan-500/20">
                      <th className="text-left text-xs font-semibold text-slate-300 uppercase py-2 px-4">Technician</th>
                      <th className="text-center text-xs font-semibold text-slate-300 uppercase py-2 px-4">Assigned</th>
                      <th className="text-center text-xs font-semibold text-slate-300 uppercase py-2 px-4">Resolved</th>
                      <th className="text-center text-xs font-semibold text-slate-300 uppercase py-2 px-4">Avg Resolution</th>
                      <th className="text-center text-xs font-semibold text-slate-300 uppercase py-2 px-4">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsByTechnician.map((tech, i) => (
                      <tr key={i} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                        <td className="py-2 px-4 text-sm text-slate-200">{tech.name}</td>
                        <td className="py-2 px-4 text-center text-sm text-cyan-400 font-semibold">{tech.count}</td>
                        <td className="py-2 px-4 text-center text-sm text-purple-400">{tech.resolved}</td>
                        <td className="py-2 px-4 text-center text-sm text-slate-300">{tech.avgResolutionHours}h</td>
                        <td className="py-2 px-4 text-center">
                          <Badge className={cn(
                            "text-xs",
                            tech.count > 0 && (tech.resolved / tech.count) >= 0.7
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          )}>
                            {tech.count > 0 ? Math.round((tech.resolved / tech.count) * 100) : 0}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-cyan-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-400">Daily Ticket Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ticketsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.3)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="opened" stroke="#22d3ee" strokeWidth={2} dot={false} name="Opened" />
                      <Line type="monotone" dataKey="resolved" stroke="#a855f7" strokeWidth={2} dot={false} name="Resolved" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-cyan-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-400">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketsByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {ticketsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.3)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breakdown */}
        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-cyan-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-400">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ticketsByCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.3)' }} />
                      <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]}>
                        {ticketsByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-cyan-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-400">By Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketsBySource}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {ticketsBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.3)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billable Hours Summary */}
          <Card className="bg-black/60 border-cyan-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-400">Billable Hours Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {metrics.totalBillableHours.toFixed(1)}
                </p>
                <p className="text-slate-400 mt-2">Total Billable Hours</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    purple: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    green: 'text-green-400 bg-green-500/20 border-green-500/30',
    orange: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    yellow: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    blue: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    teal: 'text-teal-400 bg-teal-500/20 border-teal-500/30',
    pink: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
  };

  return (
    <Card className="bg-black/60 border-cyan-500/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg border", colorClasses[color])}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
