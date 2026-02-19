import { useCarouselBuilder } from '@/hooks/useCarouselBuilder';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { X, Presentation, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useCarouselBuilder> & { onInsertCode: (code: string) => void; onClose: () => void };

export function CarouselBuilderPanel({ config, slides, updateConfig, addSlide, updateSlide, removeSlide, generateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Presentation className="w-4 h-4 text-orange-400" /><span className="text-sm font-medium text-white">Carousel Builder</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between col-span-2"><Label className="text-white/70 text-xs">Autoplay</Label><Switch checked={config.autoplay} onCheckedChange={v => updateConfig({ autoplay: v })} /></div>
          {config.autoplay && <div className="col-span-2 space-y-1"><Label className="text-white/70 text-xs">Delay (ms)</Label><Input type="number" value={config.autoplayDelay} onChange={e => updateConfig({ autoplayDelay: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-sm" /></div>}
          <div className="flex items-center justify-between col-span-2"><Label className="text-white/70 text-xs">Loop</Label><Switch checked={config.loop} onCheckedChange={v => updateConfig({ loop: v })} /></div>
          <div className="flex items-center justify-between col-span-2"><Label className="text-white/70 text-xs">Show Dots</Label><Switch checked={config.showDots} onCheckedChange={v => updateConfig({ showDots: v })} /></div>
          <div className="flex items-center justify-between col-span-2"><Label className="text-white/70 text-xs">Show Arrows</Label><Switch checked={config.showArrows} onCheckedChange={v => updateConfig({ showArrows: v })} /></div>
          <div className="space-y-1"><Label className="text-white/70 text-xs">Slides/View</Label><Input type="number" min={1} max={4} value={config.slidesPerView} onChange={e => updateConfig({ slidesPerView: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-sm" /></div>
          <div className="space-y-1"><Label className="text-white/70 text-xs">Gap (px)</Label><Input type="number" value={config.gap} onChange={e => updateConfig({ gap: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-sm" /></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-white/70 text-xs uppercase tracking-wider">Slides ({slides.length})</Label>
            <Button size="sm" variant="ghost" className="h-6 text-xs text-orange-400" onClick={addSlide}><Plus className="w-3 h-3 mr-1" />Add</Button>
          </div>
          {slides.map(s => (
            <div key={s.id} className="p-2 bg-white/5 rounded space-y-1">
              <div className="flex items-center gap-2">
                <Input value={s.title} onChange={e => updateSlide(s.id, { title: e.target.value })} placeholder="Title" className="bg-white/5 border-white/10 text-white text-xs flex-1" />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeSlide(s.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Input value={s.imageUrl} onChange={e => updateSlide(s.id, { imageUrl: e.target.value })} placeholder="Image URL" className="bg-white/5 border-white/10 text-white text-xs" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Carousel inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
