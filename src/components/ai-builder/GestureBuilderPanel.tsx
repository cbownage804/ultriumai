import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hand, X, Plus, Trash2, Code } from 'lucide-react';
import type { GestureMapping } from '@/hooks/useGestureBuilder';

interface GestureBuilderPanelProps {
  mappings: GestureMapping[];
  gesturePresets: { gesture: GestureMapping['gesture']; label: string; icon: string }[];
  animationPresets: string[];
  onAddMapping: (m: Omit<GestureMapping, 'id'>) => void;
  onUpdateMapping: (id: string, partial: Partial<GestureMapping>) => void;
  onRemoveMapping: (id: string) => void;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function GestureBuilderPanel({
  mappings, gesturePresets, animationPresets,
  onAddMapping, onUpdateMapping, onRemoveMapping,
  onGenerateCode, onInsertCode, onClose,
}: GestureBuilderPanelProps) {
  const [gesture, setGesture] = useState<GestureMapping['gesture']>('swipe-left');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [action, setAction] = useState('');
  const [animation, setAnimation] = useState('none');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddMapping({ name, gesture, target, action, animation, threshold: 100, duration: 500 });
    setName('');
    setTarget('');
    setAction('');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Hand className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Gesture Builder</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
            <Label className="text-xs text-muted-foreground">New Gesture Mapping</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Handler name" className="h-8 text-xs" />
            <Select value={gesture} onValueChange={v => setGesture(v as any)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {gesturePresets.map(g => (
                  <SelectItem key={g.gesture} value={g.gesture}>{g.icon} {g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target element (e.g. .card)" className="h-8 text-xs" />
            <Input value={action} onChange={e => setAction(e.target.value)} placeholder="Action (e.g. navigate('/next'))" className="h-8 text-xs" />
            <Select value={animation} onValueChange={setAnimation}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {animationPresets.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} className="w-full gap-1 text-xs">
              <Plus className="w-3 h-3" /> Add Gesture
            </Button>
          </div>

          {mappings.map(m => (
            <div key={m.id} className="p-3 rounded-lg border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{m.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveMapping(m.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{m.gesture}</Badge>
                <Badge variant="secondary" className="text-[10px]">{m.target}</Badge>
                {m.animation && m.animation !== 'none' && (
                  <Badge variant="default" className="text-[10px]">{m.animation}</Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">{m.action}</p>
            </div>
          ))}

          <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => onInsertCode(onGenerateCode())}>
            <Code className="w-3 h-3" /> Generate Gesture Handlers
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
