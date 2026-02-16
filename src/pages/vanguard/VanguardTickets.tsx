import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Ticket, Plus, Search, Filter, Clock, AlertCircle, CheckCircle2, 
  XCircle, User, Building2, MessageSquare,
  Calendar, Tag, AlertTriangle, FileText, Zap,
  Shield, RefreshCw, ChevronDown, Trash2, 
  UserPlus, GitMerge, Download, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';
import { useVanguardTickets, useIsAdmin, VanguardTicket } from '@/hooks/useVanguardTickets';
import { useMSP } from '@/hooks/useMSP';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import { VanguardBreadcrumbs } from '@/components/vanguard/VanguardBreadcrumbs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { NewTicketDialog, TicketFormData } from '@/components/vanguard/helpdesk/NewTicketDialog';
import { CortexGatedSection } from '@/components/vanguard/CortexGatedSection';
import { Sparkles, Brain, Route as RouteIcon } from 'lucide-react';

const AITicketSummarizer = lazy(() => import('@/components/vanguard/cortex/AITicketSummarizer').then(m => ({ default: m.AITicketSummarizer })));
const SmartTicketRouter = lazy(() => import('@/components/vanguard/cortex/SmartTicketRouter').then(m => ({ default: m.SmartTicketRouter })));

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-cyan-500/20 text-cyan-400',
  pending: 'bg-amber-500/20 text-amber-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
  closed: 'bg-slate-500/20 text-slate-400',
};

