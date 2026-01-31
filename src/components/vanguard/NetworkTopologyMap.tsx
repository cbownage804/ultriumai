import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Network, Server, Router, Laptop, Smartphone, Monitor, RefreshCw, 
  ZoomIn, ZoomOut, Move, Radar, Wifi, WifiOff, Shield, AlertTriangle,
  ArrowRight, Cpu, HardDrive, Globe, Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Auto-refresh interval
  useEffect(() => {
    if (user) loadNetworkData();
  }, [user]);

  // Real-time subscription for discovered devices
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('network-devices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'network_devices' },
        () => {
          loadNetworkData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vanguard_discovered_devices' },
        () => {
          loadNetworkData();
        }
      )
      .subscribe();

    // Auto-refresh every 60 seconds
    const refreshInterval = setInterval(loadNetworkData, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [user]);

  useEffect(() => {
    if (nodes.length > 0) {
      drawTopology();
    }
  }, [nodes, zoom, offset, selectedNode]);

  const loadNetworkData = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('network_devices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      const mappedNodes: NetworkNode[] = data.map((device, index) => {
        const angle = (index / data.length) * 2 * Math.PI;
        const radius = 150;
        return {
          id: device.id,
          label: device.device_name,
          type: inferDeviceType(device),
          ip: String(device.ip_address || 'Unknown'),
          status: device.status === 'online' ? 'online' : device.status === 'warning' ? 'warning' : 'offline',
          x: 400 + Math.cos(angle) * radius,
          y: 250 + Math.sin(angle) * radius,
          connections: device.parent_device_id ? [device.parent_device_id] : []
        };
      });
      setNodes(mappedNodes);
    } else {
      setNodes([]);
    }
    setIsLoading(false);
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
    ctx.strokeStyle = '#0e7490';
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

      // Node glow
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size);
      const glowColor = node.status === 'online' ? 'rgba(16, 185, 129, 0.3)' : 
                        node.status === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Node background
      ctx.fillStyle = node.status === 'online' ? '#10B981' : 
                      node.status === 'warning' ? '#F59E0B' : '#EF4444';
      ctx.beginPath();
      ctx.arc(node.x, node.y, size / 2 + 5, 0, Math.PI * 2);
      ctx.fill();

      // Node circle
      ctx.fillStyle = isSelected ? '#0891b2' : '#0a0a0a';
      ctx.strokeStyle = isSelected ? '#22d3ee' : '#164e63';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

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
      ctx.fillStyle = '#67e8f9';
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

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      {/* Animated Icon */}
      <motion.div 
        className="relative mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="relative p-8 rounded-full bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30">
          <motion.div
            animate={{ 
              rotate: 360,
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Radar className="h-16 w-16 text-cyan-400" />
          </motion.div>
        </div>
        
        {/* Orbiting dots */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3 
        className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        No Network Devices Discovered
      </motion.h3>

      <motion.p 
        className="text-slate-400 text-center max-w-md mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Deploy a Recon Unit or configure an agent as a network scanner to discover devices on your network.
      </motion.p>

      {/* Action Cards */}
      <motion.div 
        className="grid md:grid-cols-2 gap-4 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Deploy Recon Unit */}
        <Card className="bg-black/60 border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer group"
              onClick={() => navigate('/vanguard/recon')}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-200 mb-1 group-hover:text-cyan-400 transition-colors">
                  Deploy Recon Unit
                </h4>
                <p className="text-sm text-slate-500 mb-3">
                  Hardware appliance for continuous network monitoring and discovery
                </p>
                <div className="flex items-center text-xs text-cyan-400">
                  <span>View Hardware</span>
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configure Agent Scanner */}
        <Card className="bg-black/60 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group"
              onClick={() => navigate('/vanguard/devices')}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Search className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-200 mb-1 group-hover:text-purple-400 transition-colors">
                  Configure Agent Scanner
                </h4>
                <p className="text-sm text-slate-500 mb-3">
                  Enable network discovery on an existing Windows agent
                </p>
                <div className="flex items-center text-xs text-purple-400">
                  <span>Manage Devices</span>
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Discovery Features */}
      <motion.div 
        className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[
          { icon: Globe, label: 'IP Discovery', desc: 'Scan subnets' },
          { icon: Cpu, label: 'Device Fingerprinting', desc: 'Identify types' },
          { icon: HardDrive, label: 'Port Scanning', desc: 'Find services' },
          { icon: Wifi, label: 'Topology Mapping', desc: 'Visualize network' },
        ].map((feature, i) => (
          <div key={i} className="text-center">
            <div className="inline-flex p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-2">
              <feature.icon className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-300">{feature.label}</p>
            <p className="text-xs text-slate-500">{feature.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <Network className="h-5 w-5" />
                Network Topology
              </CardTitle>
              <CardDescription className="text-slate-500">
                Visual map of discovered network devices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                className="border-cyan-500/30 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center text-slate-400">{Math.round(zoom * 100)}%</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="border-cyan-500/30 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadNetworkData}
                className="border-cyan-500/30 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 && !isLoading ? (
            <EmptyState />
          ) : (
            <div className="relative border border-cyan-500/20 rounded-lg overflow-hidden bg-black/40">
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
              <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-slate-500">
                <Move className="h-3 w-3" />
                Click and drag to pan
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedNode && (
        <Card className="bg-black/60 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              {getNodeIcon(selectedNode.type)}
              {selectedNode.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">IP Address</p>
                <p className="font-medium text-cyan-400">{selectedNode.ip}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Type</p>
                <p className="font-medium text-slate-200 capitalize">{selectedNode.type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge className={
                  selectedNode.status === 'online' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  selectedNode.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }>
                  {selectedNode.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Connections</p>
                <p className="font-medium text-slate-200">{selectedNode.connections.length} devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {nodes.length > 0 && (
        <Card className="bg-black/60 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-slate-300">Network Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/30" />
                <span className="text-sm text-slate-400">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/30" />
                <span className="text-sm text-slate-400">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
                <span className="text-sm text-slate-400">Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <Router className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-400">Router/Gateway</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-400">Server</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-400">Workstation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};