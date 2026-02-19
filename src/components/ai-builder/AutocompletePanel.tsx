import { useAutocompleteGenerator } from '@/hooks/useAutocompleteGenerator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Zap, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

type Props = ReturnType<typeof useAutocompleteGenerator> & { onInsertCode: (code: string) => void; onClose: () => void };

export function AutocompletePanel({ config, updateConfig, addStaticItem, removeStaticItem, generateCode, onInsertCode, onClose }: Props) {
  const [newItem, setNewItem] = useState('');
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /><span className="text-sm font-medium text-white">Autocomplete Generator</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1"><Label className="text-white/70 text-xs">Placeholder</Label><Input value={config.placeholder} onChange={e => updateConfig({ placeholder: e.target.value })} className="bg-white/5 border-white/10 text-white text-sm" /></div>
        <div className="space-y-1">
          <Label className="text-white/70 text-xs">Data Source</Label>
          <Select value={config.dataSource} onValueChange={v => updateConfig({ dataSource: v as any })}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="static">Static List</SelectItem><SelectItem value="supabase">Supabase</SelectItem><SelectItem value="api">REST API</SelectItem></SelectContent>
          </Select>
        </div>
        {config.dataSource === 'supabase' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-white/70 text-xs">Table</Label><Input value={config.tableName} onChange={e => updateConfig({ tableName: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs" /></div>
            <div className="space-y-1"><Label className="text-white/70 text-xs">Display Field</Label><Input value={config.displayField} onChange={e => updateConfig({ displayField: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs" /></div>
            <div className="space-y-1"><Label className="text-white/70 text-xs">Value Field</Label><Input value={config.valueField} onChange={e => updateConfig({ valueField: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs" /></div>
            <div className="space-y-1"><Label className="text-white/70 text-xs">Search Field</Label><Input value={config.searchField} onChange={e => updateConfig({ searchField: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs" /></div>
          </div>
        )}
        {config.dataSource === 'static' && (
          <div className="space-y-2">
            <Label className="text-white/70 text-xs">Items</Label>
            {config.staticItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1"><span className="text-white/60 text-xs flex-1">{item}</span><Button size="icon" variant="ghost" className="h-5 w-5 text-red-400" onClick={() => removeStaticItem(i)}><Trash2 className="w-3 h-3" /></Button></div>
            ))}
            <div className="flex gap-1">
              <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New item" className="bg-white/5 border-white/10 text-white text-xs flex-1" onKeyDown={e => { if (e.key === 'Enter' && newItem) { addStaticItem(newItem); setNewItem(''); } }} />
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { if (newItem) { addStaticItem(newItem); setNewItem(''); } }}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
        )}
        <div className="space-y-1"><Label className="text-white/70 text-xs">Max Results</Label><Input type="number" value={config.maxResults} onChange={e => updateConfig({ maxResults: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-sm" /></div>
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Allow Create</Label><Switch checked={config.allowCreate} onCheckedChange={v => updateConfig({ allowCreate: v })} /></div>
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Autocomplete inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
