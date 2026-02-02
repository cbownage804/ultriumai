import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Server, 
  Download, RefreshCw, TrendingUp, Clock, Filter
} from 'lucide-react';

interface DeviceCompliance {
  id: string;
  deviceName: string;
  osVersion: string;
  lastPatch: string;
  pendingPatches: number;
  criticalPending: number;
  complianceScore: number;
  status: 'compliant' | 'warning' | 'critical' | 'unknown';
}

const mockDevices: DeviceCompliance[] = [
  { id: '1', deviceName: 'SRV-DC01', osVersion: 'Windows Server 2022', lastPatch: '2024-01-15', pendingPatches: 0, criticalPending: 0, complianceScore: 100, status: 'compliant' },
  { id: '2', deviceName: 'SRV-SQL01', osVersion: 'Windows Server 2019', lastPatch: '2024-01-10', pendingPatches: 2, criticalPending: 0, complianceScore: 85, status: 'warning' },
  { id: '3', deviceName: 'WKS-001', osVersion: 'Windows 11 23H2', lastPatch: '2024-01-14', pendingPatches: 1, criticalPending: 0, complianceScore: 92, status: 'compliant' },
  { id: '4', deviceName: 'WKS-002', osVersion: 'Windows 10 22H2', lastPatch: '2024-01-05', pendingPatches: 5, criticalPending: 2, complianceScore: 45, status: 'critical' },
  { id: '5', deviceName: 'SRV-FILE01', osVersion: 'Windows Server 2022', lastPatch: '2024-01-12', pendingPatches: 1, criticalPending: 0, complianceScore: 88, status: 'compliant' },
  { id: '6', deviceName: 'WKS-003', osVersion: 'Windows 11 23H2', lastPatch: '2024-01-08', pendingPatches: 3, criticalPending: 1, complianceScore: 62, status: 'warning' },
];

interface PatchSummary {
  category: string;
  total: number;
  installed: number;
  pending: number;
  failed: number;
}

const mockPatchSummary: PatchSummary[] = [
  { category: 'Security Updates', total: 156, installed: 145, pending: 8, failed: 3 },
  { category: 'Cumulative Updates', total: 52, installed: 48, pending: 4, failed: 0 },
  { category: 'Feature Updates', total: 12, installed: 10, pending: 2, failed: 0 },
  { category: 'Driver Updates', total: 89, installed: 82, pending: 5, failed: 2 },
  { category: 'Definition Updates', total: 365, installed: 365, pending: 0, failed: 0 },
];

export function PatchComplianceDashboard() {
  const [devices] = useState(mockDevices);
  const [patchSummary] = useState(mockPatchSummary);
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500/20 text-green-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const overallCompliance = Math.round(
    devices.reduce((sum, d) => sum + d.complianceScore, 0) / devices.length
  );

  const filteredDevices = filterStatus === 'all' 
    ? devices 
    : devices.filter(d => d.status === filterStatus);

  const criticalCount = devices.filter(d => d.status === 'critical').length;
  const warningCount = devices.filter(d => d.status === 'warning').length;
  const compliantCount = devices.filter(d => d.status === 'compliant').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patch Compliance Dashboard</h2>
          <p className="text-muted-foreground">Track patch status across all devices with risk scoring</p>
        </div>
        <Button>
          <RefreshCw className="h-4 w-4 mr-2" /> Sync Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className={`${overallCompliance >= 90 ? 'bg-green-500/10 border-green-500/30' : overallCompliance >= 70 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <CardContent className="pt-4">
            <div className={`text-3xl font-bold ${getScoreColor(overallCompliance)}`}>
              {overallCompliance}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Compliance</p>
            <Progress value={overallCompliance} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{compliantCount}</div>
            <p className="text-sm text-muted-foreground">Compliant</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
            <p className="text-sm text-muted-foreground">Warning</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
            <p className="text-sm text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {devices.reduce((sum, d) => sum + d.pendingPatches, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Pending Updates</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Device Compliance</TabsTrigger>
          <TabsTrigger value="patches">Patch Summary</TabsTrigger>
          <TabsTrigger value="trends">Compliance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>OS Version</TableHead>
                  <TableHead>Last Patched</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Critical</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map(device => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{device.deviceName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{device.osVersion}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {device.lastPatch}
                      </div>
                    </TableCell>
                    <TableCell>
                      {device.pendingPatches > 0 ? (
                        <Badge variant="outline">{device.pendingPatches}</Badge>
                      ) : (
                        <span className="text-green-400">✓</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {device.criticalPending > 0 ? (
                        <Badge className="bg-red-500/20 text-red-400">{device.criticalPending}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getScoreColor(device.complianceScore)}`}>
                          {device.complianceScore}%
                        </span>
                        <Progress value={device.complianceScore} className="w-16 h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" disabled={device.pendingPatches === 0}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="patches">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Patch Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patchSummary.map(cat => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-muted-foreground">
                          {cat.installed}/{cat.total}
                        </span>
                      </div>
                      <Progress value={(cat.installed / cat.total) * 100} className="h-2" />
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-400">{cat.installed} installed</span>
                        <span className="text-yellow-400">{cat.pending} pending</span>
                        {cat.failed > 0 && <span className="text-red-400">{cat.failed} failed</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Failures</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {[
                      { patch: 'KB5034441', device: 'WKS-002', reason: 'Insufficient disk space', time: '2 hours ago' },
                      { patch: 'KB5033909', device: 'SRV-SQL01', reason: 'Service dependency', time: '1 day ago' },
                      { patch: 'KB5034123', device: 'WKS-005', reason: 'Network timeout', time: '2 days ago' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10">
                        <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{item.patch} on {item.device}</p>
                          <p className="text-sm text-red-400">{item.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                        </div>
                        <Button size="sm" variant="ghost">Retry</Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Compliance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Compliance trend chart would display here</p>
                  <p className="text-sm">Showing 30-day historical data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
