import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Users, 
  Ticket, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  UserPlus,
  Settings,
  BarChart3,
  Timer,
  AlertTriangle,
  Target,
  MessageSquare,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Zap,
  Heart,
  TrendingDown,
  Activity,
  DollarSign,
  Shield,
  Archive,
  ExternalLink,
  Edit,
  Trash2,
  Send,
  UserCheck,
  Clipboard,
  Star,
  Flag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, differenceInHours, addHours } from 'date-fns';

// Enhanced interfaces
interface MSPClient {
  id: string;
  company_name: string;
  contact_email: string;
  contact_name: string;
  billing_status: string;
  current_users: number;
  max_users: number;
  is_active: boolean;
  created_at: string;
  msp_id: string;
  health_status?: string;
  contract_end_date?: string;
  monthly_fee?: number;
  timezone?: string;
  business_hours?: any;
  msp_organizations?: {
    organization_name: string;
  } | null;
}

interface SupportTicket {
  id: string;
  ticket_number?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  customer_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  sla_policy_id?: string;
  first_response_at?: string;
  sla_due_at?: string;
  escalation_level?: number;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  customer_satisfaction?: number;
  last_activity_at?: string;
  contact_id?: string;
}

interface SupportAgent {
  id: string;
  user_id: string;
  agent_name: string;
  email: string;
  role: string;
  department?: string;
  skills?: string[];
  max_concurrent_tickets: number;
  is_active: boolean;
}

interface TicketTemplate {
  id: string;
  name: string;
  category: string;
  title_template: string;
  description_template: string;
  priority: string;
  estimated_hours?: number;
  tags?: string[];
}

interface ClientContact {
  id: string;
  client_id: string;
  contact_name: string;
  email: string;
  phone?: string;
  role?: string;
  is_primary: boolean;
  communication_preferences: any;
  timezone?: string;
  is_active: boolean;
}

interface TicketAssignment {
  id: string;
  ticket_id: string;
  agent_id: string;
  assigned_by: string;
  assigned_at: string;
  assignment_reason?: string;
  is_active: boolean;
  support_agents?: {
    agent_name: string;
    email: string;
    role: string;
  };
}

