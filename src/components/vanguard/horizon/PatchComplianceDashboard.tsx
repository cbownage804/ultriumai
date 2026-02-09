import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Server, 
  Download, RefreshCw, TrendingUp, Clock, Filter, Loader2
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHorizonStats } from '@/hooks/useHorizonStats';

export function PatchComplianceDashboard() {
  const { user } = useAuth();
  const { stats: horizonStats, devices: agentDevices, isLoading: statsLoading, refetch } = useHorizonStats();
  const [patches, setPatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchPatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('patch_management')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPatches(data || []);
    } catch (err) {
      console.error('Error fetching patches:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPatches(); }, [fetchPatches]);

  // Build per-device compliance from agents + patches
  const deviceCompliance = useMemo(() => {
    return agentDevices.map(device => {
      const devicePatches = patches.filter(p => p.agent_id === device.id);
      const pending = devicePatches.filter(p => p.status === 'pending').length;
      const criticalPending = devicePatches.filter(p => p.severity === 'critical' && p.status !== 'completed').length;
      const completed = devicePatches.filter(p => p.status === 'completed').length;
      const total = devicePatches.length;
      const score = total > 0 ? Math.round((completed / total) * 100) : 100;
      const status = criticalPending > 0 ? 'critical' : pending > 0 ? 'warning' : 'compliant';
      return {
        id: device.id,
        deviceName: device.name,
        osVersion: device.os_info || 'Unknown',
        pendingPatches: pending,
        criticalPending,
        complianceScore: score,
        status,
      };
    });
  }, [agentDevices, patches]);

  // Patch summary by severity
  const patchSummary = useMemo(() => {
    const groups: Record<string, { total: number; installed: number; pending: number; failed: number }> = {};
    for (const p of patches) {
      const cat = p.severity || 'other';
      if (!groups[cat]) groups[cat] = { total: 0, installed: 0, pending: 0, failed: 0 };
      groups[cat].total++;
      if (p.status === 'completed') groups[cat].installed++;
      else if (p.status === 'failed') groups[cat].failed++;
      else groups[cat].pending++;
    }
    return Object.entries(groups).map(([category, data]) => ({ category, ...data }));
  }, [patches]);

  const overallCompliance = deviceCompliance.length > 0
    ? Math.round(deviceCompliance.reduce((s, d) => s + d.complianceScore, 0) / deviceCompliance.length)
    : horizonStats.patchCompliance;

  const filteredDevices = filterStatus === 'all' 
    ? deviceCompliance 
    : deviceCompliance.filter(d => d.status === filterStatus);

  const criticalCount = deviceCompliance.filter(d => d.status === 'critical').length;
  const warningCount = deviceCompliance.filter(d => d.status === 'warning').length;
  const compliantCount = deviceCompliance.filter(d => d.status === 'compliant').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500/20 text-green-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const isLoading = loading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patch Compliance Dashboard</h2>
          <p className="text-muted-foreground">
            {patches.length > 0 ? 'Live patch status across all devices' : 'No patch data yet — patches will appear as agents report'}
          </p>
        </div>
        <Button onClick={() => { refetch(); fetchPatches(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Sync Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className={`${overallCompliance >= 90 ? 'bg-green-500/10 border-green-500/30' : overallCompliance >= 70 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <CardContent className="pt-4">
            <div className={`text-3xl font-bold ${getScoreColor(overallCompliance)}`}>
              {overallCompliance}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Compliance</p>
            <Progress value={overallCompliance} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{compliantCount}</div>
            <p className="text-sm text-muted-foreground">Compliant</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
            <p className="text-sm text-muted-foreground">Warning</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
            <p className="text-sm text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{horizonStats.pendingPatches}</div>
            <p className="text-sm text-muted-foreground">Pending Updates</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Device Compliance</TabsTrigger>
          <TabsTrigger value="patches">Patch Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            {filteredDevices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Critical</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map(device => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{device.deviceName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{device.osVersion}</TableCell>
                      <TableCell>
                        {device.pendingPatches > 0 ? (
                          <Badge variant="outline">{device.pendingPatches}</Badge>
                        ) : (
                          <span className="text-green-400">✓</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {device.criticalPending > 0 ? (
                          <Badge className="bg-red-500/20 text-red-400">{device.criticalPending}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${getScoreColor(device.complianceScore)}`}>
                            {device.complianceScore}%
                          </span>
                          <Progress value={device.complianceScore} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  {agentDevices.length === 0 ? 'Deploy agents to see device compliance' : 'No devices match the current filter'}
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="patches">
          <Card>
            <CardHeader>
              <CardTitle>Patch Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {patchSummary.length > 0 ? (
                <div className="space-y-4">
                  {patchSummary.map(cat => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{cat.category}</span>
                        <span className="text-muted-foreground">{cat.installed}/{cat.total}</span>
                      </div>
                      <Progress value={cat.total > 0 ? (cat.installed / cat.total) * 100 : 0} className="h-2" />
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-400">{cat.installed} installed</span>
                        <span className="text-yellow-400">{cat.pending} pending</span>
                        {cat.failed > 0 && <span className="text-red-400">{cat.failed} failed</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No patch data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
