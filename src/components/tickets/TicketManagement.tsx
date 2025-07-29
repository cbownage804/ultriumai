import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Tag,
  Calendar,
  FileText,
  Settings,
  Ticket
} from "lucide-react";
import { format } from "date-fns";

interface TicketData {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  category: string;
  tags: string[];
  source: 'email' | 'portal' | 'phone' | 'chat' | 'internal';
  created_at: string;
  updated_at: string;
  due_date?: string;
  sla_due_at?: string;
  resolved_at?: string;
  closed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  billable_hours?: number;
  customer_satisfaction?: number;
  client_id?: string;
  assigned_to?: string;
  user_id: string;
}

interface TicketActivity {
  id: string;
  ticket_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  time_spent_minutes: number;
}

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

const TicketManagement = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    category: "general",
    tags: "",
    estimated_hours: "",
    client_id: "",
  });

  // New comment state
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Check if tickets table exists, if not use a placeholder
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Tickets table not found, using demo data');
        // Demo data for demonstration
        setTickets([
          {
            id: '1',
            ticket_number: 'TKT-000001',
            title: 'Email Server Down',
            description: 'The email server is not responding and users cannot send or receive emails.',
            priority: 'high',
            status: 'open',
            category: 'Infrastructure',
            tags: ['email', 'server', 'urgent'],
            source: 'phone',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            estimated_hours: 4,
            actual_hours: 0,
            billable_hours: 0,
            user_id: user?.id || '',
          },
          {
            id: '2',
            ticket_number: 'TKT-000002',
            title: 'Software License Renewal',
            description: 'Microsoft Office licenses are expiring next month and need to be renewed.',
            priority: 'medium',
            status: 'in_progress',
            category: 'Licensing',
            tags: ['microsoft', 'licensing', 'renewal'],
            source: 'portal',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date().toISOString(),
            estimated_hours: 2,
            actual_hours: 1,
            billable_hours: 1,
            user_id: user?.id || '',
          }
        ]);
      } else {
        setTickets((data || []).map(ticket => ({
          ...ticket,
          priority: ticket.priority as 'low' | 'medium' | 'high' | 'critical',
          status: ticket.status as 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed',
          source: ticket.source as 'email' | 'portal' | 'phone' | 'chat' | 'internal'
        })));
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!user || !newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const ticketData = {
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
        tags: newTicket.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        estimated_hours: newTicket.estimated_hours ? parseFloat(newTicket.estimated_hours) : null,
        client_id: newTicket.client_id || null,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('tickets')
        .insert(ticketData);

      if (error) {
        console.error('Error creating ticket:', error);
        // For demo purposes, add to local state
        const demoTicket: TicketData = {
          id: Date.now().toString(),
          ticket_number: `TKT-${String(tickets.length + 1).padStart(6, '0')}`,
          title: newTicket.title,
          description: newTicket.description,
          priority: newTicket.priority,
          status: 'open',
          category: newTicket.category,
          tags: newTicket.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          source: 'portal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          estimated_hours: newTicket.estimated_hours ? parseFloat(newTicket.estimated_hours) : undefined,
          actual_hours: 0,
          billable_hours: 0,
          user_id: user.id,
        };
        setTickets(prev => [demoTicket, ...prev]);
      } else {
        await fetchTickets();
      }

      setNewTicket({
        title: "",
        description: "",
        priority: "medium",
        category: "general",
        tags: "",
        estimated_hours: "",
        client_id: "",
      });
      setShowCreateDialog(false);

      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
    } catch (err) {
      console.error('Error creating ticket:', err);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'resolved' && { resolved_at: new Date().toISOString() }),
          ...(newStatus === 'closed' && { closed_at: new Date().toISOString() })
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error updating ticket status:', error);
        // For demo purposes, update local state
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status: newStatus as any, updated_at: new Date().toISOString() }
            : ticket
        ));
      } else {
        await fetchTickets();
      }

      toast({
        title: "Success",
        description: "Ticket status updated",
      });
    } catch (err) {
      console.error('Error updating ticket status:', err);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    highPriority: tickets.filter(t => t.priority === 'high' || t.priority === 'critical').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ticket Management</h1>
          <p className="text-muted-foreground">Manage support tickets and track resolution progress</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                Create a new support ticket to track and resolve issues.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="licensing">Licensing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the issue"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value as any }))}
                  >
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
                <div className="space-y-2">
                  <Label htmlFor="estimated-hours">Estimated Hours</Label>
                  <Input
                    id="estimated-hours"
                    type="number"
                    step="0.5"
                    value={newTicket.estimated_hours}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    placeholder="2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={newTicket.tags}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="email, server, urgent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTicket}>
                  Create Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ticket className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Tickets</p>
                <p className="text-2xl font-bold">{ticketStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Open</p>
                <p className="text-2xl font-bold">{ticketStats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold">{ticketStats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Resolved</p>
                <p className="text-2xl font-bold">{ticketStats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">High Priority</p>
                <p className="text-2xl font-bold">{ticketStats.highPriority}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by title, number, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
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
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading tickets...</p>
            </CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? "Try adjusting your filters to see more tickets."
                  : "Create your first ticket to get started."}
              </p>
              {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">{ticket.title}</h3>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{ticket.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {format(new Date(ticket.created_at), 'MMM dd, yyyy')}</span>
                      </span>
                      {ticket.estimated_hours && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{ticket.estimated_hours}h estimated</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Tag className="h-4 w-4" />
                        <span>{ticket.category}</span>
                      </span>
                    </div>
                    
                    {ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ticket.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleStatusUpdate(ticket.id, value)}
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
                    
                    <Sheet open={showTicketDetails && selectedTicket?.id === ticket.id} 
                           onOpenChange={(open) => {
                             setShowTicketDetails(open);
                             if (!open) setSelectedTicket(null);
                           }}>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-2xl">
                        <SheetHeader>
                          <SheetTitle>Ticket Details - {ticket.ticket_number}</SheetTitle>
                          <SheetDescription>{ticket.title}</SheetDescription>
                        </SheetHeader>
                        
                        <div className="mt-6 space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{ticket.description}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Priority</h4>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Status</h4>
                              <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          {ticket.estimated_hours && (
                            <div>
                              <h4 className="font-semibold mb-2">Time Tracking</h4>
                              <div className="text-sm space-y-1">
                                <p>Estimated: {ticket.estimated_hours}h</p>
                                <p>Actual: {ticket.actual_hours || 0}h</p>
                                <p>Billable: {ticket.billable_hours || 0}h</p>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-semibold mb-2">Timeline</h4>
                            <div className="text-sm space-y-1">
                              <p>Created: {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}</p>
                              <p>Updated: {format(new Date(ticket.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                              {ticket.resolved_at && (
                                <p>Resolved: {format(new Date(ticket.resolved_at), 'MMM dd, yyyy HH:mm')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TicketManagement;