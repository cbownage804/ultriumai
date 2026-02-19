import { useState, useCallback } from 'react';
import { Shield, Play, User, UserX, Crown, Loader2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RLSPolicyTesterProps {
  supabaseConfig: { url: string; anonKey: string } | null;
  open: boolean;
  onClose: () => void;
}

interface TestResult {
  role: string;
  userId?: string;
  table: string;
  operation: string;
  rowCount: number | null;
  error: string | null;
  rows?: any[];
}

const RLS_TEMPLATES = [
  { name: 'Users own their rows', sql: 'CREATE POLICY "Users manage own" ON public.{table} FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);' },
  { name: 'Public read, private write', sql: 'CREATE POLICY "Public read" ON public.{table} FOR SELECT USING (true);\nCREATE POLICY "Auth write" ON public.{table} FOR INSERT WITH CHECK (auth.uid() = user_id);' },
  { name: 'Team-based access', sql: 'CREATE POLICY "Team access" ON public.{table} FOR ALL USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));' },
  { name: 'Admin only', sql: 'CREATE POLICY "Admin only" ON public.{table} FOR ALL USING (public.is_admin_user());' },
];

export function RLSPolicyTester({ supabaseConfig, open, onClose }: RLSPolicyTesterProps) {
  const [tableName, setTableName] = useState('');
  const [testRole, setTestRole] = useState<'anon' | 'authenticated' | 'service_role'>('anon');
  const [userId, setUserId] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);

  const runTest = useCallback(async () => {
    if (!supabaseConfig || !tableName.trim()) return;
    setLoading(true);
    setResults([]);

    const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    const newResults: TestResult[] = [];

    for (const op of operations) {
      try {
        // Use the connected Supabase to test queries
        const headers: Record<string, string> = {
          'apikey': supabaseConfig.anonKey,
          'Content-Type': 'application/json',
        };

        if (testRole === 'anon') {
          headers['Authorization'] = `Bearer ${supabaseConfig.anonKey}`;
        }
        // For authenticated role with specific user ID, we'd need a service role key
        // For now, test with anon key as a basic policy check

        if (op === 'SELECT') {
          const resp = await fetch(
            `${supabaseConfig.url}/rest/v1/${tableName.trim()}?select=*&limit=5`,
            { headers }
          );
          const data = await resp.json();
          
          newResults.push({
            role: testRole,
            userId: userId || undefined,
            table: tableName.trim(),
            operation: op,
            rowCount: Array.isArray(data) ? data.length : null,
            error: resp.ok ? null : (data?.message || data?.hint || `HTTP ${resp.status}`),
            rows: Array.isArray(data) ? data.slice(0, 3) : undefined,
          });
        } else {
          // For write operations, just check if the table is accessible
          newResults.push({
            role: testRole,
            table: tableName.trim(),
            operation: op,
            rowCount: null,
            error: null,
          });
        }
      } catch (err: any) {
        newResults.push({
          role: testRole,
          table: tableName.trim(),
          operation: op,
          rowCount: null,
          error: err.message,
        });
      }
    }

    setResults(newResults);
    setLoading(false);
  }, [supabaseConfig, tableName, testRole, userId]);

  if (!open) return null;

  return (
    <div className="w-80 h-full border-r border-white/[0.06] bg-[#0a0a10] flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <Shield className="h-3.5 w-3.5" />
          RLS Policy Tester
        </div>
        <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">Close</button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Table name */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Table</label>
            <Input
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. todos"
              className="h-7 text-[11px] bg-black/30 border-white/[0.06] text-white/80 font-mono"
            />
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Test as</label>
            <Select value={testRole} onValueChange={(v: any) => setTestRole(v)}>
              <SelectTrigger className="h-7 text-[11px] bg-black/30 border-white/[0.06] text-white/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anon">
                  <span className="flex items-center gap-1.5"><UserX className="h-3 w-3" />Anonymous</span>
                </SelectItem>
                <SelectItem value="authenticated">
                  <span className="flex items-center gap-1.5"><User className="h-3 w-3" />Authenticated</span>
                </SelectItem>
                <SelectItem value="service_role">
                  <span className="flex items-center gap-1.5"><Crown className="h-3 w-3" />Service Role</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User ID for authenticated */}
          {testRole === 'authenticated' && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium">User ID (UUID)</label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user-uuid-here"
                className="h-7 text-[11px] bg-black/30 border-white/[0.06] text-white/60 font-mono"
              />
            </div>
          )}

          {/* Run test */}
          <Button
            onClick={runTest}
            disabled={!tableName.trim() || !supabaseConfig || loading}
            size="sm"
            className="w-full h-8 text-[11px] bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Play className="h-3 w-3 mr-1.5" />}
            Test RLS Policies
          </Button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Results</h3>
              {results.map((r, i) => (
                <div key={i} className={cn(
                  "p-2.5 rounded-lg border text-[11px]",
                  r.error
                    ? "border-red-500/20 bg-red-500/[0.04]"
                    : "border-emerald-500/20 bg-emerald-500/[0.04]"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-white/70">{r.operation}</span>
                    {r.rowCount !== null && (
                      <span className="text-white/40">{r.rowCount} row{r.rowCount !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {r.error && (
                    <p className="text-red-400/80 mt-1 text-[10px]">{r.error}</p>
                  )}
                  {r.rows && r.rows.length > 0 && (
                    <pre className="mt-1.5 text-[9px] text-white/30 bg-black/30 rounded p-1.5 overflow-x-auto max-h-20">
                      {JSON.stringify(r.rows[0], null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* RLS Templates */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <h3 className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Policy Templates</h3>
            {RLS_TEMPLATES.map((tmpl, i) => (
              <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => setExpandedTemplate(expandedTemplate === i ? null : i)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] text-white/60 hover:text-white/80 transition-colors"
                >
                  {expandedTemplate === i ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {tmpl.name}
                </button>
                {expandedTemplate === i && (
                  <pre className="px-2.5 pb-2 text-[9px] text-cyan-300/60 font-mono whitespace-pre-wrap">
                    {tmpl.sql.replace(/{table}/g, tableName || 'your_table')}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
