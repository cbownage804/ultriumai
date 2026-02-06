/**
 * Phase 3: AI App Blocks — Describe a UI component in natural language,
 * see a live preview, and get an embeddable iframe/script code.
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Blocks, Sparkles, Code, Copy, CheckCircle, Eye, Loader2,
  Monitor, Smartphone, RefreshCw, Download, Wand2, Trash2, Plus
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
}

const BLOCK_TEMPLATES = [
  { label: 'KPI Dashboard', prompt: 'Create a dashboard with 4 KPI cards showing Total Revenue, Active Users, Conversion Rate, and Support Tickets. Use a clean modern design with icons.' },
  { label: 'Contact Form', prompt: 'Create a contact form with Name, Email, Phone, and Message fields. Include validation and a submit button with a success state.' },
  { label: 'Pricing Table', prompt: 'Create a 3-tier pricing table with Free, Pro, and Enterprise plans. Show features, pricing, and CTA buttons.' },
  { label: 'FAQ Accordion', prompt: 'Create an FAQ section with 5 common questions about SaaS products. Use an accordion pattern with smooth expand/collapse.' },
  { label: 'Team Grid', prompt: 'Create a team member grid showing 4 people with photos (placeholder), names, titles, and social links.' },
  { label: 'Stats Counter', prompt: 'Create an animated statistics counter section with 4 metrics: clients served, projects completed, team members, and years experience.' },
];

interface GPTAppBlocksProps {
  gptId: string;
  gptName: string;
  themeColor: string;
}

export function GPTAppBlocks({ gptId, gptName, themeColor }: GPTAppBlocksProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [blocks, setBlocks] = useState<AppBlock[]>([]);
  const [activeBlock, setActiveBlock] = useState<AppBlock | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState('none');

  const generateBlock = async (inputPrompt?: string) => {
    const effectivePrompt = inputPrompt || prompt;
    if (!effectivePrompt.trim()) {
      toast.error('Please describe the component you want to create');
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
        name: effectivePrompt.slice(0, 40) + (effectivePrompt.length > 40 ? '...' : ''),
        description: effectivePrompt,
        htmlCode: data?.html || generateFallbackHTML(effectivePrompt, themeColor),
        createdAt: new Date(),
        dataSource: dataSource !== 'none' ? dataSource : undefined,
      };

      setBlocks(prev => [newBlock, ...prev]);
      setActiveBlock(newBlock);
      setPrompt('');
      toast.success('App block generated!');
    } catch (err) {
      console.error('Block generation error:', err);
      // Fallback to local generation
      const fallback: AppBlock = {
        id: Date.now().toString(),
        name: effectivePrompt.slice(0, 40) + (effectivePrompt.length > 40 ? '...' : ''),
        description: effectivePrompt,
        htmlCode: generateFallbackHTML(effectivePrompt, themeColor),
        createdAt: new Date(),
      };
      setBlocks(prev => [fallback, ...prev]);
      setActiveBlock(fallback);
      setPrompt('');
      toast.success('App block generated (local)');
    } finally {
      setIsGenerating(false);
    }
  };

  const getEmbedCode = (block: AppBlock) => {
    const encoded = btoa(unescape(encodeURIComponent(block.htmlCode)));
    return `<iframe
  srcdoc="${block.htmlCode.replace(/"/g, '&quot;')}"
  width="100%"
  height="400"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid #e2e8f0;"
></iframe>`;
  };

  const getScriptEmbed = (block: AppBlock) => {
    return `<div id="ultrium-block-${block.id}"></div>
<script>
  (function() {
    var container = document.getElementById('ultrium-block-${block.id}');
    var iframe = document.createElement('iframe');
    iframe.srcdoc = ${JSON.stringify(block.htmlCode)};
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    container.appendChild(iframe);
  })();
</script>`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${type} copied to clipboard`);
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
            Describe a UI component in plain text and AI will generate it. Get live previews and embed codes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label>Describe your component</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Create a dashboard showing ticket stats by priority with a pie chart and summary cards..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="w-48">
              <Label className="text-xs">Data Source (optional)</Label>
              <Select value={dataSource} onValueChange={setDataSource}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No data source</SelectItem>
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

          {/* Quick Templates */}
          <div>
            <Label className="text-xs text-muted-foreground">Quick templates</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {BLOCK_TEMPLATES.map((tpl) => (
                <Button
                  key={tpl.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setPrompt(tpl.prompt);
                    generateBlock(tpl.prompt);
                  }}
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
          {/* Block List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Generated Blocks ({blocks.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
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
                        {block.dataSource && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">{block.dataSource}</Badge>
                        )}
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
                    <CardTitle className="text-sm">{activeBlock.name}</CardTitle>
                    <TabsList className="h-8">
                      <TabsTrigger value="preview" className="text-xs px-2 h-6">
                        <Eye className="h-3 w-3 mr-1" />Preview
                      </TabsTrigger>
                      <TabsTrigger value="code" className="text-xs px-2 h-6">
                        <Code className="h-3 w-3 mr-1" />Code
                      </TabsTrigger>
                      <TabsTrigger value="embed" className="text-xs px-2 h-6">
                        <Monitor className="h-3 w-3 mr-1" />Embed
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent>
                  <TabsContent value="preview" className="mt-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor className="h-3.5 w-3.5 mr-1" />Desktop
                      </Button>
                      <Button
                        variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone className="h-3.5 w-3.5 mr-1" />Mobile
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => generateBlock(activeBlock.description)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />Regenerate
                      </Button>
                    </div>
                    <div className={cn(
                      'border rounded-lg overflow-hidden bg-white mx-auto transition-all',
                      previewDevice === 'mobile' ? 'max-w-[375px]' : 'w-full'
                    )}>
                      <iframe
                        srcDoc={activeBlock.htmlCode}
                        className="w-full border-0"
                        style={{ height: '400px' }}
                        sandbox="allow-scripts"
                        title="Block Preview"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="mt-0">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[400px] overflow-y-auto">
                        <code>{activeBlock.htmlCode}</code>
                      </pre>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(activeBlock.htmlCode, 'HTML')}
                      >
                        {copied === 'HTML' ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="embed" className="mt-0 space-y-4">
                    <div>
                      <Label className="text-xs font-medium">iFrame Embed</Label>
                      <div className="relative mt-1">
                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                          <code>{getEmbedCode(activeBlock)}</code>
                        </pre>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => copyToClipboard(getEmbedCode(activeBlock), 'iFrame')}
                        >
                          {copied === 'iFrame' ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Script Embed</Label>
                      <div className="relative mt-1">
                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                          <code>{getScriptEmbed(activeBlock)}</code>
                        </pre>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => copyToClipboard(getScriptEmbed(activeBlock), 'Script')}
                        >
                          {copied === 'Script' ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            ) : (
              <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
                Select a block to preview
              </CardContent>
            )}
          </Card>
        </div>
      )}
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
