import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, Plus, Trash2, Globe, Ban } from 'lucide-react';
import { toast } from 'sonner';

interface IpEntry {
  id: string;
  ip: string;
  label: string;
  type: 'allow' | 'block';
  addedAt: string;
}

const IpAllowlistTab = () => {
  const [enforceAllowlist, setEnforceAllowlist] = useState(false);
  const [entries, setEntries] = useState<IpEntry[]>([
    { id: '1', ip: '10.0.0.0/24', label: 'Office Network', type: 'allow', addedAt: '2025-01-10' },
    { id: '2', ip: '192.168.1.100', label: 'Dev Machine', type: 'allow', addedAt: '2025-01-15' },
    { id: '3', ip: '45.33.32.156', label: 'Known scanner', type: 'block', addedAt: '2025-02-01' },
  ]);
  const [newIp, setNewIp] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'allow' | 'block'>('allow');

  const addEntry = () => {
    if (!newIp) { toast.error('IP address required'); return; }
    setEntries(prev => [...prev, { id: Date.now().toString(), ip: newIp, label: newLabel || newIp, type: newType, addedAt: new Date().toISOString().split('T')[0] }]);
    setNewIp(''); setNewLabel('');
    toast.success(`IP ${newType === 'allow' ? 'allowed' : 'blocked'}`);
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Entry removed');
  };

  const allowed = entries.filter(e => e.type === 'allow');
  const blocked = entries.filter(e => e.type === 'block');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> IP Access Control</h2>
        <p className="text-muted-foreground">Manage IP allowlists and blocklists for admin and API access</p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">Enforce IP Allowlist</p>
            <p className="text-sm text-muted-foreground">Only allow access from listed IPs (admin panel & APIs)</p>
          </div>
          <Switch checked={enforceAllowlist} onCheckedChange={setEnforceAllowlist} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Add Entry</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="IP or CIDR (e.g. 10.0.0.0/24)" value={newIp} onChange={e => setNewIp(e.target.value)} className="flex-1 font-mono" />
          <Input placeholder="Label (optional)" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="flex-1" />
          <div className="flex gap-2">
            <Button variant={newType === 'allow' ? 'default' : 'outline'} size="sm" onClick={() => setNewType('allow')} className="gap-1.5"><Globe className="h-3.5 w-3.5" /> Allow</Button>
            <Button variant={newType === 'block' ? 'destructive' : 'outline'} size="sm" onClick={() => setNewType('block')} className="gap-1.5"><Ban className="h-3.5 w-3.5" /> Block</Button>
          </div>
          <Button onClick={addEntry} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-green-500" /> Allowed ({allowed.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {allowed.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div>
                  <p className="text-sm font-mono">{e.ip}</p>
                  <p className="text-xs text-muted-foreground">{e.label} · Added {e.addedAt}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeEntry(e.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            ))}
            {allowed.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No allowed IPs</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Ban className="h-5 w-5 text-destructive" /> Blocked ({blocked.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {blocked.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div>
                  <p className="text-sm font-mono">{e.ip}</p>
                  <p className="text-xs text-muted-foreground">{e.label} · Added {e.addedAt}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeEntry(e.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            ))}
            {blocked.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No blocked IPs</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IpAllowlistTab;
