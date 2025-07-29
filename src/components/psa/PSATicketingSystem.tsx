import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRMMDevices } from "@/hooks/useRMMDevices";
import {
  Ticket,
  Clock,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
  Monitor,
  Settings,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  Wrench,
  Zap,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Archive,
  Users,
  BarChart3,
  TrendingUp,
  DollarSign,
  FileText,
  Timer,
  Target,
  ShieldCheck,
  Activity
} from "lucide-react";

interface PSATicket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'incident' | 'service_request' | 'problem' | 'change' | 'maintenance';
  client_id: string;
  device_id?: string;
  assigned_to?: string;
  time_entries: TimeEntry[];
  estimated_hours?: number;
  billable_hours: number;
  hourly_rate?: number;
  sla_response_due?: string;
  sla_resolution_due?: string;
  source: 'email' | 'phone' | 'portal' | 'rmm' | 'api' | 'manual';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  client?: {
    company_name: string;
  };
  device?: {
    hostname: string;
    ip_address: string;
    status: string;
  };
}

interface TimeEntry {
  id: string;
  ticket_id: string;
  user_id: string;
  description: string;
  hours: number;
  billable: boolean;
  date: string;
  created_at: string;
}

interface PSAStats {
  totalTickets: number;
  openTickets: number;
  overdueTickets: number;
  avgResolutionTime: number;
  totalBillableHours: number;
  revenue: number;
  agentUtilization: number;
  customerSatisfaction: number;
}

