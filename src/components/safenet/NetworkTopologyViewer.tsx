import { useEffect, useRef, useState } from "react";
import { useSafeNetData } from "@/hooks/useSafeNetData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Monitor, 
  Server, 
  Smartphone, 
  Router, 
  Printer, 
  HardDrive,
  Wifi,
  RefreshCw,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkTopologyViewerProps {
  compact?: boolean;
}

interface DeviceNode {
  id: string;
  x: number;
  y: number;
  device: any;
  type: string;
}

interface Connection {
  source: DeviceNode;
  target: DeviceNode;
  type: string;
}

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType?.toLowerCase()) {
    case 'router':
    case 'gateway':
      return Router;
    case 'server':
      return Server;
    case 'workstation':
    case 'desktop':
    case 'laptop':
      return Monitor;
    case 'mobile':
    case 'phone':
      return Smartphone;
    case 'printer':
      return Printer;
    case 'storage':
    case 'nas':
      return HardDrive;
    case 'iot':
    case 'smart_device':
      return Wifi;
    default:
      return Monitor;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-destructive border-destructive';
    case 'high':
      return 'bg-orange-500 border-orange-500';
    case 'medium':
      return 'bg-yellow-500 border-yellow-500';
    case 'low':
      return 'bg-blue-500 border-blue-500';
    default:
      return 'bg-primary border-primary';
  }
};

