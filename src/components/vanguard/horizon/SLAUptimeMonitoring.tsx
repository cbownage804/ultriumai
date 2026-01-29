import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Bell,
  Calendar,
  Timer,
  Target,
  Zap,
  Server,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { format, differenceInMinutes, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SLAPolicy {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  uptimeTarget: number; // percentage, e.g., 99.9
  responseTimeTarget: number; // minutes
  resolutionTimeTarget: number; // hours
  maintenanceWindow?: { day: string; start: string; end: string };
  breachNotifications: string[];
  isActive: boolean;
}

interface UptimeRecord {
  id: string;
  clientId: string;
  clientName: string;
  currentUptime: number;
  last30Days: number;
  lastDowntime?: Date;
  downtimeMinutes30d: number;
  incidents30d: number;
  slaTarget: number;
  trend: 'up' | 'down' | 'stable';
}

interface SLABreach {
  id: string;
  clientId: string;
  clientName: string;
  breachType: 'uptime' | 'response' | 'resolution';
  occurredAt: Date;
  duration: number; // minutes for uptime, actual time for response/resolution
  target: number;
  actual: number;
  status: 'active' | 'resolved' | 'acknowledged';
  ticketId?: string;
  notes?: string;
}

const mockSLAPolicies: SLAPolicy[] = [
  {
    id: '1',
    name: 'Enterprise Platinum',
    clientId: 'c1',
    clientName: 'Acme Corp',
    uptimeTarget: 99.99,
    responseTimeTarget: 15,
    resolutionTimeTarget: 4,
    maintenanceWindow: { day: 'Sunday', start: '02:00', end: '06:00' },
    breachNotifications: ['ops@msp.com', 'manager@msp.com'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Business Gold',
    clientId: 'c2',
    clientName: 'TechStart Inc',
    uptimeTarget: 99.9,
    responseTimeTarget: 30,
    resolutionTimeTarget: 8,
    breachNotifications: ['ops@msp.com'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Standard',
    clientId: 'c3',
    clientName: 'GlobalTech',
    uptimeTarget: 99.5,
    responseTimeTarget: 60,
    resolutionTimeTarget: 24,
    breachNotifications: ['ops@msp.com'],
    isActive: true,
  },
];

const mockUptimeRecords: UptimeRecord[] = [
  {
    id: '1',
    clientId: 'c1',
    clientName: 'Acme Corp',
    currentUptime: 99.98,
    last30Days: 99.95,
    lastDowntime: subDays(new Date(), 12),
    downtimeMinutes30d: 22,
    incidents30d: 2,
    slaTarget: 99.99,
    trend: 'up',
  },
  {
    id: '2',
    clientId: 'c2',
    clientName: 'TechStart Inc',
    currentUptime: 100,
    last30Days: 99.92,
    lastDowntime: subDays(new Date(), 8),
    downtimeMinutes30d: 35,
    incidents30d: 3,
    slaTarget: 99.9,
    trend: 'up',
  },
  {
    id: '3',
    clientId: 'c3',
    clientName: 'GlobalTech',
    currentUptime: 99.85,
    last30Days: 99.42,
    lastDowntime: subDays(new Date(), 2),
    downtimeMinutes30d: 250,
    incidents30d: 5,
    slaTarget: 99.5,
    trend: 'down',
  },
];

const mockBreaches: SLABreach[] = [
  {
    id: 'b1',
    clientId: 'c3',
    clientName: 'GlobalTech',
    breachType: 'uptime',
    occurredAt: subDays(new Date(), 2),
    duration: 45,
    target: 99.5,
    actual: 99.42,
    status: 'acknowledged',
    ticketId: 'TKT-456',
    notes: 'Network switch failure in client datacenter',
  },
  {
    id: 'b2',
    clientId: 'c1',
    clientName: 'Acme Corp',
    breachType: 'response',
    occurredAt: subDays(new Date(), 5),
    duration: 22,
    target: 15,
    actual: 22,
    status: 'resolved',
    ticketId: 'TKT-432',
  },
  {
    id: 'b3',
    clientId: 'c2',
    clientName: 'TechStart Inc',
    breachType: 'resolution',
    occurredAt: subDays(new Date(), 10),
    duration: 12,
    target: 8,
    actual: 12,
    status: 'resolved',
    ticketId: 'TKT-398',
  },
];

// Generate mock uptime chart data
const generateUptimeChartData = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'MMM d'),
      acme: 99.9 + Math.random() * 0.1,
      techstart: 99.85 + Math.random() * 0.15,
      globaltech: 99.3 + Math.random() * 0.5,
    });
  }
  return data;
};

