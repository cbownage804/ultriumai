import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Bell, Plus, Trash2, Download, Copy } from 'lucide-react';
import type { ToastPreset } from '@/hooks/useToastDesigner';

interface ToastDesignerPanelProps {
  presets: ToastPreset[];
  activePresetId: string;
  setActivePresetId: (id: string) => void;
  getActivePreset: () => ToastPreset | null;
  createPreset: (name: string) => void;
  updatePreset: (id: string, updates: Partial<ToastPreset>) => void;
  removePreset: (id: string) => void;
  generateCode: (preset?: ToastPreset) => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

const TOAST_TYPES: ToastPreset['type'][] = ['default', 'success', 'error', 'info', 'warning'];
const POSITIONS: ToastPreset['position'][] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

export function ToastDesignerPanel({ presets, activePresetId, setActivePresetId, getActivePreset, createPreset, updatePreset, removePreset, generateCode, onInsertCode, onClose }: ToastDesignerPanelProps) {
  const active = getActivePreset();

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-foreground">Toast Designer</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1">
            {presets.map(p => (
              <Badge key={p.id} variant={p.id === activePresetId ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setActivePresetId(p.id)}>
                {p.name}
              </Badge>
            ))}
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={() => createPreset('New Toast')}><Plus className="w-3 h-3" /></Button>
          </div>
          {active && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input value={active.name} onChange={e => updatePreset(active.id, { name: e.target.value })} className="text-xs h-8" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <select value={active.type} onChange={e => updatePreset(active.id, { type: e.target.value as any })} className="w-full h-8 text-xs rounded-md border border-input bg-background px-2">
                    {TOAST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Position</Label>
                  <select value={active.position} onChange={e => updatePreset(active.id, { position: e.target.value as any })} className="w-full h-8 text-xs rounded-md border border-input bg-background px-2">
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input value={active.title} onChange={e => updatePreset(active.id, { title: e.target.value })} className="text-xs h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input value={active.description} onChange={e => updatePreset(active.id, { description: e.target.value })} className="text-xs h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Duration (ms)</Label>
                <Input type="number" value={active.duration} onChange={e => updatePreset(active.id, { duration: parseInt(e.target.value) || 4000 })} className="text-xs h-8" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Action Button</Label>
                <Switch checked={active.hasAction} onCheckedChange={v => updatePreset(active.id, { hasAction: v })} />
              </div>
              {active.hasAction && (
                <Input value={active.actionLabel} onChange={e => updatePreset(active.id, { actionLabel: e.target.value })} placeholder="Action label" className="text-xs h-8" />
              )}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Close Button</Label>
                <Switch checked={active.hasCloseButton} onCheckedChange={v => updatePreset(active.id, { hasCloseButton: v })} />
              </div>
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">Generated Code</Label>
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => navigator.clipboard.writeText(generateCode())}><Copy className="w-3 h-3" /></Button>
                </div>
                <pre className="bg-background rounded p-2 text-[10px] text-muted-foreground font-mono overflow-auto max-h-48 whitespace-pre-wrap">{generateCode()}</pre>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs gap-1" onClick={() => onInsertCode(generateCode())}><Download className="w-3 h-3" /> Insert Code</Button>
                <Button size="sm" variant="destructive" className="text-xs" onClick={() => removePreset(active.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
