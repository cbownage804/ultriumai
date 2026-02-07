import { useState, useEffect, useCallback } from 'react';
import { X, Globe, Search, Image, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface SEOEditorProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onUpdateFile: (path: string, content: string) => void;
}

interface SEOData {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  robots: string;
}

function extractSEO(html: string): SEOData {
  const get = (regex: RegExp) => regex.exec(html)?.[1] || '';
  return {
    title: /<title>(.*?)<\/title>/i.exec(html)?.[1] || '',
    description: get(/meta\s+name=["']description["']\s+content=["'](.*?)["']/i),
    ogTitle: get(/meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i),
    ogDescription: get(/meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i),
    ogImage: get(/meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i),
    canonical: get(/link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i),
    robots: get(/meta\s+name=["']robots["']\s+content=["'](.*?)["']/i) || 'index, follow',
  };
}

function applySEO(html: string, seo: SEOData): string {
  let result = html;

  // Title
  if (/<title>/i.test(result)) {
    result = result.replace(/<title>.*?<\/title>/i, `<title>${seo.title}</title>`);
  } else {
    result = result.replace('</head>', `  <title>${seo.title}</title>\n</head>`);
  }

  const setMeta = (attr: string, name: string, value: string) => {
    const regex = new RegExp(`<meta\\s+${attr}=["']${name}["']\\s+content=["'].*?["']\\s*/?>`, 'i');
    const tag = `<meta ${attr}="${name}" content="${value}" />`;
    if (regex.test(result)) {
      result = result.replace(regex, tag);
    } else if (value) {
      result = result.replace('</head>', `  ${tag}\n</head>`);
    }
  };

  setMeta('name', 'description', seo.description);
  setMeta('property', 'og:title', seo.ogTitle);
  setMeta('property', 'og:description', seo.ogDescription);
  setMeta('property', 'og:image', seo.ogImage);
  setMeta('name', 'robots', seo.robots);

  // Canonical
  if (seo.canonical) {
    const canonicalRegex = /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i;
    const canonicalTag = `<link rel="canonical" href="${seo.canonical}" />`;
    if (canonicalRegex.test(result)) {
      result = result.replace(canonicalRegex, canonicalTag);
    } else {
      result = result.replace('</head>', `  ${canonicalTag}\n</head>`);
    }
  }

  return result;
}

export function SEOEditor({ isOpen, onClose, files, onUpdateFile }: SEOEditorProps) {
  const [seo, setSeo] = useState<SEOData>({ title: '', description: '', ogTitle: '', ogDescription: '', ogImage: '', canonical: '', robots: 'index, follow' });
  const [targetFile, setTargetFile] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const htmlFile = files.find(f => f.path === 'index.html') || files.find(f => f.path.endsWith('.html'));
    if (htmlFile) {
      setTargetFile(htmlFile.path);
      setSeo(extractSEO(htmlFile.content));
    }
  }, [isOpen, files]);

  const handleSave = useCallback(() => {
    if (!targetFile) return;
    const file = files.find(f => f.path === targetFile);
    if (!file) return;
    const updated = applySEO(file.content, seo);
    onUpdateFile(targetFile, updated);
    toast.success('SEO tags updated');
    onClose();
  }, [targetFile, files, seo, onUpdateFile, onClose]);

  if (!isOpen) return null;

  const titleLen = seo.title.length;
  const descLen = seo.description.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0d0d18] border border-white/[0.08] rounded-2xl shadow-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-white/[0.06]">
              <Search className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">SEO & Meta Tags</h2>
              <p className="text-[10px] text-white/30">Optimize for search engines</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Google preview */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
            <div className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-2">Search Preview</div>
            <div className="text-sm text-blue-400 hover:underline cursor-pointer truncate">{seo.title || 'Page Title'}</div>
            <div className="text-[11px] text-emerald-400/70 font-mono truncate">example.com</div>
            <div className="text-[11px] text-white/40 line-clamp-2">{seo.description || 'Add a meta description...'}</div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[11px] text-white/50 flex items-center gap-1"><FileText className="h-3 w-3" />Title</label>
                <span className={`text-[9px] ${titleLen > 60 ? 'text-red-400' : 'text-white/20'}`}>{titleLen}/60</span>
              </div>
              <input
                value={seo.title}
                onChange={(e) => setSeo(s => ({ ...s, title: e.target.value }))}
                placeholder="Page title..."
                className="w-full h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-emerald-500/30"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[11px] text-white/50">Description</label>
                <span className={`text-[9px] ${descLen > 160 ? 'text-red-400' : 'text-white/20'}`}>{descLen}/160</span>
              </div>
              <textarea
                value={seo.description}
                onChange={(e) => setSeo(s => ({ ...s, description: e.target.value }))}
                placeholder="Meta description..."
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-emerald-500/30 resize-none"
              />
            </div>

            <div className="border-t border-white/[0.04] pt-3 space-y-3">
              <div className="text-[10px] text-white/20 uppercase tracking-wider font-medium flex items-center gap-1">
                <Globe className="h-3 w-3" />Open Graph
              </div>
              <input
                value={seo.ogTitle}
                onChange={(e) => setSeo(s => ({ ...s, ogTitle: e.target.value }))}
                placeholder="OG Title (defaults to title)"
                className="w-full h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-emerald-500/30"
              />
              <input
                value={seo.ogDescription}
                onChange={(e) => setSeo(s => ({ ...s, ogDescription: e.target.value }))}
                placeholder="OG Description"
                className="w-full h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-emerald-500/30"
              />
              <div className="space-y-1">
                <label className="text-[11px] text-white/50 flex items-center gap-1"><Image className="h-3 w-3" />OG Image URL</label>
                <input
                  value={seo.ogImage}
                  onChange={(e) => setSeo(s => ({ ...s, ogImage: e.target.value }))}
                  placeholder="https://..."
                  className="w-full h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-emerald-500/30"
                />
              </div>
            </div>

            <div className="border-t border-white/[0.04] pt-3 space-y-3">
              <input
                value={seo.canonical}
                onChange={(e) => setSeo(s => ({ ...s, canonical: e.target.value }))}
                placeholder="Canonical URL (optional)"
                className="w-full h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-emerald-500/30"
              />
              <select
                value={seo.robots}
                onChange={(e) => setSeo(s => ({ ...s, robots: e.target.value }))}
                className="w-full h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none"
              >
                <option value="index, follow">index, follow</option>
                <option value="noindex, follow">noindex, follow</option>
                <option value="index, nofollow">index, nofollow</option>
                <option value="noindex, nofollow">noindex, nofollow</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex justify-end gap-2">
          <button onClick={onClose} className="h-8 px-3 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors">Cancel</button>
          <button onClick={handleSave} className="h-8 px-4 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium flex items-center gap-1.5">
            <Save className="h-3 w-3" />Save
          </button>
        </div>
      </div>
    </div>
  );
}
