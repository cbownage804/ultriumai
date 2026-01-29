import { useState, useEffect } from 'react';
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
  Plus,
  Settings,
  Bell,
  Target,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SLAPolicy {
  id: string;
  name: string;
  client_id?: string;
  client_name?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  response_time_minutes: number;
  resolution_time_minutes: number;
  business_hours_only: boolean;
  escalation_enabled: boolean;
  is_active: boolean;
}

interface SLAMetric {
  ticket_id: string;
  ticket_title: string;
  client_name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'met' | 'at_risk' | 'breached';
  response_status: 'met' | 'at_risk' | 'breached';
  resolution_status: 'met' | 'at_risk' | 'breached' | 'pending';
  response_time_actual: number;
  response_time_target: number;
  resolution_time_actual?: number;
  resolution_time_target: number;
  created_at: string;
}

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
  const { user } = useAuth();
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [metrics, setMetrics] = useState<SLAMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    priority: 'medium' as const,
    response_time_minutes: 60,
    resolution_time_minutes: 480,
    business_hours_only: true,
    escalation_enabled: true
  });

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch SLA policies
      const { data: policiesData, error: policiesError } = await supabase
        .from('vanguard_sla_policies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (policiesError) throw policiesError;
      
      // Transform to match interface
      const transformedPolicies: SLAPolicy[] = (policiesData || []).map((p: any) => ({
        id: p.id,
        name: p.policy_name || 'Unnamed Policy',
        client_id: p.client_id,
        priority: p.priority || 'medium',
        response_time_minutes: p.response_time_minutes || 60,
        resolution_time_minutes: p.resolution_time_minutes || 480,
        business_hours_only: p.business_hours_only ?? true,
        escalation_enabled: p.escalation_enabled ?? true,
        is_active: p.is_active ?? true,
      }));
      setPolicies(transformedPolicies);

      // Fetch SLA tracking metrics - use any type to avoid deep instantiation
      const { data: trackingData, error: trackingError } = await (supabase as any)
        .from('vanguard_ticket_sla_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (trackingError) throw trackingError;
      
      // Transform tracking data to metrics format based on actual schema
      const transformedMetrics: SLAMetric[] = (trackingData || []).map((t: any) => ({
        ticket_id: t.ticket_id || '',
        ticket_title: 'Ticket',
        client_name: 'Client',
        priority: 'medium' as const,
        status: t.resolution_breached ? 'breached' : t.response_breached ? 'at_risk' : 'met',
        response_status: t.response_breached ? 'breached' as const : 'met' as const,
        resolution_status: t.resolved_at ? (t.resolution_breached ? 'breached' as const : 'met' as const) : 'pending' as const,
        response_time_actual: 0,
        response_time_target: 60,
        resolution_time_actual: t.resolved_at ? 0 : undefined,
        resolution_time_target: 480,
        created_at: t.created_at
      }));
      
      setMetrics(transformedMetrics);
    } catch (error) {
      console.error('Error fetching SLA data:', error);
      toast.error('Failed to load SLA data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!user?.id || !newPolicy.name) return;
    
    try {
      const { error } = await supabase
        .from('vanguard_sla_policies')
        .insert({
          user_id: user.id,
          policy_name: newPolicy.name,
          priority: newPolicy.priority,
          response_time_minutes: newPolicy.response_time_minutes,
          resolution_time_minutes: newPolicy.resolution_time_minutes,
          business_hours_only: newPolicy.business_hours_only,
          escalation_enabled: newPolicy.escalation_enabled,
          is_active: true
        });

      if (error) throw error;
      toast.success('SLA Policy created');
      setShowPolicyDialog(false);
      setNewPolicy({
        name: '',
        priority: 'medium',
        response_time_minutes: 60,
        resolution_time_minutes: 480,
        business_hours_only: true,
        escalation_enabled: true
      });
      fetchData();
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error('Failed to create policy');
    }
  };

  // Calculate stats
  const totalTickets = metrics.length || 1;
  const metCount = metrics.filter(m => m.status === 'met').length;
  const atRiskCount = metrics.filter(m => m.status === 'at_risk').length;
  const breachedCount = metrics.filter(m => m.status === 'breached').length;
  const complianceRate = Math.round((metCount / totalTickets) * 100) || 0;

  const priorityColors = {
    critical: 'text-red-500 bg-red-500/10 border-red-500/30',
    high: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-green-500 bg-green-500/10 border-green-500/30',
  };

  // Mock trend data (would come from aggregated queries in production)
  const trendData = [
    { date: 'Mon', met: metCount, breached: breachedCount },
    { date: 'Tue', met: Math.max(0, metCount - 1), breached: Math.max(0, breachedCount - 1) },
    { date: 'Wed', met: metCount + 2, breached: 0 },
    { date: 'Thu', met: metCount, breached: 1 },
    { date: 'Fri', met: metCount + 1, breached: breachedCount },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

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
                  <span className="text-xs text-green-500">Target: 95%</span>
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
                <p className="text-xs text-muted-foreground">of {metrics.length} tickets</p>
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
                <BarChart data={trendData}>
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
                SLA Policies ({policies.length})
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
                      <Input 
                        placeholder="Enterprise SLA" 
                        value={newPolicy.name}
                        onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority Level</Label>
                        <Select 
                          value={newPolicy.priority}
                          onValueChange={(v: any) => setNewPolicy({ ...newPolicy, priority: v })}
                        >
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
                        <Label>Response Time (minutes)</Label>
                        <Input 
                          type="number" 
                          value={newPolicy.response_time_minutes}
                          onChange={(e) => setNewPolicy({ ...newPolicy, response_time_minutes: parseInt(e.target.value) || 60 })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Resolution Time (minutes)</Label>
                        <Input 
                          type="number" 
                          value={newPolicy.resolution_time_minutes}
                          onChange={(e) => setNewPolicy({ ...newPolicy, resolution_time_minutes: parseInt(e.target.value) || 480 })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Business Hours Only</Label>
                      <Switch 
                        checked={newPolicy.business_hours_only}
                        onCheckedChange={(v) => setNewPolicy({ ...newPolicy, business_hours_only: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Enable Escalation</Label>
                      <Switch 
                        checked={newPolicy.escalation_enabled}
                        onCheckedChange={(v) => setNewPolicy({ ...newPolicy, escalation_enabled: v })}
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
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {policies.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No SLA policies defined. Create one to get started.</p>
              ) : (
                policies.map(policy => (
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
                      </div>
                      <div className="text-right text-xs">
                        <p>Response: {formatDuration(policy.response_time_minutes)}</p>
                        <p>Resolution: {formatDuration(policy.resolution_time_minutes)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {policy.business_hours_only && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Business Hours
                        </span>
                      )}
                      {policy.escalation_enabled && (
                        <span className="flex items-center gap-1">
                          <Bell className="h-3 w-3" /> Escalation
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
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
          {metrics.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No SLA tracking data available yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Resolution Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map(metric => (
                  <TableRow key={metric.ticket_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{metric.ticket_id.slice(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{metric.ticket_title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[metric.priority]}>
                        {metric.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {metric.response_status === 'met' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : metric.response_status === 'at_risk' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {formatDuration(metric.response_time_actual)} / {formatDuration(metric.response_time_target)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {metric.resolution_status === 'met' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : metric.resolution_status === 'pending' ? (
                          <Clock className="h-4 w-4 text-blue-500" />
                        ) : metric.resolution_status === 'at_risk' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {metric.resolution_time_actual ? formatDuration(metric.resolution_time_actual) : 'In progress'} / {formatDuration(metric.resolution_time_target)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        metric.status === 'met' && 'bg-green-500/20 text-green-500',
                        metric.status === 'at_risk' && 'bg-yellow-500/20 text-yellow-500',
                        metric.status === 'breached' && 'bg-red-500/20 text-red-500'
                      )}>
                        {metric.status.replace('_', ' ')}
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
