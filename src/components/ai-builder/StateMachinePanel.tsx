import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Copy, ArrowRight, Circle, CheckCircle2 } from 'lucide-react';
import type { FSMConfig, FSMState, FSMTransition } from '@/hooks/useStateMachineDesigner';

interface Props {
  config: FSMConfig;
  onSetMachineName: (name: string) => void;
  onAddState: (name: string) => void;
  onRemoveState: (id: string) => void;
  onUpdateState: (id: string, updates: Partial<FSMState>) => void;
  onAddTransition: (from: string, to: string, event: string) => void;
  onRemoveTransition: (id: string) => void;
  onAddContextField: (key: string, type: string, defaultValue: string) => void;
  onRemoveContextField: (key: string) => void;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function StateMachinePanel({ config, onSetMachineName, onAddState, onRemoveState, onUpdateState, onAddTransition, onRemoveTransition, onAddContextField, onRemoveContextField, onGenerateCode, onInsertCode, onClose }: Props) {
  const [newState, setNewState] = useState('');
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [newEvent, setNewEvent] = useState('');
  const [newCtxKey, setNewCtxKey] = useState('');
  const [newCtxType, setNewCtxType] = useState('string');
  const [newCtxDefault, setNewCtxDefault] = useState("''");
  const [preview, setPreview] = useState('');

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-white">State Machine Designer</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* Machine name */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Machine Name</label>
            <Input value={config.name} onChange={e => onSetMachineName(e.target.value)} className="h-8 text-xs bg-white/5 border-white/10 text-white" />
          </div>

          {/* States */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">States ({config.states.length})</label>
            <div className="space-y-1 mb-2">
              {config.states.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-1.5 rounded bg-white/[0.03] group">
                  <button onClick={() => onUpdateState(s.id, { isInitial: true })} title="Set initial">
                    {s.isInitial ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Circle className="h-3.5 w-3.5 text-white/20" />}
                  </button>
                  <span className="text-xs text-white flex-1 font-mono">{s.name}</span>
                  {s.isFinal && <Badge variant="outline" className="text-[9px] h-4 border-amber-500/30 text-amber-400">final</Badge>}
                  <button onClick={() => onUpdateState(s.id, { isFinal: !s.isFinal })} className="text-[9px] text-white/30 hover:text-white/60">F</button>
                  <button onClick={() => onRemoveState(s.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Input value={newState} onChange={e => setNewState(e.target.value)} placeholder="state name" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" onKeyDown={e => { if (e.key === 'Enter' && newState.trim()) { onAddState(newState.trim()); setNewState(''); } }} />
              <Button size="sm" variant="outline" className="h-7 text-xs border-white/10" onClick={() => { if (newState.trim()) { onAddState(newState.trim()); setNewState(''); } }}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>

          {/* Transitions */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Transitions ({config.transitions.length})</label>
            <div className="space-y-1 mb-2">
              {config.transitions.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 p-1.5 rounded bg-white/[0.03] group text-xs">
                  <span className="text-cyan-400 font-mono">{t.from}</span>
                  <ArrowRight className="h-3 w-3 text-white/30" />
                  <span className="text-emerald-400 font-mono">{t.to}</span>
                  <Badge variant="outline" className="text-[9px] h-4 border-violet-500/30 text-violet-400 ml-auto">{t.event}</Badge>
                  <button onClick={() => onRemoveTransition(t.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <select value={newFrom} onChange={e => setNewFrom(e.target.value)} className="h-7 text-xs bg-white/5 border border-white/10 text-white rounded px-1 flex-1">
                <option value="">from</option>
                {config.states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <select value={newTo} onChange={e => setNewTo(e.target.value)} className="h-7 text-xs bg-white/5 border border-white/10 text-white rounded px-1 flex-1">
                <option value="">to</option>
                {config.states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <Input value={newEvent} onChange={e => setNewEvent(e.target.value)} placeholder="EVENT" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" />
              <Button size="sm" variant="outline" className="h-7 text-xs border-white/10" onClick={() => { if (newFrom && newTo && newEvent.trim()) { onAddTransition(newFrom, newTo, newEvent.trim()); setNewEvent(''); } }}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>

          {/* Context */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Context Fields</label>
            <div className="space-y-1 mb-2">
              {config.context.map(c => (
                <div key={c.key} className="flex items-center gap-2 p-1.5 rounded bg-white/[0.03] group text-xs">
                  <span className="text-white font-mono">{c.key}</span>
                  <span className="text-white/30">:</span>
                  <span className="text-cyan-400">{c.type}</span>
                  <span className="text-white/20 ml-auto">= {c.defaultValue}</span>
                  <button onClick={() => onRemoveContextField(c.key)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Input value={newCtxKey} onChange={e => setNewCtxKey(e.target.value)} placeholder="key" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" />
              <Input value={newCtxType} onChange={e => setNewCtxType(e.target.value)} placeholder="type" className="h-7 text-xs bg-white/5 border-white/10 text-white w-20" />
              <Input value={newCtxDefault} onChange={e => setNewCtxDefault(e.target.value)} placeholder="default" className="h-7 text-xs bg-white/5 border-white/10 text-white w-16" />
              <Button size="sm" variant="outline" className="h-7 text-xs border-white/10" onClick={() => { if (newCtxKey.trim()) { onAddContextField(newCtxKey.trim(), newCtxType, newCtxDefault); setNewCtxKey(''); } }}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Generated Code</label>
              <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 overflow-auto max-h-60 font-mono whitespace-pre-wrap">{preview}</pre>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10" onClick={() => setPreview(onGenerateCode())}>Preview</Button>
        <Button size="sm" className="flex-1 text-xs bg-violet-600 hover:bg-violet-500" onClick={() => { const code = onGenerateCode(); onInsertCode(code); }}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}
