import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MonitorPlay, Settings, Clock, Play, Plus, Trash2, 
  ExternalLink, Shield, CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RemoteSessionLauncherProps {
  ticketId?: string;
  agentId?: string;
  hostname?: string;
}

const PROVIDER_CONFIGS = {
  rustdesk: {
    name: 'RustDesk',
    color: 'bg-orange-500/20 text-orange-400',
    icon: '🦀',
    defaultEndpoint: 'https://rustdesk.example.com',
  },
  screenconnect: {
    name: 'ScreenConnect',
    color: 'bg-blue-500/20 text-blue-400',
    icon: '🖥️',
    defaultEndpoint: 'https://screenconnect.example.com',
  },
  teamviewer: {
    name: 'TeamViewer',
    color: 'bg-cyan-500/20 text-cyan-400',
    icon: '👁️',
    defaultEndpoint: 'https://get.teamviewer.com',
  },
  anydesk: {
    name: 'AnyDesk',
    color: 'bg-red-500/20 text-red-400',
    icon: '🔗',
    defaultEndpoint: 'https://anydesk.com',
  },
};

export function RemoteSessionLauncher({ ticketId, agentId, hostname }: RemoteSessionLauncherProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [newProvider, setNewProvider] = useState({
    provider_name: 'rustdesk',
    api_endpoint: '',
    api_key_encrypted: '',
  });

  // Fetch configured providers
  const { data: providers = [] } = useQuery({
    queryKey: ['remote-providers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('remote_session_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch session history
  const { data: sessionHistory = [] } = useQuery({
    queryKey: ['session-history', ticketId, agentId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('remote_session_history')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (ticketId) query = query.eq('ticket_id', ticketId);
      if (agentId) query = query.eq('agent_id', agentId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Add provider mutation
  const addProviderMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('remote_session_providers').insert({
        user_id: user.id,
        provider_name: newProvider.provider_name,
        api_endpoint: newProvider.api_endpoint || PROVIDER_CONFIGS[newProvider.provider_name as keyof typeof PROVIDER_CONFIGS]?.defaultEndpoint,
        api_key_encrypted: newProvider.api_key_encrypted,
        is_default: providers.length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remote-providers'] });
      toast.success('Provider added!');
      setIsConfigOpen(false);
      setNewProvider({ provider_name: 'rustdesk', api_endpoint: '', api_key_encrypted: '' });
    },
    onError: () => toast.error('Failed to add provider')
  });

  // Delete provider mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('remote_session_providers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remote-providers'] });
      toast.success('Provider removed');
    }
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (providerId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.from('remote_session_history').insert({
        user_id: user.id,
        ticket_id: ticketId,
        agent_id: agentId,
        provider_id: providerId,
        session_id: `session-${Date.now()}`,
        technician_id: user.id,
      }).select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, providerId) => {
      queryClient.invalidateQueries({ queryKey: ['session-history'] });
      
      // Find the provider and open the remote session URL
      const provider = providers.find((p: any) => p.id === providerId);
      if (provider?.api_endpoint) {
        window.open(provider.api_endpoint, '_blank');
      }
      
      toast.success('Remote session started!');
    },
    onError: () => toast.error('Failed to start session')
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Quick Launch Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MonitorPlay className="h-5 w-5 text-green-400" />
              Remote Support
            </CardTitle>
            {hostname && (
              <CardDescription>Connect to {hostname}</CardDescription>
            )}
          </div>
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle>Configure Remote Providers</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Existing providers */}
                <div className="space-y-2">
                  {providers.map((provider: any) => {
                    const config = PROVIDER_CONFIGS[provider.provider_name as keyof typeof PROVIDER_CONFIGS];
                    return (
                      <div
                        key={provider.id}
                        className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{config?.icon || '🔗'}</span>
                          <div>
                            <p className="font-medium">{config?.name || provider.provider_name}</p>
                            <p className="text-xs text-muted-foreground">{provider.api_endpoint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {provider.is_default && (
                            <Badge variant="outline" className="text-green-400 border-green-500/50">
                              Default
                            </Badge>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteProviderMutation.mutate(provider.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add new provider */}
                <div className="border-t border-slate-700 pt-4 space-y-3">
                  <p className="text-sm font-medium">Add Provider</p>
                  <Select 
                    value={newProvider.provider_name} 
                    onValueChange={(v) => setNewProvider({ ...newProvider, provider_name: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rustdesk">🦀 RustDesk</SelectItem>
                      <SelectItem value="screenconnect">🖥️ ScreenConnect</SelectItem>
                      <SelectItem value="teamviewer">👁️ TeamViewer</SelectItem>
                      <SelectItem value="anydesk">🔗 AnyDesk</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="API Endpoint URL"
                    value={newProvider.api_endpoint}
                    onChange={(e) => setNewProvider({ ...newProvider, api_endpoint: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                  <Input
                    type="password"
                    placeholder="API Key (optional)"
                    value={newProvider.api_key_encrypted}
                    onChange={(e) => setNewProvider({ ...newProvider, api_key_encrypted: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                  <Button onClick={() => addProviderMutation.mutate()} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MonitorPlay className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No remote providers configured</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsConfigOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Provider
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {providers.map((provider: any) => {
                const config = PROVIDER_CONFIGS[provider.provider_name as keyof typeof PROVIDER_CONFIGS];
                return (
                  <Button
                    key={provider.id}
                    variant="outline"
                    className={`h-auto py-3 flex-col ${config?.color || ''}`}
                    onClick={() => startSessionMutation.mutate(provider.id)}
                  >
                    <span className="text-xl mb-1">{config?.icon || '🔗'}</span>
                    <span className="text-xs">{config?.name || provider.provider_name}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessionHistory.slice(0, 5).map((session: any) => {
                const provider = providers.find((p: any) => p.id === session.provider_id);
                const config = provider ? PROVIDER_CONFIGS[provider.provider_name as keyof typeof PROVIDER_CONFIGS] : null;
                return (
                  <div
                    key={session.id}
                    className="p-2 rounded-lg border border-slate-700 bg-slate-900/50 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{config?.icon || '🔗'}</span>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.started_at).toLocaleString()}
                        </p>
                        {session.duration_seconds && (
                          <p className="text-xs">{formatDuration(session.duration_seconds)}</p>
                        )}
                      </div>
                    </div>
                    {session.ended_at ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <Badge variant="outline" className="text-yellow-400 border-yellow-500/50 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
