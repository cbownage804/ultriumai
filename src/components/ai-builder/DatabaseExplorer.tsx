import { useState, useCallback } from 'react';
import { X, Database, Play, Plus, Trash2, RefreshCw, Download, Table2, Columns, ArrowRight, Clock, Check, Copy, ChevronRight, Search, Code2, Eye, History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
  defaultValue?: string;
}

interface SchemaTable {
  name: string;
  rowCount: number;
  columns: SchemaColumn[];
}

interface QueryResult {
  id: string;
  query: string;
  rows: Record<string, any>[];
  columns: string[];
  duration: number;
  rowCount: number;
  timestamp: Date;
}

interface MigrationEntry {
  id: string;
  name: string;
  sql: string;
  status: 'applied' | 'pending' | 'failed';
  appliedAt?: Date;
}

interface DatabaseExplorerProps {
  open: boolean;
  onClose: () => void;
  supabaseConfig: { url: string; anonKey: string } | null;
}

const MOCK_TABLES: SchemaTable[] = [
  { name: 'users', rowCount: 24, columns: [
    { name: 'id', type: 'uuid', nullable: false, isPrimary: true, defaultValue: 'gen_random_uuid()' },
    { name: 'email', type: 'text', nullable: false },
    { name: 'name', type: 'text', nullable: true },
    { name: 'role', type: 'text', nullable: false, defaultValue: "'user'" },
    { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()' },
  ]},
  { name: 'posts', rowCount: 87, columns: [
    { name: 'id', type: 'uuid', nullable: false, isPrimary: true },
    { name: 'title', type: 'text', nullable: false },
    { name: 'content', type: 'text', nullable: true },
    { name: 'user_id', type: 'uuid', nullable: false, isForeign: true, references: 'users.id' },
    { name: 'published', type: 'boolean', nullable: false, defaultValue: 'false' },
    { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()' },
  ]},
  { name: 'comments', rowCount: 156, columns: [
    { name: 'id', type: 'uuid', nullable: false, isPrimary: true },
    { name: 'body', type: 'text', nullable: false },
    { name: 'post_id', type: 'uuid', nullable: false, isForeign: true, references: 'posts.id' },
    { name: 'user_id', type: 'uuid', nullable: false, isForeign: true, references: 'users.id' },
    { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()' },
  ]},
];

const MOCK_MIGRATIONS: MigrationEntry[] = [
  { id: '1', name: '001_create_users', sql: 'CREATE TABLE users (...);', status: 'applied', appliedAt: new Date('2024-01-15') },
  { id: '2', name: '002_create_posts', sql: 'CREATE TABLE posts (...);', status: 'applied', appliedAt: new Date('2024-01-16') },
  { id: '3', name: '003_add_comments', sql: 'CREATE TABLE comments (...);', status: 'applied', appliedAt: new Date('2024-02-01') },
  { id: '4', name: '004_add_roles', sql: "ALTER TABLE users ADD COLUMN role text DEFAULT 'user';", status: 'pending' },
];

type ActiveView = 'schema' | 'query' | 'migrations';

export function DatabaseExplorer({ open, onClose, supabaseConfig }: DatabaseExplorerProps) {
  const [activeView, setActiveView] = useState<ActiveView>('schema');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryText, setQueryText] = useState('SELECT * FROM users LIMIT 10;');
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const table = MOCK_TABLES.find(t => t.name === selectedTable);
  const filteredTables = searchQuery
    ? MOCK_TABLES.filter(t => t.name.includes(searchQuery.toLowerCase()))
    : MOCK_TABLES;

  const handleRunQuery = useCallback(async () => {
    if (!queryText.trim()) return;
    setIsRunning(true);
    await new Promise(r => setTimeout(r, 600));

    const mockResult: QueryResult = {
      id: crypto.randomUUID(),
      query: queryText,
      columns: ['id', 'email', 'name', 'role', 'created_at'],
      rows: [
        { id: 'a1b2c3', email: 'alice@example.com', name: 'Alice', role: 'admin', created_at: '2024-01-15' },
        { id: 'd4e5f6', email: 'bob@example.com', name: 'Bob', role: 'user', created_at: '2024-02-20' },
      ],
      duration: Math.floor(Math.random() * 50 + 5),
      rowCount: 2,
      timestamp: new Date(),
    };
    setQueryResults(prev => [mockResult, ...prev].slice(0, 20));
    setIsRunning(false);
    toast.success(`Query returned ${mockResult.rowCount} rows in ${mockResult.duration}ms`);
  }, [queryText]);

  if (!open) return null;

  return (
    <div className="w-[420px] border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-white/80">Database Explorer</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.04] shrink-0">
        {([
          { id: 'schema' as const, label: 'Schema', icon: Table2 },
          { id: 'query' as const, label: 'Query', icon: Code2 },
          { id: 'migrations' as const, label: 'Migrations', icon: History },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={cn(
              "flex items-center gap-1 h-6 px-2.5 rounded text-[10px] font-medium transition-colors",
              activeView === tab.id ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/55"
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {!supabaseConfig ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-white/30 text-center">Connect Supabase in Settings to explore your database.</p>
        </div>
      ) : activeView === 'schema' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="px-2 py-1.5 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
              <Search className="h-3 w-3 text-white/20" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tables..."
                className="flex-1 bg-transparent text-[11px] text-white/70 placeholder:text-white/20 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Table list */}
            <div className="w-36 border-r border-white/[0.04] shrink-0">
              <ScrollArea className="h-full">
                <div className="py-1">
                  {filteredTables.map(t => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTable(t.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] transition-colors",
                        selectedTable === t.name
                          ? "bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-400"
                          : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
                      )}
                    >
                      <span className="font-mono truncate">{t.name}</span>
                      <span className="text-[8px] text-white/20">{t.rowCount}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Schema detail */}
            {table ? (
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-mono font-medium text-white/80">{table.name}</h3>
                    <span className="text-[9px] text-white/25">{table.rowCount} rows</span>
                  </div>

                  {/* Visual schema */}
                  <div className="space-y-0.5">
                    {table.columns.map(col => (
                      <div key={col.name} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.03] group">
                        <div className={cn(
                          "h-4 w-4 rounded flex items-center justify-center text-[8px] font-bold shrink-0",
                          col.isPrimary ? "bg-amber-500/20 text-amber-400" :
                          col.isForeign ? "bg-violet-500/20 text-violet-400" :
                          "bg-white/[0.06] text-white/30"
                        )}>
                          {col.isPrimary ? 'PK' : col.isForeign ? 'FK' : '#'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-white/70">{col.name}</span>
                            <span className="text-[8px] text-cyan-400/50 font-mono">{col.type}</span>
                            {col.nullable && <span className="text-[7px] text-white/15">NULL</span>}
                          </div>
                          {col.references && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <ArrowRight className="h-2 w-2 text-violet-400/40" />
                              <span className="text-[8px] text-violet-400/50 font-mono">{col.references}</span>
                            </div>
                          )}
                          {col.defaultValue && (
                            <span className="text-[8px] text-white/15">default: {col.defaultValue}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={() => { setQueryText(`SELECT * FROM ${table.name} LIMIT 25;`); setActiveView('query'); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] text-white/40 text-[9px] hover:text-white/60 hover:bg-white/[0.08] transition-colors"
                    >
                      <Eye className="h-2.5 w-2.5" /> View Data
                    </button>
                    <button
                      onClick={() => { setQueryText(`INSERT INTO ${table.name} (${table.columns.filter(c => !c.defaultValue).map(c => c.name).join(', ')}) VALUES ();`); setActiveView('query'); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] text-white/40 text-[9px] hover:text-white/60 hover:bg-white/[0.08] transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5" /> Insert
                    </button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[10px] text-white/20">Select a table to view schema</p>
              </div>
            )}
          </div>
        </div>
      ) : activeView === 'query' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Query editor */}
          <div className="p-2 border-b border-white/[0.04] shrink-0">
            <textarea
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              placeholder="SELECT * FROM ..."
              className="w-full h-20 bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] font-mono text-white/70 placeholder:text-white/15 outline-none resize-none focus:border-emerald-500/30"
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleRunQuery(); }}
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] text-white/15">⌘+Enter to run</span>
              <button
                onClick={handleRunQuery}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
              >
                <Play className={cn("h-3 w-3", isRunning && "animate-spin")} />
                {isRunning ? 'Running...' : 'Run Query'}
              </button>
            </div>
          </div>

          {/* Results */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {queryResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Code2 className="h-5 w-5 text-white/10 mb-2" />
                  <p className="text-[11px] text-white/25">Run a query to see results</p>
                </div>
              ) : (
                queryResults.map(result => (
                  <div key={result.id} className="border border-white/[0.06] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-white/[0.02] border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-[9px] text-white/40 font-mono truncate max-w-[180px]">{result.query}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[8px] text-white/20">
                        <span>{result.rowCount} rows</span>
                        <span>{result.duration}ms</span>
                      </div>
                    </div>
                    {/* Results grid */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/[0.04]">
                            {result.columns.map(col => (
                              <th key={col} className="px-2 py-1 text-[9px] text-white/30 font-mono font-medium text-left whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                              {result.columns.map(col => (
                                <td key={col} className="px-2 py-1 text-[9px] text-white/50 font-mono whitespace-nowrap">
                                  {row[col] === null ? <span className="text-white/15 italic">NULL</span> : String(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        /* Migrations view */
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Migration History</span>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] hover:bg-emerald-500/20 transition-colors">
                <Plus className="h-2.5 w-2.5" /> New Migration
              </button>
            </div>
            {MOCK_MIGRATIONS.map(migration => (
              <div key={migration.id} className="flex items-start gap-2.5 p-2 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  migration.status === 'applied' ? "bg-emerald-500/15 text-emerald-400" :
                  migration.status === 'pending' ? "bg-amber-500/15 text-amber-400" :
                  "bg-red-500/15 text-red-400"
                )}>
                  {migration.status === 'applied' ? <Check className="h-2.5 w-2.5" /> :
                   migration.status === 'pending' ? <Clock className="h-2.5 w-2.5" /> :
                   <X className="h-2.5 w-2.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-white/70">{migration.name}</p>
                  <p className="text-[9px] text-white/20 mt-0.5 font-mono truncate">{migration.sql}</p>
                  {migration.appliedAt && (
                    <p className="text-[8px] text-white/15 mt-0.5">Applied {migration.appliedAt.toLocaleDateString()}</p>
                  )}
                </div>
                <span className={cn(
                  "text-[8px] font-medium px-1.5 py-0.5 rounded shrink-0",
                  migration.status === 'applied' ? "bg-emerald-500/10 text-emerald-400" :
                  migration.status === 'pending' ? "bg-amber-500/10 text-amber-400" :
                  "bg-red-500/10 text-red-400"
                )}>
                  {migration.status}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
