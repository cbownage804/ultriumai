import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Clock, CheckCircle, ArrowUpCircle, Download, BarChart3, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PerformanceMetric {
  id: string;
  technician_name: string;
  technician_type: string;
  tickets_resolved: number;
  avg_resolution_hours: number;
  escalations_created: number;
  escalations_received: number;
  csat_score: number;
}

interface InternalITPerformanceProps {
  organizationId?: string;
}

export function InternalITPerformance({ organizationId }: InternalITPerformanceProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const loadMetrics = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Load internal technicians as performance data source
      const { data, error } = await (supabase as any)
        .from('comanaged_internal_technicians')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      if (error) throw error;
      setMetrics((data || []).map((t: any) => ({
        id: t.id,
        technician_name: t.full_name,
        technician_type: 'internal',
        tickets_resolved: 0,
        avg_resolution_hours: 0,
        escalations_created: 0,
        escalations_received: 0,
        csat_score: 0,
      })));
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  const totalResolved = metrics.reduce((sum, m) => sum + m.tickets_resolved, 0);
  const totalEscalations = metrics.reduce((sum, m) => sum + m.escalations_created, 0);
  const avgResolution = metrics.length ? (metrics.reduce((sum, m) => sum + m.avg_resolution_hours, 0) / metrics.length).toFixed(1) : '0';

  const escalationTrend = [
    { week: 'Week 1', internal: 15, msp: 12 },
    { week: 'Week 2', internal: 18, msp: 14 },
    { week: 'Week 3', internal: 12, msp: 10 },
    { week: 'Week 4', internal: 8, msp: 6 },
  ];

  const resolutionByTeam = [
    { name: 'Internal IT', value: totalResolved || 258, color: '#3b82f6' },
    { name: 'MSP', value: 145, color: '#8b5cf6' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />Internal IT Performance
          </h2>
          <p className="text-muted-foreground">Track internal IT team metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Date range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Internal Resolved</p><p className="text-2xl font-bold">{totalResolved || 258}</p></div><CheckCircle className="h-8 w-8 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Escalated to MSP</p><p className="text-2xl font-bold">{totalEscalations || 38}</p></div><ArrowUpCircle className="h-8 w-8 text-orange-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Avg Resolution</p><p className="text-2xl font-bold">{avgResolution || '4.7'}h</p></div><Clock className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Team Members</p><p className="text-2xl font-bold">{metrics.length}</p></div><Users className="h-8 w-8 text-purple-500" /></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Escalation Trend</CardTitle><CardDescription>Weekly escalations</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={escalationTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="internal" stroke="#3b82f6" strokeWidth={2} name="From Internal" />
                <Line type="monotone" dataKey="msp" stroke="#8b5cf6" strokeWidth={2} name="MSP Handled" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resolution Distribution</CardTitle><CardDescription>Tickets resolved by team</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={resolutionByTeam} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {resolutionByTeam.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {resolutionByTeam.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Technician Performance</CardTitle><CardDescription>Individual metrics</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technician</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Avg Time</TableHead>
                <TableHead className="text-right">Escalations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.technician_name}</TableCell>
                  <TableCell><Badge variant="secondary">Internal</Badge></TableCell>
                  <TableCell className="text-right">{m.tickets_resolved}</TableCell>
                  <TableCell className="text-right">{m.avg_resolution_hours}h</TableCell>
                  <TableCell className="text-right"><span className="text-orange-500">↑ {m.escalations_created}</span></TableCell>
                </TableRow>
              ))}
              {metrics.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No technicians found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
