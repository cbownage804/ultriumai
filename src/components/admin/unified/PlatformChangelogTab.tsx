import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  entry_type: string;
  published: boolean;
  published_at: string;
  created_by: string | null;
}

const typeColors: Record<string, string> = {
  feature: 'bg-green-500/20 text-green-500',
  fix: 'bg-blue-500/20 text-blue-500',
  improvement: 'bg-purple-500/20 text-purple-500',
  breaking: 'bg-destructive/20 text-destructive',
};

const PlatformChangelogTab = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ChangelogEntry>>({ entry_type: 'feature', published: true });

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('platform_changelog')
      .select('*')
      .order('published_at', { ascending: false });
    setEntries((data as ChangelogEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const save = async () => {
    if (!form.version || !form.title || !form.description) { toast.error('All fields required'); return; }
    setSaving(true);

    if (form.id) {
      const { error } = await supabase.from('platform_changelog').update({
        version: form.version,
        title: form.title,
        description: form.description,
        entry_type: form.entry_type,
        published: form.published,
      }).eq('id', form.id);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('platform_changelog').insert({
        version: form.version,
        title: form.title,
        description: form.description,
        entry_type: form.entry_type || 'feature',
        published: form.published ?? true,
        created_by: user?.id,
      });
      if (error) { toast.error('Failed to create'); setSaving(false); return; }
    }

    setForm({ entry_type: 'feature', published: true });
    setEditing(false);
    setSaving(false);
    toast.success('Changelog saved');
    fetchEntries();
  };

  const remove = async (id: string) => {
    await supabase.from('platform_changelog').delete().eq('id', id);
    toast.success('Entry removed');
    fetchEntries();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Platform Changelog</h2>
          <p className="text-muted-foreground">Publish release notes visible to admins or all users</p>
        </div>
        <Button onClick={() => { setForm({ entry_type: 'feature', published: true }); setEditing(true); }} className="gap-2"><Plus className="h-4 w-4" /> New Entry</Button>
      </div>

      {editing && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{form.id ? 'Edit Entry' : 'New Entry'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder="Version (e.g. v2.4.1)" value={form.version || ''} onChange={e => setForm({ ...form, version: e.target.value })} />
              <Select value={form.entry_type} onValueChange={v => setForm({ ...form, entry_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="feature">Feature</SelectItem><SelectItem value="fix">Fix</SelectItem><SelectItem value="improvement">Improvement</SelectItem><SelectItem value="breaking">Breaking</SelectItem>
              </SelectContent></Select>
              <Select value={form.published ? 'public' : 'internal'} onValueChange={v => setForm({ ...form, published: v === 'public' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="public">Public</SelectItem><SelectItem value="internal">Internal</SelectItem>
              </SelectContent></Select>
            </div>
            <Input placeholder="Title" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <Card key={entry.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-xs">{entry.version}</Badge>
                      <Badge className={`text-xs ${typeColors[entry.entry_type] || typeColors.feature}`}>{entry.entry_type}</Badge>
                      {!entry.published ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{new Date(entry.published_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-medium mt-2">{entry.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => { setForm(entry); setEditing(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(entry.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {entries.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No changelog entries. Create one to get started.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformChangelogTab;
