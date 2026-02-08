import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  body: string;
  type: 'feature' | 'fix' | 'improvement' | 'breaking';
  visibility: 'public' | 'internal';
  date: string;
}

const typeColors: Record<string, string> = {
  feature: 'bg-green-500/20 text-green-500',
  fix: 'bg-blue-500/20 text-blue-500',
  improvement: 'bg-purple-500/20 text-purple-500',
  breaking: 'bg-destructive/20 text-destructive',
};

const PlatformChangelogTab = () => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([
    { id: '1', version: 'v2.4.0', title: 'Admin Center Sidebar Navigation', body: 'Replaced horizontal tabs with a collapsible sidebar for better organization.', type: 'feature', visibility: 'public', date: '2026-02-08' },
    { id: '2', version: 'v2.3.5', title: 'Webhook Manager', body: 'Added outbound webhook configuration with retry logic.', type: 'feature', visibility: 'public', date: '2026-02-07' },
    { id: '3', version: 'v2.3.4', title: 'OOM Build Fix', body: 'Resolved out-of-memory build errors with bundle splitting.', type: 'fix', visibility: 'internal', date: '2026-02-06' },
  ]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<ChangelogEntry>>({ type: 'feature', visibility: 'public' });

  const save = () => {
    if (!form.version || !form.title || !form.body) { toast.error('All fields required'); return; }
    if (form.id) {
      setEntries(prev => prev.map(e => e.id === form.id ? { ...e, ...form } as ChangelogEntry : e));
    } else {
      setEntries(prev => [{ ...form, id: Date.now().toString(), date: new Date().toISOString().split('T')[0] } as ChangelogEntry, ...prev]);
    }
    setForm({ type: 'feature', visibility: 'public' }); setEditing(false);
    toast.success('Changelog saved');
  };

  const remove = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Entry removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Platform Changelog</h2>
          <p className="text-muted-foreground">Publish release notes visible to admins or all users</p>
        </div>
        <Button onClick={() => { setForm({ type: 'feature', visibility: 'public' }); setEditing(true); }} className="gap-2"><Plus className="h-4 w-4" /> New Entry</Button>
      </div>

      {editing && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{form.id ? 'Edit Entry' : 'New Entry'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder="Version (e.g. v2.4.1)" value={form.version || ''} onChange={e => setForm({ ...form, version: e.target.value })} />
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="feature">Feature</SelectItem><SelectItem value="fix">Fix</SelectItem><SelectItem value="improvement">Improvement</SelectItem><SelectItem value="breaking">Breaking</SelectItem>
              </SelectContent></Select>
              <Select value={form.visibility} onValueChange={v => setForm({ ...form, visibility: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="public">Public</SelectItem><SelectItem value="internal">Internal</SelectItem>
              </SelectContent></Select>
            </div>
            <Input placeholder="Title" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description..." value={form.body || ''} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} />
            <div className="flex gap-2">
              <Button onClick={save}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {entries.map(entry => (
          <Card key={entry.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">{entry.version}</Badge>
                    <Badge className={`text-xs ${typeColors[entry.type]}`}>{entry.type}</Badge>
                    {entry.visibility === 'internal' ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <h3 className="font-medium mt-2">{entry.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{entry.body}</p>
                </div>
                <div className="flex gap-1 shrink-0 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => { setForm(entry); setEditing(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(entry.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlatformChangelogTab;
