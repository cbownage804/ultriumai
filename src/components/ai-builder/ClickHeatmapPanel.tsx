import { useClickHeatmap } from '@/hooks/useClickHeatmap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, MousePointer, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useClickHeatmap> & { onInsertCode: (code: string) => void; onClose: () => void };

export function ClickHeatmapPanel({ clicks, isRecording, setIsRecording, canvasWidth, setCanvasWidth, canvasHeight, setCanvasHeight, radius, setRadius, opacity, setOpacity, clearClicks, getHotspots, generateTrackingScript, generateOverlayCode, onInsertCode, onClose }: Props) {
  const hotspots = getHotspots();
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><MousePointer className="w-4 h-4 text-red-400" /><span className="text-sm font-medium text-white">Click Heatmap</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-white/70 text-xs">Width</Label><Input type="number" value={canvasWidth} onChange={e => setCanvasWidth(Number(e.target.value))} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
          <div><Label className="text-white/70 text-xs">Height</Label><Input type="number" value={canvasHeight} onChange={e => setCanvasHeight(Number(e.target.value))} className="bg-white/5 border-white/10 text-white text-xs mt-1" /></div>
        </div>
        <div><Label className="text-white/70 text-xs">Radius: {radius}px</Label><Slider value={[radius]} onValueChange={v => setRadius(v[0])} min={5} max={50} step={1} className="mt-1" /></div>
        <div><Label className="text-white/70 text-xs">Opacity: {opacity}</Label><Slider value={[opacity * 100]} onValueChange={v => setOpacity(v[0] / 100)} min={10} max={100} step={5} className="mt-1" /></div>
        <div className="flex items-center justify-between">
          <Label className="text-white/70 text-xs">Clicks: {clicks.length}</Label>
          <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400" onClick={clearClicks}><Trash2 className="w-3 h-3 mr-1" />Clear</Button>
        </div>
        {hotspots.length > 0 && (
          <div>
            <Label className="text-white/70 text-xs uppercase tracking-wider">Top Hotspots</Label>
            {hotspots.slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center gap-2 py-1 text-xs text-white/60">
                <span>({h.x}, {h.y})</span><span className="text-white/30">—</span><span className="text-cyan-400">{h.count} clicks</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateOverlayCode()); toast.success('Heatmap overlay inserted'); }}>Insert Overlay</Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { onInsertCode(generateTrackingScript()); toast.success('Tracking script inserted'); }}>Insert Tracker</Button>
        </div>
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => { navigator.clipboard.writeText(generateOverlayCode()); toast.success('Copied'); }}><Copy className="w-3 h-3 mr-1" />Copy Overlay Code</Button>
      </div>
    </div>
  );
}
