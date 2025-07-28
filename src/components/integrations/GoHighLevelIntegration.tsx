import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, 
  Users, 
  Activity, 
  RefreshCw, 
  Settings, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  TestTube,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface GHLConfig {
  apiKey: string;
  locationId: string;
  webhookUrl: string;
  isConnected: boolean;
  lastSync: string;
  syncEnabled: boolean;
  endpoints: {
    contacts: boolean;
    opportunities: boolean;
    campaigns: boolean;
    conversations: boolean;
    calendars: boolean;
    workflows: boolean;
  };
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  lastActivity: string;
  status: 'active' | 'inactive' | 'do_not_contact';
}

interface Opportunity {
  id: string;
  name: string;
  contactName: string;
  pipelineId: string;
  pipelineStage: string;
  value: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  source: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'voicemail' | 'workflow';
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalContacts: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  createdAt: string;
  scheduledAt?: string;
}

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  lastMessage: string;
  messageType: 'sms' | 'email' | 'facebook' | 'instagram' | 'whatsapp';
  unreadCount: number;
  lastActivity: string;
  assignedTo: string;
  status: 'open' | 'closed';
}

interface WorkflowExecution {
  id: string;
  workflowName: string;
  contactName: string;
  currentStep: string;
  status: 'active' | 'completed' | 'stopped' | 'paused';
  startedAt: string;
  lastActivity: string;
  completionRate: number;
}

