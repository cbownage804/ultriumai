import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Bell, Plus, Trash2, Download, Copy } from 'lucide-react';
import type { NotifConfig } from '@/hooks/useNotificationCenterGenerator';

interface NotificationCenterPanelProps {
  config: NotifConfig;
  updateConfig: (updates: Partial<NotifConfig>) => void;
  toggleType: (id: string) => void;
  addType: (name: string) => void;
  removeType: (id: string) => void;
  generateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function NotificationCenterPanel({ config, updateConfig, toggleType, addType, removeType, generateCode, onInsertCode, onClose }: NotificationCenterPanelProps) {
  const [newType, setNewType] = useState('');

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-foreground">Notification Center</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Max Items</Label>
            <Input type="number" value={config.maxItems} onChange={e => updateConfig({ maxItems: parseInt(e.target.value) || 50 })} className="text-xs h-8" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Realtime (Supabase)</Label>
              <Switch checked={config.enableRealtime} onCheckedChange={v => updateConfig({ enableRealtime: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Grouping</Label>
              <Switch checked={config.enableGrouping} onCheckedChange={v => updateConfig({ enableGrouping: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Sound</Label>
              <Switch checked={config.enableSound} onCheckedChange={v => updateConfig({ enableSound: v })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Notification Types</Label>
            {config.types.map(t => (
              <div key={t.id} className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                <span className="text-xs text-foreground flex-1">{t.name}</span>
                <Switch checked={t.enabled} onCheckedChange={() => toggleType(t.id)} />
                <button onClick={() => removeType(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            <div className="flex gap-1">
              <Input value={newType} onChange={e => setNewType(e.target.value)} placeholder="New type..." className="text-xs h-7 flex-1" />
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { if (newType.trim()) { addType(newType.trim()); setNewType(''); } }}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Generated Hook</Label>
              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => navigator.clipboard.writeText(generateCode())}><Copy className="w-3 h-3" /></Button>
            </div>
            <pre className="bg-background rounded p-2 text-[10px] text-muted-foreground font-mono overflow-auto max-h-56 whitespace-pre-wrap">{generateCode()}</pre>
          </div>
          <Button size="sm" className="w-full text-xs gap-1" onClick={() => onInsertCode(generateCode())}><Download className="w-3 h-3" /> Insert Code</Button>
        </div>
      </ScrollArea>
    </div>
  );
}
