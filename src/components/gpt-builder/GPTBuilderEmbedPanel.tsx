import { useState } from 'react';
import { GPTConfig } from '@/types/gptConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Code2, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface GPTBuilderEmbedPanelProps {
  config: GPTConfig;
  onChange: (updates: Partial<GPTConfig>) => void;
  onClose: () => void;
  gptId?: string;
}

export function GPTBuilderEmbedPanel({ config, onChange, onClose, gptId }: GPTBuilderEmbedPanelProps) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- ${config.name || 'GPT'} Chat Widget -->
<script>
  (function() {
    var w = document.createElement('div');
    w.id = 'gpt-widget-${gptId || 'preview'}';
    w.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;';
    document.body.appendChild(w);
    var s = document.createElement('script');
    s.src = '${window.location.origin}/embed/gpt/${gptId || 'preview'}.js';
    s.async = true;
    document.body.appendChild(s);
  })();
</script>`;

  const iframeCode = `<iframe
  src="${window.location.origin}/gpt/chat/${gptId || 'preview'}"
  width="400"
  height="600"
  style="border:none;border-radius:16px;"
  allow="microphone"
></iframe>`;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
          <Code2 className="h-3.5 w-3.5" /> Embed & Share
        </span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {!gptId && (
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <p className="text-[11px] text-amber-400/70">
                Save your GPT first to get a working embed code. The preview below shows what it will look like.
              </p>
            </div>
          )}

          {/* Widget Style */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Widget Style</h4>
            <Select value={config.embed_style} onValueChange={(v: any) => onChange({ embed_style: v })}>
              <SelectTrigger className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bubble">Chat Bubble (floating)</SelectItem>
                <SelectItem value="inline">Inline (embedded)</SelectItem>
                <SelectItem value="fullpage">Full Page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bubble Widget Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Chat Bubble Code</h4>
              <button
                onClick={() => copyCode(embedCode)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[10px] text-white/40 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {embedCode}
            </pre>
          </div>

          {/* iFrame Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">iFrame Embed</h4>
              <button
                onClick={() => copyCode(iframeCode)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[10px] text-white/40 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {iframeCode}
            </pre>
          </div>

          {/* Direct Link */}
          <div className="space-y-2">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Direct Link</h4>
            <div className="flex items-center gap-2">
              <Input
                value={`${window.location.origin}/gpt/chat/${gptId || 'preview'}`}
                readOnly
                className="h-8 text-[10px] bg-white/[0.04] border-white/[0.08] text-white/50 font-mono"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-white/40 hover:text-white"
                onClick={() => copyCode(`${window.location.origin}/gpt/chat/${gptId || 'preview'}`)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Allowed Domains */}
          <div className="space-y-2">
            <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Allowed Domains</h4>
            <p className="text-[10px] text-white/20">
              Leave empty to allow embedding anywhere, or specify domains for security.
            </p>
            <Input
              value={config.embed_allowed_domains.join(', ')}
              onChange={(e) => onChange({
                embed_allowed_domains: e.target.value.split(',').map(d => d.trim()).filter(Boolean),
              })}
              placeholder="example.com, mysite.com"
              className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
