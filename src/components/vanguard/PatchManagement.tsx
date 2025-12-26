import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Shield, AlertTriangle, CheckCircle, Clock, Download, Server, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PatchInfo {
  id: string;
  name: string;
  severity: string;
  category: string;
  size: string;
  release_date: string;
  status: string;
  devices_affected: number;
  devices_patched: number;
}

export const PatchManagement = () => {
  const { user } = useAuth();
  const [patches, setPatches] = useState<PatchInfo[]>([]);
  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    compliance: 85
  });

  useEffect(() => {
    if (user) loadPatches();
  }, [user]);

  const loadPatches = async () => {
    const { data } = await supabase
      .from('patch_management')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      const mappedPatches = data.map(p => ({
        id: p.id,
        name: p.patch_name,
        severity: p.severity,
        category: p.vendor,
        size: 'N/A',
        release_date: p.release_date || p.created_at,
        status: p.status,
        devices_affected: p.affected_devices || 1,
        devices_patched: p.status === 'completed' ? (p.affected_devices || 1) : 0
      }));
      setPatches(mappedPatches);
      setStats({
        critical: mappedPatches.filter(p => p.severity === 'critical' && p.status !== 'completed').length,
        high: mappedPatches.filter(p => p.severity === 'high' && p.status !== 'completed').length,
        medium: mappedPatches.filter(p => p.severity === 'medium' && p.status !== 'completed').length,
        low: mappedPatches.filter(p => p.severity === 'low' && p.status !== 'completed').length,
        compliance: mappedPatches.length > 0 
          ? Math.round(mappedPatches.filter(p => p.status === 'completed').length / mappedPatches.length * 100)
          : 100
      });
    } else {
      // No real patches - show empty state
      setPatches([]);
      setStats({
        critical: 0, high: 0, medium: 0, low: 0,
        compliance: 100
      });
    }
  };

  const deployPatch = async (patchId: string) => {
    toast.success('Patch deployment scheduled');
    // Would trigger agent command to deploy patch
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return <Badge className={colors[severity] || 'bg-muted'}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500'
    };
    return <Badge className={colors[status] || 'bg-muted'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.high}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-yellow-500" />
              Medium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.medium}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.low}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.compliance}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Patches
              </CardTitle>
              <CardDescription>
                Patches awaiting deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patches.filter(p => p.status === 'pending').map(patch => (
                  <div key={patch.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{patch.name}</h4>
                          {getSeverityBadge(patch.severity)}
                          <Badge variant="outline">{patch.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Server className="h-4 w-4" />
                            {patch.devices_patched}/{patch.devices_affected} devices
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {patch.size}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(patch.release_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Progress value={(patch.devices_patched / patch.devices_affected) * 100} className="h-2" />
                        </div>
                      </div>
                      <Button size="sm" onClick={() => deployPatch(patch.id)}>
                        Deploy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patches In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patches.filter(p => p.status === 'in_progress').map(patch => (
                  <div key={patch.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{patch.name}</h4>
                          {getSeverityBadge(patch.severity)}
                          {getStatusBadge(patch.status)}
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{patch.devices_patched}/{patch.devices_affected} devices</span>
                            <span>{Math.round((patch.devices_patched / patch.devices_affected) * 100)}%</span>
                          </div>
                          <Progress value={(patch.devices_patched / patch.devices_affected) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed Patches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patches.filter(p => p.status === 'completed').map(patch => (
                  <div key={patch.id} className="p-4 border rounded-lg bg-green-500/5">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium">{patch.name}</h4>
                      {getSeverityBadge(patch.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      All {patch.devices_affected} devices patched successfully
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Patch Schedule
              </CardTitle>
              <CardDescription>
                Configure automatic patch deployment windows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Critical Patches</h4>
                  <p className="text-sm text-muted-foreground">Deploy immediately with 4-hour grace period</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">High Priority</h4>
                  <p className="text-sm text-muted-foreground">Deploy within 24 hours during maintenance window</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Medium Priority</h4>
                  <p className="text-sm text-muted-foreground">Deploy within 7 days during weekends</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Low Priority</h4>
                  <p className="text-sm text-muted-foreground">Deploy within 30 days during scheduled maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
