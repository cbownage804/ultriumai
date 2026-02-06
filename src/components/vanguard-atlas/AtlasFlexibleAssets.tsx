import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Box, Plus, Pencil, Trash2, Settings2, Tag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';

interface FlexibleAssetType {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  fields: { name: string; type: string; required?: boolean }[];
  is_active: boolean;
}

interface FlexibleAsset {
  id: string;
  asset_type_id: string;
  name: string;
  field_values: Record<string, any>;
  tags: string[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

const FIELD_TYPES = ['Text', 'Number', 'URL', 'Email', 'Date', 'TextArea', 'Checkbox', 'Select', 'Password', 'Tag'];

const PRESET_TYPES = [
  { name: 'Wi-Fi Network', fields: [{ name: 'SSID', type: 'Text', required: true }, { name: 'Password', type: 'Password' }, { name: 'Encryption', type: 'Select' }, { name: 'VLAN', type: 'Text' }] },
  { name: 'ISP Information', fields: [{ name: 'Provider', type: 'Text', required: true }, { name: 'Account #', type: 'Text' }, { name: 'Circuit ID', type: 'Text' }, { name: 'Bandwidth', type: 'Text' }, { name: 'Gateway IP', type: 'Text' }, { name: 'Support Phone', type: 'Text' }] },
  { name: 'Active Directory', fields: [{ name: 'Domain Name', type: 'Text', required: true }, { name: 'DC Hostname', type: 'Text' }, { name: 'DC IP', type: 'Text' }, { name: 'Functional Level', type: 'Text' }, { name: 'FSMO Roles', type: 'TextArea' }] },
  { name: 'Email/M365 Config', fields: [{ name: 'Tenant Name', type: 'Text', required: true }, { name: 'Tenant ID', type: 'Text' }, { name: 'Admin Portal', type: 'URL' }, { name: 'License Type', type: 'Text' }, { name: 'MX Record', type: 'Text' }] },
  { name: 'Network Device', fields: [{ name: 'Hostname', type: 'Text', required: true }, { name: 'IP Address', type: 'Text' }, { name: 'MAC Address', type: 'Text' }, { name: 'Model', type: 'Text' }, { name: 'Firmware', type: 'Text' }, { name: 'Management URL', type: 'URL' }] },
];

export function AtlasFlexibleAssets({ organizationId }: { organizationId?: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assets');
  const [assetTypes, setAssetTypes] = useState<FlexibleAssetType[]>([]);
  const [assets, setAssets] = useState<FlexibleAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Type dialog
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<FlexibleAssetType | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [typeFields, setTypeFields] = useState<{ name: string; type: string; required?: boolean }[]>([]);
  const [savingType, setSavingType] = useState(false);

  // Asset dialog
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FlexibleAsset | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetValues, setAssetValues] = useState<Record<string, any>>({});
  const [assetTypeForCreate, setAssetTypeForCreate] = useState<string>('');
  const [savingAsset, setSavingAsset] = useState(false);

  // Delete
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'asset' | 'type'; id: string; name: string } | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [typesRes, assetsRes] = await Promise.all([
      (supabase as any).from('atlas_flexible_asset_types').select('*').eq('user_id', user.id).order('name'),
      (() => {
        let q = (supabase as any).from('atlas_flexible_assets').select('*').eq('user_id', user.id);
        if (organizationId) q = q.eq('organization_id', organizationId);
        return q.order('name');
      })(),
    ]);
    if (!typesRes.error) setAssetTypes(typesRes.data || []);
    if (!assetsRes.error) setAssets(assetsRes.data || []);
    setIsLoading(false);
  }, [user, organizationId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateType = (preset?: typeof PRESET_TYPES[0]) => {
    setEditingType(null);
    setTypeName(preset?.name || '');
    setTypeDesc('');
    setTypeFields(preset?.fields || [{ name: '', type: 'Text' }]);
    setTypeDialogOpen(true);
  };

  const handleEditType = (t: FlexibleAssetType) => {
    setEditingType(t);
    setTypeName(t.name);
    setTypeDesc(t.description || '');
    setTypeFields(t.fields);
    setTypeDialogOpen(true);
  };

  const handleSaveType = async () => {
    if (!typeName.trim() || !user) return;
    setSavingType(true);
    const data = { name: typeName, description: typeDesc, fields: typeFields.filter(f => f.name.trim()) };
    try {
      if (editingType) {
        await (supabase as any).from('atlas_flexible_asset_types').update(data).eq('id', editingType.id);
        toast.success('Asset type updated');
      } else {
        await (supabase as any).from('atlas_flexible_asset_types').insert({ ...data, user_id: user.id });
        toast.success('Asset type created');
      }
      setTypeDialogOpen(false);
      fetchAll();
    } finally { setSavingType(false); }
  };

  const handleCreateAsset = (typeId: string) => {
    setEditingAsset(null);
    setAssetTypeForCreate(typeId);
    setAssetName('');
    setAssetValues({});
    setAssetDialogOpen(true);
  };

  const handleEditAsset = (a: FlexibleAsset) => {
    setEditingAsset(a);
    setAssetTypeForCreate(a.asset_type_id);
    setAssetName(a.name);
    setAssetValues(a.field_values);
    setAssetDialogOpen(true);
  };

  const handleSaveAsset = async () => {
    if (!assetName.trim() || !user || !assetTypeForCreate) return;
    setSavingAsset(true);
    const data = { name: assetName, field_values: assetValues, asset_type_id: assetTypeForCreate };
    try {
      if (editingAsset) {
        await (supabase as any).from('atlas_flexible_assets').update(data).eq('id', editingAsset.id);
        toast.success('Asset updated');
      } else {
        await (supabase as any).from('atlas_flexible_assets').insert({ ...data, user_id: user.id, organization_id: organizationId || null });
        toast.success('Asset created');
      }
      setAssetDialogOpen(false);
      fetchAll();
    } finally { setSavingAsset(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const table = deleteDialog.type === 'type' ? 'atlas_flexible_asset_types' : 'atlas_flexible_assets';
    await (supabase as any).from(table).delete().eq('id', deleteDialog.id);
    toast.success(`${deleteDialog.type === 'type' ? 'Asset type' : 'Asset'} deleted`);
    setDeleteDialog(null);
    fetchAll();
  };

  const currentType = assetTypes.find(t => t.id === (selectedType || assetTypeForCreate));
  const filteredAssets = selectedType ? assets.filter(a => a.asset_type_id === selectedType) : assets;

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Flexible Assets</h2>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="types"><Settings2 className="h-3.5 w-3.5 mr-1" />Asset Types</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="assets" className="space-y-4">
          {/* Type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant={!selectedType ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(null)}>All</Button>
            {assetTypes.map(t => (
              <Button key={t.id} variant={selectedType === t.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(t.id)}>
                {t.name} <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{assets.filter(a => a.asset_type_id === t.id).length}</Badge>
              </Button>
            ))}
          </div>

          {selectedType && (
            <Button onClick={() => handleCreateAsset(selectedType)}><Plus className="h-4 w-4 mr-2" />Add {currentType?.name || 'Asset'}</Button>
          )}

          <div className="grid gap-2">
            {filteredAssets.map(a => {
              const type = assetTypes.find(t => t.id === a.asset_type_id);
              return (
                <Card key={a.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleEditAsset(a)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Box className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{a.name}</p>
                        {type && <span className="text-xs px-2 py-0.5 bg-accent rounded">{type.name}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Updated: {new Date(a.updated_at).toLocaleDateString()}
                        {a.tags?.length > 0 && ` • ${a.tags.join(', ')}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditAsset(a); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ type: 'asset', id: a.id, name: a.name }); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredAssets.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <p className="text-muted-foreground">{assetTypes.length === 0 ? 'Create an asset type first to start adding flexible assets.' : 'No flexible assets yet. Select a type and add one.'}</p>
                {assetTypes.length === 0 && <Button variant="outline" onClick={() => setActiveTab('types')}>Manage Asset Types</Button>}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Define custom asset schemas with user-defined fields</p>
            <Button onClick={() => handleCreateType()}><Plus className="h-4 w-4 mr-2" />New Type</Button>
          </div>

          {/* Preset templates */}
          {assetTypes.length === 0 && (
            <Card className="border-dashed border-cyan-500/30">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium text-cyan-400">Quick Start Templates</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TYPES.map(p => (
                    <Button key={p.name} variant="outline" size="sm" onClick={() => handleCreateType(p)}>{p.name}</Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-2">
            {assetTypes.map(t => (
              <Card key={t.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.fields.length} fields • {assets.filter(a => a.asset_type_id === t.id).length} assets</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditType(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ type: 'type', id: t.id, name: t.name })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Type Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingType ? 'Edit Asset Type' : 'New Asset Type'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="e.g., Wi-Fi Network" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={typeDesc} onChange={(e) => setTypeDesc(e.target.value)} rows={2} /></div>
            <div className="space-y-2">
              <div className="flex justify-between items-center"><Label>Fields</Label><Button variant="outline" size="sm" onClick={() => setTypeFields([...typeFields, { name: '', type: 'Text' }])}><Plus className="h-3 w-3 mr-1" />Add Field</Button></div>
              {typeFields.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input className="flex-1" value={f.name} onChange={(e) => { const n = [...typeFields]; n[i] = { ...f, name: e.target.value }; setTypeFields(n); }} placeholder="Field name" />
                  <Select value={f.type} onValueChange={(v) => { const n = [...typeFields]; n[i] = { ...f, type: v }; setTypeFields(n); }}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setTypeFields(typeFields.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveType} disabled={savingType || !typeName.trim()}>{savingType ? 'Saving...' : editingType ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Dialog */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAsset ? 'Edit Asset' : `New ${assetTypes.find(t => t.id === assetTypeForCreate)?.name || 'Asset'}`}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={assetName} onChange={(e) => setAssetName(e.target.value)} /></div>
            {assetTypes.find(t => t.id === assetTypeForCreate)?.fields.map(f => (
              <div key={f.name} className="space-y-2">
                <Label>{f.name}{f.required && ' *'}</Label>
                {f.type === 'TextArea' ? (
                  <Textarea value={assetValues[f.name] || ''} onChange={(e) => setAssetValues({ ...assetValues, [f.name]: e.target.value })} rows={3} />
                ) : f.type === 'Checkbox' ? (
                  <div className="flex items-center"><input type="checkbox" checked={!!assetValues[f.name]} onChange={(e) => setAssetValues({ ...assetValues, [f.name]: e.target.checked })} className="mr-2" /></div>
                ) : (
                  <Input
                    type={f.type === 'Number' ? 'number' : f.type === 'Date' ? 'date' : f.type === 'Email' ? 'email' : f.type === 'URL' ? 'url' : f.type === 'Password' ? 'password' : 'text'}
                    value={assetValues[f.name] || ''}
                    onChange={(e) => setAssetValues({ ...assetValues, [f.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAsset} disabled={savingAsset || !assetName.trim()}>{savingAsset ? 'Saving...' : editingAsset ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {deleteDialog?.type === 'type' ? 'Asset Type' : 'Asset'}</AlertDialogTitle>
            <AlertDialogDescription>Delete "{deleteDialog?.name}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
