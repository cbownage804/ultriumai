import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Monitor,
  Server,
  Router
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccountType } from "@/hooks/useAccountType";
import { useMSP } from "@/hooks/useMSP";

interface DeviceStatus {
  id: string;
  hostname: string;
  ip_address?: string;
  device_type?: string;
  status: string;
  last_seen: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
}

export const RealTimeMonitor = () => {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { isMSPOrMSSP, isBusiness } = useAccountType();
  const { clients } = useMSP();

  useEffect(() => {
    loadDevices();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('rmm-monitoring')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rmm_endpoints'
      }, (payload) => {
        console.log('Real-time device update:', payload);
        loadDevices(); // Reload devices on any change
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDevices, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('rmm_endpoints')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'network_device': return <Router className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';  
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Real-Time Device Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading devices...</div>
        </CardContent>
      </Card>
    );
  }

  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const warningDevices = devices.filter(d => d.status === 'warning').length;
  const criticalDevices = devices.filter(d => d.status === 'critical').length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{onlineDevices}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">{warningDevices}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalDevices}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-gray-600">{offlineDevices}</p>
              </div>
              <WifiOff className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Device Status
              </CardTitle>
              <CardDescription>
                Real-time monitoring of all managed devices
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadDevices} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {devices.map((device) => (
              <div 
                key={device.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {getDeviceIcon(device.device_type)}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{device.hostname}</span>
                      <Badge variant="outline" className="text-xs">
                        {device.device_type}
                      </Badge>
                    </div>
                    {device.ip_address && (
                      <p className="text-sm text-muted-foreground">{device.ip_address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Performance Metrics */}
                  {device.cpu_usage && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">CPU</p>
                      <p className="text-sm font-medium">{device.cpu_usage.toFixed(1)}%</p>
                    </div>
                  )}
                  {device.memory_usage && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Memory</p>
                      <p className="text-sm font-medium">{device.memory_usage.toFixed(1)}%</p>
                    </div>
                  )}
                  {device.disk_usage && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Disk</p>
                      <p className="text-sm font-medium">{device.disk_usage.toFixed(1)}%</p>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2 text-right">
                    {getStatusIcon(device.status)}
                    <div>
                      <p className="text-sm font-medium capitalize">{device.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatLastSeen(device.last_seen)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {devices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No devices found. Deploy RMM agents to start monitoring.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};