import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  ShieldAlert, 
  Clock, 
  AlertTriangle,
  Bell,
  Target,
  Zap,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Timer,
  Plus,
  Loader2,
  Settings,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SLAPolicy {
  id: string;
  name: string;
  priority: string;
  responseTime: number; // minutes
  resolutionTime: number; // minutes
  isActive: boolean;
  notifyOnWarning: boolean;
  warningThreshold: number; // percentage
  autoEscalate: boolean;
  escalateTo: string | null;
}

interface SLAMetric {
  priority: string;
  total: number;
  met: number;
  breached: number;
  atRisk: number;
  complianceRate: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

const defaultPolicies: SLAPolicy[] = [
  { id: '1', name: 'Critical SLA', priority: 'critical', responseTime: 15, resolutionTime: 120, isActive: true, notifyOnWarning: true, warningThreshold: 75, autoEscalate: true, escalateTo: 'manager' },
  { id: '2', name: 'High Priority SLA', priority: 'high', responseTime: 60, resolutionTime: 240, isActive: true, notifyOnWarning: true, warningThreshold: 80, autoEscalate: true, escalateTo: 'tier2' },
  { id: '3', name: 'Medium Priority SLA', priority: 'medium', responseTime: 240, resolutionTime: 480, isActive: true, notifyOnWarning: false, warningThreshold: 85, autoEscalate: false, escalateTo: null },
  { id: '4', name: 'Low Priority SLA', priority: 'low', responseTime: 480, resolutionTime: 1440, isActive: true, notifyOnWarning: false, warningThreshold: 90, autoEscalate: false, escalateTo: null },
];

export function SLAEnforcementDashboard() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [metrics, setMetrics] = useState<SLAMetric[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [newPolicy, setNewPolicy] = useState({
    name: '',
    priority: 'medium',
    responseTime: 60,
    resolutionTime: 240,
    notifyOnWarning: true,
    warningThreshold: 80
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Load SLA policies from database
      const { data: policyData } = await supabase
        .from('sla_policies')
        .select('*')
        .order('created_at', { ascending: true });

      if (policyData && policyData.length > 0) {
        setPolicies(policyData.map((p: any) => ({
          id: p.id,
          name: p.name,
          priority: p.priority_level || 'medium',
          responseTime: p.first_response_hours ? p.first_response_hours * 60 : 60,
          resolutionTime: p.resolution_hours ? p.resolution_hours * 60 : 240,
          isActive: p.is_active ?? true,
          notifyOnWarning: true,
          warningThreshold: 80,
          autoEscalate: !!p.escalation_hours,
          escalateTo: p.escalation_hours ? 'manager' : null,
        })));
      } else {
        setPolicies(defaultPolicies);
      }

      // Calculate metrics from helpdesk_tickets
      const { data: ticketData } = await (supabase as any)
        .from('helpdesk_tickets')
        .select('priority, status, sla_status, created_at, first_response_at, resolved_at')
        .not('priority', 'is', null);

      if (ticketData && ticketData.length > 0) {
        const priorities = ['critical', 'high', 'medium', 'low'];
        const calculatedMetrics: SLAMetric[] = priorities.map(priority => {
          const priorityTickets = ticketData.filter((t: any) => t.priority === priority);
          const total = priorityTickets.length;
          const met = priorityTickets.filter((t: any) => t.sla_status === 'met' || t.sla_status === 'on_track').length;
          const breached = priorityTickets.filter((t: any) => t.sla_status === 'breached').length;
          const atRisk = priorityTickets.filter((t: any) => t.sla_status === 'at_risk').length;
          return {
            priority,
            total,
            met,
            breached,
            atRisk,
            complianceRate: total > 0 ? Math.round((met / total) * 100) : 100,
            avgResponseTime: 0,
            avgResolutionTime: 0,
          };
        });
        setMetrics(calculatedMetrics);
      } else {
        setMetrics([]);
      }
    } catch (err) {
      console.error('Error loading SLA data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!user || !newPolicy.name) {
      toast.error('Please enter a policy name');
      return;
    }
    try {
      const { error } = await supabase.from('sla_policies').insert({
        name: newPolicy.name,
        priority_level: newPolicy.priority,
        first_response_hours: newPolicy.responseTime / 60,
        resolution_hours: newPolicy.resolutionTime / 60,
        is_active: true,
      });
      if (error) throw error;
      toast.success('SLA policy created');
      setShowPolicyDialog(false);
      setNewPolicy({ name: '', priority: 'medium', responseTime: 60, resolutionTime: 240, notifyOnWarning: true, warningThreshold: 80 });
      loadData();
    } catch (err) {
      console.error('Error creating policy:', err);
      toast.error('Failed to create policy');
    }
  };

  const togglePolicy = async (id: string) => {
    const policy = policies.find(p => p.id === id);
    if (!policy) return;
    try {
      await supabase.from('sla_policies').update({ is_active: !policy.isActive }).eq('id', id);
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
    } catch (err) {
      console.error('Error toggling policy:', err);
    }
  };

  const overallCompliance = metrics.length > 0 
    ? Math.round(metrics.reduce((acc, m) => acc + (m.met / m.total) * 100, 0) / metrics.length)
    : 0;

  const totalBreaches = metrics.reduce((acc, m) => acc + m.breached, 0);
  const totalAtRisk = metrics.reduce((acc, m) => acc + m.atRisk, 0);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn("border-l-4", overallCompliance >= 90 ? "border-l-green-500 bg-green-500/5" : overallCompliance >= 75 ? "border-l-amber-500 bg-amber-500/5" : "border-l-red-500 bg-red-500/5")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Overall SLA Compliance</p>
                <p className="text-3xl font-bold">{overallCompliance}%</p>
                <Progress value={overallCompliance} className="h-1 mt-2" />
              </div>
              <Target className={cn("h-8 w-8", overallCompliance >= 90 ? "text-green-500" : overallCompliance >= 75 ? "text-amber-500" : "text-red-500")} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">SLA Breaches</p>
                <p className="text-3xl font-bold text-red-500">{totalBreaches}</p>
                <p className="text-xs text-muted-foreground">This period</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">At Risk</p>
                <p className="text-3xl font-bold text-amber-500">{totalAtRisk}</p>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Active Policies</p>
                <p className="text-3xl font-bold">{policies.filter(p => p.isActive).length}</p>
                <p className="text-xs text-muted-foreground">of {policies.length} total</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-cyan-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-cyan-500" />
                SLA Enforcement Center
              </CardTitle>
              <CardDescription>Monitor and enforce SLA compliance across all tickets</CardDescription>
            </div>
            <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Policy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create SLA Policy</DialogTitle>
                  <DialogDescription>Define response and resolution time targets</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Policy Name</Label>
                      <Input 
                        value={newPolicy.name}
                        onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enterprise Critical SLA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority Level</Label>
                      <Select 
                        value={newPolicy.priority}
                        onValueChange={(v) => setNewPolicy(prev => ({ ...prev, priority: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Response Time (minutes)</Label>
                      <Input 
                        type="number"
                        value={newPolicy.responseTime}
                        onChange={(e) => setNewPolicy(prev => ({ ...prev, responseTime: parseInt(e.target.value) || 60 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Resolution Time (minutes)</Label>
                      <Input 
                        type="number"
                        value={newPolicy.resolutionTime}
                        onChange={(e) => setNewPolicy(prev => ({ ...prev, resolutionTime: parseInt(e.target.value) || 240 }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Warning Notifications</p>
                      <p className="text-sm text-muted-foreground">Alert when SLA is at risk</p>
                    </div>
                    <Switch 
                      checked={newPolicy.notifyOnWarning}
                      onCheckedChange={(v) => setNewPolicy(prev => ({ ...prev, notifyOnWarning: v }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreatePolicy}>Create Policy</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Compliance Overview</TabsTrigger>
              <TabsTrigger value="policies">SLA Policies</TabsTrigger>
              <TabsTrigger value="breaches">Breach History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <Card key={metric.priority} className={cn("border", getPriorityColor(metric.priority))}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge className={getPriorityColor(metric.priority)}>
                            {metric.priority.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium">{metric.total} Tickets</p>
                            <p className="text-sm text-muted-foreground">
                              {metric.met} met • {metric.breached} breached • {metric.atRisk} at risk
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{metric.complianceRate}%</p>
                            <p className="text-xs text-muted-foreground">Compliance</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium">{formatTime(metric.avgResponseTime)}</p>
                            <p className="text-xs text-muted-foreground">Avg Response</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium">{formatTime(metric.avgResolutionTime)}</p>
                            <p className="text-xs text-muted-foreground">Avg Resolution</p>
                          </div>
                          <div className="w-24">
                            <Progress value={metric.complianceRate} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="policies" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Resolution Time</TableHead>
                    <TableHead>Notifications</TableHead>
                    <TableHead>Auto-Escalate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.name}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(policy.priority)}>{policy.priority}</Badge>
                      </TableCell>
                      <TableCell>{formatTime(policy.responseTime)}</TableCell>
                      <TableCell>{formatTime(policy.resolutionTime)}</TableCell>
                      <TableCell>
                        {policy.notifyOnWarning ? (
                          <Badge variant="outline" className="text-green-400 border-green-500/30">
                            <Bell className="h-3 w-3 mr-1" />
                            {policy.warningThreshold}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Disabled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {policy.autoEscalate ? (
                          <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                            {policy.escalateTo}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch checked={policy.isActive} onCheckedChange={() => togglePolicy(policy.id)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="breaches" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No SLA breaches in the selected period</p>
                <p className="text-sm">Great job maintaining SLA compliance!</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
