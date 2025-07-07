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
import { 
  Shield, 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Users,
  ExternalLink,
  Copy,
  Download,
  Upload,
  TestTube
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oauth';
  status: 'active' | 'inactive' | 'testing';
  entityId?: string;
  ssoUrl?: string;
  certificate?: string;
  clientId?: string;
  tenantId?: string;
  domain?: string;
  userCount: number;
  lastSync?: string;
  created_at: string;
}

const SSOIntegration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Form states for new provider
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'saml' as 'saml' | 'oauth',
    provider: '',
    entityId: '',
    ssoUrl: '',
    certificate: '',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    domain: ''
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    // Mock data for demonstration
    const mockProviders: SSOProvider[] = [
      {
        id: '1',
        name: 'Azure AD Production',
        type: 'saml',
        status: 'active',
        entityId: 'https://sts.windows.net/12345678-1234-1234-1234-123456789012/',
        ssoUrl: 'https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/saml2',
        domain: 'company.onmicrosoft.com',
        userCount: 247,
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Okta Corporate',
        type: 'saml',
        status: 'active',
        entityId: 'http://www.okta.com/exk1234567890abcdef',
        ssoUrl: 'https://company.okta.com/app/company_ultrarium_1/exk1234567890abcdef/sso/saml',
        domain: 'company.okta.com',
        userCount: 89,
        lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'Google Workspace',
        type: 'oauth',
        status: 'testing',
        clientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
        domain: 'company.com',
        userCount: 0,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    setProviders(mockProviders);
  };

  const handleCreateProvider = async () => {
    if (!newProvider.name || !newProvider.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // In real implementation, this would save to Supabase
      const provider: SSOProvider = {
        id: Date.now().toString(),
        name: newProvider.name,
        type: newProvider.type,
        status: 'inactive',
        entityId: newProvider.entityId,
        ssoUrl: newProvider.ssoUrl,
        certificate: newProvider.certificate,
        clientId: newProvider.clientId,
        tenantId: newProvider.tenantId,
        domain: newProvider.domain,
        userCount: 0,
        created_at: new Date().toISOString()
      };

      setProviders(prev => [...prev, provider]);
      
      // Reset form
      setNewProvider({
        name: '',
        type: 'saml',
        provider: '',
        entityId: '',
        ssoUrl: '',
        certificate: '',
        clientId: '',
        clientSecret: '',
        tenantId: '',
        domain: ''
      });

      toast({
        title: "SSO Provider Created",
        description: "Your SSO configuration has been saved. You can now test the connection.",
      });

      setActiveTab('overview');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create SSO provider. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (providerId: string) => {
    setIsLoading(true);
    try {
      // Simulate testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          success,
          message: success 
            ? "Connection successful. SSO is working correctly."
            : "Connection failed. Please check your configuration.",
          timestamp: new Date().toISOString(),
          details: success ? {
            userAttributes: ['email', 'name', 'groups'],
            certificateValid: true,
            endpointReachable: true
          } : {
            error: "Certificate validation failed",
            suggestion: "Please verify your SAML certificate"
          }
        }
      }));

      if (success) {
        // Update provider status
        setProviders(prev => prev.map(p => 
          p.id === providerId ? { ...p, status: 'active' as const } : p
        ));
      }

      toast({
        title: success ? "Test Successful" : "Test Failed",
        description: success 
          ? "SSO connection is working correctly"
          : "Please check your configuration and try again",
        variant: success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test SSO connection",
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
      case 'testing': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'outline';
    }
  };

  const getProviderIcon = (type: string, provider?: string) => {
    if (provider?.includes('azure') || provider?.includes('microsoft')) {
      return '🏢'; // Microsoft icon placeholder
    }
    if (provider?.includes('okta')) {
      return '🔐'; // Okta icon placeholder  
    }
    if (provider?.includes('google')) {
      return '🔍'; // Google icon placeholder
    }
    return type === 'saml' ? '🛡️' : '🔑';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">SSO Integration</h2>
          <p className="text-muted-foreground">
            Configure SAML and OAuth SSO for enterprise authentication
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          Enterprise Feature
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {providers.reduce((sum, p) => sum + p.userCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">SSO Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success/10 rounded-full">
                    <Shield className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {providers.filter(p => p.status === 'active').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Providers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-info/10 rounded-full">
                    <Key className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {providers.filter(p => p.lastSync).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Synced Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>SSO Providers</CardTitle>
              <CardDescription>Overview of configured SSO integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getProviderIcon(provider.type, provider.name.toLowerCase())}
                      </div>
                      <div>
                        <h4 className="font-medium">{provider.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{provider.type}</span>
                          <span>•</span>
                          <span>{provider.userCount} users</span>
                          {provider.lastSync && (
                            <>
                              <span>•</span>
                              <span>Last sync: {new Date(provider.lastSync).toLocaleTimeString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(provider.status)}>
                        {provider.status.toUpperCase()}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => testConnection(provider.id)}
                        disabled={isLoading}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
                {providers.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No SSO providers configured</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="font-semibold mb-2">Azure AD / Entra ID</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Microsoft's enterprise identity platform
                </p>
                <Button onClick={() => {
                  setNewProvider(prev => ({ ...prev, provider: 'azure', type: 'saml' }));
                  setActiveTab('setup');
                }}>
                  Configure
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="font-semibold mb-2">Okta</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enterprise identity and access management
                </p>
                <Button onClick={() => {
                  setNewProvider(prev => ({ ...prev, provider: 'okta', type: 'saml' }));
                  setActiveTab('setup');
                }}>
                  Configure
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="font-semibold mb-2">Google Workspace</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Google's enterprise productivity suite
                </p>
                <Button onClick={() => {
                  setNewProvider(prev => ({ ...prev, provider: 'google', type: 'oauth' }));
                  setActiveTab('setup');
                }}>
                  Configure
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="font-semibold mb-2">Generic SAML</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Any SAML 2.0 compatible provider
                </p>
                <Button onClick={() => {
                  setNewProvider(prev => ({ ...prev, provider: 'generic', type: 'saml' }));
                  setActiveTab('setup');
                }}>
                  Configure
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🔑</div>
                <h3 className="font-semibold mb-2">Generic OAuth</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Any OAuth 2.0 / OpenID Connect provider
                </p>
                <Button onClick={() => {
                  setNewProvider(prev => ({ ...prev, provider: 'generic', type: 'oauth' }));
                  setActiveTab('setup');
                }}>
                  Configure
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure SSO Provider</CardTitle>
              <CardDescription>
                Set up a new SSO integration for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Provider Name</Label>
                  <Input
                    id="name"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Azure AD Production"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Integration Type</Label>
                  <Select 
                    value={newProvider.type} 
                    onValueChange={(value: 'saml' | 'oauth') => 
                      setNewProvider(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saml">SAML 2.0</SelectItem>
                      <SelectItem value="oauth">OAuth 2.0 / OpenID Connect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newProvider.type === 'saml' ? (
                <div className="space-y-4">
                  <h4 className="font-semibold">SAML Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entityId">Entity ID</Label>
                      <Input
                        id="entityId"
                        value={newProvider.entityId}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, entityId: e.target.value }))}
                        placeholder="https://sts.windows.net/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ssoUrl">SSO URL</Label>
                      <Input
                        id="ssoUrl"
                        value={newProvider.ssoUrl}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, ssoUrl: e.target.value }))}
                        placeholder="https://login.microsoftonline.com/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificate">X.509 Certificate</Label>
                    <Textarea
                      id="certificate"
                      value={newProvider.certificate}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, certificate: e.target.value }))}
                      placeholder="-----BEGIN CERTIFICATE-----..."
                      rows={6}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-semibold">OAuth Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client ID</Label>
                      <Input
                        id="clientId"
                        value={newProvider.clientId}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, clientId: e.target.value }))}
                        placeholder="123456789012-abc..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientSecret">Client Secret</Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={newProvider.clientSecret}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, clientSecret: e.target.value }))}
                        placeholder="Client secret from provider"
                      />
                    </div>
                  </div>
                  {newProvider.provider === 'azure' && (
                    <div className="space-y-2">
                      <Label htmlFor="tenantId">Tenant ID</Label>
                      <Input
                        id="tenantId"
                        value={newProvider.tenantId}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, tenantId: e.target.value }))}
                        placeholder="12345678-1234-1234-1234-123456789012"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="domain">Domain (Optional)</Label>
                <Input
                  id="domain"
                  value={newProvider.domain}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="company.com"
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setActiveTab('overview')}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProvider} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Provider'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Endpoints</CardTitle>
              <CardDescription>
                Use these URLs when configuring your SSO provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Assertion Consumer Service (ACS) URL</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value="https://app.ultrium.ai/auth/sso/callback" 
                    readOnly
                    className="bg-muted"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard('https://app.ultrium.ai/auth/sso/callback', 'ACS URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Entity ID / Audience URI</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value="https://app.ultrium.ai" 
                    readOnly
                    className="bg-muted"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard('https://app.ultrium.ai', 'Entity ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SSO Connection Testing</CardTitle>
              <CardDescription>
                Test your SSO integrations to ensure they're working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {providers.map((provider) => (
                <div key={provider.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">
                        {getProviderIcon(provider.type, provider.name.toLowerCase())}
                      </div>
                      <div>
                        <h4 className="font-medium">{provider.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {provider.type.toUpperCase()} • {provider.status}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => testConnection(provider.id)}
                      disabled={isLoading}
                      size="sm"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>

                  {testResults[provider.id] && (
                    <Alert className={testResults[provider.id].success ? 'border-success' : 'border-destructive'}>
                      {testResults[provider.id].success ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      <AlertDescription>
                        <div className="space-y-2">
                          <p>{testResults[provider.id].message}</p>
                          <p className="text-xs text-muted-foreground">
                            Tested: {new Date(testResults[provider.id].timestamp).toLocaleString()}
                          </p>
                          {testResults[provider.id].details && (
                            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                              {JSON.stringify(testResults[provider.id].details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}

              {providers.length === 0 && (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No providers available for testing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!user && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sign in to configure SSO integrations and enterprise authentication.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SSOIntegration;