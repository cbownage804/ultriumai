import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff,
  Trash2,
  Activity,
  Clock,
  Globe,
  BarChart3
} from 'lucide-react';

interface APIKey {
  id: string;
  key_name: string;
  key_prefix: string;
  permissions: any;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  last_used_at?: string;
  usage_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

interface APIUsage {
  id: string;
  endpoint: string;
  method: string;
  response_status: number;
  response_time_ms: number;
  created_at: string;
}

interface MSPAPIManagementProps {
  mspId: string;
}

export const MSPAPIManagement: React.FC<MSPAPIManagementProps> = ({ mspId }) => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [apiUsage, setApiUsage] = useState<APIUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadAPIKeys();
    loadAPIUsage();
  }, [mspId]);

  const loadAPIKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('msp_api_keys')
        .select('*')
        .eq('msp_id', mspId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
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

  const loadAPIUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('msp_api_usage')
        .select('*')
        .in('api_key_id', apiKeys.map(k => k.id))
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setApiUsage(data || []);
    } catch (error) {
      console.error('Error loading API usage:', error);
    }
  };

  const generateAPIKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'msp_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createAPIKey = async (keyData: any) => {
    try {
      const fullKey = generateAPIKey();
      const keyPrefix = fullKey.substring(0, 12) + '...';
      
      // In production, you'd hash the full key
      const keyHash = btoa(fullKey); // Simple base64 encoding for demo

      const { data, error } = await supabase
        .from('msp_api_keys')
        .insert({
          msp_id: mspId,
          key_name: keyData.name,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          permissions: keyData.permissions,
          rate_limit_per_hour: keyData.rateLimitHour,
          rate_limit_per_day: keyData.rateLimitDay,
          expires_at: keyData.expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys(prev => [data, ...prev]);
      
      // Show the full key to the user (only time they'll see it)
      toast({
        title: "API Key Created",
        description: "Copy this key now - you won't see it again!",
      });

      // Store the full key temporarily for display
      setShowKeys(prev => ({ ...prev, [data.id]: true }));
      
      return { ...data, full_key: fullKey };
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
      return null;
    }
  };

  const toggleAPIKey = async (keyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('msp_api_keys')
        .update({ is_active: isActive })
        .eq('id', keyId);

      if (error) throw error;

      setApiKeys(prev => 
        prev.map(k => k.id === keyId ? { ...k, is_active: isActive } : k)
      );

      toast({
        title: "Success",
        description: `API key ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive",
      });
    }
  };

  const deleteAPIKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('msp_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const APIKeyForm = ({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState({
      name: '',
      permissions: { read: true, write: false },
      rateLimitHour: 1000,
      rateLimitDay: 10000,
      expiresAt: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
      onCancel();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">API Key Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter a descriptive name"
            required
          />
        </div>

        <div>
          <Label>Permissions</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="read"
                checked={formData.permissions.read}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    permissions: { ...prev.permissions, read: checked }
                  }))
                }
              />
              <Label htmlFor="read">Read Access</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="write"
                checked={formData.permissions.write}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    permissions: { ...prev.permissions, write: checked }
                  }))
                }
              />
              <Label htmlFor="write">Write Access</Label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hourly">Hourly Rate Limit</Label>
            <Input
              id="hourly"
              type="number"
              value={formData.rateLimitHour}
              onChange={(e) => setFormData(prev => ({ ...prev, rateLimitHour: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="daily">Daily Rate Limit</Label>
            <Input
              id="daily"
              type="number"
              value={formData.rateLimitDay}
              onChange={(e) => setFormData(prev => ({ ...prev, rateLimitDay: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="expires">Expiration Date (Optional)</Label>
          <Input
            id="expires"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Create API Key
          </Button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Management</h2>
          <p className="text-muted-foreground">
            Manage API keys for third-party integrations and monitor usage
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
            </DialogHeader>
            <APIKeyForm 
              onSubmit={createAPIKey}
              onCancel={() => setIsCreating(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Total API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{apiKeys.length}</div>
            <p className="text-sm text-muted-foreground">
              {apiKeys.filter(k => k.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {apiKeys.reduce((sum, key) => sum + key.usage_count, 0)}
            </div>
            <p className="text-sm text-muted-foreground">
              All time usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{apiUsage.length}</div>
            <p className="text-sm text-muted-foreground">
              Requests today
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage your API keys and access tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API key to enable third-party integrations
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{apiKey.key_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(apiKey.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                        {apiKey.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch
                        checked={apiKey.is_active}
                        onCheckedChange={(checked) => toggleAPIKey(apiKey.id, checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">API Key:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {showKeys[apiKey.id] ? `${apiKey.key_prefix}${'*'.repeat(20)}` : apiKey.key_prefix}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowKeys(prev => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))}
                        >
                          {showKeys[apiKey.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(apiKey.key_prefix)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Usage:</span>
                        <div className="font-medium">{apiKey.usage_count} requests</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rate Limit:</span>
                        <div className="font-medium">{apiKey.rate_limit_per_hour}/hour</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Permissions:</span>
                        <div className="font-medium">
                          {apiKey.permissions?.read ? 'Read' : ''} 
                          {apiKey.permissions?.read && apiKey.permissions?.write ? ', ' : ''} 
                          {apiKey.permissions?.write ? 'Write' : ''}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Used:</span>
                        <div className="font-medium">
                          {apiKey.last_used_at 
                            ? new Date(apiKey.last_used_at).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                      </div>
                    </div>

                    {apiKey.expires_at && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="font-medium ml-1">
                          {new Date(apiKey.expires_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-3">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteAPIKey(apiKey.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {apiUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent API Usage
            </CardTitle>
            <CardDescription>
              Latest API requests and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {apiUsage.slice(0, 10).map((usage) => (
                <div key={usage.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant={usage.response_status < 400 ? 'default' : 'destructive'}>
                      {usage.response_status}
                    </Badge>
                    <span className="text-sm font-medium">{usage.method}</span>
                    <span className="text-sm text-muted-foreground">{usage.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{usage.response_time_ms}ms</span>
                    <span>{new Date(usage.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};