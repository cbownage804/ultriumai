import { useFilePreviewGenerator } from '@/hooks/useFilePreviewGenerator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { X, Eye, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useFilePreviewGenerator> & { onInsertCode: (code: string) => void; onClose: () => void };

export function FilePreviewPanel({ types, maxFileSize, setMaxFileSize, toggleType, generateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" /><span className="text-sm font-medium text-white">File Preview Generator</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-white/70 text-xs">Max File Size (MB)</Label>
          <Input type="number" value={maxFileSize} onChange={e => setMaxFileSize(Number(e.target.value))} className="bg-white/5 border-white/10 text-white text-sm" />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70 text-xs uppercase tracking-wider">Supported Types</Label>
          {types.map(t => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded bg-white/5">
              <div>
                <span className="text-xs text-white">{t.name}</span>
                <span className="text-[10px] text-white/30 ml-2">{t.extensions.join(', ')}</span>
              </div>
              <Switch checked={t.enabled} onCheckedChange={() => toggleType(t.id)} />
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('File preview component inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
