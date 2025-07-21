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
  const risk = getRiskLevel(device.vulnerabilities?.length || 0, false, device.risk_level === 'critical');
  
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
                {device.hostname || 'Unknown Device'}
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
              <span className="font-medium">{device.os_info || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Risk:</span>
              <span className="font-medium capitalize">{device.risk_level || 'Unknown'}</span>
            </div>
          </div>
          <div className="space-y-2">
            {device.mac_address && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">MAC:</span>
                <span className="font-medium font-mono text-xs">{device.mac_address}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Vulnerabilities:</span>
              <Badge variant={device.vulnerabilities?.length ? 'destructive' : 'default'} className="text-xs">
                {device.vulnerabilities?.length ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                {device.vulnerabilities?.length || 0}
              </Badge>
            </div>
          </div>
        </div>

        {/* Open Ports */}
        {device.open_ports && device.open_ports.length > 0 && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium flex items-center">
              <Network className="h-4 w-4 mr-2" />
              Open Ports
            </h4>
            <div className="flex flex-wrap gap-1">
              {device.open_ports.slice(0, 8).map((port, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {port}
                </Badge>
              ))}
              {device.open_ports.length > 8 && (
                <Badge variant="secondary" className="text-xs">
                  +{device.open_ports.length - 8} more
                </Badge>
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
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>Range: {device.network_range}</span>
            </div>
            {device.last_seen && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>Seen: {formatLastSeen(device.last_seen)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Vulnerabilities */}
        {device.vulnerabilities && device.vulnerabilities.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Security Issues</span>
            </div>
            <Badge variant="destructive" className="text-xs">
              {device.vulnerabilities.length} issues
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
            {device.services && Object.keys(device.services).length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Detected Services</h5>
                <div className="text-xs space-y-1 p-2 bg-muted/30 rounded font-mono">
                  {Object.entries(device.services).map(([key, value]) => (
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
            
            {device.vulnerabilities && device.vulnerabilities.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Vulnerabilities</h5>
                <div className="space-y-1">
                  {device.vulnerabilities.slice(0, 3).map((vuln, index) => (
                    <div key={index} className="text-xs bg-destructive/10 text-destructive p-2 rounded">
                      {vuln}
                    </div>
                  ))}
                  {device.vulnerabilities.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{device.vulnerabilities.length - 3} more vulnerabilities
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};