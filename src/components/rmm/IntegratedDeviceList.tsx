import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
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

export const IntegratedDeviceList = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadDevices = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rmm_devices')
        .select(`
          *,
          rmm_customers (
            id,
            company_name
          ),
          helpdesk_tickets (
            count
          )
        `)
        .order('last_seen', { ascending: false });

      if (error) throw error;

      const processedDevices: Device[] = data?.map(device => ({
        id: device.id,
        hostname: device.hostname,
        ip_address: device.ip_address,
        os_info: device.os_info,
        device_type: device.device_type,
        status: device.status as 'online' | 'offline' | 'maintenance',
        last_seen: device.last_seen,
        last_logged_user: device.last_logged_user || 'Unknown',
        customer_id: device.customer_id,
        customer_name: device.rmm_customers?.company_name || 'Unknown Customer',
        cpu_usage: device.cpu_usage || 0,
        memory_usage: device.memory_usage || 0,
        disk_usage: device.disk_usage || 0,
        pending_tickets: 0
      })) || [];

      setDevices(processedDevices);
      setFilteredDevices(processedDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    
    // Set up real-time subscription for device updates
    const subscription = supabase
      .channel('device-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rmm_devices' },
        () => loadDevices()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    let filtered = devices;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.last_logged_user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.ip_address.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }

    setFilteredDevices(filtered);
  }, [searchTerm, statusFilter, devices]);

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
            <Button onClick={loadDevices} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices, customers, users, or IP addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

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

          {filteredDevices.length === 0 && (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No devices match your search criteria' 
                  : 'No devices found'
                }
              </p>
            </div>
          )}
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