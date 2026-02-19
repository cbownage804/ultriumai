import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Copy, ArrowLeftRight, Palette } from 'lucide-react';
import type { useColorContrastChecker } from '@/hooks/useColorContrastChecker';

type HookReturn = ReturnType<typeof useColorContrastChecker>;

interface Props extends HookReturn {
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function ColorContrastPanel({ fg, setFg, bg, setBg, result, suggestions, swap, generateCode, onInsertCode, onClose }: Props) {
  const [preview, setPreview] = useState('');

  const ratingColor = (pass: boolean) => pass ? 'text-emerald-400' : 'text-red-400';
  const ratingIcon = (pass: boolean) => pass ? '✓' : '✗';

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-white">Color Contrast Checker</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {/* Color Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-white/50 mb-1 block">Foreground</label>
              <div className="flex gap-1">
                <div className="h-7 w-7 rounded border border-white/10" style={{ backgroundColor: fg }} />
                <Input value={fg} onChange={e => setFg(e.target.value)} className="h-7 text-xs bg-white/5 border-white/10 text-white font-mono flex-1" />
              </div>
            </div>
            <button onClick={swap} className="mt-4 p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"><ArrowLeftRight className="h-4 w-4" /></button>
            <div className="flex-1">
              <label className="text-xs text-white/50 mb-1 block">Background</label>
              <div className="flex gap-1">
                <div className="h-7 w-7 rounded border border-white/10" style={{ backgroundColor: bg }} />
                <Input value={bg} onChange={e => setBg(e.target.value)} className="h-7 text-xs bg-white/5 border-white/10 text-white font-mono flex-1" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: bg }}>
            <p style={{ color: fg }} className="text-sm font-medium">Sample Text (Normal)</p>
            <p style={{ color: fg }} className="text-lg font-bold mt-1">Sample Text (Large)</p>
          </div>

          {/* Results */}
          {result && (
            <div className="p-2.5 rounded border border-white/[0.06] bg-white/[0.03]">
              <div className="text-center mb-2">
                <span className="text-2xl font-bold text-white">{result.ratio}</span>
                <span className="text-white/30 text-sm">:1</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">AA (normal)</span>
                  <span className={ratingColor(result.aa)}>{ratingIcon(result.aa)} ≥4.5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">AA (large)</span>
                  <span className={ratingColor(result.aaLarge)}>{ratingIcon(result.aaLarge)} ≥3.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">AAA (normal)</span>
                  <span className={ratingColor(result.aaa)}>{ratingIcon(result.aaa)} ≥7.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">AAA (large)</span>
                  <span className={ratingColor(result.aaaLarge)}>{ratingIcon(result.aaaLarge)} ≥4.5</span>
                </div>
              </div>
              <Badge variant="outline" className={`mt-2 text-[9px] ${result.aa ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>
                {result.aaa ? 'AAA Compliant' : result.aa ? 'AA Compliant' : result.aaLarge ? 'AA Large Only' : 'Fails WCAG'}
              </Badge>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Suggested Fixes</label>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setFg(s.fg)} className="w-full flex items-center gap-2 p-2 rounded bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] mb-1">
                  <div className="h-5 w-5 rounded" style={{ backgroundColor: s.bg }}>
                    <div className="h-3 w-3 rounded-full m-1" style={{ backgroundColor: s.fg }} />
                  </div>
                  <span className="text-[10px] text-white/50 font-mono">{s.fg}</span>
                  <span className="text-[10px] text-emerald-400 ml-auto">{s.ratio}:1</span>
                </button>
              ))}
            </div>
          )}

          {preview && <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 overflow-auto max-h-60 font-mono whitespace-pre-wrap">{preview}</pre>}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10" onClick={() => setPreview(generateCode())}>Preview</Button>
        <Button size="sm" className="flex-1 text-xs bg-violet-600 hover:bg-violet-500" onClick={() => onInsertCode(generateCode())}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}
