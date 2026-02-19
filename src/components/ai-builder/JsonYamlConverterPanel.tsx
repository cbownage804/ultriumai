import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Copy, ArrowLeftRight, FileJson } from 'lucide-react';
import type { useJsonYamlConverter } from '@/hooks/useJsonYamlConverter';

type HookReturn = ReturnType<typeof useJsonYamlConverter>;

interface Props extends HookReturn {
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function JsonYamlConverterPanel({ input, setInput, inputFormat, setInputFormat, outputFormat, setOutputFormat, output, error, convert, swap, formats, onInsertCode, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FileJson className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-white">JSON/YAML Converter</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {/* Format selectors */}
          <div className="flex items-center gap-2">
            <select value={inputFormat} onChange={e => setInputFormat(e.target.value as typeof inputFormat)} className="h-7 text-xs bg-white/5 border border-white/10 text-white rounded px-2 flex-1 uppercase">
              {formats.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button onClick={swap} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"><ArrowLeftRight className="h-4 w-4" /></button>
            <select value={outputFormat} onChange={e => setOutputFormat(e.target.value as typeof outputFormat)} className="h-7 text-xs bg-white/5 border border-white/10 text-white rounded px-2 flex-1 uppercase">
              {formats.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Input */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Input ({inputFormat.toUpperCase()})</label>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={8} className="w-full text-xs bg-white/5 border border-white/10 text-white rounded p-2 font-mono resize-none" />
          </div>

          <Button size="sm" className="w-full text-xs bg-orange-600 hover:bg-orange-500" onClick={convert}>Convert</Button>

          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded p-2">{error}</p>}

          {/* Output */}
          {output && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-white/50">Output ({outputFormat.toUpperCase()})</label>
                <button onClick={copyOutput} className="text-[10px] text-white/30 hover:text-white/60">{copied ? '✓ Copied' : 'Copy'}</button>
              </div>
              <pre className="text-[10px] text-white/70 bg-black/30 rounded p-2 font-mono whitespace-pre-wrap max-h-60 overflow-auto">{output}</pre>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10" onClick={copyOutput} disabled={!output}>Copy</Button>
        <Button size="sm" className="flex-1 text-xs bg-orange-600 hover:bg-orange-500" onClick={() => output && onInsertCode(output)} disabled={!output}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}
