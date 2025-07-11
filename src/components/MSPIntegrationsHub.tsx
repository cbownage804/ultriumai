import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Zap, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Cloud,
  Database,
  Shield,
  Mail,
  Calendar,
  Users,
  FileText,
  Monitor,
  Activity,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  Link,
  Globe,
  Server,
  Key,
  Webhook
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  category: 'psa' | 'rmm' | 'security' | 'backup' | 'communication' | 'productivity' | 'accounting';
  description: string;
  vendor: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  last_sync: string;
  sync_frequency: string;
  api_calls_today: number;
  api_limit: number;
  clients_using: number;
  features: string[];
  webhook_url?: string;
  api_key?: string;
  settings: Record<string, any>;
}

interface AvailableIntegration {
  id: string;
  name: string;
  category: string;
  description: string;
  vendor: string;
  features: string[];
  setup_difficulty: 'easy' | 'medium' | 'advanced';
  pricing: string;
  documentation_url: string;
  is_popular: boolean;
}

const categoryIcons = {
  psa: FileText,
  rmm: Monitor,
  security: Shield,
  backup: Database,
  communication: Mail,
  productivity: Users,
  accounting: Activity
};

const statusColors = {
  connected: 'bg-green-100 text-green-800',
  disconnected: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  syncing: 'bg-blue-100 text-blue-800'
};

