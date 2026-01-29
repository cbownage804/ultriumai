import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Cpu, MemoryStick, HardDrive } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MetricData {
  cpu: number;
  memory: number;
  disk: number;
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

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-500">Metrics</CardTitle>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-[120px] h-7 text-xs">
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
      <CardContent className="space-y-4">
        <MetricBar
          label="CPU"
          value={metrics.cpu}
          icon={<Cpu className="h-4 w-4" />}
        />
        <MetricBar
          label="Memory"
          value={metrics.memory}
          icon={<MemoryStick className="h-4 w-4" />}
        />
        <MetricBar
          label="Disk"
          value={metrics.disk}
          icon={<HardDrive className="h-4 w-4" />}
        />
        
        {period !== 'current' && (
          <p className="text-xs text-gray-400 text-center">
            Average usage over {period === '24h' ? 'last 24 hours' : period === 'week' ? 'last week' : 'last month'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const percentage = Math.min(100, Math.max(0, value));
  const color = percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="font-medium">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
