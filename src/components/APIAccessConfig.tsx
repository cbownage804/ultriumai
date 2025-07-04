import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Key, Shield, Code, Zap, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  created_at: string;
  last_used: string | null;
  usage_count: number;
  is_active: boolean;
}

const APIAccessConfig = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const permissions = [
    { id: "chat", label: "Chat with GPTs", description: "Send messages to your custom GPTs" },
    { id: "analytics", label: "View Analytics", description: "Access usage and performance data" },
    { id: "manage", label: "Manage GPTs", description: "Create, update, and delete GPTs" },
    { id: "deploy", label: "Deploy GPTs", description: "Control deployment settings" },
  ];

  useEffect(() => {
    if (user) {
      loadAPIKeys();
    }
  }, [user]);

  const loadAPIKeys = async () => {
    try {
      // Simulate API keys data - in real implementation, this would come from Supabase
      const mockKeys: APIKey[] = [
        {
          id: "1",
          name: "Production API",
          key: "uk_" + generateRandomKey(),
          permissions: ["chat", "analytics"],
          created_at: "2024-01-15T10:00:00Z",
          last_used: "2024-01-20T14:30:00Z",
          usage_count: 1547,
          is_active: true
        },
        {
          id: "2", 
          name: "Development API",
          key: "uk_" + generateRandomKey(),
          permissions: ["chat"],
          created_at: "2024-01-10T09:00:00Z",
          last_used: null,
          usage_count: 0,
          is_active: false
        }
      ];
      
      setApiKeys(mockKeys);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomKey = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => 
      b.toString(16).padStart(2, '0')
    ).join('').substring(0, 32);
  };

  const createAPIKey = async () => {
    if (!newKeyName.trim() || selectedPermissions.length === 0) {
      toast({
        title: "Invalid Input",
        description: "Please provide a name and select at least one permission",
        variant: "destructive",
      });
      return;
    }

    try {
      const newKey: APIKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: "uk_" + generateRandomKey(),
        permissions: selectedPermissions,
        created_at: new Date().toISOString(),
        last_used: null,
        usage_count: 0,
        is_active: true
      };

      setApiKeys([...apiKeys, newKey]);
      setNewKeyName("");
      setSelectedPermissions([]);
      setShowCreateForm(false);
      
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const toggleKeyStatus = async (keyId: string) => {
    setApiKeys(keys => 
      keys.map(key => 
        key.id === keyId ? { ...key, is_active: !key.is_active } : key
      )
    );
  };

  const deleteAPIKey = async (keyId: string) => {
    setApiKeys(keys => keys.filter(key => key.id !== keyId));
    toast({
      title: "API Key Deleted",
      description: "The API key has been permanently deleted",
    });
  };

  const formatKey = (key: string, isVisible: boolean) => {
    if (!isVisible) {
      return key.substring(0, 8) + "•".repeat(20) + key.substring(key.length - 4);
    }
    return key;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading API configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">API Access</h1>
            <p className="text-muted-foreground mt-1">
              Manage API keys for external integrations
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="btn-gradient">
          <Key className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          {/* Create API Key Form */}
          {showCreateForm && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Create New API Key</CardTitle>
                <CardDescription>
                  Generate a new API key with specific permissions for your integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="keyName">API Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production API, Mobile App"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {permissions.map((permission) => (
                      <Card key={permission.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <Switch
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPermissions([...selectedPermissions, permission.id]);
                              } else {
                                setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                              }
                            }}
                          />
                          <div>
                            <p className="font-medium">{permission.label}</p>
                            <p className="text-sm text-muted-foreground">{permission.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createAPIKey} className="btn-gradient">
                    Create API Key
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Keys List */}
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id} className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {apiKey.name}
                        <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                          {apiKey.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(apiKey.created_at).toLocaleDateString()} • 
                        {apiKey.last_used ? ` Last used ${new Date(apiKey.last_used).toLocaleDateString()}` : " Never used"} • 
                        {apiKey.usage_count} requests
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={apiKey.is_active}
                        onCheckedChange={() => toggleKeyStatus(apiKey.id)}
                      />
                      <Button variant="outline" size="sm" onClick={() => deleteAPIKey(apiKey.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>API Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={formatKey(apiKey.key, visibleKeys.has(apiKey.id))}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Permissions</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {apiKey.permissions.map((permissionId) => {
                        const permission = permissions.find(p => p.id === permissionId);
                        return (
                          <Badge key={permissionId} variant="outline">
                            {permission?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {apiKeys.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No API Keys</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first API key to start integrating with external applications
                  </p>
                  <Button onClick={() => setShowCreateForm(true)} className="btn-gradient">
                    Create API Key
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                API Documentation
              </CardTitle>
              <CardDescription>
                Learn how to integrate with UltriumGPT using our REST API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Authentication</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm mb-2">Include your API key in the Authorization header:</p>
                  <code className="text-sm bg-muted p-2 rounded block">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Base URL</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <code className="text-sm">https://your-project.supabase.co/functions/v1/api</code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Endpoints</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">POST</Badge>
                      <code className="text-sm">/chat</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Send a message to a specific GPT</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/gpts</code>
                    </div>
                    <p className="text-sm text-muted-foreground">List all your custom GPTs</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/analytics</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Get usage analytics and metrics</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Code Examples
              </CardTitle>
              <CardDescription>
                Ready-to-use code snippets for popular programming languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">JavaScript / Node.js</h3>
                <Textarea
                  readOnly
                  rows={10}
                  className="font-mono text-sm"
                  value={`const response = await fetch('https://your-project.supabase.co/functions/v1/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    gpt_id: 'your-gpt-id',
    message: 'Hello, how can you help me?',
    stream: false
  })
});

const data = await response.json();
console.log(data.response);`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Python</h3>
                <Textarea
                  readOnly
                  rows={8}
                  className="font-mono text-sm"
                  value={`import requests

response = requests.post(
    'https://your-project.supabase.co/functions/v1/api/chat',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'gpt_id': 'your-gpt-id',
        'message': 'Hello, how can you help me?',
        'stream': False
    }
)

print(response.json()['response'])`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">cURL</h3>
                <Textarea
                  readOnly
                  rows={6}
                  className="font-mono text-sm"
                  value={`curl -X POST 'https://your-project.supabase.co/functions/v1/api/chat' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "gpt_id": "your-gpt-id",
    "message": "Hello, how can you help me?",
    "stream": false
  }'`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APIAccessConfig;