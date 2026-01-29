import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Wifi, Globe, Server, Monitor, Trash2, Edit, RefreshCw, Radio, Activity } from "lucide-react";
import { useState } from "react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MonitoredDevice {
  id: string;
  name: string;
  type: 'snmp' | 'tcp' | 'http' | 'generic';
  ip_address: string;
  port?: number;
  status: 'online' | 'offline' | 'warning';
  last_checked: string;
  response_time?: number;
}

interface DeviceMonitoredTabProps {
  agent: VanguardAgent;
  onAddDevice: () => void;
  onDeleteDevice?: (id: string) => Promise<void>;
}

export function DeviceMonitoredTab({ agent, onAddDevice, onDeleteDevice }: DeviceMonitoredTabProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Extract monitored devices from agent config
  const monitoredDevices: MonitoredDevice[] = agent.config?.monitored_devices || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast.success("Device status refreshed");
  };

  const handleDelete = async (deviceId: string) => {
    if (onDeleteDevice) {
      await onDeleteDevice(deviceId);
    } else {
      toast.success("Device removed from monitoring");
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'snmp': return <Server className={cn(iconClass, "text-purple-400")} />;
      case 'tcp': return <Wifi className={cn(iconClass, "text-blue-400")} />;
      case 'http': return <Globe className={cn(iconClass, "text-green-400")} />;
      default: return <Monitor className={cn(iconClass, "text-slate-400")} />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      snmp: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      tcp: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      http: "bg-green-500/20 text-green-400 border-green-500/30",
      generic: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };
    return colors[type] || colors.generic;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Online
          </Badge>
        );
      case 'offline':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Offline
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Warning
          </Badge>
        );
      default:
        return <Badge variant="outline" className="border-slate-600 text-slate-400">Unknown</Badge>;
    }
  };

  const getResponseTimeColor = (ms?: number) => {
    if (!ms) return "text-slate-400";
    if (ms < 50) return "text-green-400";
    if (ms < 200) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Monitored Devices
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Network devices monitored by this agent (SNMP, TCP, HTTP, Generic)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className={cn(
              "hover:bg-cyan-500/20 hover:text-cyan-400",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            onClick={onAddDevice} 
            className="gap-1 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Add device
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {monitoredDevices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Radio className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 mb-2">No monitored devices</p>
            <p className="text-xs text-slate-500 mb-4">
              Add SNMP, TCP, HTTP, or generic devices to monitor them from this agent
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddDevice} 
              className="gap-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Plus className="h-4 w-4" />
              Add first device
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-3">
              <SummaryCard
                label="Total"
                value={monitoredDevices.length}
                icon={Radio}
                color="cyan"
              />
              <SummaryCard
                label="Online"
                value={monitoredDevices.filter(d => d.status === 'online').length}
                icon={Activity}
                color="green"
              />
              <SummaryCard
                label="Warning"
                value={monitoredDevices.filter(d => d.status === 'warning').length}
                icon={Activity}
                color="yellow"
              />
              <SummaryCard
                label="Offline"
                value={monitoredDevices.filter(d => d.status === 'offline').length}
                icon={Activity}
                color="red"
              />
            </div>

            <div className="rounded-lg border border-cyan-500/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-cyan-500/20 hover:bg-transparent">
                    <TableHead className="text-slate-400 w-[120px]">Type</TableHead>
                    <TableHead className="text-slate-400">Device</TableHead>
                    <TableHead className="text-slate-400">IP Address</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Response</TableHead>
                    <TableHead className="text-slate-400">Last Checked</TableHead>
                    <TableHead className="text-slate-400 w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitoredDevices.map((device) => (
                    <TableRow key={device.id} className="border-cyan-500/10 hover:bg-cyan-500/5">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(device.type)}
                          <Badge className={getTypeBadge(device.type)} variant="outline">
                            {device.type.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-200">{device.name}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-300">
                        {device.ip_address}
                        {device.port && <span className="text-slate-500">:{device.port}</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(device.status)}</TableCell>
                      <TableCell>
                        <span className={cn("font-mono text-sm", getResponseTimeColor(device.response_time))}>
                          {device.response_time ? `${device.response_time}ms` : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {device.last_checked}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-cyan-500/20">
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-cyan-500/20">
                            <DropdownMenuItem className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-400 focus:bg-red-500/20 focus:text-red-400"
                              onClick={() => handleDelete(device.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: any; 
  color: 'cyan' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    cyan: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
    green: "bg-green-500/20 border-green-500/30 text-green-400",
    yellow: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
    red: "bg-red-500/20 border-red-500/30 text-red-400",
  };

  return (
    <div className={cn("p-3 rounded-lg border", colorClasses[color])}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
