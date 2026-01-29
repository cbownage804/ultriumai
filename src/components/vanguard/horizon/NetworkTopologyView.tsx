import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Network,
  Server,
  Monitor,
  Laptop,
  Smartphone,
  Wifi,
  Router,
  HardDrive,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHorizonStats, DeviceWithMetrics } from "@/hooks/useHorizonStats";

interface NetworkNode {
  id: string;
  name: string;
  type: "router" | "switch" | "server" | "workstation" | "laptop" | "mobile" | "unknown";
  ip: string;
  status: "online" | "offline" | "warning" | "critical";
  subnet: string;
  connections: string[];
  x: number;
  y: number;
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  router: <Router className="h-6 w-6" />,
  switch: <Network className="h-6 w-6" />,
  server: <Server className="h-6 w-6" />,
  workstation: <Monitor className="h-6 w-6" />,
  laptop: <Laptop className="h-6 w-6" />,
  mobile: <Smartphone className="h-6 w-6" />,
  unknown: <HardDrive className="h-6 w-6" />,
};

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500 border-green-400",
  offline: "bg-gray-500 border-gray-400",
  warning: "bg-yellow-500 border-yellow-400",
  critical: "bg-red-500 border-red-400",
};

const STATUS_GLOW: Record<string, string> = {
  online: "shadow-green-500/50",
  offline: "",
  warning: "shadow-yellow-500/50",
  critical: "shadow-red-500/50 animate-pulse",
};

export function NetworkTopologyView() {
  const { devices } = useHorizonStats();
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Generate network topology from devices
  const { nodes, subnets } = useMemo(() => {
    const subnetMap = new Map<string, DeviceWithMetrics[]>();
    
    devices.forEach(device => {
      const ip = device.ip_address || "0.0.0.0";
      const subnet = ip.split(".").slice(0, 3).join(".") + ".0/24";
      if (!subnetMap.has(subnet)) {
        subnetMap.set(subnet, []);
      }
      subnetMap.get(subnet)!.push(device);
    });

    const allNodes: NetworkNode[] = [];
    const subnetList = Array.from(subnetMap.keys());
    
    // Create a virtual router/gateway for each subnet
    subnetList.forEach((subnet, subnetIdx) => {
      const gatewayIp = subnet.replace(".0/24", ".1");
      allNodes.push({
        id: `gateway-${subnet}`,
        name: `Gateway ${subnet}`,
        type: "router",
        ip: gatewayIp,
        status: "online",
        subnet,
        connections: [],
        x: 400,
        y: 100 + subnetIdx * 250,
      });
    });

    // Add devices as nodes
    subnetList.forEach((subnet, subnetIdx) => {
      const subnetDevices = subnetMap.get(subnet) || [];
      const gatewayId = `gateway-${subnet}`;
      
      subnetDevices.forEach((device, deviceIdx) => {
        const nodeType = device.agent_type === "server" ? "server" : 
                        device.os_info?.toLowerCase().includes("laptop") ? "laptop" : "workstation";
        
        const node: NetworkNode = {
          id: device.id,
          name: device.name,
          type: nodeType,
          ip: device.ip_address || "Unknown",
          status: device.status as any || "offline",
          subnet,
          connections: [gatewayId],
          x: 150 + (deviceIdx % 5) * 150,
          y: 200 + subnetIdx * 250 + Math.floor(deviceIdx / 5) * 100,
        };
        
        allNodes.push(node);
        
        // Add connection to gateway
        const gateway = allNodes.find(n => n.id === gatewayId);
        if (gateway) {
          gateway.connections.push(device.id);
        }
      });
    });

    return { nodes: allNodes, subnets: subnetList };
  }, [devices]);

  // Draw connection lines
  const connections = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; status: string }> = [];
    
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = nodes.find(n => n.id === targetId);
        if (target && node.id < targetId) { // Avoid duplicate lines
          lines.push({
            x1: node.x,
            y1: node.y,
            x2: target.x,
            y2: target.y,
            status: node.status === "online" && target.status === "online" ? "online" : "offline",
          });
        }
      });
    });
    
    return lines;
  }, [nodes]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  // Stats
  const onlineCount = nodes.filter(n => n.status === "online" && n.type !== "router").length;
  const offlineCount = nodes.filter(n => n.status === "offline" && n.type !== "router").length;
  const warningCount = nodes.filter(n => n.status === "warning" || n.status === "critical").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-cyan-500" />
              Network Topology
            </CardTitle>
            <CardDescription>
              Visual representation of your network infrastructure
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 mr-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>{onlineCount} Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span>{offlineCount} Offline</span>
              </div>
              {warningCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>{warningCount} Warning</span>
                </div>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg border bg-muted/20" style={{ height: "500px" }}>
          <TooltipProvider>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 900 500"
              className="transition-transform"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            >
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted/20" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Subnet backgrounds */}
              {subnets.map((subnet, idx) => (
                <g key={subnet}>
                  <rect
                    x="50"
                    y={70 + idx * 250}
                    width="800"
                    height="200"
                    rx="10"
                    fill="currentColor"
                    className="text-primary/5"
                  />
                  <text
                    x="60"
                    y={90 + idx * 250}
                    className="fill-muted-foreground text-xs"
                    fontSize="12"
                  >
                    {subnet}
                  </text>
                </g>
              ))}

              {/* Connection lines */}
              {connections.map((conn, idx) => (
                <line
                  key={idx}
                  x1={conn.x1}
                  y1={conn.y1}
                  x2={conn.x2}
                  y2={conn.y2}
                  stroke={conn.status === "online" ? "#22c55e" : "#6b7280"}
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  strokeDasharray={conn.status === "offline" ? "5,5" : ""}
                />
              ))}

              {/* Nodes */}
              {nodes.map(node => (
                <Tooltip key={node.id}>
                  <TooltipTrigger asChild>
                    <g
                      className="cursor-pointer transition-transform hover:scale-110"
                      onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                    >
                      {/* Node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.type === "router" ? 25 : 20}
                        className={cn(
                          "transition-all",
                          STATUS_COLORS[node.status],
                          selectedNode === node.id && "stroke-2 stroke-white"
                        )}
                        fill="currentColor"
                        style={{
                          filter: node.status !== "offline" ? `drop-shadow(0 0 8px ${node.status === "online" ? "#22c55e" : node.status === "critical" ? "#ef4444" : "#eab308"})` : undefined,
                        }}
                      />
                      
                      {/* Icon */}
                      <foreignObject
                        x={node.x - 12}
                        y={node.y - 12}
                        width="24"
                        height="24"
                        className="text-white pointer-events-none"
                      >
                        <div className="flex items-center justify-center w-full h-full">
                          {DEVICE_ICONS[node.type]}
                        </div>
                      </foreignObject>

                      {/* Label */}
                      <text
                        x={node.x}
                        y={node.y + 35}
                        textAnchor="middle"
                        className="fill-foreground text-xs"
                        fontSize="10"
                      >
                        {node.name.length > 12 ? node.name.slice(0, 12) + "..." : node.name}
                      </text>
                    </g>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">{node.name}</p>
                      <p className="text-muted-foreground">{node.ip}</p>
                      <p className="text-muted-foreground capitalize">{node.type}</p>
                      <Badge variant={node.status === "online" ? "default" : "secondary"} className="mt-2">
                        {node.status}
                      </Badge>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </svg>
          </TooltipProvider>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No devices to display</p>
                <p className="text-sm">Deploy agents to see network topology</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