export function SLAUptimeMonitoring() {
  const { toast } = useToast();
  const [policies] = useState<SLAPolicy[]>(mockSLAPolicies);
  const [uptimeRecords] = useState<UptimeRecord[]>(mockUptimeRecords);
  const [breaches] = useState<SLABreach[]>(mockBreaches);
  const [showAddPolicyDialog, setShowAddPolicyDialog] = useState(false);
  const [chartData] = useState(generateUptimeChartData());

  const activeBreaches = breaches.filter(b => b.status === 'active' || b.status === 'acknowledged');
  const avgUptime = uptimeRecords.reduce((acc, r) => acc + r.last30Days, 0) / uptimeRecords.length;
  const totalDowntimeMinutes = uptimeRecords.reduce((acc, r) => acc + r.downtimeMinutes30d, 0);
  const totalIncidents = uptimeRecords.reduce((acc, r) => acc + r.incidents30d, 0);

  const getUptimeColor = (uptime: number, target: number) => {
    if (uptime >= target) return 'text-green-500';
    if (uptime >= target - 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBreachBadge = (type: string) => {
    switch (type) {
      case 'uptime': return 'bg-red-500/20 text-red-500';
      case 'response': return 'bg-orange-500/20 text-orange-500';
      case 'resolution': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgUptime.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground">Avg Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{policies.length}</p>
                <p className="text-xs text-muted-foreground">SLA Policies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeBreaches.length}</p>
                <p className="text-xs text-muted-foreground">Active Breaches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDowntimeMinutes}m</p>
                <p className="text-xs text-muted-foreground">Downtime (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalIncidents}</p>
                <p className="text-xs text-muted-foreground">Incidents (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <CheckCircle className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {uptimeRecords.filter(r => r.last30Days >= r.slaTarget).length}/{uptimeRecords.length}
                </p>
                <p className="text-xs text-muted-foreground">Meeting SLA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uptime Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-500" />
            30-Day Uptime Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAcme" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTech" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[99, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(3)}%`, '']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="acme" name="Acme Corp" stroke="#10b981" fillOpacity={1} fill="url(#colorAcme)" />
                <Area type="monotone" dataKey="techstart" name="TechStart" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTech)" />
                <Area type="monotone" dataKey="globaltech" name="GlobalTech" stroke="#f59e0b" fillOpacity={1} fill="url(#colorGlobal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Acme Corp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">TechStart Inc</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm">GlobalTech</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="uptime">
        <TabsList>
          <TabsTrigger value="uptime">Uptime Status</TabsTrigger>
          <TabsTrigger value="breaches">
            SLA Breaches
            {activeBreaches.length > 0 && (
              <Badge variant="destructive" className="ml-2">{activeBreaches.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="policies">SLA Policies</TabsTrigger>
        </TabsList>

        {/* Uptime Status Tab */}
        <TabsContent value="uptime" className="space-y-4">
          <div className="grid gap-4">
            {uptimeRecords.map(record => (
              <Card key={record.id} className={cn(
                record.last30Days < record.slaTarget && 'border-red-500/30'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center',
                        record.last30Days >= record.slaTarget ? 'bg-green-500/20' : 'bg-red-500/20'
                      )}>
                        {record.last30Days >= record.slaTarget ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{record.clientName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Target: {record.slaTarget}% • {record.incidents30d} incidents in 30d
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className={cn('text-2xl font-bold', getUptimeColor(record.currentUptime, record.slaTarget))}>
                          {record.currentUptime.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">30-Day Avg</p>
                        <div className="flex items-center gap-1">
                          <p className={cn('text-2xl font-bold', getUptimeColor(record.last30Days, record.slaTarget))}>
                            {record.last30Days.toFixed(2)}%
                          </p>
                          {record.trend === 'up' && <ArrowUpRight className="h-5 w-5 text-green-500" />}
                          {record.trend === 'down' && <ArrowDownRight className="h-5 w-5 text-red-500" />}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Downtime</p>
                        <p className="text-2xl font-bold">{record.downtimeMinutes30d}m</p>
                      </div>
                      <div className="text-center min-w-[120px]">
                        <p className="text-sm text-muted-foreground">Last Outage</p>
                        <p className="text-sm font-medium">
                          {record.lastDowntime 
                            ? format(record.lastDowntime, 'MMM d, h:mm a')
                            : 'None'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* SLA Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>SLA Compliance</span>
                      <span className={getUptimeColor(record.last30Days, record.slaTarget)}>
                        {((record.last30Days / record.slaTarget) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((record.last30Days / record.slaTarget) * 100, 100)} 
                      className={cn(
                        'h-2',
                        record.last30Days >= record.slaTarget ? 'bg-green-500/20' : 'bg-red-500/20'
                      )} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SLA Breaches Tab */}
        <TabsContent value="breaches" className="space-y-4">
          {activeBreaches.length > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <Bell className="h-5 w-5" />
                  Active SLA Breaches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeBreaches.map(breach => (
                    <div key={breach.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{breach.clientName}</span>
                            <Badge className={getBreachBadge(breach.breachType)}>
                              {breach.breachType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Target: {breach.target}{breach.breachType === 'uptime' ? '%' : 'h'} • 
                            Actual: {breach.actual}{breach.breachType === 'uptime' ? '%' : 'h'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={breach.status === 'active' ? 'destructive' : 'outline'}>
                          {breach.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Breach History</CardTitle>
              <CardDescription>All SLA breaches in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Occurred</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ticket</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breaches.map(breach => (
                    <TableRow key={breach.id}>
                      <TableCell className="font-medium">{breach.clientName}</TableCell>
                      <TableCell>
                        <Badge className={getBreachBadge(breach.breachType)}>
                          {breach.breachType}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(breach.occurredAt, 'MMM d, h:mm a')}</TableCell>
                      <TableCell>
                        {breach.target}{breach.breachType === 'uptime' ? '%' : breach.breachType === 'response' ? 'm' : 'h'}
                      </TableCell>
                      <TableCell className="text-red-500">
                        {breach.actual}{breach.breachType === 'uptime' ? '%' : breach.breachType === 'response' ? 'm' : 'h'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          breach.status === 'resolved' ? 'default' :
                          breach.status === 'acknowledged' ? 'secondary' : 'destructive'
                        }>
                          {breach.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {breach.ticketId && (
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            {breach.ticketId}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddPolicyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add SLA Policy
            </Button>
          </div>

          <div className="grid gap-4">
            {policies.map(policy => (
              <Card key={policy.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{policy.name}</h4>
                        <Badge variant="outline">{policy.clientName}</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span>Uptime: {policy.uptimeTarget}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          <span>Response: {policy.responseTimeTarget}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Resolution: {policy.resolutionTimeTarget}h</span>
                        </div>
                        {policy.maintenanceWindow && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {policy.maintenanceWindow.day} {policy.maintenanceWindow.start}-{policy.maintenanceWindow.end}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Policy Dialog */}
      <Dialog open={showAddPolicyDialog} onOpenChange={setShowAddPolicyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create SLA Policy</DialogTitle>
            <DialogDescription>
              Define uptime and response time commitments for a client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Policy Name</Label>
              <Input placeholder="e.g., Enterprise Platinum" />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c1">Acme Corp</SelectItem>
                  <SelectItem value="c2">TechStart Inc</SelectItem>
                  <SelectItem value="c3">GlobalTech</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Uptime Target (%)</Label>
                <Input type="number" step="0.01" placeholder="99.9" />
              </div>
              <div className="space-y-2">
                <Label>Response (min)</Label>
                <Input type="number" placeholder="15" />
              </div>
              <div className="space-y-2">
                <Label>Resolution (hrs)</Label>
                <Input type="number" placeholder="4" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Breach Notification Emails</Label>
              <Input placeholder="ops@example.com, manager@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPolicyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowAddPolicyDialog(false);
              toast({
                title: 'SLA Policy Created',
                description: 'Policy is now active and monitoring has begun',
              });
            }}>
              Create Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
