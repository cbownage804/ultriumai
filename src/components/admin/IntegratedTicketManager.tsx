import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Bot,
  MessageSquare 
} from "lucide-react";
import { format } from "date-fns";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  client_id: string;
  msp_id?: string;
  assigned_to?: string;
  sla_policy_id?: string;
  sla_due_at?: string;
  ai_suggested_solution?: string;
  ai_confidence_score?: number;
  auto_resolved?: boolean;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  msp_clients?: {
    company_name: string;
  };
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  field_type: string;
  required: boolean;
  options?: any;
}

interface SLAPolicy {
  id: string;
  name: string;
  priority_level: string;
  first_response_hours: number;
  resolution_hours: number;
}

interface TicketTemplate {
  id: string;
  name: string;
  title_template: string;
  description_template: string;
  priority: string;
  category: string;
  custom_fields?: Record<string, any>;
}

export const IntegratedTicketManager = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [slaPolidies, setSlaPolidies] = useState<SLAPolicy[]>([]);
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
    client_id: '',
    template_id: '',
    custom_fields: {} as Record<string, any>
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tickets with related data
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          msp_clients(company_name),
          sla_policies(name, first_response_hours, resolution_hours)
        `)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Load custom fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('custom_ticket_fields')
        .select('*')
        .eq('is_active', true)
        .order('position');

      if (fieldsError) throw fieldsError;

      // Load SLA policies
      const { data: slaData, error: slaError } = await supabase
        .from('sla_policies')
        .select('*')
        .eq('is_active', true);

      if (slaError) throw slaError;

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('ticket_templates')
        .select('*')
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      setTickets(ticketsData?.map(ticket => ({
        ...ticket,
        msp_clients: (ticket.msp_clients && 
                     typeof ticket.msp_clients === 'object' && 
                     !Array.isArray(ticket.msp_clients) &&
                     'company_name' in ticket.msp_clients) 
          ? ticket.msp_clients as { company_name: string } 
          : undefined
      })) || []);
      setCustomFields(fieldsData?.map(field => ({
        ...field,
        options: Array.isArray(field.options) ? field.options : []
      })) || []);
      setSlaPolidies(slaData || []);
      setTemplates(templatesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNewTicket(prev => ({
        ...prev,
        title: template.title_template,
        description: template.description_template,
        priority: template.priority,
        category: template.category,
        custom_fields: template.custom_fields || {}
      }));
    }
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find appropriate SLA policy
      const slaPolicy = slaPolidies.find(p => p.priority_level === newTicket.priority);
      
      const ticketData = {
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
        client_id: newTicket.client_id,
        sla_policy_id: slaPolicy?.id,
        custom_fields: newTicket.custom_fields,
        status: 'open',
        user_id: '' // Will be set by the database trigger or auth context
      };

      const { error } = await supabase
        .from('support_tickets')
        .insert(ticketData);

      if (error) throw error;

      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        client_id: '',
        template_id: '',
        custom_fields: {}
      });
      setShowCreateTicket(false);
      loadData();

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

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      loadData();
      toast({
        title: "Success",
        description: "Ticket status updated"
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
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
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
        </div>
        
        <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="template">From Template</TabsTrigger>
                <TabsTrigger value="custom">Custom Fields</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ticket title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
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
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description"
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="feature-request">Feature Request</SelectItem>
                      <SelectItem value="bug-report">Bug Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="template" className="space-y-4">
                <div>
                  <Label htmlFor="template">Select Template</Label>
                  <Select 
                    value={newTicket.template_id} 
                    onValueChange={(value) => {
                      setNewTicket(prev => ({ ...prev, template_id: value }));
                      applyTemplate(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                {customFields.map(field => (
                  <div key={field.id}>
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.field_type === 'text' && (
                      <Input
                        id={field.name}
                        value={newTicket.custom_fields[field.name] || ''}
                        onChange={(e) => setNewTicket(prev => ({
                          ...prev,
                          custom_fields: { ...prev.custom_fields, [field.name]: e.target.value }
                        }))}
                      />
                    )}
                    {field.field_type === 'textarea' && (
                      <Textarea
                        id={field.name}
                        value={newTicket.custom_fields[field.name] || ''}
                        onChange={(e) => setNewTicket(prev => ({
                          ...prev,
                          custom_fields: { ...prev.custom_fields, [field.name]: e.target.value }
                        }))}
                      />
                    )}
                    {field.field_type === 'select' && (
                      <Select 
                        value={newTicket.custom_fields[field.name] || ''}
                        onValueChange={(value) => setNewTicket(prev => ({
                          ...prev,
                          custom_fields: { ...prev.custom_fields, [field.name]: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(field.options) && field.options.map((option: any) => (
                            <SelectItem key={option.value || option} value={option.value || option}>
                              {option.label || option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
            <Button onClick={createTicket} className="w-full">
              Create Ticket
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map(ticket => (
          <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedTicket(ticket)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{ticket.title}</h3>
                    {ticket.auto_resolved && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {ticket.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                    </span>
                    {ticket.msp_clients && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.msp_clients.company_name}
                      </span>
                    )}
                    {ticket.sla_due_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        SLA: {format(new Date(ticket.sla_due_at), 'MMM dd, HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  {ticket.ai_confidence_score && ticket.ai_confidence_score > 0 && (
                    <div className="text-xs text-blue-600">
                      AI Confidence: {ticket.ai_confidence_score}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Ticket #{selectedTicket.id.slice(0, 8)}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedTicket.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </Badge>
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {selectedTicket.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedTicket.description}
                      </p>
                      
                      {selectedTicket.ai_suggested_solution && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Bot className="h-4 w-4 text-blue-500" />
                            AI Suggested Solution
                            {selectedTicket.ai_confidence_score && (
                              <span className="text-xs text-blue-600">
                                ({selectedTicket.ai_confidence_score}% confidence)
                              </span>
                            )}
                          </h4>
                          <p className="text-sm bg-blue-50 p-3 rounded-md">
                            {selectedTicket.ai_suggested_solution}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Select 
                        value={selectedTicket.status} 
                        onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                  
                  {selectedTicket.custom_fields && Object.keys(selectedTicket.custom_fields).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Custom Fields</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(selectedTicket.custom_fields).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="font-medium">{key}:</span>
                              <span className="ml-2 text-muted-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};