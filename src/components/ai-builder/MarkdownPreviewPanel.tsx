import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Copy, Eye, EyeOff, FileText } from 'lucide-react';
import type { useMarkdownPreview } from '@/hooks/useMarkdownPreview';

type HookReturn = ReturnType<typeof useMarkdownPreview>;

interface Props extends HookReturn {
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function MarkdownPreviewPanel({ markdown, setMarkdown, showPreview, setShowPreview, toHtml, generateCode, onInsertCode, onClose }: Props) {
  const [preview, setPreview] = useState('');

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Markdown Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowPreview(!showPreview)} className="h-7 w-7 text-white/40 hover:text-white">
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white/40 hover:text-white"><X className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col border-r border-white/[0.06]`}>
          <div className="p-1.5 border-b border-white/[0.06]">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Editor</span>
          </div>
          <textarea
            value={markdown}
            onChange={e => setMarkdown(e.target.value)}
            className="flex-1 w-full text-xs bg-transparent text-white/80 p-3 font-mono resize-none outline-none"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 flex flex-col">
            <div className="p-1.5 border-b border-white/[0.06]">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Preview</span>
            </div>
            <ScrollArea className="flex-1">
              <div
                className="p-3 prose prose-invert prose-xs max-w-none text-xs
                  [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h1]:border-b [&_h1]:border-white/10 [&_h1]:pb-1 [&_h1]:mb-2
                  [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-1
                  [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white/90
                  [&_p]:text-white/60 [&_p]:my-1
                  [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_code]:text-emerald-400
                  [&_pre]:bg-black/40 [&_pre]:rounded [&_pre]:p-2 [&_pre]:overflow-x-auto
                  [&_pre_code]:bg-transparent [&_pre_code]:px-0
                  [&_blockquote]:border-l-2 [&_blockquote]:border-blue-400 [&_blockquote]:pl-3 [&_blockquote]:text-white/50
                  [&_table]:text-[10px] [&_th]:bg-white/5 [&_th]:p-1 [&_th]:border [&_th]:border-white/10 [&_td]:p-1 [&_td]:border [&_td]:border-white/10
                  [&_hr]:border-white/10
                  [&_a]:text-blue-400 [&_a]:underline
                  [&_li]:text-white/60 [&_li]:my-0.5
                  [&_strong]:text-white [&_em]:text-white/70 [&_del]:text-white/30"
                dangerouslySetInnerHTML={{ __html: toHtml(markdown) }}
              />
            </ScrollArea>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        {preview ? (
          <pre className="text-[10px] text-white/60 bg-black/30 rounded p-2 overflow-auto max-h-20 font-mono whitespace-pre-wrap flex-1">{preview.slice(0, 500)}...</pre>
        ) : null}
        <Button size="sm" variant="outline" className="text-xs border-white/10" onClick={() => setPreview(generateCode())}>Export HTML</Button>
        <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-500" onClick={() => onInsertCode(generateCode())}><Copy className="h-3 w-3 mr-1" />Insert</Button>
      </div>
    </div>
  );
}
