import { useState } from 'react';
import { GPTConfig, GPTAction } from '@/types/gptConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Zap, Globe, Image, Code, Link, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GPTBuilderActionsPanelProps {
  config: GPTConfig;
  onChange: (updates: Partial<GPTConfig>) => void;
  onClose: () => void;
}

const AVAILABLE_ACTIONS: Omit<GPTAction, 'id'>[] = [
  { name: 'Web Search', description: 'Search the web for real-time information', type: 'web_search', enabled: false },
  { name: 'URL Scraping', description: 'Extract content from web pages', type: 'url_scrape', enabled: false },
  { name: 'Image Generation', description: 'Generate images from text prompts', type: 'image_gen', enabled: false },
  { name: 'Code Interpreter', description: 'Execute and analyze code snippets', type: 'code_interpreter', enabled: false },
];

const ACTION_ICONS: Record<string, React.ReactNode> = {
  web_search: <Search className="h-4 w-4" />,
  url_scrape: <Link className="h-4 w-4" />,
  image_gen: <Image className="h-4 w-4" />,
  code_interpreter: <Code className="h-4 w-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  web_search: 'text-blue-400/60',
  url_scrape: 'text-green-400/60',
  image_gen: 'text-pink-400/60',
  code_interpreter: 'text-amber-400/60',
};

export function GPTBuilderActionsPanel({ config, onChange, onClose }: GPTBuilderActionsPanelProps) {
  const toggleAction = (type: string) => {
    const existing = config.actions.find(a => a.type === type);
    if (existing) {
      onChange({
        actions: config.actions.map(a =>
          a.type === type ? { ...a, enabled: !a.enabled } : a
        ),
      });
    } else {
      const template = AVAILABLE_ACTIONS.find(a => a.type === type);
      if (template) {
        onChange({
          actions: [...config.actions, { ...template, id: crypto.randomUUID(), enabled: true }],
        });
      }
    }

    // Sync web_search toggle
    if (type === 'web_search') {
      onChange({ enable_web_search: !config.enable_web_search });
    }
  };

  const isEnabled = (type: string) => {
    if (type === 'web_search') return config.enable_web_search;
    return config.actions.find(a => a.type === type)?.enabled ?? false;
  };

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" /> Actions & Tools
        </span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <p className="text-[11px] text-white/30 mb-4">
            Enable tools your GPT can use during conversations
          </p>

          {AVAILABLE_ACTIONS.map((action) => (
            <div
              key={action.type}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                isEnabled(action.type)
                  ? 'border-white/[0.12] bg-white/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.01]'
              )}
            >
              <div className={cn('shrink-0', ACTION_COLORS[action.type])}>
                {ACTION_ICONS[action.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/70">{action.name}</p>
                <p className="text-[10px] text-white/30">{action.description}</p>
              </div>
              <Switch
                checked={isEnabled(action.type)}
                onCheckedChange={() => toggleAction(action.type)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
