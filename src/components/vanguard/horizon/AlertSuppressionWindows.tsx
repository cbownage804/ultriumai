import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BellOff, Plus, Trash2, Edit, Clock, Calendar as CalendarIcon,
  Server, AlertTriangle, Pause, Play, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AlertSuppressionWindows() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [windows, setWindows] = useState<SuppressionWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWindow, setShowAddWindow] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('scheduled');
  const [newScope, setNewScope] = useState('all');

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('alert_suppression_windows')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setWindows(data.map((w: any) => ({
        id: w.id,
        name: w.name,
        description: w.description || '',
        type: w.window_type as SuppressionWindow['type'],
        startTime: new Date(w.start_time),
        endTime: new Date(w.end_time),
        recurringDays: w.recurring_days || undefined,
        scope: w.scope as SuppressionWindow['scope'],
        scopeItems: w.scope_items || undefined,
        isActive: w.is_active ?? true,
        createdBy: w.created_by || 'Admin',
      })));
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user?.id || !newName || !startDate || !endDate) return;
    const { error } = await supabase.from('alert_suppression_windows').insert({
      user_id: user.id, name: newName, description: newDescription,
      window_type: newType, start_time: startDate.toISOString(), end_time: endDate.toISOString(),
      recurring_days: selectedDays.length > 0 ? selectedDays : null,
      scope: newScope, is_active: true, created_by: 'Admin',
    } as any);
    if (error) { toast({ title: 'Failed to create window', variant: 'destructive' }); return; }
    setShowAddWindow(false);
    setNewName(''); setNewDescription(''); setSelectedDays([]);
    fetchData();
    toast({ title: 'Suppression window created' });
  };

  const toggleWindow = async (id: string) => {
    const w = windows.find(w => w.id === id);
    if (!w) return;
    await supabase.from('alert_suppression_windows').update({ is_active: !w.isActive } as any).eq('id', id);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
    toast({ title: 'Suppression window updated' });
  };

  const deleteWindow = async (id: string) => {
    await supabase.from('alert_suppression_windows').delete().eq('id', id);
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
    if (window.scopeItems) return `${window.scopeItems.length} ${window.scope === 'devices' ? 'Device(s)' : 'Rule(s)'}`;
    return window.scope;
  };

  const activeNow = windows.filter(w => w.isActive).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
            <DialogHeader><DialogTitle>Create Suppression Window</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Window Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Weekly Maintenance" /></div>
              <div><Label>Description</Label><Input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Reason for suppression..." /></div>
              <div>
                <Label>Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
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
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label>Recurring Days (if applicable)</Label>
                <div className="flex gap-2 mt-2">
                  {dayNames.map((day, idx) => (
                    <Button key={day} variant={selectedDays.includes(idx) ? 'default' : 'outline'} size="sm"
                      onClick={() => setSelectedDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}>
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Scope</Label>
                <Select value={newScope} onValueChange={setNewScope}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Alerts</SelectItem>
                    <SelectItem value="devices">Specific Devices</SelectItem>
                    <SelectItem value="rules">Specific Rules</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreate}>Create Window</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50"><CardContent className="pt-4"><div className="text-2xl font-bold">{windows.length}</div><p className="text-sm text-muted-foreground">Total Windows</p></CardContent></Card>
        <Card className={`${activeNow > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-card/50'}`}><CardContent className="pt-4"><div className={`text-2xl font-bold ${activeNow > 0 ? 'text-orange-400' : ''}`}>{activeNow}</div><p className="text-sm text-muted-foreground">Active Now</p></CardContent></Card>
        <Card className="bg-card/50"><CardContent className="pt-4"><div className="text-2xl font-bold">{windows.filter(w => w.type === 'recurring').length}</div><p className="text-sm text-muted-foreground">Recurring</p></CardContent></Card>
        <Card className="bg-card/50"><CardContent className="pt-4"><div className="text-2xl font-bold text-yellow-400">—</div><p className="text-sm text-muted-foreground">Alerts Suppressed (24h)</p></CardContent></Card>
      </div>

      {activeNow > 0 && (
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <BellOff className="h-6 w-6 text-orange-400" />
              <div className="flex-1">
                <p className="font-medium text-orange-400">{activeNow} suppression window(s) currently active</p>
                <p className="text-sm text-muted-foreground">Some alerts may be silenced based on configured rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <div><p className="font-medium">{window.name}</p><p className="text-sm text-muted-foreground">{window.description}</p></div>
                </TableCell>
                <TableCell><Badge className={getTypeColor(window.type)}>{window.type}</Badge></TableCell>
                <TableCell>
                  {window.type === 'recurring' && window.recurringDays ? (
                    <div className="flex gap-1">{window.recurringDays.map(d => <Badge key={d} variant="outline" className="text-xs">{dayNames[d]}</Badge>)}</div>
                  ) : (
                    <span className="text-sm">{format(window.startTime, 'MMM d')} - {format(window.endTime, 'MMM d')}</span>
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
                    {window.isActive ? (<><Pause className="h-4 w-4 text-orange-400" /><span className="text-orange-400">Suppressing</span></>) : (<><Play className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Inactive</span></>)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Switch checked={window.isActive} onCheckedChange={() => toggleWindow(window.id)} />
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => deleteWindow(window.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {windows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No suppression windows configured</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