export default function VanguardTickets() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { user } = useAuth();
  const { clients } = useMSP();
  const { isAdmin } = useIsAdmin();
  const [adminMode, setAdminMode] = useState(false);
  const { tickets: dbTickets, isLoading: ticketsLoading, refetch: refetchTickets } = useVanguardTickets({ adminMode });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tickets');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [viewType, setViewType] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<'created' | 'priority' | 'client' | 'status'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [clientSearch, setClientSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    customer: '',
  });

  // Extract unique assignees from tickets
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<string>();
    dbTickets.forEach(t => {
      if (t.assigned_to) {
        assignees.add(t.assigned_to);
      }
    });
    return Array.from(assignees);
  }, [dbTickets]);

  useEffect(() => {
    document.title = 'Tickets | Vanguard';
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c => 
      c.company_name.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [clients, clientSearch]);

  const filteredTickets = useMemo(() => {
    let result = dbTickets.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (ticket.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (ticket.contact_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesOrg = organizationFilter === 'all' || ticket.client_id === organizationFilter;
      const matchesAssignee = assigneeFilter === 'all' || ticket.assigned_to === assigneeFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesOrg && matchesAssignee;
    });

    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<string, number> = { open: 0, in_progress: 1, pending: 2, resolved: 3, closed: 4 };

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'priority':
          comparison = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
          break;
        case 'client':
          comparison = (a.client_name || '').localeCompare(b.client_name || '');
          break;
        case 'status':
          comparison = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [dbTickets, searchQuery, statusFilter, priorityFilter, organizationFilter, assigneeFilter, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1 text-cyan-400" />
      : <ArrowDown className="h-3 w-3 ml-1 text-cyan-400" />;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(filteredTickets.map(t => t.id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId]);
    } else {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) return;
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .in('id', selectedTickets);
      if (error) throw error;
      toast.success(`${selectedTickets.length} tickets deleted`);
      setSelectedTickets([]);
      refetchTickets();
    } catch (err: any) {
      toast.error('Failed to delete tickets', { description: err.message });
    }
  };

  const handleBulkAssign = async () => {
    if (selectedTickets.length === 0 || !user) return;
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: user.id, status: 'in_progress' })
        .in('id', selectedTickets);
      if (error) throw error;
      toast.success(`${selectedTickets.length} tickets assigned to you`);
      setSelectedTickets([]);
      refetchTickets();
    } catch (err: any) {
      toast.error('Failed to assign tickets', { description: err.message });
    }
  };

  const handleBulkSetStatus = async (status: string) => {
    if (selectedTickets.length === 0) return;
    try {
      const updateData: any = { status };
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
      if (status === 'closed') updateData.closed_at = new Date().toISOString();
      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .in('id', selectedTickets);
      if (error) throw error;
      toast.success(`${selectedTickets.length} tickets updated`);
      setSelectedTickets([]);
      refetchTickets();
    } catch (err: any) {
      toast.error('Failed to update tickets', { description: err.message });
    }
  };

  const handleCreateTicket = async (formData: TicketFormData) => {
    if (!formData.title || !formData.customer || !user) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase
        .from('tickets')
        .insert({
          title: formData.title,
          description: formData.description || 'No description provided',
          priority: formData.priority,
          status: formData.status || 'open',
          source: formData.source || 'manual',
          category: formData.type || 'General',
          ticket_number: ticketNumber,
          user_id: user.id,
          client_id: formData.customer,
          tags: formData.tags?.length > 0 ? formData.tags : null,
          sla_due_at: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        });

      if (error) throw error;

      setIsCreateDialogOpen(false);
      toast.success(`Ticket ${ticketNumber} created successfully`);
      refetchTickets();
    } catch (err: any) {
      toast.error('Failed to create ticket', { description: err.message });
    }
  };

  const handleAssign = async (ticketId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: user.id, status: 'in_progress' })
        .eq('id', ticketId);
      if (error) throw error;
      toast.success(`Ticket assigned to you`);
      refetchTickets();
    } catch (err: any) {
      toast.error('Failed to assign ticket', { description: err.message });
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', ticketId);
      if (error) throw error;
      toast.success(`Ticket resolved`);
      refetchTickets();
    } catch (err: any) {
      toast.error('Failed to close ticket', { description: err.message });
    }
  };

  const handleViewDetails = (ticket: VanguardTicket) => {
    navigate(`${basePath}/tickets/${ticket.id}`);
  };

  if (ticketsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <VanguardBreadcrumbs />
      
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
                New
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
              <DropdownMenuItem 
                className="text-white/80 hover:bg-cyan-500/10"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Ticket className="h-4 w-4 mr-2" />
                New Ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input 
              placeholder="Search tickets..." 
              className="pl-10 w-64 bg-slate-800/50 border-cyan-500/20 text-white placeholder:text-white/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchTickets()} className="border-cyan-500/20 text-white/80">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            className="border-cyan-500/20 text-white/80"
            onClick={() => navigate(`${basePath}/setup`)}
          >
            <Download className="h-4 w-4 mr-2" />
            Install agent
          </Button>
        </div>
      </div>

      {/* Page Title with Admin Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          {isAdmin && (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-3 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">Support Mode</span>
            </div>
            <Switch 
              checked={adminMode}
              onCheckedChange={setAdminMode}
              className="data-[state=checked]:bg-purple-500"
            />
            <span className="text-xs text-white/60">
              {adminMode ? 'All customer tickets' : 'My tickets only'}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-cyan-500/20 rounded-none h-auto p-0 w-full justify-start">
          <TabsTrigger 
            value="tickets" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-4 py-2"
          >
            Tickets ({dbTickets.length})
          </TabsTrigger>
          <TabsTrigger 
            value="ai-summarizer" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-400 data-[state=active]:bg-transparent data-[state=active]:text-violet-400 px-4 py-2"
          >
            <Brain className="h-3.5 w-3.5 mr-1.5" />
            AI Summarizer
          </TabsTrigger>
          <TabsTrigger 
            value="smart-router" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-400 data-[state=active]:bg-transparent data-[state=active]:text-violet-400 px-4 py-2"
          >
            <RouteIcon className="h-3.5 w-3.5 mr-1.5" />
            Smart Router
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4 space-y-4">
          {/* Bulk Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedTickets.length > 0 && (
                <>
                  <span className="text-sm text-cyan-400 mr-2">{selectedTickets.length} selected</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-400 hover:bg-red-500/10"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white/60 hover:bg-cyan-500/10"
                    onClick={handleBulkAssign}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign to me
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white/60 hover:bg-cyan-500/10">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Set status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                      <DropdownMenuItem onClick={() => handleBulkSetStatus('open')} className="text-white/80">Open</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkSetStatus('in_progress')} className="text-white/80">In Progress</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkSetStatus('resolved')} className="text-white/80">Resolved</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkSetStatus('closed')} className="text-white/80">Closed</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">Displaying {filteredTickets.length} of {dbTickets.length} tickets</span>
              
              <Select value={`${sortField}-${sortOrder}`} onValueChange={(v) => {
                const [field, order] = v.split('-') as [typeof sortField, 'asc' | 'desc'];
                setSortField(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-40 bg-slate-800/50 border-cyan-500/20 text-white">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-cyan-500/20">
                  <SelectItem value="created-desc">Newest first</SelectItem>
                  <SelectItem value="created-asc">Oldest first</SelectItem>
                  <SelectItem value="priority-asc">Priority (High→Low)</SelectItem>
                  <SelectItem value="priority-desc">Priority (Low→High)</SelectItem>
                  <SelectItem value="client-asc">Client (A→Z)</SelectItem>
                  <SelectItem value="client-desc">Client (Z→A)</SelectItem>
                  <SelectItem value="status-asc">Status (Open→Closed)</SelectItem>
                  <SelectItem value="status-desc">Status (Closed→Open)</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                className={`border-cyan-500/20 ${showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/60'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(organizationFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all' || statusFilter !== 'all') && (
                  <Badge className="ml-2 bg-cyan-500 text-black text-xs h-5 px-1.5">
                    {[organizationFilter, priorityFilter, assigneeFilter, statusFilter].filter(f => f !== 'all').length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Card className="bg-slate-900/80 border-cyan-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filter Tickets
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-white"
                        onClick={() => {
                          setOrganizationFilter('all');
                          setPriorityFilter('all');
                          setAssigneeFilter('all');
                          setStatusFilter('all');
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Organization Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Client / Organization</Label>
                        <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                          <SelectTrigger className="bg-slate-800/50 border-cyan-500/20 text-white">
                            <Building2 className="h-4 w-4 mr-2 text-cyan-400" />
                            <SelectValue placeholder="All Clients" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-cyan-500/20">
                            <div className="p-2 border-b border-cyan-500/20">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                                <Input
                                  placeholder="Search clients..."
                                  value={clientSearch}
                                  onChange={(e) => setClientSearch(e.target.value)}
                                  className="pl-8 h-8 bg-slate-800/80 border-cyan-500/30 text-white text-sm"
                                />
                              </div>
                            </div>
                            <SelectItem value="all">All Clients</SelectItem>
                            {filteredClients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.company_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="bg-slate-800/50 border-cyan-500/20 text-white">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-cyan-500/20">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Priority Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Priority</Label>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                          <SelectTrigger className="bg-slate-800/50 border-cyan-500/20 text-white">
                            <SelectValue placeholder="All Priorities" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-cyan-500/20">
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Assignee Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Assigned To</Label>
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                          <SelectTrigger className="bg-slate-800/50 border-cyan-500/20 text-white">
                            <User className="h-4 w-4 mr-2 text-purple-400" />
                            <SelectValue placeholder="All Technicians" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-cyan-500/20">
                            <SelectItem value="all">All</SelectItem>
                            {uniqueAssignees.map(assignee => (
                              <SelectItem key={assignee} value={assignee}>
                                {assignee}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tickets Table */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-500/20 bg-slate-800/30">
                      <th className="w-10 p-3">
                        <Checkbox 
                          checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                          onCheckedChange={handleSelectAll}
                          className="border-white/20"
                        />
                      </th>
                      <th 
                        className="text-left p-3 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('created')}
                      >
                        <div className="flex items-center">
                          Details
                          {getSortIcon('created')}
                        </div>
                      </th>
                      <th 
                        className="text-left p-3 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('client')}
                      >
                        <div className="flex items-center">
                          <Building2 className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
                          Client
                          {getSortIcon('client')}
                        </div>
                      </th>
                      <th className="text-left p-3 text-white/60 font-medium text-sm">Assigned</th>
                      <th 
                        className="text-left p-3 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('priority')}
                      >
                        <div className="flex items-center">
                          Priority
                          {getSortIcon('priority')}
                        </div>
                      </th>
                      <th 
                        className="text-left p-3 text-white/60 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center">
                          <Ticket className="h-12 w-12 mx-auto text-white/20 mb-4" />
                          <h3 className="text-lg font-medium text-white mb-2">No tickets found</h3>
                          <p className="text-white/50 mb-4">Create your first ticket or adjust your filters</p>
                          <Button 
                            className="bg-cyan-500 hover:bg-cyan-600 text-black"
                            onClick={() => setIsCreateDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Ticket
                          </Button>
                        </td>
                      </tr>
                    ) : filteredTickets.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(ticket)}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedTickets.includes(ticket.id)}
                            onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                            className="border-white/20"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarFallback className="bg-gradient-to-br from-cyan-500/30 to-purple-500/30 text-white text-xs">
                                {(ticket.client_name || 'T').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{ticket.title}</span>
                              </div>
                              <div className="text-white/40 text-xs mt-0.5">
                                {ticket.contact_name || 'Unknown'} • {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-cyan-400/60" />
                            <span className="text-cyan-400 font-medium text-sm">{ticket.client_name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-white/80">{ticket.assigned_to ? 'Assigned' : 'Unassigned'}</span>
                        </td>
                        <td className="p-3">
                          <Badge className={priorityColors[ticket.priority] || priorityColors.medium}>
                            {ticket.priority}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={statusColors[ticket.status] || statusColors.open}>
                            {ticket.status === 'in_progress' ? 'In Progress' : 
                             ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cortex AI - Ticket Summarizer */}
        <TabsContent value="ai-summarizer" className="mt-4">
          <CortexGatedSection
            featureName="AI Ticket Summarizer"
            description="Automatically summarize ticket threads, extract key details, and generate concise overviews — saving technicians time on every escalation."
            icon={<Brain className="h-5 w-5 text-violet-400" />}
          >
            <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-400" /></div>}>
              <AITicketSummarizer />
            </Suspense>
          </CortexGatedSection>
        </TabsContent>

        {/* Cortex AI - Smart Router */}
        <TabsContent value="smart-router" className="mt-4">
          <CortexGatedSection
            featureName="Smart Ticket Router"
            description="AI-powered ticket routing that matches tickets to the best technician based on skills, workload, and historical resolution patterns."
            icon={<RouteIcon className="h-5 w-5 text-violet-400" />}
          >
            <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-400" /></div>}>
              <SmartTicketRouter />
            </Suspense>
          </CortexGatedSection>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog - Full featured from Response module */}
      <NewTicketDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
}
