import { useFacetedFilterBuilder } from '@/hooks/useFacetedFilterBuilder';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Filter, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

type Props = ReturnType<typeof useFacetedFilterBuilder> & { onInsertCode: (code: string) => void; onClose: () => void };

export function FacetedFilterPanel({ facets, syncWithURL, setSyncWithURL, addFacet, updateFacet, removeFacet, addOption, removeOption, generateCode, onInsertCode, onClose }: Props) {
  const [newOptions, setNewOptions] = useState<Record<string, string>>({});
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-green-400" /><span className="text-sm font-medium text-white">Faceted Filters</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Sync with URL</Label><Switch checked={syncWithURL} onCheckedChange={setSyncWithURL} /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs uppercase tracking-wider">Facets ({facets.length})</Label><Button size="sm" variant="ghost" className="h-6 text-xs text-green-400" onClick={addFacet}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
          {facets.map(f => (
            <div key={f.id} className="p-2 bg-white/5 rounded space-y-1">
              <div className="flex items-center gap-2">
                <Input value={f.name} onChange={e => updateFacet(f.id, { name: e.target.value })} placeholder="Name" className="bg-white/5 border-white/10 text-white text-xs flex-1" />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeFacet(f.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Input value={f.field} onChange={e => updateFacet(f.id, { field: e.target.value })} placeholder="field_name" className="bg-white/5 border-white/10 text-white text-xs" />
              <Select value={f.type} onValueChange={v => updateFacet(f.id, { type: v as any })}>
                <SelectTrigger className="h-7 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{['checkbox', 'range', 'date', 'select'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              {(f.type === 'checkbox' || f.type === 'select') && (
                <div className="space-y-1">
                  {f.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1"><span className="text-white/50 text-xs flex-1">{opt}</span><button onClick={() => removeOption(f.id, i)} className="text-red-400 text-xs">×</button></div>
                  ))}
                  <div className="flex gap-1">
                    <Input value={newOptions[f.id] || ''} onChange={e => setNewOptions(p => ({ ...p, [f.id]: e.target.value }))} placeholder="Add option" className="bg-white/5 border-white/10 text-white text-xs flex-1" onKeyDown={e => { if (e.key === 'Enter' && newOptions[f.id]) { addOption(f.id, newOptions[f.id]); setNewOptions(p => ({ ...p, [f.id]: '' })); } }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Filter component inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
