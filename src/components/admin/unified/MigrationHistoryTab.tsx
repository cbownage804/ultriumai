import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitBranch, CheckCircle2, XCircle, Clock, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Migration {
  id: string;
  name: string;
  version: string;
  executedAt: string;
  duration: string;
  status: 'applied' | 'failed' | 'pending';
  statements: number;
  sql: string;
}

const MOCK: Migration[] = [
  { id: '1', name: 'create_profiles_table', version: '20250101000000', executedAt: '2025-01-01 00:00:00', duration: '120ms', status: 'applied', statements: 4, sql: 'CREATE TABLE profiles (...);\nALTER TABLE profiles ENABLE ROW LEVEL SECURITY;\nCREATE POLICY ...' },
  { id: '2', name: 'add_vanguard_agents', version: '20250115000000', executedAt: '2025-01-15 00:00:00', duration: '85ms', status: 'applied', statements: 6, sql: 'CREATE TABLE vanguard_agents (...);\nCREATE INDEX ...' },
  { id: '3', name: 'create_tickets_system', version: '20250201000000', executedAt: '2025-02-01 00:00:00', duration: '200ms', status: 'applied', statements: 8, sql: 'CREATE TABLE tickets (...);\nCREATE TABLE ticket_comments (...);\n...' },
  { id: '4', name: 'add_atlas_documents', version: '20250205000000', executedAt: '2025-02-05 00:00:00', duration: '150ms', status: 'applied', statements: 5, sql: 'CREATE TABLE atlas_documents (...);\n...' },
  { id: '5', name: 'add_webhook_events', version: '20250208000000', executedAt: '', duration: '', status: 'pending', statements: 3, sql: 'CREATE TABLE webhook_events (...);\n...' },
];

const MigrationHistoryTab = () => {
  const [migrations] = useState(MOCK);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const statusIcon = (s: string) => {
    if (s === 'applied') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (s === 'failed') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><GitBranch className="h-6 w-6" /> Migration History</h2>
        <p className="text-muted-foreground">Browse database migrations with diffs and execution details</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-green-500">{migrations.filter(m => m.status === 'applied').length}</p><p className="text-xs text-muted-foreground">Applied</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-amber-500">{migrations.filter(m => m.status === 'pending').length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-destructive">{migrations.filter(m => m.status === 'failed').length}</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
      </div>

      <div className="space-y-2">
        {migrations.map(m => (
          <Card key={m.id}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle(m.id)}>
                <div className="flex items-center gap-3">
                  {expanded.has(m.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {statusIcon(m.status)}
                  <div>
                    <p className="text-sm font-medium font-mono">{m.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{m.version}</span>
                      {m.executedAt && <span>· {m.executedAt}</span>}
                      {m.duration && <span>· {m.duration}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{m.statements} stmt</Badge>
                  <Badge variant={m.status === 'applied' ? 'default' : m.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs capitalize">{m.status}</Badge>
                </div>
              </div>
              {expanded.has(m.id) && (
                <div className="mt-3 pt-3 border-t">
                  <pre className="text-xs font-mono bg-muted/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{m.sql}</pre>
                  {m.status === 'applied' && (
                    <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => toast.info('Rollback initiated (simulated)')}>
                      <RotateCcw className="h-3.5 w-3.5" /> Rollback
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MigrationHistoryTab;
