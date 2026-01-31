import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link2, Unlink, Monitor, HardDrive, Package, Search, 
  Plus, CheckCircle2, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AssetTicketLinkerProps {
  ticketId?: string;
}

export function AssetTicketLinker({ ticketId }: AssetTicketLinkerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('devices');

  // Fetch linked assets for this ticket
  const { data: linkedAssets = [] } = useQuery({
    queryKey: ['ticket-assets', ticketId],
    queryFn: async () => {
      if (!ticketId || !user?.id) return [];
      const { data, error } = await supabase
        .from('ticket_assets')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!ticketId && !!user?.id
  });

  // Fetch available devices
  const { data: devices = [] } = useQuery({
    queryKey: ['available-devices', user?.id, searchQuery],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('vanguard_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('hostname', { ascending: true })
        .limit(50);
      
      if (searchQuery) {
        query = query.ilike('hostname', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch available assets
  const { data: assets = [] } = useQuery({
    queryKey: ['available-assets', user?.id, searchQuery],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
        .limit(50);
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Link asset mutation
  const linkMutation = useMutation({
    mutationFn: async ({ assetId, agentId, assetType }: { assetId?: string; agentId?: string; assetType: string }) => {
      if (!user?.id || !ticketId) throw new Error('Missing required data');
      
      const { error } = await supabase.from('ticket_assets').insert({
        user_id: user.id,
        ticket_id: ticketId,
        asset_id: assetId,
        agent_id: agentId,
        asset_type: assetType,
        linked_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-assets'] });
      toast.success('Asset linked to ticket');
    },
    onError: () => toast.error('Failed to link asset')
  });

  // Unlink asset mutation
  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ticket_assets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-assets'] });
      toast.success('Asset unlinked');
    }
  });

  const isDeviceLinked = (deviceId: string) => 
    linkedAssets.some((a: any) => a.agent_id === deviceId);

  const isAssetLinked = (assetId: string) => 
    linkedAssets.some((a: any) => a.asset_id === assetId);

  const getDeviceStatus = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60;
    return diffMinutes < 5 ? 'online' : diffMinutes < 30 ? 'idle' : 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-indigo-400" />
            Linked Assets
          </CardTitle>
          <CardDescription>Assets and devices associated with this ticket</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Link Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle>Link Asset or Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets and devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-800/50">
                  <TabsTrigger value="devices">
                    <Monitor className="h-4 w-4 mr-2" />
                    Devices ({devices.length})
                  </TabsTrigger>
                  <TabsTrigger value="assets">
                    <Package className="h-4 w-4 mr-2" />
                    Assets ({assets.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="devices" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {devices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No devices found</p>
                        </div>
                      ) : (
                        devices.map((device: any) => {
                          const status = getDeviceStatus(device.last_seen);
                          const linked = isDeviceLinked(device.id);
                          return (
                            <div
                              key={device.id}
                              className={`p-3 rounded-lg border flex items-center justify-between ${
                                linked 
                                  ? 'border-green-500/50 bg-green-500/10' 
                                  : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-slate-700">
                                  <Monitor className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                  <p className="font-medium">{device.hostname}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className={`h-2 w-2 rounded-full ${getStatusColor(status)}`} />
                                    <span className="capitalize">{status}</span>
                                    <span>•</span>
                                    <span>{device.os_type}</span>
                                  </div>
                                </div>
                              </div>
                              {linked ? (
                                <Badge variant="outline" className="text-green-400 border-green-500/50">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Linked
                                </Badge>
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={() => linkMutation.mutate({ agentId: device.id, assetType: 'device' })}
                                >
                                  <Link2 className="h-4 w-4 mr-1" />
                                  Link
                                </Button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="assets" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {assets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No assets found</p>
                        </div>
                      ) : (
                        assets.map((asset: any) => {
                          const linked = isAssetLinked(asset.id);
                          return (
                            <div
                              key={asset.id}
                              className={`p-3 rounded-lg border flex items-center justify-between ${
                                linked 
                                  ? 'border-green-500/50 bg-green-500/10' 
                                  : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-slate-700">
                                  <HardDrive className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                  <p className="font-medium">{asset.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {asset.asset_tag && <span>#{asset.asset_tag}</span>}
                                    {asset.manufacturer && <span>• {asset.manufacturer}</span>}
                                    {asset.model && <span>{asset.model}</span>}
                                  </div>
                                </div>
                              </div>
                              {linked ? (
                                <Badge variant="outline" className="text-green-400 border-green-500/50">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Linked
                                </Badge>
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={() => linkMutation.mutate({ assetId: asset.id, assetType: 'asset' })}
                                >
                                  <Link2 className="h-4 w-4 mr-1" />
                                  Link
                                </Button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {linkedAssets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No assets linked to this ticket</p>
            <p className="text-xs">Link devices or assets for full context</p>
          </div>
        ) : (
          <div className="space-y-2">
            {linkedAssets.map((link: any) => (
              <div
                key={link.id}
                className="p-3 rounded-lg border border-slate-700 bg-slate-900/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-700">
                    {link.asset_type === 'device' ? (
                      <Monitor className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Package className="h-4 w-4 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {link.agent_id?.slice(0, 8) || link.asset_id?.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{link.asset_type}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => unlinkMutation.mutate(link.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
