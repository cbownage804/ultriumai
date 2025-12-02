import { useVanguardAgents, VanguardAgent } from '@/hooks/useVanguardAgents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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
  const lastHeartbeat = agent.last_heartbeat 
    ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
    : 'Never';

  const StatusIcon = agent.status === 'online' ? Wifi : 
                     agent.status === 'offline' ? WifiOff : 
                     AlertTriangle;

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

          <div className="pt-2 border-t text-xs text-muted-foreground">
            Last heartbeat: {lastHeartbeat}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