export const MSPIntegrationsHub = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<AvailableIntegration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Mock current integrations
    setIntegrations([
      {
        id: '1',
        name: 'Microsoft 365',
        category: 'productivity',
        description: 'Complete office suite and collaboration platform',
        vendor: 'Microsoft',
        status: 'connected',
        last_sync: new Date().toISOString(),
        sync_frequency: 'Real-time',
        api_calls_today: 1247,
        api_limit: 10000,
        clients_using: 8,
        features: ['Email Management', 'User Provisioning', 'License Tracking', 'Security Reports'],
        webhook_url: 'https://webhook.example.com/ms365',
        settings: {
          tenant_id: 'abc123-def456',
          auto_provision: true,
          sync_groups: true,
          backup_emails: false
        }
      },
      {
        id: '2',
        name: 'ConnectWise Manage',
        category: 'psa',
        description: 'Professional Services Automation platform',
        vendor: 'ConnectWise',
        status: 'connected',
        last_sync: new Date(Date.now() - 300000).toISOString(),
        sync_frequency: 'Every 5 minutes',
        api_calls_today: 856,
        api_limit: 5000,
        clients_using: 12,
        features: ['Ticket Sync', 'Time Tracking', 'Project Management', 'Billing Integration'],
        api_key: 'cw_***********',
        settings: {
          server_url: 'https://api.connectwisedev.com',
          sync_tickets: true,
          sync_contacts: true,
          sync_companies: true
        }
      },
      {
        id: '3',
        name: 'Datto Backup',
        category: 'backup',
        description: 'Business continuity and disaster recovery',
        vendor: 'Datto',
        status: 'error',
        last_sync: new Date(Date.now() - 3600000).toISOString(),
        sync_frequency: 'Hourly',
        api_calls_today: 23,
        api_limit: 1000,
        clients_using: 5,
        features: ['Backup Monitoring', 'Recovery Testing', 'Alert Management', 'Reporting'],
        settings: {
          partner_portal_url: 'https://portal.datto.com',
          alert_webhooks: true,
          auto_testing: false
        }
      }
    ]);

    // Mock available integrations
    setAvailableIntegrations([
      {
        id: 'azure-ad',
        name: 'Azure Active Directory',
        category: 'security',
        description: 'Identity and access management platform',
        vendor: 'Microsoft',
        features: ['Single Sign-On', 'Multi-Factor Authentication', 'Conditional Access', 'Identity Protection'],
        setup_difficulty: 'medium',
        pricing: 'Included with M365',
        documentation_url: 'https://docs.microsoft.com/azure-ad',
        is_popular: true
      },
      {
        id: 'splunk',
        name: 'Splunk Enterprise',
        category: 'security',
        description: 'Security information and event management',
        vendor: 'Splunk',
        features: ['Log Analysis', 'Threat Detection', 'Compliance Reporting', 'Real-time Monitoring'],
        setup_difficulty: 'advanced',
        pricing: 'Custom pricing',
        documentation_url: 'https://docs.splunk.com',
        is_popular: true
      },
      {
        id: 'autotask',
        name: 'Autotask PSA',
        category: 'psa',
        description: 'Alternative PSA platform',
        vendor: 'Datto',
        features: ['Service Desk', 'Project Management', 'CRM', 'Billing'],
        setup_difficulty: 'medium',
        pricing: 'Per technician/month',
        documentation_url: 'https://help.autotask.com',
        is_popular: false
      }
    ]);
  }, []);

  const handleConnect = (integrationId: string) => {
    toast({
      title: "Integration Setup",
      description: "Opening integration setup wizard...",
    });
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, status: 'disconnected' as const }
        : integration
    ));
    toast({
      title: "Integration Disconnected",
      description: "The integration has been safely disconnected.",
    });
  };

  const handleTestConnection = (integrationId: string) => {
    toast({
      title: "Testing Connection",
      description: "Connection test initiated...",
    });
  };

  const handleSyncNow = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, status: 'syncing' as const, last_sync: new Date().toISOString() }
        : integration
    ));
    
    setTimeout(() => {
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'connected' as const }
          : integration
      ));
      toast({
        title: "Sync Complete",
        description: "Data synchronization completed successfully.",
      });
    }, 3000);
  };

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category as keyof typeof categoryIcons] || Zap;
    return <Icon className="h-4 w-4" />;
  };

  const filteredAvailable = availableIntegrations.filter(integration => 
    selectedCategory === 'all' || integration.category === selectedCategory
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Integrations Hub
          </h1>
          <p className="text-muted-foreground">
            Connect and manage all your business tools and platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Webhooks
          </Button>
          <Button variant="hero">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {integrations.filter(i => i.status === 'connected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {integrations.length} total configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {integrations.reduce((sum, i) => sum + i.api_calls_today, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {integrations.reduce((sum, i) => sum + i.api_limit, 0).toLocaleString()} daily limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Connected</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {Math.max(...integrations.map(i => i.clients_using), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all integrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {Math.round((integrations.filter(i => i.status === 'connected').length / integrations.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Systems operational</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Integrations</TabsTrigger>
          <TabsTrigger value="available">Available Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks & APIs</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getCategoryIcon(integration.category)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          <Badge className={statusColors[integration.status]}>
                            {integration.status}
                          </Badge>
                          <Badge variant="outline">{integration.category.toUpperCase()}</Badge>
                        </div>
                        <CardDescription>{integration.description}</CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>By {integration.vendor}</span>
                          <span>•</span>
                          <span>{integration.clients_using} clients using</span>
                          <span>•</span>
                          <span>Last sync: {new Date(integration.last_sync).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleTestConnection(integration.id)}>
                        <Activity className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSyncNow(integration.id)}>
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* API Usage */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">API Calls:</span> {integration.api_calls_today}/{integration.api_limit}
                      </div>
                      <div>
                        <span className="font-medium">Sync Frequency:</span> {integration.sync_frequency}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-1 ${integration.status === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                          {integration.status === 'connected' ? 'Healthy' : 'Issues detected'}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <p className="text-sm font-medium mb-2">Enabled Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      {integration.status === 'error' && (
                        <Button size="sm" variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Troubleshoot
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Label htmlFor="category-filter">Filter by category:</Label>
            <select 
              id="category-filter"
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded px-3 py-1"
            >
              <option value="all">All Categories</option>
              <option value="psa">PSA Platforms</option>
              <option value="rmm">RMM Tools</option>
              <option value="security">Security</option>
              <option value="backup">Backup & Recovery</option>
              <option value="productivity">Productivity</option>
              <option value="accounting">Accounting</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAvailable.map((integration) => (
              <Card key={integration.id} className={integration.is_popular ? 'border-primary/50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        {integration.is_popular && (
                          <Badge variant="default" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {integration.setup_difficulty}
                        </Badge>
                      </div>
                      <CardDescription>{integration.description}</CardDescription>
                      <p className="text-sm text-muted-foreground">
                        By {integration.vendor} • {integration.pricing}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {integration.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{integration.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleConnect(integration.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={integration.documentation_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-3 w-3 mr-1" />
                          Docs
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Webhook Management</h3>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          <Alert>
            <Webhook className="h-4 w-4" />
            <AlertDescription>
              Webhooks enable real-time data synchronization between your integrations and the MSP platform. 
              Configure endpoints to receive instant notifications about events and updates.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Webhooks</CardTitle>
                <CardDescription>Currently configured webhook endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrations.filter(i => i.webhook_url).map((integration) => (
                    <div key={integration.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{integration.name}</span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {integration.webhook_url}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Keys</CardTitle>
                <CardDescription>Manage API authentication keys</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrations.filter(i => i.api_key).map((integration) => (
                    <div key={integration.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{integration.name}</span>
                        <Button size="sm" variant="outline">
                          <Key className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Key: {integration.api_key}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Integration activity logs show API calls, sync operations, and error events across all connected platforms.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};