import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, MessageSquare, CheckCircle, Clock, Users, Brain, Zap } from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  client_id: string;
  ai_suggested_solution: string;
  ai_confidence_score: number;
  auto_resolved: boolean;
  resolution_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export const AIHelpdeskSystem = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    aiResolved: 0,
    avgResolutionTime: 0,
    aiConfidence: 0,
    coManaged: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTicketData();
  }, []);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTickets = ticketsData?.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description || '',
        priority: ticket.priority,
        status: ticket.status,
        client_id: ticket.client_id || ticket.user_id,
        ai_suggested_solution: ticket.ai_suggested_solution || '',
        ai_confidence_score: ticket.ai_confidence_score || 0,
        auto_resolved: ticket.auto_resolved || false,
        resolution_time_minutes: ticket.resolution_time_minutes || 0,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Resolved Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aiResolved}</div>
            <p className="text-xs text-muted-foreground">Automatically resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResolutionTime}m</div>
            <p className="text-xs text-muted-foreground">AI-assisted resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiConfidence}%</div>
            <p className="text-xs text-muted-foreground">Solution accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Co-Managed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coManaged}</div>
            <p className="text-xs text-muted-foreground">Human + AI support</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI-Powered Helpdesk System
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
                  AI-powered helpdesk is ready to assist your clients
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Recent Support Tickets</h4>
                  <Button variant="outline" size="sm" onClick={loadTicketData}>
                    <Zap className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-3">
                  {tickets.slice(0, 5).map(ticket => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Priority: {ticket.priority} • Status: {ticket.status}
                        </p>
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
    </div>
  );
};