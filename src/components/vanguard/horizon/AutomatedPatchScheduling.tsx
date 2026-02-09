import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, Clock, Plus, Settings, Play, Pause, 
  CheckCircle, AlertTriangle, Server, Download, Shield, Loader2, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function AutomatedPatchScheduling() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [patches, setPatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [selectedPatches, setSelectedPatches] = useState<string[]>([]);

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

  const pendingPatches = useMemo(() => patches.filter(p => p.status === 'pending'), [patches]);
  const approvedPatches = useMemo(() => patches.filter(p => p.status === 'approved'), [patches]);
  const completedPatches = useMemo(() => patches.filter(p => p.status === 'completed'), [patches]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'important': case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'moderate': case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleApprove = async (patchId: string) => {
    const { error } = await supabase
      .from('patch_management')
      .update({ status: 'approved' })
      .eq('id', patchId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to approve patch', variant: 'destructive' });
    } else {
      toast({ title: 'Approved', description: 'Patch approved for deployment' });
      fetchPatches();
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPatches.length === 0) return;
    const { error } = await supabase
      .from('patch_management')
      .update({ status: 'approved' })
      .in('id', selectedPatches);
    if (error) {
      toast({ title: 'Error', description: 'Failed to approve patches', variant: 'destructive' });
    } else {
      toast({ title: 'Approved', description: `${selectedPatches.length} patches approved` });
      setSelectedPatches([]);
      fetchPatches();
    }
  };

  if (loading) {
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Patch Scheduling & Approval
          </h2>
          <p className="text-muted-foreground">
            {patches.length > 0 ? 'Manage and approve patches for deployment' : 'No patches tracked yet'}
          </p>
        </div>
        <Button variant="outline" onClick={fetchPatches}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{patches.length}</p>
            <p className="text-xs text-muted-foreground">Total Patches</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{pendingPatches.length}</p>
            <p className="text-xs text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card className="bg-cyan-500/5 border-cyan-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{approvedPatches.length}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-400">{completedPatches.length}</p>
            <p className="text-xs text-muted-foreground">Installed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingPatches.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedPatches.length})</TabsTrigger>
          <TabsTrigger value="all">All Patches ({patches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {selectedPatches.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-cyan-500/10 rounded-lg">
              <span className="text-sm">{selectedPatches.length} selected</span>
              <Button size="sm" onClick={handleBulkApprove}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve Selected
              </Button>
            </div>
          )}
          <Card>
            {pendingPatches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Patch</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPatches.map(patch => (
                    <TableRow key={patch.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPatches.includes(patch.id)}
                          onCheckedChange={(checked) => {
                            setSelectedPatches(prev =>
                              checked ? [...prev, patch.id] : prev.filter(id => id !== patch.id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{patch.patch_name || patch.kb_article_id || 'Unnamed patch'}</p>
                        {patch.description && <p className="text-xs text-muted-foreground">{patch.description}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(patch.severity)}>{patch.severity}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(patch.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => handleApprove(patch.id)}>Approve</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No patches pending approval
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            {approvedPatches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patch</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedPatches.map(patch => (
                    <TableRow key={patch.id}>
                      <TableCell className="font-medium">{patch.patch_name || patch.kb_article_id || 'Unnamed'}</TableCell>
                      <TableCell><Badge className={getSeverityColor(patch.severity)}>{patch.severity}</Badge></TableCell>
                      <TableCell><Badge className="bg-cyan-500/10 text-cyan-400">approved</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(patch.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No approved patches awaiting deployment
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            {patches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patch</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patches.slice(0, 50).map(patch => (
                    <TableRow key={patch.id}>
                      <TableCell className="font-medium">{patch.patch_name || patch.kb_article_id || 'Unnamed'}</TableCell>
                      <TableCell><Badge className={getSeverityColor(patch.severity)}>{patch.severity}</Badge></TableCell>
                      <TableCell>
                        <Badge className={
                          patch.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          patch.status === 'approved' ? 'bg-cyan-500/10 text-cyan-400' :
                          patch.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }>{patch.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(patch.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CardContent>
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No patch data available yet
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
