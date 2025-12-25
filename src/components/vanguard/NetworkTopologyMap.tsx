import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Server, Router, Laptop, Smartphone, Monitor, RefreshCw, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NetworkNode {
  id: string;
  label: string;
  type: 'router' | 'switch' | 'server' | 'workstation' | 'mobile' | 'unknown';
  ip: string;
  status: 'online' | 'offline' | 'warning';
  x: number;
  y: number;
  connections: string[];
}

export const NetworkTopologyMap = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (user) loadNetworkData();
  }, [user]);

  useEffect(() => {
    drawTopology();
  }, [nodes, zoom, offset, selectedNode]);

  const loadNetworkData = async () => {
    // Use mock data for topology visualization
    setNodes(generateMockTopology());
  };

  const inferDeviceType = (device: any): NetworkNode['type'] => {
    const hostname = (device.hostname || '').toLowerCase();
    if (hostname.includes('router') || hostname.includes('gw')) return 'router';
    if (hostname.includes('switch') || hostname.includes('sw')) return 'switch';
    if (hostname.includes('server') || hostname.includes('srv') || hostname.includes('dc')) return 'server';
    if (hostname.includes('laptop') || hostname.includes('nb')) return 'workstation';
    if (hostname.includes('phone') || hostname.includes('mobile')) return 'mobile';
    return 'workstation';
  };

  const generateMockTopology = (): NetworkNode[] => {
    return [
      { id: 'gw', label: 'Internet Gateway', type: 'router', ip: '192.168.1.1', status: 'online', x: 400, y: 50, connections: ['fw'] },
      { id: 'fw', label: 'Firewall', type: 'router', ip: '192.168.1.2', status: 'online', x: 400, y: 130, connections: ['sw1', 'sw2'] },
      { id: 'sw1', label: 'Core Switch 1', type: 'switch', ip: '192.168.1.10', status: 'online', x: 250, y: 220, connections: ['srv1', 'srv2', 'ws1', 'ws2'] },
      { id: 'sw2', label: 'Core Switch 2', type: 'switch', ip: '192.168.1.11', status: 'online', x: 550, y: 220, connections: ['srv3', 'ws3', 'ws4', 'mob1'] },
      { id: 'srv1', label: 'DC-PRIMARY', type: 'server', ip: '192.168.1.20', status: 'online', x: 100, y: 320, connections: [] },
      { id: 'srv2', label: 'FILE-SERVER', type: 'server', ip: '192.168.1.21', status: 'online', x: 220, y: 320, connections: [] },
      { id: 'srv3', label: 'WEB-SERVER', type: 'server', ip: '192.168.1.22', status: 'warning', x: 550, y: 320, connections: [] },
      { id: 'ws1', label: 'WORKSTATION-01', type: 'workstation', ip: '192.168.1.100', status: 'online', x: 100, y: 420, connections: [] },
      { id: 'ws2', label: 'WORKSTATION-02', type: 'workstation', ip: '192.168.1.101', status: 'online', x: 220, y: 420, connections: [] },
      { id: 'ws3', label: 'WORKSTATION-03', type: 'workstation', ip: '192.168.1.102', status: 'offline', x: 450, y: 420, connections: [] },
      { id: 'ws4', label: 'LAPTOP-01', type: 'workstation', ip: '192.168.1.103', status: 'online', x: 570, y: 420, connections: [] },
      { id: 'mob1', label: 'MOBILE-01', type: 'mobile', ip: '192.168.1.150', status: 'online', x: 690, y: 420, connections: [] },
    ];
  };

  const drawTopology = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw connections
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2;
    nodes.forEach(node => {
      node.connections.forEach(connId => {
        const targetNode = nodes.find(n => n.id === connId);
        if (targetNode) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();
        }
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const size = 40;

      // Node background
      ctx.fillStyle = node.status === 'online' ? '#10B981' : 
                      node.status === 'warning' ? '#F59E0B' : '#EF4444';
      ctx.beginPath();
      ctx.arc(node.x, node.y, size / 2 + 5, 0, Math.PI * 2);
      ctx.fill();

      // Node circle
      ctx.fillStyle = isSelected ? '#3B82F6' : '#1F2937';
      ctx.beginPath();
      ctx.arc(node.x, node.y, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Icon placeholder
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = node.type === 'router' ? '🌐' : 
                   node.type === 'switch' ? '🔀' :
                   node.type === 'server' ? '🖥️' :
                   node.type === 'mobile' ? '📱' : '💻';
      ctx.fillText(icon, node.x, node.y);

      // Label
      ctx.fillStyle = '#E5E7EB';
      ctx.font = '11px sans-serif';
      ctx.fillText(node.label, node.x, node.y + size / 2 + 15);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      ctx.fillText(node.ip, node.x, node.y + size / 2 + 28);
    });

    ctx.restore();
  }, [nodes, zoom, offset, selectedNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    const clickedNode = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const getNodeIcon = (type: NetworkNode['type']) => {
    switch (type) {
      case 'router': return <Router className="h-4 w-4" />;
      case 'server': return <Server className="h-4 w-4" />;
      case 'workstation': return <Monitor className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      default: return <Laptop className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Topology
              </CardTitle>
              <CardDescription>
                Visual map of discovered network devices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={loadNetworkData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative border rounded-lg overflow-hidden bg-background">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full cursor-move"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Move className="h-3 w-3" />
              Click and drag to pan
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getNodeIcon(selectedNode.type)}
              {selectedNode.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">IP Address</p>
                <p className="font-medium">{selectedNode.ip}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{selectedNode.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={
                  selectedNode.status === 'online' ? 'bg-green-500' :
                  selectedNode.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }>
                  {selectedNode.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connections</p>
                <p className="font-medium">{selectedNode.connections.length} devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Network Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm">Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <Router className="h-4 w-4" />
              <span className="text-sm">Router/Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="text-sm">Server</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="text-sm">Workstation</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
