import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Sun, Moon, Plus, Trash2, Code, Palette, Copy } from 'lucide-react';
import type { ThemeToken } from '@/hooks/useThemeStudio';

interface Props {
  tokens: ThemeToken[];
  previewMode: 'light' | 'dark';
  activePreset: string;
  presets: { name: string }[];
  onSetPreviewMode: (m: 'light' | 'dark') => void;
  onUpdateToken: (id: string, field: 'lightValue' | 'darkValue', value: string) => void;
  onAddToken: (name: string, cssVar: string, category: ThemeToken['category']) => void;
  onRemoveToken: (id: string) => void;
  onApplyPreset: (name: string) => void;
  onGenerateCSS: () => string;
  onGenerateTailwind: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function ThemeStudioPanel({ tokens, previewMode, activePreset, presets, onSetPreviewMode, onUpdateToken, onAddToken, onRemoveToken, onApplyPreset, onGenerateCSS, onGenerateTailwind, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Theme Studio</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <button onClick={() => onSetPreviewMode('light')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs ${previewMode === 'light' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}><Sun className="h-3 w-3" /> Light</button>
            <button onClick={() => onSetPreviewMode('dark')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs ${previewMode === 'dark' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}><Moon className="h-3 w-3" /> Dark</button>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">Presets</span>
            <div className="flex gap-1 flex-wrap">
              {presets.map(p => (
                <button key={p.name} onClick={() => onApplyPreset(p.name)} className={`text-xs px-2.5 py-1 rounded-full ${activePreset === p.name ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-white/50 hover:text-white/80'}`}>{p.name}</button>
              ))}
            </div>
          </div>

          {/* Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 uppercase tracking-wider">Tokens</span>
              <button onClick={() => onAddToken('New Token', '--new-token', 'color')} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
            </div>
            {tokens.map(token => (
              <div key={token.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-white/80">{token.name}</span>
                    <span className="text-[10px] text-white/30 ml-2 font-mono">{token.cssVar}</span>
                  </div>
                  <button onClick={() => onRemoveToken(token.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-white/40">Light</span>
                    <input value={token.lightValue} onChange={e => onUpdateToken(token.id, 'lightValue', e.target.value)} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 mt-0.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40">Dark</span>
                    <input value={token.darkValue} onChange={e => onUpdateToken(token.id, 'darkValue', e.target.value)} className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 mt-0.5" />
                  </div>
                </div>
                {token.category === 'color' && (
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded border border-white/10" style={{ backgroundColor: `hsl(${previewMode === 'light' ? token.lightValue : token.darkValue})` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Export buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onInsertCode(onGenerateCSS())} className="flex items-center justify-center gap-1.5 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-xs font-medium hover:bg-violet-500/30"><Code className="h-3 w-3" /> Export CSS</button>
            <button onClick={() => { navigator.clipboard.writeText(onGenerateTailwind()); }} className="flex items-center justify-center gap-1.5 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-medium hover:bg-cyan-500/30"><Copy className="h-3 w-3" /> Tailwind</button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
