import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Play, 
  Pause, 
  Square,
  DollarSign,
  Timer,
  Calendar,
  FileText,
  Download,
  Plus,
  Users,
  TrendingUp,
  Receipt,
  CreditCard
} from 'lucide-react';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  ticketId: string;
  ticketTitle: string;
  clientName: string;
  technicianName: string;
  startTime: string;
  endTime?: string;
  duration: number; // minutes
  description: string;
  isBillable: boolean;
  rate: number; // per hour
  status: 'running' | 'paused' | 'completed';
}

interface RateCard {
  id: string;
  clientName: string;
  standardRate: number;
  afterHoursRate: number;
  emergencyRate: number;
  minimumBillable: number; // minutes
  roundingIncrement: number; // minutes
}

interface InvoicePreview {
  clientName: string;
  totalHours: number;
  totalAmount: number;
  entries: TimeEntry[];
}

const mockTimeEntries: TimeEntry[] = [
  { id: '1', ticketId: 'TKT-001', ticketTitle: 'Server migration', clientName: 'Acme Corp', technicianName: 'John Smith', startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T11:30:00Z', duration: 150, description: 'Completed server migration and testing', isBillable: true, rate: 150, status: 'completed' },
  { id: '2', ticketId: 'TKT-002', ticketTitle: 'Email configuration', clientName: 'TechStart Inc', technicianName: 'Sarah Johnson', startTime: '2024-01-15T13:00:00Z', endTime: '2024-01-15T14:15:00Z', duration: 75, description: 'Setup new email accounts', isBillable: true, rate: 125, status: 'completed' },
  { id: '3', ticketId: 'TKT-003', ticketTitle: 'Network troubleshooting', clientName: 'Acme Corp', technicianName: 'Mike Wilson', startTime: '2024-01-15T15:00:00Z', duration: 45, description: 'Investigating network issues', isBillable: true, rate: 150, status: 'running' },
  { id: '4', ticketId: 'TKT-004', ticketTitle: 'Internal documentation', clientName: 'Internal', technicianName: 'John Smith', startTime: '2024-01-15T08:00:00Z', endTime: '2024-01-15T08:45:00Z', duration: 45, description: 'Updated internal wiki', isBillable: false, rate: 0, status: 'completed' },
];

const mockRateCards: RateCard[] = [
  { id: '1', clientName: 'Acme Corp', standardRate: 150, afterHoursRate: 225, emergencyRate: 300, minimumBillable: 15, roundingIncrement: 15 },
  { id: '2', clientName: 'TechStart Inc', standardRate: 125, afterHoursRate: 187.5, emergencyRate: 250, minimumBillable: 30, roundingIncrement: 15 },
  { id: '3', clientName: 'Global Logistics', standardRate: 135, afterHoursRate: 202.5, emergencyRate: 270, minimumBillable: 15, roundingIncrement: 6 },
];

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function RunningTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);
  
  useState(() => {
    const interval = setInterval(() => {
      setElapsed(differenceInSeconds(new Date(), new Date(startTime)));
    }, 1000);
    return () => clearInterval(interval);
  });

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <span className="font-mono text-green-500">
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

