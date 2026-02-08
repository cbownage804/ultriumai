import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2,
  Cpu,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  ShoppingCart,
  Server,
  HardDrive,
} from 'lucide-react';

interface ReconAgent {
  id: string;
  name: string;
  device_id: string;
  agent_type: string | null;
  agent_version: string | null;
  firmware_version: string | null;
  status: string;
  last_heartbeat: string | null;
  ip_address: unknown;
  client_id: string | null;
}

interface OrgOption {
  id: string;
  company_name: string;
}

interface ReconHardwareManagementProps {
  onShowPurchase: () => void;
}

export const ReconHardwareManagement = ({ onShowPurchase }: ReconHardwareManagementProps) => {
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');

  // Fetch orgs (msp_clients via msps)
  const { data: orgs = [] } = useQuery({
    queryKey: ['recon-orgs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: msp } = await supabase
        .from('msps')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!msp) return [];
      const { data } = await supabase
        .from('msp_clients')
        .select('id, company_name')
        .eq('msp_id', msp.id)
        .eq('is_active', true)
        .order('company_name');
      return (data || []) as OrgOption[];
    },
    enabled: !!user,
  });

  // Fetch recon agents (Linux-based devices assigned to user's orgs)
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['recon-agents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('vanguard_agents')
        .select('id, name, device_id, agent_type, agent_version, firmware_version, status, last_heartbeat, ip_address, client_id')
        .eq('user_id', user.id);
      // Filter to linux-like agents client-side since os_type doesn't exist
      return (data || []) as unknown as ReconAgent[];
    },
    enabled: !!user,
  });

  // Fetch inventory items linked to agents
  const { data: inventory = [] } = useQuery({
    queryKey: ['recon-inventory-linked'],
    queryFn: async () => {
      const { data } = await supabase
        .from('recon_inventory')
        .select('*');
      return data || [];
    },
  });

  const filteredAgents = selectedOrgId === 'all'
    ? agents
    : agents.filter(a => a.client_id === selectedOrgId);

  const getOrgName = (clientId: string | null) => {
    if (!clientId) return 'Unassigned';
    return orgs.find(o => o.id === clientId)?.company_name || 'Unknown';
  };

  const getInventoryForAgent = (agentId: string) => {
    return inventory.find(i => (i as any).agent_id === agentId);
  };

  const isOnline = (lastHeartbeat: string | null) => {
    if (!lastHeartbeat) return false;
    const diff = Date.now() - new Date(lastHeartbeat).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const formatLastSeen = (lastHeartbeat: string | null) => {
    if (!lastHeartbeat) return 'Never';
    const diff = Date.now() - new Date(lastHeartbeat).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Recon Hardware</h2>
          <p className="text-sm text-muted-foreground">
            Manage your deployed Recon units across organizations
          </p>
        </div>
        <Button
          onClick={onShowPurchase}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Purchase New Unit
        </Button>
      </div>

      {/* Org Selector */}
      <div className="flex items-center gap-3">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
          <SelectTrigger className="w-64 bg-card border-border">
            <SelectValue placeholder="Filter by organization..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {orgs.map(org => (
              <SelectItem key={org.id} value={org.id}>
                {org.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-muted-foreground">
          {filteredAgents.length} unit{filteredAgents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Device Cards */}
      {filteredAgents.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Cpu className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Recon Units Found
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {selectedOrgId !== 'all'
                ? 'This organization has no Recon units assigned. Purchase one to get started.'
                : 'You don\'t have any Recon units yet. Purchase one to secure your network.'}
            </p>
            <Button
              onClick={onShowPurchase}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Get Your First Recon Unit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map(agent => {
            const online = isOnline(agent.last_heartbeat);
            const inv = getInventoryForAgent(agent.id);

            return (
              <Card
                key={agent.id}
                className={`bg-card/50 border transition-colors ${
                  online ? 'border-cyan-500/30 hover:border-cyan-500/50' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Server className="h-4 w-4 text-cyan-500" />
                      {agent.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        online
                          ? 'bg-green-500/10 text-green-400 border-green-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }
                    >
                      {online ? (
                        <><Wifi className="h-3 w-3 mr-1" /> Online</>
                      ) : (
                        <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Organization
                    </span>
                    <span className="text-foreground font-medium">
                      {getOrgName(agent.client_id)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5" /> Type
                    </span>
                    <span className="text-foreground">
                      {agent.agent_type || 'Recon Unit'}
                    </span>
                  </div>
                  {agent.ip_address && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" /> IP
                      </span>
                      <span className="text-foreground font-mono text-xs">
                        {String(agent.ip_address)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Last Seen
                    </span>
                    <span className="text-foreground">
                      {formatLastSeen(agent.last_heartbeat)}
                    </span>
                  </div>
                  {inv && (
                    <>
                      <div className="border-t border-border pt-2 mt-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Serial</span>
                        <span className="text-foreground font-mono text-xs">
                          {(inv as any).serial_number}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tier</span>
                        <Badge variant="outline" className="text-xs">
                          {(inv as any).hardware_tier}
                        </Badge>
                      </div>
                    </>
                  )}
                  <div className="text-xs text-muted-foreground/60 font-mono pt-1">
                    {agent.device_id}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
