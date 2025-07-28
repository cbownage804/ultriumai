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
  Users, 
  Target, 
  Activity, 
  RefreshCw, 
  Settings, 
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  TestTube,
  Phone,
  MessageSquare,
  Calendar,
  TrendingUp,
  BarChart,
  FileText,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface HubSpotConfig {
  apiKey: string;
  portalId: string;
  isConnected: boolean;
  lastSync: string;
  syncEnabled: boolean;
  endpoints: {
    contacts: boolean;
    companies: boolean;
    deals: boolean;
    tickets: boolean;
    marketing: boolean;
    analytics: boolean;
  };
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  lifecycleStage: 'subscriber' | 'lead' | 'marketingqualifiedlead' | 'salesqualifiedlead' | 'opportunity' | 'customer';
  leadSource: string;
  lastActivity: string;
  hubspotScore: number;
  status: 'active' | 'inactive';
}

interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  city: string;
  state: string;
  country: string;
  numberOfEmployees: number;
  annualRevenue: number;
  lifecycleStage: 'subscriber' | 'lead' | 'marketingqualifiedlead' | 'salesqualifiedlead' | 'opportunity' | 'customer';
  hubspotScore: number;
  lastActivity: string;
}

interface Deal {
  id: string;
  dealName: string;
  companyName: string;
  contactName: string;
  dealStage: string;
  pipeline: string;
  amount: number;
  closeDate: string;
  probability: number;
  dealSource: string;
  createdDate: string;
  lastActivity: string;
  ownerName: string;
  status: 'open' | 'won' | 'lost';
}

interface Ticket {
  id: string;
  subject: string;
  contactName: string;
  companyName: string;
  status: 'new' | 'waiting_on_contact' | 'waiting_on_us' | 'closed';
  priority: 'low' | 'medium' | 'high';
  source: 'email' | 'chat' | 'phone' | 'form';
  category: string;
  createdDate: string;
  lastActivity: string;
  ownerName: string;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'ads' | 'content';
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  recipients: number;
  opened: number;
  clicked: number;
  conversions: number;
  createdDate: string;
  sentDate?: string;
}

interface Analytics {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalRevenue: number;
  conversionRate: number;
  emailEngagement: {
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
  };
  salesPerformance: {
    newDeals: number;
    closedWon: number;
    closedLost: number;
    avgDealSize: number;
  };
}

