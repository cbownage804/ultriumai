import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Code, Menu } from 'lucide-react';
import type { MegaMenuConfig } from '@/hooks/useMegaMenuBuilder';

interface Props {
  menus: MegaMenuConfig[];
  activeMenu: string | null;
  presetNames: string[];
  createMenu: (preset?: string) => MegaMenuConfig;
  updateMenu: (id: string, updates: Partial<MegaMenuConfig>) => void;
  deleteMenu: (id: string) => void;
  addColumn: (menuId: string) => void;
  removeColumn: (menuId: string, colId: string) => void;
  addItemToColumn: (menuId: string, colId: string) => void;
  generateCode: (id: string) => string;
  getActive: () => MegaMenuConfig | null;
  setActiveMenu: (id: string | null) => void;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function MegaMenuPanel({ menus, presetNames, createMenu, deleteMenu, addColumn, removeColumn, addItemToColumn, updateMenu, generateCode, getActive, setActiveMenu, onInsertCode, onClose }: Props) {
  const active = getActive();
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2"><Menu className="h-4 w-4 text-pink-400" /><span className="text-sm font-semibold text-white">Mega Menu Builder</span></div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">Presets</span>
            <div className="flex gap-1 flex-wrap">
              {presetNames.map(n => <button key={n} onClick={() => createMenu(n)} className="text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 text-white/60">{n}</button>)}
              <button onClick={() => createMenu()} className="text-[10px] px-2 py-1 bg-pink-500/20 text-pink-300 rounded hover:bg-pink-500/30 flex items-center gap-1"><Plus className="h-3 w-3" />Custom</button>
            </div>
          </div>
          {menus.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {menus.map(m => <button key={m.id} onClick={() => setActiveMenu(m.id)} className={`text-xs px-2 py-1 rounded ${active?.id === m.id ? 'bg-pink-500/20 text-pink-300' : 'bg-white/5 text-white/50'}`}>{m.name}</button>)}
            </div>
          )}
          {active && (
            <>
              <div className="space-y-2">
                <input value={active.name} onChange={e => updateMenu(active.id, { name: e.target.value })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
                <input value={active.trigger} onChange={e => updateMenu(active.id, { trigger: e.target.value })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" placeholder="Trigger label" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Columns ({active.columns.length})</span>
                  <button onClick={() => addColumn(active.id)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
                </div>
                {active.columns.map(col => (
                  <div key={col.id} className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.06] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/70 font-medium">{col.title}</span>
                      <span className="text-[10px] text-white/30">{col.items.length} items</span>
                      <div className="flex-1" />
                      <button onClick={() => addItemToColumn(active.id, col.id)} className="text-cyan-400/50 hover:text-cyan-400"><Plus className="h-3 w-3" /></button>
                      <button onClick={() => removeColumn(active.id, col.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    {col.items.map(item => (
                      <div key={item.id} className="text-[10px] text-white/50 pl-2">{item.icon} {item.label}</div>
                    ))}
                  </div>
                ))}
              </div>
              <button onClick={() => onInsertCode(generateCode(active.id))} className="w-full flex items-center justify-center gap-2 py-2 bg-pink-500/20 text-pink-300 rounded-lg text-xs font-medium hover:bg-pink-500/30"><Code className="h-3.5 w-3.5" />Generate Mega Menu</button>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
