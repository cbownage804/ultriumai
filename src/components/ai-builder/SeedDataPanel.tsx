import { X, Database, Play, Copy, Plus, Trash2 } from 'lucide-react';
import type { SeedConfig, SeedResult } from '@/hooks/useSeedDataGenerator';
import { useState } from 'react';

interface SeedDataPanelProps {
  open: boolean;
  onClose: () => void;
  configs: SeedConfig[];
  results: SeedResult[];
  isGenerating: boolean;
  availableGenerators: string[];
  onAddConfig: (config: SeedConfig) => void;
  onRemoveConfig: (tableName: string) => void;
  onGenerateAll: () => void;
  onApplySQL: (sql: string) => void;
}

export function SeedDataPanel({ open, onClose, configs, results, isGenerating, availableGenerators, onAddConfig, onRemoveConfig, onGenerateAll, onApplySQL }: SeedDataPanelProps) {
  const [tableName, setTableName] = useState('');
  const [rowCount, setRowCount] = useState(10);
  const [columns, setColumns] = useState<{ name: string; type: string; generator: string }[]>([
    { name: 'id', type: 'uuid', generator: 'uuid' },
    { name: 'name', type: 'text', generator: 'name' },
    { name: 'email', type: 'text', generator: 'email' },
  ]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[650px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-white">Seed Data Generator</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={tableName} onChange={e => setTableName(e.target.value)} placeholder="Table name" className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
              <input type="number" value={rowCount} onChange={e => setRowCount(Number(e.target.value))} min={1} max={1000} className="w-20 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
              <span className="text-[10px] text-white/30 self-center">rows</span>
            </div>

            {columns.map((col, i) => (
              <div key={i} className="flex gap-1 items-center">
                <input value={col.name} onChange={e => { const c = [...columns]; c[i].name = e.target.value; setColumns(c); }} placeholder="column" className="flex-1 h-6 px-2 bg-black/20 border border-white/[0.06] rounded text-[10px] text-white/70" />
                <select value={col.generator} onChange={e => { const c = [...columns]; c[i].generator = e.target.value; setColumns(c); }} className="w-24 h-6 px-1 bg-black/20 border border-white/[0.06] rounded text-[10px] text-white/70">
                  {availableGenerators.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <button onClick={() => setColumns(columns.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            <button onClick={() => setColumns([...columns, { name: '', type: 'text', generator: 'text' }])} className="flex items-center gap-1 text-[10px] text-violet-400/60 hover:text-violet-300">
              <Plus className="h-3 w-3" /> Add Column
            </button>

            <button
              onClick={() => { if (tableName) { onAddConfig({ tableName, rowCount, columns: columns.filter(c => c.name) }); setTableName(''); } }}
              disabled={!tableName}
              className="px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded text-xs hover:bg-violet-500/30 disabled:opacity-30"
            >
              Add to Queue
            </button>
          </div>

          {configs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Queue ({configs.length} tables)</span>
                <button onClick={onGenerateAll} disabled={isGenerating} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded text-xs hover:bg-emerald-500/30 disabled:opacity-30">
                  <Play className="h-3 w-3" /> {isGenerating ? 'Generating...' : 'Generate All'}
                </button>
              </div>
              {configs.map(c => (
                <div key={c.tableName} className="flex items-center justify-between p-2 bg-black/20 rounded text-[11px]">
                  <span className="text-white/60">{c.tableName} ({c.rowCount} rows, {c.columns.length} cols)</span>
                  <button onClick={() => onRemoveConfig(c.tableName)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-white/[0.06]">
              <span className="text-xs text-white/50">Generated SQL</span>
              {results.map(r => (
                <div key={r.tableName} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400/60">{r.tableName} — {r.rowCount} rows</span>
                    <div className="flex gap-1">
                      <button onClick={() => navigator.clipboard.writeText(r.sql)} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
                      <button onClick={() => onApplySQL(r.sql)} className="text-[9px] text-emerald-400/60 hover:text-emerald-300">Apply</button>
                    </div>
                  </div>
                  <pre className="bg-black/40 rounded p-2 text-[9px] font-mono text-white/40 overflow-auto max-h-20">{r.sql.slice(0, 500)}{r.sql.length > 500 ? '...' : ''}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