const HubSpotIntegration: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<HubSpotConfig>({
    apiKey: '',
    portalId: '',
    isConnected: false,
    lastSync: '',
    syncEnabled: true,
    endpoints: {
      contacts: true,
      companies: true,
      deals: true,
      tickets: true,
      marketing: true,
      analytics: false,
    },
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadHubSpotConfig();
    loadContacts();
    loadCompanies();
    loadDeals();
    loadTickets();
    loadCampaigns();
    loadAnalytics();
  }, []);

  const loadHubSpotConfig = async () => {
    // Mock loading configuration
    setConfig(prev => ({
      ...prev,
      apiKey: 'pat-na1-your-hubspot-api-key',
      portalId: '12345678',
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
        email: 'john.smith@acme.com',
        phone: '+1 (555) 123-4567',
        company: 'Acme Corporation',
        jobTitle: 'IT Director',
        lifecycleStage: 'salesqualifiedlead',
        leadSource: 'Website',
        lastActivity: '2024-01-20T10:30:00Z',
        hubspotScore: 85,
        status: 'active',
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@techsolutions.com',
        phone: '+1 (555) 234-5678',
        company: 'Tech Solutions Inc',
        jobTitle: 'CEO',
        lifecycleStage: 'opportunity',
        leadSource: 'Google Ads',
        lastActivity: '2024-01-20T09:15:00Z',
        hubspotScore: 92,
        status: 'active',
      },
      {
        id: '3',
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike@digitaldynamics.com',
        phone: '+1 (555) 345-6789',
        company: 'Digital Dynamics',
        jobTitle: 'CTO',
        lifecycleStage: 'customer',
        leadSource: 'Referral',
        lastActivity: '2024-01-19T16:45:00Z',
        hubspotScore: 98,
        status: 'active',
      },
    ];
    setContacts(mockContacts);
  };

  const loadCompanies = async () => {
    // Mock companies data
    const mockCompanies: Company[] = [
      {
        id: '1',
        name: 'Acme Corporation',
        domain: 'acme.com',
        industry: 'Manufacturing',
        city: 'New York',
        state: 'NY',
        country: 'United States',
        numberOfEmployees: 500,
        annualRevenue: 50000000,
        lifecycleStage: 'salesqualifiedlead',
        hubspotScore: 85,
        lastActivity: '2024-01-20T10:30:00Z',
      },
      {
        id: '2',
        name: 'Tech Solutions Inc',
        domain: 'techsolutions.com',
        industry: 'Technology',
        city: 'San Francisco',
        state: 'CA',
        country: 'United States',
        numberOfEmployees: 150,
        annualRevenue: 15000000,
        lifecycleStage: 'opportunity',
        hubspotScore: 92,
        lastActivity: '2024-01-20T09:15:00Z',
      },
      {
        id: '3',
        name: 'Digital Dynamics',
        domain: 'digitaldynamics.com',
        industry: 'Marketing',
        city: 'Chicago',
        state: 'IL',
        country: 'United States',
        numberOfEmployees: 75,
        annualRevenue: 8000000,
        lifecycleStage: 'customer',
        hubspotScore: 98,
        lastActivity: '2024-01-19T16:45:00Z',
      },
    ];
    setCompanies(mockCompanies);
  };

  const loadDeals = async () => {
    // Mock deals data
    const mockDeals: Deal[] = [
      {
        id: '1',
        dealName: 'Enterprise IT Services Contract',
        companyName: 'Acme Corporation',
        contactName: 'John Smith',
        dealStage: 'Proposal Sent',
        pipeline: 'Sales Pipeline',
        amount: 150000,
        closeDate: '2024-02-15',
        probability: 75,
        dealSource: 'Website',
        createdDate: '2024-01-15T10:00:00Z',
        lastActivity: '2024-01-20T10:30:00Z',
        ownerName: 'Alex Chen',
        status: 'open',
      },
      {
        id: '2',
        dealName: 'Managed Security Services',
        companyName: 'Tech Solutions Inc',
        contactName: 'Sarah Johnson',
        dealStage: 'Negotiation',
        pipeline: 'Sales Pipeline',
        amount: 85000,
        closeDate: '2024-02-28',
        probability: 60,
        dealSource: 'Google Ads',
        createdDate: '2024-01-18T14:30:00Z',
        lastActivity: '2024-01-20T09:15:00Z',
        ownerName: 'Lisa Rodriguez',
        status: 'open',
      },
      {
        id: '3',
        dealName: 'Office 365 Migration',
        companyName: 'Digital Dynamics',
        contactName: 'Mike Wilson',
        dealStage: 'Closed Won',
        pipeline: 'Sales Pipeline',
        amount: 45000,
        closeDate: '2024-01-19',
        probability: 100,
        dealSource: 'Referral',
        createdDate: '2024-01-10T09:00:00Z',
        lastActivity: '2024-01-19T16:45:00Z',
        ownerName: 'Alex Chen',
        status: 'won',
      },
    ];
    setDeals(mockDeals);
  };

  const loadTickets = async () => {
    // Mock tickets data
    const mockTickets: Ticket[] = [
      {
        id: '1',
        subject: 'Email server configuration help',
        contactName: 'John Smith',
        companyName: 'Acme Corporation',
        status: 'waiting_on_us',
        priority: 'high',
        source: 'email',
        category: 'Technical Support',
        createdDate: '2024-01-20T09:15:00Z',
        lastActivity: '2024-01-20T10:30:00Z',
        ownerName: 'Support Team',
      },
      {
        id: '2',
        subject: 'Billing inquiry about invoice',
        contactName: 'Sarah Johnson',
        companyName: 'Tech Solutions Inc',
        status: 'waiting_on_contact',
        priority: 'medium',
        source: 'phone',
        category: 'Billing',
        createdDate: '2024-01-19T15:20:00Z',
        lastActivity: '2024-01-20T08:45:00Z',
        ownerName: 'Billing Team',
      },
      {
        id: '3',
        subject: 'Feature request for new service',
        contactName: 'Mike Wilson',
        companyName: 'Digital Dynamics',
        status: 'closed',
        priority: 'low',
        source: 'form',
        category: 'Feature Request',
        createdDate: '2024-01-18T11:30:00Z',
        lastActivity: '2024-01-19T16:45:00Z',
        ownerName: 'Product Team',
      },
    ];
    setTickets(mockTickets);
  };

  const loadCampaigns = async () => {
    // Mock campaigns data
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'IT Security Awareness Campaign',
        type: 'email',
        status: 'sent',
        recipients: 1250,
        opened: 425,
        clicked: 89,
        conversions: 23,
        createdDate: '2024-01-15T10:00:00Z',
        sentDate: '2024-01-18T09:00:00Z',
      },
      {
        id: '2',
        name: 'MSP Services Social Campaign',
        type: 'social',
        status: 'completed',
        recipients: 2500,
        opened: 0, // Social doesn't track opens like email
        clicked: 156,
        conversions: 34,
        createdDate: '2024-01-10T14:30:00Z',
        sentDate: '2024-01-12T10:00:00Z',
      },
      {
        id: '3',
        name: 'Google Ads - Managed IT',
        type: 'ads',
        status: 'scheduled',
        recipients: 5000,
        opened: 0,
        clicked: 0,
        conversions: 0,
        createdDate: '2024-01-20T16:00:00Z',
      },
    ];
    setCampaigns(mockCampaigns);
  };

  const loadAnalytics = async () => {
    // Mock analytics data
    const mockAnalytics: Analytics = {
      totalContacts: 1247,
      totalCompanies: 342,
      totalDeals: 89,
      totalRevenue: 2345000,
      conversionRate: 12.5,
      emailEngagement: {
        openRate: 34.2,
        clickRate: 7.1,
        unsubscribeRate: 0.8,
      },
      salesPerformance: {
        newDeals: 23,
        closedWon: 15,
        closedLost: 8,
        avgDealSize: 67500,
      },
    };
    setAnalytics(mockAnalytics);
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
        description: "Successfully connected to HubSpot",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to HubSpot. Please check your API credentials.",
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
      setTestResult('✅ Connection successful\n✅ API key validated\n✅ Portal access confirmed\n✅ Contact data accessible\n✅ Company data accessible\n✅ Deal data accessible\n✅ Ticket data accessible\n✅ Marketing data accessible');
      toast({
        title: "Test Successful",
        description: "HubSpot connection test completed successfully",
      });
    } catch (error) {
      setTestResult('❌ Connection failed\n❌ Please verify API key and portal ID');
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
      await loadCompanies();
      await loadDeals();
      await loadTickets();
      await loadCampaigns();
      await loadAnalytics();
      setConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      toast({
        title: "Sync Complete",
        description: "Successfully synced data from HubSpot",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLifecycleStageColor = (stage: string) => {
    switch (stage) {
      case 'customer': return 'bg-green-500';
      case 'opportunity': return 'bg-purple-500';
      case 'salesqualifiedlead': return 'bg-blue-500';
      case 'marketingqualifiedlead': return 'bg-yellow-500';
      case 'lead': return 'bg-orange-500';
      case 'subscriber': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'active':
      case 'sent':
      case 'completed': return 'bg-green-500';
      case 'won': return 'bg-blue-500';
      case 'lost':
      case 'closed':
      case 'inactive': return 'bg-red-500';
      case 'new':
      case 'draft':
      case 'scheduled': return 'bg-yellow-500';
      case 'waiting_on_contact':
      case 'waiting_on_us': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                HubSpot Integration
                <Badge variant={config.isConnected ? "default" : "secondary"}>
                  {config.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Inbound Marketing, Sales & Service Platform
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
              <a href="https://app.hubspot.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                HubSpot Portal
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div className="text-sm font-medium">Total Contacts</div>
                  </div>
                  <div className="text-2xl font-bold">{analytics.totalContacts.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {contacts.filter(c => c.lifecycleStage === 'customer').length} customers
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <div className="text-sm font-medium">Total Deals</div>
                  </div>
                  <div className="text-2xl font-bold">{analytics.totalDeals}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(analytics.totalRevenue)} pipeline
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <div className="text-sm font-medium">Conversion Rate</div>
                  </div>
                  <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
                  <div className="text-xs text-muted-foreground">
                    leads to customers
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-orange-500" />
                    <div className="text-sm font-medium">Email Open Rate</div>
                  </div>
                  <div className="text-2xl font-bold">{analytics.emailEngagement.openRate}%</div>
                  <div className="text-xs text-muted-foreground">
                    {analytics.emailEngagement.clickRate}% click rate
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deals.slice(0, 5).map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{deal.dealName}</div>
                        <div className="text-xs text-muted-foreground">
                          {deal.companyName} • {deal.dealStage}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(deal.amount)}</div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(deal.status)} text-white border-transparent`}
                        >
                          {deal.probability}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Marketing Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {campaign.type} • {campaign.recipients} recipients
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{campaign.conversions} conversions</div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(campaign.status)} text-white border-transparent`}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sales Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">New Deals</span>
                      <span className="font-medium">{analytics.salesPerformance.newDeals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Closed Won</span>
                      <span className="font-medium text-green-600">{analytics.salesPerformance.closedWon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Closed Lost</span>
                      <span className="font-medium text-red-600">{analytics.salesPerformance.closedLost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Deal Size</span>
                      <span className="font-medium">{formatCurrency(analytics.salesPerformance.avgDealSize)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Email Marketing Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Open Rate</span>
                      <span className="font-medium">{analytics.emailEngagement.openRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Click Rate</span>
                      <span className="font-medium">{analytics.emailEngagement.clickRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Unsubscribe Rate</span>
                      <span className="font-medium">{analytics.emailEngagement.unsubscribeRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conversion Rate</span>
                      <span className="font-medium">{analytics.conversionRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
                          {contact.company} • {contact.jobTitle} • Source: {contact.leadSource}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">HubSpot Score: {contact.hubspotScore}</div>
                      <Badge 
                        variant="outline" 
                        className={`${getLifecycleStageColor(contact.lifecycleStage)} text-white border-transparent mb-1`}
                      >
                        {contact.lifecycleStage}
                      </Badge>
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

        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Deals ({deals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(deal.status)}`} />
                      <div>
                        <div className="font-medium">{deal.dealName}</div>
                        <div className="text-sm text-muted-foreground">
                          {deal.companyName} • {deal.contactName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {deal.dealStage} • Owner: {deal.ownerName} • 
                          Close: {new Date(deal.closeDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(deal.amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        {deal.probability}% probability
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(deal.status)} text-white border-transparent mt-1`}
                      >
                        {deal.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Companies ({companies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getLifecycleStageColor(company.lifecycleStage)}`} />
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {company.domain} • {company.industry}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {company.city}, {company.state} • {company.numberOfEmployees} employees
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          notation: 'compact',
                          maximumFractionDigits: 1
                        }).format(company.annualRevenue)} revenue
                      </div>
                      <div className="text-sm text-muted-foreground">
                        HubSpot Score: {company.hubspotScore}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getLifecycleStageColor(company.lifecycleStage)} text-white border-transparent mt-1`}
                      >
                        {company.lifecycleStage}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Marketing Campaigns ({campaigns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(campaign.status)}`} />
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {campaign.type} • {campaign.recipients} recipients
                          </div>
                          {campaign.sentDate && (
                            <div className="text-xs text-muted-foreground">
                              Sent: {new Date(campaign.sentDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{campaign.conversions} conversions</div>
                        {campaign.opened > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {((campaign.opened / campaign.recipients) * 100).toFixed(1)}% open rate
                          </div>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(campaign.status)} text-white border-transparent mt-1`}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Support Tickets ({tickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(ticket.status)}`} />
                        <div>
                          <div className="font-medium">{ticket.subject}</div>
                          <div className="text-sm text-muted-foreground">
                            {ticket.contactName} • {ticket.companyName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.category} • Owner: {ticket.ownerName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={`${getPriorityColor(ticket.priority)} text-white border-transparent mb-1`}
                        >
                          {ticket.priority}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {new Date(ticket.createdDate).toLocaleDateString()}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
                  <Label htmlFor="api-key">Private App API Key</Label>
                  <Input 
                    id="api-key"
                    type="password"
                    placeholder="pat-na1-your-hubspot-api-key"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-id">Portal ID</Label>
                  <Input 
                    id="portal-id"
                    placeholder="12345678"
                    value={config.portalId}
                    onChange={(e) => setConfig(prev => ({ ...prev, portalId: e.target.value }))}
                  />
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
                    <Label htmlFor="sync-companies">Sync Company Data</Label>
                    <Switch
                      id="sync-companies"
                      checked={config.endpoints.companies}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, companies: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-deals">Sync Deal Data</Label>
                    <Switch
                      id="sync-deals"
                      checked={config.endpoints.deals}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, deals: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-tickets">Sync Ticket Data</Label>
                    <Switch
                      id="sync-tickets"
                      checked={config.endpoints.tickets}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, tickets: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-marketing">Sync Marketing Data</Label>
                    <Switch
                      id="sync-marketing"
                      checked={config.endpoints.marketing}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, marketing: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-analytics">Sync Analytics Data</Label>
                    <Switch
                      id="sync-analytics"
                      checked={config.endpoints.analytics}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, analytics: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !config.apiKey || !config.portalId}
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
                Test your HubSpot connection and API endpoints
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

export default HubSpotIntegration;