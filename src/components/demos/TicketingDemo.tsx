import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Ticket, 
  Plus, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Users,
  Settings,
  Filter,
  Search
} from "lucide-react";

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  client: string;
  assignee: string;
  requester: string;
  created: string;
  updated: string;
  comments: number;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

export const TicketingDemo = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedTickets = data?.map(ticket => ({
        id: ticket.id,
        title: ticket.title || 'Untitled',
        description: ticket.description || '',
        status: ticket.status as 'open' | 'in-progress' | 'resolved' | 'closed',
        priority: ticket.priority as 'low' | 'medium' | 'high' | 'urgent',
        category: ticket.category || 'General',
        client: 'Unknown Client', // Will be mapped from client_id
        assignee: ticket.assigned_to || 'Unassigned',
        requester: 'Unknown User', // Will be mapped from user info
        created: new Date(ticket.created_at).toLocaleString(),
        updated: new Date(ticket.updated_at).toLocaleString(),
        comments: 0 // Could be calculated from related comments table
      })) || [];

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === filterStatus);

  const getTicketStats = () => {
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in-progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const urgent = tickets.filter(t => t.priority === 'urgent').length;
    
    return { open, inProgress, resolved, urgent };
  };

  const stats = getTicketStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center gap-2">
          <Ticket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">SafeDesk Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience comprehensive ticket management and helpdesk automation for IT teams and MSPs
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-blue-500">{stats.open}</div>
            <div className="text-sm text-muted-foreground">Open Tickets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold text-purple-500">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
            <div className="text-sm text-muted-foreground">Urgent</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border rounded px-3 py-1"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tickets..." className="w-64" />
              </div>
            </div>
            <Button onClick={() => setShowNewTicket(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket List */}
            <div className="space-y-4">
              <h3 className="font-semibold">Ticket Queue ({filteredTickets.length})</h3>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <Card 
                    key={ticket.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedTicket?.id === ticket.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{ticket.id}</span>
                            <Badge className={priorityColors[ticket.priority]}>
                              {ticket.priority}
                            </Badge>
                            <Badge className={statusColors[ticket.status]}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm mb-1">{ticket.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Client: {ticket.client}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ticket.comments}
                          </span>
                        </div>
                        <span>Updated: {ticket.updated}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tickets found</p>
                  <p className="text-sm">Create your first support ticket to get started</p>
                </div>
              )}
            </div>

            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTicket ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-lg">{selectedTicket.id}</span>
                        <Badge className={priorityColors[selectedTicket.priority]}>
                          {selectedTicket.priority}
                        </Badge>
                        <Badge className={statusColors[selectedTicket.status]}>
                          {selectedTicket.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-2">{selectedTicket.title}</h3>
                      <p className="text-muted-foreground mb-4">{selectedTicket.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Client</div>
                        <div className="text-muted-foreground">{selectedTicket.client}</div>
                      </div>
                      <div>
                        <div className="font-medium">Category</div>
                        <div className="text-muted-foreground">{selectedTicket.category}</div>
                      </div>
                      <div>
                        <div className="font-medium">Requester</div>
                        <div className="text-muted-foreground">{selectedTicket.requester}</div>
                      </div>
                      <div>
                        <div className="font-medium">Assignee</div>
                        <div className="text-muted-foreground">{selectedTicket.assignee}</div>
                      </div>
                      <div>
                        <div className="font-medium">Created</div>
                        <div className="text-muted-foreground">{selectedTicket.created}</div>
                      </div>
                      <div>
                        <div className="font-medium">Last Updated</div>
                        <div className="text-muted-foreground">{selectedTicket.updated}</div>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <Textarea placeholder="Add a comment..." className="mb-2" />
                      <div className="flex gap-2">
                        <Button size="sm">Add Comment</Button>
                        <Button size="sm" variant="outline">Change Status</Button>
                        <Button size="sm" variant="outline">Assign</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a ticket to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Average Resolution Time</span>
                  <span className="font-bold text-muted-foreground">No data</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>First Response Time</span>
                  <span className="font-bold text-muted-foreground">No data</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Customer Satisfaction</span>
                  <span className="font-bold text-muted-foreground">No data</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tickets Resolved Today</span>
                  <span className="font-bold">{stats.resolved}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4 text-muted-foreground">
                  <p>No team performance data available</p>
                  <p className="text-sm">Data will appear when tickets are assigned to agents</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI-Powered Automation
              </CardTitle>
              <CardDescription>
                Automated workflows and AI assistance for faster ticket resolution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  SafeDesk is ready to receive and manage your support tickets. Create your first ticket to get started.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TicketingDemo;