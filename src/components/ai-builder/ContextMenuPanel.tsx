import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Code, MousePointerClick } from 'lucide-react';
import type { ContextMenuConfig, ContextMenuItem } from '@/hooks/useContextMenuDesigner';

interface Props {
  menus: ContextMenuConfig[];
  activeMenu: string | null;
  presetNames: string[];
  createMenu: (preset?: string) => ContextMenuConfig;
  updateMenu: (id: string, updates: Partial<ContextMenuConfig>) => void;
  deleteMenu: (id: string) => void;
  addItem: (menuId: string, type?: ContextMenuItem['type']) => void;
  removeItem: (menuId: string, itemId: string) => void;
  updateItem: (menuId: string, itemId: string, updates: Partial<ContextMenuItem>) => void;
  generateCode: (id: string) => string;
  getActive: () => ContextMenuConfig | null;
  setActiveMenu: (id: string | null) => void;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function ContextMenuPanel({ menus, presetNames, createMenu, deleteMenu, addItem, removeItem, updateItem, updateMenu, generateCode, getActive, setActiveMenu, onInsertCode, onClose }: Props) {
  const active = getActive();
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2"><MousePointerClick className="h-4 w-4 text-orange-400" /><span className="text-sm font-semibold text-white">Context Menu Designer</span></div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">Presets</span>
            <div className="flex gap-1 flex-wrap">
              {presetNames.map(n => <button key={n} onClick={() => createMenu(n)} className="text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 text-white/60">{n}</button>)}
              <button onClick={() => createMenu()} className="text-[10px] px-2 py-1 bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 flex items-center gap-1"><Plus className="h-3 w-3" />Custom</button>
            </div>
          </div>
          {menus.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {menus.map(m => <button key={m.id} onClick={() => setActiveMenu(m.id)} className={`text-xs px-2 py-1 rounded ${active?.id === m.id ? 'bg-orange-500/20 text-orange-300' : 'bg-white/5 text-white/50'}`}>{m.name}</button>)}
            </div>
          )}
          {active && (
            <>
              <div className="space-y-2">
                <input value={active.name} onChange={e => updateMenu(active.id, { name: e.target.value })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Items ({active.items.length})</span>
                  <div className="flex gap-1">
                    <button onClick={() => addItem(active.id, 'item')} className="text-[10px] text-cyan-400 hover:text-cyan-300">+Item</button>
                    <button onClick={() => addItem(active.id, 'separator')} className="text-[10px] text-cyan-400 hover:text-cyan-300">+Sep</button>
                  </div>
                </div>
                {active.items.map(item => (
                  <div key={item.id} className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.06]">
                    {item.type === 'separator' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30 flex-1">— separator —</span>
                        <button onClick={() => removeItem(active.id, item.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input value={item.label} onChange={e => updateItem(active.id, item.id, { label: e.target.value })} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" placeholder="Label" />
                          <input value={item.shortcut} onChange={e => updateItem(active.id, item.id, { shortcut: e.target.value })} className="w-14 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" placeholder="⌘X" />
                          <button onClick={() => removeItem(active.id, item.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-white/40 flex items-center gap-1"><input type="checkbox" checked={item.destructive} onChange={e => updateItem(active.id, item.id, { destructive: e.target.checked })} className="w-3 h-3" />Destructive</label>
                          <label className="text-[10px] text-white/40 flex items-center gap-1"><input type="checkbox" checked={item.disabled} onChange={e => updateItem(active.id, item.id, { disabled: e.target.checked })} className="w-3 h-3" />Disabled</label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => onInsertCode(generateCode(active.id))} className="w-full flex items-center justify-center gap-2 py-2 bg-orange-500/20 text-orange-300 rounded-lg text-xs font-medium hover:bg-orange-500/30"><Code className="h-3.5 w-3.5" />Generate Context Menu</button>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
