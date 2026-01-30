import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Plus, 
  Search, 
  Bot, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Send,
  RefreshCw,
  Filter,
  UserPlus,
  Building2,
  Ticket
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ServiceTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  security_category: string | null;
  priority: string;
  status: string;
  requester_name: string | null;
  requester_email: string | null;
  ai_suggested_solution: string | null;
  ai_confidence_score: number | null;
  ai_processing_status: string | null;
  ai_summary: string | null;
  auto_resolved: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'security_incident', label: 'Security Incident' },
  { value: 'vulnerability', label: 'Vulnerability Report' },
  { value: 'access_request', label: 'Access Request' },
  { value: 'malware', label: 'Malware/Threat' },
  { value: 'network', label: 'Network Issue' },
  { value: 'compliance', label: 'Compliance Question' },
  { value: 'general', label: 'General IT Support' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-blue-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-destructive' },
];

interface MSPClient {
  id: string;
  company_name: string;
}

interface ClientContact {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  role: string | null;
}

export function VanguardServiceDesk() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customer/Contact state
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  
  // New ticket form
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    client_id: '',
    contact_id: '',
    requester_name: '',
    requester_email: ''
  });

  useEffect(() => {
    loadTickets();
    loadClients();
  }, [user]);

  // Load contacts when client changes
  useEffect(() => {
    if (newTicket.client_id) {
      loadContacts(newTicket.client_id);
    } else {
      setContacts([]);
    }
  }, [newTicket.client_id]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('msp_clients')
        .select('id, company_name')
        .order('company_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadContacts = async (clientId: string) => {
    setLoadingContacts(true);
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('id, contact_name, email, phone, role')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('contact_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadTickets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vanguard_service_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async () => {
    if (!user || !newTicket.title || !newTicket.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the title and description",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('vanguard_service_tickets')
        .insert({
          user_id: user.id,
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          requester_name: newTicket.requester_name || user.email,
          requester_email: newTicket.requester_email || user.email,
          ai_processing_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setTickets(prev => [data, ...prev]);
      setNewTicket({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        client_id: '',
        contact_id: '',
        requester_name: '',
        requester_email: ''
      });
      setContacts([]);

      toast({
        title: "Ticket Created",
        description: "Your ticket has been submitted. AI is analyzing it now...",
      });

      // Trigger AI processing
      processTicketWithAI(data);

    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const processTicketWithAI = async (ticket: ServiceTicket) => {
    setIsProcessingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('vanguard-ai-ticket-processor', {
        body: {
          action: 'process_ticket',
          ticketId: ticket.id,
          ticketData: ticket
        }
      });

      if (error) throw error;

      // Reload tickets to get updated AI analysis
      await loadTickets();

      if (data.analysis?.confidence_score >= 85) {
        toast({
          title: "AI Solution Ready",
          description: `High confidence solution generated (${data.analysis.confidence_score}%)`,
        });
      } else {
        toast({
          title: "AI Analysis Complete",
          description: "Review the suggested solution",
        });
      }
    } catch (error) {
      console.error('Error processing with AI:', error);
      toast({
        title: "AI Processing Notice",
        description: error.message || "AI analysis could not be completed. A technician will review.",
        variant: "default",
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('vanguard_service_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, ...updates } : t
      ));

      toast({
        title: "Status Updated",
        description: `Ticket marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    }
  };

  const submitFeedback = async (ticketId: string, aiSolutionUsed: boolean, resolved: boolean) => {
    try {
      await supabase.from('vanguard_ai_feedback').insert({
        ticket_id: ticketId,
        ai_solution_used: aiSolutionUsed,
        user_confirmed_resolved: resolved,
      });

      toast({
        title: "Feedback Recorded",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      closed: 'bg-muted text-muted-foreground border-muted',
    };
    return styles[status] || styles.open;
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-destructive/20 text-destructive border-destructive/30',
    };
    return styles[priority] || styles.medium;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesSearch = !searchQuery || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    aiResolved: tickets.filter(t => t.auto_resolved).length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{ticketStats.total}</p>
              </div>
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-blue-500">{ticketStats.open}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-500">{ticketStats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-500">{ticketStats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Resolved</p>
                <p className="text-2xl font-bold text-primary">{ticketStats.aiResolved}</p>
              </div>
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTickets}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>
                  Submit a new ticket. Our AI will analyze it and suggest solutions.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Customer Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Customer
                    </Label>
                    <Select 
                      value={newTicket.client_id} 
                      onValueChange={(v) => setNewTicket(prev => ({ ...prev, client_id: v, contact_id: '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Contact Dropdown - appears after customer is selected */}
                  <div>
                    <Label className="flex items-center gap-2">
                      Contact
                      {loadingContacts && <RefreshCw className="h-3 w-3 animate-spin" />}
                    </Label>
                    {newTicket.client_id ? (
                      contacts.length > 0 ? (
                        <Select 
                          value={newTicket.contact_id} 
                          onValueChange={(v) => {
                            const contact = contacts.find(c => c.id === v);
                            setNewTicket(prev => ({ 
                              ...prev, 
                              contact_id: v,
                              requester_name: contact?.contact_name || '',
                              requester_email: contact?.email || ''
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a contact..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            {contacts.map(contact => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.contact_name} {contact.role && `(${contact.role})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => toast({ title: "Add Contact", description: "Navigate to customer settings to add contacts" })}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Contact
                        </Button>
                      )
                    ) : (
                      <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 text-muted-foreground text-sm flex items-center">
                        Select a customer first
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    value={newTicket.title}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the problem, steps to reproduce, etc."
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={newTicket.category} 
                      onValueChange={(v) => setNewTicket(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Priority</Label>
                    <Select 
                      value={newTicket.priority} 
                      onValueChange={(v) => setNewTicket(prev => ({ ...prev, priority: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {PRIORITIES.map(pri => (
                          <SelectItem key={pri.value} value={pri.value}>{pri.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name (optional)</Label>
                    <Input
                      value={newTicket.requester_name}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, requester_name: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label>Email (optional)</Label>
                    <Input
                      type="email"
                      value={newTicket.requester_email}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, requester_email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <Button onClick={createTicket} disabled={isCreating} className="w-full">
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid gap-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Ticket}
                title="No tickets found"
                description="Create a new ticket to get started with your support requests."
                size="md"
              />
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map(ticket => (
            <Card key={ticket.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Ticket Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      <h3 className="font-semibold text-lg">{ticket.title}</h3>
                      {ticket.ai_confidence_score && ticket.ai_confidence_score >= 85 && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Ready
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={getStatusBadge(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline">
                        {CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}
                      </Badge>
                      {ticket.ai_processing_status === 'processing' && (
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          AI Analyzing
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* AI Solution Panel */}
                  {ticket.ai_suggested_solution && (
                    <div className="lg:w-96 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">AI Suggested Solution</span>
                        {ticket.ai_confidence_score && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {ticket.ai_confidence_score}% confident
                          </Badge>
                        )}
                      </div>
                      
                      {ticket.ai_summary && (
                        <p className="text-sm text-muted-foreground mb-2 italic">
                          {ticket.ai_summary}
                        </p>
                      )}
                      
                      <ScrollArea className="h-32">
                        <p className="text-sm whitespace-pre-wrap">
                          {ticket.ai_suggested_solution}
                        </p>
                      </ScrollArea>
                      
                      {ticket.status !== 'resolved' && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              updateTicketStatus(ticket.id, 'resolved');
                              submitFeedback(ticket.id, true, true);
                            }}
                            className="flex-1"
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Resolved
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => submitFeedback(ticket.id, false, false)}
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Not Helpful
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {!ticket.ai_suggested_solution && ticket.ai_processing_status !== 'processing' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => processTicketWithAI(ticket)}
                        disabled={isProcessingAI}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Ask AI
                      </Button>
                    )}
                    
                    {ticket.status === 'open' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Start Work
                      </Button>
                    )}
                    
                    {ticket.status === 'in_progress' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
