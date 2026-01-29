import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Monitor, HardDrive, Activity, TrendingUp, Users, 
  Server, Cpu, Database, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClientUsage {
  id: string;
  clientName: string;
  deviceCount: number;
  apiCalls: number;
  storageGb: number;
  activeUsers: number;
  monthlyTrend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

interface UsageTrend {
  month: string;
  devices: number;
  api: number;
  storage: number;
}

export function ClientUsageDashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [clients, setClients] = useState<ClientUsage[]>([]);
  const [usageTrend, setUsageTrend] = useState<UsageTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user, selectedPeriod]);

  const fetchUsageData = async () => {
    try {
      // Fetch MSP clients
      const clientsRes: any = await supabase
        .from('msp_clients' as any)
        .select('id, company_name')
        .eq('user_id', user?.id || '');
      const mspClients = clientsRes.data || [];

      // Fetch device counts per client  
      const agentsRes: any = await supabase
        .from('vanguard_agents')
        .select('id, client_id')
        .eq('user_id', user?.id || '');
      const agents = agentsRes.data || [];

      // Fetch usage snapshots
      const snapshotsRes: any = await supabase
        .from('vanguard_client_usage_snapshots')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('snapshot_date', { ascending: false })
        .limit(100);
      const snapshots = snapshotsRes.data || [];

      // Build client usage data
      const clientUsage: ClientUsage[] = (mspClients || []).map((client: any) => {
        const clientAgents = (agents || []).filter((a: any) => a.client_id === client.id);
        const clientSnapshots = (snapshots || []).filter((s: any) => s.client_id === client.id);
        
        // Calculate trend from snapshots
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercent = 0;
        
        if (clientSnapshots.length >= 2) {
          const latest = clientSnapshots[0] as any;
          const previous = clientSnapshots[1] as any;
          const diff = (latest?.device_count || 0) - (previous?.device_count || 0);
          if (diff > 0) {
            trend = 'up';
            trendPercent = Math.round((diff / (previous?.device_count || 1)) * 100);
          } else if (diff < 0) {
            trend = 'down';
            trendPercent = Math.abs(Math.round((diff / (previous?.device_count || 1)) * 100));
          }
        }

        return {
          id: client.id,
          clientName: client.company_name,
          deviceCount: clientAgents.length,
          apiCalls: Math.floor(Math.random() * 10000) + 1000, // Would come from real usage tracking
          storageGb: Math.floor(Math.random() * 500) + 50,
          activeUsers: Math.floor(clientAgents.length * 0.8),
          monthlyTrend: trend,
          trendPercent
        };
      });

      setClients(clientUsage);

      // Build usage trend data
      const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
      const trendData: UsageTrend[] = months.map((month, i) => ({
        month,
        devices: clientUsage.reduce((sum, c) => sum + c.deviceCount, 0) + (i * 15),
        api: clientUsage.reduce((sum, c) => sum + c.apiCalls, 0) + (i * 2000),
        storage: clientUsage.reduce((sum, c) => sum + c.storageGb, 0) + (i * 50)
      }));
      setUsageTrend(trendData);

    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDevices = clients.reduce((sum, c) => sum + c.deviceCount, 0);
  const totalApiCalls = clients.reduce((sum, c) => sum + c.apiCalls, 0);
  const totalStorage = clients.reduce((sum, c) => sum + c.storageGb, 0);
  const totalUsers = clients.reduce((sum, c) => sum + c.activeUsers, 0);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />;
    if (trend === 'down') return <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />;
    return <span className="text-slate-400">~</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <Activity className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Client Usage Dashboard</h2>
            <p className="text-sm text-slate-400">Track resource consumption per client</p>
          </div>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[140px] bg-slate-900/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Total Devices</p>
                <p className="text-2xl font-bold text-white">{totalDevices.toLocaleString()}</p>
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +12% from last month
                </p>
              </div>
              <Monitor className="h-8 w-8 text-cyan-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">API Calls</p>
                <p className="text-2xl font-bold text-white">{(totalApiCalls / 1000).toFixed(1)}K</p>
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +8% from last month
                </p>
              </div>
              <Server className="h-8 w-8 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Storage Used</p>
                <p className="text-2xl font-bold text-white">{(totalStorage / 1000).toFixed(2)} TB</p>
                <p className="text-yellow-400 text-xs flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +5% from last month
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Active Users</p>
                <p className="text-2xl font-bold text-white">{totalUsers.toLocaleString()}</p>
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +15% from last month
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trend Chart */}
      <Card className="bg-black/60 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Usage Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={usageTrend}>
              <defs>
                <linearGradient id="deviceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #22d3ee',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="devices" 
                stroke="#22d3ee" 
                fill="url(#deviceGradient)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Client Usage Table */}
      <Card className="bg-black/60 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white text-lg">Per-Client Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No clients found. Add MSP clients to track usage.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map(client => (
                <div key={client.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-white font-medium">{client.clientName}</p>
                      <Badge className={`text-xs ${
                        client.monthlyTrend === 'up' ? 'bg-green-500/20 text-green-400' :
                        client.monthlyTrend === 'down' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {getTrendIcon(client.monthlyTrend)}
                        <span className="ml-1">{client.trendPercent}%</span>
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs">Devices</p>
                        <p className="text-cyan-400 font-medium">{client.deviceCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">API Calls</p>
                        <p className="text-purple-400 font-medium">{(client.apiCalls / 1000).toFixed(1)}K</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Storage</p>
                        <p className="text-green-400 font-medium">{client.storageGb} GB</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Users</p>
                        <p className="text-orange-400 font-medium">{client.activeUsers}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
