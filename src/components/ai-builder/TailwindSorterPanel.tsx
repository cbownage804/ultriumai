import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Copy, ArrowUpDown, Paintbrush } from 'lucide-react';
import type { useTailwindClassSorter } from '@/hooks/useTailwindClassSorter';

type HookReturn = ReturnType<typeof useTailwindClassSorter>;

interface Props extends HookReturn {
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function TailwindSorterPanel({ input, setInput, sortSingle, scanCode, results, generateCode, onInsertCode, onClose }: Props) {
  const [codeInput, setCodeInput] = useState('');
  const [preview, setPreview] = useState('');
  const sorted = sortSingle();
  const changed = input !== sorted;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Paintbrush className="h-4 w-4 text-sky-400" />
          <span className="text-sm font-medium text-white">Tailwind Class Sorter</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {/* Single class string */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Class String</label>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} className="w-full text-xs bg-white/5 border border-white/10 text-white rounded p-2 font-mono resize-none" placeholder="Paste Tailwind classes..." />
          </div>

          <div className="p-2.5 rounded border border-white/[0.06] bg-white/[0.03]">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpDown className="h-3 w-3 text-sky-400" />
              <span className="text-xs text-white/50">Sorted</span>
              {changed ? <Badge variant="outline" className="text-[9px] h-4 border-amber-500/30 text-amber-400">Changed</Badge>
                : <Badge variant="outline" className="text-[9px] h-4 border-emerald-500/30 text-emerald-400">OK</Badge>}
            </div>
            <pre className="text-[10px] text-white/70 font-mono whitespace-pre-wrap">{sorted}</pre>
          </div>

          {/* Bulk scan */}
          <div className="border-t border-white/[0.06] pt-3">
            <label className="text-xs text-white/50 mb-1 block">Scan TSX Code</label>
            <textarea value={codeInput} onChange={e => setCodeInput(e.target.value)} rows={5} className="w-full text-xs bg-white/5 border border-white/10 text-white rounded p-2 font-mono resize-none" placeholder="Paste component code to scan..." />
            <Button size="sm" variant="outline" className="mt-1 w-full text-xs border-white/10" onClick={() => scanCode(codeInput)}>Scan for className issues</Button>
          </div>

          {results.length > 0 && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">{results.filter(r => r.changed).length} issues found</label>
              {results.map((r, i) => (
                <div key={i} className={`p-2 rounded border mb-1 ${r.changed ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                  <div className="text-[10px] text-white/30 mb-0.5">Line {r.line}</div>
                  {r.changed && (
                    <>
                      <div className="text-[10px] text-red-400/60 font-mono line-through">{r.original}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{r.sorted}</div>
                    </>
                  )}
                  {!r.changed && <div className="text-[10px] text-white/40 font-mono">{r.original} ✓</div>}
                </div>
              ))}
            </div>
          )}

          {preview && <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 overflow-auto max-h-60 font-mono whitespace-pre-wrap">{preview}</pre>}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10" onClick={() => setPreview(generateCode())}>Preview</Button>
        <Button size="sm" className="flex-1 text-xs bg-sky-600 hover:bg-sky-500" onClick={() => onInsertCode(generateCode())}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}