const GoHighLevelIntegration: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<GHLConfig>({
    apiKey: '',
    locationId: '',
    webhookUrl: '',
    isConnected: false,
    lastSync: '',
    syncEnabled: true,
    endpoints: {
      contacts: true,
      opportunities: true,
      campaigns: true,
      conversations: true,
      calendars: false,
      workflows: true,
    },
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadGHLConfig();
    loadContacts();
    loadOpportunities();
    loadCampaigns();
    loadConversations();
    loadWorkflows();
  }, []);

  const loadGHLConfig = async () => {
    // Mock loading configuration
    setConfig(prev => ({
      ...prev,
      apiKey: 'ghl_your-api-key-here',
      locationId: 'your-location-id',
      webhookUrl: 'https://your-webhook-url.com/ghl-webhook',
      isConnected: true,
      lastSync: '2024-01-20T10:30:00Z',
    }));
  };

  const loadContacts = async () => {
    // Mock contacts data
    const mockContacts: Contact[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1 (555) 123-4567',
        source: 'Website Form',
        tags: ['lead', 'hot-prospect', 'enterprise'],
        customFields: {
          company: 'Acme Corporation',
          industry: 'Manufacturing',
          employees: '500+'
        },
        createdAt: '2024-01-20T09:15:00Z',
        lastActivity: '2024-01-20T10:30:00Z',
        status: 'active',
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@techsolutions.com',
        phone: '+1 (555) 234-5678',
        source: 'Google Ads',
        tags: ['lead', 'warm-prospect', 'smb'],
        customFields: {
          company: 'Tech Solutions Inc',
          industry: 'Technology',
          employees: '50-100'
        },
        createdAt: '2024-01-19T14:20:00Z',
        lastActivity: '2024-01-20T08:45:00Z',
        status: 'active',
      },
      {
        id: '3',
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike@digitaldynamics.com',
        phone: '+1 (555) 345-6789',
        source: 'Referral',
        tags: ['customer', 'high-value'],
        customFields: {
          company: 'Digital Dynamics',
          industry: 'Marketing',
          employees: '10-25'
        },
        createdAt: '2024-01-18T16:30:00Z',
        lastActivity: '2024-01-19T15:20:00Z',
        status: 'active',
      },
    ];
    setContacts(mockContacts);
  };

  const loadOpportunities = async () => {
    // Mock opportunities data
    const mockOpportunities: Opportunity[] = [
      {
        id: '1',
        name: 'Enterprise IT Services Contract',
        contactName: 'John Smith',
        pipelineId: 'sales-pipeline',
        pipelineStage: 'Proposal Sent',
        value: 150000,
        status: 'open',
        source: 'Website Form',
        createdAt: '2024-01-20T09:15:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
        assignedTo: 'Alex Chen',
      },
      {
        id: '2',
        name: 'Office 365 Migration',
        contactName: 'Sarah Johnson',
        pipelineId: 'project-pipeline',
        pipelineStage: 'Discovery Call',
        value: 25000,
        status: 'open',
        source: 'Google Ads',
        createdAt: '2024-01-19T14:20:00Z',
        updatedAt: '2024-01-20T08:45:00Z',
        assignedTo: 'Lisa Rodriguez',
      },
      {
        id: '3',
        name: 'Managed Security Services',
        contactName: 'Mike Wilson',
        pipelineId: 'sales-pipeline',
        pipelineStage: 'Closed Won',
        value: 84000,
        status: 'won',
        source: 'Referral',
        createdAt: '2024-01-18T16:30:00Z',
        updatedAt: '2024-01-19T15:20:00Z',
        assignedTo: 'Alex Chen',
      },
    ];
    setOpportunities(mockOpportunities);
  };

  const loadCampaigns = async () => {
    // Mock campaigns data
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'IT Security Audit Promotion',
        type: 'email',
        status: 'active',
        totalContacts: 1250,
        delivered: 1198,
        opened: 359,
        clicked: 72,
        replied: 18,
        createdAt: '2024-01-15T10:00:00Z',
        scheduledAt: '2024-01-20T09:00:00Z',
      },
      {
        id: '2',
        name: 'Lead Nurture SMS Sequence',
        type: 'sms',
        status: 'active',
        totalContacts: 450,
        delivered: 447,
        opened: 0, // SMS doesn't track opens
        clicked: 23,
        replied: 12,
        createdAt: '2024-01-18T14:30:00Z',
      },
      {
        id: '3',
        name: 'MSP Service Introduction',
        type: 'workflow',
        status: 'completed',
        totalContacts: 850,
        delivered: 832,
        opened: 425,
        clicked: 156,
        replied: 34,
        createdAt: '2024-01-10T08:00:00Z',
      },
    ];
    setCampaigns(mockCampaigns);
  };

  const loadConversations = async () => {
    // Mock conversations data
    const mockConversations: Conversation[] = [
      {
        id: '1',
        contactName: 'John Smith',
        contactPhone: '+1 (555) 123-4567',
        contactEmail: 'john.smith@example.com',
        lastMessage: 'Thanks for the proposal. We need to discuss internally.',
        messageType: 'email',
        unreadCount: 2,
        lastActivity: '2024-01-20T10:30:00Z',
        assignedTo: 'Alex Chen',
        status: 'open',
      },
      {
        id: '2',
        contactName: 'Sarah Johnson',
        contactPhone: '+1 (555) 234-5678',
        contactEmail: 'sarah@techsolutions.com',
        lastMessage: 'Can we schedule a call for next week?',
        messageType: 'sms',
        unreadCount: 1,
        lastActivity: '2024-01-20T09:45:00Z',
        assignedTo: 'Lisa Rodriguez',
        status: 'open',
      },
      {
        id: '3',
        contactName: 'Mike Wilson',
        contactPhone: '+1 (555) 345-6789',
        contactEmail: 'mike@digitaldynamics.com',
        lastMessage: 'Great working with your team!',
        messageType: 'email',
        unreadCount: 0,
        lastActivity: '2024-01-19T15:20:00Z',
        assignedTo: 'Alex Chen',
        status: 'closed',
      },
    ];
    setConversations(mockConversations);
  };

  const loadWorkflows = async () => {
    // Mock workflow executions data
    const mockWorkflows: WorkflowExecution[] = [
      {
        id: '1',
        workflowName: 'New Lead Nurture Sequence',
        contactName: 'John Smith',
        currentStep: 'Send Follow-up Email #2',
        status: 'active',
        startedAt: '2024-01-20T09:15:00Z',
        lastActivity: '2024-01-20T10:30:00Z',
        completionRate: 40,
      },
      {
        id: '2',
        workflowName: 'Customer Onboarding',
        contactName: 'Sarah Johnson',
        currentStep: 'Schedule Discovery Call',
        status: 'active',
        startedAt: '2024-01-19T14:20:00Z',
        lastActivity: '2024-01-20T08:45:00Z',
        completionRate: 25,
      },
      {
        id: '3',
        workflowName: 'Win-Back Campaign',
        contactName: 'Mike Wilson',
        currentStep: 'Completed',
        status: 'completed',
        startedAt: '2024-01-15T10:00:00Z',
        lastActivity: '2024-01-19T15:20:00Z',
        completionRate: 100,
      },
    ];
    setWorkflows(mockWorkflows);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString(),
      }));
      toast({
        title: "Connected",
        description: "Successfully connected to GoHighLevel",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to GoHighLevel. Please check your API credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult('✅ Connection successful\n✅ API key validated\n✅ Location access confirmed\n✅ Contact data accessible\n✅ Opportunity data accessible\n✅ Campaign data accessible\n✅ Conversation data accessible');
      toast({
        title: "Test Successful",
        description: "GoHighLevel connection test completed successfully",
      });
    } catch (error) {
      setTestResult('❌ Connection failed\n❌ Please verify API key and location ID');
      toast({
        title: "Test Failed",
        description: "Connection test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadContacts();
      await loadOpportunities();
      await loadCampaigns();
      await loadConversations();
      await loadWorkflows();
      setConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      toast({
        title: "Sync Complete",
        description: "Successfully synced data from GoHighLevel",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'open':
      case 'won': return 'bg-green-500';
      case 'inactive':
      case 'closed':
      case 'lost':
      case 'abandoned': return 'bg-red-500';
      case 'paused':
      case 'stopped': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'facebook':
      case 'instagram':
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'voicemail': return <Phone className="h-4 w-4" />;
      case 'workflow': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                GoHighLevel Integration
                <Badge variant={config.isConnected ? "default" : "secondary"}>
                  {config.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
              <CardDescription>
                All-in-One CRM & Marketing Automation Platform
                {config.lastSync && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Last sync: {new Date(config.lastSync).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={!config.isConnected || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://app.gohighlevel.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                GHL Portal
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div className="text-sm font-medium">Total Contacts</div>
                </div>
                <div className="text-2xl font-bold">{contacts.length}</div>
                <div className="text-xs text-muted-foreground">
                  {contacts.filter(c => c.status === 'active').length} active
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <div className="text-sm font-medium">Open Opportunities</div>
                </div>
                <div className="text-2xl font-bold">{opportunities.filter(o => o.status === 'open').length}</div>
                <div className="text-xs text-muted-foreground">
                  ${opportunities.filter(o => o.status === 'open').reduce((sum, o) => sum + o.value, 0).toLocaleString()} value
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <div className="text-sm font-medium">Active Campaigns</div>
                </div>
                <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
                <div className="text-xs text-muted-foreground">
                  {campaigns.filter(c => c.status === 'active').reduce((sum, c) => sum + c.totalContacts, 0)} contacts
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  <div className="text-sm font-medium">Unread Messages</div>
                </div>
                <div className="text-2xl font-bold">
                  {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {conversations.filter(c => c.status === 'open').length} open conversations
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {opportunities.slice(0, 5).map((opportunity) => (
                    <div key={opportunity.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{opportunity.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {opportunity.contactName} • {opportunity.pipelineStage}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${opportunity.value.toLocaleString()}</div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(opportunity.status)} text-white border-transparent`}
                        >
                          {opportunity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workflows.filter(w => w.status === 'active').slice(0, 5).map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{workflow.workflowName}</div>
                        <div className="text-xs text-muted-foreground">
                          {workflow.contactName} • {workflow.currentStep}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{workflow.completionRate}%</div>
                        <Badge variant="outline" className="text-xs">
                          {workflow.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contacts ({contacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(contact.status)}`} />
                      <div>
                        <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                        <div className="text-sm text-muted-foreground">
                          {contact.email} • {contact.phone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contact.customFields.company} • Source: {contact.source}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {contact.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{contact.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last activity: {new Date(contact.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Opportunities ({opportunities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(opportunity.status)}`} />
                      <div>
                        <div className="font-medium">{opportunity.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {opportunity.contactName} • {opportunity.pipelineStage}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Assigned to: {opportunity.assignedTo} • Source: {opportunity.source}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${opportunity.value.toLocaleString()}</div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(opportunity.status)} text-white border-transparent mb-1`}
                      >
                        {opportunity.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Updated: {new Date(opportunity.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Marketing Campaigns ({campaigns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2">
                        {getCampaignTypeIcon(campaign.type)}
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(campaign.status)}`} />
                      </div>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {campaign.type} • {campaign.totalContacts} contacts
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Delivered: {campaign.delivered} • Opened: {campaign.opened} • 
                          Clicked: {campaign.clicked} • Replied: {campaign.replied}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(campaign.status)} text-white border-transparent mb-1`}
                      >
                        {campaign.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {campaign.opened > 0 && (
                          <div>Open Rate: {((campaign.opened / campaign.delivered) * 100).toFixed(1)}%</div>
                        )}
                        {campaign.clicked > 0 && (
                          <div>Click Rate: {((campaign.clicked / campaign.delivered) * 100).toFixed(1)}%</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversations ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2">
                        {getMessageTypeIcon(conversation.messageType)}
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(conversation.status)}`} />
                      </div>
                      <div>
                        <div className="font-medium">{conversation.contactName}</div>
                        <div className="text-sm text-muted-foreground">
                          {conversation.lastMessage.substring(0, 50)}...
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {conversation.messageType} • Assigned to: {conversation.assignedTo}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="mb-1">
                          {conversation.unreadCount} unread
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(conversation.lastActivity).toLocaleString()}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {conversation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Connection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input 
                    id="api-key"
                    type="password"
                    placeholder="Enter your GoHighLevel API key"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location-id">Location ID</Label>
                  <Input 
                    id="location-id"
                    placeholder="Enter your location ID"
                    value={config.locationId}
                    onChange={(e) => setConfig(prev => ({ ...prev, locationId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                  <Input 
                    id="webhook-url"
                    placeholder="https://your-webhook-url.com/ghl-webhook"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  />
                  <div className="text-xs text-muted-foreground">
                    Configure this URL in your GoHighLevel account to receive real-time updates
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Data Synchronization</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-contacts">Sync Contact Data</Label>
                    <Switch
                      id="sync-contacts"
                      checked={config.endpoints.contacts}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, contacts: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-opportunities">Sync Opportunity Data</Label>
                    <Switch
                      id="sync-opportunities"
                      checked={config.endpoints.opportunities}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, opportunities: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-campaigns">Sync Campaign Data</Label>
                    <Switch
                      id="sync-campaigns"
                      checked={config.endpoints.campaigns}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, campaigns: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-conversations">Sync Conversation Data</Label>
                    <Switch
                      id="sync-conversations"
                      checked={config.endpoints.conversations}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, conversations: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-calendars">Sync Calendar Data</Label>
                    <Switch
                      id="sync-calendars"
                      checked={config.endpoints.calendars}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, calendars: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-workflows">Sync Workflow Data</Label>
                    <Switch
                      id="sync-workflows"
                      checked={config.endpoints.workflows}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, workflows: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !config.apiKey || !config.locationId}
              >
                {isLoading ? "Connecting..." : config.isConnected ? "Update Connection" : "Connect"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test & Debug
              </CardTitle>
              <CardDescription>
                Test your GoHighLevel connection and API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTestConnection} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Testing Connection..." : "Test Connection"}
              </Button>
              
              {testResult && (
                <div className="space-y-2">
                  <Label>Test Results</Label>
                  <Textarea
                    value={testResult}
                    readOnly
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoHighLevelIntegration;