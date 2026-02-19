import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Code, Grid3X3, Copy } from 'lucide-react';
import type { GridConfig, GridArea } from '@/hooks/useLayoutGridEditor';

interface Props {
  layouts: GridConfig[];
  activeLayout: GridConfig | null;
  presets: string[];
  onCreateLayout: (name: string, mode?: 'grid' | 'flex') => void;
  onSetActiveLayout: (id: string) => void;
  onApplyPreset: (layoutId: string, preset: string) => void;
  onAddArea: (layoutId: string) => void;
  onUpdateArea: (layoutId: string, areaId: string, updates: Partial<GridArea>) => void;
  onRemoveArea: (layoutId: string, areaId: string) => void;
  onUpdateLayout: (layoutId: string, updates: Partial<GridConfig>) => void;
  onGenerateCSS: (layoutId: string) => string;
  onGenerateTailwind: (layoutId: string) => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function LayoutGridPanel({ layouts, activeLayout, presets, onCreateLayout, onSetActiveLayout, onApplyPreset, onAddArea, onUpdateArea, onRemoveArea, onUpdateLayout, onGenerateCSS, onGenerateTailwind, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Layout Grid Editor</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 uppercase tracking-wider">Layouts</span>
              <div className="flex gap-1">
                <button onClick={() => onCreateLayout(`Grid ${layouts.length + 1}`, 'grid')} className="text-[10px] text-cyan-400 hover:text-cyan-300 px-1.5 py-0.5 bg-cyan-500/10 rounded">+ Grid</button>
                <button onClick={() => onCreateLayout(`Flex ${layouts.length + 1}`, 'flex')} className="text-[10px] text-violet-400 hover:text-violet-300 px-1.5 py-0.5 bg-violet-500/10 rounded">+ Flex</button>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {layouts.map(l => (
                <button key={l.id} onClick={() => onSetActiveLayout(l.id)} className={`text-xs px-2 py-1 rounded ${activeLayout?.id === l.id ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-white/50'}`}>{l.name}</button>
              ))}
            </div>
          </div>

          {activeLayout && (
            <>
              {/* Presets */}
              <div className="space-y-2">
                <span className="text-xs text-white/50 uppercase tracking-wider">Presets</span>
                <div className="flex gap-1 flex-wrap">
                  {presets.map(p => (
                    <button key={p} onClick={() => onApplyPreset(activeLayout.id, p)} className="text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 text-white/60">{p}</button>
                  ))}
                </div>
              </div>

              {/* Grid config */}
              {activeLayout.mode === 'grid' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-white/40">Columns</span>
                    <input type="number" value={activeLayout.columns} onChange={e => onUpdateLayout(activeLayout.id, { columns: Number(e.target.value) })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40">Rows</span>
                    <input type="number" value={activeLayout.rows} onChange={e => onUpdateLayout(activeLayout.id, { rows: Number(e.target.value) })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40">Gap</span>
                    <input type="number" value={activeLayout.gap} onChange={e => onUpdateLayout(activeLayout.id, { gap: Number(e.target.value) })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
                  </div>
                </div>
              )}

              {/* Visual preview */}
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${activeLayout.columns}, 1fr)`, gridTemplateRows: `repeat(${activeLayout.rows}, 40px)` }}>
                  {activeLayout.areas.map(area => (
                    <div key={area.id} className="rounded text-[9px] text-white/60 flex items-center justify-center" style={{ gridColumn: area.gridColumn, gridRow: area.gridRow, backgroundColor: area.backgroundColor + '40' }}>{area.name}</div>
                  ))}
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Areas ({activeLayout.areas.length})</span>
                  <button onClick={() => onAddArea(activeLayout.id)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
                </div>
                {activeLayout.areas.map(area => (
                  <div key={area.id} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <input value={area.name} onChange={e => onUpdateArea(activeLayout.id, area.id, { name: e.target.value })} className="text-xs font-medium bg-transparent text-white/80 w-20" />
                      <button onClick={() => onRemoveArea(activeLayout.id, area.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <span className="text-[9px] text-white/30">Column</span>
                        <input value={area.gridColumn} onChange={e => onUpdateArea(activeLayout.id, area.id, { gridColumn: e.target.value })} className="w-full text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/70" />
                      </div>
                      <div>
                        <span className="text-[9px] text-white/30">Row</span>
                        <input value={area.gridRow} onChange={e => onUpdateArea(activeLayout.id, area.id, { gridRow: e.target.value })} className="w-full text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/70" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onInsertCode(onGenerateCSS(activeLayout.id))} className="flex items-center justify-center gap-1.5 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-medium hover:bg-cyan-500/30"><Code className="h-3 w-3" /> CSS</button>
                <button onClick={() => onInsertCode(onGenerateTailwind(activeLayout.id))} className="flex items-center justify-center gap-1.5 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-xs font-medium hover:bg-violet-500/30"><Copy className="h-3 w-3" /> Tailwind</button>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
