import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Ticket, Plus, Search, Filter, Clock, AlertCircle, CheckCircle2, 
  XCircle, User, Building2, MoreVertical, MessageSquare, Eye,
  Paperclip, History, Send, Phone, Mail, MapPin, Monitor, 
  HardDrive, Wifi, Calendar, Tag, AlertTriangle, ExternalLink,
  FileText, Image, Copy, ArrowUpRight, Timer, Target, Zap,
  Shield, RefreshCw, ChevronRight, ChevronDown, Trash2, 
  UserPlus, GitMerge, Smile, Meh, Frown, Download, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';
import { useVanguardTickets, useIsAdmin } from '@/hooks/useVanguardTickets';
import { useMSP } from '@/hooks/useMSP';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import { VanguardBreadcrumbs } from '@/components/vanguard/VanguardBreadcrumbs';

interface TicketActivity {
  id: string;
  type: 'comment' | 'status_change' | 'assignment' | 'note' | 'system';
  user: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
}

interface TicketAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'log';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface TicketContact {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
}

interface TicketDevice {
  hostname: string;
  ip: string;
  os: string;
  lastSeen: string;
  agentVersion: string;
  status: 'online' | 'offline' | 'warning';
}

interface Ticket {
  id: string;
  title: string;
  customer: string;
  customerId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee: string;
  assigneeAvatar?: string;
  created: string;
  createdAt: string;
  updatedAt: string;
  sla: string;
  slaDeadline: string;
  slaProgress: number;
  description: string;
  category: string;
  subcategory: string;
  source: 'email' | 'portal' | 'phone' | 'chat' | 'api';
  impact: 'single_user' | 'department' | 'organization';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  contact: TicketContact;
  device?: TicketDevice;
  relatedTickets: string[];
  activities: TicketActivity[];
  attachments: TicketAttachment[];
  resolution?: string;
  firstResponseTime?: string;
  timeSpent: string;
  estimatedTime: string;
  linkedAlerts: string[];
}

// Empty default - data is fetched from database
const mockTickets: Ticket[] = [];

const priorityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors = {
  open: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-cyan-500/20 text-cyan-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
  closed: 'bg-slate-500/20 text-slate-400',
};

const statusIcons = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: XCircle,
};

const sourceIcons = {
  email: Mail,
  phone: Phone,
  portal: Monitor,
  chat: MessageSquare,
  api: Zap,
};

const impactLabels = {
  single_user: { label: 'Single User', color: 'text-slate-400' },
  department: { label: 'Department', color: 'text-yellow-400' },
  organization: { label: 'Organization-wide', color: 'text-red-400' },
};

