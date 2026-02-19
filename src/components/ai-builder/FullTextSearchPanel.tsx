import { useFullTextSearchSetup } from '@/hooks/useFullTextSearchSetup';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Search, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useFullTextSearchSetup> & { onInsertCode: (code: string) => void; onClose: () => void };

export function FullTextSearchPanel({ columns, tableName, debounceMs, minChars, setTableName, setDebounceMs, setMinChars, addColumn, updateColumn, removeColumn, generateMigrationSQL, generateSearchComponent, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Search className="w-4 h-4 text-blue-400" /><span className="text-sm font-medium text-white">Full-Text Search</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1"><Label className="text-white/70 text-xs">Table Name</Label><Input value={tableName} onChange={e => setTableName(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label className="text-white/70 text-xs">Debounce (ms)</Label><Input type="number" value={debounceMs} onChange={e => setDebounceMs(Number(e.target.value))} className="bg-white/5 border-white/10 text-white text-sm" /></div>
          <div className="space-y-1"><Label className="text-white/70 text-xs">Min Chars</Label><Input type="number" value={minChars} onChange={e => setMinChars(Number(e.target.value))} className="bg-white/5 border-white/10 text-white text-sm" /></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs uppercase tracking-wider">Search Columns</Label><Button size="sm" variant="ghost" className="h-6 text-xs text-blue-400" onClick={addColumn}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
          {columns.map(c => (
            <div key={c.id} className="p-2 bg-white/5 rounded space-y-1">
              <div className="flex items-center gap-2">
                <Input value={c.column} onChange={e => updateColumn(c.id, { column: e.target.value })} placeholder="Column" className="bg-white/5 border-white/10 text-white text-xs flex-1" />
                <Select value={c.weight} onValueChange={v => updateColumn(c.id, { weight: v as 'A' | 'B' | 'C' | 'D' })}>
                  <SelectTrigger className="w-16 h-7 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['A', 'B', 'C', 'D'].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeColumn(c.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateMigrationSQL()); toast.success('Migration SQL inserted'); }}>Insert Migration</Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateMigrationSQL()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
        </div>
        <Button size="sm" variant="secondary" className="w-full text-xs" onClick={() => { onInsertCode(generateSearchComponent()); toast.success('SearchBar inserted'); }}>Insert SearchBar Component</Button>
      </div>
    </div>
  );
}
