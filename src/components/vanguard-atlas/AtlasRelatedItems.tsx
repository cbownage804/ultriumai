import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Link2, Plus, Trash2, FileText, Key, Server, Shield, BookOpen, Users, Box, ListChecks } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface RelatedItem {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship_type: string;
  notes?: string;
  created_at: string;
  // resolved names
  source_name?: string;
  target_name?: string;
}

const RESOURCE_TYPES = ['document', 'password', 'configuration', 'ssl_certificate', 'runbook', 'contact', 'flexible_asset', 'checklist'];
const RELATIONSHIP_TYPES = ['related', 'depends_on', 'used_by', 'documents', 'secures', 'connects_to'];

const RESOURCE_ICONS: Record<string, any> = {
  document: FileText, password: Key, configuration: Server, ssl_certificate: Shield,
  runbook: BookOpen, contact: Users, flexible_asset: Box, checklist: ListChecks,
};

export function AtlasRelatedItems({ organizationId }: { organizationId?: string }) {
  const { user } = useAuth();
  const [relations, setRelations] = useState<RelatedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sourceType, setSourceType] = useState('document');
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [targetType, setTargetType] = useState('password');
  const [targetSearch, setTargetSearch] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState('related');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [sourceResults, setSourceResults] = useState<{ id: string; name: string }[]>([]);
  const [targetResults, setTargetResults] = useState<{ id: string; name: string }[]>([]);

  const fetch_ = useCallback(async () => {
    if (!user) return;
    const { data, error } = await (supabase as any).from('atlas_related_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!error) setRelations(data || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const getTableName = (type: string) => {
    const map: Record<string, string> = {
      document: 'atlas_documents', password: 'atlas_passwords', configuration: 'atlas_configurations',
      ssl_certificate: 'atlas_ssl_certificates', runbook: 'atlas_runbooks', contact: 'atlas_contacts',
      flexible_asset: 'atlas_flexible_assets', checklist: 'atlas_checklists',
    };
    return map[type];
  };

  const getNameField = (type: string) => {
    if (type === 'document' || type === 'runbook') return 'title';
    if (type === 'ssl_certificate') return 'domain';
    if (type === 'contact') return 'first_name';
    return 'name';
  };

  const searchItems = async (type: string, query: string, setter: (items: { id: string; name: string }[]) => void) => {
    if (!user || query.length < 2) { setter([]); return; }
    const table = getTableName(type);
    const nameField = getNameField(type);
    const { data } = await (supabase as any).from(table).select(`id, ${nameField}`).eq('user_id', user.id).ilike(nameField, `%${query}%`).limit(10);
    setter((data || []).map((d: any) => ({ id: d.id, name: d[nameField] })));
  };

  useEffect(() => { searchItems(sourceType, sourceSearch, setSourceResults); }, [sourceType, sourceSearch]);
  useEffect(() => { searchItems(targetType, targetSearch, setTargetResults); }, [targetType, targetSearch]);

  const handleSave = async () => {
    if (!sourceId || !targetId || !user) return;
    setSaving(true);
    try {
      await (supabase as any).from('atlas_related_items').insert({
        user_id: user.id, source_type: sourceType, source_id: sourceId,
        target_type: targetType, target_id: targetId, relationship_type: relType, notes: notes || null,
      });
      toast.success('Relationship created');
      setDialogOpen(false); fetch_();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from('atlas_related_items').delete().eq('id', id);
    toast.success('Relationship removed');
    fetch_();
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Related Items</h2>
        <Button onClick={() => { setSourceId(''); setTargetId(''); setNotes(''); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Link Items</Button>
      </div>

      <div className="grid gap-2">
        {relations.map(r => {
          const SIcon = RESOURCE_ICONS[r.source_type] || Link2;
          const TIcon = RESOURCE_ICONS[r.target_type] || Link2;
          return (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <SIcon className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm capitalize">{r.source_type.replace('_', ' ')}</span>
                  <Badge variant="outline" className="text-[10px]">{r.relationship_type}</Badge>
                  <TIcon className="h-4 w-4 text-purple-400" />
                  <span className="text-sm capitalize">{r.target_type.replace('_', ' ')}</span>
                </div>
                {r.notes && <span className="text-xs text-muted-foreground">{r.notes}</span>}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardContent>
            </Card>
          );
        })}
        {relations.length === 0 && <p className="text-muted-foreground text-center py-8">No relationships created yet. Link documents to passwords, configs to contacts, etc.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Link Related Items</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select value={sourceType} onValueChange={(v) => { setSourceType(v); setSourceId(''); setSourceSearch(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder={`Search ${sourceType}s...`} value={sourceSearch} onChange={(e) => setSourceSearch(e.target.value)} />
              {sourceResults.length > 0 && (
                <div className="border rounded max-h-32 overflow-y-auto">
                  {sourceResults.map(r => (
                    <button key={r.id} className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${sourceId === r.id ? 'bg-accent' : ''}`} onClick={() => setSourceId(r.id)}>{r.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={relType} onValueChange={setRelType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RELATIONSHIP_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Type</Label>
              <Select value={targetType} onValueChange={(v) => { setTargetType(v); setTargetId(''); setTargetSearch(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder={`Search ${targetType}s...`} value={targetSearch} onChange={(e) => setTargetSearch(e.target.value)} />
              {targetResults.length > 0 && (
                <div className="border rounded max-h-32 overflow-y-auto">
                  {targetResults.map(r => (
                    <button key={r.id} className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${targetId === r.id ? 'bg-accent' : ''}`} onClick={() => setTargetId(r.id)}>{r.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2"><Label>Notes (optional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !sourceId || !targetId}>{saving ? 'Saving...' : 'Link'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
