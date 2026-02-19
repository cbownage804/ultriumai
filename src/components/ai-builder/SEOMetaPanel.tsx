import { useSEOMetaGenerator } from '@/hooks/useSEOMetaGenerator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { X, Globe, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = ReturnType<typeof useSEOMetaGenerator> & { onInsertCode: (code: string) => void; onClose: () => void };

export function SEOMetaPanel({ pages, siteUrl, defaultOgImage, setSiteUrl, setDefaultOgImage, addPage, updatePage, removePage, generateHelmetComponent, generateSitemapCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /><span className="text-sm font-medium text-white">SEO Meta Generator</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1"><Label className="text-white/70 text-xs">Site URL</Label><Input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm" /></div>
        <div className="space-y-1"><Label className="text-white/70 text-xs">Default OG Image</Label><Input value={defaultOgImage} onChange={e => setDefaultOgImage(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm" /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-white/70 text-xs uppercase tracking-wider">Pages ({pages.length})</Label><Button size="sm" variant="ghost" className="h-6 text-xs text-cyan-400" onClick={addPage}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
          {pages.map(p => (
            <div key={p.id} className="p-2 bg-white/5 rounded space-y-1">
              <div className="flex items-center gap-2">
                <Input value={p.route} onChange={e => updatePage(p.id, { route: e.target.value })} placeholder="/route" className="bg-white/5 border-white/10 text-white text-xs flex-1" />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removePage(p.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Input value={p.title} onChange={e => updatePage(p.id, { title: e.target.value })} placeholder="Page Title" className="bg-white/5 border-white/10 text-white text-xs" />
              <Input value={p.description} onChange={e => updatePage(p.id, { description: e.target.value })} placeholder="Meta description" className="bg-white/5 border-white/10 text-white text-xs" />
              <div className="flex items-center justify-between"><span className="text-white/40 text-xs">noindex</span><Switch checked={p.noIndex} onCheckedChange={v => updatePage(p.id, { noIndex: v })} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateHelmetComponent()); toast.success('SEOHead inserted'); }}>Insert SEOHead</Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateHelmetComponent()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
        </div>
        <Button size="sm" variant="secondary" className="w-full text-xs" onClick={() => { onInsertCode(generateSitemapCode()); toast.success('Sitemap inserted'); }}>Insert Sitemap Generator</Button>
      </div>
    </div>
  );
}
