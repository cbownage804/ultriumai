import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Code, 
  Key, 
  Globe, 
  Zap,
  Activity,
  Users,
  Settings,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  BarChart3,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Bell,
  Database,
  Network,
  Terminal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApiKeys } from "@/hooks/useApiKeys";

interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  app: 'safedoc' | 'safemail' | 'safelink' | 'safepass' | 'safenet' | 'analytics';
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'file';
    required: boolean;
    description: string;
  }>;
  response_format: Record<string, any>;
  rate_limit: {
    requests_per_minute: number;
    requests_per_day: number;
  };
  authentication_required: boolean;
  scopes: string[];
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  last_delivery?: {
    timestamp: string;
    status: 'success' | 'failed';
    response_code: number;
  };
  delivery_count: number;
  created_at: string;
}

interface APIUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  top_endpoints: Array<{
    endpoint: string;
    requests: number;
    success_rate: number;
  }>;
  requests_by_hour: Array<{
    hour: string;
    requests: number;
  }>;
}

export const SecurityAPIManager = () => {
  const { apiKeys, createApiKey, deleteApiKey, updateApiKey, loading } = useApiKeys();
  const { toast } = useToast();
  
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'keys' | 'endpoints' | 'webhooks' | 'usage'>('keys');
  
  const [endpoints] = useState<APIEndpoint[]>([
    {
      id: 'safedoc-scan',
      name: 'Document Scan',
      method: 'POST',
      path: '/api/v1/safedoc/scan',
      description: 'Scan uploaded documents for malware and threats',
      app: 'safedoc',
      parameters: [
        { name: 'file', type: 'file', required: true, description: 'Document file to scan' },
        { name: 'scan_type', type: 'string', required: false, description: 'Type of scan: quick, deep, or comprehensive' }
      ],
      response_format: {
        scan_id: 'string',
        file_name: 'string',
        threat_level: 'string',
        threats_found: 'number',
        scan_results: 'object'
      },
      rate_limit: { requests_per_minute: 30, requests_per_day: 1000 },
      authentication_required: true,
      scopes: ['safedoc:scan']
    },
    {
      id: 'safemail-check',
      name: 'Email Security Check',
      method: 'POST',
      path: '/api/v1/safemail/check',
      description: 'Analyze email content for phishing and malware',
      app: 'safemail',
      parameters: [
        { name: 'email_content', type: 'string', required: true, description: 'Raw email content' },
        { name: 'check_attachments', type: 'boolean', required: false, description: 'Include attachment scanning' }
      ],
      response_format: {
        is_safe: 'boolean',
        threat_level: 'string',
        phishing_score: 'number',
        recommendations: 'array'
      },
      rate_limit: { requests_per_minute: 100, requests_per_day: 5000 },
      authentication_required: true,
      scopes: ['safemail:check']
    },
    {
      id: 'safelink-verify',
      name: 'URL Verification',
      method: 'GET',
      path: '/api/v1/safelink/verify',
      description: 'Verify URL safety and categorization',
      app: 'safelink',
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'URL to verify' },
        { name: 'deep_scan', type: 'boolean', required: false, description: 'Perform deep content analysis' }
      ],
      response_format: {
        is_safe: 'boolean',
        category: 'string',
        reputation_score: 'number',
        threats: 'array'
      },
      rate_limit: { requests_per_minute: 200, requests_per_day: 10000 },
      authentication_required: true,
      scopes: ['safelink:verify']
    },
    {
      id: 'safenet-scan',
      name: 'Network Scan',
      method: 'POST',
      path: '/api/v1/safenet/scan',
      description: 'Initiate network security scan',
      app: 'safenet',
      parameters: [
        { name: 'network_range', type: 'string', required: true, description: 'CIDR notation network range' },
        { name: 'scan_type', type: 'string', required: false, description: 'Scan type: discovery, vulnerability, or full' }
      ],
      response_format: {
        scan_id: 'string',
        status: 'string',
        devices_found: 'number',
        vulnerabilities: 'array'
      },
      rate_limit: { requests_per_minute: 10, requests_per_day: 100 },
      authentication_required: true,
      scopes: ['safenet:scan']
    }
  ]);

  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([
    {
      id: 'webhook-001',
      name: 'Threat Detection Alerts',
      url: 'https://your-app.com/webhooks/threats',
      events: ['threat.detected', 'threat.blocked', 'scan.completed'],
      secret: 'whsec_' + Math.random().toString(36).substring(2, 15),
      active: true,
      last_delivery: {
        timestamp: '2024-01-20T15:30:00Z',
        status: 'success',
        response_code: 200
      },
      delivery_count: 1247,
      created_at: '2024-01-15T00:00:00Z'
    }
  ]);

  const [usageStats] = useState<APIUsageStats>({
    total_requests: 12847,
    successful_requests: 12234,
    failed_requests: 613,
    average_response_time: 245,
    top_endpoints: [
      { endpoint: '/api/v1/safelink/verify', requests: 4521, success_rate: 99.2 },
      { endpoint: '/api/v1/safemail/check', requests: 3214, success_rate: 97.8 },
      { endpoint: '/api/v1/safedoc/scan', requests: 2890, success_rate: 95.1 }
    ],
    requests_by_hour: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      requests: Math.floor(Math.random() * 500) + 100
    }))
  });

  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    scopes: [] as string[],
    rate_limit_rpm: 100,
    rate_limit_rpd: 5000,
    expires_in_days: 365
  });

  const [newWebhookForm, setNewWebhookForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: ''
  });

  const generateWebhookSecret = () => {
    const secret = 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setNewWebhookForm(prev => ({ ...prev, secret }));
  };

  const handleCreateApiKey = async () => {
    if (!newKeyForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for the API key",
        variant: "destructive"
      });
      return;
    }

    try {
      await createApiKey({
        name: newKeyForm.name,
        permissions: {
          chat: newKeyForm.scopes.includes('chat'),
          analytics: newKeyForm.scopes.includes('analytics')
        },
        rate_limit_rpm: newKeyForm.rate_limit_rpm,
        rate_limit_rpd: newKeyForm.rate_limit_rpd,
        expires_at: new Date(Date.now() + newKeyForm.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      });

      setShowCreateKey(false);
      setNewKeyForm({
        name: '',
        scopes: [],
        rate_limit_rpm: 100,
        rate_limit_rpd: 5000,
        expires_in_days: 365
      });

      toast({
        title: "API Key Created",
        description: "Your new API key has been generated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive"
      });
    }
  };

  const handleCreateWebhook = () => {
    if (!newWebhookForm.name.trim() || !newWebhookForm.url.trim()) {
      toast({
        title: "Error",
        description: "Please provide name and URL for the webhook",
        variant: "destructive"
      });
      return;
    }

    const newWebhook: WebhookEndpoint = {
      id: `webhook-${Date.now()}`,
      name: newWebhookForm.name,
      url: newWebhookForm.url,
      events: newWebhookForm.events,
      secret: newWebhookForm.secret || 'whsec_' + Math.random().toString(36).substring(2, 15),
      active: true,
      delivery_count: 0,
      created_at: new Date().toISOString()
    };

    setWebhooks(prev => [newWebhook, ...prev]);
    setShowCreateWebhook(false);
    setNewWebhookForm({ name: '', url: '', events: [], secret: '' });

    toast({
      title: "Webhook Created",
      description: "Your webhook endpoint has been configured",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const availableScopes = [
    'safedoc:scan', 'safedoc:results',
    'safemail:check', 'safemail:quarantine',
    'safelink:verify', 'safelink:block',
    'safepass:check', 'safepass:breach',
    'safenet:scan', 'safenet:monitor',
    'analytics:read', 'analytics:export'
  ];

  const availableEvents = [
    'threat.detected', 'threat.blocked', 'threat.resolved',
    'scan.started', 'scan.completed', 'scan.failed',
    'incident.created', 'incident.updated', 'incident.closed',
    'user.login', 'user.logout', 'api.limit.reached'
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Code className="h-8 w-8 text-primary" />
            Security API Manager
          </h1>
          <p className="text-muted-foreground">
            Manage API keys, endpoints, webhooks, and integration settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button variant="hero">
            <Terminal className="h-4 w-4 mr-2" />
            API Console
          </Button>
        </div>
      </div>

      {/* API Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.total_requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {((usageStats.successful_requests / usageStats.total_requests) * 100).toFixed(1)}%
            </div>
            <Progress 
              value={(usageStats.successful_requests / usageStats.total_requests) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.average_response_time}ms</div>
            <p className="text-xs text-muted-foreground">Across all endpoints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.filter(k => k.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              {apiKeys.length} total keys
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <Dialog open={showCreateKey} onOpenChange={setShowCreateKey}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      value={newKeyForm.name}
                      onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Production API Key"
                    />
                  </div>
                  
                  <div>
                    <Label>Scopes</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableScopes.map(scope => (
                        <label key={scope} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newKeyForm.scopes.includes(scope)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKeyForm(prev => ({ ...prev, scopes: [...prev.scopes, scope] }));
                              } else {
                                setNewKeyForm(prev => ({ ...prev, scopes: prev.scopes.filter(s => s !== scope) }));
                              }
                            }}
                          />
                          <span className="text-sm">{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rpm">Requests per minute</Label>
                      <Input
                        id="rpm"
                        type="number"
                        value={newKeyForm.rate_limit_rpm}
                        onChange={(e) => setNewKeyForm(prev => ({ ...prev, rate_limit_rpm: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rpd">Requests per day</Label>
                      <Input
                        id="rpd"
                        type="number"
                        value={newKeyForm.rate_limit_rpd}
                        onChange={(e) => setNewKeyForm(prev => ({ ...prev, rate_limit_rpd: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expires">Expires in (days)</Label>
                    <Input
                      id="expires"
                      type="number"
                      value={newKeyForm.expires_in_days}
                      onChange={(e) => setNewKeyForm(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) }))}
                    />
                  </div>

                  <Button onClick={handleCreateApiKey} className="w-full">
                    Create API Key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {apiKeys.map((key) => (
              <Card key={key.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{key.name}</h3>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(key.key_prefix + '...')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteApiKey(key.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Key:</span>
                      <code className="block text-xs mt-1">{key.key_prefix}...</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Usage:</span>
                      <div className="text-xs mt-1">{key.usage_count || 0} requests</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate Limit:</span>
                      <div className="text-xs mt-1">{key.rate_limit_rpm}/min, {key.rate_limit_rpd}/day</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Used:</span>
                      <div className="text-xs mt-1">
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available API Endpoints</CardTitle>
              <CardDescription>
                Complete reference for all security API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={
                          endpoint.method === 'GET' ? 'bg-green-50 text-green-700' :
                          endpoint.method === 'POST' ? 'bg-blue-50 text-blue-700' :
                          endpoint.method === 'PUT' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {endpoint.path}
                        </code>
                        <Badge variant="secondary">{endpoint.app}</Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                    </div>
                    
                    <h3 className="font-semibold mb-1">{endpoint.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{endpoint.description}</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Parameters:</span>
                        <ul className="mt-1 space-y-1">
                          {endpoint.parameters.map((param, idx) => (
                            <li key={idx} className="text-xs">
                              <code>{param.name}</code> ({param.type})
                              {param.required && <span className="text-red-500"> *</span>}
                              - {param.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">Rate Limits:</span>
                        <div className="text-xs mt-1">
                          {endpoint.rate_limit.requests_per_minute}/min, {endpoint.rate_limit.requests_per_day}/day
                        </div>
                        <span className="font-medium">Scopes:</span>
                        <div className="text-xs mt-1">{endpoint.scopes.join(', ')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Webhook Endpoints</h2>
            <Dialog open={showCreateWebhook} onOpenChange={setShowCreateWebhook}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Webhook</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-name">Webhook Name</Label>
                    <Input
                      id="webhook-name"
                      value={newWebhookForm.name}
                      onChange={(e) => setNewWebhookForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Threat Alerts Webhook"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="webhook-url">Endpoint URL</Label>
                    <Input
                      id="webhook-url"
                      value={newWebhookForm.url}
                      onChange={(e) => setNewWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://your-app.com/webhooks/security"
                    />
                  </div>

                  <div>
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableEvents.map(event => (
                        <label key={event} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newWebhookForm.events.includes(event)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewWebhookForm(prev => ({ ...prev, events: [...prev.events, event] }));
                              } else {
                                setNewWebhookForm(prev => ({ ...prev, events: prev.events.filter(e => e !== event) }));
                              }
                            }}
                          />
                          <span className="text-sm">{event}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="webhook-secret">Webhook Secret</Label>
                      <Button size="sm" variant="outline" onClick={generateWebhookSecret}>
                        Generate
                      </Button>
                    </div>
                    <Input
                      id="webhook-secret"
                      value={newWebhookForm.secret}
                      onChange={(e) => setNewWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
                      placeholder="Leave empty to auto-generate"
                    />
                  </div>

                  <Button onClick={handleCreateWebhook} className="w-full">
                    Create Webhook
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{webhook.name}</h3>
                      <Badge variant={webhook.active ? "default" : "secondary"}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">URL:</span>
                      <code className="block text-xs mt-1 break-all">{webhook.url}</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Events:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.map(event => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-muted-foreground">Deliveries:</span>
                        <div className="text-xs mt-1">{webhook.delivery_count}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Delivery:</span>
                        <div className="text-xs mt-1">
                          {webhook.last_delivery ? (
                            <span className={webhook.last_delivery.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                              {webhook.last_delivery.status} ({webhook.last_delivery.response_code})
                            </span>
                          ) : 'None'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <div className="text-xs mt-1">{new Date(webhook.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usageStats.top_endpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <code className="text-sm">{endpoint.endpoint}</code>
                        <div className="text-xs text-muted-foreground">
                          {endpoint.requests.toLocaleString()} requests
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${endpoint.success_rate > 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {endpoint.success_rate}%
                        </div>
                        <Progress value={endpoint.success_rate} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Volume (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {usageStats.requests_by_hour.slice(0, 12).map((hour, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-primary rounded-t w-4"
                        style={{ height: `${(hour.requests / 500) * 200}px` }}
                      />
                      <div className="text-xs text-muted-foreground mt-1 transform -rotate-45">
                        {hour.hour}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};