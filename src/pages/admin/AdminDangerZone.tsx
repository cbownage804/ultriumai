import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformRole } from '@/hooks/usePlatformRole';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDangerZone() {
  const { isSuperAdmin } = usePlatformRole();
  const [phrase, setPhrase] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isSuperAdmin) {
    return (
      <div>
        <AdminPageHeader title="Danger Zone" />
        <div className="p-6 text-sm text-muted-foreground">Only super admins can access this page.</div>
      </div>
    );
  }

  const wipe = async () => {
    if (phrase !== 'WIPE ALL USERS') { toast.error('Type the confirmation exactly'); return; }
    if (!confirm('This is irreversible. Every user except brandon@ultriumai.com will be deleted. Continue?')) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-wipe-users', {
        body: { confirm: 'WIPE ALL USERS' },
      });
      if (error) throw error;
      setResult(data);
      toast.success(`Wipe complete: deleted ${data.deleted}, kept ${data.kept}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setRunning(false); }
  };

  return (
    <div>
      <AdminPageHeader title="Danger Zone" subtitle="Destructive, irreversible platform operations" />
      <div className="p-6">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Wipe all users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Permanently deletes every <code>auth.users</code> row and cascades their data — except <b>brandon@ultriumai.com</b>. There is no undo.
            </p>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Type <code>WIPE ALL USERS</code> to enable
              </label>
              <Input value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="WIPE ALL USERS" />
            </div>
            <Button
              variant="destructive"
              disabled={phrase !== 'WIPE ALL USERS' || running}
              onClick={wipe}
            >
              {running ? 'Wiping…' : 'Wipe all other users'}
            </Button>
            {result && (
              <div className="text-xs bg-muted/40 rounded-md p-3 font-mono">
                Deleted: {result.deleted} · Kept: {result.kept} · Errors: {result.errors?.length ?? 0}
                {result.errors?.length > 0 && (
                  <ul className="mt-2 space-y-0.5">{result.errors.map((e: string, i: number) => <li key={i} className="text-destructive">{e}</li>)}</ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
