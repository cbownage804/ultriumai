import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Shield, Plus, Trash2, TestTube, Copy, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SSOConfig {
  id: string;
  type: 'saml' | 'oauth' | 'oidc';
  name: string;
  enabled: boolean;
  org_id: string;
  created_at: string;
}

interface SSOSettingsProps {
  organizations: { id: string; name: string }[];
}

export const SSOSettings = ({ organizations }: SSOSettingsProps) => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<SSOConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [isAddingSSO, setIsAddingSSO] = useState(false);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [ssoType, setSsoType] = useState<'saml' | 'oauth' | 'oidc'>('saml');
  
  const [samlConfig, setSamlConfig] = useState({
    provider_name: '',
    metadata_url: '',
    entity_id: '',
    sso_url: '',
    certificate: ''
  });

  const [oauthConfig, setOauthConfig] = useState({
    provider_name: '',
    client_id: '',
    client_secret: '',
    authorization_url: '',
    token_url: '',
    userinfo_url: '',
    scopes: 'openid email profile'
  });

  const [spMetadata, setSpMetadata] = useState<{ entity_id: string; acs_url: string } | null>(null);

  useEffect(() => {
    if (user) loadConfigs();
  }, [user]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sso-integration', {
        body: { action: 'get_sso_configs', user_id: user?.id }
      });

      if (!error && data?.configs) {
        setConfigs(data.configs);
      }
    } catch (err) {
      console.error('Failed to load SSO configs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSAML = async () => {
    if (!selectedOrg || !samlConfig.provider_name) {
      toast.error('Fill in required fields');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('sso-integration', {
        body: {
          action: 'configure_saml',
          org_id: selectedOrg,
          user_id: user?.id,
          config: samlConfig
        }
      });

      if (error) throw error;
      
      setSpMetadata({
        entity_id: data.sp_entity_id,
        acs_url: data.sp_acs_url
      });
      
      toast.success('SAML SSO configured');
      setIsAddingSSO(false);
      loadConfigs();
    } catch (err: any) {
      toast.error('Failed to save SAML config', { description: err.message });
    }
  };

  const handleSaveOAuth = async () => {
    if (!selectedOrg || !oauthConfig.provider_name || !oauthConfig.client_id) {
      toast.error('Fill in required fields');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('sso-integration', {
        body: {
          action: ssoType === 'oidc' ? 'configure_oidc' : 'configure_oauth',
          org_id: selectedOrg,
          user_id: user?.id,
          config: {
            ...oauthConfig,
            scopes: oauthConfig.scopes.split(' ').filter(Boolean)
          }
        }
      });

      if (error) throw error;
      
      toast.success(`${ssoType.toUpperCase()} SSO configured`, {
        description: `Redirect URI: ${data.redirect_uri}`
      });
      setIsAddingSSO(false);
      loadConfigs();
    } catch (err: any) {
      toast.error('Failed to save config', { description: err.message });
    }
  };

  const handleToggle = async (configId: string, enabled: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('sso-integration', {
        body: { action: 'toggle_sso', config_id: configId, enabled, user_id: user?.id }
      });

      if (error) throw error;
      toast.success(enabled ? 'SSO enabled' : 'SSO disabled');
      loadConfigs();
    } catch (err: any) {
      toast.error('Failed to toggle SSO', { description: err.message });
    }
  };

  const handleDelete = async (configId: string) => {
    try {
      const { error } = await supabase.functions.invoke('sso-integration', {
        body: { action: 'delete_sso', config_id: configId, user_id: user?.id }
      });

      if (error) throw error;
      toast.success('SSO configuration deleted');
      loadConfigs();
    } catch (err: any) {
      toast.error('Failed to delete SSO', { description: err.message });
    }
  };

  const handleTest = async (configId: string) => {
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sso-integration', {
        body: { action: 'test_connection', config_id: configId, user_id: user?.id }
      });

      if (error) throw error;
      setTestResult({ id: configId, ...data.test_result });
    } catch (err: any) {
      setTestResult({ id: configId, success: false, message: err.message });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      saml: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      oauth: 'bg-green-500/20 text-green-400 border-green-500/30',
      oidc: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return <Badge className={colors[type] || 'bg-white/10 text-white/60'}>{type.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">SSO Integration</h3>
          <p className="text-white/60 text-sm">Configure SAML, OAuth, or OIDC single sign-on</p>
        </div>
        <Dialog open={isAddingSSO} onOpenChange={setIsAddingSSO}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add SSO Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/95 border-cyan-500/30 max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-cyan-400" />
                Configure SSO Provider
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-white/80">Organization</Label>
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-cyan-500/30">
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id} className="text-white/80">{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={ssoType} onValueChange={(v) => setSsoType(v as any)}>
                <TabsList className="bg-black/40 border border-cyan-500/20">
                  <TabsTrigger value="saml" className="data-[state=active]:bg-blue-500/20">SAML 2.0</TabsTrigger>
                  <TabsTrigger value="oauth" className="data-[state=active]:bg-green-500/20">OAuth 2.0</TabsTrigger>
                  <TabsTrigger value="oidc" className="data-[state=active]:bg-purple-500/20">OpenID Connect</TabsTrigger>
                </TabsList>

                <TabsContent value="saml" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Provider Name *</Label>
                    <Input
                      placeholder="Okta, Azure AD, OneLogin..."
                      value={samlConfig.provider_name}
                      onChange={(e) => setSamlConfig(prev => ({ ...prev, provider_name: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Metadata URL (optional)</Label>
                    <Input
                      placeholder="https://idp.example.com/metadata.xml"
                      value={samlConfig.metadata_url}
                      onChange={(e) => setSamlConfig(prev => ({ ...prev, metadata_url: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white/80">Entity ID</Label>
                      <Input
                        placeholder="IdP Entity ID"
                        value={samlConfig.entity_id}
                        onChange={(e) => setSamlConfig(prev => ({ ...prev, entity_id: e.target.value }))}
                        className="bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">SSO URL</Label>
                      <Input
                        placeholder="https://idp.example.com/sso"
                        value={samlConfig.sso_url}
                        onChange={(e) => setSamlConfig(prev => ({ ...prev, sso_url: e.target.value }))}
                        className="bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">X.509 Certificate</Label>
                    <Textarea
                      placeholder="-----BEGIN CERTIFICATE-----"
                      value={samlConfig.certificate}
                      onChange={(e) => setSamlConfig(prev => ({ ...prev, certificate: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white font-mono text-xs"
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleSaveSAML} className="w-full bg-blue-600 hover:bg-blue-700">
                    Save SAML Configuration
                  </Button>
                </TabsContent>

                <TabsContent value="oauth" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Provider Name *</Label>
                    <Input
                      placeholder="Google, Microsoft, GitHub..."
                      value={oauthConfig.provider_name}
                      onChange={(e) => setOauthConfig(prev => ({ ...prev, provider_name: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white/80">Client ID *</Label>
                      <Input
                        value={oauthConfig.client_id}
                        onChange={(e) => setOauthConfig(prev => ({ ...prev, client_id: e.target.value }))}
                        className="bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Client Secret *</Label>
                      <Input
                        type="password"
                        value={oauthConfig.client_secret}
                        onChange={(e) => setOauthConfig(prev => ({ ...prev, client_secret: e.target.value }))}
                        className="bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Authorization URL</Label>
                    <Input
                      placeholder="https://provider.com/oauth/authorize"
                      value={oauthConfig.authorization_url}
                      onChange={(e) => setOauthConfig(prev => ({ ...prev, authorization_url: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Token URL</Label>
                    <Input
                      placeholder="https://provider.com/oauth/token"
                      value={oauthConfig.token_url}
                      onChange={(e) => setOauthConfig(prev => ({ ...prev, token_url: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Scopes</Label>
                    <Input
                      placeholder="openid email profile"
                      value={oauthConfig.scopes}
                      onChange={(e) => setOauthConfig(prev => ({ ...prev, scopes: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <Button onClick={handleSaveOAuth} className="w-full bg-green-600 hover:bg-green-700">
                    Save OAuth Configuration
                  </Button>
                </TabsContent>

                <TabsContent value="oidc" className="space-y-4 pt-4">
                  <div className="p-3 border border-purple-500/20 rounded-lg bg-purple-500/5">
                    <p className="text-purple-400 text-sm">
                      OIDC supports auto-discovery. Enter your issuer URL and we'll fetch the configuration automatically.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Provider Name *</Label>
                    <Input
                      placeholder="Auth0, Keycloak, Okta..."
                      value={oauthConfig.provider_name}
                      onChange={(e) => setOauthConfig(prev => ({ ...prev, provider_name: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Issuer URL *</Label>
                    <Input
                      placeholder="https://auth.example.com"
                      value={oauthConfig.authorization_url?.replace('/.well-known/openid-configuration', '') || ''}
                      onChange={(e) => setOauthConfig(prev => ({ ...prev, authorization_url: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white/80">Client ID *</Label>
                      <Input
                        value={oauthConfig.client_id}
                        onChange={(e) => setOauthConfig(prev => ({ ...prev, client_id: e.target.value }))}
                        className="bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Client Secret *</Label>
                      <Input
                        type="password"
                        value={oauthConfig.client_secret}
                        onChange={(e) => setOauthConfig(prev => ({ ...prev, client_secret: e.target.value }))}
                        className="bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveOAuth} className="w-full bg-purple-600 hover:bg-purple-700">
                    Save OIDC Configuration
                  </Button>
                </TabsContent>
              </Tabs>

              {spMetadata && (
                <Card className="bg-cyan-500/5 border-cyan-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-cyan-400">Service Provider Details</CardTitle>
                    <CardDescription className="text-white/50">Add these to your Identity Provider</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-black/40 rounded">
                      <span className="text-white/60 text-xs">Entity ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-400 text-xs">{spMetadata.entity_id}</code>
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(spMetadata.entity_id)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-black/40 rounded">
                      <span className="text-white/60 text-xs">ACS URL:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-400 text-xs">{spMetadata.acs_url}</code>
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(spMetadata.acs_url)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-cyan-400" />
          <p className="text-white/60 mt-2">Loading SSO configurations...</p>
        </div>
      ) : configs.length === 0 ? (
        <Card className="bg-black/40 border-cyan-500/20">
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-cyan-400/50 mb-4" />
            <p className="text-white/60 mb-2">No SSO providers configured</p>
            <p className="text-white/40 text-sm">Add SAML, OAuth, or OIDC providers for enterprise authentication</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {configs.map(config => (
            <Card key={config.id} className="bg-black/40 border-cyan-500/20">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Key className="h-8 w-8 text-cyan-400/60" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{config.name}</span>
                      {getTypeBadge(config.type)}
                      <Badge className={config.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {config.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-white/50 text-sm">
                      Created {new Date(config.created_at).toLocaleDateString()}
                    </p>
                    {testResult?.id === config.id && (
                      <div className={`flex items-center gap-2 mt-1 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        <span className="text-xs">{testResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => handleToggle(config.id, checked)}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleTest(config.id)}
                    className="text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(config.id)}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
