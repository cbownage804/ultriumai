import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Filter, Plus, MoreHorizontal, Clock, User, AlertCircle,
  ChevronDown, Calendar, Tag, MessageSquare, Paperclip, Zap,
  TrendingUp, Target, CheckCircle2, AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  category: string;
  client_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  ai_confidence_score?: number;
  resolution_time_minutes?: number;
  tags?: string[];
  attachments?: number;
  comments_count?: number;
  sla_due_at?: string;
  client_name?: string;
  assignee_name?: string;
}

const TICKET_COLUMNS = [
  { id: 'open', title: 'New Tickets', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'pending', title: 'Pending', color: 'bg-purple-500' },
  { id: 'resolved', title: 'Resolved', color: 'bg-green-500' }
];

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  urgent: 'bg-red-100 text-red-800 border-red-300'
};

export const AdvancedTicketBoard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, priorityFilter, categoryFilter, assigneeFilter]);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTickets = data?.map(ticket => ({
        ...ticket,
        priority: ticket.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: ticket.status as 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed',
        client_name: 'Sample Client', // Simulated
        assignee_name: 'Unassigned', // Simulated
        tags: [], // Simulated
        attachments: Math.floor(Math.random() * 3), // Simulated
        comments_count: Math.floor(Math.random() * 5), // Simulated
        sla_due_at: new Date(Date.now() + Math.random() * 86400000 * 3).toISOString() // Simulated SLA
      })) || [];

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    // Assignee filter
    if (assigneeFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.assigned_to === assigneeFilter);
    }

    setFilteredTickets(filtered);
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggableId);

      if (error) throw error;

      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === draggableId 
          ? { ...ticket, status: newStatus as any, updated_at: new Date().toISOString() }
          : ticket
      ));

      toast({
        title: "Ticket Updated",
        description: `Ticket moved to ${TICKET_COLUMNS.find(col => col.id === newStatus)?.title}`,
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const getTicketsByStatus = (status: string) => {
    return filteredTickets.filter(ticket => ticket.status === status);
  };

  const getSLAStatus = (slaDate?: string) => {
    if (!slaDate) return 'unknown';
    const now = new Date();
    const sla = new Date(slaDate);
    const hoursRemaining = (sla.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursRemaining < 0) return 'overdue';
    if (hoursRemaining < 2) return 'critical';
    if (hoursRemaining < 8) return 'warning';
    return 'good';
  };

  const TicketCard = ({ ticket, index }: { ticket: Ticket; index: number }) => {
    const slaStatus = getSLAStatus(ticket.sla_due_at);
    
    return (
      <Draggable draggableId={ticket.id} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
              snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{ticket.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`ml-2 text-xs ${PRIORITY_COLORS[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </Badge>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{ticket.client_name}</span>
                  <span>{formatDistanceToNow(new Date(ticket.created_at))} ago</span>
                </div>

                {/* Tags */}
                {ticket.tags && ticket.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.slice(0, 2).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {ticket.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{ticket.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ticket.assignee_name !== 'Unassigned' && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs truncate max-w-16">{ticket.assignee_name}</span>
                      </div>
                    )}
                    
                    {ticket.ai_confidence_score && ticket.ai_confidence_score > 80 && (
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-500">{ticket.ai_confidence_score}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {ticket.attachments > 0 && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        <span className="text-xs">{ticket.attachments}</span>
                      </div>
                    )}
                    
                    {ticket.comments_count > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="text-xs">{ticket.comments_count}</span>
                      </div>
                    )}

                    {/* SLA Indicator */}
                    <div className={`w-2 h-2 rounded-full ${
                      slaStatus === 'overdue' ? 'bg-red-500' :
                      slaStatus === 'critical' ? 'bg-orange-500' :
                      slaStatus === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </Draggable>
    );
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SafeDesk Board</h2>
          <p className="text-muted-foreground">Drag tickets between columns to update status</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setPriorityFilter("all");
                setCategoryFilter("all");
                setAssigneeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TICKET_COLUMNS.map(column => {
            const columnTickets = getTicketsByStatus(column.id);
            
            return (
              <div key={column.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-medium">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnTickets.length}
                    </Badge>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-96 p-2 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted bg-muted/20'
                      }`}
                    >
                      {columnTickets.map((ticket, index) => (
                        <TicketCard key={ticket.id} ticket={ticket} index={index} />
                      ))}
                      {provided.placeholder}
                      
                      {columnTickets.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <div className="text-center">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No tickets</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};