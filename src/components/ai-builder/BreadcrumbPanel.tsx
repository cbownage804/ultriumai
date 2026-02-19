import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Code, Navigation } from 'lucide-react';
import type { BreadcrumbConfig, BreadcrumbItem } from '@/hooks/useBreadcrumbGenerator';

interface Props {
  configs: BreadcrumbConfig[];
  activeConfig: string | null;
  presetNames: string[];
  createConfig: (preset?: string) => BreadcrumbConfig;
  updateConfig: (id: string, updates: Partial<BreadcrumbConfig>) => void;
  deleteConfig: (id: string) => void;
  addItem: (configId: string) => void;
  removeItem: (configId: string, itemId: string) => void;
  updateItem: (configId: string, itemId: string, updates: Partial<BreadcrumbItem>) => void;
  generateCode: (id: string) => string;
  getActive: () => BreadcrumbConfig | null;
  setActiveConfig: (id: string | null) => void;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function BreadcrumbPanel({ configs, presetNames, createConfig, deleteConfig, addItem, removeItem, updateItem, updateConfig, generateCode, getActive, setActiveConfig, onInsertCode, onClose }: Props) {
  const active = getActive();
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2"><Navigation className="h-4 w-4 text-sky-400" /><span className="text-sm font-semibold text-white">Breadcrumb Generator</span></div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">Presets</span>
            <div className="flex gap-1 flex-wrap">
              {presetNames.map(n => <button key={n} onClick={() => createConfig(n)} className="text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 text-white/60">{n}</button>)}
              <button onClick={() => createConfig()} className="text-[10px] px-2 py-1 bg-sky-500/20 text-sky-300 rounded hover:bg-sky-500/30 flex items-center gap-1"><Plus className="h-3 w-3" />Custom</button>
            </div>
          </div>
          {configs.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {configs.map(c => <button key={c.id} onClick={() => setActiveConfig(c.id)} className={`text-xs px-2 py-1 rounded ${active?.id === c.id ? 'bg-sky-500/20 text-sky-300' : 'bg-white/5 text-white/50'}`}>{c.name}</button>)}
            </div>
          )}
          {active && (
            <>
              <div className="space-y-2">
                <input value={active.name} onChange={e => updateConfig(active.id, { name: e.target.value })} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
                <div className="flex gap-2">
                  <select value={active.separator} onChange={e => updateConfig(active.id, { separator: e.target.value as BreadcrumbConfig['separator'] })} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80">
                    <option value="chevron">Chevron ›</option><option value="/">/</option><option value=">">{'>'}</option><option value="→">→</option><option value="•">•</option>
                  </select>
                  <select value={active.variant} onChange={e => updateConfig(active.id, { variant: e.target.value as BreadcrumbConfig['variant'] })} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80">
                    <option value="default">Default</option><option value="pill">Pill</option><option value="underline">Underline</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Items ({active.items.length})</span>
                  <button onClick={() => addItem(active.id)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
                </div>
                {active.items.map(item => (
                  <div key={item.id} className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.06] flex items-center gap-2">
                    <input value={item.label} onChange={e => updateItem(active.id, item.id, { label: e.target.value })} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" placeholder="Label" />
                    <input value={item.href} onChange={e => updateItem(active.id, item.id, { href: e.target.value })} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" placeholder="/path" />
                    <button onClick={() => removeItem(active.id, item.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => onInsertCode(generateCode(active.id))} className="w-full flex items-center justify-center gap-2 py-2 bg-sky-500/20 text-sky-300 rounded-lg text-xs font-medium hover:bg-sky-500/30"><Code className="h-3.5 w-3.5" />Generate Breadcrumbs</button>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
