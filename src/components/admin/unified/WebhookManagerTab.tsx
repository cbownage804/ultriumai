import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Webhook, Plus, Trash2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WebhookEntry {
  id: string;
  url: string;
  event: string;
  status: 'active' | 'inactive';
  lastTriggered?: string;
  failCount: number;
}

const EVENTS = [
  'user.created', 'user.deleted', 'ticket.created', 'ticket.resolved',
  'agent.online', 'agent.offline', 'alert.triggered', 'invoice.generated',
];

const WebhookManagerTab = () => {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([
    { id: '1', url: 'https://example.com/hooks/users', event: 'user.created', status: 'active', lastTriggered: '2 min ago', failCount: 0 },
    { id: '2', url: 'https://slack.com/api/incoming', event: 'ticket.created', status: 'active', lastTriggered: '15 min ago', failCount: 0 },
    { id: '3', url: 'https://old-service.com/hook', event: 'alert.triggered', status: 'inactive', failCount: 5 },
  ]);
  const [newUrl, setNewUrl] = useState('');
  const [newEvent, setNewEvent] = useState('');

  const addWebhook = () => {
    if (!newUrl || !newEvent) { toast.error('URL and event are required'); return; }
    setWebhooks(prev => [...prev, {
      id: Date.now().toString(), url: newUrl, event: newEvent, status: 'active', failCount: 0,
    }]);
    setNewUrl(''); setNewEvent('');
    toast.success('Webhook added');
  };

  const removeWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    toast.success('Webhook removed');
  };

  const toggleStatus = (id: string) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w));
  };

  const testWebhook = (id: string) => {
    toast.info('Test payload sent (simulated)');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Webhook className="h-6 w-6" /> Webhook Manager</h2>
        <p className="text-muted-foreground">Configure outbound webhooks for platform events</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Add Webhook</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="https://your-endpoint.com/hook" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="flex-1" />
          <Select value={newEvent} onValueChange={setNewEvent}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Event" /></SelectTrigger>
            <SelectContent>{EVENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={addWebhook} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {webhooks.map(wh => (
          <Card key={wh.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {wh.status === 'active' ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-mono truncate">{wh.url}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{wh.event}</Badge>
                    {wh.lastTriggered && <span className="text-xs text-muted-foreground">Last: {wh.lastTriggered}</span>}
                    {wh.failCount > 0 && <Badge variant="destructive" className="text-xs">{wh.failCount} failures</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => testWebhook(wh.id)}><RefreshCw className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => toggleStatus(wh.id)}>{wh.status === 'active' ? 'Disable' : 'Enable'}</Button>
                <Button variant="ghost" size="sm" onClick={() => removeWebhook(wh.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WebhookManagerTab;
