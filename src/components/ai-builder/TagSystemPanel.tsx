import { useTagCategorySystem } from '@/hooks/useTagCategorySystem';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { X, Tag, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

type Props = ReturnType<typeof useTagCategorySystem> & { onInsertCode: (code: string) => void; onClose: () => void };

export function TagSystemPanel({ config, updateConfig, addPresetTag, removePresetTag, generateMigrationSQL, generateTagInputComponent, onInsertCode, onClose }: Props) {
  const [newTag, setNewTag] = useState('');
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-purple-400" /><span className="text-sm font-medium text-white">Tag/Category System</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1"><Label className="text-white/70 text-xs">Table Name</Label><Input value={config.tableName} onChange={e => updateConfig({ tableName: e.target.value })} className="bg-white/5 border-white/10 text-white text-sm" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label className="text-white/70 text-xs">Max Tags</Label><Input type="number" value={config.maxTags} onChange={e => updateConfig({ maxTags: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white text-sm" /></div>
        </div>
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Tag Colors</Label><Switch checked={config.tagColors} onCheckedChange={v => updateConfig({ tagColors: v })} /></div>
        <div className="flex items-center justify-between"><Label className="text-white/70 text-xs">Allow Create</Label><Switch checked={config.allowCreate} onCheckedChange={v => updateConfig({ allowCreate: v })} /></div>
        <div className="space-y-2">
          <Label className="text-white/70 text-xs uppercase tracking-wider">Preset Tags</Label>
          <div className="flex flex-wrap gap-1">
            {config.presetTags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                {t}<button onClick={() => removePresetTag(i)} className="hover:text-red-400">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add tag" className="bg-white/5 border-white/10 text-white text-xs flex-1" onKeyDown={e => { if (e.key === 'Enter' && newTag) { addPresetTag(newTag); setNewTag(''); } }} />
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { if (newTag) { addPresetTag(newTag); setNewTag(''); } }}><Plus className="w-3 h-3" /></Button>
          </div>
        </div>
      </div>
      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateMigrationSQL()); toast.success('Migration SQL inserted'); }}>Insert Migration</Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateMigrationSQL()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
        </div>
        <Button size="sm" variant="secondary" className="w-full text-xs" onClick={() => { onInsertCode(generateTagInputComponent()); toast.success('TagInput inserted'); }}>Insert TagInput Component</Button>
      </div>
    </div>
  );
}
