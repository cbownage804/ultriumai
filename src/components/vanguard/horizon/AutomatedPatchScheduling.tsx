import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, Clock, Plus, Settings, Play, Pause, 
  CheckCircle, AlertTriangle, Server, Download, Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PatchSchedule {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  patchTypes: string[];
  deviceGroups: string[];
  approvalRequired: boolean;
  rebootPolicy: 'immediate' | 'scheduled' | 'user_choice' | 'never';
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
}

interface PendingPatch {
  id: string;
  title: string;
  kb: string;
  severity: 'critical' | 'important' | 'moderate' | 'low';
  releaseDate: string;
  affectedDevices: number;
  status: 'pending' | 'approved' | 'rejected' | 'installed';
}

const mockSchedules: PatchSchedule[] = [
  {
    id: '1',
    name: 'Critical Security Patches',
    description: 'Auto-deploy critical security updates within 24 hours',
    frequency: 'daily',
    time: '02:00',
    patchTypes: ['Security', 'Critical'],
    deviceGroups: ['All Servers', 'Workstations'],
    approvalRequired: false,
    rebootPolicy: 'scheduled',
    isActive: true,
    lastRun: '2024-01-15 02:00',
    nextRun: '2024-01-16 02:00'
  },
  {
    id: '2',
    name: 'Weekly Windows Updates',
    description: 'Standard Windows updates every Sunday',
    frequency: 'weekly',
    dayOfWeek: 0,
    time: '03:00',
    patchTypes: ['Windows', 'Cumulative'],
    deviceGroups: ['Workstations'],
    approvalRequired: true,
    rebootPolicy: 'user_choice',
    isActive: true,
    lastRun: '2024-01-14 03:00',
    nextRun: '2024-01-21 03:00'
  },
  {
    id: '3',
    name: 'Monthly Feature Updates',
    description: 'Feature updates on first Saturday of month',
    frequency: 'monthly',
    dayOfMonth: 1,
    time: '04:00',
    patchTypes: ['Feature'],
    deviceGroups: ['Pilot Group'],
    approvalRequired: true,
    rebootPolicy: 'scheduled',
    isActive: true,
    lastRun: '2024-01-06 04:00',
    nextRun: '2024-02-03 04:00'
  },
];

