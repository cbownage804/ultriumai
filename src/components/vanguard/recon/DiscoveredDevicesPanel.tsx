/**
 * Discovered Devices Panel
 * Shows devices found by the Recon Unit's network scanner
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Monitor,
  Server,
  Smartphone,
  Printer,
  Router,
  HardDrive,
  Search,
  RefreshCw,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Globe,
  Wifi
} from 'lucide-react';
import { useVanguardScanner } from '@/hooks/useVanguardScanner';
import { formatDistanceToNow } from 'date-fns';

interface DiscoveredDevicesPanelProps {
  agentId: string;
}

const deviceTypeIcons: Record<string, any> = {
  workstation: Monitor,
  server: Server,
  mobile: Smartphone,
  printer: Printer,
  router: Router,
  switch: Router,
  nas: HardDrive,
  iot: Wifi,
  unknown: Globe,
};

const riskColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function DiscoveredDevicesPanel({ agentId }: DiscoveredDevicesPanelProps) {
  const { discoveredDevices, fetchDiscoveredDevices, loading } = useVanguardScanner();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscoveredDevices(agentId);
  }, [agentId, fetchDiscoveredDevices]);

  const filteredDevices = discoveredDevices.filter(device => {
    const matchesSearch = !searchQuery || 
      device.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.hostname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.mac_address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = !filterRisk || device.risk_level === filterRisk;
    
    return matchesSearch && matchesRisk;
  });

  const riskCounts = {
    critical: discoveredDevices.filter(d => d.risk_level === 'critical').length,
    high: discoveredDevices.filter(d => d.risk_level === 'high').length,
    medium: discoveredDevices.filter(d => d.risk_level === 'medium').length,
    low: discoveredDevices.filter(d => d.risk_level === 'low').length,
  };

  if (loading && discoveredDevices.length === 0) {
    return (
      <Card className="bg-black/40 border-cyan-500/20">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-cyan-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5 text-cyan-400" />
              Discovered Devices
            </CardTitle>
            <CardDescription className="text-white/60">
              {discoveredDevices.length} devices found on the network
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDiscoveredDevices(agentId)}
            disabled={loading}
            className="border-cyan-500/20 text-cyan-400"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Summary */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterRisk(filterRisk === 'critical' ? null : 'critical')}
            className={`${filterRisk === 'critical' ? 'bg-red-500/20' : ''}`}
          >
            <AlertTriangle className="h-4 w-4 mr-1 text-red-400" />
            Critical ({riskCounts.critical})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterRisk(filterRisk === 'high' ? null : 'high')}
            className={`${filterRisk === 'high' ? 'bg-orange-500/20' : ''}`}
          >
            <Shield className="h-4 w-4 mr-1 text-orange-400" />
            High ({riskCounts.high})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterRisk(filterRisk === 'medium' ? null : 'medium')}
            className={`${filterRisk === 'medium' ? 'bg-amber-500/20' : ''}`}
          >
            <Shield className="h-4 w-4 mr-1 text-amber-400" />
            Medium ({riskCounts.medium})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterRisk(filterRisk === 'low' ? null : 'low')}
            className={`${filterRisk === 'low' ? 'bg-green-500/20' : ''}`}
          >
            <ShieldCheck className="h-4 w-4 mr-1 text-green-400" />
            Low ({riskCounts.low})
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search by IP, hostname, or MAC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/40 border-cyan-500/20 text-white"
          />
        </div>

        {/* Device List */}
        {filteredDevices.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No devices discovered yet</p>
            <p className="text-sm">Enable the scanner and run a network scan</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredDevices.map((device) => {
                const DeviceIcon = deviceTypeIcons[device.device_type] || Globe;
                return (
                  <div
                    key={device.id}
                    className="p-3 rounded-lg bg-black/20 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <DeviceIcon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium text-white">
                            {device.ip_address}
                          </span>
                          {device.hostname && (
                            <span className="text-white/60 text-sm truncate">
                              ({device.hostname})
                            </span>
                          )}
                          <Badge className={riskColors[device.risk_level] || riskColors.info}>
                            {device.risk_level}
                          </Badge>
                          {device.is_managed && (
                            <Badge className="bg-green-500/20 text-green-400">Managed</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                          {device.mac_address && <span>MAC: {device.mac_address}</span>}
                          {device.manufacturer && <span>{device.manufacturer}</span>}
                          {device.os_info && <span>{device.os_info}</span>}
                        </div>
                        {device.open_ports?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {device.open_ports.slice(0, 8).map((port) => (
                              <Badge key={port} variant="outline" className="text-xs border-cyan-500/20 text-cyan-400">
                                {port}
                              </Badge>
                            ))}
                            {device.open_ports.length > 8 && (
                              <Badge variant="outline" className="text-xs border-white/20 text-white/40">
                                +{device.open_ports.length - 8} more
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-white/30 mt-2">
                          Last seen: {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
