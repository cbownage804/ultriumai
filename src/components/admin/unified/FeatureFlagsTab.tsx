import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ToggleLeft, Plus, RefreshCw, AlertTriangle } from 'lucide-react';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  applies_to: string;
  created_at: string;
  updated_at: string;
}

export const FeatureFlagsTab = () => {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ flag_key: '', flag_name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadFlags(); }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_name');

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error loading flags:', error);
      toast({ title: "Error", description: "Failed to load feature flags", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    const newState = !flag.is_enabled;
    // Optimistic update
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, is_enabled: newState } : f));

    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: newState, updated_at: new Date().toISOString() })
        .eq('id', flag.id);

      if (error) throw error;

      toast({
        title: `${flag.flag_name} ${newState ? 'enabled' : 'disabled'}`,
        description: flag.flag_key === 'maintenance_mode' && newState
          ? '⚠️ Maintenance mode is now ON — users will see a maintenance page.'
          : undefined,
        variant: flag.flag_key === 'maintenance_mode' && newState ? 'destructive' : 'default',
      });
    } catch (error) {
      // Revert
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, is_enabled: flag.is_enabled } : f));
      toast({ title: "Error", description: "Failed to toggle flag", variant: "destructive" });
    }
  };

  const handleAddFlag = async () => {
    if (!newFlag.flag_key.trim() || !newFlag.flag_name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('feature_flags')
        .insert({
          flag_key: newFlag.flag_key.toLowerCase().replace(/\s+/g, '_'),
          flag_name: newFlag.flag_name,
          description: newFlag.description || null,
          is_enabled: true,
        });

      if (error) throw error;
      toast({ title: "Flag created", description: `${newFlag.flag_name} is now available` });
      setAddDialogOpen(false);
      setNewFlag({ flag_key: '', flag_name: '', description: '' });
      loadFlags();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create flag", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFlag = async (flag: FeatureFlag) => {
    try {
      const { error } = await supabase.from('feature_flags').delete().eq('id', flag.id);
      if (error) throw error;
      toast({ title: "Flag deleted" });
      loadFlags();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const enabledCount = flags.filter(f => f.is_enabled).length;
  const maintenanceFlag = flags.find(f => f.flag_key === 'maintenance_mode');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ToggleLeft className="h-6 w-6 text-primary" />
            Feature Flags
          </h2>
          <p className="text-muted-foreground">Toggle features and enable maintenance mode sitewide</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadFlags}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Flag
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Warning */}
      {maintenanceFlag?.is_enabled && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Maintenance Mode is ACTIVE</p>
              <p className="text-sm text-muted-foreground">Users may be unable to access the platform.</p>
            </div>
            <Button size="sm" variant="destructive" className="ml-auto" onClick={() => toggleFlag(maintenanceFlag)}>
              Disable
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Flags</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{flags.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-500">Enabled</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-500">{enabledCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-500">Disabled</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{flags.length - enabledCount}</div></CardContent>
        </Card>
      </div>

      {/* Flags Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Feature Flags</CardTitle>
          <CardDescription>Toggle features on and off across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map(flag => (
                  <TableRow key={flag.id} className={flag.flag_key === 'maintenance_mode' && flag.is_enabled ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">{flag.flag_name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{flag.flag_key}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {flag.description || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch checked={flag.is_enabled} onCheckedChange={() => toggleFlag(flag)} />
                        <Badge variant={flag.is_enabled ? "default" : "secondary"} className={flag.is_enabled ? 'bg-emerald-500/20 text-emerald-400 border-0' : ''}>
                          {flag.is_enabled ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteFlag(flag)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Flag Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feature Flag</DialogTitle>
            <DialogDescription>Create a new feature flag to control platform features</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input placeholder="My Feature" value={newFlag.flag_name} onChange={(e) => setNewFlag(p => ({ ...p, flag_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Key</label>
              <Input placeholder="my_feature" value={newFlag.flag_key} onChange={(e) => setNewFlag(p => ({ ...p, flag_key: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="What does this flag control?" value={newFlag.description} onChange={(e) => setNewFlag(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFlag} disabled={saving || !newFlag.flag_key.trim()}>
              {saving ? 'Creating...' : 'Create Flag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
