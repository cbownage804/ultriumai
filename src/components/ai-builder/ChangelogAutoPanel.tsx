import { useChangelogAutoGenerator } from '@/hooks/useChangelogAutoGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ScrollText, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useChangelogAutoGenerator> & { onInsertCode: (code: string) => void; onClose: () => void };

export function ChangelogAutoPanel({ versions, projectName, setProjectName, format, setFormat, addVersion, updateVersion, removeVersion, addEntry, removeEntry, generateCode, onInsertCode, onClose }: Props) {
  const cats = ['added', 'changed', 'fixed', 'removed'] as const;
  const catColor = (c: string) => c === 'added' ? 'text-green-400' : c === 'fixed' ? 'text-blue-400' : c === 'removed' ? 'text-red-400' : 'text-yellow-400';
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><ScrollText className="w-4 h-4 text-emerald-400" /><span className="text-sm font-medium text-white">Changelog Generator</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div><Label className="text-white/70 text-xs">Project Name</Label><Input value={projectName} onChange={e => setProjectName(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
        <div><Label className="text-white/70 text-xs">Format</Label>
          <Select value={format} onValueChange={v => setFormat(v as any)}><SelectTrigger className="h-7 bg-white/5 border-white/10 text-white text-xs mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="markdown">Markdown</SelectItem><SelectItem value="html">HTML</SelectItem></SelectContent></Select>
        </div>
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs uppercase tracking-wider">Versions ({versions.length})</Label><Button size="sm" variant="ghost" className="h-6 text-xs text-emerald-400" onClick={addVersion}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
        {versions.map(v => (
          <div key={v.id} className="p-2 bg-white/5 rounded space-y-1">
            <div className="flex items-center gap-2">
              <Input value={v.version} onChange={e => updateVersion(v.id, { version: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs w-20" />
              <Input type="date" value={v.date} onChange={e => updateVersion(v.id, { date: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs flex-1" />
              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeVersion(v.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
            {cats.map(c => (
              <div key={c}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase ${catColor(c)}`}>{c}</span>
                  <Button size="sm" variant="ghost" className="h-5 text-[10px] text-white/40" onClick={() => addEntry(v.id, c, 'New entry')}>+</Button>
                </div>
                {v[c].map((entry, i) => (
                  <div key={i} className="flex items-center gap-1 ml-2">
                    <span className="text-white/60 text-[10px] flex-1 truncate">{entry}</span>
                    <Button size="icon" variant="ghost" className="h-4 w-4 text-red-400/50" onClick={() => removeEntry(v.id, c, i)}><X className="w-2 h-2" /></Button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Changelog inserted'); }}>Insert Changelog</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
