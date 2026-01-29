import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, Play, Pause, Square, DollarSign, Timer,
  Calendar, FileText, Download, Plus, Users,
  TrendingUp, Receipt, CreditCard, Loader2
} from 'lucide-react';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TimeEntry {
  id: string;
  ticket_id: string | null;
  ticket_title?: string;
  client_id: string | null;
  client_name?: string;
  technician_name: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  description: string;
  is_billable: boolean;
  hourly_rate: number;
  status: 'running' | 'paused' | 'completed';
}

interface RateCard {
  id: string;
  client_id: string;
  client_name: string;
  service_type: string;
  rate_per_hour: number;
  description: string | null;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function TimeTrackingBilling() {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    description: '',
    ticketId: '',
    clientId: '',
    isBillable: true,
    rate: 125
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        const start = new Date(activeTimer.start_time);
        setElapsedSeconds(differenceInSeconds(new Date(), start));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimer]);

  const fetchData = async () => {
    try {
      // Fetch time entries
      const { data: entries, error: entriesError } = await supabase
        .from('vanguard_time_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (entriesError) throw entriesError;

      // Fetch rate cards
      const { data: rates, error: ratesError } = await supabase
        .from('vanguard_rate_cards')
        .select('*, msp_clients(company_name)')
        .eq('user_id', user?.id);

      if (ratesError) throw ratesError;

      // Map entries with additional info
      const mappedEntries: TimeEntry[] = (entries || []).map((e: any) => ({
        id: e.id,
        ticket_id: e.ticket_id,
        ticket_title: e.description?.split(':')[0] || 'Ticket Work',
        client_id: e.client_id,
        client_name: 'Client',
        technician_name: e.technician_id || 'Technician',
        start_time: e.start_time,
        end_time: e.end_time,
        duration_minutes: e.duration_minutes || 0,
        description: e.description || '',
        is_billable: e.is_billable,
        hourly_rate: e.hourly_rate || 0,
        status: e.end_time ? 'completed' : 'running'
      }));

      setTimeEntries(mappedEntries);

      // Find active timer
      const running = mappedEntries.find(e => !e.end_time);
      if (running) {
        setActiveTimer(running);
      }

      // Map rate cards
      const mappedRates: RateCard[] = (rates || []).map((r: any) => ({
        id: r.id,
        client_id: r.client_id,
        client_name: r.msp_clients?.company_name || 'Unknown Client',
        service_type: r.service_type,
        rate_per_hour: r.rate_per_hour,
        description: r.description
      }));

      setRateCards(mappedRates);

    } catch (error) {
      console.error('Error fetching time data:', error);
      toast.error('Failed to load time entries');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    try {
      const { data, error } = await supabase
        .from('vanguard_time_entries')
        .insert({
          user_id: user?.id,
          ticket_id: newEntry.ticketId || null,
          client_id: newEntry.clientId || null,
          technician_id: user?.id,
          start_time: new Date().toISOString(),
          description: newEntry.description || 'Work session',
          is_billable: newEntry.isBillable,
          hourly_rate: newEntry.rate
        })
        .select()
        .single();

      if (error) throw error;

      const newTimer: TimeEntry = {
        id: data.id,
        ticket_id: data.ticket_id,
        client_id: data.client_id,
        technician_name: data.technician_id || 'Technician',
        start_time: data.start_time,
        end_time: null,
        duration_minutes: 0,
        description: data.description,
        is_billable: data.is_billable,
        hourly_rate: data.hourly_rate,
        status: 'running'
      };

      setActiveTimer(newTimer);
      setTimeEntries(prev => [newTimer, ...prev]);
      setShowNewEntry(false);
      setNewEntry({ description: '', ticketId: '', clientId: '', isBillable: true, rate: 125 });
      toast.success('Timer started');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      const endTime = new Date();
      const durationMins = differenceInMinutes(endTime, new Date(activeTimer.start_time));

      const { error } = await supabase
        .from('vanguard_time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: Math.max(1, durationMins)
        })
        .eq('id', activeTimer.id);

      if (error) throw error;

      setTimeEntries(prev => prev.map(e => 
        e.id === activeTimer.id 
          ? { ...e, end_time: endTime.toISOString(), duration_minutes: durationMins, status: 'completed' as const }
          : e
      ));
      setActiveTimer(null);
      toast.success(`Timer stopped: ${formatDuration(durationMins)}`);
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Failed to stop timer');
    }
  };

  const formatElapsed = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate stats
  const todayEntries = timeEntries.filter(e => {
    const entryDate = new Date(e.start_time).toDateString();
    return entryDate === new Date().toDateString();
  });
  const todayMinutes = todayEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const billableMinutes = timeEntries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const totalRevenue = timeEntries
    .filter(e => e.is_billable)
    .reduce((sum, e) => sum + ((e.duration_minutes / 60) * e.hourly_rate), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <Clock className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Time Tracking & Billing</h2>
            <p className="text-sm text-slate-400">Track billable hours and generate invoices</p>
          </div>
        </div>
        <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              New Time Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-cyan-500/30">
            <DialogHeader>
              <DialogTitle className="text-white">Start Time Entry</DialogTitle>
              <DialogDescription className="text-slate-400">
                Begin tracking time for a task or ticket
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-slate-300">Description</Label>
                <Textarea 
                  placeholder="What are you working on?"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  className="mt-1 bg-black/40 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Hourly Rate</Label>
                  <Input 
                    type="number"
                    value={newEntry.rate}
                    onChange={(e) => setNewEntry({ ...newEntry, rate: Number(e.target.value) })}
                    className="mt-1 bg-black/40 border-slate-700 text-white"
                  />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label className="text-slate-300">Billable</Label>
                  <Switch 
                    checked={newEntry.isBillable}
                    onCheckedChange={(checked) => setNewEntry({ ...newEntry, isBillable: checked })}
                  />
                </div>
              </div>
              <Button onClick={startTimer} className="w-full bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Timer */}
      {activeTimer && (
        <Card className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium mb-1">Timer Running</p>
                <p className="text-white text-lg">{activeTimer.description || 'Work session'}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-mono text-green-400">{formatElapsed(elapsedSeconds)}</p>
                <Button 
                  onClick={stopTimer}
                  className="mt-2 bg-red-600 hover:bg-red-700"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Today</p>
                <p className="text-2xl font-bold text-white">{formatDuration(todayMinutes)}</p>
              </div>
              <Timer className="h-8 w-8 text-cyan-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Billable Hours</p>
                <p className="text-2xl font-bold text-green-400">{(billableMinutes / 60).toFixed(1)}h</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-400">{formatMoney(totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Entries This Month</p>
                <p className="text-2xl font-bold text-white">{timeEntries.length}</p>
              </div>
              <FileText className="h-8 w-8 text-slate-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card className="bg-black/60 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white text-lg">Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No time entries yet. Start tracking to see your work.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Description</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Duration</TableHead>
                  <TableHead className="text-slate-400">Rate</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.slice(0, 20).map(entry => (
                  <TableRow key={entry.id} className="border-slate-700/50">
                    <TableCell>
                      <div>
                        <p className="text-white text-sm">{entry.description || 'Work session'}</p>
                        <p className="text-slate-500 text-xs">{entry.technician_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {format(new Date(entry.start_time), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell className="text-cyan-400 font-medium">
                      {entry.status === 'running' ? (
                        <Badge className="bg-green-500/20 text-green-400">Running</Badge>
                      ) : (
                        formatDuration(entry.duration_minutes)
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {entry.is_billable ? formatMoney(entry.hourly_rate) + '/hr' : (
                        <span className="text-slate-500">Non-billable</span>
                      )}
                    </TableCell>
                    <TableCell className="text-green-400 font-medium">
                      {entry.is_billable 
                        ? formatMoney((entry.duration_minutes / 60) * entry.hourly_rate)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        entry.status === 'running' && 'bg-green-500/20 text-green-400 border-green-500/30',
                        entry.status === 'completed' && 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      )}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
