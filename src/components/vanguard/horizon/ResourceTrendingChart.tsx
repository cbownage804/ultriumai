import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { format, subHours, subDays } from 'date-fns';
import { Cpu, MemoryStick, HardDrive, TrendingUp } from 'lucide-react';

interface MetricPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
}

interface ResourceTrendingChartProps {
  deviceId?: string;
}

export function ResourceTrendingChart({ deviceId }: ResourceTrendingChartProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [data, setData] = useState<MetricPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Calculate time range
        let startTime: Date;
        switch (timeRange) {
          case '1h':
            startTime = subHours(new Date(), 1);
            break;
          case '7d':
            startTime = subDays(new Date(), 7);
            break;
          default:
            startTime = subHours(new Date(), 24);
        }

        // Build query
        let query = supabase
          .from('vanguard_agent_metrics')
          .select('agent_id, cpu_percent, memory_percent, disk_percent, recorded_at')
          .gte('recorded_at', startTime.toISOString())
          .order('recorded_at', { ascending: true });

        if (deviceId) {
          query = query.eq('agent_id', deviceId);
        }

        const { data: metricsData, error } = await query;

        if (error) throw error;

        // Aggregate metrics by time bucket
        const bucketSize = timeRange === '1h' ? 5 : timeRange === '24h' ? 60 : 360; // minutes
        const buckets = new Map<string, { cpu: number[]; memory: number[]; disk: number[] }>();

        (metricsData || []).forEach(m => {
          const timestamp = new Date(m.recorded_at);
          const bucketTime = new Date(
            Math.floor(timestamp.getTime() / (bucketSize * 60 * 1000)) * (bucketSize * 60 * 1000)
          );
          const bucketKey = bucketTime.toISOString();

          if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, { cpu: [], memory: [], disk: [] });
          }

          const bucket = buckets.get(bucketKey)!;
          if (m.cpu_percent != null) bucket.cpu.push(m.cpu_percent);
          if (m.memory_percent != null) bucket.memory.push(m.memory_percent);
          if (m.disk_percent != null) bucket.disk.push(m.disk_percent);
        });

        // Calculate averages per bucket
        const chartData: MetricPoint[] = Array.from(buckets.entries())
          .map(([timestamp, values]) => ({
            timestamp,
            cpu: values.cpu.length > 0 ? Math.round(values.cpu.reduce((a, b) => a + b, 0) / values.cpu.length) : 0,
            memory: values.memory.length > 0 ? Math.round(values.memory.reduce((a, b) => a + b, 0) / values.memory.length) : 0,
            disk: values.disk.length > 0 ? Math.round(values.disk.reduce((a, b) => a + b, 0) / values.disk.length) : 0,
          }))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setData(chartData);
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [user, deviceId, timeRange]);

  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case '1h':
        return format(date, 'HH:mm');
      case '24h':
        return format(date, 'HH:mm');
      case '7d':
        return format(date, 'MMM d');
      default:
        return format(date, 'HH:mm');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">
            {format(new Date(label), 'MMM d, HH:mm')}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="capitalize">{entry.name}:</span>
              <span className="font-semibold">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-500" />
              Resource Trends
            </CardTitle>
            <CardDescription>
              {deviceId ? 'Device resource utilization over time' : 'Fleet-wide average resource utilization'}
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(v: '1h' | '24h' | '7d') => setTimeRange(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No metrics data available for this time range
          </div>
        ) : (
          <Tabs defaultValue="combined">
            <TabsList className="mb-4">
              <TabsTrigger value="combined">Combined</TabsTrigger>
              <TabsTrigger value="cpu">CPU</TabsTrigger>
              <TabsTrigger value="memory">Memory</TabsTrigger>
              <TabsTrigger value="disk">Disk</TabsTrigger>
            </TabsList>

            <TabsContent value="combined">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatXAxis}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      name="CPU"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      name="Memory"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="disk"
                      name="Disk"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="cpu">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatXAxis}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cpu"
                      name="CPU"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="memory">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatXAxis}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="memory"
                      name="Memory"
                      stroke="#a855f7"
                      fill="#a855f7"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="disk">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatXAxis}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="disk"
                      name="Disk"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
