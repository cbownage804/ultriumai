import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, Ticket, Bot, Package, Loader2 } from 'lucide-react';

interface SearchResult { type: string; id: string; label: string; detail?: string; }

const SEARCH_TABLES = [
  { table: 'profiles', type: 'User', label: 'email', detail: 'full_name' },
  { table: 'tickets', type: 'Ticket', label: 'title', detail: 'status' },
  { table: 'custom_gpts', type: 'GPT', label: 'name', detail: 'description' },
  { table: 'vanguard_agents', type: 'Agent', label: 'hostname', detail: 'os_type' },
  { table: 'assets', type: 'Asset', label: 'name', detail: 'serial_number' },
] as const;

const typeIcons: Record<string, any> = { User: Users, Ticket: Ticket, GPT: Bot, Agent: Package, Asset: Package };

const GlobalSearchTab = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const all: SearchResult[] = [];
    await Promise.all(SEARCH_TABLES.map(async ({ table, type, label, detail }) => {
      try {
        const { data } = await supabase.from(table).select(`id, ${label}${detail ? `, ${detail}` : ''}`).ilike(label, `%${query}%`).limit(10);
        (data || []).forEach((r: any) => all.push({ type, id: r.id, label: r[label] || 'Unnamed', detail: r[detail] }));
      } catch {}
    }));
    setResults(all);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold flex items-center gap-2"><Search className="h-6 w-6" /> Global Search</h2><p className="text-muted-foreground">Search across users, tickets, GPTs, agents, and assets</p></div>
      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search everything..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} className="pl-9" /></div>
      </div>
      {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      {!loading && results.length > 0 && (
        <Card><CardContent className="p-0 divide-y">
          {results.map(r => { const Icon = typeIcons[r.type] || Package; return (
            <div key={`${r.type}-${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{r.label}</p>{r.detail && <p className="text-xs text-muted-foreground">{r.detail}</p>}</div>
              <Badge variant="outline" className="text-xs">{r.type}</Badge>
            </div>
          );})}
        </CardContent></Card>
      )}
      {!loading && query && results.length === 0 && <p className="text-center text-muted-foreground py-8">No results found</p>}
    </div>
  );
};

export default GlobalSearchTab;
