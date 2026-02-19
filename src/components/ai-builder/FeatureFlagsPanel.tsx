import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Flag, Plus, Trash2, Code, X } from 'lucide-react';
import type { FeatureFlag } from '@/hooks/useFeatureFlags';

interface FeatureFlagsPanelProps {
  flags: FeatureFlag[];
  activeFlagId: string | null;
  setActiveFlagId: (id: string | null) => void;
  getActiveFlag: () => FeatureFlag | null;
  createFlag: (key: string, name: string) => FeatureFlag;
  updateFlag: (id: string, update: Partial<FeatureFlag>) => void;
  removeFlag: (id: string) => void;
  addVariant: (flagId: string, key: string, value: string) => void;
  removeVariant: (flagId: string, variantId: string) => void;
  generateHookCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function FeatureFlagsPanel({
  flags, activeFlagId, setActiveFlagId, getActiveFlag,
  createFlag, updateFlag, removeFlag, addVariant, removeVariant,
  generateHookCode, onInsertCode, onClose,
}: FeatureFlagsPanelProps) {
  const active = getActiveFlag();

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Feature Flags</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-3 border-b border-border">
        <Button size="sm" className="w-full" onClick={() => createFlag('new_feature', 'New Feature')}>
          <Plus className="w-3 h-3 mr-1" /> New Flag
        </Button>
      </div>

      {!active && (
        <ScrollArea className="flex-1 p-3">
          {flags.map(f => (
            <div key={f.id} className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer mb-1" onClick={() => setActiveFlagId(f.id)}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${f.isEnabled ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{f.key}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[10px]">{f.rolloutPercentage}%</Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); removeFlag(f.id); }}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
          {flags.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No feature flags. Create one above.</p>}
        </ScrollArea>
      )}

      {active && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveFlagId(null)}>← Back</Button>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Enabled</Label>
              <Switch checked={active.isEnabled} onCheckedChange={v => updateFlag(active.id, { isEnabled: v })} />
            </div>

            <div><Label className="text-xs">Name</Label><Input value={active.name} onChange={e => updateFlag(active.id, { name: e.target.value })} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Key</Label><Input value={active.key} onChange={e => updateFlag(active.id, { key: e.target.value })} className="h-8 text-sm font-mono" /></div>
            <div><Label className="text-xs">Description</Label><Input value={active.description} onChange={e => updateFlag(active.id, { description: e.target.value })} className="h-8 text-sm" /></div>

            <div>
              <Label className="text-xs">Environment</Label>
              <Select value={active.environment} onValueChange={v => updateFlag(active.id, { environment: v as FeatureFlag['environment'] })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Rollout: {active.rolloutPercentage}%</Label>
              <Slider value={[active.rolloutPercentage]} onValueChange={([v]) => updateFlag(active.id, { rolloutPercentage: v })} min={0} max={100} step={5} className="mt-1" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Variants ({active.variants.length})</Label>
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => addVariant(active.id, 'variant_' + (active.variants.length + 1), 'value')}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {active.variants.map(v => (
                <div key={v.id} className="flex items-center gap-2 mt-1">
                  <Input value={v.key} className="h-7 text-xs flex-1" readOnly />
                  <Input value={v.value} className="h-7 text-xs flex-1" readOnly />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeVariant(active.id, v.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}

      <div className="p-3 border-t border-border">
        <Button size="sm" className="w-full text-xs" onClick={() => onInsertCode(generateHookCode())}>
          <Code className="w-3 h-3 mr-1" /> Generate Hook Code
        </Button>
      </div>
    </div>
  );
}
