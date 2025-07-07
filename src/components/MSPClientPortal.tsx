import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Users, 
  Shield, 
  BarChart3, 
  Ticket, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  MessageSquare,
  Phone,
  Mail,
  Key,
  Link,
  Network,
  Layers,
  X,
  Camera,
  Paperclip,
  UserPlus,
  UserMinus,
  Palette,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SafeDocApp } from "@/components/apps/SafeDocApp";
import { SafeLinkApp } from "@/components/apps/SafeLinkApp";
import { SafeMailApp } from "@/components/apps/SafeMailApp";
import { SafeNetApp } from "@/components/apps/SafeNetApp";
import { SafePassApp } from "@/components/apps/SafePassApp";

interface ClientPortalUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  last_login: string;
  created_at: string;
  permissions: string[];
}

interface ClientAsset {
  id: string;
  name: string;
  type: 'workstation' | 'server' | 'network_device' | 'mobile';
  status: 'online' | 'offline' | 'maintenance' | 'alert';
  last_seen: string;
  location?: string;
  ip_address?: string;
  os_version?: string;
  security_status: 'secure' | 'warning' | 'critical';
}

interface ClientTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  queue: string;
  ticket_type: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  client_contact: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    type: string;
  }>;
}

interface ClientReport {
  id: string;
  title: string;
  type: 'security' | 'performance' | 'compliance' | 'maintenance';
  generated_at: string;
  period: string;
  file_url: string;
  file_size: number;
  status: 'generated' | 'generating' | 'failed';
}

const MSPClientPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<ClientPortalUser[]>([]);
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [tickets, setTickets] = useState<ClientTicket[]>([]);
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showQueueManager, setShowQueueManager] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newQueue, setNewQueue] = useState({ name: '', color: '#3b82f6', description: '', icon: 'MessageSquare' });
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    queue: 'helpdesk',
    ticket_type: 'hardware',
    attachments: [] as File[]
  });

  // Portal customization settings
  const [portalSettings, setPortalSettings] = useState({
    company_name: 'TechCorp Solutions',
    logo_url: '',
    primary_color: '#3b82f6',
    support_email: 'support@techcorp.com',
    support_phone: '+1 (555) 123-4567',
    welcome_message: 'Welcome to your IT support portal',
    custom_domain: 'portal.techcorp.com',
    enable_tickets: true,
    enable_reports: true,
    enable_assets: true,
    enable_knowledge_base: true,
    // SafeSuite app subscriptions
    safesuite_apps: {
      safedoc: true,
      safelink: true,
      safemail: false,
      safenet: true,
      safepass: true
    },
    // Custom queues
    support_queues: [
      { id: 'helpdesk', name: 'Helpdesk', color: '#3b82f6', description: 'General support and user assistance', icon: 'MessageSquare' },
      { id: 'engineering', name: 'Engineering', color: '#ef4444', description: 'Technical issues and infrastructure', icon: 'Settings' },
      { id: 'onboarding', name: 'Onboarding', color: '#22c55e', description: 'New user setup and training', icon: 'UserPlus' },
      { id: 'offboarding', name: 'Offboarding', color: '#f59e0b', description: 'User removal and account cleanup', icon: 'UserMinus' },
    ],
    // Custom ticket types
    ticket_types: [
      { id: 'hardware', name: 'Hardware', color: '#8b5cf6', description: 'Physical equipment issues' },
      { id: 'software', name: 'Software', color: '#06b6d4', description: 'Application and software problems' },
      { id: 'credentials', name: 'Credentials', color: '#f59e0b', description: 'Password and access issues' },
      { id: 'update', name: 'Update', color: '#10b981', description: 'System updates and patches' },
      { id: 'network', name: 'Network', color: '#ef4444', description: 'Connectivity and network issues' },
      { id: 'security', name: 'Security', color: '#dc2626', description: 'Security incidents and threats' },
    ]
  });

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = () => {
    // Mock client portal users
    const mockUsers: ClientPortalUser[] = [
      {
        id: '1',
        email: 'john.doe@techcorp.com',
        name: 'John Doe',
        role: 'admin',
        status: 'active',
        last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        permissions: ['view_tickets', 'create_tickets', 'view_reports', 'manage_users']
      },
      {
        id: '2',
        email: 'sarah.smith@techcorp.com',
        name: 'Sarah Smith',
        role: 'user',
        status: 'active',
        last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        permissions: ['view_tickets', 'create_tickets', 'view_reports']
      },
      {
        id: '3',
        email: 'mike.wilson@techcorp.com',
        name: 'Mike Wilson',
        role: 'viewer',
        status: 'pending',
        last_login: '',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        permissions: ['view_tickets', 'view_reports']
      }
    ];
    setUsers(mockUsers);

    // Mock client assets
    const mockAssets: ClientAsset[] = [
      {
        id: '1',
        name: 'EXEC-LAPTOP-01',
        type: 'workstation',
        status: 'online',
        last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        location: 'Executive Office',
        ip_address: '192.168.1.101',
        os_version: 'Windows 11 Pro',
        security_status: 'secure'
      },
      {
        id: '2',
        name: 'FILE-SERVER-01',
        type: 'server',
        status: 'online',
        last_seen: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        location: 'Data Center',
        ip_address: '192.168.1.10',
        os_version: 'Windows Server 2022',
        security_status: 'warning'
      },
      {
        id: '3',
        name: 'RECEPTION-PC-01',
        type: 'workstation',
        status: 'offline',
        last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        location: 'Reception',
        ip_address: '192.168.1.102',
        os_version: 'Windows 10 Pro',
        security_status: 'critical'
      }
    ];
    setAssets(mockAssets);

    // Mock client tickets
    const mockTickets: ClientTicket[] = [
      {
        id: 'TCK-001',
        title: 'Email not working on mobile device',
        description: 'Unable to receive emails on iPhone since yesterday',
        status: 'in_progress',
        priority: 'medium',
        category: 'Email Support',
        queue: 'helpdesk',
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'Tech Support Team',
        client_contact: 'sarah.smith@techcorp.com',
        attachments: [
          {
            id: '1',
            filename: 'error_screenshot.png',
            url: '/attachments/error_screenshot.png',
            size: 234567,
            type: 'image/png'
          }
        ]
      },
      {
        id: 'TCK-002',
        title: 'Printer connectivity issues',
        description: 'Network printer is not responding, cannot print documents',
        status: 'open',
        priority: 'high',
        category: 'Hardware Support',
        queue: 'engineering',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        client_contact: 'john.doe@techcorp.com'
      },
      {
        id: 'TCK-003',
        title: 'Software installation request',
        description: 'Need Adobe Acrobat Pro installed on 5 workstations',
        status: 'resolved',
        priority: 'low',
        category: 'Software Support',
        queue: 'onboarding',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'Installation Team',
        client_contact: 'mike.wilson@techcorp.com'
      }
    ];
    setTickets(mockTickets);

    // Mock client reports
    const mockReports: ClientReport[] = [
      {
        id: '1',
        title: 'Monthly Security Report - January 2024',
        type: 'security',
        generated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        period: 'January 2024',
        file_url: '/reports/security-jan-2024.pdf',
        file_size: 2485760,
        status: 'generated'
      },
      {
        id: '2',
        title: 'System Performance Report - Q4 2023',
        type: 'performance',
        generated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        period: 'Q4 2023',
        file_url: '/reports/performance-q4-2023.pdf',
        file_size: 3247810,
        status: 'generated'
      },
      {
        id: '3',
        title: 'Compliance Report - SOC 2',
        type: 'compliance',
        generated_at: new Date().toISOString(),
        period: 'Current',
        file_url: '',
        file_size: 0,
        status: 'generating'
      }
    ];
    setReports(mockReports);
  };

  const createPortalUser = () => {
    // Mock user creation
    const newUser: ClientPortalUser = {
      id: Date.now().toString(),
      email: '',
      name: '',
      role: 'user',
      status: 'pending',
      last_login: '',
      created_at: new Date().toISOString(),
      permissions: ['view_tickets', 'create_tickets']
    };
    
    setUsers(prev => [newUser, ...prev]);
    toast({
      title: "User Invitation Sent",
      description: "Portal access invitation has been sent to the user"
    });
  };

  const createTicket = () => {
    if (!ticketForm.title || !ticketForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and description",
        variant: "destructive"
      });
      return;
    }

    // Mock ticket creation with form data
    const newTicket: ClientTicket = {
      id: `TCK-${String(tickets.length + 1).padStart(3, '0')}`,
      title: ticketForm.title,
      description: ticketForm.description,
      status: 'open',
      priority: ticketForm.priority,
      category: ticketForm.ticket_type || 'General Support',
      queue: ticketForm.queue,
      ticket_type: ticketForm.ticket_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client_contact: user?.email || 'client@company.com',
      attachments: ticketForm.attachments.map((file, index) => ({
        id: `att-${index}`,
        filename: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type
      }))
    };

    setTickets(prev => [newTicket, ...prev]);
    
    // Reset form
    setTicketForm({
      title: '',
      description: '',
      priority: 'medium',
      queue: portalSettings.support_queues[0]?.id || 'helpdesk',
      ticket_type: portalSettings.ticket_types[0]?.id || 'hardware',
      attachments: []
    });
    setShowCreateTicket(false);

    toast({
      title: "Ticket Created Successfully",
      description: `Ticket ${newTicket.id} has been submitted to the ${newTicket.queue} queue`
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "File Type Restriction",
        description: "Only image files are allowed for attachments",
        variant: "destructive"
      });
    }

    setTicketForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...imageFiles].slice(0, 5) // Max 5 files
    }));
  };

  const removeAttachment = (index: number) => {
    setTicketForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'online':
      case 'secure':
      case 'resolved':
      case 'generated':
        return 'default';
      case 'warning':
      case 'in_progress':
      case 'generating':
        return 'secondary';
      case 'inactive':
      case 'offline':
      case 'critical':
      case 'open':
      case 'failed':
        return 'destructive';
      case 'pending':
      case 'maintenance':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getQueueColor = (queueId: string) => {
    const queue = portalSettings.support_queues.find(q => q.id === queueId);
    return queue?.color || '#6b7280';
  };

  const getTicketTypeColor = (typeId: string) => {
    const type = portalSettings.ticket_types.find(t => t.id === typeId);
    return type?.color || '#6b7280';
  };

  const addQueue = () => {
    if (!newQueue.name) return;
    
    const queue = {
      id: newQueue.name.toLowerCase().replace(/\s+/g, '_'),
      name: newQueue.name,
      color: newQueue.color,
      description: newQueue.description,
      icon: newQueue.icon
    };
    
    setPortalSettings(prev => ({
      ...prev,
      support_queues: [...prev.support_queues, queue]
    }));
    
    setNewQueue({ name: '', color: '#3b82f6', description: '', icon: 'MessageSquare' });
    toast({ title: "Queue Added", description: `${queue.name} queue has been created` });
  };

  const addTicketType = () => {
    if (!newTicketType.name) return;
    
    const type = {
      id: newTicketType.name.toLowerCase().replace(/\s+/g, '_'),
      name: newTicketType.name,
      color: newTicketType.color,
      description: newTicketType.description
    };
    
    setPortalSettings(prev => ({
      ...prev,
      ticket_types: [...prev.ticket_types, type]
    }));
    
    setNewTicketType({ name: '', color: '#3b82f6', description: '' });
    toast({ title: "Ticket Type Added", description: `${type.name} type has been created` });
  };

  const removeQueue = (queueId: string) => {
    setPortalSettings(prev => ({
      ...prev,
      support_queues: prev.support_queues.filter(q => q.id !== queueId)
    }));
    toast({ title: "Queue Removed", description: "Queue has been deleted" });
  };

  const removeTicketType = (typeId: string) => {
    setPortalSettings(prev => ({
      ...prev,
      ticket_types: prev.ticket_types.filter(t => t.id !== typeId)
    }));
    toast({ title: "Ticket Type Removed", description: "Type has been deleted" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">MSP Client Portal</h2>
          <p className="text-muted-foreground">
            Manage client access and self-service capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview Portal
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Portal Users</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="safesuite">SafeSuite Apps</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success/10 rounded-full">
                    <Building2 className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{assets.filter(a => a.status === 'online').length}</p>
                    <p className="text-sm text-muted-foreground">Online Assets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-warning/10 rounded-full">
                    <Ticket className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}</p>
                    <p className="text-sm text-muted-foreground">Open Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-info/10 rounded-full">
                    <Shield className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round((assets.filter(a => a.security_status === 'secure').length / assets.length) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Security Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest portal user activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.slice(0, 3).map((ticket) => (
                    <div key={ticket.id} className="flex items-center gap-3 p-3 border rounded">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.client_contact} • {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(ticket.status)} className="text-xs">
                        {ticket.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Status Overview</CardTitle>
                <CardDescription>Current status of monitored assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Online Assets</span>
                    <div className="flex items-center gap-2">
                      <Progress value={70} className="w-20" />
                      <span className="text-sm font-medium">70%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Security Compliance</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Update Status</span>
                    <div className="flex items-center gap-2">
                      <Progress value={92} className="w-20" />
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={createPortalUser}>
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>

          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{user.name || 'Pending User'}</h4>
                          <Badge variant={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.last_login ? 
                            `Last login: ${new Date(user.last_login).toLocaleString()}` :
                            'Never logged in'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                      {user.status === 'pending' && (
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Invite
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-10 w-64"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Support Ticket</DialogTitle>
                  <DialogDescription>
                    Submit a detailed support request with attachments to our support team
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Ticket Title *</Label>
                      <Input
                        id="title"
                        value={ticketForm.title}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Brief description of the issue"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ticket-type">Ticket Type</Label>
                      <Select 
                        value={ticketForm.ticket_type} 
                        onValueChange={(value: any) => setTicketForm(prev => ({ ...prev, ticket_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {portalSettings.ticket_types.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: type.color }}
                                />
                                <span>{type.name}</span>
                                {type.description && (
                                  <span className="text-xs text-muted-foreground">- {type.description}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={ticketForm.priority} 
                        onValueChange={(value: any) => setTicketForm(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - General inquiry</SelectItem>
                          <SelectItem value="medium">Medium - Standard issue</SelectItem>
                          <SelectItem value="high">High - Business impacting</SelectItem>
                          <SelectItem value="critical">Critical - System down</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="queue">Support Queue</Label>
                      <Select 
                        value={ticketForm.queue} 
                        onValueChange={(value: any) => setTicketForm(prev => ({ ...prev, queue: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {portalSettings.support_queues.map(queue => {
                            const iconMap: Record<string, any> = {
                              MessageSquare,
                              Settings,
                              UserPlus,
                              UserMinus,
                              Users,
                              Ticket
                            };
                            const IconComponent = iconMap[queue.icon] || MessageSquare;
                            
                            return (
                              <SelectItem key={queue.id} value={queue.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: queue.color }}
                                  />
                                  <IconComponent className="h-4 w-4" />
                                  <span>{queue.name}</span>
                                  {queue.description && (
                                    <span className="text-xs text-muted-foreground">- {queue.description}</span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide detailed information about your issue, including steps to reproduce, error messages, and any troubleshooting already attempted"
                      className="min-h-24"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Photo Attachments</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          className="flex items-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Add Photos
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Max 5 photos • Images only
                        </span>
                      </div>
                      
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      {ticketForm.attachments.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Attached Photos:</p>
                          <div className="space-y-2">
                            {ticketForm.attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({formatFileSize(file.size)})
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAttachment(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTicket}>
                    Create Ticket
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{ticket.title}</h4>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>#{ticket.id}</span>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: getTicketTypeColor(ticket.ticket_type || 'hardware') }}
                          />
                          <span>{portalSettings.ticket_types.find(t => t.id === ticket.ticket_type)?.name || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: getQueueColor(ticket.queue) }}
                          />
                          <span>{portalSettings.support_queues.find(q => q.id === ticket.queue)?.name || ticket.queue}</span>
                        </div>
                        <span>Contact: {ticket.client_contact}</span>
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.assigned_to && <span>Assigned: {ticket.assigned_to}</span>}
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            {ticket.attachments.length} file{ticket.attachments.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Card key={asset.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {asset.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Badge variant={getStatusColor(asset.status)}>
                      {asset.status}
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold mb-2">{asset.name}</h4>
                  
                  <div className="space-y-2 text-sm">
                    {asset.location && (
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span>{asset.location}</span>
                      </div>
                    )}
                    {asset.ip_address && (
                      <div className="flex justify-between">
                        <span>IP Address:</span>
                        <span>{asset.ip_address}</span>
                      </div>
                    )}
                    {asset.os_version && (
                      <div className="flex justify-between">
                        <span>OS Version:</span>
                        <span>{asset.os_version}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Last Seen:</span>
                      <span>{new Date(asset.last_seen).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Badge variant={getStatusColor(asset.security_status)} className="text-xs">
                        {asset.security_status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="safesuite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                SafeSuite Security Applications
              </CardTitle>
              <CardDescription>
                Access your subscribed security applications directly in the portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { key: 'safedoc', name: 'SafeDoc', icon: FileText, description: 'Document security scanning' },
                  { key: 'safelink', name: 'SafeLink', icon: Link, description: 'URL safety verification' },
                  { key: 'safemail', name: 'SafeMail', icon: Mail, description: 'Email security protection' },
                  { key: 'safenet', name: 'SafeNet', icon: Network, description: 'Network security monitoring' },
                  { key: 'safepass', name: 'SafePass', icon: Key, description: 'Password management' }
                ].map(app => {
                  const isEnabled = portalSettings.safesuite_apps[app.key as keyof typeof portalSettings.safesuite_apps];
                  const IconComponent = app.icon;
                  
                  return (
                    <Card key={app.key} className={`transition-all ${isEnabled ? 'border-primary/50 bg-primary/5' : 'opacity-60'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                            <IconComponent className={`h-5 w-5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{app.name}</h3>
                            <Badge variant={isEnabled ? 'default' : 'secondary'} className="text-xs">
                              {isEnabled ? 'Active' : 'Not Subscribed'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{app.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Embedded SafeSuite Apps */}
          <div className="space-y-6">
            {portalSettings.safesuite_apps.safedoc && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    SafeDoc Document Scanner
                  </CardTitle>
                  <CardDescription>
                    Scan documents for security threats and malware
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SafeDocApp 
                    isWhiteLabeled={true}
                    brandColor={portalSettings.primary_color}
                    brandName={portalSettings.company_name}
                  />
                </CardContent>
              </Card>
            )}

            {portalSettings.safesuite_apps.safelink && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    SafeLink URL Scanner
                  </CardTitle>
                  <CardDescription>
                    Verify URL safety and check for phishing attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SafeLinkApp 
                    isWhiteLabeled={true}
                    brandColor={portalSettings.primary_color}
                    brandName={portalSettings.company_name}
                  />
                </CardContent>
              </Card>
            )}

            {portalSettings.safesuite_apps.safemail && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    SafeMail Email Security
                  </CardTitle>
                  <CardDescription>
                    Advanced email threat detection and protection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SafeMailApp 
                    isWhiteLabeled={true}
                    brandColor={portalSettings.primary_color}
                    brandName={portalSettings.company_name}
                  />
                </CardContent>
              </Card>
            )}

            {portalSettings.safesuite_apps.safenet && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    SafeNet Network Security
                  </CardTitle>
                  <CardDescription>
                    Monitor network security and detect vulnerabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SafeNetApp 
                    isWhiteLabeled={true}
                    brandColor={portalSettings.primary_color}
                    brandName={portalSettings.company_name}
                  />
                </CardContent>
              </Card>
            )}

            {portalSettings.safesuite_apps.safepass && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    SafePass Password Manager
                  </CardTitle>
                  <CardDescription>
                    Secure password management and generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SafePassApp 
                    isWhiteLabeled={true}
                    brandColor={portalSettings.primary_color}
                    brandName={portalSettings.company_name}
                  />
                </CardContent>
              </Card>
            )}

            {/* No Apps Enabled Message */}
            {!Object.values(portalSettings.safesuite_apps).some(Boolean) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No SafeSuite Apps Enabled</h3>
                  <p className="text-muted-foreground mb-4">
                    Contact your MSP to enable SafeSuite security applications for your organization.
                  </p>
                  <Button variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{report.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Generated: {new Date(report.generated_at).toLocaleDateString()} • Period: {report.period}
                        </p>
                        {report.file_size > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Size: {formatFileSize(report.file_size)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {report.type}
                      </Badge>
                      {report.status === 'generated' && (
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {report.status === 'generating' && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Generating...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portal Configuration</CardTitle>
              <CardDescription>Customize the client portal appearance and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={portalSettings.company_name}
                      onChange={(e) => setPortalSettings(prev => ({ ...prev, company_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input
                      value={portalSettings.support_email}
                      onChange={(e) => setPortalSettings(prev => ({ ...prev, support_email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Phone</Label>
                    <Input
                      value={portalSettings.support_phone}
                      onChange={(e) => setPortalSettings(prev => ({ ...prev, support_phone: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Custom Domain</Label>
                    <Input
                      value={portalSettings.custom_domain}
                      onChange={(e) => setPortalSettings(prev => ({ ...prev, custom_domain: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={portalSettings.primary_color}
                        onChange={(e) => setPortalSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={portalSettings.primary_color}
                        onChange={(e) => setPortalSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Input
                      value={portalSettings.welcome_message}
                      onChange={(e) => setPortalSettings(prev => ({ ...prev, welcome_message: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Portal Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'enable_tickets', label: 'Ticket System' },
                    { key: 'enable_reports', label: 'Reports Access' },
                    { key: 'enable_assets', label: 'Asset Viewing' },
                    { key: 'enable_knowledge_base', label: 'Knowledge Base' }
                  ].map(feature => (
                    <div key={feature.key} className="flex items-center space-x-2">
                      <Switch
                        checked={portalSettings[feature.key as keyof typeof portalSettings] as boolean}
                        onCheckedChange={(checked) => 
                          setPortalSettings(prev => ({ ...prev, [feature.key]: checked }))
                        }
                      />
                      <Label>{feature.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  SafeSuite Security Apps
                </h4>
                <p className="text-sm text-muted-foreground">
                  Control which SafeSuite applications are available to clients in their portal
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'safedoc', label: 'SafeDoc', description: 'Document security scanning', icon: FileText },
                    { key: 'safelink', label: 'SafeLink', description: 'URL safety verification', icon: Link },
                    { key: 'safemail', label: 'SafeMail', description: 'Email security protection', icon: Mail },
                    { key: 'safenet', label: 'SafeNet', description: 'Network security monitoring', icon: Network },
                    { key: 'safepass', label: 'SafePass', description: 'Password management', icon: Key }
                  ].map(app => {
                    const IconComponent = app.icon;
                    return (
                      <Card key={app.key} className="p-4">
                        <div className="flex items-start space-x-3">
                          <Switch
                            checked={portalSettings.safesuite_apps[app.key as keyof typeof portalSettings.safesuite_apps]}
                            onCheckedChange={(checked) => 
                              setPortalSettings(prev => ({ 
                                ...prev, 
                                safesuite_apps: { 
                                  ...prev.safesuite_apps, 
                                  [app.key]: checked 
                                } 
                              }))
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <IconComponent className="h-4 w-4 text-primary" />
                              <Label className="font-medium">{app.label}</Label>
                            </div>
                            <p className="text-xs text-muted-foreground">{app.description}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning">MSP Management Note</p>
                      <p className="text-muted-foreground">
                        SafeNet is typically managed by MSPs directly. Consider disabling client access unless they need self-service network monitoring capabilities.
                      </p>
                    </div>
                  </div>
                 </div>
               </div>
               
               <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Support Queue Management
                </h4>
                <p className="text-sm text-muted-foreground">
                  Create and manage custom support queues with colors and routing
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Dialog open={showQueueManager} onOpenChange={setShowQueueManager}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Queue
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Support Queue</DialogTitle>
                          <DialogDescription>
                            Define a new queue for routing and organizing support tickets
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Queue Name</Label>
                            <Input
                              value={newQueue.name}
                              onChange={(e) => setNewQueue(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Level 2 Support"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={newQueue.description}
                              onChange={(e) => setNewQueue(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Brief description of this queue's purpose"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Queue Color</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={newQueue.color}
                                onChange={(e) => setNewQueue(prev => ({ ...prev, color: e.target.value }))}
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={newQueue.color}
                                onChange={(e) => setNewQueue(prev => ({ ...prev, color: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowQueueManager(false)}>Cancel</Button>
                          <Button onClick={addQueue}>Create Queue</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {portalSettings.support_queues.map(queue => (
                      <Card key={queue.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: queue.color }}
                            />
                            <div>
                              <p className="font-medium">{queue.name}</p>
                              <p className="text-xs text-muted-foreground">{queue.description}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQueue(queue.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Ticket Type Management
                </h4>
                <p className="text-sm text-muted-foreground">
                  Define custom ticket types and categories for better organization
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Dialog open={showTypeManager} onOpenChange={setShowTypeManager}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Type
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Ticket Type</DialogTitle>
                          <DialogDescription>
                            Define a new ticket type for categorizing support requests
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Type Name</Label>
                            <Input
                              value={newTicketType.name}
                              onChange={(e) => setNewTicketType(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Mobile Device, VPN Access"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={newTicketType.description}
                              onChange={(e) => setNewTicketType(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="What types of issues does this cover?"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type Color</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={newTicketType.color}
                                onChange={(e) => setNewTicketType(prev => ({ ...prev, color: e.target.value }))}
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={newTicketType.color}
                                onChange={(e) => setNewTicketType(prev => ({ ...prev, color: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowTypeManager(false)}>Cancel</Button>
                          <Button onClick={addTicketType}>Create Type</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {portalSettings.ticket_types.map(type => (
                      <Card key={type.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: type.color }}
                            />
                            <div>
                              <p className="font-medium">{type.name}</p>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTicketType(type.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Portal
                </Button>
                <Button>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MSPClientPortal;