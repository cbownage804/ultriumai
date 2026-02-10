import { useState } from 'react';
import { GPTConfig, DEFAULT_WIDGET_THEME, WidgetTheme } from '@/types/gptConfig';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Globe, Palette, Brain, Sparkles, MessageCircle, Plus, X, Target, ImageIcon, FileText } from 'lucide-react';
import { GPTPromptScorer } from './GPTPromptScorer';

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
  const [newQuestion, setNewQuestion] = useState('');

  const addStarterQuestion = () => {
    if (!newQuestion.trim() || config.starter_questions.length >= 4) return;
    onChange({ starter_questions: [...config.starter_questions, newQuestion.trim()] });
    setNewQuestion('');
  };

  const removeStarterQuestion = (index: number) => {
    onChange({ starter_questions: config.starter_questions.filter((_, i) => i !== index) });
  };

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
              <Label className="text-xs text-white/50">Description</Label>
              <Input
                value={config.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="A brief description of your GPT"
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/50">Avatar URL</Label>
              <Input
                value={config.avatar_url || ''}
                onChange={(e) => onChange({ avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.png"
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

          {/* Prompt Score */}
          <GPTPromptScorer config={config} />

          <Separator className="bg-white/[0.06]" />

          {/* System Prompt */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> System Prompt
            </h4>
            <Textarea
              value={config.system_prompt}
              onChange={(e) => onChange({ system_prompt: e.target.value })}
              placeholder="You are a helpful assistant that..."
              className="min-h-[100px] text-xs bg-white/[0.04] border-white/[0.08] text-white resize-none font-mono leading-relaxed"
              rows={5}
            />
            <p className="text-[10px] text-white/20">
              {config.system_prompt.length} characters · The AI chat panel can also generate this for you
            </p>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Personality */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium flex items-center gap-1.5">
              <Target className="h-3 w-3" /> Personality
            </h4>
            <div className="space-y-2">
              <Label className="text-xs text-white/50">Communication Style</Label>
              <Input
                value={config.communication_style}
                onChange={(e) => onChange({ communication_style: e.target.value })}
                placeholder="e.g., Professional and friendly"
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/50">Expertise Areas</Label>
              <Input
                value={config.expertise_areas}
                onChange={(e) => onChange({ expertise_areas: e.target.value })}
                placeholder="e.g., Customer service, billing"
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/50">Welcome Message</Label>
              <Textarea
                value={config.welcome_message}
                onChange={(e) => onChange({ welcome_message: e.target.value })}
                placeholder="Hi! How can I help you today?"
                className="min-h-[60px] text-xs bg-white/[0.04] border-white/[0.08] text-white resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/50">Placeholder Prompt</Label>
              <Input
                value={config.placeholder_prompt}
                onChange={(e) => onChange({ placeholder_prompt: e.target.value })}
                placeholder="Ask me anything..."
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Starter Questions */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" /> Starter Questions
            </h4>
            <div className="space-y-1.5">
              {config.starter_questions.map((q, i) => (
                <div key={i} className="flex items-center gap-1.5 group">
                  <span className="flex-1 text-[11px] text-white/50 truncate bg-white/[0.02] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
                    {q}
                  </span>
                  <button
                    onClick={() => removeStarterQuestion(i)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400/60 transition-all shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {config.starter_questions.length < 4 && (
              <div className="flex gap-1.5">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStarterQuestion(); } }}
                  placeholder="Add a starter question..."
                  className="h-7 text-[11px] bg-white/[0.04] border-white/[0.08] text-white"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addStarterQuestion}
                  disabled={!newQuestion.trim()}
                  className="h-7 px-2 text-white/40 hover:text-white shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Appearance */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium flex items-center gap-1.5">
              <Palette className="h-3 w-3" /> Theme Color
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
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-md border border-white/[0.1] shrink-0"
                style={{ backgroundColor: config.theme_color }}
              />
              <Input
                value={config.theme_color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === '') {
                    onChange({ theme_color: v || '#6366f1' });
                  }
                }}
                placeholder="#6366f1"
                className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white font-mono"
                maxLength={7}
              />
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Widget Theme — Per-element colors */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium flex items-center gap-1.5">
              <Palette className="h-3 w-3" /> Widget Colors
            </h4>
            <p className="text-[10px] text-white/20">Customize each part of the chat widget. Leave blank to use defaults.</p>

            <WidgetColorRow label="Background" field="background" config={config} onChange={onChange} />
            <WidgetColorRow label="Text" field="text_color" config={config} onChange={onChange} />
            <WidgetColorRow label="User Bubble" field="user_bubble" config={config} onChange={onChange} placeholder="Theme color" />
            <WidgetColorRow label="User Bubble Text" field="user_bubble_text" config={config} onChange={onChange} />
            <WidgetColorRow label="Assistant Bubble" field="assistant_bubble" config={config} onChange={onChange} />
            <WidgetColorRow label="Assistant Bubble Text" field="assistant_bubble_text" config={config} onChange={onChange} />
            <WidgetColorRow label="Input Background" field="input_background" config={config} onChange={onChange} />
            <WidgetColorRow label="Input Text" field="input_text" config={config} onChange={onChange} />
            <WidgetColorRow label="Input Border" field="input_border" config={config} onChange={onChange} />
            <WidgetColorRow label="Starter Btn BG" field="starter_background" config={config} onChange={onChange} placeholder="Theme color" />
            <WidgetColorRow label="Starter Btn Text" field="starter_text" config={config} onChange={onChange} />

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[10px] text-white/30 hover:text-white/60 h-7"
              onClick={() => onChange({ widget_theme: { ...DEFAULT_WIDGET_THEME } })}
            >
              Reset to defaults
            </Button>
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
                <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash (Fast)</SelectItem>
                <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                <SelectItem value="google/gemini-3-pro-preview">Gemini 3 Pro</SelectItem>
                <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
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

// Helper: inline color picker row for widget theme
function WidgetColorRow({
  label, field, config, onChange, placeholder,
}: {
  label: string;
  field: keyof WidgetTheme;
  config: GPTConfig;
  onChange: (u: Partial<GPTConfig>) => void;
  placeholder?: string;
}) {
  const wt = config.widget_theme || DEFAULT_WIDGET_THEME;
  const value = wt[field] || '';
  const update = (v: string) => {
    onChange({ widget_theme: { ...DEFAULT_WIDGET_THEME, ...wt, [field]: v } });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 w-24 shrink-0 truncate">{label}</span>
      <div
        className="h-6 w-6 rounded border border-white/[0.1] shrink-0 cursor-pointer relative overflow-hidden"
        style={{ backgroundColor: value || (placeholder ? config.theme_color : '#ccc') }}
      >
        <input
          type="color"
          value={value || config.theme_color || '#6366f1'}
          onChange={(e) => update(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
      <Input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === '') update(v);
        }}
        placeholder={placeholder || DEFAULT_WIDGET_THEME[field] || '#000000'}
        className="h-6 text-[10px] bg-white/[0.04] border-white/[0.08] text-white font-mono flex-1"
        maxLength={7}
      />
    </div>
  );
}
