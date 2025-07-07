import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Globe, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  Upload,
  Palette,
  Monitor,
  Smartphone,
  Code,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface DeploymentConfig {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  status: 'active' | 'pending' | 'failed' | 'configuring';
  ssl_status: 'active' | 'pending' | 'failed';
  created_at: string;
  last_deployed: string;
  branding: {
    logo_url?: string;
    favicon_url?: string;
    primary_color: string;
    secondary_color: string;
    company_name: string;
    support_email: string;
    support_phone?: string;
  };
  features: {
    custom_domain: boolean;
    remove_branding: boolean;
    custom_css: boolean;
    api_access: boolean;
    white_label_emails: boolean;
  };
  dns_records: Array<{
    type: string;
    name: string;
    value: string;
    status: 'verified' | 'pending' | 'failed';
  }>;
}

const WhiteLabelDeployment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [deployments, setDeployments] = useState<DeploymentConfig[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customCss, setCustomCss] = useState('');

  // New deployment form
  const [newDeployment, setNewDeployment] = useState({
    name: '',
    domain: '',
    subdomain: '',
    deployment_type: 'subdomain' as 'subdomain' | 'custom_domain',
    company_name: '',
    support_email: '',
    support_phone: '',
    primary_color: '#3b82f6',
    secondary_color: '#1e40af'
  });

  useEffect(() => {
    loadDeployments();
  }, []);

  const loadDeployments = async () => {
    // Mock deployments for demonstration
    const mockDeployments: DeploymentConfig[] = [
      {
        id: '1',
        name: 'TechSecure MSP Portal',
        domain: 'security.techsecure.com',
        status: 'active',
        ssl_status: 'active',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_deployed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        branding: {
          company_name: 'TechSecure Solutions',
          primary_color: '#dc2626',
          secondary_color: '#991b1b',
          support_email: 'support@techsecure.com',
          support_phone: '+1 (555) 123-4567'
        },
        features: {
          custom_domain: true,
          remove_branding: true,
          custom_css: true,
          api_access: true,
          white_label_emails: true
        },
        dns_records: [
          { type: 'CNAME', name: 'security', value: 'whitelabel.ultrium.ai', status: 'verified' },
          { type: 'TXT', name: '_ultrium-verify', value: 'abc123def456', status: 'verified' }
        ]
      },
      {
        id: '2',
        name: 'CyberGuard Client Portal',
        subdomain: 'cyberguard',
        domain: 'cyberguard.ultrium.ai',
        status: 'active',
        ssl_status: 'active',
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        last_deployed: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        branding: {
          company_name: 'CyberGuard Inc.',
          primary_color: '#059669',
          secondary_color: '#047857',
          support_email: 'help@cyberguard.com'
        },
        features: {
          custom_domain: false,
          remove_branding: true,
          custom_css: false,
          api_access: true,
          white_label_emails: false
        },
        dns_records: []
      }
    ];
    setDeployments(mockDeployments);
  };

  const createDeployment = async () => {
    if (!newDeployment.name || !newDeployment.company_name || !newDeployment.support_email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const domain = newDeployment.deployment_type === 'custom_domain' 
        ? newDeployment.domain
        : `${newDeployment.subdomain}.ultrium.ai`;

      const deployment: DeploymentConfig = {
        id: Date.now().toString(),
        name: newDeployment.name,
        domain,
        subdomain: newDeployment.deployment_type === 'subdomain' ? newDeployment.subdomain : undefined,
        status: 'configuring',
        ssl_status: 'pending',
        created_at: new Date().toISOString(),
        last_deployed: new Date().toISOString(),
        branding: {
          company_name: newDeployment.company_name,
          primary_color: newDeployment.primary_color,
          secondary_color: newDeployment.secondary_color,
          support_email: newDeployment.support_email,
          support_phone: newDeployment.support_phone
        },
        features: {
          custom_domain: newDeployment.deployment_type === 'custom_domain',
          remove_branding: false,
          custom_css: false,
          api_access: false,
          white_label_emails: false
        },
        dns_records: newDeployment.deployment_type === 'custom_domain' ? [
          { type: 'CNAME', name: '@', value: 'whitelabel.ultrium.ai', status: 'pending' },
          { type: 'TXT', name: '_ultrium-verify', value: `verify-${Date.now()}`, status: 'pending' }
        ] : []
      };

      setDeployments(prev => [...prev, deployment]);
      
      // Reset form
      setNewDeployment({
        name: '',
        domain: '',
        subdomain: '',
        deployment_type: 'subdomain',
        company_name: '',
        support_email: '',
        support_phone: '',
        primary_color: '#3b82f6',
        secondary_color: '#1e40af'
      });

      toast({
        title: "Deployment Created",
        description: "Your white-label deployment is being configured. This may take a few minutes.",
      });

      setActiveTab('overview');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create deployment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'configuring': return 'secondary';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Settings className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  const currentDeployment = selectedDeployment 
    ? deployments.find(d => d.id === selectedDeployment)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">White-Label Deployment</h2>
          <p className="text-muted-foreground">
            Deploy custom-branded instances for your MSP clients
          </p>
        </div>
        <Button onClick={() => setActiveTab('create')}>
          <Globe className="h-4 w-4 mr-2" />
          New Deployment
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="dns">DNS & SSL</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{deployments.length}</p>
                    <p className="text-sm text-muted-foreground">Total Deployments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success/10 rounded-full">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {deployments.filter(d => d.status === 'active').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Sites</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-info/10 rounded-full">
                    <Settings className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {deployments.filter(d => d.features.custom_domain).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Custom Domains</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deployments</CardTitle>
              <CardDescription>Manage your white-label deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deployments.map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(deployment.status)}
                      </div>
                      <div>
                        <h4 className="font-medium">{deployment.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{deployment.domain}</span>
                          <span>•</span>
                          <span>{deployment.branding.company_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(deployment.status)}>
                        {deployment.status.toUpperCase()}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`https://${deployment.domain}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedDeployment(deployment.id);
                          setActiveTab('branding');
                        }}
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Deployment</CardTitle>
              <CardDescription>Set up a new white-label instance for your client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Deployment Name</Label>
                  <Input
                    id="name"
                    value={newDeployment.name}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Client Security Portal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deployment_type">Domain Type</Label>
                  <Select 
                    value={newDeployment.deployment_type} 
                    onValueChange={(value: 'subdomain' | 'custom_domain') => 
                      setNewDeployment(prev => ({ ...prev, deployment_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subdomain">Ultrium Subdomain</SelectItem>
                      <SelectItem value="custom_domain">Custom Domain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newDeployment.deployment_type === 'subdomain' ? (
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      value={newDeployment.subdomain}
                      onChange={(e) => setNewDeployment(prev => ({ ...prev, subdomain: e.target.value }))}
                      placeholder="clientname"
                    />
                    <span className="text-muted-foreground">.ultrium.ai</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="domain">Custom Domain</Label>
                  <Input
                    id="domain"
                    value={newDeployment.domain}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="security.yourcompany.com"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={newDeployment.company_name}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Client Company Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={newDeployment.support_email}
                    onChange={(e) => setNewDeployment(prev => ({ ...prev, support_email: e.target.value }))}
                    placeholder="support@client.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={newDeployment.primary_color}
                      onChange={(e) => setNewDeployment(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={newDeployment.primary_color}
                      onChange={(e) => setNewDeployment(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={newDeployment.secondary_color}
                      onChange={(e) => setNewDeployment(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={newDeployment.secondary_color}
                      onChange={(e) => setNewDeployment(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#1e40af"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setActiveTab('overview')}>
                  Cancel
                </Button>
                <Button onClick={createDeployment} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Deployment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          {currentDeployment ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Customization</CardTitle>
                  <CardDescription>
                    Customize the look and feel for {currentDeployment.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Company Information</h4>
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input value={currentDeployment.branding.company_name} />
                      </div>
                      <div className="space-y-2">
                        <Label>Support Email</Label>
                        <Input value={currentDeployment.branding.support_email} />
                      </div>
                      <div className="space-y-2">
                        <Label>Support Phone</Label>
                        <Input value={currentDeployment.branding.support_phone || ''} placeholder="Optional" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Visual Branding</h4>
                      <div className="space-y-2">
                        <Label>Logo Upload</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Drop your logo here or click to upload
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Primary Color</Label>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: currentDeployment.branding.primary_color }}
                            />
                            <span className="text-sm">{currentDeployment.branding.primary_color}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Secondary Color</Label>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: currentDeployment.branding.secondary_color }}
                            />
                            <span className="text-sm">{currentDeployment.branding.secondary_color}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features & Settings</CardTitle>
                  <CardDescription>Configure available features for this deployment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Remove Ultrium Branding</Label>
                      <p className="text-sm text-muted-foreground">Hide "Powered by Ultrium" footer</p>
                    </div>
                    <Switch checked={currentDeployment.features.remove_branding} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Custom CSS</Label>
                      <p className="text-sm text-muted-foreground">Allow custom styling</p>
                    </div>
                    <Switch checked={currentDeployment.features.custom_css} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>API Access</Label>
                      <p className="text-sm text-muted-foreground">Enable API endpoints</p>
                    </div>
                    <Switch checked={currentDeployment.features.api_access} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>White-Label Emails</Label>
                      <p className="text-sm text-muted-foreground">Custom email templates</p>
                    </div>
                    <Switch checked={currentDeployment.features.white_label_emails} />
                  </div>
                </CardContent>
              </Card>

              {currentDeployment.features.custom_css && (
                <Card>
                  <CardHeader>
                    <CardTitle>Custom CSS</CardTitle>
                    <CardDescription>Add custom styles to your deployment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={customCss}
                      onChange={(e) => setCustomCss(e.target.value)}
                      placeholder="/* Add your custom CSS here */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}"
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a deployment to customize branding</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dns" className="space-y-6">
          {currentDeployment ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>DNS Configuration</CardTitle>
                  <CardDescription>
                    DNS settings for {currentDeployment.domain}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentDeployment.dns_records.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{record.type}</Badge>
                        <div>
                          <p className="font-medium">{record.name}</p>
                          <p className="text-sm text-muted-foreground">{record.value}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={record.status === 'verified' ? 'default' : 'secondary'}>
                          {record.status.toUpperCase()}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(record.value, `${record.type} record`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {currentDeployment.dns_records.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                      <p className="text-muted-foreground">Using Ultrium subdomain - no DNS configuration required</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SSL Certificate Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {currentDeployment.ssl_status === 'active' ? (
                      <CheckCircle className="h-8 w-8 text-success" />
                    ) : (
                      <Settings className="h-8 w-8 text-muted-foreground animate-spin" />
                    )}
                    <div>
                      <p className="font-medium">
                        SSL Status: {currentDeployment.ssl_status.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentDeployment.ssl_status === 'active' 
                          ? 'Your site is secure with automatic SSL renewal'
                          : 'SSL certificate is being provisioned'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a deployment to view DNS settings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Preview</CardTitle>
              <CardDescription>See how your deployment looks across different devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4 mb-6">
                <Button variant="outline" size="sm">
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
                <Button variant="ghost" size="sm">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="aspect-video bg-white rounded border shadow-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {currentDeployment?.branding.company_name || 'Your Company'}
                    </h3>
                    <p className="text-muted-foreground">Security Portal Preview</p>
                    <div className="mt-4 space-x-2">
                      <div className="inline-block w-20 h-8 bg-primary/20 rounded"></div>
                      <div className="inline-block w-16 h-8 bg-secondary/20 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!user && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sign in to create and manage white-label deployments for your clients.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WhiteLabelDeployment;