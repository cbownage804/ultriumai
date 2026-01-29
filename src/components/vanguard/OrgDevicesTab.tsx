import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Monitor, Plus, Search, Wifi, WifiOff, Cpu, HardDrive, 
  MoreVertical, Download, RefreshCw, Terminal, Trash2 
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface Device {
  id: string;
  name: string;
  device_id: string;
  status: string;
  ip_address?: string;
  os_info?: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  last_heartbeat?: string;
  agent_version?: string;
}

interface OrgDevicesTabProps {
  orgId: string;
  orgName: string;
  devices: Device[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const OrgDevicesTab = ({ orgId, orgName, devices, isLoading, onRefresh }: OrgDevicesTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.ip_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineDevices = devices.filter(d => {
    if (!d.last_heartbeat) return false;
    const lastHeartbeat = new Date(d.last_heartbeat).getTime();
    return Date.now() - lastHeartbeat < 5 * 60 * 1000;
  });

  const getStatusBadge = (device: Device) => {
    if (!device.last_heartbeat) {
      return <Badge variant="secondary">Never connected</Badge>;
    }
    const lastHeartbeat = new Date(device.last_heartbeat).getTime();
    const isOnline = Date.now() - lastHeartbeat < 5 * 60 * 1000;
    
    return isOnline ? (
      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    ) : (
      <Badge variant="secondary">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  };

  const getUsageColor = (usage?: number) => {
    if (!usage) return 'text-muted-foreground';
    if (usage >= 90) return 'text-destructive';
    if (usage >= 70) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-500">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{onlineDevices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length - onlineDevices.length}</div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center h-full py-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate(`/vanguard/setup?client=${orgId}`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Deploy Agent
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Device Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Devices
              </CardTitle>
              <CardDescription>
                Manage and monitor devices for {orgName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No devices found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'No devices match your search' 
                  : 'Deploy an agent to start monitoring devices'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate(`/vanguard/setup?client=${orgId}`)}>
                  <Download className="h-4 w-4 mr-2" />
                  Deploy First Agent
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead>Disk</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map(device => (
                    <TableRow key={device.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{device.name}</p>
                            <p className="text-xs text-muted-foreground">{device.os_info || 'Unknown OS'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(device)}</TableCell>
                      <TableCell className="font-mono text-sm">{device.ip_address || '—'}</TableCell>
                      <TableCell>
                        <span className={getUsageColor(device.cpu_usage)}>
                          {device.cpu_usage ? `${device.cpu_usage.toFixed(0)}%` : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getUsageColor(device.memory_usage)}>
                          {device.memory_usage ? `${device.memory_usage.toFixed(0)}%` : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getUsageColor(device.disk_usage)}>
                          {device.disk_usage ? `${device.disk_usage.toFixed(0)}%` : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {device.last_heartbeat 
                          ? new Date(device.last_heartbeat).toLocaleString() 
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/vanguard/devices/${device.id}`)}>
                              <Monitor className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Terminal className="h-4 w-4 mr-2" />
                              Remote Terminal
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Device
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
