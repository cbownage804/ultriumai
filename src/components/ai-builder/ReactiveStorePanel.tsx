import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Copy, Box } from 'lucide-react';
import type { StoreSlice } from '@/hooks/useReactiveStoreBuilder';

interface Props {
  slices: StoreSlice[];
  activeSliceId: string;
  onSetActiveSliceId: (id: string) => void;
  onCreateSlice: (name: string) => void;
  onDeleteSlice: (id: string) => void;
  onUpdateSlice: (id: string, updates: Partial<StoreSlice>) => void;
  onAddField: (sliceId: string, name: string, type: string, defaultValue: string) => void;
  onRemoveField: (sliceId: string, fieldId: string) => void;
  onAddAction: (sliceId: string, name: string, params: string, body: string) => void;
  onRemoveAction: (sliceId: string, actionId: string) => void;
  onAddSelector: (sliceId: string, name: string, body: string) => void;
  onRemoveSelector: (sliceId: string, selectorId: string) => void;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function ReactiveStorePanel({ slices, activeSliceId, onSetActiveSliceId, onCreateSlice, onDeleteSlice, onUpdateSlice, onAddField, onRemoveField, onAddAction, onRemoveAction, onAddSelector, onRemoveSelector, onGenerateCode, onInsertCode, onClose }: Props) {
  const [newSlice, setNewSlice] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('string');
  const [newFieldDefault, setNewFieldDefault] = useState("''");
  const [newActionName, setNewActionName] = useState('');
  const [newActionParams, setNewActionParams] = useState('');
  const [newActionBody, setNewActionBody] = useState('');
  const [preview, setPreview] = useState('');

  const active = slices.find(s => s.id === activeSliceId);

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-white">Reactive Store Builder</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* Slice tabs */}
          <div>
            <div className="flex gap-1 flex-wrap mb-2">
              {slices.map(s => (
                <button key={s.id} onClick={() => onSetActiveSliceId(s.id)} className={`text-xs px-2 py-1 rounded ${s.id === activeSliceId ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-white/5 text-white/50 border border-white/10'}`}>{s.name}</button>
              ))}
            </div>
            <div className="flex gap-1">
              <Input value={newSlice} onChange={e => setNewSlice(e.target.value)} placeholder="store name" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" />
              <Button size="sm" variant="outline" className="h-7 text-xs border-white/10" onClick={() => { if (newSlice.trim()) { onCreateSlice(newSlice.trim()); setNewSlice(''); } }}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>

          {active && (
            <>
              {/* Middleware toggles */}
              <div className="flex gap-2">
                <button onClick={() => onUpdateSlice(active.id, { persist: !active.persist })} className={`text-xs px-2 py-1 rounded border ${active.persist ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-white/40 border-white/10'}`}>💾 Persist</button>
                <button onClick={() => onUpdateSlice(active.id, { devtools: !active.devtools })} className={`text-xs px-2 py-1 rounded border ${active.devtools ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-white/5 text-white/40 border-white/10'}`}>🔧 DevTools</button>
              </div>

              {/* State fields */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">State ({active.fields.length})</label>
                {active.fields.map(f => (
                  <div key={f.id} className="flex items-center gap-1.5 p-1 rounded bg-white/[0.03] text-xs mb-1 group">
                    <span className="text-white font-mono">{f.name}</span>
                    <span className="text-white/20">:</span>
                    <span className="text-cyan-400 flex-1">{f.type}</span>
                    <span className="text-white/20">= {f.defaultValue}</span>
                    <button onClick={() => onRemoveField(active.id, f.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
                <div className="flex gap-1 mt-1">
                  <Input value={newFieldName} onChange={e => setNewFieldName(e.target.value)} placeholder="name" className="h-6 text-[10px] bg-white/5 border-white/10 text-white flex-1" />
                  <Input value={newFieldType} onChange={e => setNewFieldType(e.target.value)} placeholder="type" className="h-6 text-[10px] bg-white/5 border-white/10 text-white w-20" />
                  <Input value={newFieldDefault} onChange={e => setNewFieldDefault(e.target.value)} placeholder="default" className="h-6 text-[10px] bg-white/5 border-white/10 text-white w-14" />
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white/30" onClick={() => { if (newFieldName.trim()) { onAddField(active.id, newFieldName.trim(), newFieldType, newFieldDefault); setNewFieldName(''); } }}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>

              {/* Actions */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Actions ({active.actions.length})</label>
                {active.actions.map(a => (
                  <div key={a.id} className="p-1 rounded bg-white/[0.03] text-xs mb-1 group">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-mono">{a.name}</span>
                      <span className="text-white/20">({a.params})</span>
                      <button onClick={() => onRemoveAction(active.id, a.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
                <div className="space-y-1 mt-1">
                  <div className="flex gap-1">
                    <Input value={newActionName} onChange={e => setNewActionName(e.target.value)} placeholder="action name" className="h-6 text-[10px] bg-white/5 border-white/10 text-white flex-1" />
                    <Input value={newActionParams} onChange={e => setNewActionParams(e.target.value)} placeholder="params" className="h-6 text-[10px] bg-white/5 border-white/10 text-white flex-1" />
                  </div>
                  <div className="flex gap-1">
                    <Input value={newActionBody} onChange={e => setNewActionBody(e.target.value)} placeholder="set({ ... })" className="h-6 text-[10px] bg-white/5 border-white/10 text-white flex-1" />
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white/30" onClick={() => { if (newActionName.trim()) { onAddAction(active.id, newActionName.trim(), newActionParams, newActionBody); setNewActionName(''); setNewActionBody(''); } }}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {preview && <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 overflow-auto max-h-60 font-mono whitespace-pre-wrap">{preview}</pre>}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10" onClick={() => setPreview(onGenerateCode())}>Preview</Button>
        <Button size="sm" className="flex-1 text-xs bg-orange-600 hover:bg-orange-500" onClick={() => onInsertCode(onGenerateCode())}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}
