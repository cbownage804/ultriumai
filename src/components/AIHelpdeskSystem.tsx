import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  User, 
  Users,
  Brain,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
  Plus
} from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  client_id: string;
  client_name: string;
  assigned_to?: string;
  ai_suggested_solution?: string;
  ai_confidence_score?: number;
  auto_resolved: boolean;
  created_at: string;
  updated_at: string;
  resolution_time_minutes?: number;
}

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'ai';
  timestamp: string;
  ticket_id: string;
}

export const AIHelpdeskSystem = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiStats, setAiStats] = useState({
    totalResolved: 0,
    avgResolutionTime: 0,
    aiConfidenceScore: 0,
    coManagedTickets: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadHelpdeskData();
  }, []);

  const loadHelpdeskData = async () => {
    try {
      setLoading(true);
      
      // Load tickets from support_tickets table
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select(`
          *,
          msp_clients(company_name)
        `)
        .order('created_at', { ascending: false });

      const formattedTickets = ticketsData?.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        client_id: ticket.client_id,
        client_name: ticket.msp_clients?.company_name || 'Unknown Client',
        ai_suggested_solution: ticket.ai_suggested_solution,
        ai_confidence_score: ticket.ai_confidence_score,
        auto_resolved: ticket.auto_resolved || false,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolution_time_minutes: ticket.resolution_time_minutes
      })) || [];

      setTickets(formattedTickets);

      // Calculate AI stats
      const resolvedTickets = formattedTickets.filter(t => t.status === 'resolved');
      const avgResTime = resolvedTickets.reduce((sum, t) => sum + (t.resolution_time_minutes || 0), 0) / resolvedTickets.length;
      const avgConfidence = formattedTickets.reduce((sum, t) => sum + (t.ai_confidence_score || 0), 0) / formattedTickets.length;
      
      setAiStats({
        totalResolved: resolvedTickets.length,
        avgResolutionTime: Math.round(avgResTime || 0),
        aiConfidenceScore: Math.round(avgConfidence || 0),
        coManagedTickets: formattedTickets.filter(t => t.ai_suggested_solution).length
      });

    } catch (error) {
      console.error('Failed to load helpdesk data:', error);
      toast({
        title: "Error",
        description: "Failed to load helpdesk data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAISolution = async (ticketId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-helpdesk-assistant', {
        body: {
          action: 'generate_solution',
          ticketId,
          ticketData: selectedTicket
        }
      });

      if (error) throw error;

      toast({
        title: "AI Solution Generated",
        description: "AI has analyzed the ticket and provided a suggested solution"
      });

      loadHelpdeskData();
    } catch (error) {
      console.error('Failed to generate AI solution:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI solution",
        variant: "destructive"
      });
    }
  };

  const autoResolveTicket = async (ticketId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-helpdesk-assistant', {
        body: {
          action: 'auto_resolve',
          ticketId
        }
      });

      if (error) throw error;

      toast({
        title: "Ticket Auto-Resolved",
        description: "AI has automatically resolved the ticket based on pattern recognition"
      });

      loadHelpdeskData();
    } catch (error) {
      console.error('Failed to auto-resolve ticket:', error);
      toast({
        title: "Error",
        description: "Failed to auto-resolve ticket",
        variant: "destructive"
      });
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const { data, error } = await supabase.functions.invoke('ai-helpdesk-assistant', {
        body: {
          action: 'chat_response',
          message: newMessage,
          ticketId: selectedTicket.id
        }
      });

      if (error) throw error;

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        message: newMessage,
        sender: 'user',
        timestamp: new Date().toISOString(),
        ticket_id: selectedTicket.id
      };

      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: data.response,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        ticket_id: selectedTicket.id
      };

      setChatMessages(prev => [...prev, userMessage, aiMessage]);
      setNewMessage("");

    } catch (error) {
      console.error('Failed to send chat message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-red-100 text-red-800';
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
            <div className="text-2xl font-bold text-green-600">{aiStats.totalResolved}</div>
            <p className="text-xs text-muted-foreground">
              Automatically resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats.avgResolutionTime}m</div>
            <p className="text-xs text-muted-foreground">
              AI-assisted resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats.aiConfidenceScore}%</div>
            <p className="text-xs text-muted-foreground">
              Solution accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Co-Managed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats.coManagedTickets}</div>
            <p className="text-xs text-muted-foreground">
              Human + AI support
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Helpdesk Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI-Powered Tickets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                      <span className="font-medium text-sm">{ticket.title}</span>
                    </div>
                    {ticket.auto_resolved && (
                      <Bot className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(ticket.status)} variant="secondary">
                      {ticket.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{ticket.client_name}</span>
                  </div>
                  {ticket.ai_confidence_score && (
                    <div className="mt-2 text-xs text-blue-600">
                      AI Confidence: {ticket.ai_confidence_score}%
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Ticket Details & AI Chat */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Ticket Details</TabsTrigger>
                <TabsTrigger value="ai-chat">AI Assistant</TabsTrigger>
                <TabsTrigger value="solutions">AI Solutions</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedTicket.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => generateAISolution(selectedTicket.id)}
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          Generate AI Solution
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => autoResolveTicket(selectedTicket.id)}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Auto Resolve
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Client: {selectedTicket.client_name} • Priority: {selectedTicket.priority}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                      </div>
                      
                      {selectedTicket.ai_suggested_solution && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Bot className="w-4 h-4" />
                            AI Suggested Solution
                          </h4>
                          <p className="text-sm">{selectedTicket.ai_suggested_solution}</p>
                          {selectedTicket.ai_confidence_score && (
                            <div className="mt-2 text-xs text-blue-600">
                              Confidence: {selectedTicket.ai_confidence_score}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-chat">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      AI Helpdesk Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Chat Messages */}
                      <div className="h-64 overflow-y-auto space-y-2 p-4 border rounded-lg">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Start a conversation with the AI assistant</p>
                          </div>
                        ) : (
                          chatMessages.map(msg => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs px-3 py-2 rounded-lg ${
                                  msg.sender === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{msg.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ask the AI assistant..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        />
                        <Button onClick={sendChatMessage}>
                          Send
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="solutions">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Knowledge Base</CardTitle>
                    <CardDescription>
                      AI-powered solutions and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Pattern Recognition</h4>
                          <p className="text-sm text-muted-foreground">
                            AI identifies similar issues and suggests proven solutions
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Automated Escalation</h4>
                          <p className="text-sm text-muted-foreground">
                            Smart routing based on complexity and urgency
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Learning Engine</h4>
                          <p className="text-sm text-muted-foreground">
                            Continuously improves from resolution outcomes
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Co-Management</h4>
                          <p className="text-sm text-muted-foreground">
                            Seamless handoff between AI and human agents
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Select a ticket to view details and interact with AI assistant</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};