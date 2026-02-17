import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database, Table2, Columns, Key, Shield, Search, Play, RefreshCw,
  Plug, Unplug, ChevronRight, ChevronDown, Eye, Pencil, Trash2,
  Plus, FileCode, Copy, CheckCircle2, XCircle, Loader2, ArrowUpDown,
  Users, FolderOpen, Zap, Filter, Download, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { useSupabaseConnection, TableSchema, ColumnInfo, QueryResult } from '@/hooks/useSupabaseConnection';
import { motion, AnimatePresence } from 'framer-motion';

interface SupabaseIDEPanelProps {
  open: boolean;
  onClose: () => void;
  connection: ReturnType<typeof useSupabaseConnection>;
  onGenerateCode?: (code: string, fileName: string) => void;
}

export function SupabaseIDEPanel({ open, onClose, connection, onGenerateCode }: SupabaseIDEPanelProps) {
  const [activeTab, setActiveTab] = useState<'connect' | 'schema' | 'query' | 'auth' | 'storage'>('connect');
  const [connectUrl, setConnectUrl] = useState(connection.config?.url || '');
  const [connectKey, setConnectKey] = useState(connection.config?.anonKey || '');
  const [connectName, setConnectName] = useState(connection.config?.projectName || '');

  // Schema browser state
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [schemaSearch, setSchemaSearch] = useState('');

  // Query runner state
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [querySelect, setQuerySelect] = useState('*');
  const [queryLimit, setQueryLimit] = useState('100');
  const [queryFilters, setQueryFilters] = useState<{ column: string; operator: string; value: string }[]>([]);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleConnect = async () => {
    if (!connectUrl || !connectKey) {
      toast.error('URL and Anon Key are required');
      return;
    }
    await connection.connect({ url: connectUrl.replace(/\/$/, ''), anonKey: connectKey, projectName: connectName || undefined });
    setActiveTab('schema');
  };

  const handleDisconnect = () => {
    connection.disconnect();
    setActiveTab('connect');
  };

  const handleRunQuery = async () => {
    if (!selectedTable) { toast.error('Select a table first'); return; }
    setIsQuerying(true);
    const result = await connection.executeQuery(selectedTable, {
      select: querySelect || '*',
      filters: queryFilters.filter(f => f.column && f.value),
      limit: parseInt(queryLimit) || 100,
    });
    setQueryResult(result);
    setIsQuerying(false);
    if (result.error) toast.error(result.error);
  };

  const addFilter = () => {
    setQueryFilters(prev => [...prev, { column: '', operator: 'eq', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setQueryFilters(prev => prev.filter((_, i) => i !== index));
  };

  const generateClientCode = (table: TableSchema) => {
    const code = `import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  '${connection.config?.url}',
  '${connection.config?.anonKey}'
);

// Fetch all rows from ${table.name}
export async function fetch${table.name.charAt(0).toUpperCase() + table.name.slice(1)}() {
  const { data, error } = await supabase
    .from('${table.name}')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Insert a new row into ${table.name}
export async function insert${table.name.charAt(0).toUpperCase() + table.name.slice(1)}(row: Partial<${table.name}Row>) {
  const { data, error } = await supabase
    .from('${table.name}')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// TypeScript types
interface ${table.name}Row {
${table.columns.map(c => `  ${c.name}${c.isNullable ? '?' : ''}: ${mapPgTypeToTs(c.type)};`).join('\n')}
}
`;
    onGenerateCode?.(code, `${table.name}-client.ts`);
    toast.success(`Generated client code for ${table.name}`);
  };

  const generateMigration = (tableName: string) => {
    const table = connection.tables.find(t => t.name === tableName);
    if (!table) return;

    const sql = `-- Migration: Create ${table.name} table
CREATE TABLE IF NOT EXISTS public.${table.name} (
${table.columns.map(c => {
  let line = `  ${c.name} ${c.type.toUpperCase()}`;
  if (c.isPrimaryKey) line += ' PRIMARY KEY';
  if (!c.isNullable) line += ' NOT NULL';
  if (c.defaultValue) line += ` DEFAULT ${c.defaultValue}`;
  return line;
}).join(',\n')}
);

-- Enable RLS
ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (adjust as needed)
CREATE POLICY "Users can view own rows"
  ON public.${table.name}
  FOR SELECT
  USING (auth.uid() = user_id);
`;
    onGenerateCode?.(sql, `migration-${table.name}.sql`);
    toast.success(`Generated migration for ${table.name}`);
  };

  const filteredTables = connection.tables.filter(t =>
    schemaSearch ? t.name.toLowerCase().includes(schemaSearch.toLowerCase()) : true
  );

  // Auto-switch to schema after connecting
  const effectiveTab = !connection.status.connected && activeTab !== 'connect' ? 'connect' : activeTab;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-[#0c0c14] border-white/10 shadow-2xl gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-emerald-400" />
              Supabase IDE
              {connection.status.connected && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                  Connected{connection.status.latencyMs ? ` (${connection.status.latencyMs}ms)` : ''}
                </Badge>
              )}
            </DialogTitle>
            {connection.status.connected && (
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 text-xs gap-1">
                <Unplug className="h-3 w-3" /> Disconnect
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs value={effectiveTab} onValueChange={v => setActiveTab(v as any)} className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-5 mt-3 bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5 h-9">
            <TabsTrigger value="connect" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <Plug className="h-3 w-3" /> Connect
            </TabsTrigger>
            <TabsTrigger value="schema" disabled={!connection.status.connected} className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <Table2 className="h-3 w-3" /> Schema
            </TabsTrigger>
            <TabsTrigger value="query" disabled={!connection.status.connected} className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <Play className="h-3 w-3" /> Query
            </TabsTrigger>
            <TabsTrigger value="auth" disabled={!connection.status.connected} className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <Users className="h-3 w-3" /> Auth
            </TabsTrigger>
            <TabsTrigger value="storage" disabled={!connection.status.connected} className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md gap-1.5">
              <FolderOpen className="h-3 w-3" /> Storage
            </TabsTrigger>
          </TabsList>

          {/* ─── Connect Tab ─── */}
          <TabsContent value="connect" className="flex-1 p-5 space-y-4">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-center space-y-2 py-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Database className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-medium">Connect to Supabase</h3>
                <p className="text-white/40 text-sm">Enter your Supabase project URL and anon key to browse schemas, run queries, and manage data.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Project Name (optional)</label>
                  <Input value={connectName} onChange={e => setConnectName(e.target.value)} placeholder="My Project" className="bg-white/5 border-white/10 text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Supabase URL</label>
                  <Input value={connectUrl} onChange={e => setConnectUrl(e.target.value)} placeholder="https://your-project.supabase.co" className="bg-white/5 border-white/10 text-white text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Anon Key</label>
                  <Input value={connectKey} onChange={e => setConnectKey(e.target.value)} type="password" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="bg-white/5 border-white/10 text-white text-sm font-mono" />
                </div>
              </div>

              {connection.status.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 flex items-start gap-2">
                  <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {connection.status.error}
                </div>
              )}

              <Button onClick={handleConnect} disabled={connection.status.testing || !connectUrl || !connectKey} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                {connection.status.testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                {connection.status.testing ? 'Testing Connection...' : 'Connect'}
              </Button>

              <p className="text-[10px] text-white/20 text-center">
                Your credentials are stored locally and never sent to our servers.
              </p>
            </div>
          </TabsContent>

          {/* ─── Schema Browser Tab ─── */}
          <TabsContent value="schema" className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 px-5 py-2 border-b border-white/[0.06]">
              <Search className="h-3.5 w-3.5 text-white/30" />
              <Input value={schemaSearch} onChange={e => setSchemaSearch(e.target.value)} placeholder="Filter tables..." className="bg-transparent border-none text-sm text-white h-7 px-0 focus-visible:ring-0" />
              <Button variant="ghost" size="sm" onClick={() => connection.fetchSchema()} className="text-white/40 hover:text-white text-xs gap-1 shrink-0">
                <RefreshCw className={cn("h-3 w-3", connection.isLoadingSchema && "animate-spin")} /> Refresh
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-0.5">
                {connection.isLoadingSchema && (
                  <div className="py-8 text-center text-white/20 text-sm flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading schema...
                  </div>
                )}
                {!connection.isLoadingSchema && filteredTables.length === 0 && (
                  <div className="py-8 text-center text-white/20 text-sm">
                    {connection.tables.length === 0 ? 'No tables found. Click Refresh to reload.' : 'No tables match your search.'}
                  </div>
                )}
                {filteredTables.map(table => (
                  <div key={table.name} className="rounded-lg border border-white/[0.06] overflow-hidden">
                    <button
                      onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors text-left"
                    >
                      {expandedTable === table.name ? (
                        <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />
                      )}
                      <Table2 className="h-3.5 w-3.5 text-emerald-400/70 shrink-0" />
                      <span className="text-sm text-white/80 font-mono">{table.name}</span>
                      <span className="text-[10px] text-white/20 ml-auto">{table.columns.length} cols</span>
                    </button>

                    <AnimatePresence>
                      {expandedTable === table.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-2 space-y-1 border-t border-white/[0.04]">
                            {table.columns.map(col => (
                              <div key={col.name} className="flex items-center gap-2 py-1 px-2 rounded text-xs">
                                {col.isPrimaryKey && <Key className="h-3 w-3 text-amber-400/60 shrink-0" />}
                                {col.isForeignKey && <Zap className="h-3 w-3 text-blue-400/60 shrink-0" />}
                                {!col.isPrimaryKey && !col.isForeignKey && <Columns className="h-3 w-3 text-white/15 shrink-0" />}
                                <span className="text-white/70 font-mono">{col.name}</span>
                                <span className="text-white/25 font-mono ml-auto">{col.type}</span>
                                {col.isNullable && <span className="text-white/15 text-[9px]">NULL</span>}
                              </div>
                            ))}
                            <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                              <Button variant="ghost" size="sm" className="text-[10px] text-white/30 hover:text-white h-6 gap-1" onClick={() => { setSelectedTable(table.name); setActiveTab('query'); }}>
                                <Play className="h-2.5 w-2.5" /> Query
                              </Button>
                              <Button variant="ghost" size="sm" className="text-[10px] text-white/30 hover:text-white h-6 gap-1" onClick={() => generateClientCode(table)}>
                                <FileCode className="h-2.5 w-2.5" /> Generate Code
                              </Button>
                              <Button variant="ghost" size="sm" className="text-[10px] text-white/30 hover:text-white h-6 gap-1" onClick={() => generateMigration(table.name)}>
                                <Download className="h-2.5 w-2.5" /> Migration
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {connection.tables.length > 0 && (
              <div className="px-5 py-2 border-t border-white/[0.06] text-[10px] text-white/20">
                {connection.tables.length} table{connection.tables.length !== 1 ? 's' : ''} found
              </div>
            )}
          </TabsContent>

          {/* ─── Query Runner Tab ─── */}
          <TabsContent value="query" className="flex-1 min-h-0 flex flex-col">
            <div className="px-5 py-3 space-y-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <select
                  value={selectedTable}
                  onChange={e => setSelectedTable(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-md text-sm text-white px-2 py-1.5 flex-1"
                >
                  <option value="">Select table...</option>
                  {connection.tables.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <Input value={querySelect} onChange={e => setQuerySelect(e.target.value)} placeholder="* or column1, column2" className="bg-white/5 border-white/10 text-white text-sm font-mono w-48" />
                <Input value={queryLimit} onChange={e => setQueryLimit(e.target.value)} placeholder="100" className="bg-white/5 border-white/10 text-white text-sm w-20" type="number" />
              </div>

              {queryFilters.map((filter, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-white/30 w-12">{i === 0 ? 'WHERE' : 'AND'}</span>
                  <Input value={filter.column} onChange={e => setQueryFilters(prev => prev.map((f, j) => j === i ? { ...f, column: e.target.value } : f))} placeholder="column" className="bg-white/5 border-white/10 text-white text-xs font-mono flex-1" />
                  <select
                    value={filter.operator}
                    onChange={e => setQueryFilters(prev => prev.map((f, j) => j === i ? { ...f, operator: e.target.value } : f))}
                    className="bg-white/5 border border-white/10 rounded-md text-xs text-white px-2 py-1.5 w-20"
                  >
                    {['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'is'].map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                  <Input value={filter.value} onChange={e => setQueryFilters(prev => prev.map((f, j) => j === i ? { ...f, value: e.target.value } : f))} placeholder="value" className="bg-white/5 border-white/10 text-white text-xs font-mono flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => removeFilter(i)} className="text-white/20 hover:text-red-400 h-7 w-7 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={addFilter} className="text-white/30 hover:text-white text-xs gap-1">
                  <Filter className="h-3 w-3" /> Add Filter
                </Button>
                <div className="flex-1" />
                <Button onClick={handleRunQuery} disabled={isQuerying || !selectedTable} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5">
                  {isQuerying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  Run Query
                </Button>
              </div>
            </div>

            {/* Query Results */}
            <ScrollArea className="flex-1">
              {queryResult && (
                <div className="p-3">
                  <div className="flex items-center gap-3 mb-2 text-xs text-white/30">
                    {queryResult.error ? (
                      <span className="text-red-400 flex items-center gap-1"><XCircle className="h-3 w-3" /> {queryResult.error}</span>
                    ) : (
                      <>
                        <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {queryResult.rowCount} rows</span>
                        <span>{queryResult.executionTimeMs}ms</span>
                      </>
                    )}
                  </div>

                  {queryResult.data && queryResult.data.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                            {queryResult.columns.map(col => (
                              <th key={col} className="text-left px-3 py-2 text-white/40 font-mono font-medium whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.data.slice(0, 50).map((row, i) => (
                            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                              {queryResult.columns.map(col => (
                                <td key={col} className="px-3 py-1.5 text-white/60 font-mono whitespace-nowrap max-w-[200px] truncate">
                                  {row[col] === null ? <span className="text-white/15 italic">null</span> : String(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {queryResult.data.length > 50 && (
                        <div className="text-center py-2 text-[10px] text-white/20">
                          Showing 50 of {queryResult.data.length} rows
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {!queryResult && (
                <div className="py-12 text-center text-white/15 text-sm">
                  Select a table and run a query to see results
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* ─── Auth Tab ─── */}
          <TabsContent value="auth" className="flex-1 p-5">
            <div className="max-w-md mx-auto text-center space-y-4 py-8">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-medium">Authentication</h3>
              <p className="text-white/40 text-sm">
                Auth management requires the Supabase Dashboard. Use the button below to open your project's auth settings.
              </p>
              {connection.config?.url && (
                <Button
                  onClick={() => {
                    const projectRef = connection.config!.url.match(/https:\/\/(\w+)\.supabase/)?.[1];
                    if (projectRef) window.open(`https://supabase.com/dashboard/project/${projectRef}/auth/users`, '_blank');
                    else toast.error('Could not extract project ref from URL');
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                >
                  <Users className="h-4 w-4" /> Open Auth Dashboard
                </Button>
              )}
              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/30 mb-3">Generate auth boilerplate for your app:</p>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs border-white/10 text-white/60 hover:text-white gap-1" onClick={() => {
                    const code = generateAuthCode(connection.config!);
                    onGenerateCode?.(code, 'auth-client.ts');
                    toast.success('Generated auth client code');
                  }}>
                    <FileCode className="h-3 w-3" /> Auth Client
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs border-white/10 text-white/60 hover:text-white gap-1" onClick={() => {
                    const code = generateAuthUICode();
                    onGenerateCode?.(code, 'LoginForm.tsx');
                    toast.success('Generated login form');
                  }}>
                    <FileCode className="h-3 w-3" /> Login Form
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── Storage Tab ─── */}
          <TabsContent value="storage" className="flex-1 p-5">
            <div className="max-w-md mx-auto text-center space-y-4 py-8">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                <FolderOpen className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-white font-medium">Storage</h3>
              <p className="text-white/40 text-sm">
                Storage management requires the Supabase Dashboard. Use the button below to open your storage buckets.
              </p>
              {connection.config?.url && (
                <Button
                  onClick={() => {
                    const projectRef = connection.config!.url.match(/https:\/\/(\w+)\.supabase/)?.[1];
                    if (projectRef) window.open(`https://supabase.com/dashboard/project/${projectRef}/storage/buckets`, '_blank');
                    else toast.error('Could not extract project ref from URL');
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white gap-2"
                >
                  <FolderOpen className="h-4 w-4" /> Open Storage Dashboard
                </Button>
              )}
              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/30 mb-3">Generate storage boilerplate:</p>
                <Button variant="outline" size="sm" className="text-xs border-white/10 text-white/60 hover:text-white gap-1" onClick={() => {
                  const code = generateStorageCode(connection.config!);
                  onGenerateCode?.(code, 'storage-client.ts');
                  toast.success('Generated storage client code');
                }}>
                  <FileCode className="h-3 w-3" /> Storage Client
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function mapPgTypeToTs(pgType: string): string {
  const map: Record<string, string> = {
    'uuid': 'string', 'text': 'string', 'varchar': 'string', 'character varying': 'string',
    'integer': 'number', 'bigint': 'number', 'smallint': 'number', 'numeric': 'number', 'real': 'number', 'double precision': 'number',
    'boolean': 'boolean', 'bool': 'boolean',
    'timestamp with time zone': 'string', 'timestamp without time zone': 'string', 'timestamptz': 'string',
    'date': 'string', 'time': 'string',
    'jsonb': 'Record<string, any>', 'json': 'Record<string, any>',
    'ARRAY': 'any[]',
  };
  return map[pgType.toLowerCase()] || 'any';
}

function generateAuthCode(config: { url: string; anonKey: string }): string {
  return `import { createClient } from '@supabase/supabase-js';

const supabase = createClient('${config.url}', '${config.anonKey}');

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
`;
}

function generateAuthUICode(): string {
  return `import { useState } from 'react';

export function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto p-6">
      <h2 className="text-xl font-bold text-center">Sign In</h2>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full px-3 py-2 border rounded-md" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full px-3 py-2 border rounded-md" />
      <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50">
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
`;
}

function generateStorageCode(config: { url: string; anonKey: string }): string {
  return `import { createClient } from '@supabase/supabase-js';

const supabase = createClient('${config.url}', '${config.anonKey}');

export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function listFiles(bucket: string, folder?: string) {
  const { data, error } = await supabase.storage.from(bucket).list(folder || '');
  if (error) throw error;
  return data;
}

export async function deleteFile(bucket: string, paths: string[]) {
  const { data, error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
  return data;
}
`;
}
