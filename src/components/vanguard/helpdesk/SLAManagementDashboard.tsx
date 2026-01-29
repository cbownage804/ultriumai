import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Timer,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  Calendar,
  Users,
  Bell,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface SLAPolicy {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  responseTime: number; // minutes
  resolutionTime: number; // minutes
  businessHoursOnly: boolean;
  escalationEnabled: boolean;
  isActive: boolean;
}

interface SLAMetric {
  ticketId: string;
  ticketTitle: string;
  clientName: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'met' | 'at_risk' | 'breached';
  responseStatus: 'met' | 'at_risk' | 'breached';
  resolutionStatus: 'met' | 'at_risk' | 'breached' | 'pending';
  responseTimeActual: number;
  responseTimeTarget: number;
  resolutionTimeActual?: number;
  resolutionTimeTarget: number;
  createdAt: string;
}

const mockPolicies: SLAPolicy[] = [
  { id: '1', name: 'Enterprise SLA', clientName: 'Acme Corp', priority: 'critical', responseTime: 15, resolutionTime: 240, businessHoursOnly: false, escalationEnabled: true, isActive: true },
  { id: '2', name: 'Enterprise SLA', clientName: 'Acme Corp', priority: 'high', responseTime: 30, resolutionTime: 480, businessHoursOnly: false, escalationEnabled: true, isActive: true },
  { id: '3', name: 'Standard SLA', clientName: 'TechStart Inc', priority: 'critical', responseTime: 30, resolutionTime: 480, businessHoursOnly: true, escalationEnabled: true, isActive: true },
  { id: '4', name: 'Standard SLA', clientName: 'TechStart Inc', priority: 'high', responseTime: 60, resolutionTime: 960, businessHoursOnly: true, escalationEnabled: false, isActive: true },
  { id: '5', name: 'Basic SLA', priority: 'medium', responseTime: 120, resolutionTime: 1440, businessHoursOnly: true, escalationEnabled: false, isActive: true },
];

const mockMetrics: SLAMetric[] = [
  { ticketId: 'TKT-001', ticketTitle: 'Server down - critical', clientName: 'Acme Corp', priority: 'critical', status: 'met', responseStatus: 'met', resolutionStatus: 'met', responseTimeActual: 12, responseTimeTarget: 15, resolutionTimeActual: 180, resolutionTimeTarget: 240, createdAt: '2024-01-15T08:00:00Z' },
  { ticketId: 'TKT-002', ticketTitle: 'Email sync issues', clientName: 'TechStart Inc', priority: 'high', status: 'at_risk', responseStatus: 'met', resolutionStatus: 'at_risk', responseTimeActual: 25, responseTimeTarget: 60, resolutionTimeActual: 800, resolutionTimeTarget: 960, createdAt: '2024-01-15T09:30:00Z' },
  { ticketId: 'TKT-003', ticketTitle: 'VPN connection failure', clientName: 'Acme Corp', priority: 'high', status: 'breached', responseStatus: 'breached', resolutionStatus: 'breached', responseTimeActual: 45, responseTimeTarget: 30, resolutionTimeActual: 600, resolutionTimeTarget: 480, createdAt: '2024-01-14T14:00:00Z' },
  { ticketId: 'TKT-004', ticketTitle: 'Printer not responding', clientName: 'Global Logistics', priority: 'medium', status: 'met', responseStatus: 'met', resolutionStatus: 'pending', responseTimeActual: 90, responseTimeTarget: 120, createdAt: '2024-01-15T11:00:00Z', resolutionTimeTarget: 1440 },
];

