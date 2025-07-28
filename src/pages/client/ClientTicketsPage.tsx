import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Filter, Eye, MessageSquare, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'pending' | 'closed';
  created_at: string;
  updated_at: string;
}

const ClientTicketsPage = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get client information first
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('user_id', user.id)
        .single();

      if (!clientUser) return;

      // Mock tickets data - replace with actual query when helpdesk_tickets table is available
      const mockTickets: Ticket[] = [
        {
          id: '1',
          title: 'Email not syncing properly',
          description: 'Emails are not syncing between devices',
          priority: 'high',
          status: 'open',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          title: 'Network printer issue',
          description: 'Cannot connect to network printer',
          priority: 'medium',
          status: 'in_progress',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          title: 'Password reset request',
          description: 'Need password reset for email account',
          priority: 'low',
          status: 'closed',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      setTickets(mockTickets);
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

  const filterTickets = () => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage your support requests and track their progress
          </p>
        </div>
        <Button onClick={() => navigate('/client/tickets/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {tickets.length === 0 
                  ? "You haven't created any support tickets yet." 
                  : "No tickets match your current filters."}
              </p>
              <Button onClick={() => navigate('/client/tickets/new')}>
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{ticket.title}</h3>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Created: {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        Ticket #{ticket.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/client/tickets/${ticket.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tickets.filter(t => t.status === 'open').length}
              </div>
              <div className="text-sm text-muted-foreground">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tickets.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'closed').length}
              </div>
              <div className="text-sm text-muted-foreground">Closed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientTicketsPage;