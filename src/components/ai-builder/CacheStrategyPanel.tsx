import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, Copy, Database, Zap } from 'lucide-react';
import type { CacheRule } from '@/hooks/useCacheStrategyManager';

interface Props {
  rules: CacheRule[];
  presets: string[];
  onAddRule: (name: string, queryKey: string, endpoint: string, preset?: string) => void;
  onRemoveRule: (id: string) => void;
  onUpdateRule: (id: string, updates: Partial<CacheRule>) => void;
  onApplyPreset: (id: string, preset: string) => void;
  formatDuration: (ms: number) => string;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function CacheStrategyPanel({ rules, presets, onAddRule, onRemoveRule, onUpdateRule, onApplyPreset, formatDuration, onGenerateCode, onInsertCode, onClose }: Props) {
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newPreset, setNewPreset] = useState('standard');
  const [preview, setPreview] = useState('');

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Cache Strategy Manager</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {rules.map(r => (
            <div key={r.id} className={`p-2.5 rounded border ${r.enabled ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03] opacity-50'} group`}>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => onUpdateRule(r.id, { enabled: !r.enabled })} className={`h-3 w-3 rounded-full border ${r.enabled ? 'bg-emerald-400 border-emerald-500' : 'border-white/20'}`} />
                <span className="text-xs text-white font-medium flex-1">{r.name}</span>
                <Badge variant="outline" className="text-[9px] h-4 border-cyan-500/30 text-cyan-400">{r.strategy}</Badge>
                <button onClick={() => onRemoveRule(r.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="text-white/30">Query Key: <span className="text-white/60 font-mono">{r.queryKey}</span></div>
                <div className="text-white/30">Endpoint: <span className="text-white/60 font-mono">{r.endpoint}</span></div>
                <div className="text-white/30">Stale: <span className="text-amber-400">{formatDuration(r.staleTime)}</span></div>
                <div className="text-white/30">GC: <span className="text-amber-400">{formatDuration(r.gcTime)}</span></div>
                <div className="text-white/30">Retry: <span className="text-white/60">{r.retry}x</span></div>
                <div className="text-white/30">Interval: <span className="text-white/60">{r.refetchInterval > 0 ? formatDuration(r.refetchInterval) : 'off'}</span></div>
              </div>
              <div className="flex gap-1 mt-2">
                {presets.map(p => (
                  <button key={p} onClick={() => onApplyPreset(r.id, p)} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 border border-white/[0.06]">{p}</button>
                ))}
              </div>
            </div>
          ))}

          {/* Add new rule */}
          <div className="p-2.5 rounded border border-dashed border-white/10">
            <label className="text-xs text-white/50 mb-1.5 block">Add Cache Rule</label>
            <div className="space-y-1">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Display name" className="h-7 text-xs bg-white/5 border-white/10 text-white" />
              <div className="flex gap-1">
                <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="queryKey" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" />
                <Input value={newEndpoint} onChange={e => setNewEndpoint(e.target.value)} placeholder="/api/..." className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" />
              </div>
              <div className="flex gap-1">
                <select value={newPreset} onChange={e => setNewPreset(e.target.value)} className="h-7 text-xs bg-white/5 border border-white/10 text-white rounded px-1 flex-1">
                  {presets.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <Button size="sm" variant="outline" className="h-7 text-xs border-white/10" onClick={() => {
                  if (newName.trim() && newKey.trim() && newEndpoint.trim()) {
                    onAddRule(newName.trim(), newKey.trim(), newEndpoint.trim(), newPreset);
                    setNewName(''); setNewKey(''); setNewEndpoint('');
                  }
                }}><Plus className="h-3 w-3 mr-1" />Add</Button>
              </div>
            </div>
          </div>

          {preview && (
            <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 overflow-auto max-h-60 font-mono whitespace-pre-wrap">{preview}</pre>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10" onClick={() => setPreview(onGenerateCode())}>Preview</Button>
        <Button size="sm" className="flex-1 text-xs bg-cyan-600 hover:bg-cyan-500" onClick={() => onInsertCode(onGenerateCode())}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}
