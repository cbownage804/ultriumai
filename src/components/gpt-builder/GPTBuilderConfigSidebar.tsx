import { GPTConfig } from '@/types/gptConfig';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Globe, Palette, Brain, Sparkles } from 'lucide-react';

interface GPTBuilderConfigSidebarProps {
  config: GPTConfig;
  onChange: (updates: Partial<GPTConfig>) => void;
}

const THEME_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#a855f7', '#f43f5e', '#14b8a6',
];

export function GPTBuilderConfigSidebar({ config, onChange }: GPTBuilderConfigSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-[#09090b] border-l border-white/[0.06]">
      <div className="h-10 shrink-0 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/50">Quick Config</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Identity */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium flex items-center gap-1.5">
              <Bot className="h-3 w-3" /> Identity
            </h4>
            <div className="space-y-2">
              <Label className="text-xs text-white/50">Name</Label>
              <Input
                value={config.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="My AI Assistant"
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/50">Category</Label>
              <Select value={config.category} onValueChange={(v) => onChange({ category: v })}>
                <SelectTrigger className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Appearance */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium flex items-center gap-1.5">
              <Palette className="h-3 w-3" /> Theme
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {THEME_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => onChange({ theme_color: color })}
                  className="h-6 w-6 rounded-md border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: config.theme_color === color ? 'white' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Model */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium flex items-center gap-1.5">
              <Brain className="h-3 w-3" /> Model
            </h4>
            <Select value={config.preferred_model} onValueChange={(v) => onChange({ preferred_model: v })}>
              <SelectTrigger className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Features
            </h4>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-white/50 flex items-center gap-1.5">
                <Globe className="h-3 w-3" /> Web Search
              </Label>
              <Switch
                checked={config.enable_web_search}
                onCheckedChange={(v) => onChange({ enable_web_search: v })}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
