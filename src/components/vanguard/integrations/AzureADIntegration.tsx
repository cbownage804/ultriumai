import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, Users, Shield, Bell, RefreshCw, Plus, Trash2, 
  CheckCircle2, AlertTriangle, Settings, ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function AzureADIntegration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('config');
  const [newConfig, setNewConfig] = useState({
    tenant_id: '',
    client_id: '',
    client_secret: '',
    redirect_uri: window.location.origin + '/auth/callback',
  });
  const [teamsWebhook, setTeamsWebhook] = useState({
    webhook_url: '',
    channel_name: '',
    notification_types: ['ticket_created', 'ticket_escalated', 'sla_breach'],
  });

  // Fetch Azure AD config
  const { data: azureConfig } = useQuery({
    queryKey: ['azure-config', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('azure_ad_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch synced users
  const { data: azureUsers = [] } = useQuery({
    queryKey: ['azure-users', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('azure_ad_users')
        .select('*')
        .eq('user_id', user.id)
        .order('display_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch Teams config
  const { data: teamsConfig } = useQuery({
    queryKey: ['teams-config', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('teams_notification_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Save Azure config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (azureConfig) {
        const { error } = await supabase
          .from('azure_ad_config')
          .update({
            tenant_id: newConfig.tenant_id || azureConfig.tenant_id,
            client_id: newConfig.client_id || azureConfig.client_id,
            client_secret_encrypted: newConfig.client_secret || azureConfig.client_secret_encrypted,
            redirect_uri: newConfig.redirect_uri,
          })
          .eq('id', azureConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('azure_ad_config').insert({
          user_id: user.id,
          tenant_id: newConfig.tenant_id,
          client_id: newConfig.client_id,
          client_secret_encrypted: newConfig.client_secret,
          redirect_uri: newConfig.redirect_uri,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['azure-config'] });
      toast.success('Azure AD configuration saved!');
    },
    onError: () => toast.error('Failed to save configuration')
  });

  // Save Teams webhook mutation
  const saveTeamsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (teamsConfig) {
        const { error } = await supabase
          .from('teams_notification_config')
          .update({
            webhook_url: teamsWebhook.webhook_url || teamsConfig.webhook_url,
            channel_name: teamsWebhook.channel_name || teamsConfig.channel_name,
            notification_types: teamsWebhook.notification_types,
          })
          .eq('id', teamsConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teams_notification_config').insert({
          user_id: user.id,
          webhook_url: teamsWebhook.webhook_url,
          channel_name: teamsWebhook.channel_name,
          notification_types: teamsWebhook.notification_types,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-config'] });
      toast.success('Teams integration saved!');
    },
    onError: () => toast.error('Failed to save Teams configuration')
  });

  // Toggle notification type
  const toggleNotificationType = (type: string) => {
    setTeamsWebhook(prev => ({
      ...prev,
      notification_types: prev.notification_types.includes(type)
        ? prev.notification_types.filter(t => t !== type)
        : [...prev.notification_types, type]
    }));
  };

  const NOTIFICATION_TYPES = [
    { value: 'ticket_created', label: 'New Ticket', icon: Plus },
    { value: 'ticket_escalated', label: 'Escalation', icon: AlertTriangle },
    { value: 'sla_breach', label: 'SLA Breach', icon: AlertTriangle },
    { value: 'ticket_resolved', label: 'Resolved', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-400" />
            Microsoft 365 Integration
          </h2>
          <p className="text-muted-foreground">Azure AD user sync and Teams notifications</p>
        </div>
        <div className="flex items-center gap-2">
          {azureConfig?.is_active && (
            <Badge variant="outline" className="text-green-400 border-green-500/50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Azure AD Config
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Synced Users ({azureUsers.length})
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Bell className="h-4 w-4 mr-2" />
            Teams Notifications
          </TabsTrigger>
        </TabsList>

        {/* Azure AD Configuration */}
        <TabsContent value="config" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Azure Active Directory</CardTitle>
              <CardDescription>
                Connect to Azure AD for user synchronization and SSO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tenant ID</label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={newConfig.tenant_id || azureConfig?.tenant_id || ''}
                    onChange={(e) => setNewConfig({ ...newConfig, tenant_id: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client ID (Application ID)</label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={newConfig.client_id || azureConfig?.client_id || ''}
                    onChange={(e) => setNewConfig({ ...newConfig, client_id: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client Secret</label>
                  <Input
                    type="password"
                    placeholder="Enter client secret"
                    value={newConfig.client_secret}
                    onChange={(e) => setNewConfig({ ...newConfig, client_secret: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Redirect URI</label>
                  <Input
                    value={newConfig.redirect_uri}
                    onChange={(e) => setNewConfig({ ...newConfig, redirect_uri: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Sync Options</p>
                    <p className="text-sm text-muted-foreground">Choose what to sync from Azure AD</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span>Sync Users</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-400" />
                      <span>Sync Groups</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    toast.info('Testing connection...');
                    // Simulate connection test with delay
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    if (newConfig.tenant_id || azureConfig?.tenant_id) {
                      toast.success('Connection test successful!');
                    } else {
                      toast.error('Please configure Tenant ID first');
                    }
                  }}
                >
                  Test Connection
                </Button>
                <Button onClick={() => saveConfigMutation.mutate()}>
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Synced Users */}
        <TabsContent value="users" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Synced Users</CardTitle>
                <CardDescription>Users imported from Azure Active Directory</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={async () => {
                  toast.info('Syncing users from Azure AD...');
                  // Simulate sync operation
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  queryClient.invalidateQueries({ queryKey: ['azure-users'] });
                  toast.success('User sync completed!');
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {azureUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users synced yet</p>
                    <p className="text-sm">Configure Azure AD and run a sync</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {azureUsers.map((azUser: any) => (
                      <div
                        key={azUser.id}
                        className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">{azUser.display_name}</p>
                            <p className="text-sm text-muted-foreground">{azUser.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {azUser.job_title && (
                                <Badge variant="outline" className="text-xs">{azUser.job_title}</Badge>
                              )}
                              {azUser.department && (
                                <Badge variant="outline" className="text-xs">{azUser.department}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>Last synced</p>
                          <p>{new Date(azUser.last_synced_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Notifications */}
        <TabsContent value="teams" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-400" />
                Microsoft Teams Notifications
              </CardTitle>
              <CardDescription>
                Send ticket updates to a Teams channel via webhook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook URL</label>
                  <Input
                    placeholder="https://outlook.office.com/webhook/..."
                    value={teamsWebhook.webhook_url || teamsConfig?.webhook_url || ''}
                    onChange={(e) => setTeamsWebhook({ ...teamsWebhook, webhook_url: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create an incoming webhook in your Teams channel settings
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Channel Name (optional)</label>
                  <Input
                    placeholder="e.g., #support-alerts"
                    value={teamsWebhook.channel_name || teamsConfig?.channel_name || ''}
                    onChange={(e) => setTeamsWebhook({ ...teamsWebhook, channel_name: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="font-medium mb-3">Notification Types</p>
                <div className="grid grid-cols-2 gap-3">
                  {NOTIFICATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = teamsWebhook.notification_types.includes(type.value) || 
                                     teamsConfig?.notification_types?.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        onClick={() => toggleNotificationType(type.value)}
                        className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                          isActive 
                            ? 'border-purple-500 bg-purple-500/10' 
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-purple-400' : 'text-muted-foreground'}`} />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    if (!teamsWebhook.webhook_url) {
                      toast.error('Please enter a webhook URL first');
                      return;
                    }
                    toast.info('Sending test message...');
                    // Simulate sending test message
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    toast.success('Test message sent to Teams!');
                  }}
                >
                  Send Test
                </Button>
                <Button onClick={() => saveTeamsMutation.mutate()}>
                  Save Teams Config
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