interface TicketActivity {
  id: string;
  ticket_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface SLAPolicy {
  id: string;
  name: string;
  priority_level: string;
  first_response_hours: number;
  resolution_hours: number;
  escalation_hours?: number;
  business_hours_only: boolean;
}

export const MSPClientSupportManager = () => {
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [assignments, setAssignments] = useState<TicketAssignment[]>([]);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [slaBreaches, setSlaBreaches] = useState<SupportTicket[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState<MSPClient | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showInternalNotes, setShowInternalNotes] = useState(false);

  // Form states
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
    contact_id: '',
    estimated_hours: '',
    tags: [] as string[]
  });

  const [newAgent, setNewAgent] = useState({
    agent_name: '',
    email: '',
    role: 'agent',
    department: '',
    skills: [] as string[],
    max_concurrent_tickets: 10
  });

  const [newContact, setNewContact] = useState({
    contact_name: '',
    email: '',
    phone: '',
    role: '',
    is_primary: false,
    timezone: 'UTC'
  });

  const [newNote, setNewNote] = useState({
    note_content: '',
    note_type: 'general',
    is_private: true
  });

  const { toast } = useToast();

  // Options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low', color: 'default' },
    { value: 'medium', label: 'Medium', color: 'secondary' },
    { value: 'high', label: 'High', color: 'destructive' },
    { value: 'critical', label: 'Critical', color: 'destructive' }
  ];

  const categoryOptions = [
    { value: 'general', label: 'General Support' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing' },
    { value: 'security', label: 'Security' },
    { value: 'training', label: 'Training' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'software', label: 'Software' },
    { value: 'network', label: 'Network' }
  ];

  // Fetch functions
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('msp_clients')
        .select(`
          *,
          msp_organizations (
            organization_name
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`company_name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setClients((data as unknown as MSPClient[]) || []);
    } catch (error: any) {
      toast({
        title: "Error fetching clients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, toast]);

  const fetchTickets = useCallback(async (clientId?: string) => {
    try {
      let query = supabase
        .from('helpdesk_tickets')
        .select(`
          *,
          sla_policies (
            name,
            first_response_hours,
            resolution_hours
          )
        `)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('customer_id', clientId);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);

      // Check for SLA breaches
      const breaches = (data || []).filter(ticket => 
        ticket.sla_due_at && isAfter(new Date(), new Date(ticket.sla_due_at)) && 
        ticket.status !== 'resolved' && ticket.status !== 'closed'
      );
      setSlaBreaches(breaches);

    } catch (error: any) {
      toast({
        title: "Error fetching tickets",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [statusFilter, priorityFilter, toast]);

  const fetchAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('support_agents')
        .select('*')
        .eq('is_active', true)
        .order('agent_name');

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
    }
  }, []);

  const fetchContacts = useCallback(async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  const fetchAssignments = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_assignments')
        .select(`
          *,
          support_agents (
            agent_name,
            email,
            role
          )
        `)
        .eq('ticket_id', ticketId)
        .eq('is_active', true);

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
    }
  }, []);

  const fetchActivities = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_activities')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    }
  }, []);

  // Action functions
  const createTicket = async () => {
    if (!selectedClient) return;

    try {
      const ticketNumber = `TKT-${Date.now()}`;
      
      const { error } = await supabase
        .from('helpdesk_tickets')
        .insert([{
          ticket_number: ticketNumber,
          title: newTicket.title,
          description: newTicket.description,
          priority: newTicket.priority,
          category: newTicket.category,
          customer_id: selectedClient.id,
          contact_id: newTicket.contact_id || null,
          estimated_hours: newTicket.estimated_hours ? parseInt(newTicket.estimated_hours) : null,
          tags: newTicket.tags,
          status: 'open'
        }]);

      if (error) throw error;

      toast({
        title: "Support ticket created",
        description: `Ticket ${ticketNumber} has been created successfully`,
      });

      setIsTicketDialogOpen(false);
      setNewTicket({ 
        title: '', 
        description: '', 
        priority: 'medium', 
        category: 'general',
        contact_id: '',
        estimated_hours: '',
        tags: []
      });
      fetchTickets(selectedClient.id);

    } catch (error: any) {
      toast({
        title: "Error creating ticket",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const assignTicket = async (ticketId: string, agentId: string, reason?: string) => {
    try {
      // First, deactivate any existing assignments
      await supabase
        .from('ticket_assignments')
        .update({ is_active: false })
        .eq('ticket_id', ticketId);

      // Create new assignment
      const { error } = await supabase
        .from('ticket_assignments')
        .insert([{
          ticket_id: ticketId,
          agent_id: agentId,
          assigned_by: 'current_user', // This should be auth.uid() in real implementation
          assignment_reason: reason
        }]);

      if (error) throw error;

      // Update ticket status
      await supabase
        .from('helpdesk_tickets')
        .update({ 
          status: 'in_progress',
          assigned_to: agentId 
        })
        .eq('id', ticketId);

      toast({
        title: "Ticket assigned",
        description: "Ticket has been assigned successfully",
      });

      if (selectedTicket) {
        fetchAssignments(selectedTicket.id);
      }
      fetchTickets(selectedClient?.id);

    } catch (error: any) {
      toast({
        title: "Error assigning ticket",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('helpdesk_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Ticket updated",
        description: `Ticket status changed to ${newStatus}`,
      });

      fetchTickets(selectedClient?.id);

    } catch (error: any) {
      toast({
        title: "Error updating ticket",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addInternalNote = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('ticket_internal_notes')
        .insert([{
          ticket_id: ticketId,
          agent_id: agents[0]?.id, // This should be current user's agent ID
          note_content: newNote.note_content,
          note_type: newNote.note_type,
          is_private: newNote.is_private
        }]);

      if (error) throw error;

      toast({
        title: "Note added",
        description: "Internal note has been added to the ticket",
      });

      setIsNotesDialogOpen(false);
      setNewNote({ note_content: '', note_type: 'general', is_private: true });

    } catch (error: any) {
      toast({
        title: "Error adding note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Timer className="h-4 w-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <Archive className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'secondary';
      case 'pending': return 'default';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getSLAStatus = (ticket: SupportTicket) => {
    if (!ticket.sla_due_at) return null;
    
    const now = new Date();
    const dueDate = new Date(ticket.sla_due_at);
    const hoursLeft = differenceInHours(dueDate, now);
    
    if (hoursLeft < 0) {
      return { status: 'breached', color: 'destructive', text: 'SLA Breached' };
    } else if (hoursLeft < 2) {
      return { status: 'critical', color: 'destructive', text: `${hoursLeft}h left` };
    } else if (hoursLeft < 8) {
      return { status: 'warning', color: 'secondary', text: `${hoursLeft}h left` };
    } else {
      return { status: 'ok', color: 'default', text: `${hoursLeft}h left` };
    }
  };

  const getClientHealthStatus = (client: MSPClient) => {
    const healthColors = {
      healthy: 'default',
      warning: 'secondary',
      critical: 'destructive'
    };
    return healthColors[client.health_status as keyof typeof healthColors] || 'default';
  };

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('ticket-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'helpdesk_tickets'
      }, () => {
        if (selectedClient) {
          fetchTickets(selectedClient.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClient, fetchTickets]);

  // Initial data loading
  useEffect(() => {
    fetchClients();
    fetchAgents();
    fetchTemplates();
  }, [fetchClients, fetchAgents, fetchTemplates]);

  useEffect(() => {
    if (selectedClient) {
      fetchTickets(selectedClient.id);
      fetchContacts(selectedClient.id);
    }
  }, [selectedClient, statusFilter, priorityFilter, fetchTickets, fetchContacts]);

  useEffect(() => {
    if (selectedTicket) {
      fetchAssignments(selectedTicket.id);
      fetchActivities(selectedTicket.id);
    }
  }, [selectedTicket, fetchAssignments, fetchActivities]);

  return (
    <div className="space-y-6">
      {/* Header with KPIs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">MSP Client Support</h2>
            <p className="text-muted-foreground">Advanced support ticket management and client relationship tools</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                fetchClients();
                if (selectedClient) fetchTickets(selectedClient.id);
              }}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{clients.length}</p>
                  <p className="text-xs text-muted-foreground">Active Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
                  <p className="text-xs text-muted-foreground">Open Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-500">{slaBreaches.length}</p>
                  <p className="text-xs text-muted-foreground">SLA Breaches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{agents.length}</p>
                  <p className="text-xs text-muted-foreground">Active Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  MSP Clients
                </CardTitle>
                <CardDescription>Select a client to view their support dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                          selectedClient?.id === client.id ? 'bg-accent border-primary' : ''
                        }`}
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{client.company_name}</p>
                            <p className="text-sm text-muted-foreground">{client.contact_email}</p>
                            {client.msp_organizations && (
                              <p className="text-xs text-muted-foreground">
                                MSP: {client.msp_organizations.organization_name}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge variant={client.is_active ? 'default' : 'secondary'}>
                              {client.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {client.health_status && (
                              <Badge variant={getClientHealthStatus(client) as any} className="text-xs">
                                {client.health_status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {clients.length === 0 && !loading && (
                    <div className="text-center py-6">
                      <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No clients found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Dashboard */}
            <div className="lg:col-span-2 space-y-4">
              {selectedClient ? (
                <>
                  {/* Client Info Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedClient.company_name}</CardTitle>
                          <CardDescription>Client Support Dashboard</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsContactDialogOpen(true)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Contact
                          </Button>
                          <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                New Ticket
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Create Support Ticket</DialogTitle>
                                <DialogDescription>
                                  Create a new support ticket for {selectedClient.company_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="title">Title</Label>
                                  <Input
                                    id="title"
                                    value={newTicket.title}
                                    onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Brief description of the issue"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select 
                                      value={newTicket.priority} 
                                      onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {priorityOptions.filter(p => p.value !== 'all').map((priority) => (
                                          <SelectItem key={priority.value} value={priority.value}>
                                            {priority.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select 
                                      value={newTicket.category} 
                                      onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categoryOptions.map((category) => (
                                          <SelectItem key={category.value} value={category.value}>
                                            {category.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor="contact">Contact</Label>
                                    <Select 
                                      value={newTicket.contact_id} 
                                      onValueChange={(value) => setNewTicket(prev => ({ ...prev, contact_id: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select contact" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {contacts.map((contact) => (
                                          <SelectItem key={contact.id} value={contact.id}>
                                            {contact.contact_name} ({contact.email})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="estimated_hours">Estimated Hours</Label>
                                  <Input
                                    id="estimated_hours"
                                    type="number"
                                    value={newTicket.estimated_hours}
                                    onChange={(e) => setNewTicket(prev => ({ ...prev, estimated_hours: e.target.value }))}
                                    placeholder="Optional"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="description">Description</Label>
                                  <Textarea
                                    id="description"
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Detailed description of the issue"
                                    rows={4}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setIsTicketDialogOpen(false)}>
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
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedClient.contact_email}</span>
                        </div>
                        {selectedClient.contact_name && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedClient.contact_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedClient.current_users}/{selectedClient.max_users} users</span>
                        </div>
                        {selectedClient.monthly_fee && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">${selectedClient.monthly_fee}/month</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Tickets */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Ticket className="h-5 w-5" />
                          Recent Tickets
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('tickets')}
                          >
                            View All
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {tickets.slice(0, 5).map((ticket) => {
                          const slaStatus = getSLAStatus(ticket);
                          return (
                            <div
                              key={ticket.id}
                              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{ticket.ticket_number}</Badge>
                                  <Badge variant={getStatusColor(ticket.status) as any}>
                                    {getStatusIcon(ticket.status)}
                                    {ticket.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge variant={getPriorityColor(ticket.priority) as any}>
                                    {ticket.priority}
                                  </Badge>
                                  {slaStatus && (
                                    <Badge variant={slaStatus.color as any}>
                                      <Timer className="h-3 w-3 mr-1" />
                                      {slaStatus.text}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(new Date(ticket.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>
                              <h4 className="font-medium mb-1">{ticket.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                              {ticket.tags && ticket.tags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {ticket.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {tickets.length === 0 && (
                          <div className="text-center py-8">
                            <Ticket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No support tickets found for this client
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Client</h3>
                    <p className="text-muted-foreground">
                      Choose a client from the list to view their support dashboard
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          {selectedClient ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      Support Tickets - {selectedClient.company_name}
                    </CardTitle>
                    <CardDescription>Manage all support tickets for this client</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
                    >
                      {viewMode === 'list' ? 'Kanban' : 'List'} View
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {tickets.map((ticket) => {
                      const slaStatus = getSLAStatus(ticket);
                      const assignment = assignments.find(a => a.ticket_id === ticket.id && a.is_active);
                      
                      return (
                        <div
                          key={ticket.id}
                          className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{ticket.ticket_number}</Badge>
                              <Badge variant={getStatusColor(ticket.status) as any}>
                                {getStatusIcon(ticket.status)}
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant={getPriorityColor(ticket.priority) as any}>
                                {ticket.priority}
                              </Badge>
                              {slaStatus && (
                                <Badge variant={slaStatus.color as any}>
                                  <Timer className="h-3 w-3 mr-1" />
                                  {slaStatus.text}
                                </Badge>
                              )}
                              {assignment && (
                                <Badge variant="outline">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  {assignment.support_agents?.agent_name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setIsAssignDialogOpen(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Select
                                value={ticket.status}
                                onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(ticket.created_at), 'MMM dd')}</span>
                              </div>
                            </div>
                          </div>
                          <h4 className="font-medium mb-1">{ticket.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                          {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {ticket.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-4">
                    {['open', 'in_progress', 'pending', 'resolved', 'closed'].map((status) => (
                      <div key={status} className="space-y-3">
                        <h3 className="font-medium capitalize text-center p-2 bg-accent/20 rounded">
                          {status.replace('_', ' ')} ({tickets.filter(t => t.status === status).length})
                        </h3>
                        <div className="space-y-2">
                          {tickets.filter(t => t.status === status).map((ticket) => (
                            <div key={ticket.id} className="p-3 border rounded-lg bg-background">
                              <div className="space-y-2">
                                <Badge variant="outline" className="text-xs">{ticket.ticket_number}</Badge>
                                <h4 className="font-medium text-sm">{ticket.title}</h4>
                                <Badge variant={getPriorityColor(ticket.priority) as any} className="text-xs">
                                  {ticket.priority}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Client</h3>
                <p className="text-muted-foreground">
                  Choose a client to view and manage their support tickets
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{tickets.length}</p>
                    <p className="text-xs text-muted-foreground">Total Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">
                      {tickets.filter(t => t.status === 'resolved').length > 0 
                        ? Math.round(tickets.filter(t => t.status === 'resolved').reduce((acc, ticket) => {
                            if (ticket.created_at && ticket.resolved_at) {
                              return acc + differenceInHours(new Date(ticket.resolved_at), new Date(ticket.created_at));
                            }
                            return acc;
                          }, 0) / tickets.filter(t => t.status === 'resolved').length)
                        : 0}h
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Resolution Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">
                      {tickets.length > 0 
                        ? Math.round(((tickets.length - slaBreaches.length) / tickets.length) * 100)
                        : 100}%
                    </p>
                    <p className="text-xs text-muted-foreground">SLA Compliance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">
                      {tickets.filter(t => t.customer_satisfaction).length > 0
                        ? Math.round(tickets.filter(t => t.customer_satisfaction).reduce((acc, ticket) => 
                            acc + (ticket.customer_satisfaction || 0), 0) / tickets.filter(t => t.customer_satisfaction).length * 10) / 10
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Customer Satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and detailed analytics would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Trends</CardTitle>
              <CardDescription>Ticket volume and resolution trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Advanced analytics charts coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Support Agents
                  </CardTitle>
                  <CardDescription>Manage your support team and workload distribution</CardDescription>
                </div>
                <Button onClick={() => setIsAgentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{agent.agent_name}</h3>
                          <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                            {agent.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                          <p className="text-sm">Role: {agent.role}</p>
                          {agent.department && (
                            <p className="text-sm">Dept: {agent.department}</p>
                          )}
                        </div>

                        {agent.skills && agent.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {agent.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Workload</span>
                            <span>{assignments.filter(a => a.agent_id === agent.id && a.is_active).length}/{agent.max_concurrent_tickets}</span>
                          </div>
                          <Progress 
                            value={(assignments.filter(a => a.agent_id === agent.id && a.is_active).length / agent.max_concurrent_tickets) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {agents.length === 0 && (
                <div className="text-center py-8">
                  <UserCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No support agents found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ticket Templates
                </CardTitle>
                <CardDescription>Manage templates for common support scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.category}</p>
                        </div>
                        <Badge variant={getPriorityColor(template.priority) as any}>
                          {template.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsTemplateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>Configure support system preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-Assignment</p>
                      <p className="text-sm text-muted-foreground">Automatically assign tickets to agents</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SLA Policies</p>
                      <p className="text-sm text-muted-foreground">Manage service level agreements</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Integration</p>
                      <p className="text-sm text-muted-foreground">Configure email notifications</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Setup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {/* Ticket Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>
              Assign {selectedTicket?.ticket_number} to a support agent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Agent</Label>
              <Select onValueChange={(agentId) => {
                if (selectedTicket) {
                  assignTicket(selectedTicket.id, agentId);
                  setIsAssignDialogOpen(false);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.agent_name} ({agent.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client Contact</DialogTitle>
            <DialogDescription>
              Add a new contact for {selectedClient?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact_name">Name</Label>
              <Input
                id="contact_name"
                value={newContact.contact_name}
                onChange={(e) => setNewContact(prev => ({ ...prev, contact_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newContact.phone}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={newContact.role}
                onChange={(e) => setNewContact(prev => ({ ...prev, role: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Add contact logic here
                setIsContactDialogOpen(false);
              }}>
                Add Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};