export const PSATicketingSystem = () => {
  const [tickets, setTickets] = useState<PSATicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<PSATicket | null>(null);
  const [stats, setStats] = useState<PSAStats>({
    totalTickets: 0,
    openTickets: 0,
    overdueTickets: 0,
    avgResolutionTime: 0,
    totalBillableHours: 0,
    revenue: 0,
    agentUtilization: 0,
    customerSatisfaction: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showTimeEntry, setShowTimeEntry] = useState(false);
  const [activeTab, setActiveTab] = useState("tickets");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { devices } = useRMMDevices();

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'incident',
    client_id: '',
    device_id: '',
    estimated_hours: '',
    hourly_rate: '150'
  });

  const [timeEntry, setTimeEntry] = useState({
    description: '',
    hours: '',
    billable: true,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadTickets();
    loadStats();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTickets: PSATicket[] = data?.map(ticket => ({
        id: ticket.id,
        ticket_number: `TKT-${String(ticket.id).slice(-6).toUpperCase()}`,
        title: ticket.title,
        description: ticket.description || '',
        status: (ticket.status || 'new') as PSATicket['status'],
        priority: (ticket.priority || 'medium') as PSATicket['priority'],
        category: (ticket.category || 'incident') as PSATicket['category'],
        client_id: ticket.client_id || '',
        device_id: undefined,
        assigned_to: ticket.assigned_to,
        time_entries: [],
        estimated_hours: undefined,
        billable_hours: 0,
        hourly_rate: 150,
        sla_response_due: undefined,
        sla_resolution_due: undefined,
        source: 'manual' as PSATicket['source'],
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at,
        client: { company_name: 'Demo Client' },
        device: null
      })) || [];

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from tickets
      const totalTickets = tickets.length;
      const openTickets = tickets.filter(t => ['new', 'open', 'pending'].includes(t.status)).length;
      const overdueTickets = tickets.filter(t => {
        if (!t.sla_resolution_due) return false;
        return new Date(t.sla_resolution_due) < new Date() && t.status !== 'resolved' && t.status !== 'closed';
      }).length;

      const resolvedTickets = tickets.filter(t => t.resolved_at);
      const avgResolutionTime = resolvedTickets.length > 0 
        ? resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at);
            const resolved = new Date(ticket.resolved_at!);
            return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
          }, 0) / resolvedTickets.length
        : 0;

      const totalBillableHours = tickets.reduce((sum, ticket) => sum + ticket.billable_hours, 0);
      const revenue = tickets.reduce((sum, ticket) => sum + (ticket.billable_hours * (ticket.hourly_rate || 150)), 0);

      setStats({
        totalTickets,
        openTickets,
        overdueTickets,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        totalBillableHours: Math.round(totalBillableHours * 10) / 10,
        revenue: Math.round(revenue),
        agentUtilization: 85, // Mock data
        customerSatisfaction: 4.7 // Mock data
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description || !newTicket.client_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const ticketData = {
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
        client_id: newTicket.client_id,
        user_id: user?.id || '',
        status: 'new'
      };

      const { error } = await supabase
        .from('support_tickets')
        .insert(ticketData);

      if (error) throw error;

      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        category: 'incident',
        client_id: '',
        device_id: '',
        estimated_hours: '',
        hourly_rate: '150'
      });
      setShowCreateTicket(false);
      loadTickets();
      
      toast({
        title: "Success",
        description: "Ticket created successfully"
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive"
      });
    }
  };

  const addTimeEntry = async () => {
    if (!selectedTicket || !timeEntry.description || !timeEntry.hours) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const entryData = {
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        description: timeEntry.description,
        hours: parseFloat(timeEntry.hours),
        billable: timeEntry.billable,
        date: timeEntry.date
      };

      // In a real app, this would go to a time_entries table
      console.log('Adding time entry:', entryData);

      setTimeEntry({
        description: '',
        hours: '',
        billable: true,
        date: new Date().toISOString().split('T')[0]
      });
      setShowTimeEntry(false);
      
      toast({
        title: "Success",
        description: "Time entry added successfully"
      });
    } catch (error) {
      console.error('Error adding time entry:', error);
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive"
      });
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      loadTickets();
      toast({
        title: "Success",
        description: `Ticket ${status}`
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive"
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'open': return 'destructive';
      case 'pending': return 'secondary';
      case 'resolved': return 'outline';
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'incident': return AlertTriangle;
      case 'service_request': return User;
      case 'problem': return Settings;
      case 'change': return Wrench;
      case 'maintenance': return Calendar;
      default: return Ticket;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PSA Ticketing System</h1>
          <p className="text-muted-foreground">
            Professional Services Automation with integrated RMM
          </p>
        </div>
        <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newTicket.title}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div>
                  <Label>Client *</Label>
                  <Select value={newTicket.client_id} onValueChange={(value) => setNewTicket(prev => ({ ...prev, client_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client-1">Acme Corp</SelectItem>
                      <SelectItem value="client-2">TechStart Inc</SelectItem>
                      <SelectItem value="client-3">Global Solutions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the issue or request"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={newTicket.priority} onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="service_request">Service Request</SelectItem>
                      <SelectItem value="problem">Problem</SelectItem>
                      <SelectItem value="change">Change</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Device (Optional)</Label>
                  <Select value={newTicket.device_id} onValueChange={(value) => setNewTicket(prev => ({ ...prev, device_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map(device => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.hostname} - {device.ip_address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newTicket.estimated_hours}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label>Hourly Rate ($)</Label>
                  <Input
                    type="number"
                    value={newTicket.hourly_rate}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
                  Cancel
                </Button>
                <Button onClick={createTicket}>
                  Create Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTickets}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.openTickets}</div>
                <p className="text-xs text-muted-foreground">Requiring attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgResolutionTime}h</div>
                <p className="text-xs text-muted-foreground">Average time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${stats.revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">From billable hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {filteredTickets.map(ticket => {
                const CategoryIcon = getCategoryIcon(ticket.category);
                return (
                  <Card key={ticket.id} className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedTicket?.id === ticket.id ? 'border-primary' : ''
                  }`} onClick={() => setSelectedTicket(ticket)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CategoryIcon className="h-4 w-4" />
                            <span className="font-mono text-sm text-muted-foreground">
                              {ticket.ticket_number}
                            </span>
                            <Badge variant={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                            <Badge variant={getStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <h3 className="font-semibold mb-1">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {ticket.client?.company_name}
                          </p>
                          {ticket.device && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Monitor className="h-3 w-3" />
                              {ticket.device.hostname}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                          {ticket.estimated_hours && (
                            <div className="text-xs text-muted-foreground">
                              Est: {ticket.estimated_hours}h
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Ticket Details */}
            <div className="space-y-4">
              {selectedTicket ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{selectedTicket.ticket_number}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTicketStatus(selectedTicket.id, 'open')}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTicketStatus(selectedTicket.id, 'pending')}
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">{selectedTicket.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedTicket.description}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Client:</span>
                          <br />
                          {selectedTicket.client?.company_name}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <br />
                          {selectedTicket.category}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priority:</span>
                          <br />
                          <Badge variant={getPriorityColor(selectedTicket.priority)}>
                            {selectedTicket.priority}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <br />
                          <Badge variant={getStatusColor(selectedTicket.status)}>
                            {selectedTicket.status}
                          </Badge>
                        </div>
                      </div>

                      {selectedTicket.device && (
                        <>
                          <Separator />
                          <div>
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              Connected Device
                            </h5>
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="text-muted-foreground">Hostname:</span> {selectedTicket.device.hostname}
                              </div>
                              <div>
                                <span className="text-muted-foreground">IP:</span> {selectedTicket.device.ip_address}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                            <Badge variant={selectedTicket.device.status === 'online' ? 'default' : 'secondary'} className="ml-2">
                              {selectedTicket.device.status}
                            </Badge>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">Time Tracking</h5>
                          <Dialog open={showTimeEntry} onOpenChange={setShowTimeEntry}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Timer className="h-3 w-3 mr-1" />
                                Log Time
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Time Entry</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Description</Label>
                                  <Textarea
                                    value={timeEntry.description}
                                    onChange={(e) => setTimeEntry(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="What did you work on?"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Hours</Label>
                                    <Input
                                      type="number"
                                      step="0.25"
                                      value={timeEntry.hours}
                                      onChange={(e) => setTimeEntry(prev => ({ ...prev, hours: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label>Date</Label>
                                    <Input
                                      type="date"
                                      value={timeEntry.date}
                                      onChange={(e) => setTimeEntry(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="billable"
                                    checked={timeEntry.billable}
                                    onChange={(e) => setTimeEntry(prev => ({ ...prev, billable: e.target.checked }))}
                                  />
                                  <Label htmlFor="billable">Billable</Label>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowTimeEntry(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={addTimeEntry}>
                                    Add Entry
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Billable Hours:</span> {selectedTicket.billable_hours}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Estimated:</span> {selectedTicket.estimated_hours || 'Not set'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rate:</span> ${selectedTicket.hourly_rate}/hr
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Select a ticket to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agent Utilization</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.agentUtilization}%</div>
                <Progress value={stats.agentUtilization} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customerSatisfaction}/5</div>
                <div className="flex mt-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-4 h-4 mr-1 rounded ${
                      i <= Math.floor(stats.customerSatisfaction) ? 'bg-yellow-400' : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBillableHours}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tickets</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.overdueTickets}</div>
                <p className="text-xs text-muted-foreground">Past SLA deadline</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">Ticket TKT-001234 resolved</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">New ticket created by Acme Corp</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">SLA warning for TKT-001230</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    Live Chat
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Phone className="h-6 w-6 mb-2" />
                    Phone Queue
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Mail className="h-6 w-6 mb-2" />
                    Email Queue
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Monitor className="h-6 w-6 mb-2" />
                    Remote Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Performance Report</h3>
                <p className="text-sm text-muted-foreground">Agent and team metrics</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">SLA Report</h3>
                <p className="text-sm text-muted-foreground">Service level compliance</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="font-semibold mb-2">Revenue Report</h3>
                <p className="text-sm text-muted-foreground">Billing and profitability</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Customer Report</h3>
                <p className="text-sm text-muted-foreground">Satisfaction and trends</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Unbilled Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${(stats.totalBillableHours * 150).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">{stats.totalBillableHours} hours @ $150/hr</p>
                <Button className="w-full mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">${stats.revenue.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Invoiced amount</p>
                <Progress value={75} className="mt-4" />
                <p className="text-xs text-muted-foreground mt-2">75% of monthly target</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">$12,450</div>
                <p className="text-sm text-muted-foreground">Pending payment</p>
                <Button variant="outline" className="w-full mt-4">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminders
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};