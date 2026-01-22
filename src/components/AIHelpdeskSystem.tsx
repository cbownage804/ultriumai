import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useHelpdeskRole } from "@/hooks/useHelpdeskRole";
import { TicketComments } from "@/components/helpdesk/TicketComments";
import { Bot, MessageSquare, CheckCircle, Clock, Users, Brain, Zap, Plus, Eye, AlertTriangle } from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  client_id: string;
  msp_id?: string;
  internal_notes?: string;
  is_internal_visible: boolean;
  assigned_to?: string;
  assigned_by?: string;
  ai_suggested_solution: string;
  ai_confidence_score: number;
  auto_resolved: boolean;
  resolution_time_minutes: number;
  created_at: string;
  updated_at: string;
  msp_clients?: {
    company_name: string;
  } | null;
}

export const AIHelpdeskSystem = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    client_id: ''
  });
  const [stats, setStats] = useState({
    aiResolved: 0,
    avgResolutionTime: 0,
    aiConfidence: 0,
    coManaged: 0
  });
  const { toast } = useToast();
  const { 
    canViewInternalNotes, 
    canViewAllTickets, 
    isMSPUser, 
    isClientUser, 
    userContext 
  } = useHelpdeskRole();

  useEffect(() => {
    loadTicketData();
  }, []);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          msp_clients(company_name)
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (isClientUser() && userContext?.client_id) {
        query = query.eq('client_id', userContext.client_id);
      } else if (isMSPUser() && userContext?.msp_id) {
        query = query.eq('msp_id', userContext.msp_id);
      }

      const { data: ticketsData, error } = await query;

      if (error) throw error;

      const formattedTickets = ticketsData?.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description || '',
        priority: ticket.priority,
        status: ticket.status,
        client_id: ticket.client_id,
        msp_id: ticket.msp_id,
        internal_notes: ticket.internal_notes,
        is_internal_visible: ticket.is_internal_visible || false,
        assigned_to: ticket.assigned_to,
        assigned_by: ticket.assigned_by,
        ai_suggested_solution: ticket.ai_suggested_solution || '',
        ai_confidence_score: ticket.ai_confidence_score || 0,
        auto_resolved: ticket.auto_resolved || false,
        resolution_time_minutes: ticket.resolution_time_minutes || 0,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        msp_clients: (ticket.msp_clients && 
                     typeof ticket.msp_clients === 'object' && 
                     !Array.isArray(ticket.msp_clients) &&
                     'company_name' in ticket.msp_clients) 
          ? ticket.msp_clients as { company_name: string }
          : null
      })) || [];

      setTickets(formattedTickets);

      // Calculate stats
      const aiResolvedCount = formattedTickets.filter(t => t.auto_resolved).length;
      const resolvedTickets = formattedTickets.filter(t => t.status === 'resolved');
      const avgTime = resolvedTickets.length > 0 
        ? resolvedTickets.reduce((sum, t) => sum + t.resolution_time_minutes, 0) / resolvedTickets.length 
        : 12;
      const avgConfidence = formattedTickets.length > 0
        ? formattedTickets.reduce((sum, t) => sum + t.ai_confidence_score, 0) / formattedTickets.length
        : 87;

      setStats({
        aiResolved: aiResolvedCount,
        avgResolutionTime: Math.round(avgTime),
        aiConfidence: Math.round(avgConfidence),
        coManaged: formattedTickets.length - aiResolvedCount
      });

    } catch (error) {
      console.error('Failed to load ticket data:', error);
      toast({
        title: "Error",
        description: "Failed to load helpdesk data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) return;

    try {
      const ticketData = {
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        client_id: isClientUser() ? userContext?.client_id : newTicket.client_id,
        msp_id: userContext?.msp_id
      };

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          ...ticketData,
          user_id: userContext?.user_id || ''
        });

      if (error) throw error;

      setNewTicket({ title: '', description: '', priority: 'medium', client_id: '' });
      setShowCreateTicket(false);
      loadTicketData();

      toast({
        title: "Success",
        description: "Support ticket created successfully"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Helpdesk Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-safedesk/20 bg-gradient-to-br from-safedesk-soft/30 to-safedesk-soft/10 dark:from-safedesk-soft dark:to-safedesk-soft/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Resolved Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-safedesk" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-safedesk">{stats.aiResolved}</div>
            <p className="text-xs text-muted-foreground">Automatically resolved</p>
          </CardContent>
        </Card>

        <Card className="border-safedesk/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-safedesk" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-safedesk">{stats.avgResolutionTime}m</div>
            <p className="text-xs text-muted-foreground">AI-assisted resolution</p>
          </CardContent>
        </Card>

        <Card className="border-safedesk/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Brain className="h-4 w-4 text-safedesk" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-safedesk">{stats.aiConfidence}%</div>
            <p className="text-xs text-muted-foreground">Solution accuracy</p>
          </CardContent>
        </Card>

        <Card className="border-safedesk/20 bg-gradient-to-br from-safedesk-soft/30 to-safedesk-soft/10 dark:from-safedesk-soft dark:to-safedesk-soft/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Co-Managed</CardTitle>
            <Users className="h-4 w-4 text-safedesk" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-safedesk">{stats.coManaged}</div>
            <p className="text-xs text-muted-foreground">Human + AI support</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            SafeDesk - AI-Powered Ticketing System
          </CardTitle>
          <CardDescription>
            Co-managed support with AI chat assistants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No support tickets found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  SafeDesk AI is ready to assist your clients
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Recent Support Tickets</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadTicketData}>
                      <Zap className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          New Ticket
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Support Ticket</DialogTitle>
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
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={newTicket.description}
                              onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Detailed description of the issue"
                              className="min-h-[100px]"
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
                          <Button onClick={createTicket} className="w-full">
                            Create Ticket
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="space-y-3">
                  {tickets.slice(0, 5).map(ticket => (
                    <div key={ticket.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{ticket.title}</p>
                            {canViewInternalNotes() && ticket.internal_notes && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {isMSPUser() && ticket.msp_clients && 'company_name' in ticket.msp_clients ? `${ticket.msp_clients.company_name} • ` : ''}
                            Priority: {ticket.priority} • Status: {ticket.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ticket.auto_resolved && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Bot className="w-3 h-3 mr-1" />
                            AI Resolved
                          </Badge>
                        )}
                        {ticket.ai_confidence_score > 0 && (
                          <span className="text-xs text-blue-600">
                            {ticket.ai_confidence_score}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Ticket #{selectedTicket.id.slice(0, 8)}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{selectedTicket.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={selectedTicket.priority === 'critical' ? 'destructive' : 'secondary'}>
                          {selectedTicket.priority}
                        </Badge>
                        <Badge variant={selectedTicket.status === 'resolved' ? 'default' : 'outline'}>
                          {selectedTicket.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedTicket.description}
                      </p>
                      
                      {canViewInternalNotes() && selectedTicket.internal_notes && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            Internal Notes (MSP Only)
                          </h4>
                          <p className="text-sm bg-orange-50 p-3 rounded-md">
                            {selectedTicket.internal_notes}
                          </p>
                        </div>
                      )}

                      {selectedTicket.ai_suggested_solution && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Bot className="w-4 h-4 text-blue-500" />
                            AI Suggested Solution
                            {selectedTicket.ai_confidence_score > 0 && (
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
                
                <div>
                  <TicketComments ticketId={selectedTicket.id} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};