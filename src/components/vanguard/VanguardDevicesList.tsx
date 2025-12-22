import { useState } from 'react';
import { useVanguardAgents, VanguardAgent } from '@/hooks/useVanguardAgents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  RefreshCw,
  Plus,
  Zap,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500'
};

const statusBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  online: 'default',
  offline: 'secondary',
  warning: 'outline',
  critical: 'destructive'
};

export function VanguardDevicesList() {
  const { agents, isLoading, refetch } = useVanguardAgents();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Vanguard Devices</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vanguard Devices</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/vanguard/setup')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Vanguard Devices</h3>
            <p className="text-muted-foreground mb-4">
              Connect your first Vanguard appliance to start monitoring.
            </p>
            <Button onClick={() => navigate('/vanguard/setup')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <DeviceCard 
              key={agent.id} 
              agent={agent} 
              onClick={() => navigate(`/vanguard/devices/${agent.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeviceCard({ agent, onClick }: { agent: VanguardAgent; onClick: () => void }) {
  const [isTesting, setIsTesting] = useState(false);
  
  const lastHeartbeat = agent.last_heartbeat 
    ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
    : 'Never';

  const StatusIcon = agent.status === 'online' ? Wifi : 
                     agent.status === 'offline' ? WifiOff : 
                     AlertTriangle;

  const testConnection = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    setIsTesting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('vanguard-agent-api?action=send_command', {
        body: { 
          agent_id: agent.id, 
          command_type: 'ping',
          payload: { timestamp: Date.now() }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success(`Ping command queued for ${agent.name}`, {
        description: 'Waiting for agent response...'
      });
    } catch (err: any) {
      toast.error('Test failed', {
        description: err.message || 'Could not reach agent'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            {agent.name}
          </CardTitle>
          <Badge variant={statusBadgeVariants[agent.status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {agent.location || 'No location set'}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{agent.ip_address || 'No IP'}</span>
            <span>•</span>
            <span>v{agent.agent_version || '?'}</span>
          </div>

          {agent.hailo_board_name && (
            <div className="text-xs bg-muted/50 px-2 py-1 rounded inline-block">
              Hailo: {agent.hailo_board_name}
            </div>
          )}

          <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Last heartbeat: {lastHeartbeat}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testConnection}
              disabled={isTesting}
              className="h-7 text-xs"
            >
              {isTesting ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Zap className="h-3 w-3 mr-1" />
              )}
              {isTesting ? 'Testing...' : 'Test'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
