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
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Bell, 
  FileText, 
  HelpCircle, 
  Settings,
  Server,
  Shield,
  Cloud,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  DollarSign,
  Calendar,
  BookOpen,
  MessageSquare,
  Key
} from "lucide-react";
import safedocLogo from '@/assets/logos/logo-safedoc.png';
import { format } from "date-fns";

interface Service {
  id: string;
  service_name: string;
  service_description?: string;
  service_type: string;
  service_status: 'active' | 'inactive' | 'maintenance' | 'degraded' | 'outage';
  service_health: number;
  monthly_cost?: number;
  contract_end_date?: string;
  last_check_at: string;
}

interface PortalRequest {
  id: string;
  request_type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'reviewing' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
  requested_completion_date?: string;
  estimated_cost?: number;
}

interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  created_at: string;
}

interface PortalNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  starts_at: string;
  expires_at?: string;
  affected_services: string[];
}

const ClientPortal = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<PortalRequest[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeArticle[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  // New request form state
  const [newRequest, setNewRequest] = useState({
    request_type: "service_request" as const,
    title: "",
    description: "",
    priority: "medium" as const,
    business_justification: "",
    requested_completion_date: "",
  });

  useEffect(() => {
    if (user) {
      fetchPortalData();
    }
  }, [user]);

  const fetchPortalData = async () => {
    setLoading(true);
    
    // Demo data since we're building incrementally
    setServices([
      {
        id: '1',
        service_name: 'Email Security',
        service_description: 'Advanced email security with spam filtering and threat protection',
        service_type: 'security',
        service_status: 'active',
        service_health: 98,
        monthly_cost: 299.99,
        contract_end_date: '2024-12-31',
        last_check_at: new Date().toISOString(),
      },
      {
        id: '2',
        service_name: 'Cloud Backup',
        service_description: 'Automated daily backups to secure cloud storage',
        service_type: 'backup',
        service_status: 'active',
        service_health: 100,
        monthly_cost: 149.99,
        last_check_at: new Date().toISOString(),
      },
      {
        id: '3',
        service_name: 'Network Monitoring',
        service_description: '24/7 network monitoring and alerting',
        service_type: 'monitoring',
        service_status: 'maintenance',
        service_health: 85,
        monthly_cost: 199.99,
        last_check_at: new Date().toISOString(),
      }
    ]);

    setRequests([
      {
        id: '1',
        request_type: 'service_request',
        title: 'Additional VPN License',
        description: 'Need an additional VPN license for new remote employee',
        priority: 'medium',
        status: 'in_progress',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        estimated_cost: 25.00,
      },
      {
        id: '2',
        request_type: 'access_request',
        title: 'SharePoint Access for Marketing Team',
        description: 'Request access to marketing SharePoint site for new team member',
        priority: 'high',
        status: 'approved',
        created_at: new Date(Date.now() - 172800000).toISOString(),
      }
    ]);

    setKnowledgeBase([
      {
        id: '1',
        category: 'Email',
        title: 'How to Set Up Email Forwarding',
        content: 'Follow these steps to set up email forwarding in Outlook...',
        tags: ['email', 'outlook', 'forwarding'],
        view_count: 45,
        helpful_count: 12,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        category: 'Security',
        title: 'Best Practices for Password Management',
        content: 'Learn how to create and manage secure passwords...',
        tags: ['security', 'passwords', 'best-practices'],
        view_count: 78,
        helpful_count: 23,
        created_at: new Date().toISOString(),
      }
    ]);

    setNotifications([
      {
        id: '1',
        notification_type: 'maintenance',
        title: 'Scheduled Maintenance: Network Monitoring',
        message: 'Network monitoring services will be offline for maintenance from 2:00 AM to 4:00 AM EST.',
        severity: 'warning',
        starts_at: new Date().toISOString(),
        affected_services: ['Network Monitoring'],
      }
    ]);

    setLoading(false);
  };

  const handleSubmitRequest = async () => {
    if (!user || !newRequest.title.trim() || !newRequest.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Demo: Add to local state
      const demoRequest: PortalRequest = {
        id: Date.now().toString(),
        request_type: newRequest.request_type,
        title: newRequest.title,
        description: newRequest.description,
        priority: newRequest.priority,
        status: 'submitted',
        created_at: new Date().toISOString(),
        requested_completion_date: newRequest.requested_completion_date || undefined,
      };

      setRequests(prev => [demoRequest, ...prev]);
      setShowRequestDialog(false);
      setNewRequest({
        request_type: "service_request",
        title: "",
        description: "",
        priority: "medium",
        business_justification: "",
        requested_completion_date: "",
      });

      toast({
        title: "Success",
        description: "Request submitted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'infrastructure': return Server;
      case 'security': return Shield;
      case 'backup': return Cloud;
      case 'monitoring': return Monitor;
      case 'support': return HelpCircle;
      default: return Settings;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'degraded': return 'bg-orange-100 text-orange-800';
      case 'outage': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredKB = knowledgeBase.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const totalMonthlyCost = services.reduce((sum, service) => sum + (service.monthly_cost || 0), 0);
  const activeServices = services.filter(s => s.service_status === 'active').length;
  const averageHealth = services.length > 0 ? 
    Math.round(services.reduce((sum, s) => sum + s.service_health, 0) / services.length) : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Portal</h1>
          <p className="text-muted-foreground">Manage your services, submit requests, and access resources</p>
        </div>
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit New Request</DialogTitle>
              <DialogDescription>
                Submit a new service request, access request, or report an issue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="request-type">Request Type</Label>
                  <Select
                    value={newRequest.request_type}
                    onValueChange={(value) => setNewRequest(prev => ({ ...prev, request_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_request">Service Request</SelectItem>
                      <SelectItem value="access_request">Access Request</SelectItem>
                      <SelectItem value="change_request">Change Request</SelectItem>
                      <SelectItem value="incident_report">Incident Report</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="quote_request">Quote Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newRequest.priority}
                    onValueChange={(value) => setNewRequest(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of your request"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of your request"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="completion-date">Requested Completion Date</Label>
                  <Input
                    id="completion-date"
                    type="date"
                    value={newRequest.requested_completion_date}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, requested_completion_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="justification">Business Justification</Label>
                  <Textarea
                    id="justification"
                    value={newRequest.business_justification}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, business_justification: e.target.value }))}
                    placeholder="Why is this request needed?"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitRequest}>
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`border-l-4 ${
              notification.severity === 'critical' ? 'border-l-red-500' :
              notification.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Bell className={`h-5 w-5 mt-0.5 ${
                    notification.severity === 'critical' ? 'text-red-500' :
                    notification.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    {notification.affected_services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {notification.affected_services.map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Services</p>
                <p className="text-2xl font-bold">{activeServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Health Score</p>
                <p className="text-2xl font-bold">{averageHealth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Monthly Cost</p>
                <p className="text-2xl font-bold">${totalMonthlyCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Open Requests</p>
                <p className="text-2xl font-bold">{requests.filter(r => !['completed', 'rejected'].includes(r.status)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="safedoc" className="flex items-center gap-1">
            <img src={safedocLogo} alt="SafeDoc" className="h-4 w-auto" />
            SafeDoc
          </TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4">
            {services.map((service) => {
              const IconComponent = getServiceIcon(service.service_type);
              return (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{service.service_name}</h3>
                            <Badge className={getStatusColor(service.service_status)}>
                              {service.service_status}
                            </Badge>
                          </div>
                          {service.service_description && (
                            <p className="text-muted-foreground mb-3">{service.service_description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Health: {service.service_health}%</span>
                            {service.monthly_cost && (
                              <span>Monthly: ${service.monthly_cost}</span>
                            )}
                            {service.contract_end_date && (
                              <span>Contract ends: {format(new Date(service.contract_end_date), 'MMM dd, yyyy')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{service.service_health}%</div>
                        <div className="text-xs text-muted-foreground">Health Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{request.title}</h3>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                        <Badge variant="outline" className={getRequestStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{request.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Type: {request.request_type.replace('_', ' ')}</span>
                        <span>Submitted: {format(new Date(request.created_at), 'MMM dd, yyyy')}</span>
                        {request.estimated_cost && (
                          <span>Est. Cost: ${request.estimated_cost}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="safedoc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src={safedocLogo} alt="SafeDoc" className="h-6 w-auto" />
                IT Documentation
              </CardTitle>
              <CardDescription>
                Access your organization's IT documentation, passwords, and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="docs" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="docs" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="passwords" className="flex items-center gap-1">
                    <Key className="h-4 w-4" />
                    Passwords
                  </TabsTrigger>
                  <TabsTrigger value="configs" className="flex items-center gap-1">
                    <Server className="h-4 w-4" />
                    Configurations
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="docs" className="space-y-3">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search documents..." className="pl-10" />
                  </div>
                  <div className="grid gap-3">
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium">Network Diagram</h4>
                            <p className="text-sm text-muted-foreground">Main office network topology</p>
                            <Badge variant="secondary" className="mt-2 text-xs">Infrastructure</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium">Backup Procedures</h4>
                            <p className="text-sm text-muted-foreground">Daily backup verification steps</p>
                            <Badge variant="secondary" className="mt-2 text-xs">Runbook</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium">VPN Setup Guide</h4>
                            <p className="text-sm text-muted-foreground">Remote access configuration</p>
                            <Badge variant="secondary" className="mt-2 text-xs">How-To</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="passwords" className="space-y-3">
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Password access requires additional authentication.</p>
                    <Button variant="outline" className="mt-4">
                      Request Password Access
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="configs" className="space-y-3">
                  <div className="grid gap-3">
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Server className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium">Main Server</h4>
                            <p className="text-sm text-muted-foreground">Windows Server 2022 - Domain Controller</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">192.168.1.10</Badge>
                              <Badge variant="secondary" className="text-xs">Online</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium">Edge Firewall</h4>
                            <p className="text-sm text-muted-foreground">FortiGate 60F</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">192.168.1.1</Badge>
                              <Badge variant="secondary" className="text-xs">Online</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search knowledge base..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="software">Software</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredKB.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{article.title}</h3>
                        <Badge variant="secondary">{article.category}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3 line-clamp-2">{article.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Views: {article.view_count}</span>
                        <span>Helpful: {article.helpful_count}</span>
                        <span>Updated: {format(new Date(article.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {article.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Contact Support</span>
                </CardTitle>
                <CardDescription>
                  Get help from our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Emergency Support</p>
                  <p className="text-2xl font-bold text-red-600">1-800-EMERGENCY</p>
                  <p className="text-xs text-muted-foreground">24/7 for critical issues</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">General Support</p>
                  <p className="text-lg font-semibold">support@yourcompany.com</p>
                  <p className="text-xs text-muted-foreground">Response within 4 hours</p>
                </div>
                <Button className="w-full" onClick={() => setShowRequestDialog(true)}>
                  Submit Support Request
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Support Hours</span>
                </CardTitle>
                <CardDescription>
                  When you can reach our team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Monday - Friday</span>
                    <span>8:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Saturday</span>
                    <span>9:00 AM - 2:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sunday</span>
                    <span>Emergency Only</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">After Hours</span>
                    <span>Emergency Support Available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientPortal;