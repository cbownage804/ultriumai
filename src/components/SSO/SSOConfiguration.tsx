import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Users, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SSOConfiguration = () => {
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [samlConfig, setSamlConfig] = useState({
    entityId: '',
    ssoUrl: '',
    certificate: '',
    attributeMapping: {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
    }
  });
  
  const [oidcConfig, setOidcConfig] = useState({
    clientId: '',
    clientSecret: '',
    discoveryUrl: '',
    scopes: 'openid profile email'
  });

  const { toast } = useToast();

  const handleSaveSAML = () => {
    toast({ title: "SAML configuration saved successfully" });
  };

  const handleSaveOIDC = () => {
    toast({ title: "OIDC configuration saved successfully" });
  };

  const testConnection = (provider: string) => {
    toast({ 
      title: `Testing ${provider} connection...`,
      description: "This would test the SSO configuration"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">SSO Configuration</h2>
          <p className="text-muted-foreground mt-2">
            Configure Single Sign-On for your organization
          </p>
        </div>
        <Badge variant={ssoEnabled ? "default" : "secondary"}>
          {ssoEnabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>SSO Settings</CardTitle>
            </div>
            <Switch
              checked={ssoEnabled}
              onCheckedChange={setSsoEnabled}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Enable Single Sign-On to allow users to authenticate using your organization's identity provider.
          </p>
        </CardContent>
      </Card>

      {ssoEnabled && (
        <Tabs defaultValue="saml" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="saml">
              <Shield className="h-4 w-4 mr-2" />
              SAML 2.0
            </TabsTrigger>
            <TabsTrigger value="oidc">
              <Key className="h-4 w-4 mr-2" />
              OpenID Connect
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saml" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SAML 2.0 Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entityId">Entity ID</Label>
                    <Input
                      id="entityId"
                      value={samlConfig.entityId}
                      onChange={(e) => setSamlConfig(prev => ({
                        ...prev,
                        entityId: e.target.value
                      }))}
                      placeholder="https://your-idp.com/metadata"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ssoUrl">SSO URL</Label>
                    <Input
                      id="ssoUrl"
                      value={samlConfig.ssoUrl}
                      onChange={(e) => setSamlConfig(prev => ({
                        ...prev,
                        ssoUrl: e.target.value
                      }))}
                      placeholder="https://your-idp.com/sso"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificate">X.509 Certificate</Label>
                  <textarea
                    id="certificate"
                    value={samlConfig.certificate}
                    onChange={(e) => setSamlConfig(prev => ({
                      ...prev,
                      certificate: e.target.value
                    }))}
                    className="w-full min-h-[120px] p-3 border rounded-md"
                    placeholder="-----BEGIN CERTIFICATE-----
MIIDBjCCAe4...
-----END CERTIFICATE-----"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Attribute Mapping</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email Attribute</Label>
                      <Input
                        value={samlConfig.attributeMapping.email}
                        onChange={(e) => setSamlConfig(prev => ({
                          ...prev,
                          attributeMapping: {
                            ...prev.attributeMapping,
                            email: e.target.value
                          }
                        }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>First Name Attribute</Label>
                      <Input
                        value={samlConfig.attributeMapping.firstName}
                        onChange={(e) => setSamlConfig(prev => ({
                          ...prev,
                          attributeMapping: {
                            ...prev.attributeMapping,
                            firstName: e.target.value
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveSAML}>Save Configuration</Button>
                  <Button variant="outline" onClick={() => testConnection('SAML')}>
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oidc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>OpenID Connect Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      value={oidcConfig.clientId}
                      onChange={(e) => setOidcConfig(prev => ({
                        ...prev,
                        clientId: e.target.value
                      }))}
                      placeholder="your-client-id"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      value={oidcConfig.clientSecret}
                      onChange={(e) => setOidcConfig(prev => ({
                        ...prev,
                        clientSecret: e.target.value
                      }))}
                      placeholder="your-client-secret"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discoveryUrl">Discovery URL</Label>
                  <Input
                    id="discoveryUrl"
                    value={oidcConfig.discoveryUrl}
                    onChange={(e) => setOidcConfig(prev => ({
                      ...prev,
                      discoveryUrl: e.target.value
                    }))}
                    placeholder="https://your-provider.com/.well-known/openid_configuration"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scopes">Scopes</Label>
                  <Input
                    id="scopes"
                    value={oidcConfig.scopes}
                    onChange={(e) => setOidcConfig(prev => ({
                      ...prev,
                      scopes: e.target.value
                    }))}
                    placeholder="openid profile email"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveOIDC}>Save Configuration</Button>
                  <Button variant="outline" onClick={() => testConnection('OIDC')}>
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Provisioning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-provision users</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically create user accounts on first login
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require group membership</Label>
                      <p className="text-sm text-muted-foreground">
                        Only allow users from specific groups
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Just-in-time provisioning</Label>
                      <p className="text-sm text-muted-foreground">
                        Update user attributes on each login
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SSOConfiguration;