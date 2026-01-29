import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  List,
  Cpu,
  MemoryStick,
  HardDrive,
  RefreshCw,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHorizonStats, DeviceWithMetrics } from "@/hooks/useHorizonStats";

type ViewMode = "grid" | "heatmap" | "list";
type MetricType = "cpu" | "memory" | "disk";

const METRIC_CONFIG: Record<MetricType, { label: string; icon: React.ReactNode; unit: string }> = {
  cpu: { label: "CPU", icon: <Cpu className="h-4 w-4" />, unit: "%" },
  memory: { label: "Memory", icon: <MemoryStick className="h-4 w-4" />, unit: "%" },
  disk: { label: "Disk", icon: <HardDrive className="h-4 w-4" />, unit: "%" },
};

function getHealthColor(value: number | null | undefined, metric: MetricType): string {
  if (value === null || value === undefined) return "bg-muted";
  
  // For disk, higher is worse
  if (metric === "disk") {
    if (value >= 95) return "bg-red-500";
    if (value >= 85) return "bg-orange-500";
    if (value >= 70) return "bg-yellow-500";
    return "bg-green-500";
  }
  
  // For CPU and memory
  if (value >= 95) return "bg-red-500";
  if (value >= 80) return "bg-orange-500";
  if (value >= 60) return "bg-yellow-500";
  return "bg-green-500";
}

function getHealthOpacity(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0.3;
  return Math.max(0.3, value / 100);
}

export function FleetPerformanceGrid() {
  const { devices, isLoading, refetch } = useHorizonStats();
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("cpu");
  const [sortBy, setSortBy] = useState<"name" | "value">("value");

  // Sort devices
  const sortedDevices = [...devices].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    const aVal = selectedMetric === "cpu" ? a.cpu_usage : selectedMetric === "memory" ? a.memory_usage : a.disk_usage;
    const bVal = selectedMetric === "cpu" ? b.cpu_usage : selectedMetric === "memory" ? b.memory_usage : b.disk_usage;
    return (bVal ?? 0) - (aVal ?? 0);
  });

  // Calculate aggregate stats
  const onlineDevices = devices.filter(d => d.status === "online");
  const avgCpu = onlineDevices.length > 0 
    ? Math.round(onlineDevices.reduce((sum, d) => sum + (d.cpu_usage || 0), 0) / onlineDevices.length) 
    : 0;
  const avgMemory = onlineDevices.length > 0 
    ? Math.round(onlineDevices.reduce((sum, d) => sum + (d.memory_usage || 0), 0) / onlineDevices.length) 
    : 0;
  const avgDisk = onlineDevices.length > 0 
    ? Math.round(onlineDevices.reduce((sum, d) => sum + (d.disk_usage || 0), 0) / onlineDevices.length) 
    : 0;

  const criticalDevices = devices.filter(d => 
    (d.cpu_usage && d.cpu_usage > 90) || 
    (d.memory_usage && d.memory_usage > 90) || 
    (d.disk_usage && d.disk_usage > 95)
  );

  const getValue = (device: DeviceWithMetrics) => {
    switch (selectedMetric) {
      case "cpu": return device.cpu_usage;
      case "memory": return device.memory_usage;
      case "disk": return device.disk_usage;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-cyan-500" />
              Fleet Performance
            </CardTitle>
            <CardDescription>
              Real-time resource utilization across all devices
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={(v: MetricType) => setSelectedMetric(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpu">CPU Usage</SelectItem>
                <SelectItem value="memory">Memory</SelectItem>
                <SelectItem value="disk">Disk Usage</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "heatmap" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("heatmap")}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Fleet Overview Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">Avg CPU</span>
            </div>
            <p className={cn(
              "text-2xl font-bold mt-1",
              avgCpu > 80 ? "text-red-500" : avgCpu > 60 ? "text-yellow-500" : "text-green-500"
            )}>
              {avgCpu}%
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MemoryStick className="h-4 w-4" />
              <span className="text-sm">Avg Memory</span>
            </div>
            <p className={cn(
              "text-2xl font-bold mt-1",
              avgMemory > 85 ? "text-red-500" : avgMemory > 70 ? "text-yellow-500" : "text-green-500"
            )}>
              {avgMemory}%
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              <span className="text-sm">Avg Disk</span>
            </div>
            <p className={cn(
              "text-2xl font-bold mt-1",
              avgDisk > 90 ? "text-red-500" : avgDisk > 75 ? "text-yellow-500" : "text-green-500"
            )}>
              {avgDisk}%
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/30">
            <div className="flex items-center gap-2 text-red-500">
              <Maximize2 className="h-4 w-4" />
              <span className="text-sm">Critical Devices</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-500">
              {criticalDevices.length}
            </p>
          </div>
        </div>

        {/* Heatmap View */}
        {viewMode === "heatmap" && (
          <TooltipProvider>
            <div className="grid grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-1">
              {sortedDevices.map(device => {
                const value = getValue(device);
                const color = getHealthColor(value, selectedMetric);
                const opacity = getHealthOpacity(value);
                
                return (
                  <Tooltip key={device.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square rounded-sm cursor-pointer transition-all hover:scale-110 hover:z-10",
                          color,
                          device.status !== "online" && "opacity-30"
                        )}
                        style={{ opacity: device.status === "online" ? opacity : 0.2 }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium">{device.name}</p>
                        <p className="text-muted-foreground">{device.ip_address}</p>
                        <div className="mt-2 space-y-1">
                          <p>CPU: {device.cpu_usage ?? "N/A"}%</p>
                          <p>Memory: {device.memory_usage ?? "N/A"}%</p>
                          <p>Disk: {device.disk_usage ?? "N/A"}%</p>
                        </div>
                        <Badge variant="outline" className="mt-2">
                          {device.status}
                        </Badge>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>Normal (&lt;60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span>Elevated (60-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span>High (80-95%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span>Critical (&gt;95%)</span>
              </div>
            </div>
          </TooltipProvider>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
              <div>Device</div>
              <div>Status</div>
              <div>CPU</div>
              <div>Memory</div>
              <div>Disk</div>
            </div>
            {sortedDevices.slice(0, 20).map(device => (
              <div
                key={device.id}
                className="grid grid-cols-5 gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-xs text-muted-foreground">{device.ip_address}</p>
                </div>
                <div>
                  <Badge variant={device.status === "online" ? "default" : "secondary"}>
                    {device.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    getHealthColor(device.cpu_usage, "cpu")
                  )} />
                  <span>{device.cpu_usage ?? "N/A"}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    getHealthColor(device.memory_usage, "memory")
                  )} />
                  <span>{device.memory_usage ?? "N/A"}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    getHealthColor(device.disk_usage, "disk")
                  )} />
                  <span>{device.disk_usage ?? "N/A"}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {devices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No devices found</p>
            <p className="text-sm">Deploy agents to see fleet performance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
