import { useState, useCallback } from 'react';
import { X, Database, Plus, Trash2, RefreshCw, Download, Edit2, Check, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
}

interface DatabasePanelProps {
  open: boolean;
  onClose: () => void;
  supabaseConfig: { url: string; anonKey: string } | null;
}

// Mock tables for demo
const MOCK_TABLES = [
  { name: 'users', rowCount: 24, columns: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'email', type: 'text', nullable: false },
    { name: 'name', type: 'text', nullable: true },
    { name: 'created_at', type: 'timestamptz', nullable: false },
  ]},
  { name: 'posts', rowCount: 87, columns: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'title', type: 'text', nullable: false },
    { name: 'content', type: 'text', nullable: true },
    { name: 'user_id', type: 'uuid', nullable: false },
    { name: 'published', type: 'boolean', nullable: false },
    { name: 'created_at', type: 'timestamptz', nullable: false },
  ]},
  { name: 'comments', rowCount: 156, columns: [
    { name: 'id', type: 'uuid', nullable: false },
    { name: 'body', type: 'text', nullable: false },
    { name: 'post_id', type: 'uuid', nullable: false },
    { name: 'user_id', type: 'uuid', nullable: false },
    { name: 'created_at', type: 'timestamptz', nullable: false },
  ]},
];

const MOCK_ROWS: Record<string, Record<string, any>[]> = {
  users: [
    { id: 'a1b2c3', email: 'alice@example.com', name: 'Alice', created_at: '2024-01-15T10:30:00Z' },
    { id: 'd4e5f6', email: 'bob@example.com', name: 'Bob', created_at: '2024-02-20T14:15:00Z' },
    { id: 'g7h8i9', email: 'charlie@example.com', name: null, created_at: '2024-03-10T09:00:00Z' },
  ],
  posts: [
    { id: 'p1', title: 'Getting Started', content: 'Welcome to...', user_id: 'a1b2c3', published: true, created_at: '2024-01-16T12:00:00Z' },
    { id: 'p2', title: 'Advanced Tips', content: 'Here are some...', user_id: 'd4e5f6', published: false, created_at: '2024-02-21T16:30:00Z' },
  ],
  comments: [
    { id: 'c1', body: 'Great post!', post_id: 'p1', user_id: 'd4e5f6', created_at: '2024-01-17T08:00:00Z' },
  ],
};

export function DatabasePanel({ open, onClose, supabaseConfig }: DatabasePanelProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const table = MOCK_TABLES.find(t => t.name === selectedTable);
  const rows = selectedTable ? (MOCK_ROWS[selectedTable] || []) : [];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setIsRefreshing(false);
    toast.success('Table refreshed');
  }, []);

  const handleExport = useCallback(() => {
    if (!selectedTable || rows.length === 0) return;
    const csv = [
      Object.keys(rows[0]).join(','),
      ...rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedTable}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  }, [selectedTable, rows]);

  const handleCellEdit = useCallback((row: number, col: string, value: string) => {
    setEditingCell({ row, col });
    setEditValue(value);
  }, []);

  const handleCellSave = useCallback(() => {
    if (editingCell) {
      toast.success(`Updated ${editingCell.col}`);
      setEditingCell(null);
    }
  }, [editingCell]);

  if (!open) return null;

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-white/80">Database</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      {!supabaseConfig ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-white/30 text-center">Connect Supabase in Settings to view your database tables.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Table list */}
          <div className="border-b border-white/[0.06]">
            <div className="px-3 py-1.5 text-[10px] text-white/20 uppercase tracking-wider font-medium">Tables</div>
            <ScrollArea className="max-h-32">
              {MOCK_TABLES.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors",
                    selectedTable === t.name ? "bg-white/[0.06] text-white/90" : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
                  )}
                >
                  <span className="font-mono">{t.name}</span>
                  <span className="text-[9px] text-white/20">{t.rowCount} rows</span>
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Data grid */}
          {table ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] shrink-0">
                <span className="text-[11px] font-mono text-white/60">{table.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={handleRefresh} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
                    <RefreshCw className={cn("h-2.5 w-2.5", isRefreshing && "animate-spin")} />
                  </button>
                  <button onClick={() => toast.success('Row added (simulated)')} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                  <button onClick={handleExport} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
                    <Download className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="min-w-max">
                  {/* Header */}
                  <div className="flex border-b border-white/[0.06] bg-white/[0.02] sticky top-0">
                    {table.columns.map(col => (
                      <div key={col.name} className="px-2 py-1 min-w-[100px] max-w-[150px] shrink-0">
                        <div className="text-[10px] font-mono text-white/50 truncate">{col.name}</div>
                        <div className="text-[8px] text-white/20">{col.type}{col.nullable ? '?' : ''}</div>
                      </div>
                    ))}
                    <div className="px-2 py-1 w-8 shrink-0" />
                  </div>

                  {/* Rows */}
                  {rows.map((row, ri) => (
                    <div key={ri} className="flex border-b border-white/[0.04] hover:bg-white/[0.02] group">
                      {table.columns.map(col => (
                        <div
                          key={col.name}
                          className="px-2 py-1 min-w-[100px] max-w-[150px] shrink-0 cursor-pointer"
                          onDoubleClick={() => handleCellEdit(ri, col.name, String(row[col.name] ?? ''))}
                        >
                          {editingCell?.row === ri && editingCell?.col === col.name ? (
                            <div className="flex items-center gap-0.5">
                              <input
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCellSave()}
                                onBlur={handleCellSave}
                                className="w-full text-[10px] bg-white/5 border border-cyan-500/30 rounded px-1 py-0.5 text-white/90 outline-none font-mono"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className={cn(
                              "text-[10px] font-mono truncate block",
                              row[col.name] === null ? "text-white/15 italic" : "text-white/60"
                            )}>
                              {row[col.name] === null ? 'NULL' : String(row[col.name])}
                            </span>
                          )}
                        </div>
                      ))}
                      <div className="px-1 py-1 w-8 shrink-0 flex items-center">
                        <button
                          onClick={() => toast.success('Row deleted (simulated)')}
                          className="h-4 w-4 rounded flex items-center justify-center text-white/10 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Column info */}
              <div className="px-3 py-1.5 border-t border-white/[0.06] text-[9px] text-white/20 shrink-0">
                {table.columns.length} columns · {rows.length} rows shown
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-white/20">Select a table</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
