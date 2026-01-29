import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Target,
  Zap,
  Server,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SLAPolicy {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  uptimeTarget: number;
  responseTimeTarget?: number;
  resolutionTimeTarget?: number;
  maintenanceWindow?: any;
  breachNotifications: string[];
  isActive: boolean;
}

interface UptimeRecord {
  id: string;
  clientId?: string;
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
  clientId?: string;
  clientName: string;
  breachType: 'uptime' | 'response' | 'resolution';
  occurredAt: Date;
  duration: number;
  target: number;
  actual: number;
  status: 'active' | 'resolved' | 'acknowledged';
  ticketId?: string;
  notes?: string;
}

export function SLAUptimeMonitoring() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [uptimeRecords, setUptimeRecords] = useState<UptimeRecord[]>([]);
  const [breaches, setBreaches] = useState<SLABreach[]>([]);
  const [showAddPolicyDialog, setShowAddPolicyDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPolicy, setNewPolicy] = useState({ name: '', uptimeTarget: 99.9, clientName: '' });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [policiesRes, uptimeRes, breachRes] = await Promise.all([
        (supabase as any).from('vanguard_uptime_policies').select('*').eq('user_id', user.id),
        (supabase as any).from('vanguard_uptime_records').select('*').eq('user_id', user.id),
        (supabase as any).from('vanguard_sla_breaches').select('*').eq('user_id', user.id).order('occurred_at', { ascending: false })
      ]);

      if (policiesRes.data) {
        setPolicies(policiesRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          clientId: p.client_id,
          clientName: p.client_name,
          uptimeTarget: p.uptime_target,
          responseTimeTarget: p.response_time_target,
          resolutionTimeTarget: p.resolution_time_target,
          maintenanceWindow: p.maintenance_window,
          breachNotifications: p.breach_notifications || [],
          isActive: p.is_active
        })));
      }

      if (uptimeRes.data) {
        setUptimeRecords(uptimeRes.data.map((r: any) => ({
          id: r.id,
          clientId: r.client_id,
          clientName: r.client_name || 'Unknown',
          currentUptime: r.current_uptime || 0,
          last30Days: r.last_30_days_uptime || 0,
          lastDowntime: r.last_downtime_at ? new Date(r.last_downtime_at) : undefined,
          downtimeMinutes30d: r.downtime_minutes_30d || 0,
          incidents30d: r.incidents_30d || 0,
          slaTarget: r.sla_target || 99.9,
          trend: r.trend || 'stable'
        })));
      }

      if (breachRes.data) {
        setBreaches(breachRes.data.map((b: any) => ({
          id: b.id,
          clientId: b.client_id,
          clientName: b.client_name || 'Unknown',
          breachType: b.breach_type,
          occurredAt: new Date(b.occurred_at),
          duration: b.duration_minutes || 0,
          target: b.target_value || 0,
          actual: b.actual_value || 0,
          status: b.status,
          ticketId: b.ticket_id,
          notes: b.notes
        })));
      }
    } catch (error) {
      console.error('Error loading SLA data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!user || !newPolicy.name) return;
    try {
      const { error } = await (supabase as any).from('vanguard_uptime_policies').insert({
        user_id: user.id,
        name: newPolicy.name,
        uptime_target: newPolicy.uptimeTarget,
        client_name: newPolicy.clientName || null,
        is_active: true
      });
      if (error) throw error;
      toast.success('Policy created');
      setShowAddPolicyDialog(false);
      setNewPolicy({ name: '', uptimeTarget: 99.9, clientName: '' });
      loadData();
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error('Failed to create policy');
    }
  };

  const activeBreaches = breaches.filter(b => b.status === 'active' || b.status === 'acknowledged');
  const avgUptime = uptimeRecords.length > 0 
    ? uptimeRecords.reduce((acc, r) => acc + r.last30Days, 0) / uptimeRecords.length 
    : 0;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn(
          avgUptime >= 99.9 ? "border-green-500/30 bg-green-500/5" :
          avgUptime >= 99 ? "border-yellow-500/30 bg-yellow-500/5" :
          "border-red-500/30 bg-red-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Avg Uptime (30d)</p>
                <p className={cn("text-3xl font-bold", getUptimeColor(avgUptime, 99.9))}>
                  {avgUptime.toFixed(2)}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Active Breaches</p>
                <p className="text-3xl font-bold text-red-500">{activeBreaches.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Downtime (30d)</p>
                <p className="text-3xl font-bold">{totalDowntimeMinutes} min</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Incidents (30d)</p>
                <p className="text-3xl font-bold">{totalIncidents}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
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
                <Target className="h-5 w-5 text-cyan-500" />
                SLA & Uptime Monitoring
              </CardTitle>
              <CardDescription>Track SLA compliance and system uptime</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddPolicyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Policy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="uptime">
            <TabsList>
              <TabsTrigger value="uptime">Uptime Status</TabsTrigger>
              <TabsTrigger value="policies">SLA Policies</TabsTrigger>
              <TabsTrigger value="breaches">Breaches</TabsTrigger>
            </TabsList>

            <TabsContent value="uptime" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>30-Day Avg</TableHead>
                    <TableHead>SLA Target</TableHead>
                    <TableHead>Downtime</TableHead>
                    <TableHead>Incidents</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uptimeRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No uptime records yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    uptimeRecords.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.clientName}</TableCell>
                        <TableCell className={getUptimeColor(record.currentUptime, record.slaTarget)}>
                          {record.currentUptime.toFixed(2)}%
                        </TableCell>
                        <TableCell className={getUptimeColor(record.last30Days, record.slaTarget)}>
                          {record.last30Days.toFixed(2)}%
                        </TableCell>
                        <TableCell>{record.slaTarget}%</TableCell>
                        <TableCell>{record.downtimeMinutes30d} min</TableCell>
                        <TableCell>{record.incidents30d}</TableCell>
                        <TableCell>
                          {record.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {record.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {record.trend === 'stable' && <Activity className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="policies" className="mt-4">
              <div className="space-y-3">
                {policies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No SLA policies configured</p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowAddPolicyDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />Create Policy
                    </Button>
                  </div>
                ) : (
                  policies.map(policy => (
                    <Card key={policy.id} className={cn(policy.isActive ? "border-green-500/30" : "border-muted")}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{policy.name}</p>
                              {policy.isActive && <Badge className="bg-green-500/20 text-green-500">Active</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Target: {policy.uptimeTarget}% uptime
                              {policy.responseTimeTarget && ` • ${policy.responseTimeTarget}min response`}
                              {policy.resolutionTimeTarget && ` • ${policy.resolutionTimeTarget}hr resolution`}
                            </p>
                            {policy.clientName && (
                              <p className="text-xs text-muted-foreground">Client: {policy.clientName}</p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="breaches" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Occurred</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breaches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No SLA breaches recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    breaches.map(breach => (
                      <TableRow key={breach.id}>
                        <TableCell className="font-medium">{breach.clientName}</TableCell>
                        <TableCell>
                          <Badge className={getBreachBadge(breach.breachType)}>
                            {breach.breachType}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(breach.occurredAt, 'MMM dd, HH:mm')}</TableCell>
                        <TableCell>{breach.target}%</TableCell>
                        <TableCell className="text-red-500">{breach.actual}%</TableCell>
                        <TableCell>
                          <Badge variant={breach.status === 'resolved' ? 'default' : 'secondary'}>
                            {breach.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Policy Dialog */}
      <Dialog open={showAddPolicyDialog} onOpenChange={setShowAddPolicyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SLA Policy</DialogTitle>
            <DialogDescription>Define uptime and response targets</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Policy Name</Label>
              <Input 
                placeholder="Enterprise Platinum" 
                value={newPolicy.name}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Client Name (optional)</Label>
              <Input 
                placeholder="Acme Corp" 
                value={newPolicy.clientName}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Uptime Target (%)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={newPolicy.uptimeTarget}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, uptimeTarget: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPolicyDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePolicy}>Create Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}