export const NetworkTopologyViewer = ({ compact = false }: NetworkTopologyViewerProps) => {
  const { devices, vulnerabilities, topology, isLoading, refreshData } = useSafeNetData();
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<DeviceNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const containerHeight = compact ? 300 : 500;
  const containerWidth = compact ? 600 : 800;

  // Generate network topology layout
  useEffect(() => {
    if (!devices.length) return;

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const radius = Math.min(containerWidth, containerHeight) / 3;

    // Create nodes with circular layout
    const deviceNodes: DeviceNode[] = devices.map((device, index) => {
      const angle = (2 * Math.PI * index) / devices.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        id: device.id,
        x,
        y,
        device,
        type: device.device_type || 'unknown'
      };
    });

    // Create connections from topology data
    const nodeMap = new Map(deviceNodes.map(node => [node.id, node]));
    const topologyConnections: Connection[] = topology
      .map(topo => {
        const source = nodeMap.get(topo.source_device_id);
        const target = nodeMap.get(topo.target_device_id);
        if (source && target) {
          return {
            source,
            target,
            type: topo.connection_type
          };
        }
        return null;
      })
      .filter(Boolean) as Connection[];

    setNodes(deviceNodes);
    setConnections(topologyConnections);
  }, [devices, topology, containerWidth, containerHeight]);

  const getDeviceVulnerabilities = (deviceId: string) => {
    return vulnerabilities.filter(v => v.device_id === deviceId);
  };

  const getHighestSeverity = (deviceVulns: any[]) => {
    if (!deviceVulns.length) return null;
    const severities = ['critical', 'high', 'medium', 'low'];
    return severities.find(s => deviceVulns.some(v => v.severity === s));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!devices.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Devices Found</h3>
        <p className="text-muted-foreground mb-4">
          Start by running a network scan to discover devices
        </p>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{devices.length} devices</Badge>
          <Badge variant="outline">{connections.length} connections</Badge>
        </div>
        {!compact && (
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      <div className="relative border rounded-lg overflow-hidden bg-card">
        <svg
          ref={svgRef}
          width={containerWidth}
          height={containerHeight}
          className="w-full h-full"
        >
          {/* Render connections */}
          {connections.map((connection, index) => (
            <line
              key={index}
              x1={connection.source.x}
              y1={connection.source.y}
              x2={connection.target.x}
              y2={connection.target.y}
              stroke="hsl(var(--border))"
              strokeWidth={2}
              strokeDasharray={connection.type === 'wireless' ? '5,5' : 'none'}
              opacity={0.6}
            />
          ))}

          {/* Render device nodes */}
          {nodes.map((node) => {
            const Icon = getDeviceIcon(node.type);
            const deviceVulns = getDeviceVulnerabilities(node.id);
            const highestSeverity = getHighestSeverity(deviceVulns);
            const isOnline = node.device.status === 'online';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x - 20}, ${node.y - 20})`}
                className="cursor-pointer"
                onClick={() => setSelectedDevice(selectedDevice === node.id ? null : node.id)}
              >
                {/* Device circle */}
                <circle
                  cx={20}
                  cy={20}
                  r={18}
                  fill="hsl(var(--card))"
                  stroke={
                    highestSeverity 
                      ? `hsl(var(--${highestSeverity === 'critical' ? 'destructive' : 'orange'}))`
                      : isOnline 
                        ? "hsl(var(--primary))" 
                        : "hsl(var(--muted-foreground))"
                  }
                  strokeWidth={2}
                  className={cn(
                    "transition-all duration-200",
                    selectedDevice === node.id && "stroke-4"
                  )}
                />

                {/* Status indicator */}
                <circle
                  cx={32}
                  cy={12}
                  r={4}
                  fill={isOnline ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                />

                {/* Vulnerability indicator */}
                {highestSeverity && (
                  <circle
                    cx={32}
                    cy={28}
                    r={4}
                    fill={highestSeverity === 'critical' ? "hsl(var(--destructive))" : "hsl(var(--orange))"}
                  />
                )}

                {/* Device icon */}
                <foreignObject x={12} y={12} width={16} height={16}>
                  <Icon className="h-4 w-4 text-foreground" />
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Device details panel */}
        {selectedDevice && (
          <Card className={cn(
            "absolute top-4 right-4 w-64 z-10",
            compact && "w-56"
          )}>
            <CardContent className="p-4">
              {(() => {
                const device = devices.find(d => d.id === selectedDevice);
                const deviceVulns = getDeviceVulnerabilities(selectedDevice);
                if (!device) return null;

                const Icon = getDeviceIcon(device.device_type);

                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">{device.device_name || device.hostname || 'Unknown Device'}</h4>
                        <p className="text-sm text-muted-foreground">{String(device.ip_address)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                          {device.status}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Type:</span>
                        <span className="text-muted-foreground">{device.device_type || 'Unknown'}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Role:</span>
                        <span className="text-muted-foreground">{device.device_role || 'Unknown'}</span>
                      </div>

                      {device.manufacturer && (
                        <div className="flex justify-between text-sm">
                          <span>Manufacturer:</span>
                          <span className="text-muted-foreground">{device.manufacturer}</span>
                        </div>
                      )}

                      {device.model && (
                        <div className="flex justify-between text-sm">
                          <span>Model:</span>
                          <span className="text-muted-foreground">{device.model}</span>
                        </div>
                      )}

                      {device.os_family && (
                        <div className="flex justify-between text-sm">
                          <span>OS Family:</span>
                          <span className="text-muted-foreground">{device.os_family}</span>
                        </div>
                      )}

                      {device.os_version && (
                        <div className="flex justify-between text-sm">
                          <span>OS Version:</span>
                          <span className="text-muted-foreground">{device.os_version}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span>MAC Address:</span>
                        <span className="text-muted-foreground font-mono">{device.mac_address}</span>
                      </div>

                      {device.network_segment && (
                        <div className="flex justify-between text-sm">
                          <span>Network:</span>
                          <span className="text-muted-foreground">{device.network_segment}</span>
                        </div>
                      )}

                      {device.uptime_hours && (
                        <div className="flex justify-between text-sm">
                          <span>Uptime:</span>
                          <span className="text-muted-foreground">{device.uptime_hours}h</span>
                        </div>
                      )}

                      {device.cpu_usage !== null && (
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage:</span>
                          <span className="text-muted-foreground">{device.cpu_usage}%</span>
                        </div>
                      )}

                      {device.memory_usage !== null && (
                        <div className="flex justify-between text-sm">
                          <span>Memory Usage:</span>
                          <span className="text-muted-foreground">{device.memory_usage}%</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span>Managed:</span>
                        <Badge variant={device.is_managed ? 'default' : 'secondary'}>
                          {device.is_managed ? 'Yes' : 'No'}
                        </Badge>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Critical:</span>
                        <Badge variant={device.is_critical ? 'destructive' : 'secondary'}>
                          {device.is_critical ? 'Yes' : 'No'}
                        </Badge>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Vulnerabilities:</span>
                        <Badge variant={deviceVulns.length > 0 ? "destructive" : "default"}>
                          {deviceVulns.length}
                        </Badge>
                      </div>

                      {device.security_patches_needed > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Patches Needed:</span>
                          <Badge variant="destructive">
                            {device.security_patches_needed}
                          </Badge>
                        </div>
                      )}

                      {device.discovery_method && device.discovery_method.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Discovery:</span>
                          <span className="text-muted-foreground">{device.discovery_method.join(', ')}</span>
                        </div>
                      )}

                      {device.last_seen_at && (
                        <div className="flex justify-between text-sm">
                          <span>Last Seen:</span>
                          <span className="text-muted-foreground">
                            {new Date(device.last_seen_at).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {device.device_metadata && (
                        <div className="pt-2 border-t">
                          <span className="text-sm font-medium">Additional Info:</span>
                          {device.device_metadata.port_count && (
                            <div className="flex justify-between text-sm">
                              <span>Open Ports:</span>
                              <span className="text-muted-foreground">{device.device_metadata.port_count}</span>
                            </div>
                          )}
                          {device.device_metadata.connector_version && (
                            <div className="flex justify-between text-sm">
                              <span>Connector:</span>
                              <span className="text-muted-foreground">v{device.device_metadata.connector_version}</span>
                            </div>
                          )}
                          {device.device_metadata.scan_timestamp && (
                            <div className="flex justify-between text-sm">
                              <span>Last Scan:</span>
                              <span className="text-muted-foreground">
                                {new Date(device.device_metadata.scan_timestamp).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {compact && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Click devices for details</span>
          <Button variant="ghost" size="sm" onClick={refreshData}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};