const mockPendingPatches: PendingPatch[] = [
  { id: '1', title: 'Windows Security Update', kb: 'KB5034441', severity: 'critical', releaseDate: '2024-01-14', affectedDevices: 45, status: 'pending' },
  { id: '2', title: '.NET Framework Update', kb: 'KB5033909', severity: 'important', releaseDate: '2024-01-12', affectedDevices: 38, status: 'pending' },
  { id: '3', title: 'Cumulative Update', kb: 'KB5034123', severity: 'moderate', releaseDate: '2024-01-10', affectedDevices: 52, status: 'approved' },
  { id: '4', title: 'Driver Update - Intel', kb: 'KB5033877', severity: 'low', releaseDate: '2024-01-08', affectedDevices: 23, status: 'pending' },
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AutomatedPatchScheduling() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState(mockSchedules);
  const [pendingPatches, setPendingPatches] = useState(mockPendingPatches);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [selectedPatches, setSelectedPatches] = useState<string[]>([]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'important': return 'bg-orange-500/20 text-orange-400';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'installed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
    toast({ title: 'Schedule updated' });
  };

  const approvePatch = (id: string) => {
    setPendingPatches(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'approved' as const } : p
    ));
    toast({ title: 'Patch approved for deployment' });
  };

  const approveSelected = () => {
    setPendingPatches(prev => prev.map(p => 
      selectedPatches.includes(p.id) ? { ...p, status: 'approved' as const } : p
    ));
    setSelectedPatches([]);
    toast({ title: `${selectedPatches.length} patches approved` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automated Patch Scheduling</h2>
          <p className="text-muted-foreground">Schedule Windows and third-party patches with approval workflows</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{schedules.filter(s => s.isActive).length}</div>
            <p className="text-sm text-muted-foreground">Active Schedules</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-400">
              {pendingPatches.filter(p => p.severity === 'critical' && p.status === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Critical Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-400">
              {pendingPatches.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Awaiting Approval</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">127</div>
            <p className="text-sm text-muted-foreground">Installed (7d)</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">98.3%</div>
            <p className="text-sm text-muted-foreground">Compliance Rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedules">
        <TabsList>
          <TabsTrigger value="schedules">Patch Schedules</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="history">Deployment History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Create Schedule</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Create Patch Schedule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Schedule Name</Label>
                    <Input placeholder="e.g., Weekly Security Patches" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Frequency</Label>
                      <Select defaultValue="weekly">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input type="time" defaultValue="02:00" />
                    </div>
                  </div>
                  <div>
                    <Label>Patch Types</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Security', 'Critical', 'Cumulative', 'Feature', 'Driver'].map(type => (
                        <Badge key={type} variant="outline" className="cursor-pointer hover:bg-primary/20">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Device Groups</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select groups" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Devices</SelectItem>
                        <SelectItem value="servers">Servers</SelectItem>
                        <SelectItem value="workstations">Workstations</SelectItem>
                        <SelectItem value="pilot">Pilot Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Reboot Policy</Label>
                    <Select defaultValue="scheduled">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate Reboot</SelectItem>
                        <SelectItem value="scheduled">Scheduled Reboot</SelectItem>
                        <SelectItem value="user_choice">User Choice</SelectItem>
                        <SelectItem value="never">Never (Manual)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="approval" />
                    <Label htmlFor="approval">Require manual approval before deployment</Label>
                  </div>
                  <Button className="w-full" onClick={() => setShowAddSchedule(false)}>
                    Create Schedule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {schedules.map(schedule => (
              <Card key={schedule.id} className="bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${schedule.isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                        <Calendar className={`h-6 w-6 ${schedule.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{schedule.name}</h3>
                          {schedule.approvalRequired && (
                            <Badge variant="outline" className="text-xs">Approval Required</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3">{schedule.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {schedule.patchTypes.map(type => (
                            <Badge key={type} variant="secondary">{type}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch 
                        checked={schedule.isActive}
                        onCheckedChange={() => toggleSchedule(schedule.id)}
                      />
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="capitalize">{schedule.frequency}</span>
                      {schedule.dayOfWeek !== undefined && <span>• {dayNames[schedule.dayOfWeek]}</span>}
                      <span>at {schedule.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Server className="h-4 w-4" />
                      {schedule.deviceGroups.join(', ')}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Next:</span>
                      <span className="text-primary">{schedule.nextRun}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {selectedPatches.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
              <span>{selectedPatches.length} patches selected</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={approveSelected}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedPatches([])}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedPatches.length === pendingPatches.filter(p => p.status === 'pending').length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPatches(pendingPatches.filter(p => p.status === 'pending').map(p => p.id));
                        } else {
                          setSelectedPatches([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Update</TableHead>
                  <TableHead>KB</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Affected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPatches.map(patch => (
                  <TableRow key={patch.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedPatches.includes(patch.id)}
                        disabled={patch.status !== 'pending'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPatches(prev => [...prev, patch.id]);
                          } else {
                            setSelectedPatches(prev => prev.filter(id => id !== patch.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{patch.title}</TableCell>
                    <TableCell className="font-mono">{patch.kb}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(patch.severity)}>
                        {patch.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{patch.releaseDate}</TableCell>
                    <TableCell>{patch.affectedDevices} devices</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(patch.status)}>
                        {patch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {patch.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => approvePatch(patch.id)}>
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Deployments</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {[
                    { time: '2 hours ago', patch: 'KB5034441', devices: 45, success: 43, failed: 2 },
                    { time: '1 day ago', patch: 'KB5033909', devices: 38, success: 38, failed: 0 },
                    { time: '3 days ago', patch: 'KB5034123', devices: 52, success: 50, failed: 2 },
                    { time: '1 week ago', patch: 'KB5033877', devices: 23, success: 23, failed: 0 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <Download className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{item.patch}</p>
                          <p className="text-sm text-muted-foreground">{item.devices} devices targeted</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-green-400">{item.success} success</p>
                          {item.failed > 0 && <p className="text-red-400">{item.failed} failed</p>}
                        </div>
                        <span className="text-sm text-muted-foreground">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
