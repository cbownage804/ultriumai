import { useAvatarGenerator } from '@/hooks/useAvatarGenerator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X, User, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useAvatarGenerator> & { onInsertCode: (code: string) => void; onClose: () => void };

export function AvatarGenPanel({ config, updateConfig, generateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><User className="w-4 h-4 text-violet-400" /><span className="text-sm font-medium text-white">Avatar Generator</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-white/70 text-xs">Size</Label>
          <div className="flex gap-1">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(s => (
              <button key={s} onClick={() => updateConfig({ size: s })} className={`px-3 py-1 rounded text-xs ${config.size === s ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'bg-white/5 text-white/60'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-white/70 text-xs">Shape</Label>
          <div className="flex gap-1">
            {(['circle', 'rounded', 'square'] as const).map(s => (
              <button key={s} onClick={() => updateConfig({ shape: s })} className={`px-3 py-1 rounded text-xs ${config.shape === s ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50' : 'bg-white/5 text-white/60'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-white/70 text-xs">Show Initials Fallback</Label>
          <Switch checked={config.showInitials} onCheckedChange={v => updateConfig({ showInitials: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-white/70 text-xs">Upload Support</Label>
          <Switch checked={config.showUpload} onCheckedChange={v => updateConfig({ showUpload: v })} />
        </div>
        {/* Preview */}
        <div className="p-4 bg-white/5 rounded-lg flex items-center justify-center gap-3">
          <div className={`${config.size === 'xs' ? 'h-6 w-6' : config.size === 'sm' ? 'h-8 w-8' : config.size === 'md' ? 'h-10 w-10' : config.size === 'lg' ? 'h-14 w-14' : 'h-20 w-20'} ${config.shape === 'circle' ? 'rounded-full' : config.shape === 'rounded' ? 'rounded-lg' : ''} bg-violet-500 flex items-center justify-center text-white font-medium ${config.size === 'xs' ? 'text-[10px]' : config.size === 'sm' ? 'text-xs' : config.size === 'md' ? 'text-sm' : config.size === 'lg' ? 'text-lg' : 'text-2xl'}`}>
            {config.showInitials ? 'JD' : '?'}
          </div>
          <span className="text-white/40 text-xs">Preview</span>
        </div>
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Avatar component inserted'); }}>Insert Component</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
