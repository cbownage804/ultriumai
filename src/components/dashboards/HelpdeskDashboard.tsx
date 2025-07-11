import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const stats = {
    openTickets: 23,
    inProgress: 8,
    resolved: 47,
    avgResponseTime: "2.3h",
    satisfaction: 4.7,
    agentsOnline: 5,
    totalAgents: 7
  };

  const tickets = [
    { 
      id: "TKT-2024-001", 
      title: "Password reset request", 
      user: "john.doe@company.com", 
      priority: "medium", 
      status: "open", 
      created: "10 min ago",
      agent: "Sarah Wilson"
    },
    { 
      id: "TKT-2024-002", 
      title: "Email not working", 
      user: "jane.smith@company.com", 
      priority: "high", 
      status: "in-progress", 
      created: "25 min ago",
      agent: "Mike Johnson"
    },
    { 
      id: "TKT-2024-003", 
      title: "Software installation help", 
      user: "bob.brown@company.com", 
      priority: "low", 
      status: "resolved", 
      created: "1 hour ago",
      agent: "Lisa Chen"
    }
  ];

  const categories = [
    { name: "Password Issues", count: 8, percentage: 35 },
    { name: "Email Problems", count: 5, percentage: 22 },
    { name: "Software Support", count: 4, percentage: 17 },
    { name: "Hardware Issues", count: 3, percentage: 13 },
    { name: "Network Access", count: 3, percentage: 13 }
  ];

  const agents = [
    { name: "Sarah Wilson", status: "online", tickets: 5, rating: 4.9 },
    { name: "Mike Johnson", status: "online", tickets: 3, rating: 4.8 },
    { name: "Lisa Chen", status: "online", tickets: 4, rating: 4.7 },
    { name: "David Park", status: "away", tickets: 2, rating: 4.6 },
    { name: "Emma Davis", status: "online", tickets: 6, rating: 4.8 }
  ];

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
                {tickets.map((ticket) => (
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
                ))}
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
                {agents.map((agent) => (
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
                ))}
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
                {categories.map((category) => (
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
                ))}
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