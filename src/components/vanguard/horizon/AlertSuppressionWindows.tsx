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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BellOff, Plus, Trash2, Edit, Clock, Calendar as CalendarIcon,
  Server, AlertTriangle, CheckCircle, Pause, Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SuppressionWindow {
  id: string;
  name: string;
  description: string;
  type: 'scheduled' | 'recurring' | 'adhoc';
  startTime: Date;
  endTime: Date;
  recurringDays?: number[];
  scope: 'all' | 'devices' | 'rules';
  scopeItems?: string[];
  isActive: boolean;
  createdBy: string;
}

const mockWindows: SuppressionWindow[] = [
  {
    id: '1',
    name: 'Weekly Maintenance',
    description: 'Suppress alerts during Sunday maintenance window',
    type: 'recurring',
    startTime: new Date(),
    endTime: new Date(),
    recurringDays: [0], // Sunday
    scope: 'all',
    isActive: true,
    createdBy: 'Admin'
  },
  {
    id: '2',
    name: 'Server Migration',
    description: 'Temporary suppression for datacenter migration',
    type: 'scheduled',
    startTime: new Date(Date.now() + 86400000),
    endTime: new Date(Date.now() + 172800000),
    scope: 'devices',
    scopeItems: ['SRV-DC01', 'SRV-DC02', 'SRV-SQL01'],
    isActive: true,
    createdBy: 'Mike Wilson'
  },
  {
    id: '3',
    name: 'Backup Job Window',
    description: 'Suppress disk I/O alerts during nightly backups',
    type: 'recurring',
    startTime: new Date(),
    endTime: new Date(),
    recurringDays: [1, 2, 3, 4, 5], // Weekdays
    scope: 'rules',
    scopeItems: ['Disk I/O Alert', 'High CPU Alert'],
    isActive: true,
    createdBy: 'Admin'
  },
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AlertSuppressionWindows() {
  const { toast } = useToast();
  const [windows, setWindows] = useState(mockWindows);
  const [showAddWindow, setShowAddWindow] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const toggleWindow = (id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ));
    toast({ title: 'Suppression window updated' });
  };

  const deleteWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    toast({ title: 'Suppression window deleted' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'recurring': return 'bg-purple-500/20 text-purple-400';
      case 'adhoc': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScopeLabel = (window: SuppressionWindow) => {
    if (window.scope === 'all') return 'All Alerts';
    if (window.scopeItems) {
      return `${window.scopeItems.length} ${window.scope === 'devices' ? 'Device(s)' : 'Rule(s)'}`;
    }
    return window.scope;
  };

  const activeNow = windows.filter(w => w.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Suppression Windows</h2>
          <p className="text-muted-foreground">Silence alerts during maintenance windows</p>
        </div>
        <Dialog open={showAddWindow} onOpenChange={setShowAddWindow}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Window</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Suppression Window</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Window Name</Label>
                <Input placeholder="e.g., Weekly Maintenance" />
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="Reason for suppression..." />
              </div>
              <div>
                <Label>Type</Label>
                <Select defaultValue="scheduled">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled (One-time)</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="adhoc">Ad-hoc (Immediate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {startDate ? format(startDate, 'PPP') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {endDate ? format(endDate, 'PPP') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label>Recurring Days (if applicable)</Label>
                <div className="flex gap-2 mt-2">
                  {dayNames.map((day, idx) => (
                    <Button
                      key={day}
                      variant={selectedDays.includes(idx) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDays(prev => 
                        prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                      )}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Scope</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Alerts</SelectItem>
                    <SelectItem value="devices">Specific Devices</SelectItem>
                    <SelectItem value="rules">Specific Rules</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => setShowAddWindow(false)}>
                Create Window
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{windows.length}</div>
            <p className="text-sm text-muted-foreground">Total Windows</p>
          </CardContent>
        </Card>
        <Card className={`${activeNow > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-card/50'}`}>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${activeNow > 0 ? 'text-orange-400' : ''}`}>{activeNow}</div>
            <p className="text-sm text-muted-foreground">Active Now</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{windows.filter(w => w.type === 'recurring').length}</div>
            <p className="text-sm text-muted-foreground">Recurring</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-400">156</div>
            <p className="text-sm text-muted-foreground">Alerts Suppressed (24h)</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Suppression Banner */}
      {activeNow > 0 && (
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <BellOff className="h-6 w-6 text-orange-400" />
              <div className="flex-1">
                <p className="font-medium text-orange-400">
                  {activeNow} suppression window(s) currently active
                </p>
                <p className="text-sm text-muted-foreground">
                  Some alerts may be silenced based on configured rules
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-orange-400 border-orange-400/30">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Windows Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Window</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {windows.map(window => (
              <TableRow key={window.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{window.name}</p>
                    <p className="text-sm text-muted-foreground">{window.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(window.type)}>
                    {window.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {window.type === 'recurring' && window.recurringDays ? (
                    <div className="flex gap-1">
                      {window.recurringDays.map(d => (
                        <Badge key={d} variant="outline" className="text-xs">
                          {dayNames[d]}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm">
                      {format(window.startTime, 'MMM d')} - {format(window.endTime, 'MMM d')}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {window.scope === 'devices' && <Server className="h-4 w-4" />}
                    {window.scope === 'rules' && <AlertTriangle className="h-4 w-4" />}
                    <span>{getScopeLabel(window)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {window.isActive ? (
                      <>
                        <Pause className="h-4 w-4 text-orange-400" />
                        <span className="text-orange-400">Suppressing</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Inactive</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Switch 
                      checked={window.isActive}
                      onCheckedChange={() => toggleWindow(window.id)}
                    />
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => deleteWindow(window.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
