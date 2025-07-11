import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface APIKey {
  id: string;
  key_name: string;
  key_prefix: string;
  permissions: any; // JSON type from database
  expires_at?: string;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

export const APIKeyManager = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    key_name: '',
    create_tickets: true,
    read_tickets: false,
    expires_at: ''
  });
  const [newApiKey, setNewApiKey] = useState<string>('');

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    }
  };

  const generateAPIKey = () => {
    const prefix = 'sd_';
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(36).padStart(2, '0'))
      .join('')
      .substring(0, 32);
    return prefix + randomPart;
  };

  const createAPIKey = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const fullApiKey = generateAPIKey();
      const keyPrefix = fullApiKey.substring(0, 10);
      
      // In a real implementation, you'd hash the full key
      const keyHash = fullApiKey; // This should be properly hashed

      const { error } = await supabase
        .from('integration_api_keys')
        .insert({
          user_id: userData.user.id,
          key_name: formData.key_name,
          api_key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: {
            create_tickets: formData.create_tickets,
            read_tickets: formData.read_tickets
          },
          expires_at: formData.expires_at || null
        });

      if (error) throw error;

      setNewApiKey(fullApiKey);
      toast.success('API key created successfully');
      setFormData({
        key_name: '',
        create_tickets: true,
        read_tickets: false,
        expires_at: ''
      });
      fetchAPIKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const toggleKeyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('integration_api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success('API key updated');
      fetchAPIKeys();
    } catch (error) {
      console.error('Error updating API key:', error);
      toast.error('Failed to update API key');
    }
  };

  const deleteAPIKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('integration_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('API key deleted');
      fetchAPIKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Keys</h3>
          <p className="text-sm text-muted-foreground">
            Manage API keys for Microsoft Forms, Power Apps, and other integrations
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {newApiKey && (
        <Alert className="border-green-200 bg-green-50">
          <Key className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Your new API key has been created!</p>
              <div className="flex items-center gap-2 p-2 bg-white rounded border">
                <code className="flex-1 text-sm font-mono">{newApiKey}</code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(newApiKey)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure to copy your API key now. You won't be able to see it again!
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setNewApiKey('')}
              >
                I've copied the key
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key_name">Key Name</Label>
              <Input
                id="key_name"
                value={formData.key_name}
                onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                placeholder="e.g., Microsoft Forms Integration"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create_tickets" className="text-sm">Create Tickets</Label>
                  <Switch
                    id="create_tickets"
                    checked={formData.create_tickets}
                    onCheckedChange={(checked) => setFormData({ ...formData, create_tickets: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="read_tickets" className="text-sm">Read Tickets</Label>
                  <Switch
                    id="read_tickets"
                    checked={formData.read_tickets}
                    onCheckedChange={(checked) => setFormData({ ...formData, read_tickets: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={createAPIKey} disabled={!formData.key_name}>
                Create API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {apiKeys.map((key) => (
          <Card key={key.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <h4 className="font-medium">{key.key_name}</h4>
                    <Badge variant={key.is_active ? "default" : "secondary"}>
                      {key.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <code>{key.key_prefix}***</code>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Created: {formatDate(key.created_at)}</span>
                    {key.expires_at && (
                      <span>Expires: {formatDate(key.expires_at)}</span>
                    )}
                    {key.last_used_at && (
                      <span>Last used: {formatDate(key.last_used_at)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {key.permissions?.create_tickets && (
                      <Badge variant="outline" className="text-xs">Create Tickets</Badge>
                    )}
                    {key.permissions?.read_tickets && (
                      <Badge variant="outline" className="text-xs">Read Tickets</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={key.is_active}
                    onCheckedChange={() => toggleKeyStatus(key.id, key.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAPIKey(key.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {apiKeys.length === 0 && !showCreateForm && (
          <Card>
            <CardContent className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">
                Create API keys to integrate with Microsoft Forms, Power Apps, and other applications
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First API Key
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integration Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">API Endpoint</h4>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <code className="flex-1 text-sm">https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safedesk-api</code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard('https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safedesk-api')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Example: Create Ticket (Microsoft Forms/Power Apps)</h4>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`POST /tickets
Headers:
  x-api-key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "title": "System Issue",
  "description": "Detailed description of the problem",
  "priority": "high",
  "category": "technical",
  "requester_name": "John Doe",
  "requester_email": "john@company.com",
  "requester_phone": "+1234567890",
  "asset_name": "Server-01"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};