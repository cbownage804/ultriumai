import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VanguardAgent, VanguardMetric } from "@/hooks/useVanguardAgents";
import { Activity, Cpu, MemoryStick, HardDrive, Clock, ArrowUp, ArrowDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DevicePerformanceTabProps {
  agent: VanguardAgent;
  metrics: VanguardMetric[];
}

export function DevicePerformanceTab({ agent, metrics }: DevicePerformanceTabProps) {
  // Format metrics for charts
  const chartData = useMemo(() => {
    return metrics.map((m) => ({
      time: new Date(m.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(m.recorded_at).getTime(),
      cpu: m.cpu_percent || 0,
      memory: m.memory_percent || 0,
      disk: m.disk_percent || 0,
      networkIn: (m.network_rx_bytes || 0) / 1024 / 1024, // Convert to MB
      networkOut: (m.network_tx_bytes || 0) / 1024 / 1024,
    }));
  }, [metrics]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const cpuValues = chartData.map(d => d.cpu);
    const memValues = chartData.map(d => d.memory);
    const diskValues = chartData.map(d => d.disk);
    
    return {
      cpu: {
        current: cpuValues[cpuValues.length - 1] || 0,
        avg: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
        max: Math.max(...cpuValues),
        min: Math.min(...cpuValues),
      },
      memory: {
        current: memValues[memValues.length - 1] || 0,
        avg: memValues.reduce((a, b) => a + b, 0) / memValues.length,
        max: Math.max(...memValues),
        min: Math.min(...memValues),
      },
      disk: {
        current: diskValues[diskValues.length - 1] || 0,
        avg: diskValues.reduce((a, b) => a + b, 0) / diskValues.length,
        max: Math.max(...diskValues),
        min: Math.min(...diskValues),
      },
    };
  }, [chartData]);

  // Uptime calculation
  const uptime = useMemo(() => {
    const bootTime = (agent.config as any)?.hardware?.boot_time || (agent.config as any)?.boot_time;
    if (!bootTime) return null;
    
    const bootDate = new Date(bootTime);
    const now = new Date();
    const diffMs = now.getTime() - bootDate.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, bootTime: bootDate.toLocaleString() };
  }, [agent.config]);

  if (metrics.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No performance data available</p>
            <p className="text-xs text-slate-500">
              Performance metrics are collected every heartbeat interval
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        {/* Uptime Card */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">Uptime</span>
            </div>
            {uptime ? (
              <>
                <div className="text-2xl font-bold text-white">
                  {uptime.days}d {uptime.hours}h {uptime.minutes}m
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Boot: {uptime.bootTime}
                </div>
              </>
            ) : (
              <div className="text-lg text-slate-500">Unknown</div>
            )}
          </CardContent>
        </Card>

        {/* CPU Stats */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">CPU</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats?.cpu.current.toFixed(1)}%
            </div>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-slate-500">Avg: {stats?.cpu.avg.toFixed(1)}%</span>
              <span className="text-red-400">Max: {stats?.cpu.max.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Memory Stats */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <MemoryStick className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">Memory</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats?.memory.current.toFixed(1)}%
            </div>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-slate-500">Avg: {stats?.memory.avg.toFixed(1)}%</span>
              <span className="text-red-400">Max: {stats?.memory.max.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Disk Stats */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Disk</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats?.disk.current.toFixed(1)}%
            </div>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-slate-500">Avg: {stats?.disk.avg.toFixed(1)}%</span>
              <span className="text-red-400">Max: {stats?.disk.max.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CPU & Memory Chart */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            CPU & Memory Usage (Last 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  name="Memory"
                  stroke="#A855F7"
                  fillOpacity={1}
                  fill="url(#colorMemory)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Disk Usage Chart */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Disk Usage Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="disk"
                  name="Disk Usage"
                  stroke="#F59E0B"
                  fillOpacity={1}
                  fill="url(#colorDisk)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Alerts */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Alert Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {['cpu', 'memory', 'disk'].map((metric) => {
              const threshold = (agent.config as any)?.thresholds?.[metric] || 90;
              const current = stats?.[metric as keyof typeof stats]?.current || 0;
              const isExceeded = current >= threshold;
              
              return (
                <div key={metric} className="p-3 bg-black/40 rounded-lg border border-cyan-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300 capitalize">{metric}</span>
                    <Badge className={isExceeded ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                      {isExceeded ? 'Exceeded' : 'Normal'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    Threshold: {threshold}% | Current: {current.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
