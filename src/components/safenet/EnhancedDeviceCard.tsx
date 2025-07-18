import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Monitor, 
  Laptop, 
  Server, 
  Smartphone, 
  Router, 
  Printer,
  Wifi,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  MapPin,
  Network,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { NetworkDevice } from "@/hooks/useSafeNet";

interface EnhancedDeviceCardProps {
  device: NetworkDevice;
  onClick?: () => void;
}

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType?.toLowerCase()) {
    case 'computer': case 'workstation': return Monitor;
    case 'laptop': return Laptop;
    case 'server': return Server;
    case 'mobile': case 'phone': return Smartphone;
    case 'router': case 'gateway': return Router;
    case 'printer': return Printer;
    case 'iot': case 'smart device': return Wifi;
    default: return Monitor;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-red-500';
    case 'warning': return 'bg-yellow-500';
    default: return 'bg-gray-400';
  }
};

const getRiskLevel = (vulnerabilityCount: number, isManaged: boolean, isCritical: boolean) => {
  if (isCritical || vulnerabilityCount > 5) return { level: 'High', color: 'destructive' };
  if (vulnerabilityCount > 2 || !isManaged) return { level: 'Medium', color: 'secondary' };
  return { level: 'Low', color: 'default' };
};

export const EnhancedDeviceCard = ({ device, onClick }: EnhancedDeviceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const DeviceIcon = getDeviceIcon(device.device_type || 'unknown');
  const risk = getRiskLevel(device.vulnerability_count || 0, device.is_managed || false, device.is_critical || false);
  
  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const formatLastSeen = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-lg border-l-4 border-l-transparent hover:border-l-primary/60 cursor-pointer"
          onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <DeviceIcon className="h-8 w-8 text-muted-foreground" />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(device.status || 'unknown')}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {device.device_name || device.hostname || 'Unknown Device'}
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Network className="h-3 w-3" />
                <span>{String(device.ip_address || 'Unknown')}</span>
                {device.mac_address && (
                  <>
                    <span>•</span>
                    <span>{device.mac_address}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {device.status}
            </Badge>
            <Badge variant={risk.color as any} className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              {risk.level} Risk
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Device Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium capitalize">{device.device_type || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">OS:</span>
              <span className="font-medium">{device.os_family || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{device.device_role || 'Unknown'}</span>
            </div>
          </div>
          <div className="space-y-2">
            {device.manufacturer && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Manufacturer:</span>
                <span className="font-medium">{device.manufacturer}</span>
              </div>
            )}
            {device.model && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium">{device.model}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Managed:</span>
              <Badge variant={device.is_managed ? 'default' : 'outline'} className="text-xs">
                {device.is_managed ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                {device.is_managed ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {(device.cpu_usage || device.memory_usage) && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </h4>
            <div className="space-y-2">
              {device.cpu_usage && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>CPU Usage</span>
                    <span>{device.cpu_usage}%</span>
                  </div>
                  <Progress value={device.cpu_usage} className="h-2" />
                </div>
              )}
              {device.memory_usage && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Memory Usage</span>
                    <span>{device.memory_usage}%</span>
                  </div>
                  <Progress value={device.memory_usage} className="h-2" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Network Info */}
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium flex items-center">
            <Network className="h-4 w-4 mr-2" />
            Network
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {device.network_segment && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span>Segment: {device.network_segment}</span>
              </div>
            )}
            {device.last_seen_at && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>Seen: {formatLastSeen(device.last_seen_at)}</span>
              </div>
            )}
            {device.uptime_hours && (
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span>Uptime: {formatUptime(device.uptime_hours)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Discovery Methods */}
        {device.discovery_method && device.discovery_method.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Discovery:</span>
            <div className="flex flex-wrap gap-1">
              {device.discovery_method.map((method, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Vulnerabilities */}
        {(device.vulnerability_count || 0) > 0 && (
          <div className="flex items-center justify-between p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Security Issues</span>
            </div>
            <Badge variant="destructive" className="text-xs">
              {device.vulnerability_count} issues
            </Badge>
          </div>
        )}

        {/* Expandable Details */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="w-full justify-center"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show More Details
            </>
          )}
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            {device.device_metadata && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Technical Details</h5>
                <div className="text-xs space-y-1 p-2 bg-muted/30 rounded font-mono">
                  {Object.entries(device.device_metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono text-xs break-all">
                        {typeof value === 'object' 
                          ? JSON.stringify(value, null, 2) 
                          : String(value)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {device.os_version && (
              <div className="text-xs">
                <span className="text-muted-foreground">OS Version: </span>
                <span className="font-medium">{device.os_version}</span>
              </div>
            )}
            
            {device.security_patches_needed > 0 && (
              <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-sm">Security patches needed</span>
                <Badge variant="secondary">{device.security_patches_needed}</Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};