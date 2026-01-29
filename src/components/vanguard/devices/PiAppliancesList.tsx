/**
 * Recon Units List Component
 * Full security appliance features: Scanner, HAILO AI, Firewall, Traffic Analysis
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Shield,
  Radar,
  Activity,
  Brain,
  Network,
  Plus,
  Search,
  RefreshCw,
  Flame,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { VanguardAgent } from '@/hooks/useVanguardAgents';

const statusColors: Record<string, string> = {
  online: 'bg-green-500/20 text-green-400 border-green-500/30',
  offline: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30'
};

interface PiAppliancesListProps {
  agents: VanguardAgent[];
  isLoading: boolean;
}

export function PiAppliancesList({ agents, isLoading }: PiAppliancesListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(a => 
      a.name.toLowerCase().includes(query) ||
      a.ip_address?.toLowerCase().includes(query) ||
      a.location?.toLowerCase().includes(query) ||
      a.hailo_board_name?.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  // Aggregate stats
  const totalThreats = agents.reduce((sum, a) => {
    const threats = a.threat_detections?.length || 0;
    return sum + threats;
  }, 0);
  
  const onlineCount = agents.filter(a => a.status === 'online').length;
  const scannersActive = agents.filter(a => a.is_network_scanner).length;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i} className="bg-black/40 border-purple-500/20">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4 bg-white/10" />
              <Skeleton className="h-4 w-24 mb-2 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Cpu className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{agents.length}</p>
                <p className="text-xs text-white/60">Recon Units</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Wifi className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{onlineCount}</p>
                <p className="text-xs text-white/60">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Radar className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{scannersActive}</p>
                <p className="text-xs text-white/60">Scanners Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Shield className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalThreats}</p>
                <p className="text-xs text-white/60">Threats Detected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search by name, IP, or HAILO model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/40 border-purple-500/20 text-white"
          />
        </div>
        <Button 
          onClick={() => navigate('/vanguard/setup?type=pi')}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Deploy Recon Unit
        </Button>
      </div>

      {/* Appliances Grid */}
      {agents.length === 0 ? (
        <Card className="bg-black/40 border-purple-500/20">
          <CardContent className="p-12 text-center">
            <Cpu className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <h3 className="text-lg font-semibold mb-2 text-white">No Recon Units</h3>
            <p className="text-white/60 mb-4">
              Deploy a HAILO-powered Recon Unit to enable advanced threat detection and network scanning.
            </p>
            <Button 
              onClick={() => navigate('/vanguard/setup?type=pi')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Deploy Recon Unit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAgents.map(agent => (
            <PiApplianceCard 
              key={agent.id} 
              agent={agent}
              onClick={() => navigate(`/vanguard/pi/${agent.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PiApplianceCard({
  agent,
  onClick,
}: {
  agent: VanguardAgent;
  onClick: () => void;
}) {
  const lastHeartbeat = agent.last_heartbeat 
    ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
    : 'Never';

  const StatusIcon = agent.status === 'online' ? Wifi : 
                     agent.status === 'offline' ? WifiOff : 
                     AlertTriangle;

  const isScanner = agent.is_network_scanner;
  const threatCount = agent.threat_detections?.length || 0;
  const mlModel = agent.ml_model_version || 'v1.0';
  const inferenceStats = agent.inference_stats || {};

  return (
    <Card 
      className="cursor-pointer transition-all bg-black/40 border-purple-500/20 hover:border-purple-500/50"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${agent.status === 'online' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Cpu className={`h-5 w-5 ${agent.status === 'online' ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <CardTitle className="text-lg text-white">{agent.name}</CardTitle>
              <div className="text-xs text-white/40">
                {agent.location || 'No location'} • {agent.ip_address || 'No IP'}
              </div>
            </div>
          </div>
          <Badge className={statusColors[agent.status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* HAILO Info */}
        <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
          <Brain className="h-5 w-5 text-purple-400" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                {agent.hailo_board_name || 'HAILO-8'}
              </span>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                {mlModel}
              </Badge>
            </div>
            <div className="text-xs text-white/40 mt-1">
              {inferenceStats.fps || 0} FPS • {inferenceStats.latency || 0}ms latency
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2">
          {isScanner && (
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              <Radar className="h-3 w-3 mr-1" />
              Network Scanner
            </Badge>
          )}
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Eye className="h-3 w-3 mr-1" />
            Threat Detection
          </Badge>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Flame className="h-3 w-3 mr-1" />
            Firewall
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Network className="h-3 w-3 mr-1" />
            Traffic Analysis
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-800/30 rounded">
            <div className="text-lg font-bold text-white">{threatCount}</div>
            <div className="text-xs text-white/40">Threats</div>
          </div>
          <div className="p-2 bg-slate-800/30 rounded">
            <div className="text-lg font-bold text-white">{agent.cpu_usage?.toFixed(0) || 0}%</div>
            <div className="text-xs text-white/40">CPU</div>
          </div>
          <div className="p-2 bg-slate-800/30 rounded">
            <div className="text-lg font-bold text-white">{agent.memory_usage?.toFixed(0) || 0}%</div>
            <div className="text-xs text-white/40">Memory</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-xs text-white/40">
          <span>Last seen: {lastHeartbeat}</span>
          <span>v{agent.agent_version || agent.firmware_version || '?'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
