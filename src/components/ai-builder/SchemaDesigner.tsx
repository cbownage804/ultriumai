import { useState, useCallback } from 'react';
import {
  X, Database, Plus, Trash2, GripVertical, Table2, Key, Link2,
  Copy, Check, ChevronDown, ChevronRight, Wand2, AlertCircle, Download,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ───
interface Column {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  reference?: { table: string; column: string };
}

interface TableSchema {
  id: string;
  name: string;
  columns: Column[];
  enableRLS: boolean;
  isExpanded: boolean;
}

interface SchemaDesignerProps {
  open: boolean;
  onClose: () => void;
  onGenerateSQL?: (sql: string) => void;
  onSendToChat?: (message: string) => void;
}

const COLUMN_TYPES = [
  'uuid', 'text', 'varchar(255)', 'integer', 'bigint', 'smallint',
  'boolean', 'timestamptz', 'timestamp', 'date', 'time',
  'numeric', 'real', 'double precision', 'jsonb', 'json',
  'bytea', 'serial', 'bigserial', 'inet', 'cidr',
];

const DEFAULT_COLUMN: () => Column = () => ({
  id: crypto.randomUUID(),
  name: '',
  type: 'text',
  nullable: true,
  defaultValue: '',
  isPrimaryKey: false,
  isUnique: false,
});

const DEFAULT_TABLE: () => TableSchema = () => ({
  id: crypto.randomUUID(),
  name: '',
  columns: [
    { id: crypto.randomUUID(), name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()', isPrimaryKey: true, isUnique: true },
    { id: crypto.randomUUID(), name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isUnique: false },
  ],
  enableRLS: true,
  isExpanded: true,
});

// ─── SQL Generator ───
function generateSQL(tables: TableSchema[]): string {
  const lines: string[] = [];

  for (const table of tables) {
    if (!table.name.trim()) continue;
    const tName = table.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    lines.push(`-- ═══ Table: ${tName} ═══`);
    lines.push(`CREATE TABLE IF NOT EXISTS public.${tName} (`);

    const colDefs: string[] = [];
    const pks: string[] = [];

    for (const col of table.columns) {
      if (!col.name.trim()) continue;
      let def = `  ${col.name} ${col.type}`;
      if (!col.nullable) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      if (col.isUnique && !col.isPrimaryKey) def += ' UNIQUE';
      colDefs.push(def);
      if (col.isPrimaryKey) pks.push(col.name);
    }

    if (pks.length > 0) {
      colDefs.push(`  PRIMARY KEY (${pks.join(', ')})`);
    }

    // Foreign keys
    for (const col of table.columns) {
      if (col.reference?.table && col.reference?.column) {
        colDefs.push(`  CONSTRAINT fk_${tName}_${col.name} FOREIGN KEY (${col.name}) REFERENCES public.${col.reference.table}(${col.reference.column})`);
      }
    }

    lines.push(colDefs.join(',\n'));
    lines.push(');');
    lines.push('');

    if (table.enableRLS) {
      lines.push(`ALTER TABLE public.${tName} ENABLE ROW LEVEL SECURITY;`);
      lines.push('');
      lines.push(`-- Example RLS policies (customize as needed)`);
      lines.push(`CREATE POLICY "Users can view own ${tName}" ON public.${tName}`);
      lines.push(`  FOR SELECT USING (auth.uid() = user_id);`);
      lines.push(`CREATE POLICY "Users can insert own ${tName}" ON public.${tName}`);
      lines.push(`  FOR INSERT WITH CHECK (auth.uid() = user_id);`);
      lines.push(`CREATE POLICY "Users can update own ${tName}" ON public.${tName}`);
      lines.push(`  FOR UPDATE USING (auth.uid() = user_id);`);
      lines.push(`CREATE POLICY "Users can delete own ${tName}" ON public.${tName}`);
      lines.push(`  FOR DELETE USING (auth.uid() = user_id);`);
      lines.push('');
    }

    // updated_at trigger
    const hasUpdatedAt = table.columns.some(c => c.name === 'updated_at');
    if (hasUpdatedAt) {
      lines.push(`CREATE OR REPLACE FUNCTION public.update_${tName}_updated_at()`);
      lines.push(`RETURNS TRIGGER AS $$`);
      lines.push(`BEGIN NEW.updated_at = now(); RETURN NEW; END;`);
      lines.push(`$$ LANGUAGE plpgsql;`);
      lines.push('');
      lines.push(`CREATE TRIGGER trg_${tName}_updated_at`);
      lines.push(`  BEFORE UPDATE ON public.${tName}`);
      lines.push(`  FOR EACH ROW EXECUTE FUNCTION public.update_${tName}_updated_at();`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ─── Conversational prompt builder ───
function buildConversationalPrompt(tables: TableSchema[]): string {
  const parts = ['Create the following database tables with Supabase migrations:\n'];
  for (const t of tables) {
    if (!t.name.trim()) continue;
    parts.push(`Table "${t.name}":`);
    for (const c of t.columns) {
      if (!c.name.trim()) continue;
      let desc = `  - ${c.name} (${c.type})`;
      if (c.isPrimaryKey) desc += ' [PRIMARY KEY]';
      if (!c.nullable) desc += ' NOT NULL';
      if (c.defaultValue) desc += ` DEFAULT ${c.defaultValue}`;
      if (c.reference) desc += ` → references ${c.reference.table}.${c.reference.column}`;
      parts.push(desc);
    }
    if (t.enableRLS) parts.push('  Enable RLS with user_id policies.');
    parts.push('');
  }
  return parts.join('\n');
}

// ─── Component ───
export function SchemaDesigner({ open, onClose, onGenerateSQL, onSendToChat }: SchemaDesignerProps) {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [sqlPreview, setSqlPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [conversationalInput, setConversationalInput] = useState('');

  const addTable = useCallback(() => {
    setTables(prev => [...prev, DEFAULT_TABLE()]);
  }, []);

  const removeTable = useCallback((id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTable = useCallback((id: string, updates: Partial<TableSchema>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const addColumn = useCallback((tableId: string) => {
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, columns: [...t.columns, DEFAULT_COLUMN()] } : t
    ));
  }, []);

  const removeColumn = useCallback((tableId: string, colId: string) => {
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, columns: t.columns.filter(c => c.id !== colId) } : t
    ));
  }, []);

  const updateColumn = useCallback((tableId: string, colId: string, updates: Partial<Column>) => {
    setTables(prev => prev.map(t =>
      t.id === tableId
        ? { ...t, columns: t.columns.map(c => c.id === colId ? { ...c, ...updates } : c) }
        : t
    ));
  }, []);

  const handlePreviewSQL = () => {
    if (tables.length === 0) { toast.error('Add at least one table'); return; }
    const sql = generateSQL(tables);
    setSqlPreview(sql);
  };

  const handleCopySQL = () => {
    if (!sqlPreview) return;
    navigator.clipboard.writeText(sqlPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('SQL copied to clipboard');
  };

  const handleSendToChat = () => {
    if (tables.length === 0) return;
    const prompt = buildConversationalPrompt(tables);
    onSendToChat?.(prompt);
    toast.success('Schema sent to chat — the AI will generate migrations');
    onClose();
  };

  const handleConversationalCreate = () => {
    if (!conversationalInput.trim()) return;
    onSendToChat?.(`Create database tables from this description:\n\n${conversationalInput.trim()}\n\nGenerate the full SQL migration with RLS policies.`);
    setConversationalInput('');
    toast.success('Sent to AI for schema generation');
    onClose();
  };

  const handleApplySQL = () => {
    if (!sqlPreview) return;
    onGenerateSQL?.(sqlPreview);
    toast.success('SQL generated — apply via Supabase migrations');
  };

  const allTableNames = tables.map(t => t.name).filter(Boolean);

  if (!open) return null;

  return (
    <div className="w-96 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Table2 className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-medium text-white/80">Schema Designer</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Conversational input */}
      <div className="px-3 py-2 border-b border-white/[0.06]">
        <p className="text-[10px] text-white/30 mb-1.5">Describe your schema in plain English</p>
        <div className="flex gap-1.5">
          <Input
            value={conversationalInput}
            onChange={e => setConversationalInput(e.target.value)}
            placeholder="e.g. Blog with posts, comments, and tags..."
            className="flex-1 h-7 text-[11px] bg-white/5 border-white/[0.08] text-white/80 placeholder:text-white/15"
            onKeyDown={e => e.key === 'Enter' && handleConversationalCreate()}
          />
          <Button
            size="sm"
            onClick={handleConversationalCreate}
            disabled={!conversationalInput.trim()}
            className="h-7 px-2 text-[10px] bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border-0"
          >
            <Wand2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {tables.length === 0 && (
            <div className="text-center py-8">
              <Table2 className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/25 mb-3">No tables yet</p>
              <Button size="sm" onClick={addTable} className="h-7 text-[11px] bg-white/5 text-white/50 hover:bg-white/10 border border-white/[0.08]">
                <Plus className="h-3 w-3 mr-1" /> Add Table
              </Button>
            </div>
          )}

          {tables.map(table => (
            <div key={table.id} className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
              {/* Table header */}
              <div className="flex items-center gap-2 px-2.5 py-2 bg-white/[0.03]">
                <button onClick={() => updateTable(table.id, { isExpanded: !table.isExpanded })} className="text-white/30 hover:text-white/60">
                  {table.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                <Table2 className="h-3 w-3 text-violet-400 shrink-0" />
                <input
                  value={table.name}
                  onChange={e => updateTable(table.id, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="table_name"
                  className="flex-1 text-[11px] font-mono bg-transparent text-white/80 outline-none placeholder:text-white/15"
                />
                <label className="flex items-center gap-1 text-[9px] text-white/30 cursor-pointer shrink-0">
                  <input type="checkbox" checked={table.enableRLS} onChange={e => updateTable(table.id, { enableRLS: e.target.checked })} className="h-2.5 w-2.5 rounded" />
                  RLS
                </label>
                <button onClick={() => removeTable(table.id)} className="h-4 w-4 rounded flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Columns */}
              {table.isExpanded && (
                <div className="px-2 py-1.5 space-y-1">
                  {/* Column headers */}
                  <div className="flex items-center gap-1 px-1 text-[8px] text-white/20 uppercase tracking-wider">
                    <span className="w-24">Name</span>
                    <span className="w-24">Type</span>
                    <span className="w-8 text-center">PK</span>
                    <span className="w-8 text-center">Null</span>
                    <span className="flex-1">Default</span>
                  </div>

                  {table.columns.map(col => (
                    <div key={col.id} className="flex items-center gap-1 group">
                      <input
                        value={col.name}
                        onChange={e => updateColumn(table.id, col.id, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                        placeholder="column"
                        className="w-24 h-6 px-1 text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] rounded text-white/70 outline-none focus:border-violet-500/30 placeholder:text-white/10"
                      />
                      <select
                        value={col.type}
                        onChange={e => updateColumn(table.id, col.id, { type: e.target.value })}
                        className="w-24 h-6 px-1 text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] rounded text-white/70 outline-none focus:border-violet-500/30 appearance-none"
                      >
                        {COLUMN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="w-8 flex justify-center">
                        <input
                          type="checkbox"
                          checked={col.isPrimaryKey}
                          onChange={e => updateColumn(table.id, col.id, { isPrimaryKey: e.target.checked })}
                          className="h-3 w-3"
                          title="Primary Key"
                        />
                      </div>
                      <div className="w-8 flex justify-center">
                        <input
                          type="checkbox"
                          checked={col.nullable}
                          onChange={e => updateColumn(table.id, col.id, { nullable: e.target.checked })}
                          className="h-3 w-3"
                          title="Nullable"
                        />
                      </div>
                      <input
                        value={col.defaultValue}
                        onChange={e => updateColumn(table.id, col.id, { defaultValue: e.target.value })}
                        placeholder="default"
                        className="flex-1 h-6 px-1 text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] rounded text-white/60 outline-none focus:border-violet-500/30 placeholder:text-white/10 min-w-0"
                      />
                      {/* FK reference */}
                      {col.type === 'uuid' && !col.isPrimaryKey && allTableNames.length > 0 && (
                        <select
                          value={col.reference?.table || ''}
                          onChange={e => updateColumn(table.id, col.id, {
                            reference: e.target.value ? { table: e.target.value, column: 'id' } : undefined
                          })}
                          className="w-16 h-6 px-0.5 text-[9px] font-mono bg-white/[0.03] border border-white/[0.06] rounded text-cyan-400/60 outline-none appearance-none"
                          title="Foreign key reference"
                        >
                          <option value="">FK?</option>
                          {allTableNames.filter(n => n !== table.name).map(n => <option key={n} value={n}>→ {n}</option>)}
                        </select>
                      )}
                      <button
                        onClick={() => removeColumn(table.id, col.id)}
                        className="h-4 w-4 rounded flex items-center justify-center text-white/10 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                      >
                        <Trash2 className="h-2 w-2" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addColumn(table.id)}
                    className="flex items-center gap-1 text-[10px] text-white/20 hover:text-white/40 px-1 py-0.5 transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5" /> Add column
                  </button>
                </div>
              )}
            </div>
          ))}

          {tables.length > 0 && (
            <button
              onClick={addTable}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] text-white/25 hover:text-white/40 py-2 border border-dashed border-white/[0.06] rounded-lg hover:border-white/[0.12] transition-colors"
            >
              <Plus className="h-3 w-3" /> Add another table
            </button>
          )}
        </div>

        {/* SQL Preview */}
        {sqlPreview && (
          <div className="mx-3 mb-3 rounded-lg border border-white/[0.08] bg-black/30 overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.06] bg-white/[0.02]">
              <span className="text-[10px] text-white/30 font-medium">Generated SQL</span>
              <div className="flex items-center gap-1">
                <button onClick={handleCopySQL} className="h-5 px-1.5 rounded flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 hover:bg-white/5">
                  {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={() => setSqlPreview(null)} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/40">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
            <pre className="p-2.5 text-[10px] font-mono text-emerald-400/80 whitespace-pre-wrap max-h-64 overflow-auto leading-relaxed">
              {sqlPreview}
            </pre>
          </div>
        )}
      </ScrollArea>

      {/* Actions */}
      {tables.length > 0 && (
        <div className="px-3 py-2 border-t border-white/[0.06] space-y-1.5 shrink-0">
          <Button
            size="sm"
            onClick={handlePreviewSQL}
            className="w-full h-7 text-[11px] bg-white/5 text-white/60 hover:bg-white/10 border border-white/[0.08]"
          >
            <Database className="h-3 w-3 mr-1.5" /> Preview SQL
          </Button>
          <Button
            size="sm"
            onClick={handleSendToChat}
            className="w-full h-7 text-[11px] bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border-0"
          >
            <Wand2 className="h-3 w-3 mr-1.5" /> Send to AI Chat
          </Button>
          {sqlPreview && onGenerateSQL && (
            <Button
              size="sm"
              onClick={handleApplySQL}
              className="w-full h-7 text-[11px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-0"
            >
              <Download className="h-3 w-3 mr-1.5" /> Export SQL
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
