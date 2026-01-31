import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, Plus, Pencil, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import { useVanguardAtlas, AtlasConfiguration } from '@/hooks/useVanguardAtlas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ConfigFormData {
  name: string;
  configuration_type: string;
  configuration_data: string;
  notes: string;
  is_active: boolean;
}

const CONFIG_TYPES = ['Server', 'Network', 'Firewall', 'Application', 'Database', 'Cloud', 'Backup', 'Other'];

const initialFormData: ConfigFormData = {
  name: '',
  configuration_type: 'Server',
  configuration_data: '{}',
  notes: '',
  is_active: true,
};

export function AtlasConfigurations({ organizationId }: { organizationId?: string }) {
  const { configurations, createConfiguration, updateConfiguration, deleteConfiguration, isLoading } = useVanguardAtlas(organizationId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingCfg, setEditingCfg] = useState<AtlasConfiguration | null>(null);
  const [viewingCfg, setViewingCfg] = useState<AtlasConfiguration | null>(null);
  const [deletingCfg, setDeletingCfg] = useState<AtlasConfiguration | null>(null);
  const [formData, setFormData] = useState<ConfigFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    setEditingCfg(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleView = (cfg: AtlasConfiguration) => {
    setViewingCfg(cfg);
    setViewDialogOpen(true);
  };

  const handleEdit = (cfg: AtlasConfiguration, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCfg(cfg);
    setFormData({
      name: cfg.name,
      configuration_type: cfg.configuration_type,
      configuration_data: JSON.stringify(cfg.configuration_data, null, 2),
      notes: cfg.notes || '',
      is_active: cfg.is_active,
    });
    setDialogOpen(true);
    setViewDialogOpen(false);
  };

  const handleDeleteClick = (cfg: AtlasConfiguration, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingCfg(cfg);
    setDeleteDialogOpen(true);
    setViewDialogOpen(false);
  };

  const handleCopyConfig = (cfg: AtlasConfiguration, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(cfg.configuration_data, null, 2));
    toast.success('Configuration copied to clipboard');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    let configData: Record<string, any>;
    try {
      configData = JSON.parse(formData.configuration_data);
    } catch {
      toast.error('Invalid JSON in configuration data');
      return;
    }
    
    setSaving(true);
    try {
      const data = {
        name: formData.name,
        configuration_type: formData.configuration_type,
        configuration_data: configData,
        notes: formData.notes,
        is_active: formData.is_active,
      };
      
      if (editingCfg) {
        await updateConfiguration(editingCfg.id, data);
      } else {
        await createConfiguration({ ...data, organization_id: organizationId });
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCfg) return;
    
    await deleteConfiguration(deletingCfg.id);
    setDeleteDialogOpen(false);
    setDeletingCfg(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Configurations</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />Add Configuration
        </Button>
      </div>
      
      <div className="grid gap-2">
        {configurations.map((cfg) => (
          <Card 
            key={cfg.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => handleView(cfg)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Server className="h-5 w-5 text-cyan-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{cfg.name}</p>
                  <span className="text-xs px-2 py-0.5 bg-accent rounded">{cfg.configuration_type}</span>
                  {cfg.is_active ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated: {new Date(cfg.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => handleCopyConfig(cfg, e)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => handleEdit(cfg, e)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => handleDeleteClick(cfg, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {configurations.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No configurations yet.</p>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingCfg?.name}
              {viewingCfg?.is_active ? (
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Active</span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">Inactive</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-2 text-sm text-muted-foreground mb-4">
              <span className="px-2 py-1 bg-accent rounded">{viewingCfg?.configuration_type}</span>
              <span>Updated: {viewingCfg && new Date(viewingCfg.updated_at).toLocaleDateString()}</span>
            </div>
            {viewingCfg?.notes && (
              <p className="text-sm text-muted-foreground mb-4">{viewingCfg.notes}</p>
            )}
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {JSON.stringify(viewingCfg?.configuration_data, null, 2)}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDeleteClick(viewingCfg!)}>
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
            <Button onClick={() => handleEdit(viewingCfg!)}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCfg ? 'Edit Configuration' : 'New Configuration'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Firewall Config"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="config_type">Type</Label>
                <Select 
                  value={formData.configuration_type} 
                  onValueChange={(v) => setFormData({ ...formData, configuration_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIG_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_data">Configuration Data (JSON)</Label>
              <Textarea
                id="config_data"
                value={formData.configuration_data}
                onChange={(e) => setFormData({ ...formData, configuration_data: e.target.value })}
                placeholder='{"key": "value"}'
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? 'Saving...' : editingCfg ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCfg?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
