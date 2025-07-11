import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  HeadphonesIcon, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare,
  Settings,
  BarChart3,
  Users,
  FileText,
  RefreshCw,
  Plus,
  Star,
  Zap
} from "lucide-react";

export const HelpdeskDashboard = () => {
  const [stats, setStats] = useState({
    openTickets: 0,
    inProgress: 0,
    resolved: 0,
    avgResponseTime: "0h",
    satisfaction: 0,
    agentsOnline: 0,
    totalAgents: 0
  });

  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    loadHelpdeskData();
  }, []);

  const loadHelpdeskData = async () => {
    try {
      const { data: ticketData, error } = await supabase
        .from('helpdesk_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedTickets = ticketData?.map(ticket => ({
        id: ticket.id,
        title: ticket.title || 'Untitled',
        user: 'Unknown User', // Email field needs to be mapped correctly
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        created: new Date(ticket.created_at).toLocaleString(),
        agent: ticket.assigned_to || 'Unassigned'
      })) || [];

      const openTickets = ticketData?.filter(t => t.status === 'open').length || 0;
      const inProgress = ticketData?.filter(t => t.status === 'in_progress').length || 0;
      const resolved = ticketData?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;

      setTickets(formattedTickets);
      setStats({
        openTickets,
        inProgress,
        resolved,
        avgResponseTime: "No data",
        satisfaction: 0,
        agentsOnline: 0,
        totalAgents: 0
      });
      setCategories([]);
      setAgents([]);
    } catch (error) {
      console.error('Error loading helpdesk data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600';
      case 'in-progress': return 'text-orange-600';
      case 'resolved': return 'text-green-600';
      case 'online': return 'text-green-600';
      case 'away': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in-progress': return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'away': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <HeadphonesIcon className="h-10 w-10 text-primary" />
            SafeDesk System
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Support ticket management and customer assistance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.openTickets}</div>
            <p className="text-xs text-blue-600 mt-2">{stats.inProgress} in progress</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-green-600 mt-2">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Zap className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.avgResponseTime}</div>
            <p className="text-xs text-orange-600 mt-2">Response time</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.satisfaction}</div>
            <p className="text-xs text-yellow-600 mt-2">Out of 5.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Active Support Tickets
              </CardTitle>
              <CardDescription>Manage and track customer support requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(ticket.status)}
                          <div>
                            <h4 className="font-medium">{ticket.title}</h4>
                            <p className="text-sm text-muted-foreground">#{ticket.id} • {ticket.user}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>
                            {ticket.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Created: {ticket.created}</span>
                        <span>Assigned to: {ticket.agent}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tickets found</p>
                    <p className="text-sm">Create your first support ticket to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Support Team
              </CardTitle>
              <CardDescription>Agent availability and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <div key={agent.name} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(agent.status)}
                          <div>
                            <h4 className="font-medium">{agent.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {agent.tickets} active tickets
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">{agent.rating}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">Rating</div>
                          </div>
                          <Badge variant={agent.status === 'online' ? 'default' : 'secondary'}>
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No agents configured</p>
                    <p className="text-sm">Add team members to start managing tickets</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Ticket Categories
              </CardTitle>
              <CardDescription>Distribution of support requests by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category.name} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{category.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{category.count}</span>
                          <span className="text-xs text-muted-foreground">({category.percentage}%)</span>
                        </div>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No category data available</p>
                    <p className="text-sm">Data will appear as tickets are categorized</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  SafeDesk Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">Business Hours</h4>
                  <p className="text-sm text-muted-foreground">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-sm text-muted-foreground">Weekend: 9:00 AM - 1:00 PM</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">Auto-Assignment</h4>
                  <p className="text-sm text-muted-foreground">Round-robin distribution enabled</p>
                </div>
                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Automatic updates to customers</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">Chat Support</h4>
                  <p className="text-sm text-muted-foreground">Live chat integration active</p>
                </div>
                <Button className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Manage Templates
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};