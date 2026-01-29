import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Wifi, Globe, Server, Monitor, Trash2, Edit, RefreshCw } from "lucide-react";
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
}

export function DeviceMonitoredTab({ agent, onAddDevice }: DeviceMonitoredTabProps) {
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

  const handleDelete = (deviceId: string) => {
    toast.success("Device removed from monitoring");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'snmp': return <Server className="h-4 w-4" />;
      case 'tcp': return <Wifi className="h-4 w-4" />;
      case 'http': return <Globe className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Online</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Offline</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-gray-900">Monitored Devices</CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Devices monitored by this agent (SNMP, TCP, HTTP, Generic)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className={cn(isRefreshing && "animate-spin")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onAddDevice} className="gap-1">
            <Plus className="h-4 w-4" />
            Add device
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {monitoredDevices.length === 0 ? (
          <div className="text-center py-8">
            <Server className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No monitored devices</p>
            <p className="text-xs text-gray-400 mb-4">
              Add SNMP, TCP, HTTP, or generic devices to monitor them from this agent
            </p>
            <Button variant="outline" size="sm" onClick={onAddDevice} className="gap-1">
              <Plus className="h-4 w-4" />
              Add first device
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitoredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-500">
                      {getTypeIcon(device.type)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell className="font-mono text-sm">{device.ip_address}</TableCell>
                  <TableCell>{device.port || "—"}</TableCell>
                  <TableCell>{getStatusBadge(device.status)}</TableCell>
                  <TableCell>
                    {device.response_time ? `${device.response_time}ms` : "—"}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {device.last_checked}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
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
        )}
      </CardContent>
    </Card>
  );
}
