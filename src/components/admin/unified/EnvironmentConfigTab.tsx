import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Plus, Save, Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface EnvVar {
  id: string;
  key: string;
  value: string;
  env: 'development' | 'staging' | 'production';
  secret: boolean;
}

const EnvironmentConfigTab = () => {
  const [vars, setVars] = useState<EnvVar[]>([
    { id: '1', key: 'SUPABASE_URL', value: 'https://nsyobmjpdpvesjwdphlh.supabase.co', env: 'production', secret: false },
    { id: '2', key: 'OPENAI_API_KEY', value: 'sk-***********', env: 'production', secret: true },
    { id: '3', key: 'RESEND_API_KEY', value: 're_***********', env: 'production', secret: true },
    { id: '4', key: 'DEBUG_MODE', value: 'true', env: 'development', secret: false },
    { id: '5', key: 'LOG_LEVEL', value: 'info', env: 'staging', secret: false },
  ]);
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newEnv, setNewEnv] = useState<'development' | 'staging' | 'production'>('development');

  const filtered = envFilter === 'all' ? vars : vars.filter(v => v.env === envFilter);

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const addVar = () => {
    if (!newKey) { toast.error('Key required'); return; }
    setVars(prev => [...prev, { id: Date.now().toString(), key: newKey.toUpperCase(), value: newValue, env: newEnv, secret: newKey.includes('KEY') || newKey.includes('SECRET') }]);
    setNewKey(''); setNewValue('');
    toast.success('Variable added');
  };

  const removeVar = (id: string) => setVars(prev => prev.filter(v => v.id !== id));

  const envColor = (e: string) => e === 'production' ? 'bg-destructive/20 text-destructive' : e === 'staging' ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Settings2 className="h-6 w-6" /> Environment Config</h2>
        <p className="text-muted-foreground">Manage environment variables across dev, staging, and production</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'development', 'staging', 'production'].map(e => (
          <Button key={e} variant={envFilter === e ? 'default' : 'outline'} size="sm" onClick={() => setEnvFilter(e)} className="capitalize text-xs">{e}</Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Add Variable</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="KEY_NAME" value={newKey} onChange={e => setNewKey(e.target.value)} className="flex-1 font-mono uppercase" />
          <Input placeholder="value" value={newValue} onChange={e => setNewValue(e.target.value)} className="flex-1" />
          <Select value={newEnv} onValueChange={v => setNewEnv(v as any)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="development">Development</SelectItem><SelectItem value="staging">Staging</SelectItem><SelectItem value="production">Production</SelectItem>
          </SelectContent></Select>
          <Button onClick={addVar} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filtered.map(v => (
          <Card key={v.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge className={`text-xs ${envColor(v.env)}`}>{v.env.slice(0, 3)}</Badge>
                <span className="text-sm font-mono font-medium">{v.key}</span>
                <span className="text-sm text-muted-foreground font-mono truncate">{v.secret && !showSecrets.has(v.id) ? '••••••••' : v.value}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {v.secret && <Button variant="ghost" size="sm" onClick={() => toggleSecret(v.id)}>{showSecrets.has(v.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>}
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(v.value); toast.success('Copied'); }}><Copy className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => removeVar(v.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentConfigTab;
