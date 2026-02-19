import { useRichTextConfig } from '@/hooks/useRichTextConfig';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { X, Type, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useRichTextConfig> & { onInsertCode: (code: string) => void; onClose: () => void };

export function RichTextConfigPanel({ extensions, placeholder, editable, setPlaceholder, setEditable, toggleExtension, generateCode, onInsertCode, onClose }: Props) {
  const categories = ['formatting', 'inline', 'block', 'table', 'media', 'task'] as const;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Type className="w-4 h-4 text-emerald-400" /><span className="text-sm font-medium text-white">Rich Text Config</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-white/70 text-xs">Placeholder Text</Label>
          <Input value={placeholder} onChange={e => setPlaceholder(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm" />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-white/70 text-xs">Editable</Label>
          <Switch checked={editable} onCheckedChange={setEditable} />
        </div>
        <div className="space-y-3">
          <Label className="text-white/70 text-xs uppercase tracking-wider">Extensions</Label>
          {categories.map(cat => {
            const catExts = extensions.filter(e => e.category === cat);
            if (catExts.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-[10px] text-white/40 uppercase mb-1">{cat}</p>
                <div className="space-y-1">
                  {catExts.map(ext => (
                    <div key={ext.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-white/5">
                      <div>
                        <span className="text-xs text-white">{ext.name}</span>
                        <span className="text-[10px] text-white/30 ml-2">{ext.package}</span>
                      </div>
                      <Switch checked={ext.enabled} onCheckedChange={() => toggleExtension(ext.id)} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Rich text editor inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
