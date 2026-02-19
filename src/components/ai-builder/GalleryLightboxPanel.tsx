import { useGalleryLightboxGenerator } from '@/hooks/useGalleryLightboxGenerator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { X, LayoutGrid, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useGalleryLightboxGenerator> & { onInsertCode: (code: string) => void; onClose: () => void };

export function GalleryLightboxPanel({ config, images, updateConfig, addImage, updateImage, removeImage, generateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-pink-400" /><span className="text-sm font-medium text-white">Gallery / Lightbox</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label className="text-white/70 text-xs">Columns</Label><Input type="number" min={1} max={6} value={config.columns} onChange={e => updateConfig({ columns: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-sm" /></div>
          <div className="space-y-1"><Label className="text-white/70 text-xs">Gap (px)</Label><Input type="number" value={config.gap} onChange={e => updateConfig({ gap: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-sm" /></div>
          <div className="space-y-1"><Label className="text-white/70 text-xs">Border Radius</Label><Input type="number" value={config.borderRadius} onChange={e => updateConfig({ borderRadius: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-sm" /></div>
          <div className="space-y-1">
            <Label className="text-white/70 text-xs">Aspect Ratio</Label>
            <select value={config.aspectRatio} onChange={e => updateConfig({ aspectRatio: e.target.value as any })} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded px-2 py-1.5">
              <option value="square">Square</option><option value="4:3">4:3</option><option value="16:9">16:9</option><option value="auto">Auto</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-white/70 text-xs">Hover Effect</Label>
          <div className="flex gap-1">
            {(['none', 'zoom', 'overlay', 'lift'] as const).map(e => (
              <button key={e} onClick={() => updateConfig({ hoverEffect: e })} className={`px-2 py-1 rounded text-xs ${config.hoverEffect === e ? 'bg-pink-500/30 text-pink-300 border border-pink-500/50' : 'bg-white/5 text-white/60'}`}>{e}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Lightbox</Label><Switch checked={config.lightboxEnabled} onCheckedChange={v => updateConfig({ lightboxEnabled: v })} /></div>
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Show Captions</Label><Switch checked={config.showCaption} onCheckedChange={v => updateConfig({ showCaption: v })} /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-white/70 text-xs uppercase tracking-wider">Images ({images.length})</Label>
            <Button size="sm" variant="ghost" className="h-6 text-xs text-pink-400" onClick={addImage}><Plus className="w-3 h-3 mr-1" />Add</Button>
          </div>
          {images.map(img => (
            <div key={img.id} className="p-2 bg-white/5 rounded space-y-1">
              <div className="flex items-center gap-2">
                <Input value={img.url} onChange={e => updateImage(img.id, { url: e.target.value })} placeholder="Image URL" className="bg-white/5 border-white/10 text-white text-xs flex-1" />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeImage(img.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Input value={img.alt} onChange={e => updateImage(img.id, { alt: e.target.value })} placeholder="Alt text" className="bg-white/5 border-white/10 text-white text-xs" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Gallery inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
