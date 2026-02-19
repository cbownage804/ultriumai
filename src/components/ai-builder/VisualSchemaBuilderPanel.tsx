import { X, Plus, Trash2, Download, Database, Link } from 'lucide-react';
import type { SchemaTable } from '@/hooks/useVisualSchemaBuilder';
import { useState } from 'react';

interface VisualSchemaBuilderPanelProps {
  open: boolean;
  onClose: () => void;
  tables: SchemaTable[];
  selectedTable: string | null;
  columnTypes: string[];
  onAddTable: (name: string, x?: number, y?: number) => void;
  onRemoveTable: (id: string) => void;
  onSelectTable: (id: string | null) => void;
  onAddColumn: (tableId: string, name: string, type: string) => void;
  onRemoveColumn: (tableId: string, columnId: string) => void;
  onAddRelation: (src: string, srcCol: string, tgt: string, tgtCol: string) => void;
  exportSQL: string;
  onApplySQL: (sql: string) => void;
}

export function VisualSchemaBuilderPanel({ open, onClose, tables, selectedTable, columnTypes, onAddTable, onRemoveTable, onSelectTable, onAddColumn, onRemoveColumn, onAddRelation, exportSQL, onApplySQL }: VisualSchemaBuilderPanelProps) {
  const [newTableName, setNewTableName] = useState('');
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('text');

  if (!open) return null;
  const activeTable = tables.find(t => t.id === selectedTable);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[800px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">Visual Schema Builder (ERD)</span>
            <span className="text-[10px] text-white/20">{tables.length} tables</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tables list */}
          <div className="w-56 border-r border-white/[0.06] p-3 space-y-2 overflow-y-auto">
            <div className="flex gap-1">
              <input value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Table name" className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
              <button onClick={() => { if (newTableName) { onAddTable(newTableName); setNewTableName(''); } }} className="h-7 w-7 flex items-center justify-center bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {tables.map(t => (
              <div key={t.id} className="group">
                <button
                  onClick={() => onSelectTable(t.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between ${selectedTable === t.id ? 'bg-emerald-500/10 text-emerald-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <Database className="h-3 w-3" />
                    {t.name}
                  </span>
                  <span className="text-[9px] text-white/20">{t.columns.length} cols</span>
                </button>
                <button onClick={() => onRemoveTable(t.id)} className="hidden group-hover:block absolute right-2 text-white/20 hover:text-red-400">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Table detail / ERD canvas */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeTable ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">{activeTable.name}</h3>
                  <button onClick={() => onRemoveTable(activeTable.id)} className="text-xs text-red-400/50 hover:text-red-400">Delete Table</button>
                </div>

                <div className="space-y-1">
                  {activeTable.columns.map(col => (
                    <div key={col.id} className="flex items-center gap-2 p-2 bg-black/20 rounded text-[11px]">
                      {col.isPrimaryKey && <span className="text-amber-400 text-[9px]">PK</span>}
                      {col.isForeignKey && <Link className="h-3 w-3 text-blue-400/50" />}
                      <span className="text-white/70 font-medium">{col.name}</span>
                      <span className="text-white/30">{col.type}</span>
                      {!col.isNullable && <span className="text-[9px] text-red-400/40">NOT NULL</span>}
                      {col.defaultValue && <span className="text-[9px] text-white/20">= {col.defaultValue}</span>}
                      {!col.isPrimaryKey && (
                        <button onClick={() => onRemoveColumn(activeTable.id, col.id)} className="ml-auto text-white/15 hover:text-red-400">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-1">
                  <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Column name" className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-[10px] text-white/80" />
                  <select value={newColType} onChange={e => setNewColType(e.target.value)} className="w-28 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-[10px] text-white/80">
                    {columnTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => { if (newColName) { onAddColumn(activeTable.id, newColName, newColType); setNewColName(''); } }} className="h-7 w-7 flex items-center justify-center bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
                <Database className="h-8 w-8" />
                <p className="text-xs">Select or create a table to begin</p>
              </div>
            )}

            {exportSQL && (
              <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                <span className="text-[10px] text-white/30">Generated SQL Migration</span>
                <pre className="bg-black/40 rounded-lg p-3 text-[10px] font-mono text-white/50 overflow-auto max-h-40">{exportSQL}</pre>
                <button onClick={() => onApplySQL(exportSQL)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded text-xs hover:bg-emerald-500/30">
                  <Download className="h-3 w-3" /> Apply Migration
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
