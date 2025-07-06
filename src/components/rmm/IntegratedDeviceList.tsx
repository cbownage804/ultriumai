import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck
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
  // AV/MDR fields
  av_status: 'active' | 'inactive' | 'outdated';
  av_engine: string;
  av_version: string;
  last_av_scan: string;
  last_threat_found?: string;
  real_time_protection: boolean;
  mdr_status: 'active' | 'inactive';
  threat_level: 'low' | 'medium' | 'high';
}

// Helper function to get ticket count for a customer
const getTicketCount = async (customerId: string) => {
  const { count } = await supabase
    .from('helpdesk_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .in('status', ['open', 'in_progress']);
  return count || 0;
};

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

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      
      // Get devices with customer information
      const { data: devicesData, error: devicesError } = await supabase
        .from('rmm_devices')
        .select(`
          *,
          customer:rmm_customers(*)
        `);

      if (devicesError) throw devicesError;

      // Transform data and add AV/MDR info and ticket counts
      const transformedDevices: Device[] = await Promise.all(
        (devicesData || []).map(async (device: any) => {
          const ticketCount = await getTicketCount(device.customer_id);
          
          return {
            id: device.id,
            hostname: device.hostname,
            ip_address: device.ip_address,
            os_info: device.os_info || 'Unknown OS',
            device_type: device.device_type,
            status: device.status,
            last_seen: device.last_seen,
            last_logged_user: device.last_logged_user || 'Unknown',
            customer_id: device.customer_id,
            customer_name: device.customer?.company_name || 'Unknown Customer',
            cpu_usage: device.cpu_usage || 0,
            memory_usage: device.memory_usage || 0,
            disk_usage: device.disk_usage || 0,
            pending_tickets: ticketCount,
            // AV/MDR data - simulate realistic values
            av_status: device.status === 'online' ? 'active' : 'inactive',
            av_engine: 'Windows Defender',
            av_version: '4.18.2410.6',
            last_av_scan: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            last_threat_found: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            real_time_protection: device.status === 'online',
            mdr_status: device.status === 'online' ? 'active' : 'inactive',
            threat_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
          } as Device;
        })
      );

      setDevices(transformedDevices);
      setFilteredDevices(transformedDevices);
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

  const getAVStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ShieldCheck className="h-4 w-4 text-green-600" />;
      case 'outdated': return <ShieldAlert className="h-4 w-4 text-yellow-600" />;
      case 'inactive': return <Shield className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
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
            <Button variant="outline" onClick={loadDevices} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                  <TableHead>AV/MDR Status</TableHead>
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getAVStatusIcon(device.av_status)}
                          <div className="text-xs">
                            <div className="font-medium">AV: {device.av_status}</div>
                            <div className="text-gray-500">
                              Scan: {new Date(device.last_av_scan).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getThreatLevelColor(device.threat_level)} className="text-xs">
                            Threat: {device.threat_level}
                          </Badge>
                          <Badge variant={device.mdr_status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            MDR: {device.mdr_status}
                          </Badge>
                        </div>
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