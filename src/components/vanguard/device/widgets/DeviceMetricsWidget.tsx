import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Cpu, MemoryStick, HardDrive, Thermometer, Activity } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MetricData {
  cpu: number;
  memory: number;
  disk: number;
  temperature?: number;
}

interface DeviceMetricsWidgetProps {
  currentMetrics: MetricData;
  avgMetrics24h?: MetricData;
  avgMetricsWeek?: MetricData;
  avgMetricsMonth?: MetricData;
}

export function DeviceMetricsWidget({
  currentMetrics,
  avgMetrics24h,
  avgMetricsWeek,
  avgMetricsMonth,
}: DeviceMetricsWidgetProps) {
  const [period, setPeriod] = useState<'current' | '24h' | 'week' | 'month'>('current');

  const getMetricsForPeriod = (): MetricData => {
    switch (period) {
      case '24h':
        return avgMetrics24h || currentMetrics;
      case 'week':
        return avgMetricsWeek || currentMetrics;
      case 'month':
        return avgMetricsMonth || currentMetrics;
      default:
        return currentMetrics;
    }
  };

  const metrics = getMetricsForPeriod();

  const getStatusColor = (value: number) => {
    if (value >= 90) return "text-red-400";
    if (value >= 75) return "text-amber-400";
    return "text-cyan-400";
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-red-500";
    if (value >= 75) return "bg-amber-500";
    return "bg-cyan-500";
  };

  const metricItems = [
    { 
      label: "CPU", 
      value: metrics.cpu, 
      icon: Cpu,
      gradient: "from-cyan-500/20 to-cyan-600/5"
    },
    { 
      label: "Memory", 
      value: metrics.memory, 
      icon: MemoryStick,
      gradient: "from-blue-500/20 to-blue-600/5"
    },
    { 
      label: "Disk", 
      value: metrics.disk, 
      icon: HardDrive,
      gradient: "from-violet-500/20 to-violet-600/5"
    },
    { 
      label: "Temp", 
      value: metrics.temperature || 45, 
      icon: Thermometer,
      gradient: "from-orange-500/20 to-orange-600/5",
      suffix: "°C",
      noProgress: true
    },
  ];

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900/50 to-slate-800/30">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          System Metrics
        </CardTitle>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="week">Last week</SelectItem>
            <SelectItem value="month">Last month</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricItems.map((metric) => (
            <div 
              key={metric.label}
              className={cn(
                "relative overflow-hidden rounded-xl p-4",
                "bg-gradient-to-br",
                metric.gradient
              )}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full" />
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                  <metric.icon className="h-4 w-4 text-cyan-400" />
                </div>
                <span className={cn(
                  "text-2xl font-bold tabular-nums",
                  getStatusColor(metric.value)
                )}>
                  {metric.value.toFixed(0)}{metric.suffix || '%'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{metric.label}</p>
              {!metric.noProgress && (
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500", getProgressColor(metric.value))}
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {period !== 'current' && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Average usage over {period === '24h' ? 'last 24 hours' : period === 'week' ? 'last week' : 'last month'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
