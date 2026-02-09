import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, Search, Play, Pause, Server, Monitor, Printer,
  Wifi, Router, HelpCircle, Plus, RefreshCw, MapPin, AlertTriangle, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function NetworkDiscoveryScanner() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [scanJobs, setScanJobs] = useState<any[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewScan, setShowNewScan] = useState(false);
  const [newSubnet, setNewSubnet] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: jobs } = await supabase
        .from('network_scan_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setScanJobs(jobs || []);
      setDiscoveredDevices([]);
    } catch (err) {
      console.error('Error fetching network data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'workstation': return <Monitor className="h-4 w-4" />;
      case 'printer': return <Printer className="h-4 w-4" />;
      case 'network': return <Router className="h-4 w-4" />;
      case 'iot': return <Wifi className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'server': return 'bg-blue-500/20 text-blue-400';
      case 'workstation': return 'bg-green-500/20 text-green-400';
      case 'printer': return 'bg-purple-500/20 text-purple-400';
      case 'network': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredDevices = typeFilter === 'all' 
    ? discoveredDevices 
    : discoveredDevices.filter(d => d.device_type === typeFilter);

  const handleStartScan = async () => {
    if (!newSubnet.trim() || !user) return;
    const { error } = await supabase.from('network_scan_jobs').insert({
      user_id: user.id,
      scan_type: 'discovery',
      status: 'pending',
      targets: [newSubnet],
    } as any);
    if (error) {
      toast({ title: 'Error', description: 'Failed to start scan', variant: 'destructive' });
    } else {
      toast({ title: 'Scan queued', description: `Network discovery scan queued for ${newSubnet}` });
      setShowNewScan(false);
      setNewSubnet('');
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6" />
            Network Discovery
          </h2>
          <p className="text-muted-foreground">
            {discoveredDevices.length > 0 ? `${discoveredDevices.length} devices discovered` : 'Scan your network to discover devices'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showNewScan} onOpenChange={setShowNewScan}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Scan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Network Discovery Scan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Subnet / CIDR</Label>
                  <Input placeholder="e.g., 192.168.1.0/24" value={newSubnet} onChange={e => setNewSubnet(e.target.value)} />
                </div>
                <Button onClick={handleStartScan} disabled={!newSubnet.trim()}>
                  <Play className="h-4 w-4 mr-2" />Start Scan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{discoveredDevices.length}</p>
            <p className="text-xs text-muted-foreground">Devices Found</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-400">{discoveredDevices.filter(d => d.status === 'online').length}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{discoveredDevices.filter(d => !d.is_managed).length}</p>
            <p className="text-xs text-muted-foreground">Unmanaged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{scanJobs.length}</p>
            <p className="text-xs text-muted-foreground">Scans Run</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Discovered Devices ({discoveredDevices.length})</TabsTrigger>
          <TabsTrigger value="scans">Scan History ({scanJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <div className="flex items-center gap-4 mb-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="server">Servers</SelectItem>
                <SelectItem value="workstation">Workstations</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="printer">Printers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            {filteredDevices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>MAC</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map(device => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.device_type)}
                          <span className="font-medium">{device.hostname || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{device.ip_address}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{device.mac_address || '—'}</TableCell>
                      <TableCell><Badge className={getTypeColor(device.device_type)}>{device.device_type || 'unknown'}</Badge></TableCell>
                      <TableCell>
                        <Badge className={device.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                          {device.status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {device.last_seen ? new Date(device.last_seen).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CardContent>
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Network className="h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">No devices discovered</p>
                  <p className="text-sm">Run a network scan to discover devices on your network</p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="scans">
          <Card>
            {scanJobs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scan Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Targets</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium capitalize">{job.scan_type}</TableCell>
                      <TableCell>
                        <Badge className={
                          job.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          job.status === 'running' ? 'bg-cyan-500/10 text-cyan-400' :
                          job.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }>{job.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {Array.isArray(job.target_subnets) ? job.target_subnets.join(', ') : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No scan history yet
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
