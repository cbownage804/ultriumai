import { useState } from 'react';
import { X, Puzzle, Plus, Trash2, Copy, Check, Code, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PluginDefinition, SDKTemplate } from '@/hooks/usePluginSDK';

interface PluginSDKPanelProps {
  plugins: PluginDefinition[];
  templates: SDKTemplate[];
  activeTemplate: SDKTemplate | null;
  onSetActiveTemplate: (t: SDKTemplate | null) => void;
  onCreatePlugin: (name: string, type: PluginDefinition['type']) => void;
  onDeletePlugin: (id: string) => void;
  onPublishPlugin: (id: string) => void;
  onGenerateTypes: () => string;
  onClose: () => void;
}

export function PluginSDKPanel({ plugins, templates, activeTemplate, onSetActiveTemplate, onCreatePlugin, onDeletePlugin, onPublishPlugin, onGenerateTypes, onClose }: PluginSDKPanelProps) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<PluginDefinition['type']>('panel');
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-[#0a0a0f] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Puzzle className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Plugin SDK</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-white/60 text-xs">Templates</Label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map(t => (
              <button key={t.name} onClick={() => onSetActiveTemplate(activeTemplate?.name === t.name ? null : t)} className={`text-left p-2 rounded-lg border text-xs ${activeTemplate?.name === t.name ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/[0.06] bg-white/[0.03]'}`}>
                <p className="text-white/80 font-medium">{t.name}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {activeTemplate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs">{activeTemplate.name} Template</Label>
              <Button variant="ghost" size="sm" onClick={() => copyCode(activeTemplate.code)} className="h-5 px-1.5 text-[10px] text-white/40">
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <pre className="bg-black/40 rounded-lg p-3 text-[10px] text-white/50 font-mono overflow-auto max-h-52 whitespace-pre-wrap">{activeTemplate.code}</pre>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <Label className="text-white/60 text-xs">Your Plugins</Label>
          {plugins.map(p => (
            <div key={p.id} className="flex items-center gap-2 bg-white/[0.03] rounded-lg border border-white/[0.06] p-2">
              <div className="flex-1">
                <p className="text-xs text-white/80">{p.name}</p>
                <p className="text-[10px] text-white/30">{p.type} • v{p.version}</p>
              </div>
              {!p.isPublished && (
                <Button size="sm" variant="ghost" onClick={() => onPublishPlugin(p.id)} className="h-6 px-2 text-[10px] text-emerald-400">
                  <Upload className="h-3 w-3 mr-1" />Publish
                </Button>
              )}
              {p.isPublished && <span className="text-[10px] text-emerald-400/60">Published</span>}
              <button onClick={() => onDeletePlugin(p.id)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <div className="flex gap-1.5">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Plugin name" className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-8 flex-1" />
            <select value={newType} onChange={e => setNewType(e.target.value as any)} className="bg-white/[0.04] border border-white/[0.08] text-white text-xs rounded h-8 px-1.5">
              <option value="panel">Panel</option>
              <option value="transform">Transform</option>
              <option value="prompt-modifier">Prompt</option>
              <option value="deploy-hook">Deploy</option>
            </select>
            <Button size="sm" onClick={() => { if (newName) { onCreatePlugin(newName, newType); setNewName(''); } }} className="h-8 px-3 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-500/20 text-xs">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Button variant="ghost" onClick={() => copyCode(onGenerateTypes())} className="w-full h-8 text-xs text-white/40 border border-white/[0.08]">
          <Code className="h-3 w-3 mr-1.5" /> Copy SDK Type Definitions
        </Button>
      </div>
    </div>
  );
}
