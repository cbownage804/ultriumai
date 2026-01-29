/**
 * Network Scanner Overview Component
 * Shows all scanner agents and discovered devices
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Radar, Search, RefreshCw, Monitor, Server, Router, Laptop,
  Smartphone, Printer, Shield, AlertTriangle, Clock, Network,
  Globe, HardDrive
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useVanguardScanner } from '@/hooks/useVanguardScanner';

const deviceTypeIcons: Record<string, any> = {
  server: Server,
  workstation: Laptop,
  router: Router,
  switch: Network,
  printer: Printer,
  mobile: Smartphone,
  unknown: Monitor,
};

const riskColors: Record<string, string> = {
  safe: 'bg-green-500/20 text-green-400',
  low: 'bg-blue-500/20 text-blue-400',
  medium: 'bg-amber-500/20 text-amber-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
  unknown: 'bg-slate-500/20 text-slate-400',
};

export function NetworkScannerOverview() {
  const { 
    scanners, 
    discoveredDevices, 
    loading, 
    fetchScanners, 
    fetchDiscoveredDevices,
    triggerScan 
  } = useVanguardScanner();

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedScanner, setSelectedScanner] = useState<string>('all');

  useEffect(() => {
    fetchScanners();
    fetchDiscoveredDevices();
  }, []);

  const handleRefresh = () => {
    fetchScanners();
    fetchDiscoveredDevices(
      selectedScanner !== 'all' ? selectedScanner : undefined,
      riskFilter !== 'all' ? riskFilter : undefined
    );
  };

  const filteredDevices = discoveredDevices.filter(device => {
    const matchesSearch = 
      device.hostname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ip_address?.includes(searchQuery) ||
      device.mac_address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = riskFilter === 'all' || device.risk_level === riskFilter;
    const matchesScanner = selectedScanner === 'all' || device.scanner_agent_id === selectedScanner;
    
    return matchesSearch && matchesRisk && matchesScanner;
  });

  const riskStats = {
    safe: discoveredDevices.filter(d => d.risk_level === 'safe').length,
    low: discoveredDevices.filter(d => d.risk_level === 'low').length,
    medium: discoveredDevices.filter(d => d.risk_level === 'medium').length,
    high: discoveredDevices.filter(d => d.risk_level === 'high').length,
    critical: discoveredDevices.filter(d => d.risk_level === 'critical').length,
  };

  const totalRisk = Object.values(riskStats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Radar className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Network Discovery</h2>
            <p className="text-white/60 text-sm">
              {scanners.length} scanner agent{scanners.length !== 1 ? 's' : ''} • {discoveredDevices.length} devices found
            </p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 text-black"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(riskStats).map(([risk, count]) => (
          <Card key={risk} className="bg-black/40 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-sm text-white/60 capitalize">{risk} Risk</p>
                </div>
                <Badge className={riskColors[risk]}>{risk}</Badge>
              </div>
              {totalRisk > 0 && (
                <Progress 
                  value={(count / totalRisk) * 100} 
                  className="h-1 mt-2 bg-slate-800"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="bg-black/40 border border-cyan-500/20">
          <TabsTrigger value="devices">Discovered Devices</TabsTrigger>
          <TabsTrigger value="scanners">Scanner Agents</TabsTrigger>
        </TabsList>

        {/* Discovered Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search by IP, hostname, or MAC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/40 border-cyan-500/20 text-white"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[150px] bg-black/40 border-cyan-500/20 text-white">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-cyan-500/20">
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedScanner} onValueChange={setSelectedScanner}>
              <SelectTrigger className="w-[180px] bg-black/40 border-cyan-500/20 text-white">
                <SelectValue placeholder="Scanner" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-cyan-500/20">
                <SelectItem value="all">All Scanners</SelectItem>
                {scanners.map(scanner => (
                  <SelectItem key={scanner.id} value={scanner.id}>
                    {scanner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Devices Table */}
          <Card className="bg-black/40 border-cyan-500/20">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-cyan-500/20 hover:bg-transparent">
                    <TableHead className="text-white/60">Device</TableHead>
                    <TableHead className="text-white/60">IP Address</TableHead>
                    <TableHead className="text-white/60">MAC</TableHead>
                    <TableHead className="text-white/60">Open Ports</TableHead>
                    <TableHead className="text-white/60">Risk</TableHead>
                    <TableHead className="text-white/60">Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-white/40">
                        <Radar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No devices discovered yet</p>
                        <p className="text-sm">Enable a scanner agent to start discovering devices</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDevices.map((device) => {
                      const DeviceIcon = deviceTypeIcons[device.device_type] || Monitor;
                      return (
                        <TableRow 
                          key={device.id}
                          className="border-cyan-500/10 hover:bg-cyan-500/5 cursor-pointer"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-800">
                                <DeviceIcon className="h-4 w-4 text-cyan-400" />
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {device.hostname || 'Unknown Host'}
                                </div>
                                <div className="text-xs text-white/40 capitalize">
                                  {device.device_type} {device.manufacturer && `• ${device.manufacturer}`}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-cyan-400 text-sm">{device.ip_address}</code>
                          </TableCell>
                          <TableCell>
                            <code className="text-white/60 text-xs">{device.mac_address || '—'}</code>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {device.open_ports?.slice(0, 5).map(port => (
                                <Badge key={port} variant="outline" className="text-xs border-cyan-500/20 text-white/60">
                                  {port}
                                </Badge>
                              ))}
                              {device.open_ports?.length > 5 && (
                                <Badge variant="outline" className="text-xs border-cyan-500/20 text-white/40">
                                  +{device.open_ports.length - 5}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={riskColors[device.risk_level]}>
                              {device.risk_level === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {device.risk_level}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white/60 text-sm">
                            {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Scanner Agents Tab */}
        <TabsContent value="scanners" className="space-y-4">
          {scanners.length === 0 ? (
            <Card className="bg-black/40 border-cyan-500/20">
              <CardContent className="py-12 text-center">
                <Radar className="h-12 w-12 mx-auto mb-4 text-white/40" />
                <p className="text-white/60">No scanner agents configured</p>
                <p className="text-sm text-white/40 mt-1">
                  Enable the scanner role on any Vanguard agent to start network discovery
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {scanners.map((scanner) => (
                <Card key={scanner.id} className="bg-black/40 border-cyan-500/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${scanner.status === 'online' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          <Radar className={`h-5 w-5 ${scanner.status === 'online' ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-white text-base">{scanner.name}</CardTitle>
                          <div className="text-xs text-white/40">
                            {scanner.ip_address || 'No IP'} • {scanner.device_id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                      <Badge className={scanner.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {scanner.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Subnets</span>
                      <span className="text-white">
                        {scanner.scanner_subnets?.length > 0 
                          ? scanner.scanner_subnets.join(', ') 
                          : 'Auto-detect'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Scan Interval</span>
                      <span className="text-white">{Math.floor(scanner.scan_interval_seconds / 60)}m</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Last Scan</span>
                      <span className="text-white">
                        {scanner.last_scan_at 
                          ? formatDistanceToNow(new Date(scanner.last_scan_at), { addSuffix: true })
                          : 'Never'}
                      </span>
                    </div>
                    <Button
                      onClick={() => triggerScan(scanner.id)}
                      disabled={scanner.status !== 'online'}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-black mt-2"
                    >
                      <Radar className="h-4 w-4 mr-2" />
                      Trigger Scan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
