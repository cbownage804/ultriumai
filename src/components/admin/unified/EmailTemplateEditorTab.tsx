import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Eye, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  variables: string[];
}

const DEFAULTS: EmailTemplate[] = [
  { id: '1', name: 'Welcome Email', subject: 'Welcome to {{company_name}}!', body: '<h1>Welcome, {{user_name}}!</h1><p>Thanks for joining.</p>', type: 'auth', variables: ['user_name', 'company_name'] },
  { id: '2', name: 'Password Reset', subject: 'Reset your password', body: '<p>Click <a href="{{reset_link}}">here</a> to reset.</p>', type: 'auth', variables: ['reset_link', 'user_name'] },
  { id: '3', name: 'Ticket Update', subject: 'Ticket #{{ticket_id}} Updated', body: '<p>Your ticket has been updated: {{status}}</p>', type: 'notification', variables: ['ticket_id', 'status'] },
];

const EmailTemplateEditorTab = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULTS);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const selectTemplate = (id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) setSelected({ ...t });
    setPreviewing(false);
  };

  const saveTemplate = () => {
    if (!selected) return;
    setTemplates(prev => prev.map(t => t.id === selected.id ? selected : t));
    toast.success('Template saved');
  };

  const previewHtml = selected ? selected.body
    .replace(/\{\{user_name\}\}/g, 'John Doe')
    .replace(/\{\{company_name\}\}/g, 'UltriumAI')
    .replace(/\{\{reset_link\}\}/g, '#')
    .replace(/\{\{ticket_id\}\}/g, '1042')
    .replace(/\{\{status\}\}/g, 'Resolved') : '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Mail className="h-6 w-6" /> Email Template Editor</h2>
        <p className="text-muted-foreground">Customize transactional and notification email templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-lg">Templates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {templates.map(t => (
              <button key={t.id} onClick={() => selectTemplate(t.id)} className={`w-full text-left p-3 rounded-lg transition-colors ${selected?.id === t.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'}`}>
                <p className="text-sm font-medium">{t.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{t.type}</Badge>
                  <span className="text-xs text-muted-foreground">{t.variables.length} vars</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selected ? selected.name : 'Select a template'}</CardTitle>
              {selected && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewing(!previewing)} className="gap-1.5"><Eye className="h-3.5 w-3.5" /> {previewing ? 'Edit' : 'Preview'}</Button>
                  <Button size="sm" onClick={saveTemplate} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input value={selected.subject} onChange={e => setSelected({ ...selected, subject: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Available Variables</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">{selected.variables.map(v => <Badge key={v} variant="outline" className="text-xs font-mono">{`{{${v}}}`}</Badge>)}</div>
                </div>
                {previewing ? (
                  <div className="border rounded-lg p-4 bg-white text-black min-h-[200px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <div>
                    <label className="text-sm font-medium">Body (HTML)</label>
                    <Textarea value={selected.body} onChange={e => setSelected({ ...selected, body: e.target.value })} rows={10} className="font-mono text-xs" />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">Select a template to edit</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailTemplateEditorTab;
