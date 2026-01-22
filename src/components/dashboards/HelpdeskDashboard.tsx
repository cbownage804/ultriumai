import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSafeDesk } from "@/hooks/useSafeDesk";
import { 
  HeadphonesIcon, 
  Clock, 
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
  Zap,
  Eye,
  Bot,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export const HelpdeskDashboard = () => {
  const {
    tickets,
    stats,
    isLoading,
    createTicket,
    updateTicket,
    escalateTicket,
    loadTickets,
    getTicketsByStatus,
    getOverdueTickets
  } = useSafeDesk();

  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<typeof tickets[0] | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: ''
  });

  const handleCreateTicket = async () => {
    if (!newTicket.title) return;
    
    await createTicket({
      title: newTicket.title,
      description: newTicket.description,
      priority: newTicket.priority,
      category: newTicket.category || null
    });
    
    setNewTicket({ title: '', description: '', priority: 'medium', category: '' });
    setShowCreateTicket(false);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-safedesk" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const overdueTickets = getOverdueTickets();
  const openTickets = getTicketsByStatus('open');
  const inProgressTickets = getTicketsByStatus('in_progress');

  // Calculate category distribution
  const categoryDistribution = tickets.reduce((acc, ticket) => {
    const cat = ticket.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(categoryDistribution).map(([name, count]) => ({
    name,
    count,
    percentage: tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safedesk"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background via-background to-safedesk-soft/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-safedesk to-safedesk-glow bg-clip-text text-transparent">
            <HeadphonesIcon className="h-10 w-10 text-safedesk" />
            SafeDesk System
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            AI-powered support ticket management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-safedesk/20 hover:bg-safedesk/5 hover:text-safedesk" onClick={() => loadTickets()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-safedesk to-safedesk-dark text-safedesk-foreground hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateTicket} className="w-full bg-safedesk hover:bg-safedesk-dark">
                  Create Ticket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-safedesk-soft/30 to-safedesk-soft/10 dark:from-safedesk-soft dark:to-safedesk-soft/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-5 w-5 text-safedesk" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-safedesk">{stats.openTickets}</div>
            <p className="text-xs text-safedesk-muted mt-2">{stats.inProgressTickets} in progress</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">{stats.resolvedTickets}</div>
            <p className="text-xs text-teal-600 mt-2">Total resolved</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-900/20 dark:to-sky-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Zap className="h-5 w-5 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-600">{stats.avgResolutionTime}m</div>
            <p className="text-xs text-sky-600 mt-2">Resolution time</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${stats.slaBreaches > 0 ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10' : 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
            <AlertCircle className={`h-5 w-5 ${stats.slaBreaches > 0 ? 'text-red-600' : 'text-green-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.slaBreaches > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.slaBreaches}</div>
            <p className={`text-xs mt-2 ${stats.slaBreaches > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.slaBreaches > 0 ? 'Action needed' : 'All on track'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-safedesk-soft/30 to-safedesk-soft/10 dark:from-safedesk-soft dark:to-safedesk-soft/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TrendingUp className="h-5 w-5 text-safedesk" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-safedesk">{stats.totalTickets}</div>
            <p className="text-xs text-safedesk-muted mt-2">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-safedesk data-[state=active]:text-safedesk-foreground">
            <FileText className="h-4 w-4 mr-2" />
            Tickets ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-safedesk data-[state=active]:text-safedesk-foreground">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Overdue ({overdueTickets.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-safedesk data-[state=active]:text-safedesk-foreground">
            <BarChart3 className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-safedesk data-[state=active]:text-safedesk-foreground">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-safedesk" />
                Active Support Tickets
              </CardTitle>
              <CardDescription>Manage and track customer support requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.length > 0 ? (
                  tickets.slice(0, 10).map((ticket) => (
                    <div key={ticket.id} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20 hover:border-safedesk/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(ticket.status)}
                          <div>
                            <h4 className="font-medium">{ticket.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              #{ticket.id.slice(0, 8)} • {ticket.category || 'Uncategorized'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority || 'medium'}
                          </Badge>
                          <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>
                            {ticket.status || 'open'}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {ticket.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Created: {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Unknown'}</span>
                        {ticket.sla_due_at && (
                          <span className={new Date(ticket.sla_due_at) < new Date() ? 'text-red-500 font-medium' : ''}>
                            SLA Due: {new Date(ticket.sla_due_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No tickets found</p>
                    <p className="text-sm">Create your first support ticket to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50/50 to-card dark:from-red-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Overdue Tickets - Action Required
              </CardTitle>
              <CardDescription>These tickets have exceeded their SLA deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overdueTickets.length > 0 ? (
                  overdueTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 border border-red-200 rounded-lg bg-red-50/50 dark:bg-red-900/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <div>
                            <h4 className="font-medium">{ticket.title}</h4>
                            <p className="text-sm text-muted-foreground">#{ticket.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority || 'medium'}
                          </Badge>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => escalateTicket(ticket.id)}
                          >
                            Escalate
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-red-600">
                        Overdue by: {ticket.sla_due_at ? `${Math.round((Date.now() - new Date(ticket.sla_due_at).getTime()) / (1000 * 60 * 60))}h` : 'Unknown'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                    <p className="font-medium">All tickets are on track!</p>
                    <p className="text-sm text-muted-foreground">No SLA breaches detected</p>
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
                <BarChart3 className="h-5 w-5 text-safedesk" />
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
                        <h4 className="font-medium capitalize">{category.name}</h4>
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
                  <Settings className="h-5 w-5 text-safedesk" />
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
                <Button className="w-full bg-safedesk hover:bg-safedesk-dark text-safedesk-foreground">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-safedesk" />
                  Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Automatic updates to customers</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-2">AI Assistant</h4>
                  <p className="text-sm text-muted-foreground">SafeDesk AI is active and ready</p>
                </div>
                <Button className="w-full bg-safedesk hover:bg-safedesk-dark text-safedesk-foreground">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Manage Templates
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-safedesk" />
                  Ticket #{selectedTicket.id.slice(0, 8)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedTicket.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority || 'medium'}
                    </Badge>
                    <Badge variant="secondary">{selectedTicket.status || 'open'}</Badge>
                    {selectedTicket.category && (
                      <Badge variant="outline">{selectedTicket.category}</Badge>
                    )}
                  </div>
                </div>
                
                {selectedTicket.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{selectedTicket.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'Unknown'}</p>
                  </div>
                  {selectedTicket.sla_due_at && (
                    <div>
                      <Label className="text-muted-foreground">SLA Due</Label>
                      <p className={new Date(selectedTicket.sla_due_at) < new Date() ? 'text-red-500' : ''}>
                        {new Date(selectedTicket.sla_due_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                    <>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          updateTicket(selectedTicket.id, { status: 'in_progress' });
                          setSelectedTicket(null);
                        }}
                      >
                        Start Working
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          updateTicket(selectedTicket.id, { status: 'resolved' });
                          setSelectedTicket(null);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          escalateTicket(selectedTicket.id);
                          setSelectedTicket(null);
                        }}
                      >
                        Escalate
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
