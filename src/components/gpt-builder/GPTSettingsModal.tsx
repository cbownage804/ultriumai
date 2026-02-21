import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { GPTConfig } from '@/types/gptConfig';
import { Settings2, Code2, Wrench, Trash2 } from 'lucide-react';

interface GPTSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: GPTConfig;
  onChange: (updates: Partial<GPTConfig>) => void;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  onDelete?: () => void;
  isEditMode: boolean;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'support', label: 'Customer Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'knowledge', label: 'Knowledge Base' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'education', label: 'Education' },
  { value: 'creative', label: 'Creative' },
];

const EMBED_STYLES = [
  { value: 'bubble', label: 'Chat Bubble' },
  { value: 'inline', label: 'Inline Embed' },
  { value: 'fullpage', label: 'Full Page' },
];

export function GPTSettingsModal({
  open, onOpenChange, config, onChange,
  soundEnabled, onSoundToggle, onDelete, isEditMode,
}: GPTSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            GPT Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="bg-white/[0.04] border border-white/[0.06] w-full">
            <TabsTrigger value="general" className="flex-1 text-xs data-[state=active]:bg-white/[0.08]">
              <Settings2 className="h-3 w-3 mr-1" /> General
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex-1 text-xs data-[state=active]:bg-white/[0.08]">
              <Code2 className="h-3 w-3 mr-1" /> Embed
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1 text-xs data-[state=active]:bg-white/[0.08]">
              <Wrench className="h-3 w-3 mr-1" /> Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Name</Label>
              <Input
                value={config.name}
                onChange={e => onChange({ name: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08] text-white h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Theme Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.theme_color}
                  onChange={e => onChange({ theme_color: e.target.value })}
                  className="h-8 w-8 rounded border border-white/[0.08] bg-transparent cursor-pointer"
                />
                <Input
                  value={config.theme_color}
                  onChange={e => onChange({ theme_color: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08] text-white h-8 text-sm font-mono flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Category</Label>
              <Select value={config.category} onValueChange={v => onChange({ category: v })}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/[0.08]">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value} className="text-white/80 text-sm">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Embed Style</Label>
              <Select value={config.embed_style} onValueChange={v => onChange({ embed_style: v as any })}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/[0.08]">
                  {EMBED_STYLES.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-white/80 text-sm">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Allowed Domains</Label>
              <Input
                value={config.embed_allowed_domains.join(', ')}
                onChange={e => onChange({ embed_allowed_domains: e.target.value.split(',').map(d => d.trim()).filter(Boolean) })}
                placeholder="example.com, mysite.org"
                className="bg-white/[0.04] border-white/[0.08] text-white h-8 text-sm"
              />
              <p className="text-[10px] text-white/30">Comma-separated. Leave empty to allow all domains.</p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-white/80">Build Completion Sound</Label>
                <p className="text-[10px] text-white/30 mt-0.5">Play a chime when AI finishes responding</p>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={onSoundToggle} />
            </div>

            {isEditMode && onDelete && (
              <div className="pt-4 border-t border-white/[0.06]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 text-xs gap-1.5 w-full justify-start"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete this GPT
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
