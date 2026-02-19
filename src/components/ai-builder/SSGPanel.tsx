import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FileCode, Plus, Trash2, Play, Code, Check, X } from 'lucide-react';
import type { SSGPage, SSGConfig } from '@/hooks/useStaticSiteGenerator';

interface SSGPanelProps {
  pages: SSGPage[];
  config: SSGConfig;
  setConfig: (c: SSGConfig) => void;
  isGenerating: boolean;
  addPage: (route: string, title: string, template?: SSGPage['template']) => void;
  updatePage: (id: string, update: Partial<SSGPage>) => void;
  removePage: (id: string) => void;
  generateAll: () => void;
  generateSitemap: () => string;
  generateBuildScript: () => string;
  getStats: () => { totalPages: number; generatedPages: number; totalSizeKB: number; avgSizeKB: number };
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function SSGPanel({
  pages, config, setConfig, isGenerating,
  addPage, updatePage, removePage, generateAll,
  generateSitemap, generateBuildScript, getStats, onInsertCode, onClose,
}: SSGPanelProps) {
  const stats = getStats();

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Static Site Generator</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-3 border-b border-border">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><p className="text-lg font-bold">{stats.totalPages}</p><p className="text-[10px] text-muted-foreground">Pages</p></div>
          <div><p className="text-lg font-bold">{stats.generatedPages}</p><p className="text-[10px] text-muted-foreground">Built</p></div>
          <div><p className="text-lg font-bold">{stats.totalSizeKB}</p><p className="text-[10px] text-muted-foreground">KB Total</p></div>
          <div><p className="text-lg font-bold">{stats.avgSizeKB}</p><p className="text-[10px] text-muted-foreground">KB Avg</p></div>
        </div>
      </div>

      <div className="p-3 border-b border-border space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Base URL</Label><Input value={config.baseUrl} onChange={e => setConfig({ ...config, baseUrl: e.target.value })} className="h-7 text-xs" /></div>
          <div><Label className="text-xs">Output Dir</Label><Input value={config.outputDir} onChange={e => setConfig({ ...config, outputDir: e.target.value })} className="h-7 text-xs" /></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-1 text-xs"><Switch checked={config.generateSitemap} onCheckedChange={v => setConfig({ ...config, generateSitemap: v })} />Sitemap</label>
          <label className="flex items-center gap-1 text-xs"><Switch checked={config.minifyHTML} onCheckedChange={v => setConfig({ ...config, minifyHTML: v })} />Minify</label>
          <label className="flex items-center gap-1 text-xs"><Switch checked={config.prefetchLinks} onCheckedChange={v => setConfig({ ...config, prefetchLinks: v })} />Prefetch</label>
        </div>
      </div>

      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Pages</Label>
          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => addPage('/' + (pages.length > 0 ? 'page-' + (pages.length + 1) : ''), 'New Page')}>
            <Plus className="w-3 h-3 mr-1" /> Add Page
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {pages.map(p => (
          <div key={p.id} className="border border-border rounded-lg p-2 mb-2 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {p.isGenerated ? <Check className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground" />}
                <span className="text-sm font-medium">{p.title}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePage(p.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
            <div className="flex gap-2">
              <Input value={p.route} onChange={e => updatePage(p.id, { route: e.target.value })} className="h-6 text-xs flex-1 font-mono" />
              <Select value={p.template} onValueChange={v => updatePage(p.id, { template: v as SSGPage['template'] })}>
                <SelectTrigger className="h-6 text-[10px] w-20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="page">Page</SelectItem><SelectItem value="blog">Blog</SelectItem><SelectItem value="landing">Landing</SelectItem><SelectItem value="docs">Docs</SelectItem></SelectContent>
              </Select>
            </div>
            {p.isGenerated && <p className="text-[10px] text-muted-foreground">{p.fileSizeKB} KB · {p.generatedAt?.toLocaleTimeString()}</p>}
          </div>
        ))}
      </ScrollArea>

      <div className="p-3 border-t border-border space-y-2">
        <Button size="sm" className="w-full text-xs" onClick={generateAll} disabled={isGenerating || pages.length === 0}>
          <Play className="w-3 h-3 mr-1" /> {isGenerating ? 'Generating...' : 'Generate All'}
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onInsertCode(generateSitemap())}>Sitemap</Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onInsertCode(generateBuildScript())}>
            <Code className="w-3 h-3 mr-1" /> Build Script
          </Button>
        </div>
      </div>
    </div>
  );
}
