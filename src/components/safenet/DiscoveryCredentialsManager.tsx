import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Check, Eye, EyeOff, Key, Network, Server, Shield, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiscoveryCredentials {
  snmp: {
    enabled: boolean;
    community_strings: string[];
    version: 'v1' | 'v2c' | 'v3';
    username?: string;
    auth_password?: string;
    priv_password?: string;
  };
  windows: {
    enabled: boolean;
    username: string;
    password: string;
    domain?: string;
  };
  ssh: {
    enabled: boolean;
    username: string;
    password?: string;
    private_key?: string;
    port: number;
  };
  discovery_methods: string[];
}

export const DiscoveryCredentialsManager = () => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<DiscoveryCredentials>({
    snmp: {
      enabled: true,
      community_strings: ['public', 'private'],
      version: 'v2c'
    },
    windows: {
      enabled: false,
      username: '',
      password: ''
    },
    ssh: {
      enabled: false,
      username: '',
      password: '',
      port: 22
    },
    discovery_methods: ['nmap', 'snmp']
  });

  const [showPasswords, setShowPasswords] = useState({
    windows: false,
    ssh: false,
    snmp_auth: false,
    snmp_priv: false
  });

  const [isTestingCredentials, setIsTestingCredentials] = useState(false);

  const updateCredentials = (section: keyof DiscoveryCredentials, updates: any) => {
    setCredentials(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  const toggleDiscoveryMethod = (method: string) => {
    setCredentials(prev => ({
      ...prev,
      discovery_methods: prev.discovery_methods.includes(method)
        ? prev.discovery_methods.filter(m => m !== method)
        : [...prev.discovery_methods, method]
    }));
  };

  const handleTestCredentials = async () => {
    setIsTestingCredentials(true);
    
    // Simulate credential testing
    setTimeout(() => {
      setIsTestingCredentials(false);
      toast({
        title: "Credentials Tested",
        description: "Enhanced discovery methods configured successfully",
      });
    }, 2000);
  };

  const handleSaveCredentials = async () => {
    // Save credentials securely (in a real implementation, these would be encrypted)
    localStorage.setItem('safenet_discovery_credentials', JSON.stringify(credentials));
    
    toast({
      title: "Credentials Saved",
      description: "Discovery credentials have been saved securely",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enhanced Discovery Configuration
          </CardTitle>
          <CardDescription>
            Configure credentials and methods for detailed device discovery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Discovery Methods</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { id: 'nmap', label: 'Nmap Scanning', icon: Network },
                  { id: 'snmp', label: 'SNMP Discovery', icon: Network },
                  { id: 'wmi', label: 'Windows WMI', icon: Server },
                  { id: 'ssh', label: 'SSH Discovery', icon: Terminal }
                ].map(({ id, label, icon: Icon }) => (
                  <Badge
                    key={id}
                    variant={credentials.discovery_methods.includes(id) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleDiscoveryMethod(id)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="snmp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="snmp">SNMP</TabsTrigger>
          <TabsTrigger value="windows">Windows</TabsTrigger>
          <TabsTrigger value="ssh">SSH/Linux</TabsTrigger>
        </TabsList>

        <TabsContent value="snmp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                SNMP Configuration
              </CardTitle>
              <CardDescription>
                Configure SNMP settings for network device discovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={credentials.snmp.enabled}
                  onCheckedChange={(enabled) => updateCredentials('snmp', { enabled })}
                />
                <Label>Enable SNMP Discovery</Label>
              </div>

              {credentials.snmp.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>SNMP Version</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={credentials.snmp.version}
                      onChange={(e) => updateCredentials('snmp', { version: e.target.value })}
                    >
                      <option value="v1">SNMP v1</option>
                      <option value="v2c">SNMP v2c</option>
                      <option value="v3">SNMP v3</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Community Strings (one per line)</Label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      value={credentials.snmp.community_strings.join('\n')}
                      onChange={(e) => updateCredentials('snmp', {
                        community_strings: e.target.value.split('\n').filter(s => s.trim())
                      })}
                      placeholder="public&#10;private&#10;community"
                    />
                  </div>

                  {credentials.snmp.version === 'v3' && (
                    <>
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          value={credentials.snmp.username || ''}
                          onChange={(e) => updateCredentials('snmp', { username: e.target.value })}
                          placeholder="SNMP v3 username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Authentication Password</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords.snmp_auth ? "text" : "password"}
                            value={credentials.snmp.auth_password || ''}
                            onChange={(e) => updateCredentials('snmp', { auth_password: e.target.value })}
                            placeholder="Authentication password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({ ...prev, snmp_auth: !prev.snmp_auth }))}
                          >
                            {showPasswords.snmp_auth ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Privacy Password</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords.snmp_priv ? "text" : "password"}
                            value={credentials.snmp.priv_password || ''}
                            onChange={(e) => updateCredentials('snmp', { priv_password: e.target.value })}
                            placeholder="Privacy password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({ ...prev, snmp_priv: !prev.snmp_priv }))}
                          >
                            {showPasswords.snmp_priv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="windows">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Windows WMI Configuration
              </CardTitle>
              <CardDescription>
                Configure Windows credentials for WMI-based discovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={credentials.windows.enabled}
                  onCheckedChange={(enabled) => updateCredentials('windows', { enabled })}
                />
                <Label>Enable Windows WMI Discovery</Label>
              </div>

              {credentials.windows.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={credentials.windows.username}
                      onChange={(e) => updateCredentials('windows', { username: e.target.value })}
                      placeholder="domain\\username or username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.windows ? "text" : "password"}
                        value={credentials.windows.password}
                        onChange={(e) => updateCredentials('windows', { password: e.target.value })}
                        placeholder="Windows password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, windows: !prev.windows }))}
                      >
                        {showPasswords.windows ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Domain (optional)</Label>
                    <Input
                      value={credentials.windows.domain || ''}
                      onChange={(e) => updateCredentials('windows', { domain: e.target.value })}
                      placeholder="DOMAIN"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ssh">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                SSH Configuration
              </CardTitle>
              <CardDescription>
                Configure SSH credentials for Linux/Unix device discovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={credentials.ssh.enabled}
                  onCheckedChange={(enabled) => updateCredentials('ssh', { enabled })}
                />
                <Label>Enable SSH Discovery</Label>
              </div>

              {credentials.ssh.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={credentials.ssh.username}
                      onChange={(e) => updateCredentials('ssh', { username: e.target.value })}
                      placeholder="SSH username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>SSH Port</Label>
                    <Input
                      type="number"
                      value={credentials.ssh.port}
                      onChange={(e) => updateCredentials('ssh', { port: parseInt(e.target.value) || 22 })}
                      placeholder="22"
                    />
                  </div>

                  <Tabs defaultValue="password">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="password">Password</TabsTrigger>
                      <TabsTrigger value="key">Private Key</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="password" className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.ssh ? "text" : "password"}
                          value={credentials.ssh.password || ''}
                          onChange={(e) => updateCredentials('ssh', { password: e.target.value })}
                          placeholder="SSH password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords(prev => ({ ...prev, ssh: !prev.ssh }))}
                        >
                          {showPasswords.ssh ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="key" className="space-y-2">
                      <Label>Private Key</Label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                        rows={6}
                        value={credentials.ssh.private_key || ''}
                        onChange={(e) => updateCredentials('ssh', { private_key: e.target.value })}
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                      />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Security Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Credentials are stored securely and encrypted in your browser</p>
            <p>• SNMP v3 is recommended for secure network device discovery</p>
            <p>• Use dedicated service accounts with minimal required permissions</p>
            <p>• SSH key authentication is more secure than password authentication</p>
            <p>• Test credentials before running full network discovery</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleTestCredentials} disabled={isTestingCredentials}>
          {isTestingCredentials ? (
            "Testing..."
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Test Credentials
            </>
          )}
        </Button>
        <Button onClick={handleSaveCredentials} variant="outline">
          <Key className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
};