import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RotateCcw, AlertTriangle, CheckCircle, Clock, Server,
  HardDrive, Save, Trash2, Play, Shield, Loader2, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function PatchRollbackSupport() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [patches, setPatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRestoreEnabled, setAutoRestoreEnabled] = useState(true);

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

  const completedPatches = useMemo(() => patches.filter(p => p.status === 'completed'), [patches]);
  const failedPatches = useMemo(() => patches.filter(p => p.status === 'failed'), [patches]);

  const handleRollback = async (patchId: string) => {
    const { error } = await supabase
      .from('patch_management')
      .update({ status: 'rolled_back' })
      .eq('id', patchId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to initiate rollback', variant: 'destructive' });
    } else {
      toast({ title: 'Rollback initiated', description: 'Patch rollback has been queued' });
      fetchPatches();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'rolled_back': return 'bg-purple-500/20 text-purple-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
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
            <RotateCcw className="h-6 w-6" />
            Patch Rollback Support
          </h2>
          <p className="text-muted-foreground">
            {patches.length > 0 ? 'Roll back installed patches when issues are detected' : 'No patch history available'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto-Restore Points</span>
            <Switch checked={autoRestoreEnabled} onCheckedChange={setAutoRestoreEnabled} />
          </div>
          <Button variant="outline" onClick={fetchPatches}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-400">{completedPatches.length}</p>
            <p className="text-xs text-muted-foreground">Installed Patches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-400">{failedPatches.length}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {patches.filter(p => p.status === 'rolled_back').length}
            </p>
            <p className="text-xs text-muted-foreground">Rolled Back</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{patches.length}</p>
            <p className="text-xs text-muted-foreground">Total Patches</p>
          </CardContent>
        </Card>
      </div>

      {/* Rollbackable Patches */}
      <Card>
        <CardHeader>
          <CardTitle>Installed Patches (Available for Rollback)</CardTitle>
        </CardHeader>
        <CardContent>
          {completedPatches.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patch</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Installed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPatches.map(patch => (
                    <TableRow key={patch.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{patch.patch_name || patch.kb_article_id || 'Unnamed'}</p>
                          {patch.description && <p className="text-xs text-muted-foreground">{patch.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          patch.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          patch.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }>{patch.severity}</Badge>
                      </TableCell>
                      <TableCell><Badge className={getStatusColor(patch.status)}>{patch.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(patch.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleRollback(patch.id)}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Rollback
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No installed patches available for rollback
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
