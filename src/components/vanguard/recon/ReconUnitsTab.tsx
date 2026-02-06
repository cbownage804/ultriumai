import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Cpu, Wifi, WifiOff, AlertTriangle, Shield, Radar, Brain,
  Network, Plus, Search, MapPin, Building2, ChevronDown, ChevronRight,
  Eye, Flame
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';
import { useVanguardAgents, VanguardAgent } from '@/hooks/useVanguardAgents';
import { useSafeTrackAssets } from '@/hooks/useSafeTrackAssets';

const statusColors: Record<string, string> = {
  online: 'bg-green-500/20 text-green-400 border-green-500/30',
  offline: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface SiteGroup {
  id: string | null;
  name: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  agents: VanguardAgent[];
}

export function ReconUnitsTab() {
  const { agents, isLoading, refetch } = useVanguardAgents();
  const { officeLocations } = useSafeTrackAssets();
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'site' | 'list'>('site');
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set(['unassigned']));

  const reconUnits = useMemo(() => {
    return agents.filter(a => a.agent_type === 'pi_appliance');
  }, [agents]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return reconUnits;
    const q = searchQuery.toLowerCase();
    return reconUnits.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.ip_address?.toLowerCase().includes(q) ||
      a.location?.toLowerCase().includes(q)
    );
  }, [reconUnits, searchQuery]);

  const siteGroups = useMemo((): SiteGroup[] => {
    const groups: SiteGroup[] = [];

    // Group by office_location_id
    const byLocation = new Map<string | null, VanguardAgent[]>();
    for (const agent of filtered) {
      const locId = agent.office_location_id || null;
      if (!byLocation.has(locId)) byLocation.set(locId, []);
      byLocation.get(locId)!.push(agent);
    }

    // Named sites first
    for (const loc of officeLocations) {
      const siteAgents = byLocation.get(loc.id) || [];
      groups.push({
        id: loc.id,
        name: loc.name,
        city: loc.city,
        state: loc.state,
        address: loc.address,
        agents: siteAgents,
      });
      byLocation.delete(loc.id);
    }

    // Unassigned
    const unassigned = byLocation.get(null) || [];
    if (unassigned.length > 0) {
      groups.push({ id: null, name: 'Unassigned', agents: unassigned });
    }

    return groups;
  }, [filtered, officeLocations]);

  const onlineCount = reconUnits.filter(a => a.status === 'online').length;
  const scannersActive = reconUnits.filter(a => a.is_network_scanner).length;
  const totalThreats = reconUnits.reduce((s, a) => s + (a.threat_detections?.length || 0), 0);

  const toggleSite = (id: string) => {
    setExpandedSites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSites(new Set(siteGroups.map(g => g.id || 'unassigned')));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Cpu} label="Recon Units" value={reconUnits.length} color="purple" />
        <StatCard icon={Wifi} label="Online" value={onlineCount} color="green" />
        <StatCard icon={Radar} label="Scanners Active" value={scannersActive} color="cyan" />
        <StatCard icon={Shield} label="Threats Detected" value={totalThreats} color="red" />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search recon units..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/40 border-white/10 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'site' ? 'list' : 'site')}
            className="border-white/10 text-white/70"
          >
            {viewMode === 'site' ? <Building2 className="h-4 w-4 mr-1" /> : <Cpu className="h-4 w-4 mr-1" />}
            {viewMode === 'site' ? 'Site View' : 'List View'}
          </Button>
          {viewMode === 'site' && (
            <Button variant="outline" size="sm" onClick={expandAll} className="border-white/10 text-white/70">
              Expand All
            </Button>
          )}
          <Button
            onClick={() => navigate(`${basePath}/setup?type=pi`)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" /> Deploy Unit
          </Button>
        </div>
      </div>

      {reconUnits.length === 0 ? (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="py-12 text-center text-white/30">
            <Cpu className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="mb-4">No Recon Units deployed yet.</p>
            <Button
              onClick={() => navigate(`${basePath}/setup?type=pi`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" /> Deploy Recon Unit
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'site' ? (
        <div className="space-y-3">
          {siteGroups.map(group => {
            const siteKey = group.id || 'unassigned';
            const isExpanded = expandedSites.has(siteKey);
            const groupOnline = group.agents.filter(a => a.status === 'online').length;

            return (
              <Card key={siteKey} className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden">
                <button
                  onClick={() => toggleSite(siteKey)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-white/40" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-white/40" />
                    )}
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      {group.id ? (
                        <Building2 className="h-4 w-4 text-blue-400" />
                      ) : (
                        <MapPin className="h-4 w-4 text-white/40" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{group.name}</p>
                      {group.city && (
                        <p className="text-xs text-white/40">
                          {group.city}, {group.state?.toUpperCase()}
                          {group.address && ` • ${group.address}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/5 text-white/60 text-xs">
                      {group.agents.length} unit{group.agents.length !== 1 ? 's' : ''}
                    </Badge>
                    {groupOnline > 0 && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        {groupOnline} online
                      </Badge>
                    )}
                  </div>
                </button>

                {isExpanded && group.agents.length > 0 && (
                  <div className="border-t border-white/5 divide-y divide-white/5">
                    {group.agents.map(agent => (
                      <ReconUnitRow
                        key={agent.id}
                        agent={agent}
                        onClick={() => navigate(`${basePath}/pi/${agent.id}`)}
                      />
                    ))}
                  </div>
                )}

                {isExpanded && group.agents.length === 0 && (
                  <div className="border-t border-white/5 p-6 text-center text-white/30 text-sm">
                    No recon units assigned to this site.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(agent => (
            <Card key={agent.id} className="bg-black/40 border-white/10 backdrop-blur-xl">
              <ReconUnitRow agent={agent} onClick={() => navigate(`${basePath}/pi/${agent.id}`)} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReconUnitRow({ agent, onClick }: { agent: VanguardAgent; onClick: () => void }) {
  const lastHeartbeat = agent.last_heartbeat
    ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
    : 'Never';
  const StatusIcon = agent.status === 'online' ? Wifi : agent.status === 'offline' ? WifiOff : AlertTriangle;
  const threatCount = agent.threat_detections?.length || 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${agent.status === 'online' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <Cpu className={`h-4 w-4 ${agent.status === 'online' ? 'text-green-400' : 'text-red-400'}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{agent.name}</p>
          <p className="text-xs text-white/40">
            {agent.ip_address || 'No IP'} • {agent.location || 'No location'} • Last seen {lastHeartbeat}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {agent.hailo_board_name && (
          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400 hidden sm:flex">
            <Brain className="h-3 w-3 mr-1" />
            {agent.hailo_board_name}
          </Badge>
        )}
        {agent.is_network_scanner && (
          <Badge className="bg-cyan-500/10 text-cyan-400 text-xs hidden sm:flex">
            <Radar className="h-3 w-3 mr-1" /> Scanner
          </Badge>
        )}
        {threatCount > 0 && (
          <Badge className="bg-red-500/20 text-red-400 text-xs">{threatCount} threats</Badge>
        )}
        <Badge className={`text-xs ${statusColors[agent.status]}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {agent.status}
        </Badge>
      </div>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: number; color: string;
}) {
  const colorMap: Record<string, string> = {
    purple: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
    green: 'border-green-500/20 bg-green-500/10 text-green-400',
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    red: 'border-red-500/20 bg-red-500/10 text-red-400',
  };
  const iconBg = colorMap[color] || '';

  return (
    <Card className={`bg-black/40 border-${color}-500/20`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/60">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
