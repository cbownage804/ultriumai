import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Key, RefreshCw, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuditLogger } from '@/hooks/useAuditLogger';

interface ApiKeyRow { id: string; name: string; key_prefix: string; user_id: string; is_active: boolean; usage_count: number; last_used_at?: string; created_at: string; expires_at?: string; }

const ApiKeyOversightTab = () => {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { logAdminAction } = useAuditLogger();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false }).limit(100);
    setKeys((data as any) || []);
    setLoading(false);
  };

  const toggleKey = async (key: ApiKeyRow) => {
    const newState = !key.is_active;
    await supabase.from('api_keys').update({ is_active: newState }).eq('id', key.id);
    await logAdminAction({ action: newState ? 'api_key_enabled' : 'api_key_revoked', resource_type: 'api_key', resource_id: key.id, resource_name: key.name });
    toast.success(newState ? 'Key enabled' : 'Key revoked');
    load();
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold flex items-center gap-2"><Key className="h-6 w-6" /> API Key Oversight</h2><p className="text-muted-foreground">Monitor and manage all platform API keys</p></div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold">{keys.length}</p><p className="text-sm text-muted-foreground">Total Keys</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-green-500">{keys.filter(k => k.is_active).length}</p><p className="text-sm text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-destructive">{keys.filter(k => !k.is_active).length}</p><p className="text-sm text-muted-foreground">Revoked</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Prefix</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Usage</th>
              <th className="text-left p-3 font-medium">Last Used</th>
              <th className="text-left p-3 font-medium">Created</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr> :
               keys.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No API keys found</td></tr> :
               keys.map(k => (
                <tr key={k.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{k.name}</td>
                  <td className="p-3 font-mono text-xs">{k.key_prefix}...</td>
                  <td className="p-3"><Badge className={k.is_active ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}>{k.is_active ? 'Active' : 'Revoked'}</Badge></td>
                  <td className="p-3 text-muted-foreground">{k.usage_count}</td>
                  <td className="p-3 text-muted-foreground text-xs">{k.last_used_at ? format(new Date(k.last_used_at), 'MMM d, HH:mm') : '—'}</td>
                  <td className="p-3 text-muted-foreground text-xs">{format(new Date(k.created_at), 'MMM d, yyyy')}</td>
                  <td className="p-3"><Button variant="ghost" size="sm" onClick={() => toggleKey(k)}>{k.is_active ? <Ban className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-green-500" />}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyOversightTab;
