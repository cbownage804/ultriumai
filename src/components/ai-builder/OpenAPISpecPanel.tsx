import { useOpenAPISpecGenerator } from '@/hooks/useOpenAPISpecGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Globe, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useOpenAPISpecGenerator> & { onInsertCode: (code: string) => void; onClose: () => void };

export function OpenAPISpecPanel({ title, setTitle, version, setVersion, serverUrl, setServerUrl, paths, addPath, updatePath, removePath, generateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /><span className="text-sm font-medium text-white">OpenAPI Spec</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div><Label className="text-white/70 text-xs">API Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
        <div className="flex gap-2">
          <div className="flex-1"><Label className="text-white/70 text-xs">Version</Label><Input value={version} onChange={e => setVersion(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
          <div className="flex-1"><Label className="text-white/70 text-xs">Server URL</Label><Input value={serverUrl} onChange={e => setServerUrl(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
        </div>
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs uppercase tracking-wider">Paths ({paths.length})</Label><Button size="sm" variant="ghost" className="h-6 text-xs text-cyan-400" onClick={addPath}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
        {paths.map(p => (
          <div key={p.id} className="p-2 bg-white/5 rounded space-y-1">
            <div className="flex items-center gap-1">
              <Select value={p.method} onValueChange={v => updatePath(p.id, { method: v as any })}><SelectTrigger className="h-7 w-20 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{['GET','POST','PUT','DELETE','PATCH'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
              <Input value={p.path} onChange={e => updatePath(p.id, { path: e.target.value })} className="bg-white/5 border-white/10 text-white text-xs flex-1" />
              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removePath(p.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
            <Input value={p.summary} onChange={e => updatePath(p.id, { summary: e.target.value })} placeholder="Summary" className="bg-white/5 border-white/10 text-white text-xs" />
            <Input value={p.tag} onChange={e => updatePath(p.id, { tag: e.target.value })} placeholder="Tag" className="bg-white/5 border-white/10 text-white text-xs" />
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('OpenAPI spec inserted'); }}>Insert Spec</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
