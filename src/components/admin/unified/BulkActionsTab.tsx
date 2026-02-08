import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Layers, Mail, UserCog, Ticket, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuditLogger } from '@/hooks/useAuditLogger';

const BulkActionsTab = () => {
  const { logAdminAction } = useAuditLogger();
  const [action, setAction] = useState('');
  const [emails, setEmails] = useState('');
  const [roleToAssign, setRoleToAssign] = useState('user');
  const [processing, setProcessing] = useState(false);

  const handleBulkRoleAssign = async () => {
    const emailList = emails.split('\n').map(e => e.trim()).filter(Boolean);
    if (!emailList.length) { toast.error('Enter at least one email'); return; }
    setProcessing(true);
    let success = 0;
    for (const email of emailList) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      if (profile) {
        await supabase.from('user_roles').upsert({ user_id: profile.id, role: roleToAssign } as any, { onConflict: 'user_id,role' });
        success++;
      }
    }
    await logAdminAction({ action: 'bulk_role_assign', resource_type: 'users', metadata: { count: success, role: roleToAssign } });
    toast.success(`Assigned ${roleToAssign} role to ${success} users`);
    setProcessing(false);
  };

  const handleExportUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, email, full_name, created_at');
    if (!data?.length) { toast.error('No data'); return; }
    const csv = ['id,email,full_name,created_at', ...data.map(r => `${r.id},${r.email},${r.full_name},${r.created_at}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users_export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const handleExportTickets = async () => {
    const { data } = await supabase.from('tickets').select('id, title, status, priority, created_at');
    if (!data?.length) { toast.error('No data'); return; }
    const csv = ['id,title,status,priority,created_at', ...data.map((r: any) => `${r.id},${r.title},${r.status},${r.priority},${r.created_at}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tickets_export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold flex items-center gap-2"><Layers className="h-6 w-6" /> Bulk Actions</h2><p className="text-muted-foreground">Mass operations across users, tickets, and data</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserCog className="h-5 w-5" /> Bulk Role Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Enter one email per line..." value={emails} onChange={e => setEmails(e.target.value)} rows={4} />
            <Select value={roleToAssign} onValueChange={setRoleToAssign}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent></Select>
            <Button onClick={handleBulkRoleAssign} disabled={processing} className="w-full">{processing ? 'Processing...' : 'Assign Roles'}</Button>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Download className="h-5 w-5" /> Data Exports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={handleExportUsers} className="w-full gap-2"><Download className="h-4 w-4" /> Export All Users (CSV)</Button>
            <Button variant="outline" onClick={handleExportTickets} className="w-full gap-2"><Download className="h-4 w-4" /> Export All Tickets (CSV)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkActionsTab;
