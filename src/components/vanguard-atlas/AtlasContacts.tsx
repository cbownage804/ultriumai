import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Users, Plus, Pencil, Trash2, Mail, Phone, Star } from 'lucide-react';
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

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  department?: string;
  notes?: string;
  is_primary: boolean;
  contact_type: string;
  created_at: string;
  updated_at: string;
}

const CONTACT_TYPES = ['Employee', 'Vendor', 'Contractor', 'Executive', 'IT Contact', 'Billing', 'Other'];

const initialForm = {
  first_name: '', last_name: '', title: '', email: '', phone: '', mobile: '',
  department: '', notes: '', is_primary: false, contact_type: 'Employee',
};

export function AtlasContacts({ organizationId }: { organizationId?: string }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!user) return;
    let q = (supabase as any).from('atlas_contacts').select('*').eq('user_id', user.id);
    if (organizationId) q = q.eq('organization_id', organizationId);
    const { data, error } = await q.order('last_name');
    if (!error) setContacts(data || []);
    setIsLoading(false);
  }, [user, organizationId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleCreate = () => { setEditing(null); setForm(initialForm); setDialogOpen(true); };

  const handleEdit = (c: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(c);
    setForm({
      first_name: c.first_name, last_name: c.last_name, title: c.title || '',
      email: c.email || '', phone: c.phone || '', mobile: c.mobile || '',
      department: c.department || '', notes: c.notes || '', is_primary: c.is_primary,
      contact_type: c.contact_type,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !user) return;
    setSaving(true);
    try {
      if (editing) {
        await (supabase as any).from('atlas_contacts').update(form).eq('id', editing.id);
        toast.success('Contact updated');
      } else {
        await (supabase as any).from('atlas_contacts').insert({ ...form, user_id: user.id, organization_id: organizationId || null }).select().single();
        toast.success('Contact created');
      }
      setDialogOpen(false);
      fetch_();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await (supabase as any).from('atlas_contacts').delete().eq('id', deleting.id);
    toast.success('Contact deleted');
    setDeleteDialogOpen(false);
    setDeleting(null);
    fetch_();
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />Add Contact</Button>
      </div>

      <div className="grid gap-2">
        {contacts.map((c) => (
          <Card key={c.id} className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{c.first_name} {c.last_name}</p>
                  {c.is_primary && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                  <span className="text-xs px-2 py-0.5 bg-accent rounded">{c.contact_type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {c.title && <span>{c.title}</span>}
                  {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                  {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(c, e)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting(c); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {contacts.length === 0 && <p className="text-muted-foreground text-center py-8">No contacts yet.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Contact' : 'New Contact'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name *</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Last Name *</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., IT Manager" /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.contact_type} onValueChange={(v) => setForm({ ...form, contact_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="flex items-center justify-between">
              <Label>Primary Contact</Label>
              <Switch checked={form.is_primary} onCheckedChange={(c) => setForm({ ...form, is_primary: c })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.first_name.trim() || !form.last_name.trim()}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>Delete "{deleting?.first_name} {deleting?.last_name}"? This cannot be undone.</AlertDialogDescription>
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
