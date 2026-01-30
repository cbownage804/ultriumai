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
      return <Badge className="bg-white/10 text-white/50 border-white/20">Never connected</Badge>;
    }
    const lastHeartbeat = new Date(device.last_heartbeat).getTime();
    const isOnline = Date.now() - lastHeartbeat < 5 * 60 * 1000;
    
    return isOnline ? (
      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    ) : (
      <Badge className="bg-white/10 text-white/50 border-white/20">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  };

  const getUsageColor = (usage?: number) => {
    if (!usage) return 'text-white/40';
    if (usage >= 90) return 'text-red-400';
    if (usage >= 70) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-4">
      {/* Device Table */}
      <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
        <CardHeader className="border-b border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Monitor className="h-5 w-5 text-cyan-400" />
                Devices
              </CardTitle>
              <CardDescription className="text-white/60">
                Manage and monitor devices for {orgName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64 bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onRefresh}
                className="border-cyan-500/30 text-white/60 hover:text-white hover:bg-cyan-500/10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-white/5 animate-pulse rounded" />
              ))}
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="h-12 w-12 mx-auto text-cyan-400/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No devices found</h3>
              <p className="text-white/60 mb-4">
                {searchQuery 
                  ? 'No devices match your search' 
                  : 'Deploy an agent to start monitoring devices'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate(`/vanguard/setup?client=${orgId}`)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Deploy First Agent
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-cyan-500/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-cyan-500/20 bg-black/40">
                    <TableHead className="text-white/60">Device</TableHead>
                    <TableHead className="text-white/60">Status</TableHead>
                    <TableHead className="text-white/60">IP Address</TableHead>
                    <TableHead className="text-white/60">CPU</TableHead>
                    <TableHead className="text-white/60">Memory</TableHead>
                    <TableHead className="text-white/60">Disk</TableHead>
                    <TableHead className="text-white/60">Last Seen</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map(device => (
                    <TableRow key={device.id} className="cursor-pointer hover:bg-white/5 border-cyan-500/10">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-cyan-400/60" />
                          <div>
                            <p className="font-medium text-white">{device.name}</p>
                            <p className="text-xs text-white/50">{device.os_info || 'Unknown OS'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(device)}</TableCell>
                      <TableCell className="font-mono text-sm text-white/70">{device.ip_address || '—'}</TableCell>
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
                      <TableCell className="text-sm text-white/50">
                        {device.last_heartbeat 
                          ? new Date(device.last_heartbeat).toLocaleString() 
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white hover:bg-cyan-500/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black/90 border-cyan-500/30">
                            <DropdownMenuItem 
                              onClick={() => navigate(`/vanguard/devices/${device.id}`)}
                              className="text-white/80 hover:bg-cyan-500/10"
                            >
                              <Monitor className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                              <Terminal className="h-4 w-4 mr-2" />
                              Remote Terminal
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-cyan-500/20" />
                            <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
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