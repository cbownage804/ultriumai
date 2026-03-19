import { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, Plus, Trash2, Download, Save, X, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

interface CloudDatabasePanelProps {
  supabaseUrl: string;
  supabaseKey: string;
  onRefreshTypes?: () => void;
}

interface TableInfo {
  name: string;
  schema: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export function CloudDatabasePanel({ supabaseUrl, supabaseKey, onRefreshTypes }: CloudDatabasePanelProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newRow, setNewRow] = useState<Record<string, string> | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const client = createClient(supabaseUrl, supabaseKey);

  // Fetch tables
  useEffect(() => {
    async function fetchTables() {
      const { data, error } = await client.rpc('pg_tables_list').select();
      if (error) {
        // Fallback: query information_schema
        const { data: fallback } = await client
          .from('information_schema.tables' as any)
          .select('table_name')
          .eq('table_schema', 'public')
          .neq('table_name', 'schema_migrations');
        
        if (fallback) {
          setTables(fallback.map((t: any) => ({ name: t.table_name, schema: 'public' })));
        } else {
          // Last fallback: just try common approach
          try {
            const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (resp.ok) {
              const defs = await resp.json();
              if (defs?.definitions) {
                setTables(Object.keys(defs.definitions).map(n => ({ name: n, schema: 'public' })));
              }
            }
          } catch {}
        }
        return;
      }
      if (data) setTables(data);
    }
    fetchTables();
  }, [supabaseUrl, supabaseKey]);

  // Fallback: try OpenAPI spec to list tables
  useEffect(() => {
    if (tables.length > 0) return;
    async function fetchFromOpenAPI() {
      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        if (resp.ok) {
          const spec = await resp.json();
          if (spec?.paths) {
            const names = Object.keys(spec.paths)
              .map(p => p.replace(/^\//, ''))
              .filter(n => n && !n.includes('/') && n !== 'rpc');
            setTables(names.map(n => ({ name: n, schema: 'public' })));
          }
        }
      } catch {}
    }
    fetchFromOpenAPI();
  }, [tables.length, supabaseUrl, supabaseKey]);

  // Fetch rows when table selected
  const fetchRows = useCallback(async (tableName: string) => {
    setLoading(true);
    try {
      const { data, error, count } = await client
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(100);
      if (error) {
        toast.error(`Failed to load ${tableName}: ${error.message}`);
      } else {
        setRows(data || []);
        setTotalCount(count ?? data?.length ?? 0);
        // Infer columns from data
        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]).map(k => ({
            column_name: k,
            data_type: typeof data[0][k] === 'number' ? 'numeric' : typeof data[0][k] === 'boolean' ? 'boolean' : 'text',
            is_nullable: 'YES',
            column_default: null,
          })));
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    if (selectedTable) {
      fetchRows(selectedTable);
      setEditingCell(null);
      setNewRow(null);
    }
  }, [selectedTable]);

  // Save cell edit
  const handleSaveCell = useCallback(async () => {
    if (!editingCell || !selectedTable) return;
    const row = rows[editingCell.rowIdx];
    const pk = columns[0]?.column_name || 'id';
    const pkValue = row[pk];
    
    let parsedValue: any = editValue;
    if (editValue === 'null' || editValue === '') parsedValue = null;
    else if (editValue === 'true') parsedValue = true;
    else if (editValue === 'false') parsedValue = false;
    else if (!isNaN(Number(editValue)) && editValue.trim() !== '') parsedValue = Number(editValue);

    const { error } = await client
      .from(selectedTable)
      .update({ [editingCell.col]: parsedValue })
      .eq(pk, pkValue);

    if (error) {
      toast.error(`Update failed: ${error.message}`);
    } else {
      toast.success('Row updated');
      fetchRows(selectedTable);
    }
    setEditingCell(null);
  }, [editingCell, editValue, selectedTable, rows, columns, client, fetchRows]);

  // Insert new row
  const handleInsertRow = useCallback(async () => {
    if (!newRow || !selectedTable) return;
    const parsed: Record<string, any> = {};
    for (const [k, v] of Object.entries(newRow)) {
      if (v === '' || v === undefined) continue;
      if (v === 'null') { parsed[k] = null; continue; }
      if (v === 'true') { parsed[k] = true; continue; }
      if (v === 'false') { parsed[k] = false; continue; }
      if (!isNaN(Number(v)) && v.trim() !== '') { parsed[k] = Number(v); continue; }
      parsed[k] = v;
    }
    const { error } = await client.from(selectedTable).insert(parsed);
    if (error) {
      toast.error(`Insert failed: ${error.message}`);
    } else {
      toast.success('Row inserted');
      setNewRow(null);
      fetchRows(selectedTable);
    }
  }, [newRow, selectedTable, client, fetchRows]);

  // Delete row
  const handleDeleteRow = useCallback(async (rowIdx: number) => {
    if (!selectedTable) return;
    const row = rows[rowIdx];
    const pk = columns[0]?.column_name || 'id';
    const pkValue = row[pk];
    const { error } = await client.from(selectedTable).delete().eq(pk, pkValue);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
    } else {
      toast.success('Row deleted');
      fetchRows(selectedTable);
    }
  }, [selectedTable, rows, columns, client, fetchRows]);

  // Export CSV
  const handleExport = useCallback(() => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${selectedTable}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [rows, selectedTable]);

  return (
    <div className="flex h-full">
      {/* Table list sidebar */}
      <div className="w-48 shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="px-3 py-2 text-[10px] text-white/20 uppercase tracking-wider font-medium border-b border-white/[0.06]">
          Tables ({tables.length})
        </div>
        <ScrollArea className="flex-1">
          {tables.map(t => (
            <button
              key={t.name}
              onClick={() => setSelectedTable(t.name)}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs font-mono transition-colors",
                selectedTable === t.name
                  ? "bg-violet-500/15 text-violet-300"
                  : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
              )}
            >
              {t.name}
            </button>
          ))}
          {tables.length === 0 && (
            <p className="px-3 py-4 text-[10px] text-white/20">No tables found</p>
          )}
        </ScrollArea>
      </div>

      {/* Data area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedTable ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Database className="h-8 w-8 text-white/10 mx-auto" />
              <p className="text-xs text-white/30">Select a table to view data</p>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
              <span className="text-xs font-mono text-white/60">{selectedTable} <span className="text-white/20">({totalCount} rows)</span></span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-white/40 hover:text-white/70" onClick={() => fetchRows(selectedTable)}>
                  <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-white/40 hover:text-white/70" onClick={() => setNewRow(Object.fromEntries(columns.map(c => [c.column_name, ''])))}>
                  <Plus className="h-3 w-3 mr-1" /> Insert
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-white/40 hover:text-white/70" onClick={handleExport}>
                  <Download className="h-3 w-3 mr-1" /> CSV
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white/20" />
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="min-w-max">
                  {/* Column headers */}
                  <div className="flex border-b border-white/[0.08] bg-white/[0.02] sticky top-0 z-10">
                    {columns.map(col => (
                      <div key={col.column_name} className="px-3 py-1.5 min-w-[140px] max-w-[220px] shrink-0">
                        <div className="text-[10px] font-mono text-white/50 truncate">{col.column_name}</div>
                        <div className="text-[8px] text-white/20">{col.data_type}</div>
                      </div>
                    ))}
                    <div className="w-8 shrink-0" />
                  </div>

                  {/* New row form */}
                  {newRow && (
                    <div className="flex border-b border-emerald-500/20 bg-emerald-500/5">
                      {columns.map(col => (
                        <div key={col.column_name} className="px-2 py-1 min-w-[140px] max-w-[220px] shrink-0">
                          <input
                            value={newRow[col.column_name] || ''}
                            onChange={e => setNewRow({ ...newRow, [col.column_name]: e.target.value })}
                            placeholder={col.column_default ? 'auto' : col.column_name}
                            className="w-full text-[10px] bg-white/5 border border-emerald-500/30 rounded px-1.5 py-0.5 text-white/80 outline-none font-mono placeholder:text-white/15"
                          />
                        </div>
                      ))}
                      <div className="px-1 py-1 w-8 shrink-0 flex items-center gap-0.5">
                        <button onClick={handleInsertRow} className="h-4 w-4 rounded flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20">
                          <Save className="h-2.5 w-2.5" />
                        </button>
                        <button onClick={() => setNewRow(null)} className="h-4 w-4 rounded flex items-center justify-center text-white/30 hover:text-white/60">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Data rows */}
                  {rows.map((row, ri) => (
                    <div key={ri} className="flex border-b border-white/[0.04] hover:bg-white/[0.02] group">
                      {columns.map(col => (
                        <div
                          key={col.column_name}
                          className="px-3 py-1 min-w-[140px] max-w-[220px] shrink-0 cursor-pointer"
                          onDoubleClick={() => { setEditingCell({ rowIdx: ri, col: col.column_name }); setEditValue(String(row[col.column_name] ?? '')); }}
                        >
                          {editingCell?.rowIdx === ri && editingCell?.col === col.column_name ? (
                            <input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveCell(); if (e.key === 'Escape') setEditingCell(null); }}
                              onBlur={handleSaveCell}
                              className="w-full text-[10px] bg-white/5 border border-cyan-500/30 rounded px-1 py-0.5 text-white/90 outline-none font-mono"
                              autoFocus
                            />
                          ) : (
                            <span className={cn(
                              "text-[10px] font-mono truncate block",
                              row[col.column_name] === null ? "text-white/15 italic" : "text-white/60"
                            )}>
                              {row[col.column_name] === null ? 'NULL' : String(row[col.column_name]).slice(0, 60)}
                            </span>
                          )}
                        </div>
                      ))}
                      <div className="px-1 py-1 w-8 shrink-0 flex items-center">
                        <button
                          onClick={() => handleDeleteRow(ri)}
                          className="h-4 w-4 rounded flex items-center justify-center text-white/10 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {rows.length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-white/20">No rows</div>
                  )}
                </div>
              </ScrollArea>
            )}

            <div className="px-3 py-1 border-t border-white/[0.06] text-[9px] text-white/20 shrink-0">
              {columns.length} columns · Showing {rows.length} of {totalCount} rows · Double-click to edit
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CloudDatabasePanel;
