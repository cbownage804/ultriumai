import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ListChecks, Plus, Pencil, Trash2, CheckCircle, Circle, Copy } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';

interface ChecklistItem {
  text: string;
  completed: boolean;
  completed_at?: string;
}

interface Checklist {
  id: string;
  name: string;
  description?: string;
  checklist_type: string;
  items: ChecklistItem[];
  is_template: boolean;
  status: string;
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

const CHECKLIST_TYPES = ['Onboarding', 'Offboarding', 'Server Setup', 'Workstation Setup', 'Security Audit', 'Compliance', 'Maintenance', 'General'];

export function AtlasChecklists({ organizationId }: { organizationId?: string }) {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Checklist | null>(null);
  const [deleting, setDeleting] = useState<Checklist | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [checklistType, setChecklistType] = useState('General');
  const [isTemplate, setIsTemplate] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([{ text: '', completed: false }]);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'templates'>('active');

  const fetch_ = useCallback(async () => {
    if (!user) return;
    let q = (supabase as any).from('atlas_checklists').select('*').eq('user_id', user.id);
    if (organizationId) q = q.eq('organization_id', organizationId);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (!error) setChecklists(data || []);
    setIsLoading(false);
  }, [user, organizationId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleCreate = () => {
    setEditing(null); setName(''); setDescription(''); setChecklistType('General');
    setIsTemplate(false); setItems([{ text: '', completed: false }]);
    setDialogOpen(true);
  };

  const handleUseTemplate = async (template: Checklist) => {
    if (!user) return;
    const newItems = template.items.map(i => ({ ...i, completed: false, completed_at: undefined }));
    await (supabase as any).from('atlas_checklists').insert({
      user_id: user.id, organization_id: organizationId || null,
      name: template.name, description: template.description,
      checklist_type: template.checklist_type, items: newItems,
      is_template: false, status: 'not_started', completion_percentage: 0,
    });
    toast.success('Checklist created from template');
    fetch_();
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    const validItems = items.filter(i => i.text.trim());
    const completedCount = validItems.filter(i => i.completed).length;
    const pct = validItems.length > 0 ? Math.round((completedCount / validItems.length) * 100) : 0;
    const data = {
      name, description, checklist_type: checklistType, items: validItems,
      is_template: isTemplate, completion_percentage: pct,
      status: pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'not_started',
    };
    try {
      if (editing) {
        await (supabase as any).from('atlas_checklists').update(data).eq('id', editing.id);
        toast.success('Checklist updated');
      } else {
        await (supabase as any).from('atlas_checklists').insert({ ...data, user_id: user.id, organization_id: organizationId || null });
        toast.success('Checklist created');
      }
      setDialogOpen(false); fetch_();
    } finally { setSaving(false); }
  };

  const toggleItem = async (checklist: Checklist, idx: number) => {
    const newItems = checklist.items.map((item: ChecklistItem, i: number) =>
      i === idx ? { ...item, completed: !item.completed, completed_at: !item.completed ? new Date().toISOString() : undefined } : item
    );
    const completedCount = newItems.filter((i: ChecklistItem) => i.completed).length;
    const pct = newItems.length > 0 ? Math.round((completedCount / newItems.length) * 100) : 0;
    await (supabase as any).from('atlas_checklists').update({
      items: newItems, completion_percentage: pct,
      status: pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'not_started',
      ...(pct === 100 ? { completed_at: new Date().toISOString() } : { completed_at: null }),
    }).eq('id', checklist.id);
    fetch_();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await (supabase as any).from('atlas_checklists').delete().eq('id', deleting.id);
    toast.success('Checklist deleted');
    setDeleteDialogOpen(false); setDeleting(null); fetch_();
  };

  const filtered = checklists.filter(c => viewMode === 'templates' ? c.is_template : !c.is_template);

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Checklists</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/50 rounded-md p-0.5">
            <Button variant={viewMode === 'active' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('active')}>Active</Button>
            <Button variant={viewMode === 'templates' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('templates')}>Templates</Button>
          </div>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />New Checklist</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map(cl => (
          <Card key={cl.id} className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-emerald-400" />
                  <p className="font-medium">{cl.name}</p>
                  <span className="text-xs px-2 py-0.5 bg-accent rounded">{cl.checklist_type}</span>
                  {cl.is_template && <Badge variant="outline" className="text-xs">Template</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  {cl.is_template && (
                    <Button variant="ghost" size="sm" onClick={() => handleUseTemplate(cl)}><Copy className="h-3.5 w-3.5 mr-1" />Use</Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setEditing(cl); setName(cl.name); setDescription(cl.description || '');
                    setChecklistType(cl.checklist_type); setIsTemplate(cl.is_template);
                    setItems(cl.items.length > 0 ? cl.items : [{ text: '', completed: false }]);
                    setDialogOpen(true);
                  }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeleting(cl); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              {!cl.is_template && (
                <>
                  <Progress value={cl.completion_percentage} className="h-2" />
                  <div className="space-y-1">
                    {cl.items.map((item: ChecklistItem, i: number) => (
                      <button key={i} className="flex items-center gap-2 w-full text-sm text-left hover:bg-accent/30 rounded px-1 py-0.5" onClick={() => toggleItem(cl, i)}>
                        {item.completed ? <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">{viewMode === 'templates' ? 'No templates yet.' : 'No active checklists.'}</p>}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Checklist' : 'New Checklist'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={checklistType} onValueChange={setChecklistType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CHECKLIST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
            <div className="flex items-center justify-between"><Label>Save as Template</Label><Switch checked={isTemplate} onCheckedChange={setIsTemplate} /></div>
            <div className="space-y-2">
              <div className="flex justify-between"><Label>Items</Label><Button variant="outline" size="sm" onClick={() => setItems([...items, { text: '', completed: false }])}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input className="flex-1" value={item.text} onChange={(e) => { const n = [...items]; n[i] = { ...item, text: e.target.value }; setItems(n); }} placeholder={`Step ${i + 1}`} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Checklist</AlertDialogTitle>
            <AlertDialogDescription>Delete "{deleting?.name}"? This cannot be undone.</AlertDialogDescription>
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
