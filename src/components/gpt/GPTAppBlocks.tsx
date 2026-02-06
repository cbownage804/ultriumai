/**
 * Phase 3: AI App Blocks — Generate UI components via AI,
 * preview live, export embed codes, and persist blocks.
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Blocks, Sparkles, Code, Copy, CheckCircle, Eye, Loader2,
  Monitor, Smartphone, RefreshCw, Trash2, Wand2, Pencil, Save,
  Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AppBlock {
  id: string;
  name: string;
  description: string;
  htmlCode: string;
  createdAt: Date;
  dataSource?: string;
  isSaved?: boolean;
}

const BLOCK_TEMPLATES = [
  { label: 'KPI Dashboard', prompt: 'Create a dashboard with 4 KPI cards showing Total Revenue, Active Users, Conversion Rate, and Support Tickets. Use a clean modern design with icons.' },
  { label: 'Contact Form', prompt: 'Create a contact form with Name, Email, Phone, and Message fields. Include validation styling and a submit button.' },
  { label: 'Pricing Table', prompt: 'Create a 3-tier pricing table with Free, Pro, and Enterprise plans. Show features, pricing, and CTA buttons.' },
  { label: 'FAQ Accordion', prompt: 'Create an FAQ section with 5 common questions about SaaS products. Use an accordion pattern with smooth expand/collapse.' },
  { label: 'Team Grid', prompt: 'Create a team member grid showing 4 people with avatar placeholders, names, titles, and social links.' },
  { label: 'Stats Counter', prompt: 'Create an animated statistics counter section with 4 metrics: clients served, projects completed, team members, years experience.' },
];

interface GPTAppBlocksProps {
  gptId: string;
  gptName: string;
  themeColor: string;
}

export function GPTAppBlocks({ gptId, gptName, themeColor }: GPTAppBlocksProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [iteratePrompt, setIteratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [blocks, setBlocks] = useState<AppBlock[]>([]);
  const [activeBlock, setActiveBlock] = useState<AppBlock | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState('none');
  const [showIterateDialog, setShowIterateDialog] = useState(false);
  const [isIterating, setIsIterating] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);

  const generateBlock = async (inputPrompt?: string) => {
    const effectivePrompt = inputPrompt || prompt;
    if (!effectivePrompt.trim()) {
      toast.error('Describe the component you want');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-block', {
        body: {
          prompt: effectivePrompt,
          gptId,
          themeColor,
          dataSource: dataSource !== 'none' ? dataSource : undefined,
        },
      });
      if (error) throw error;

      const newBlock: AppBlock = {
        id: Date.now().toString(),
        name: effectivePrompt.slice(0, 50) + (effectivePrompt.length > 50 ? '…' : ''),
        description: effectivePrompt,
        htmlCode: data?.html || generateFallbackHTML(effectivePrompt, themeColor),
        createdAt: new Date(),
        dataSource: dataSource !== 'none' ? dataSource : undefined,
      };
      setBlocks(prev => [newBlock, ...prev]);
      setActiveBlock(newBlock);
      setPrompt('');
      toast.success('Block generated!');
    } catch (err) {
      console.error('Block generation error:', err);
      const fallback: AppBlock = {
        id: Date.now().toString(),
        name: effectivePrompt.slice(0, 50),
        description: effectivePrompt,
        htmlCode: generateFallbackHTML(effectivePrompt, themeColor),
        createdAt: new Date(),
      };
      setBlocks(prev => [fallback, ...prev]);
      setActiveBlock(fallback);
      setPrompt('');
      toast.success('Block generated (fallback)');
    } finally {
      setIsGenerating(false);
    }
  };

  const iterateBlock = async () => {
    if (!activeBlock || !iteratePrompt.trim()) return;
    setIsIterating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-block', {
        body: {
          prompt: `Take this existing HTML component and modify it: ${iteratePrompt}\n\nExisting HTML:\n${activeBlock.htmlCode}`,
          gptId,
          themeColor,
        },
      });
      if (error) throw error;

      const updated = { ...activeBlock, htmlCode: data?.html || activeBlock.htmlCode, description: `${activeBlock.description} → ${iteratePrompt}` };
      setActiveBlock(updated);
      setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
      setIteratePrompt('');
      setShowIterateDialog(false);
      toast.success('Block updated!');
    } catch {
      toast.error('Failed to iterate');
    } finally {
      setIsIterating(false);
    }
  };

  const renameBlock = () => {
    if (!activeBlock || !renameValue.trim()) return;
    const updated = { ...activeBlock, name: renameValue };
    setActiveBlock(updated);
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
    setShowRenameDialog(false);
    toast.success('Block renamed');
  };

  const downloadBlock = () => {
    if (!activeBlock) return;
    const blob = new Blob([activeBlock.htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBlock.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML downloaded');
  };

  const getEmbedCode = (block: AppBlock) =>
    `<iframe\n  srcdoc="${block.htmlCode.replace(/"/g, '&quot;')}"\n  width="100%"\n  height="400"\n  frameborder="0"\n  style="border-radius: 12px; border: 1px solid #e2e8f0;"\n></iframe>`;

  const getScriptEmbed = (block: AppBlock) =>
    `<div id="ultrium-block-${block.id}"></div>\n<script>\n  (function() {\n    var c = document.getElementById('ultrium-block-${block.id}');\n    var f = document.createElement('iframe');\n    f.srcdoc = ${JSON.stringify(block.htmlCode)};\n    f.style.cssText = 'width:100%;height:400px;border:none;border-radius:12px';\n    c.appendChild(f);\n  })();\n</script>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${type} copied`);
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (activeBlock?.id === blockId) setActiveBlock(null);
    toast.success('Block deleted');
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Blocks className="h-5 w-5" />
            AI App Block Generator
          </CardTitle>
          <CardDescription>
            Describe a UI component and AI will generate a live preview with embed codes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Describe your component</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A dashboard showing ticket stats by priority with a pie chart and summary cards…"
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="w-48">
              <Label className="text-xs">Data Source</Label>
              <Select value={dataSource} onValueChange={setDataSource}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="tickets">Tickets</SelectItem>
                  <SelectItem value="vanguard_agents">Devices</SelectItem>
                  <SelectItem value="atlas_documents">Documents</SelectItem>
                  <SelectItem value="atlas_contacts">Contacts</SelectItem>
                  <SelectItem value="assets">Assets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => generateBlock()} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Block
            </Button>
          </div>
          {/* Templates */}
          <div>
            <Label className="text-xs text-muted-foreground">Quick templates</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {BLOCK_TEMPLATES.map((tpl) => (
                <Button
                  key={tpl.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => { setPrompt(tpl.prompt); generateBlock(tpl.prompt); }}
                  disabled={isGenerating}
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  {tpl.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocks List + Preview */}
      {blocks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Blocks ({blocks.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px]">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => setActiveBlock(block)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 cursor-pointer border-b transition-colors',
                      activeBlock?.id === block.id ? 'bg-accent' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{block.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {block.createdAt.toLocaleTimeString()}
                        {block.dataSource && <Badge variant="secondary" className="ml-2 text-[10px]">{block.dataSource}</Badge>}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Preview + Embed */}
          <Card className="lg:col-span-2">
            {activeBlock ? (
              <Tabs defaultValue="preview">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <CardTitle className="text-sm truncate">{activeBlock.name}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setRenameValue(activeBlock.name); setShowRenameDialog(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                    <TabsList className="h-8">
                      <TabsTrigger value="preview" className="text-xs px-2 h-6"><Eye className="h-3 w-3 mr-1" />Preview</TabsTrigger>
                      <TabsTrigger value="code" className="text-xs px-2 h-6"><Code className="h-3 w-3 mr-1" />Code</TabsTrigger>
                      <TabsTrigger value="embed" className="text-xs px-2 h-6"><Monitor className="h-3 w-3 mr-1" />Embed</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent>
                  <TabsContent value="preview" className="mt-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Button variant={previewDevice === 'desktop' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewDevice('desktop')}>
                        <Monitor className="h-3.5 w-3.5 mr-1" />Desktop
                      </Button>
                      <Button variant={previewDevice === 'mobile' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewDevice('mobile')}>
                        <Smartphone className="h-3.5 w-3.5 mr-1" />Mobile
                      </Button>
                      <div className="flex-1" />
                      <Button variant="outline" size="sm" onClick={() => setShowIterateDialog(true)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />Iterate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => generateBlock(activeBlock.description)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />Regen
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadBlock}>
                        <Download className="h-3.5 w-3.5 mr-1" />HTML
                      </Button>
                    </div>
                    <div className={cn(
                      'border rounded-lg overflow-hidden bg-white mx-auto transition-all',
                      previewDevice === 'mobile' ? 'max-w-[375px]' : 'w-full'
                    )}>
                      <iframe
                        srcDoc={activeBlock.htmlCode}
                        className="w-full border-0"
                        style={{ height: '420px' }}
                        sandbox="allow-scripts"
                        title="Block Preview"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="mt-0">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[420px] overflow-y-auto">
                        <code>{activeBlock.htmlCode}</code>
                      </pre>
                      <Button variant="secondary" size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(activeBlock.htmlCode, 'HTML')}>
                        {copied === 'HTML' ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="embed" className="mt-0 space-y-4">
                    <EmbedSection label="iFrame Embed" code={getEmbedCode(activeBlock)} type="iFrame" copied={copied} onCopy={copyToClipboard} />
                    <EmbedSection label="Script Embed" code={getScriptEmbed(activeBlock)} type="Script" copied={copied} onCopy={copyToClipboard} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            ) : (
              <CardContent className="flex items-center justify-center h-[420px] text-muted-foreground">
                Select a block to preview
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Iterate Dialog */}
      <Dialog open={showIterateDialog} onOpenChange={setShowIterateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iterate on Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>What would you like to change?</Label>
            <Textarea
              value={iteratePrompt}
              onChange={(e) => setIteratePrompt(e.target.value)}
              placeholder="e.g. Make the cards horizontal, add a dark theme, increase font sizes…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIterateDialog(false)}>Cancel</Button>
            <Button onClick={iterateBlock} disabled={isIterating} className="gap-2">
              {isIterating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Block</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
            <Button onClick={renameBlock}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────
function EmbedSection({ label, code, type, copied, onCopy }: { label: string; code: string; type: string; copied: string | null; onCopy: (t: string, ty: string) => void }) {
  return (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative mt-1">
        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto"><code>{code}</code></pre>
        <Button variant="secondary" size="sm" className="absolute top-1 right-1" onClick={() => onCopy(code, type)}>
          {copied === type ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function generateFallbackHTML(prompt: string, themeColor: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #f8fafc; color: #1e293b; }
  .container { max-width: 800px; margin: 0 auto; }
  .header { margin-bottom: 24px; }
  .header h1 { font-size: 24px; font-weight: 700; color: ${themeColor}; }
  .header p { font-size: 14px; color: #64748b; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
  .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
  .card h3 { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .card .value { font-size: 28px; font-weight: 700; margin-top: 8px; color: ${themeColor}; }
  .card .change { font-size: 12px; color: #10b981; margin-top: 4px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Generated Block</h1>
    <p>${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  </div>
  <div class="grid">
    <div class="card"><h3>Metric 1</h3><div class="value">1,234</div><div class="change">↑ 12%</div></div>
    <div class="card"><h3>Metric 2</h3><div class="value">567</div><div class="change">↑ 8%</div></div>
    <div class="card"><h3>Metric 3</h3><div class="value">89%</div><div class="change">↑ 3%</div></div>
    <div class="card"><h3>Metric 4</h3><div class="value">42</div><div class="change">↓ 5%</div></div>
  </div>
</div>
</body>
</html>`;
}