const mockTrendData = [
  { date: 'Mon', met: 12, breached: 1 },
  { date: 'Tue', met: 15, breached: 2 },
  { date: 'Wed', met: 10, breached: 0 },
  { date: 'Thu', met: 18, breached: 1 },
  { date: 'Fri', met: 14, breached: 3 },
  { date: 'Sat', met: 5, breached: 0 },
  { date: 'Sun', met: 3, breached: 0 },
];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function SLAManagementDashboard() {
  const [policies] = useState<SLAPolicy[]>(mockPolicies);
  const [metrics] = useState<SLAMetric[]>(mockMetrics);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);

  // Calculate stats
  const totalTickets = metrics.length;
  const metCount = metrics.filter(m => m.status === 'met').length;
  const atRiskCount = metrics.filter(m => m.status === 'at_risk').length;
  const breachedCount = metrics.filter(m => m.status === 'breached').length;
  const complianceRate = Math.round((metCount / totalTickets) * 100);

  const priorityColors = {
    critical: 'text-red-500 bg-red-500/10 border-red-500/30',
    high: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-green-500 bg-green-500/10 border-green-500/30',
  };

  return (
    <div className="space-y-6">
      {/* SLA Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Compliance Rate</p>
                <p className="text-3xl font-bold">{complianceRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+5% this week</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">SLA Met</p>
                <p className="text-3xl font-bold text-green-500">{metCount}</p>
                <p className="text-xs text-muted-foreground">of {totalTickets} tickets</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-yellow-500/30 bg-yellow-500/5",
          atRiskCount > 0 && "animate-pulse"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">At Risk</p>
                <p className="text-3xl font-bold text-yellow-500">{atRiskCount}</p>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </div>
              <Timer className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-red-500/30 bg-red-500/5",
          breachedCount > 0 && "border-red-500"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Breached</p>
                <p className="text-3xl font-bold text-red-500">{breachedCount}</p>
                <p className="text-xs text-muted-foreground">Escalation required</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SLA Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-500" />
              Weekly SLA Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="met" fill="hsl(142, 76%, 36%)" name="Met" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="breached" fill="hsl(0, 84%, 60%)" name="Breached" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Active SLA Policies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-cyan-500" />
                SLA Policies
              </CardTitle>
              <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Policy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create SLA Policy</DialogTitle>
                    <DialogDescription>Define response and resolution times</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Policy Name</Label>
                      <Input placeholder="Enterprise SLA" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority Level</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Client (Optional)</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="All clients" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Clients</SelectItem>
                            <SelectItem value="acme">Acme Corp</SelectItem>
                            <SelectItem value="techstart">TechStart Inc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Response Time (minutes)</Label>
                        <Input type="number" placeholder="30" />
                      </div>
                      <div className="space-y-2">
                        <Label>Resolution Time (minutes)</Label>
                        <Input type="number" placeholder="480" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Business Hours Only</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Enable Escalation</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>Cancel</Button>
                    <Button onClick={() => setShowPolicyDialog(false)}>Create Policy</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {policies.map(policy => (
                <div 
                  key={policy.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    priorityColors[policy.priority]
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{policy.name}</p>
                        <Badge variant="outline" className="text-xs">{policy.priority}</Badge>
                      </div>
                      {policy.clientName && (
                        <p className="text-xs text-muted-foreground">{policy.clientName}</p>
                      )}
                    </div>
                    <div className="text-right text-xs">
                      <p>Response: {formatDuration(policy.responseTime)}</p>
                      <p>Resolution: {formatDuration(policy.resolutionTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {policy.businessHoursOnly && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Business Hours
                      </span>
                    )}
                    {policy.escalationEnabled && (
                      <span className="flex items-center gap-1">
                        <Bell className="h-3 w-3" /> Escalation
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Tracking Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-500" />
                Active SLA Tracking
              </CardTitle>
              <CardDescription>Real-time SLA status for open tickets</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Resolution Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map(metric => (
                <TableRow key={metric.ticketId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{metric.ticketId}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{metric.ticketTitle}</p>
                    </div>
                  </TableCell>
                  <TableCell>{metric.clientName}</TableCell>
                  <TableCell>
                    <Badge className={priorityColors[metric.priority]}>
                      {metric.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {metric.responseStatus === 'met' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : metric.responseStatus === 'at_risk' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {formatDuration(metric.responseTimeActual)} / {formatDuration(metric.responseTimeTarget)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((metric.responseTimeActual / metric.responseTimeTarget) * 100, 100)} 
                        className={cn(
                          "h-1",
                          metric.responseStatus === 'met' && "[&>div]:bg-green-500",
                          metric.responseStatus === 'at_risk' && "[&>div]:bg-yellow-500",
                          metric.responseStatus === 'breached' && "[&>div]:bg-red-500"
                        )}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {metric.resolutionStatus === 'met' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : metric.resolutionStatus === 'at_risk' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : metric.resolutionStatus === 'pending' ? (
                          <Timer className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {metric.resolutionTimeActual 
                            ? `${formatDuration(metric.resolutionTimeActual)} / ${formatDuration(metric.resolutionTimeTarget)}`
                            : `- / ${formatDuration(metric.resolutionTimeTarget)}`}
                        </span>
                      </div>
                      {metric.resolutionTimeActual && (
                        <Progress 
                          value={Math.min((metric.resolutionTimeActual / metric.resolutionTimeTarget) * 100, 100)} 
                          className={cn(
                            "h-1",
                            metric.resolutionStatus === 'met' && "[&>div]:bg-green-500",
                            metric.resolutionStatus === 'at_risk' && "[&>div]:bg-yellow-500",
                            metric.resolutionStatus === 'breached' && "[&>div]:bg-red-500"
                          )}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      metric.status === 'met' ? 'default' :
                      metric.status === 'at_risk' ? 'secondary' : 'destructive'
                    }>
                      {metric.status === 'met' ? 'Met' : metric.status === 'at_risk' ? 'At Risk' : 'Breached'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