export default function VanguardTickets() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { clients } = useMSP();
  const { isAdmin } = useIsAdmin();
  const [adminMode, setAdminMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tickets');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [tickets, setTickets] = useState(mockTickets);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [viewType, setViewType] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<'created' | 'priority' | 'client' | 'status'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [clientSearch, setClientSearch] = useState('');
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    customer: '',
  });

  // Extract unique assignees from tickets
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<string>();
    tickets.forEach(t => {
      if (t.assignee && t.assignee !== 'Unassigned') {
        assignees.add(t.assignee);
      }
    });
    return Array.from(assignees);
  }, [tickets]);

  useEffect(() => {
    document.title = 'Tickets | Vanguard';
  }, []);

  // Filter by client search as well
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c => 
      c.company_name.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [clients, clientSearch]);

  const filteredTickets = useMemo(() => {
    let result = tickets.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ticket.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ticket.contact.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesOrg = organizationFilter === 'all' || ticket.customerId === organizationFilter;
      const matchesAssignee = assigneeFilter === 'all' || ticket.assignee === assigneeFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesOrg && matchesAssignee;
    });

    // Sort tickets
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder = { open: 0, in_progress: 1, resolved: 2, closed: 3 };

    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'client':
          comparison = a.customer.localeCompare(b.customer);
          break;
        case 'status':
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tickets, searchQuery, statusFilter, priorityFilter, organizationFilter, assigneeFilter, sortField, sortOrder]);

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

  const handleBulkDelete = () => {
    setTickets(tickets.filter(t => !selectedTickets.includes(t.id)));
    toast.success(`${selectedTickets.length} tickets deleted`);
    setSelectedTickets([]);
  };

  const handleBulkAssign = () => {
    setTickets(tickets.map(t => 
      selectedTickets.includes(t.id) ? { ...t, assignee: 'Current User', status: 'in_progress' as const } : t
    ));
    toast.success(`${selectedTickets.length} tickets assigned to you`);
    setSelectedTickets([]);
  };

  const handleBulkSetStatus = (status: string) => {
    setTickets(tickets.map(t => 
      selectedTickets.includes(t.id) ? { ...t, status: status as Ticket['status'] } : t
    ));
    toast.success(`${selectedTickets.length} tickets updated`);
    setSelectedTickets([]);
  };

  const getSentimentIcon = (urgency: string) => {
    if (urgency === 'critical' || urgency === 'high') return { icon: Frown, color: 'text-red-400' };
    if (urgency === 'medium') return { icon: Meh, color: 'text-yellow-400' };
    return { icon: Smile, color: 'text-emerald-400' };
  };

  const getActivityStatus = (ticket: Ticket) => {
    const hasUnread = ticket.activities.length > 0;
    if (ticket.status === 'open' && hasUnread) return { label: 'Awaiting response', color: 'text-amber-400', dot: 'bg-amber-400' };
    if (ticket.status === 'in_progress') return { label: 'Read', color: 'text-emerald-400', dot: 'bg-emerald-400' };
    return { label: 'Read', color: 'text-emerald-400', dot: 'bg-emerald-400' };
  };

  const handleCreateTicket = () => {
    if (!newTicket.title || !newTicket.customer) {
      toast.error('Please fill in required fields');
      return;
    }

    const ticketId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`;
    const createdTicket = {
      id: ticketId,
      title: newTicket.title,
      description: newTicket.description || 'No description provided',
      priority: newTicket.priority as Ticket['priority'],
      customer: newTicket.customer,
      customerId: `cust-${Date.now()}`,
      status: 'open' as const,
      assignee: 'Unassigned',
      created: 'Just now',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sla: '24h remaining',
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      slaProgress: 0,
      category: 'General',
      subcategory: 'Support Request',
      source: 'portal' as const,
      impact: 'single_user' as const,
      urgency: 'medium' as const,
      tags: ['new'],
      contact: {
        name: 'Portal User',
        email: 'user@example.com',
        phone: 'N/A',
        role: 'End User',
      },
      relatedTickets: [],
      activities: [
        { id: 'act-1', type: 'system' as const, user: 'System', content: 'Ticket created via MSP portal', timestamp: 'Just now' },
      ],
      attachments: [],
      timeSpent: '0m',
      estimatedTime: '2h',
      linkedAlerts: [],
    };

    setTickets([createdTicket, ...tickets]);
    setNewTicket({ title: '', description: '', priority: 'medium', customer: '' });
    setIsCreateDialogOpen(false);
    toast.success(`Ticket ${ticketId} created successfully`);
  };

  const handleAssign = (ticketId: string) => {
    setTickets(tickets.map(t => 
      t.id === ticketId ? { ...t, assignee: 'Current User', status: 'in_progress' } : t
    ));
    toast.success(`Ticket ${ticketId} assigned to you`);
  };

  const handleAddNote = (ticketId: string) => {
    toast.success(`Note added to ${ticketId}`);
  };

  const handleCloseTicket = (ticketId: string) => {
    setTickets(tickets.map(t => 
      t.id === ticketId ? { ...t, status: 'resolved', sla: 'Completed' } : t
    ));
    toast.success(`Ticket ${ticketId} closed`);
  };

  const handleViewDetails = (ticket: Ticket) => {
    // Navigate to full ticket detail page
    navigate(`${basePath}/tickets/${ticket.id}`);
  };

  const handleQuickView = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Breadcrumbs */}
      <VanguardBreadcrumbs />
      
      {/* Top Bar - Atera Style */}
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
              <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                <Calendar className="h-4 w-4 mr-2" />
                Scheduled Ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input 
              placeholder="Search" 
              className="pl-10 w-64 bg-slate-800/50 border-cyan-500/20 text-white placeholder:text-white/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
        
        {/* Admin Mode Toggle - Only visible to admins */}
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

      {/* Tabs - Atera Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-cyan-500/20 rounded-none h-auto p-0 w-full justify-start">
          <TabsTrigger 
            value="tickets" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-4 py-2"
          >
            Tickets
          </TabsTrigger>
          <TabsTrigger 
            value="scheduled" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-4 py-2"
          >
            Scheduled Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4 space-y-4">
          {/* Bulk Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedTickets.length > 0 && (
                <>
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
                    Assign ticket
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
                  <Button variant="ghost" size="sm" className="text-white/60 hover:bg-cyan-500/10">
                    <Tag className="h-4 w-4 mr-1" />
                    Set priority
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:bg-cyan-500/10">
                    <GitMerge className="h-4 w-4 mr-1" />
                    Merge tickets
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">Displaying {filteredTickets.length} of {tickets.length} tickets</span>
              
              {/* Sort Dropdown */}
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

              <Select value={viewType} onValueChange={setViewType}>
                <SelectTrigger className="w-36 bg-slate-800/50 border-cyan-500/20 text-white">
                  <SelectValue placeholder="Default view" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-cyan-500/20">
                  <SelectItem value="default">Default view</SelectItem>
                  <SelectItem value="compact">Compact view</SelectItem>
                  <SelectItem value="detailed">Detailed view</SelectItem>
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
                      {/* Organization Filter with Search */}
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
                            {filteredClients.length === 0 && clientSearch && (
                              <div className="p-2 text-sm text-white/40 text-center">No clients found</div>
                            )}
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
                            <SelectItem value="open">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                Open
                              </div>
                            </SelectItem>
                            <SelectItem value="in_progress">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                In Progress
                              </div>
                            </SelectItem>
                            <SelectItem value="resolved">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                Resolved
                              </div>
                            </SelectItem>
                            <SelectItem value="closed">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-400" />
                                Closed
                              </div>
                            </SelectItem>
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
                            <SelectItem value="critical">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                Critical
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                High
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                Medium
                              </div>
                            </SelectItem>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-500" />
                                Low
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Assigned Technician Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Assigned To</Label>
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                          <SelectTrigger className="bg-slate-800/50 border-cyan-500/20 text-white">
                            <User className="h-4 w-4 mr-2 text-purple-400" />
                            <SelectValue placeholder="All Technicians" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-cyan-500/20">
                            <SelectItem value="all">All Technicians</SelectItem>
                            <SelectItem value="Unassigned">Unassigned</SelectItem>
                            {uniqueAssignees.map(assignee => (
                              <SelectItem key={assignee} value={assignee}>
                                {assignee}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Active Filters Display */}
                    {(organizationFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all' || statusFilter !== 'all') && (
                      <div className="mt-4 pt-4 border-t border-cyan-500/20">
                        <div className="flex flex-wrap gap-2">
                          {organizationFilter !== 'all' && (
                            <Badge 
                              variant="outline" 
                              className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 cursor-pointer hover:bg-cyan-500/20"
                              onClick={() => setOrganizationFilter('all')}
                            >
                              <Building2 className="h-3 w-3 mr-1" />
                              {clients.find(c => c.id === organizationFilter)?.company_name || 'Organization'}
                              <XCircle className="h-3 w-3 ml-1" />
                            </Badge>
                          )}
                          {statusFilter !== 'all' && (
                            <Badge 
                              variant="outline" 
                              className="bg-blue-500/10 border-blue-500/30 text-blue-400 cursor-pointer hover:bg-blue-500/20"
                              onClick={() => setStatusFilter('all')}
                            >
                              Status: {statusFilter.replace('_', ' ')}
                              <XCircle className="h-3 w-3 ml-1" />
                            </Badge>
                          )}
                          {priorityFilter !== 'all' && (
                            <Badge 
                              variant="outline" 
                              className="bg-orange-500/10 border-orange-500/30 text-orange-400 cursor-pointer hover:bg-orange-500/20"
                              onClick={() => setPriorityFilter('all')}
                            >
                              Priority: {priorityFilter}
                              <XCircle className="h-3 w-3 ml-1" />
                            </Badge>
                          )}
                          {assigneeFilter !== 'all' && (
                            <Badge 
                              variant="outline" 
                              className="bg-purple-500/10 border-purple-500/30 text-purple-400 cursor-pointer hover:bg-purple-500/20"
                              onClick={() => setAssigneeFilter('all')}
                            >
                              <User className="h-3 w-3 mr-1" />
                              {assigneeFilter}
                              <XCircle className="h-3 w-3 ml-1" />
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tickets Table - Atera Style */}
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
                      <th className="text-left p-3 text-white/60 font-medium text-sm">SLA</th>
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
                    {filteredTickets.map((ticket) => {
                      return (
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
                                  {ticket.customer.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-cyan-400 font-mono text-sm">#{ticket.id.split('-')[1]}</span>
                                  <span className="text-white font-medium">{ticket.title}</span>
                                </div>
                                <div className="text-white/40 text-xs mt-0.5">
                                  {ticket.contact.name} • Created {ticket.created}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-cyan-400/60" />
                              <span className="text-cyan-400 font-medium text-sm">{ticket.customer}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge 
                              variant="outline" 
                              className={`${
                                ticket.slaProgress >= 75 ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                                ticket.slaProgress >= 50 ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' :
                                'border-slate-500/50 text-slate-400 bg-slate-500/10'
                              }`}
                            >
                              {ticket.sla === 'Completed' ? 'N/A' : 'No SLA'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-white/80">{ticket.assignee}</span>
                          </td>
                          <td className="p-3">
                            <Badge className={priorityColors[ticket.priority]}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={statusColors[ticket.status]}>
                              {ticket.status === 'open' ? 'Open' : 
                               ticket.status === 'in_progress' ? 'In Progress' :
                               ticket.status === 'resolved' ? 'Resolved' : 'Closed'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-white/20 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No scheduled tickets</h3>
              <p className="text-white/50 mb-4">Schedule recurring tickets to automate routine maintenance tasks</p>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Create Scheduled Ticket
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Title *</Label>
              <Input
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder="Brief description of the issue"
                className="bg-black/40 border-cyan-500/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Customer *</Label>
              <Select value={newTicket.customer} onValueChange={(v) => setNewTicket({ ...newTicket, customer: v })}>
                <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-cyan-500/20">
                  <SelectItem value="Acme Corp">Acme Corp</SelectItem>
                  <SelectItem value="TechStart Inc">TechStart Inc</SelectItem>
                  <SelectItem value="GlobalTech">GlobalTech</SelectItem>
                  <SelectItem value="DataFlow LLC">DataFlow LLC</SelectItem>
                  <SelectItem value="StartupXYZ">StartupXYZ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Priority</Label>
              <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-cyan-500/20">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Description</Label>
              <Textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Detailed description of the issue"
                className="bg-black/40 border-cyan-500/20 text-white min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-cyan-500/20 text-white/80">
              Cancel
            </Button>
            <Button onClick={handleCreateTicket} className="bg-cyan-500 hover:bg-cyan-600 text-black">
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {selectedTicket && (
            <div className="flex flex-col h-full max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-cyan-500/20 bg-slate-900/80">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Ticket className="h-5 w-5 text-cyan-400" />
                      <span className="text-white/60 font-mono">{selectedTicket.id}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-white/40 hover:text-white"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTicket.id);
                          toast.success('Ticket ID copied');
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-3">{selectedTicket.title}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={priorityColors[selectedTicket.priority]}>
                        {selectedTicket.priority}
                      </Badge>
                      <Badge className={statusColors[selectedTicket.status]}>
                        {statusIcons[selectedTicket.status] && (() => {
                          const Icon = statusIcons[selectedTicket.status];
                          return <Icon className="h-3 w-3 mr-1" />;
                        })()}
                        {selectedTicket.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                        {(() => {
                          const Icon = sourceIcons[selectedTicket.source];
                          return <Icon className="h-3 w-3 mr-1" />;
                        })()}
                        {selectedTicket.source}
                      </Badge>
                      {selectedTicket.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="border-white/20 text-white/60 text-xs">
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-cyan-500/20 text-cyan-400">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Full
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {/* SLA Progress */}
                    <Card className="bg-black/30 border-cyan-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-cyan-400" />
                            <span className="text-white/80 font-medium">SLA Status</span>
                          </div>
                          <span className={`font-medium ${
                            selectedTicket.slaProgress >= 75 ? 'text-red-400' : 
                            selectedTicket.slaProgress >= 50 ? 'text-yellow-400' : 'text-emerald-400'
                          }`}>
                            {selectedTicket.sla}
                          </span>
                        </div>
                        <Progress 
                          value={selectedTicket.slaProgress} 
                          className="h-2 bg-black/40"
                        />
                        <div className="flex justify-between mt-2 text-xs text-white/40">
                          <span>Time Spent: {selectedTicket.timeSpent}</span>
                          <span>Estimated: {selectedTicket.estimatedTime}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Description */}
                    <div>
                      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-cyan-400" />
                        Description
                      </h3>
                      <p className="text-white/70 bg-black/20 p-4 rounded-lg border border-cyan-500/10 leading-relaxed">
                        {selectedTicket.description}
                      </p>
                    </div>

                    {/* Resolution (if resolved) */}
                    {selectedTicket.resolution && (
                      <div>
                        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Resolution
                        </h3>
                        <p className="text-emerald-400/80 bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                          {selectedTicket.resolution}
                        </p>
                      </div>
                    )}

                    {/* Impact & Category */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-black/30 border-cyan-500/20">
                        <CardContent className="p-4">
                          <Label className="text-white/50 text-xs uppercase tracking-wide">Impact</Label>
                          <p className={`font-medium mt-1 ${impactLabels[selectedTicket.impact].color}`}>
                            {impactLabels[selectedTicket.impact].label}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-black/30 border-cyan-500/20">
                        <CardContent className="p-4">
                          <Label className="text-white/50 text-xs uppercase tracking-wide">Category</Label>
                          <p className="text-white mt-1">{selectedTicket.category}</p>
                          <p className="text-white/50 text-sm">{selectedTicket.subcategory}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Device Info */}
                    {selectedTicket.device && (
                      <div>
                        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-cyan-400" />
                          Affected Device
                        </h3>
                        <Card className="bg-black/30 border-cyan-500/20">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label className="text-white/50 text-xs">Hostname</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    selectedTicket.device.status === 'online' ? 'bg-emerald-400' :
                                    selectedTicket.device.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                                  }`} />
                                  <span className="text-white font-mono">{selectedTicket.device.hostname}</span>
                                </div>
                              </div>
                              <div>
                                <Label className="text-white/50 text-xs">IP Address</Label>
                                <p className="text-white font-mono mt-1">{selectedTicket.device.ip}</p>
                              </div>
                              <div>
                                <Label className="text-white/50 text-xs">Operating System</Label>
                                <p className="text-white mt-1">{selectedTicket.device.os}</p>
                              </div>
                              <div>
                                <Label className="text-white/50 text-xs">Last Seen</Label>
                                <p className="text-white/70 mt-1">{selectedTicket.device.lastSeen}</p>
                              </div>
                              <div>
                                <Label className="text-white/50 text-xs">Agent Version</Label>
                                <p className="text-white/70 mt-1">{selectedTicket.device.agentVersion}</p>
                              </div>
                              <div>
                                <Button variant="outline" size="sm" className="mt-1 border-cyan-500/20 text-cyan-400 text-xs">
                                  <ArrowUpRight className="h-3 w-3 mr-1" />
                                  View Device
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Attachments */}
                    {selectedTicket.attachments.length > 0 && (
                      <div>
                        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-cyan-400" />
                          Attachments ({selectedTicket.attachments.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedTicket.attachments.map(att => (
                            <div 
                              key={att.id}
                              className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-cyan-500/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {att.type === 'image' ? (
                                  <Image className="h-4 w-4 text-purple-400" />
                                ) : att.type === 'log' ? (
                                  <FileText className="h-4 w-4 text-amber-400" />
                                ) : (
                                  <FileText className="h-4 w-4 text-blue-400" />
                                )}
                                <div>
                                  <p className="text-white text-sm">{att.name}</p>
                                  <p className="text-white/40 text-xs">{att.size} • {att.uploadedBy} • {att.uploadedAt}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Tickets & Alerts */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTicket.relatedTickets.length > 0 && (
                        <div>
                          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-cyan-400" />
                            Related Tickets
                          </h3>
                          <div className="space-y-2">
                            {selectedTicket.relatedTickets.map(rt => (
                              <div key={rt} className="flex items-center gap-2 p-2 bg-black/20 rounded border border-cyan-500/10">
                                <Ticket className="h-4 w-4 text-white/40" />
                                <span className="text-cyan-400 font-mono text-sm">{rt}</span>
                                <ChevronRight className="h-4 w-4 text-white/20 ml-auto" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedTicket.linkedAlerts.length > 0 && (
                        <div>
                          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            Linked Alerts
                          </h3>
                          <div className="space-y-2">
                            {selectedTicket.linkedAlerts.map(alt => (
                              <div key={alt} className="flex items-center gap-2 p-2 bg-black/20 rounded border border-amber-500/10">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <span className="text-amber-400 font-mono text-sm">{alt}</span>
                                <ChevronRight className="h-4 w-4 text-white/20 ml-auto" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Activity Timeline */}
                    <div>
                      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <History className="h-4 w-4 text-cyan-400" />
                        Activity Timeline
                      </h3>
                      <div className="space-y-4">
                        {selectedTicket.activities.map((activity, idx) => (
                          <div key={activity.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                activity.type === 'comment' ? 'bg-blue-500/20 text-blue-400' :
                                activity.type === 'status_change' ? 'bg-cyan-500/20 text-cyan-400' :
                                activity.type === 'assignment' ? 'bg-purple-500/20 text-purple-400' :
                                activity.type === 'note' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>
                                {activity.type === 'comment' && <MessageSquare className="h-4 w-4" />}
                                {activity.type === 'status_change' && <RefreshCw className="h-4 w-4" />}
                                {activity.type === 'assignment' && <User className="h-4 w-4" />}
                                {activity.type === 'note' && <FileText className="h-4 w-4" />}
                                {activity.type === 'system' && <Zap className="h-4 w-4" />}
                              </div>
                              {idx < selectedTicket.activities.length - 1 && (
                                <div className="w-px h-full bg-cyan-500/20 my-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium text-sm">{activity.user}</span>
                                <span className="text-white/40 text-xs">{activity.timestamp}</span>
                              </div>
                              <p className="text-white/70 text-sm bg-black/20 p-3 rounded-lg border border-cyan-500/10">
                                {activity.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Sidebar */}
                <div className="w-80 border-l border-cyan-500/20 p-4 bg-black/20 overflow-y-auto">
                  {/* Quick Stats */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Created</span>
                      <span className="text-white">{selectedTicket.created}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">First Response</span>
                      <span className={selectedTicket.firstResponseTime ? 'text-emerald-400' : 'text-amber-400'}>
                        {selectedTicket.firstResponseTime || 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Time Spent</span>
                      <span className="text-white">{selectedTicket.timeSpent}</span>
                    </div>
                  </div>

                  <Separator className="bg-cyan-500/20 mb-4" />

                  {/* Assignee */}
                  <div className="mb-6">
                    <Label className="text-white/50 text-xs uppercase tracking-wide">Assignee</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                          {selectedTicket.assignee === 'Unassigned' ? '?' : selectedTicket.assignee.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{selectedTicket.assignee}</p>
                        {selectedTicket.assignee !== 'Unassigned' && (
                          <p className="text-white/40 text-xs">Technician</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3 border-cyan-500/20 text-cyan-400"
                      onClick={() => {
                        handleAssign(selectedTicket.id);
                        setSelectedTicket({ ...selectedTicket, assignee: 'Current User' });
                      }}
                    >
                      <User className="h-3 w-3 mr-2" />
                      {selectedTicket.assignee === 'Unassigned' ? 'Assign to Me' : 'Reassign'}
                    </Button>
                  </div>

                  <Separator className="bg-cyan-500/20 mb-4" />

                  {/* Contact */}
                  <div className="mb-6">
                    <Label className="text-white/50 text-xs uppercase tracking-wide">Requester</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-500/20 text-purple-400">
                            {selectedTicket.contact.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{selectedTicket.contact.name}</p>
                          <p className="text-white/40 text-xs">{selectedTicket.contact.role}</p>
                        </div>
                      </div>
                      <div className="space-y-2 pl-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-white/40" />
                          <span className="text-cyan-400 text-xs">{selectedTicket.contact.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-white/40" />
                          <span className="text-white/70 text-xs">{selectedTicket.contact.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-3 w-3 text-white/40" />
                          <span className="text-white/70 text-xs">{selectedTicket.customer}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-cyan-500/20 mb-4" />

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-black"
                      onClick={() => {
                        toast.success('Reply sent');
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-cyan-500/20 text-white/80"
                      onClick={() => handleAddNote(selectedTicket.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                    {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                      <Button 
                        variant="outline" 
                        className="w-full border-emerald-500/20 text-emerald-400"
                        onClick={() => {
                          handleCloseTicket(selectedTicket.id);
                          setSelectedTicket(null);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Resolve Ticket
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
