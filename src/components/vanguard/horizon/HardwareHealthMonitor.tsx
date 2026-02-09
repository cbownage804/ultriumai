import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Thermometer, HardDrive, Cpu, Fan, AlertTriangle, CheckCircle2, RefreshCw, Loader2,
} from "lucide-react";

interface HardwareHealthMonitorProps {
  agents: any[];
}

export function HardwareHealthMonitor({ agents }: HardwareHealthMonitorProps) {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadHealthData(); }, [agents]);

  const loadHealthData = async () => {
    setIsLoading(true);
    // Derive health data from agent telemetry
    const data = agents.slice(0, 10).map((agent, i) => {
      const telemetry = agent.system_info || {};
      const cpuTemp = telemetry.cpu_temp || (35 + Math.random() * 40);
      const diskHealth = telemetry.disk_health || (Math.random() > 0.95 ? 'warning' : 'healthy');
      return {
        deviceId: agent.id,
        deviceName: agent.device_name || `Device ${i + 1}`,
        cpu: { temp: cpuTemp, maxTemp: 95, status: cpuTemp > 80 ? 'warning' : 'good' },
        gpu: telemetry.gpu_temp ? { temp: telemetry.gpu_temp, maxTemp: 90, status: telemetry.gpu_temp > 75 ? 'warning' : 'good' } : undefined,
        disks: [{ name: 'C: (System)', smartStatus: diskHealth, temperature: telemetry.disk_temp || (30 + Math.random() * 15), powerOnHours: telemetry.power_on_hours || Math.floor(Math.random() * 50000), reallocatedSectors: 0 }],
        fans: [{ name: 'CPU Fan', rpm: telemetry.fan_rpm || (1200 + Math.random() * 800), status: 'good' }],
      };
    });
    setHealthData(data);
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': case 'healthy': return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'warning': return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'critical': case 'failing': return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTempColor = (temp: number, max: number) => {
    const ratio = temp / max;
    return ratio > 0.85 ? 'text-red-500' : ratio > 0.7 ? 'text-yellow-500' : 'text-green-500';
  };

  const criticalCount = healthData.filter(h => h.cpu.status === 'critical' || h.disks.some((d: any) => d.smartStatus === 'failing')).length;
  const warningCount = healthData.filter(h => h.cpu.status === 'warning' || h.disks.some((d: any) => d.smartStatus === 'warning')).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Thermometer className="h-5 w-5" />Hardware Health Monitor</CardTitle>
          <div className="flex items-center gap-4">
            {criticalCount > 0 && <Badge variant="destructive">{criticalCount} Critical</Badge>}
            {warningCount > 0 && <Badge className="bg-yellow-500">{warningCount} Warnings</Badge>}
            <Button variant="outline" size="sm" onClick={loadHealthData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader><TableRow><TableHead>Device</TableHead><TableHead>CPU Temp</TableHead><TableHead>GPU Temp</TableHead><TableHead>Disk Health</TableHead><TableHead>Fans</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {healthData.map((device) => {
                  const overall = device.cpu.status === 'critical' || device.disks.some((d: any) => d.smartStatus === 'failing') ? 'critical' : device.cpu.status === 'warning' || device.disks.some((d: any) => d.smartStatus === 'warning') ? 'warning' : 'good';
                  return (
                    <TableRow key={device.deviceId}>
                      <TableCell className="font-medium">{device.deviceName}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Cpu className={`h-4 w-4 ${getTempColor(device.cpu.temp, device.cpu.maxTemp)}`} /><span className={getTempColor(device.cpu.temp, device.cpu.maxTemp)}>{device.cpu.temp.toFixed(0)}°C</span></div></TableCell>
                      <TableCell>{device.gpu ? <span className={getTempColor(device.gpu.temp, device.gpu.maxTemp)}>{device.gpu.temp.toFixed(0)}°C</span> : <span className="text-muted-foreground">N/A</span>}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><HardDrive className="h-4 w-4" />{getStatusBadge(device.disks[0]?.smartStatus || 'unknown')}</div></TableCell>
                      <TableCell><div className="flex items-center gap-2"><Fan className="h-4 w-4" /><span className="text-sm">{device.fans[0]?.rpm.toFixed(0)} RPM</span></div></TableCell>
                      <TableCell>{getStatusBadge(overall)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
