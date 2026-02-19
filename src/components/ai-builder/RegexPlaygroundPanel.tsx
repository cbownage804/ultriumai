import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Copy, Regex } from 'lucide-react';
import type { useRegexPlayground } from '@/hooks/useRegexPlayground';

type HookReturn = ReturnType<typeof useRegexPlayground>;

interface Props extends HookReturn {
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function RegexPlaygroundPanel({ pattern, setPattern, flags, toggleFlag, testText, setTestText, error, matches, presets, applyPreset, generateCode, onInsertCode, onClose }: Props) {
  const [preview, setPreview] = useState('');
  const flagList = ['g', 'i', 'm', 's', 'u'];

  const highlightedText = () => {
    if (!matches.length || !testText) return testText;
    let result = '';
    let lastIdx = 0;
    for (const m of matches) {
      result += testText.slice(lastIdx, m.index);
      result += `【${m.text}】`;
      lastIdx = m.index + m.length;
    }
    result += testText.slice(lastIdx);
    return result;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Regex className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">Regex Playground</span>
          <Badge variant="outline" className="text-[9px] h-4 border-emerald-500/30 text-emerald-400">{matches.length} matches</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {/* Pattern Input */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Pattern</label>
            <div className="flex gap-1">
              <span className="text-white/30 text-sm leading-7">/</span>
              <Input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="Enter regex..." className="h-7 text-xs bg-white/5 border-white/10 text-white font-mono flex-1" />
              <span className="text-white/30 text-sm leading-7">/</span>
            </div>
            {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
          </div>

          {/* Flags */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Flags</label>
            <div className="flex gap-1">
              {flagList.map(f => (
                <button key={f} onClick={() => toggleFlag(f)} className={`text-xs px-2 py-0.5 rounded border ${flags.includes(f) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-white/30'}`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Preset Library */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Common Patterns ({Object.keys(presets).length})</label>
            <div className="flex flex-wrap gap-1">
              {Object.entries(presets).map(([key, p]) => (
                <button key={key} onClick={() => applyPreset(key)} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 border border-white/[0.06]">{p.label}</button>
              ))}
            </div>
          </div>

          {/* Test Text */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Test String</label>
            <textarea value={testText} onChange={e => setTestText(e.target.value)} rows={4} className="w-full text-xs bg-white/5 border border-white/10 text-white rounded p-2 font-mono resize-none" />
          </div>

          {/* Highlighted Matches */}
          {matches.length > 0 && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Matches</label>
              <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 font-mono whitespace-pre-wrap max-h-32 overflow-auto">{highlightedText()}</pre>
              <div className="mt-1 space-y-0.5">
                {matches.slice(0, 20).map((m, i) => (
                  <div key={i} className="text-[10px] text-white/40 font-mono">
                    [{m.index}] <span className="text-emerald-400">"{m.text}"</span>
                    {Object.keys(m.groups).length > 0 && <span className="text-amber-400 ml-1">groups: {JSON.stringify(m.groups)}</span>}
                  </div>
                ))}
                {matches.length > 20 && <div className="text-[10px] text-white/30">...and {matches.length - 20} more</div>}
              </div>
            </div>
          )}

          {preview && <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 overflow-auto max-h-60 font-mono whitespace-pre-wrap">{preview}</pre>}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10" onClick={() => setPreview(generateCode())}>Preview</Button>
        <Button size="sm" className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500" onClick={() => onInsertCode(generateCode())}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}
