import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus, 
  Activity,
  TrendingUp,
  DollarSign,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  permissions: any;
  rate_limit_rpd: number;
  usage_count: number;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface BillingUsage {
  id: string;
  service_type: string;
  usage_type: string;
  quantity: number;
  total_cost: number;
  created_at: string;
  client_id: string;
  metadata: any;
}

export const APIKeyManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [billingUsage, setBillingUsage] = useState<BillingUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showKey, setShowKey] = useState<{[key: string]: boolean}>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadAPIKeys();
      loadBillingUsage();
    }
  }, [user]);

  const loadAPIKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive"
      });
    }
  };

  const loadBillingUsage = async () => {
    try {
      // Get MSP ID for current user
      const { data: mspData } = await supabase
        .from('msps')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (mspData) {
        const { data, error } = await supabase
          .from('msp_billing_usage')
          .select('*')
          .eq('msp_id', mspData.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setBillingUsage(data || []);
      }
    } catch (error) {
      console.error('Error loading billing usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      // Generate a secure API key
      const keyValue = 'sk_' + crypto.randomUUID().replace(/-/g, '');
      const keyPrefix = keyValue.substring(0, 12) + '...';
      const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(keyValue));
      const hashString = Array.from(new Uint8Array(keyHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user?.id,
          name: newKeyName,
          key_prefix: keyPrefix,
          key_hash: hashString,
          permissions: { scan: true, analytics: false },
          rate_limit_rpd: 1000,
          rate_limit_rpm: 60
        });

      if (error) throw error;

      // Show the full key only once
      toast({
        title: "API Key Created",
        description: "Copy this key now - it won't be shown again!",
      });

      // Copy to clipboard
      await navigator.clipboard.writeText(keyValue);
      
      setNewKeyName('');
      await loadAPIKeys();

    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteAPIKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: "API Key Deleted",
        description: "The API key has been permanently deleted"
      });

      await loadAPIKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive"
      });
    }
  };

  const copyAPIKey = async (keyHash: string) => {
    try {
      await navigator.clipboard.writeText(keyHash);
      toast({
        title: "Copied",
        description: "API key copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy API key",
        variant: "destructive"
      });
    }
  };

  const getBillingStats = () => {
    const currentMonth = billingUsage.filter(usage => 
      new Date(usage.created_at).getMonth() === new Date().getMonth()
    );

    return {
      monthlyScans: currentMonth.length,
      monthlyCost: currentMonth.reduce((sum, usage) => sum + parseFloat(usage.total_cost.toString()), 0),
      totalScans: billingUsage.length,
      totalCost: billingUsage.reduce((sum, usage) => sum + parseFloat(usage.total_cost.toString()), 0)
    };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  const stats = getBillingStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Management</h2>
          <p className="text-muted-foreground">Manage API keys and monitor usage & billing</p>
        </div>
      </div>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="billing">Billing & Usage</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {/* Create New API Key */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New API Key
              </CardTitle>
              <CardDescription>
                Generate a new API key for SafeScan API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="key-name">API Key Name</Label>
                  <Input
                    id="key-name"
                    placeholder="Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={generateAPIKey} 
                    disabled={isCreating}
                    variant="hero"
                  >
                    {isCreating ? "Creating..." : "Generate Key"}
                  </Button>
                </div>
              </div>
              
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  API keys are only shown once when created. Make sure to copy and store them securely.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* API Keys List */}
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Manage your existing API keys and monitor their usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API keys found. Create your first API key above.
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{apiKey.name}</h4>
                          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                            {apiKey.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-mono">
                            {showKey[apiKey.id] ? apiKey.key_hash : apiKey.key_prefix}
                          </span>
                          <span>•</span>
                          <span>{apiKey.usage_count || 0} requests</span>
                          <span>•</span>
                          <span>{apiKey.rate_limit_rpd} req/day limit</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(apiKey.created_at).toLocaleDateString()}
                          {apiKey.last_used_at && (
                            <> • Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowKey(prev => ({ 
                            ...prev, 
                            [apiKey.id]: !prev[apiKey.id] 
                          }))}
                        >
                          {showKey[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyAPIKey(apiKey.key_hash)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAPIKey(apiKey.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          {/* Billing Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.monthlyScans}</div>
                <p className="text-xs text-muted-foreground">API Scans</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monthly Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.monthlyCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Current month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalScans}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Recent API Usage</CardTitle>
              <CardDescription>
                Track your SafeScan API usage and costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingUsage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No usage data found. Start using the API to see billing information.
                </div>
              ) : (
                <div className="space-y-2">
                  {billingUsage.slice(0, 10).map((usage) => (
                    <div key={usage.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">
                          {usage.service_type.replace('_', ' ').toUpperCase()} - {usage.usage_type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Client: {usage.client_id} • {new Date(usage.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${parseFloat(usage.total_cost.toString()).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Qty: {usage.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SafeScan API Documentation</CardTitle>
              <CardDescription>
                How to integrate SafeScan API into your applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                <code className="p-2 bg-muted rounded text-sm">
                  {window.location.origin}/functions/v1/safescan-api
                </code>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Include your API key in the request headers:
                </p>
                <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'your-api-key-here'
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Example Request</h3>
                <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`curl -X POST ${window.location.origin}/functions/v1/safescan-api \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_..." \\
  -d '{
    "type": "email",
    "content": "Suspicious email content here",
    "metadata": {
      "client_id": "client-123"
    }
  }'`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Response Format</h3>
                <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "scan_id": "uuid",
  "safe": false,
  "risk_level": "high",
  "threats_detected": ["phishing", "malware"],
  "reputation_score": 15,
  "recommendations": ["Do not open", "Report to IT"],
  "response_time_ms": 1234
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Pricing</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>$0.10 per API scan</li>
                  <li>1,000 requests per day included</li>
                  <li>Monthly billing cycle</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};