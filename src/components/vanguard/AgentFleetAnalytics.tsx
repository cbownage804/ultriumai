import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, Cpu, HardDrive, MemoryStick, Network, Globe, 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock,
  Server, BarChart3, PieChart, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

interface AgentStats {
  total: number;
  online: number;
  offline: number;
  degraded: number;
  byPlatform: Record<string, number>;
  byVersion: Record<string, number>;
}

interface PerformanceData {
  timestamp: string;
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  responseTime: number;
}

interface CommandStats {
  command: string;
  count: number;
  successRate: number;
  avgDuration: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899'];

export const AgentFleetAnalytics = () => {
  const [stats, setStats] = useState<AgentStats>({
    total: 0, online: 0, offline: 0, degraded: 0,
    byPlatform: {}, byVersion: {}
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [commandStats, setCommandStats] = useState<CommandStats[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch agent stats
      const { data: agents } = await supabase
        .from('vanguard_agents')
        .select('*')
        .eq('user_id', user.id);

      if (agents) {
        const now = new Date();
        const stats: AgentStats = {
          total: agents.length,
          online: 0,
          offline: 0,
          degraded: 0,
          byPlatform: {},
          byVersion: {}
        };

        agents.forEach(agent => {
          const lastSeen = new Date(agent.last_heartbeat);
          const minutesAgo = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

          if (agent.status === 'online' && minutesAgo < 5) {
            stats.online++;
          } else if (minutesAgo < 15) {
            stats.degraded++;
          } else {
            stats.offline++;
          }

          const platform = (agent as Record<string, unknown>).platform as string || 'Linux';
          stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;

          const version = agent.agent_version || 'Unknown';
          stats.byVersion[version] = (stats.byVersion[version] || 0) + 1;
        });

        setStats(stats);
      }

      // Fetch performance analytics
      const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data: analytics } = await supabase
        .from('vanguard_agent_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', startTime)
        .order('recorded_at', { ascending: true });

      if (analytics && analytics.length > 0) {
        // Group by hour
        const grouped: Record<string, { cpu: number[], memory: number[], disk: number[], response: number[] }> = {};
        
        analytics.forEach(record => {
          const hour = new Date(record.recorded_at).toISOString().slice(0, 13);
          if (!grouped[hour]) {
            grouped[hour] = { cpu: [], memory: [], disk: [], response: [] };
          }
          
          switch (record.metric_type) {
            case 'cpu': grouped[hour].cpu.push(Number(record.metric_value)); break;
            case 'memory': grouped[hour].memory.push(Number(record.metric_value)); break;
            case 'disk': grouped[hour].disk.push(Number(record.metric_value)); break;
            case 'response_time': grouped[hour].response.push(Number(record.metric_value)); break;
          }
        });

        const perfData = Object.entries(grouped).map(([timestamp, values]) => ({
          timestamp: new Date(timestamp).toLocaleString(),
          avgCpu: values.cpu.length ? values.cpu.reduce((a, b) => a + b, 0) / values.cpu.length : 0,
          avgMemory: values.memory.length ? values.memory.reduce((a, b) => a + b, 0) / values.memory.length : 0,
          avgDisk: values.disk.length ? values.disk.reduce((a, b) => a + b, 0) / values.disk.length : 0,
          responseTime: values.response.length ? values.response.reduce((a, b) => a + b, 0) / values.response.length : 0
        }));

        setPerformanceData(perfData);
      } else {
        // No analytics data - empty state
        setPerformanceData([]);
      }

      // Fetch real command stats from vanguard_agent_commands
      const { data: commands } = await supabase
        .from('vanguard_agent_commands')
        .select('command_type, status, created_at, completed_at')
        .gte('created_at', startTime);
      
      if (commands && commands.length > 0) {
        // Aggregate command stats
        const statsMap: Record<string, { count: number; success: number; durations: number[] }> = {};
        commands.forEach(cmd => {
          if (!statsMap[cmd.command_type]) {
            statsMap[cmd.command_type] = { count: 0, success: 0, durations: [] };
          }
          statsMap[cmd.command_type].count++;
          if (cmd.status === 'completed') statsMap[cmd.command_type].success++;
          if (cmd.completed_at && cmd.created_at) {
            const duration = (new Date(cmd.completed_at).getTime() - new Date(cmd.created_at).getTime()) / 1000;
            statsMap[cmd.command_type].durations.push(duration);
          }
        });
        
        const cmdStats: CommandStats[] = Object.entries(statsMap).map(([cmd, data]) => ({
          command: cmd,
          count: data.count,
          successRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
          avgDuration: data.durations.length > 0 ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length : 0
        })).sort((a, b) => b.count - a.count).slice(0, 10);
        
        setCommandStats(cmdStats);
      } else {
        setCommandStats([]);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const platformData = Object.entries(stats.byPlatform).map(([name, value]) => ({ name, value }));
  const versionData = Object.entries(stats.byVersion).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Fleet Analytics</h2>
            <p className="text-muted-foreground">Monitor agent performance and health</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Fleet Status Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-3xl font-bold text-green-500">{stats.online}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={(stats.online / stats.total) * 100} className="mt-2 h-1" />
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Degraded</p>
                <p className="text-3xl font-bold text-yellow-500">{stats.degraded}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-3xl font-bold text-red-500">{stats.offline}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Resource Usage</TabsTrigger>
          <TabsTrigger value="commands">Command Stats</TabsTrigger>
          <TabsTrigger value="distribution">Fleet Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU & Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="timestamp" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="avgCpu" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="CPU %" />
                    <Area type="monotone" dataKey="avgMemory" stackId="2" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Memory %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Time (ms)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="timestamp" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="responseTime" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Disk Usage Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="timestamp" className="text-xs" />
                  <YAxis className="text-xs" domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="avgDisk" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Disk %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Command Execution Statistics</CardTitle>
              <CardDescription>Performance metrics for agent commands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commandStats.map((cmd, idx) => (
                  <div key={cmd.command} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-48">
                      <code className="text-sm font-mono">{cmd.command}</code>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Executions</p>
                        <p className="text-lg font-semibold">{cmd.count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">{cmd.successRate}%</p>
                          {cmd.successRate >= 98 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Duration</p>
                        <p className="text-lg font-semibold">{cmd.avgDuration}s</p>
                      </div>
                    </div>
                    <Progress value={cmd.successRate} className="w-32 h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Command Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={commandStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="command" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Platform Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
              {platformData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No agents deployed yet</p>
                </div>
              )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Agent Version Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {versionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={versionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {versionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>No version data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
