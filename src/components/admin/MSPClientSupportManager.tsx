import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  msp_organizations?: {
    organization_name: string;
  };
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
  assigned_to: string;
  created_at: string;
  updated_at: string;
  resolved_at: string;
  resolution_notes: string;
}

export const MSPClientSupportManager = () => {
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState<MSPClient | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });
  const { toast } = useToast();

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const priorityOptions = [
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
    { value: 'training', label: 'Training' }
  ];

  const fetchClients = async () => {
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
      setClients((data as any) || []);

    } catch (error: any) {
      toast({
        title: "Error fetching clients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (clientId?: string) => {
    try {
      let query = supabase
        .from('helpdesk_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('customer_id', clientId);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);

    } catch (error: any) {
      toast({
        title: "Error fetching tickets",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
          status: 'open'
        }]);

      if (error) throw error;

      toast({
        title: "Support ticket created",
        description: `Ticket ${ticketNumber} has been created successfully`,
      });

      setIsTicketDialogOpen(false);
      setNewTicket({ title: '', description: '', priority: 'medium', category: 'general' });
      fetchTickets(selectedClient.id);

    } catch (error: any) {
      toast({
        title: "Error creating ticket",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'secondary';
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

  useEffect(() => {
    fetchClients();
  }, [searchTerm]);

  useEffect(() => {
    if (selectedClient) {
      fetchTickets(selectedClient.id);
    }
  }, [selectedClient, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MSP Client Support</h2>
          <p className="text-muted-foreground">Manage support tickets and client relationships</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              MSP Clients
            </CardTitle>
            <CardDescription>Select a client to view their support tickets</CardDescription>
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
                      <div>
                        <p className="font-medium">{client.company_name}</p>
                        <p className="text-sm text-muted-foreground">{client.contact_email}</p>
                        {client.msp_organizations && (
                          <p className="text-xs text-muted-foreground">
                            MSP: {client.msp_organizations.organization_name}
                          </p>
                        )}
                      </div>
                      <Badge variant={client.is_active ? 'default' : 'secondary'}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </Badge>
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

        {/* Support Tickets */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Support Tickets
                  {selectedClient && (
                    <span className="text-base font-normal text-muted-foreground">
                      for {selectedClient.company_name}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedClient ? 'Manage support tickets for this client' : 'Select a client to view tickets'}
                </CardDescription>
              </div>
              {selectedClient && (
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
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
                  <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Ticket
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                        <div className="grid grid-cols-2 gap-4">
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
                                {priorityOptions.map((priority) => (
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
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedClient ? (
              <div className="space-y-4">
                {/* Client Info Bar */}
                <div className="p-4 bg-accent/20 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>
                </div>

                {/* Tickets List */}
                <div className="space-y-3">
                  {tickets.map((ticket) => (
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
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(ticket.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <h4 className="font-medium mb-1">{ticket.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                      {ticket.category && (
                        <Badge variant="outline" className="mt-2">
                          {ticket.category}
                        </Badge>
                      )}
                    </div>
                  ))}

                  {tickets.length === 0 && (
                    <div className="text-center py-8">
                      <Ticket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No support tickets found for this client
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Client</h3>
                <p className="text-muted-foreground">
                  Choose a client from the list to view and manage their support tickets
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};