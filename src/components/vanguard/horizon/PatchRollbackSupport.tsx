import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RotateCcw, AlertTriangle, CheckCircle, Clock, Server,
  HardDrive, Save, Trash2, Play, Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RestorePoint {
  id: string;
  deviceName: string;
  createdAt: string;
  reason: string;
  patchId: string;
  patchName: string;
  size: string;
  status: 'available' | 'expired' | 'in_use';
}

interface RollbackAction {
  id: string;
  deviceName: string;
  patchId: string;
  patchName: string;
  initiatedAt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completedAt?: string;
  error?: string;
}

const mockRestorePoints: RestorePoint[] = [
  { id: '1', deviceName: 'WKS-001', createdAt: '2024-01-15 01:55', reason: 'Pre-patch: KB5034441', patchId: 'KB5034441', patchName: 'Windows Security Update', size: '2.1 GB', status: 'available' },
  { id: '2', deviceName: 'WKS-002', createdAt: '2024-01-14 02:30', reason: 'Pre-patch: KB5033909', patchId: 'KB5033909', patchName: '.NET Framework Update', size: '1.8 GB', status: 'available' },
  { id: '3', deviceName: 'SRV-DC01', createdAt: '2024-01-13 03:00', reason: 'Pre-patch: KB5034123', patchId: 'KB5034123', patchName: 'Cumulative Update', size: '4.2 GB', status: 'available' },
  { id: '4', deviceName: 'WKS-003', createdAt: '2024-01-10 02:00', reason: 'Pre-patch: KB5033877', patchId: 'KB5033877', patchName: 'Driver Update', size: '890 MB', status: 'expired' },
];

const mockRollbacks: RollbackAction[] = [
  { id: '1', deviceName: 'WKS-005', patchId: 'KB5034441', patchName: 'Windows Security Update', initiatedAt: '2024-01-15 10:30', status: 'completed', completedAt: '2024-01-15 10:45' },
  { id: '2', deviceName: 'SRV-SQL01', patchId: 'KB5033909', patchName: '.NET Framework Update', initiatedAt: '2024-01-14 14:00', status: 'failed', error: 'Restore point corrupted' },
];

export function PatchRollbackSupport() {
  const { toast } = useToast();
  const [restorePoints] = useState(mockRestorePoints);
  const [rollbacks, setRollbacks] = useState(mockRollbacks);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [selectedRestore, setSelectedRestore] = useState<RestorePoint | null>(null);
  const [autoRestoreEnabled, setAutoRestoreEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState('14');

  const initiateRollback = (restore: RestorePoint) => {
    const newRollback: RollbackAction = {
      id: Date.now().toString(),
      deviceName: restore.deviceName,
      patchId: restore.patchId,
      patchName: restore.patchName,
      initiatedAt: new Date().toISOString(),
      status: 'in_progress'
    };
    setRollbacks(prev => [newRollback, ...prev]);
    setShowRollbackDialog(false);
    toast({ 
      title: 'Rollback initiated',
      description: `Rolling back ${restore.patchName} on ${restore.deviceName}`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400';
      case 'expired': return 'bg-muted text-muted-foreground';
      case 'in_use': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patch Rollback Support</h2>
          <p className="text-muted-foreground">Undo problematic patches with system restore points</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{restorePoints.filter(r => r.status === 'available').length}</div>
            <p className="text-sm text-muted-foreground">Available Restore Points</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {restorePoints.reduce((sum, r) => sum + parseFloat(r.size), 0).toFixed(1)} GB
            </div>
            <p className="text-sm text-muted-foreground">Storage Used</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">
              {rollbacks.filter(r => r.status === 'completed').length}
            </div>
            <p className="text-sm text-muted-foreground">Successful Rollbacks</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-400">
              {rollbacks.filter(r => r.status === 'failed').length}
            </div>
            <p className="text-sm text-muted-foreground">Failed Rollbacks</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Restore Point Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Create Restore Points</Label>
                <p className="text-sm text-muted-foreground">Before every patch installation</p>
              </div>
              <Switch checked={autoRestoreEnabled} onCheckedChange={setAutoRestoreEnabled} />
            </div>
            <div>
              <Label>Retention Period</Label>
              <Select value={retentionDays} onValueChange={setRetentionDays}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Storage Per Device</Label>
              <Select defaultValue="10">
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 GB</SelectItem>
                  <SelectItem value="10">10 GB</SelectItem>
                  <SelectItem value="20">20 GB</SelectItem>
                  <SelectItem value="50">50 GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Available Restore Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Patch</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restorePoints.map(restore => (
                <TableRow key={restore.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{restore.deviceName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {restore.createdAt}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-mono text-sm">{restore.patchId}</p>
                      <p className="text-xs text-muted-foreground">{restore.patchName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {restore.size}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(restore.status)}>
                      {restore.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog open={showRollbackDialog && selectedRestore?.id === restore.id} onOpenChange={(open) => {
                        setShowRollbackDialog(open);
                        if (open) setSelectedRestore(restore);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" disabled={restore.status !== 'available'}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-400" />
                              Confirm Rollback
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                              <p className="text-sm">
                                This will restore <strong>{restore.deviceName}</strong> to its state before 
                                <strong> {restore.patchName}</strong> was installed.
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                The device may reboot during this process.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Device</p>
                                <p className="font-medium">{restore.deviceName}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Patch to Remove</p>
                                <p className="font-medium">{restore.patchId}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Restore Point</p>
                                <p className="font-medium">{restore.createdAt}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Size</p>
                                <p className="font-medium">{restore.size}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button className="flex-1" variant="outline" onClick={() => setShowRollbackDialog(false)}>
                                Cancel
                              </Button>
                              <Button className="flex-1" onClick={() => initiateRollback(restore)}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Start Rollback
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" className="text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rollback History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Rollback History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-3">
              {rollbacks.map(rollback => (
                <div key={rollback.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-4">
                    {rollback.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : rollback.status === 'failed' ? (
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    ) : (
                      <Play className="h-5 w-5 text-yellow-400 animate-pulse" />
                    )}
                    <div>
                      <p className="font-medium">{rollback.deviceName}</p>
                      <p className="text-sm text-muted-foreground">{rollback.patchId} - {rollback.patchName}</p>
                      {rollback.error && (
                        <p className="text-sm text-red-400">{rollback.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(rollback.status)}>
                      {rollback.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rollback.completedAt || rollback.initiatedAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
