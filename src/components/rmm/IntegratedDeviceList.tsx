import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DeviceContactInfo } from "./DeviceContactInfo";
import { RemoteSessionViewer } from "./RemoteSessionViewer";
import { 
  Monitor, 
  Search, 
  User, 
  Building2, 
  Activity, 
  ExternalLink,
  Filter,
  RefreshCw
} from "lucide-react";

interface Device {
  id: string;
  hostname: string;
  ip_address: string;
  os_info: string;
  device_type: string;
  status: 'online' | 'offline' | 'maintenance';
  last_seen: string;
  last_logged_user: string;
  customer_id: string;
  customer_name: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  pending_tickets: number;
}

// Mock data
const mockDevices: Device[] = [
  {
    id: "1",
    hostname: "WORKSTATION-01",
    ip_address: "192.168.1.100",
    os_info: "Windows 11 Pro",
    device_type: "desktop",
    status: "online",
    last_seen: "2024-01-06T10:30:00Z",
    last_logged_user: "john.doe",
    customer_id: "customer-1",
    customer_name: "Acme Corporation",
    cpu_usage: 45,
    memory_usage: 62,
    disk_usage: 78,
    pending_tickets: 2
  },
  {
    id: "2",
    hostname: "LAPTOP-SALES-02",
    ip_address: "192.168.1.105",
    os_info: "Windows 11 Pro",
    device_type: "laptop",
    status: "offline",
    last_seen: "2024-01-05T14:22:00Z",
    last_logged_user: "sarah.wilson",
    customer_id: "customer-2",
    customer_name: "TechStart LLC",
    cpu_usage: 23,
    memory_usage: 34,
    disk_usage: 56,
    pending_tickets: 1
  }
];

export const IntegratedDeviceList = () => {
  const [devices] = useState<Device[]>(mockDevices);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>(mockDevices);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showRemoteSession, setShowRemoteSession] = useState(false);
  const [remoteSessionData, setRemoteSessionData] = useState<{
    sessionId: string;
    deviceName: string;
    deviceType: string;
  } | null>(null);

  const { toast } = useToast();

  const handleUserClick = (deviceId: string, username: string) => {
    setSelectedDeviceId(deviceId);
    setSelectedUser(username);
    setShowContactInfo(true);
  };

  const handleRemoteConnect = (deviceId: string, hostname: string) => {
    setRemoteSessionData({
      sessionId: `session-${Date.now()}`,
      deviceName: hostname,
      deviceType: devices.find(d => d.id === deviceId)?.device_type || 'desktop'
    });
    setShowContactInfo(false);
    setShowRemoteSession(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage > 80) return 'text-red-600';
    if (usage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Device Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Integrated RMM devices with customer contacts and ticketing
              </p>
            </div>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Device Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Last User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          {device.hostname}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {device.ip_address} • {device.os_info}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{device.customer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUserClick(device.id, device.last_logged_user)}
                        className="justify-start p-0 h-auto font-normal hover:underline"
                      >
                        <User className="h-4 w-4 mr-1" />
                        {device.last_logged_user}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                          {device.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>CPU:</span>
                          <span className={getUsageColor(device.cpu_usage)}>
                            {device.cpu_usage}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>RAM:</span>
                          <span className={getUsageColor(device.memory_usage)}>
                            {device.memory_usage}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Disk:</span>
                          <span className={getUsageColor(device.disk_usage)}>
                            {device.disk_usage}%
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {device.pending_tickets > 0 ? (
                        <Badge variant="destructive">
                          {device.pending_tickets} open
                        </Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {new Date(device.last_seen).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(device.last_seen).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info Dialog */}
      <DeviceContactInfo
        deviceId={selectedDeviceId}
        lastLoggedUser={selectedUser}
        open={showContactInfo}
        onOpenChange={setShowContactInfo}
        onRemoteConnect={handleRemoteConnect}
      />

      {/* Remote Session Dialog */}
      {remoteSessionData && (
        <div className="fixed inset-0 z-50">
          <RemoteSessionViewer
            sessionId={remoteSessionData.sessionId}
            deviceName={remoteSessionData.deviceName}
            deviceType={remoteSessionData.deviceType}
            onEndSession={() => {
              setShowRemoteSession(false);
              setRemoteSessionData(null);
            }}
          />
        </div>
      )}
    </div>
  );
};