import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Database, Search, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BROWSABLE_TABLES = [
  'profiles', 'user_roles', 'tickets', 'custom_gpts', 'vanguard_agents', 'assets',
  'ai_credit_ledger', 'feature_flags', 'admin_audit_trails', 'msp_clients',
  'invoices', 'admin_announcements', 'platform_error_logs', 'user_activity_feed',
];

const TableBrowserTab = () => {
  const [table, setTable] = useState('profiles');
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from(table as any).select('*').limit(50) as any);
      if (error) throw error;
      const d = data || [];
      setRows(d);
      setColumns(d.length > 0 ? Object.keys(d[0]).slice(0, 8) : []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to query');
    }
    setLoading(false);
  };

  const filteredRows = search ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) : rows;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold flex items-center gap-2"><Database className="h-6 w-6" /> Table Browser</h2><p className="text-muted-foreground">Browse and search data across all database tables</p></div>

      <div className="flex gap-3">
        <Select value={table} onValueChange={setTable}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>{BROWSABLE_TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Load</Button>
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Filter results..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Badge variant="outline">{filteredRows.length} rows</Badge>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> :
           columns.length === 0 ? <p className="p-8 text-center text-muted-foreground">Select a table and click Load</p> :
          <table className="w-full text-xs">
            <thead><tr className="border-b bg-muted/50">{columns.map(c => <th key={c} className="text-left p-2 font-medium whitespace-nowrap">{c}</th>)}</tr></thead>
            <tbody>{filteredRows.map((r, i) => (
              <tr key={i} className="border-b hover:bg-muted/30">{columns.map(c => <td key={c} className="p-2 max-w-[200px] truncate">{typeof r[c] === 'object' ? JSON.stringify(r[c]) : String(r[c] ?? '—')}</td>)}</tr>
            ))}</tbody>
          </table>}
        </CardContent>
      </Card>
    </div>
  );
};

export default TableBrowserTab;
