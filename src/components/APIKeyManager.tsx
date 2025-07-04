import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { Key, Copy, Trash2, Plus, Eye, EyeOff, Calendar, Activity, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: any;
  rate_limit_rpm: number;
  rate_limit_rpd: number;
  expires_at?: string;
  last_used_at?: string;
  usage_count: number;
  is_active: boolean;
  gpt_id?: string;
  created_at: string;
  custom_gpts?: {
    name: string;
  };
}

export const APIKeyManager = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showFullKey, setShowFullKey] = useState(false);
  
  // Form state
  const [keyName, setKeyName] = useState("");
  const [selectedGPT, setSelectedGPT] = useState<string>("");
  const [chatPermission, setChatPermission] = useState(true);
  const [analyticsPermission, setAnalyticsPermission] = useState(false);
  const [rateLimitRpm, setRateLimitRpm] = useState(60);
  const [rateLimitRpd, setRateLimitRpd] = useState(1000);
  const [expiresAt, setExpiresAt] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { gpts } = useCustomGPTs();

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select(`
          *,
          custom_gpts(name)
        `)
        .eq('user_id', user?.id)
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
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!keyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('api-key-manager', {
        body: {
          action: 'create',
          name: keyName,
          gpt_id: selectedGPT || null,
          permissions: {
            chat: chatPermission,
            analytics: analyticsPermission
          },
          rate_limit_rpm: rateLimitRpm,
          rate_limit_rpd: rateLimitRpd,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
        }
      });

      if (error) throw error;

      setNewApiKey(data.api_key);
      setShowCreateDialog(false);
      resetForm();
      await loadApiKeys();
      
      toast({
        title: "Success",
        description: "API key created successfully",
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await loadApiKeys();
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

  const toggleApiKey = async (keyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', keyId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await loadApiKeys();
      toast({
        title: "Success",
        description: `API key ${!isActive ? 'activated' : 'deactivated'}`,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const resetForm = () => {
    setKeyName("");
    setSelectedGPT("");
    setChatPermission(true);
    setAnalyticsPermission(false);
    setRateLimitRpm(60);
    setRateLimitRpd(1000);
    setExpiresAt("");
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">
            Manage API keys for external integrations and programmatic access to your GPTs.
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for external access to your GPTs.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Name</Label>
                <Input
                  id="keyName"
                  placeholder="My App Integration"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="gptSelect">GPT (Optional)</Label>
                <Select value={selectedGPT} onValueChange={setSelectedGPT}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a GPT or leave blank for all" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All GPTs</SelectItem>
                    {gpts.map((gpt) => (
                      <SelectItem key={gpt.id} value={gpt.id}>{gpt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="chat" className="text-sm font-normal">Chat Access</Label>
                  <Switch
                    id="chat"
                    checked={chatPermission}
                    onCheckedChange={setChatPermission}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="analytics" className="text-sm font-normal">Analytics Access</Label>
                  <Switch
                    id="analytics"
                    checked={analyticsPermission}
                    onCheckedChange={setAnalyticsPermission}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rpm">Rate Limit (RPM)</Label>
                  <Input
                    id="rpm"
                    type="number"
                    value={rateLimitRpm}
                    onChange={(e) => setRateLimitRpm(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="rpd">Rate Limit (RPD)</Label>
                  <Input
                    id="rpd"
                    type="number"
                    value={rateLimitRpd}
                    onChange={(e) => setRateLimitRpd(parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="expires">Expires At (Optional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createApiKey} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Key"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* New API Key Display */}
      {newApiKey && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-primary">New API Key Created</CardTitle>
            <CardDescription>
              Save this key now. You won't be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input
                value={showFullKey ? newApiKey : `${newApiKey.substring(0, 12)}...`}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFullKey(!showFullKey)}
              >
                {showFullKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(newApiKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setNewApiKey(null)}
            >
              I've saved the key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first API key to enable external integrations.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className={isExpired(apiKey.expires_at) ? "border-destructive" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                        {apiKey.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {isExpired(apiKey.expires_at) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="font-mono">{apiKey.key_prefix}***</span>
                      {apiKey.custom_gpts?.name && (
                        <span>• {apiKey.custom_gpts.name}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span>{apiKey.usage_count} uses</span>
                      </div>
                      {apiKey.last_used_at && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Last used {formatDistanceToNow(new Date(apiKey.last_used_at))} ago</span>
                        </div>
                      )}
                      <span>RPM: {apiKey.rate_limit_rpm}</span>
                      <span>RPD: {apiKey.rate_limit_rpd}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {apiKey.permissions.chat && (
                        <Badge variant="outline">Chat</Badge>
                      )}
                      {apiKey.permissions.analytics && (
                        <Badge variant="outline">Analytics</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleApiKey(apiKey.id, apiKey.is_active)}
                    >
                      {apiKey.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{apiKey.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteApiKey(apiKey.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};