export function TimeTrackingBilling() {
  const [timeEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [rateCards] = useState<RateCard[]>(mockRateCards);
  const [activeTab, setActiveTab] = useState('entries');
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showRateDialog, setShowRateDialog] = useState(false);

  // Calculate stats
  const totalBillableHours = timeEntries.filter(e => e.isBillable).reduce((sum, e) => sum + e.duration, 0) / 60;
  const totalRevenue = timeEntries.filter(e => e.isBillable).reduce((sum, e) => sum + (e.duration / 60) * e.rate, 0);
  const runningTimers = timeEntries.filter(e => e.status === 'running').length;
  const nonBillableHours = timeEntries.filter(e => !e.isBillable).reduce((sum, e) => sum + e.duration, 0) / 60;

  // Group entries by client for invoicing
  const clientTotals = timeEntries
    .filter(e => e.isBillable && e.status === 'completed')
    .reduce((acc, entry) => {
      if (!acc[entry.clientName]) {
        acc[entry.clientName] = { hours: 0, amount: 0 };
      }
      acc[entry.clientName].hours += entry.duration / 60;
      acc[entry.clientName].amount += (entry.duration / 60) * entry.rate;
      return acc;
    }, {} as Record<string, { hours: number; amount: number }>);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Billable Hours</p>
                <p className="text-3xl font-bold text-green-500">{totalBillableHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">This period</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Revenue</p>
                <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Unbilled</p>
              </div>
              <DollarSign className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-yellow-500/30 bg-yellow-500/5",
          runningTimers > 0 && "animate-pulse"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Active Timers</p>
                <p className="text-3xl font-bold text-yellow-500">{runningTimers}</p>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </div>
              <Timer className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Non-Billable</p>
                <p className="text-3xl font-bold text-muted-foreground">{nonBillableHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Hours</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-500" />
                Time Tracking & Billing
              </CardTitle>
              <CardDescription>Track billable hours and generate invoices</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Manual Entry
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Time Entry</DialogTitle>
                    <DialogDescription>Manually log time for a ticket</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Ticket</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ticket" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tkt-001">TKT-001 - Server migration</SelectItem>
                          <SelectItem value="tkt-002">TKT-002 - Email configuration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input type="number" placeholder="60" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="What did you work on?" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Billable</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowEntryDialog(false)}>Cancel</Button>
                    <Button onClick={() => setShowEntryDialog(false)}>Save Entry</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="entries">Time Entries</TabsTrigger>
              <TabsTrigger value="rates">Rate Cards</TabsTrigger>
              <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Time Entries Tab */}
            <TabsContent value="entries" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.ticketId}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{entry.ticketTitle}</p>
                        </div>
                      </TableCell>
                      <TableCell>{entry.clientName}</TableCell>
                      <TableCell>{entry.technicianName}</TableCell>
                      <TableCell>
                        {entry.status === 'running' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <RunningTimer startTime={entry.startTime} />
                          </div>
                        ) : (
                          formatDuration(entry.duration)
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm text-muted-foreground truncate">{entry.description}</p>
                      </TableCell>
                      <TableCell>
                        {entry.isBillable ? (
                          <span>${entry.rate}/hr</span>
                        ) : (
                          <Badge variant="outline">Non-billable</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.isBillable && entry.status === 'completed' && (
                          <span className="font-medium text-green-500">
                            ${((entry.duration / 60) * entry.rate).toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.status === 'running' ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" title="Pause">
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Stop">
                              <Square className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : entry.status === 'paused' ? (
                          <Button variant="ghost" size="sm" title="Resume">
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">Edit</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Rate Cards Tab */}
            <TabsContent value="rates" className="mt-4">
              <div className="flex justify-end mb-4">
                <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Rate Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Rate Card</DialogTitle>
                      <DialogDescription>Define billing rates for a client</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Client</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acme">Acme Corp</SelectItem>
                            <SelectItem value="techstart">TechStart Inc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Standard Rate</Label>
                          <Input type="number" placeholder="150" />
                        </div>
                        <div className="space-y-2">
                          <Label>After Hours</Label>
                          <Input type="number" placeholder="225" />
                        </div>
                        <div className="space-y-2">
                          <Label>Emergency</Label>
                          <Input type="number" placeholder="300" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Minimum (minutes)</Label>
                          <Input type="number" placeholder="15" />
                        </div>
                        <div className="space-y-2">
                          <Label>Rounding (minutes)</Label>
                          <Input type="number" placeholder="15" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowRateDialog(false)}>Cancel</Button>
                      <Button onClick={() => setShowRateDialog(false)}>Save Rate Card</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Standard Rate</TableHead>
                    <TableHead>After Hours</TableHead>
                    <TableHead>Emergency</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Rounding</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateCards.map(rate => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.clientName}</TableCell>
                      <TableCell>${rate.standardRate}/hr</TableCell>
                      <TableCell>${rate.afterHoursRate}/hr</TableCell>
                      <TableCell>${rate.emergencyRate}/hr</TableCell>
                      <TableCell>{rate.minimumBillable} min</TableCell>
                      <TableCell>{rate.roundingIncrement} min</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Invoicing Tab */}
            <TabsContent value="invoicing" className="mt-4">
              <div className="space-y-4">
                <Card className="border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Unbilled Time by Client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(clientTotals).map(([client, data]) => (
                        <div key={client} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                          <div>
                            <p className="font-medium">{client}</p>
                            <p className="text-sm text-muted-foreground">{data.hours.toFixed(1)} hours</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-green-500">
                              ${data.amount.toFixed(2)}
                            </span>
                            <Button size="sm">
                              <Receipt className="h-4 w-4 mr-2" />
                              Generate Invoice
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No invoices generated yet</p>
                      <p className="text-sm">Generate invoices from unbilled time above</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Hours by Technician</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['John Smith', 'Sarah Johnson', 'Mike Wilson'].map(tech => {
                        const techHours = timeEntries
                          .filter(e => e.technicianName === tech)
                          .reduce((sum, e) => sum + e.duration, 0) / 60;
                        const billableHours = timeEntries
                          .filter(e => e.technicianName === tech && e.isBillable)
                          .reduce((sum, e) => sum + e.duration, 0) / 60;
                        const utilization = (billableHours / techHours) * 100 || 0;
                        
                        return (
                          <div key={tech} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{tech}</span>
                              <span>{techHours.toFixed(1)}h ({utilization.toFixed(0)}% billable)</span>
                            </div>
                            <Progress value={utilization} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Revenue by Client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(clientTotals).map(([client, data]) => (
                        <div key={client} className="flex justify-between items-center">
                          <span className="text-sm">{client}</span>
                          <div className="text-right">
                            <p className="font-medium">${data.amount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{data.hours.toFixed(1)}h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
